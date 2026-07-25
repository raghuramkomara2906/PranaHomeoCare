import uuid
from datetime import date as date_
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import ACTIVE_APPOINTMENT_STATUSES, Appointment, AppointmentStatus
from app.models.availability import AvailabilityException, WeeklyAvailabilityRule

# Same placeholder practice timezone used by the frontend's original mock
# generator (src/data/availability.ts) — Phoenix has no DST, which keeps this
# fixed-offset math correct year-round without a full IANA tz database.
PRACTITIONER_TIMEZONE = "America/Phoenix"
PRACTITIONER_UTC_OFFSET_HOURS = -7

# The join window opens this many minutes before the scheduled start and
# stays open until the appointment's end time.
JOIN_OPENS_MINUTES_BEFORE = 10
JOINABLE_STATUSES = (AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED)


def compute_join_status(appointment: Appointment) -> dict:
    """The single source of truth for join eligibility — the frontend never
    derives this itself, per the AppointmentJoinStatus contract."""
    now = datetime.now(timezone.utc)
    join_available_at = appointment.start_time_utc - timedelta(minutes=JOIN_OPENS_MINUTES_BEFORE)
    join_closes_at = appointment.end_time_utc

    can_join = (
        appointment.status in JOINABLE_STATUSES
        and join_available_at <= now <= join_closes_at
    )

    return {
        "appointment_id": appointment.id,
        "status": appointment.status,
        "can_join": can_join,
        "join_available_at": join_available_at,
        "join_closes_at": join_closes_at,
        "server_time_utc": now,
    }


def _js_weekday(target_date: date_) -> int:
    """0=Sunday..6=Saturday, matching JS Date.getDay() / the frontend convention."""
    return (target_date.weekday() + 1) % 7


def _open_window_minutes(
    db: Session, practitioner_id: uuid.UUID, target_date: date_
) -> tuple[int, int] | None:
    exception = db.scalar(
        select(AvailabilityException).where(
            AvailabilityException.practitioner_id == practitioner_id,
            AvailabilityException.date == target_date,
        )
    )
    if exception is not None:
        if exception.is_closed:
            return None
        if exception.start_minute is not None and exception.end_minute is not None:
            return exception.start_minute, exception.end_minute

    rule = db.scalar(
        select(WeeklyAvailabilityRule).where(
            WeeklyAvailabilityRule.practitioner_id == practitioner_id,
            WeeklyAvailabilityRule.weekday == _js_weekday(target_date),
            WeeklyAvailabilityRule.is_active.is_(True),
        )
    )
    if rule is None:
        return None
    return rule.start_minute, rule.end_minute


def compute_available_slots(
    db: Session,
    practitioner_id: uuid.UUID,
    duration_minutes: int,
    target_date: date_,
) -> list[dict]:
    window = _open_window_minutes(db, practitioner_id, target_date)
    if window is None:
        return []
    open_minute, close_minute = window

    booked = db.scalars(
        select(Appointment).where(
            Appointment.practitioner_id == practitioner_id,
            Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
            Appointment.start_time_utc
            < datetime.combine(target_date, datetime.max.time(), tzinfo=timezone.utc),
            Appointment.end_time_utc
            > datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc),
        )
    ).all()

    now = datetime.now(timezone.utc)
    midnight_utc = datetime(
        target_date.year, target_date.month, target_date.day, tzinfo=timezone.utc
    )
    slots = []

    local_minute = open_minute
    while local_minute + duration_minutes <= close_minute:
        utc_minute_of_day = local_minute - PRACTITIONER_UTC_OFFSET_HOURS * 60
        start_utc = midnight_utc + timedelta(minutes=utc_minute_of_day)
        end_utc = start_utc + timedelta(minutes=duration_minutes)

        if start_utc > now and not any(
            appt.start_time_utc < end_utc and appt.end_time_utc > start_utc
            for appt in booked
        ):
            slots.append(
                {
                    "start_time_utc": start_utc,
                    "end_time_utc": end_utc,
                    "display_timezone": PRACTITIONER_TIMEZONE,
                }
            )

        local_minute += duration_minutes

    return slots
