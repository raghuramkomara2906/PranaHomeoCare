"""Slot scheduling helpers.

Slots are stored as UTC instants (TIMESTAMPTZ). Everything the doctor and patient
see is Asia/Kolkata, so all conversion happens here at the edge — never in the
database. The other job of this module is deriving a slot's *effective* status,
which is not stored: it's computed from base_status plus whether an active
appointment or an unexpired booking hold references the slot.
"""

from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Appointment, AvailabilitySlot, BookingRequest, ClinicSettings
from app.models.enums import (
    ACTIVE_BOOKING_REQUEST_STATUSES,
    AppointmentStatus,
    EffectiveSlotStatus,
    SlotBaseStatus,
)

IST = ZoneInfo(settings.default_timezone)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def to_utc(dt: datetime) -> datetime:
    """Normalize an incoming datetime to UTC. A naive value is interpreted as
    clinic-local (Asia/Kolkata), since that's what the doctor is picking."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=IST)
    return dt.astimezone(timezone.utc)


def to_ist(dt: datetime) -> datetime:
    """UTC (or any aware) instant -> Asia/Kolkata, so responses serialize with a
    +05:30 offset and render as IST with no frontend conversion."""
    return dt.astimezone(IST)


def today_ist() -> date:
    return datetime.now(IST).date()


def ist_day_bounds_utc(day: date) -> tuple[datetime, datetime]:
    """The UTC half-open range [00:00, 24:00) of one Asia/Kolkata calendar day."""
    start_ist = datetime.combine(day, time.min, tzinfo=IST)
    end_ist = start_ist + timedelta(days=1)
    return start_ist.astimezone(timezone.utc), end_ist.astimezone(timezone.utc)


def booking_enabled(db: Session) -> bool:
    row = db.query(ClinicSettings).first()
    return row.booking_enabled if row else True


def compute_effective_statuses(
    db: Session, slots: list[AvailabilitySlot]
) -> dict:
    """Batch-derive effective status for many slots in two queries.

    Precedence (per DB doc §4.1): blocked > booked > held > available.
    """
    ids = [s.id for s in slots]
    if not ids:
        return {}

    booked = {
        row[0]
        for row in db.query(Appointment.slot_id)
        .filter(
            Appointment.slot_id.in_(ids),
            Appointment.status == AppointmentStatus.CONFIRMED.value,
        )
        .all()
    }
    held = {
        row[0]
        for row in db.query(BookingRequest.slot_id)
        .filter(
            BookingRequest.slot_id.in_(ids),
            BookingRequest.status.in_(ACTIVE_BOOKING_REQUEST_STATUSES),
            BookingRequest.hold_expires_at > utcnow(),
        )
        .all()
    }

    result: dict = {}
    for s in slots:
        if s.base_status == SlotBaseStatus.BLOCKED.value:
            result[s.id] = EffectiveSlotStatus.BLOCKED.value
        elif s.id in booked:
            result[s.id] = EffectiveSlotStatus.BOOKED.value
        elif s.id in held:
            result[s.id] = EffectiveSlotStatus.HELD.value
        else:
            result[s.id] = EffectiveSlotStatus.AVAILABLE.value
    return result
def future_available_slots(db: Session, start_utc: datetime, end_utc: datetime) -> list[AvailabilitySlot]:
    """Base-available, non-deleted, strictly-future slots in a UTC window whose
    effective status is still 'available' (not held or booked). Shared by public
    availability and the reschedule flow."""
    now = utcnow()
    lower = max(start_utc, now)
    slots = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.deleted_at.is_(None),
            AvailabilitySlot.base_status == SlotBaseStatus.AVAILABLE.value,
            AvailabilitySlot.start_at > lower,
            AvailabilitySlot.start_at < end_utc,
        )
        .order_by(AvailabilitySlot.start_at)
        .all()
    )
    effective = compute_effective_statuses(db, slots)
    return [s for s in slots if effective[s.id] == EffectiveSlotStatus.AVAILABLE.value]