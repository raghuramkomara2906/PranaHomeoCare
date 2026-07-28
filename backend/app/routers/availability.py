from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import AvailabilitySlot
from app.models.enums import ConsultationType, EffectiveSlotStatus, SlotBaseStatus
from app.schemas.slots import (
    AvailableDateOut,
    AvailableDatesOut,
    PublicSlotListOut,
    PublicSlotOut,
)
from app.services.slots import (
    booking_enabled,
    compute_effective_statuses,
    ist_day_bounds_utc,
    to_ist,
    today_ist,
    utcnow,
)

router = APIRouter(prefix="/availability", tags=["availability"])

_VALID_TYPES = {t.value for t in ConsultationType}


def _future_available_slots(db: Session, start_utc, end_utc) -> list[AvailabilitySlot]:
    """Base-available, non-deleted, strictly-future slots in a UTC window whose
    effective status is still 'available' (i.e. not held or booked)."""
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


@router.get("/dates", response_model=AvailableDatesOut)
def available_dates(
    from_date: date | None = Query(default=None, alias="fromDate"),
    to_date: date | None = Query(default=None, alias="toDate"),
    db: Session = Depends(get_db),
) -> AvailableDatesOut:
    """IST calendar dates (in the window) that have at least one bookable slot —
    powers the booking date picker."""
    if not booking_enabled(db):
        return AvailableDatesOut(timezone=settings.default_timezone, dates=[])

    if from_date is None:
        from_date = today_ist()
    if to_date is None:
        to_date = from_date + timedelta(days=30)
    start_utc, _ = ist_day_bounds_utc(from_date)
    _, end_utc = ist_day_bounds_utc(to_date)

    counts: dict[date, int] = defaultdict(int)
    for slot in _future_available_slots(db, start_utc, end_utc):
        counts[to_ist(slot.start_at).date()] += 1

    dates = [
        AvailableDateOut(date=d.isoformat(), available_count=counts[d])
        for d in sorted(counts)
    ]
    return AvailableDatesOut(timezone=settings.default_timezone, dates=dates)


@router.get("/slots", response_model=PublicSlotListOut)
def available_slots(
    date_: date = Query(alias="date"),
    consultation_type: str | None = Query(default=None, alias="consultationType"),
    db: Session = Depends(get_db),
) -> PublicSlotListOut:
    """Bookable slots for one IST date. Consultation type is accepted for
    forward-compatibility but does not filter — in V1 both types share slots.

    Availability here is advisory: the slot is re-validated at OTP verification,
    so what's shown is never a booking guarantee.
    """
    if consultation_type is not None and consultation_type not in _VALID_TYPES:
        raise HTTPException(status_code=422, detail="Unknown consultation type.")

    if not booking_enabled(db):
        return PublicSlotListOut(
            date=date_.isoformat(), timezone=settings.default_timezone, slots=[]
        )

    start_utc, end_utc = ist_day_bounds_utc(date_)
    slots = _future_available_slots(db, start_utc, end_utc)
    return PublicSlotListOut(
        date=date_.isoformat(),
        timezone=settings.default_timezone,
        slots=[
            PublicSlotOut(id=str(s.id), start_at=to_ist(s.start_at), end_at=to_ist(s.end_at))
            for s in slots
        ],
    )