from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.appointments import (
    AppointmentAccessOut,
    CancelOut,
    RescheduleIn,
    RescheduleOptionsOut,
    RescheduleOut,
)
from app.services.appointments import (
    access_view,
    cancel_appointment,
    reschedule_appointment,
    reschedule_options,
    resolve,
)

router = APIRouter(prefix="/appointments/access", tags=["appointments"])


@router.get("/{token}", response_model=AppointmentAccessOut)
def get_appointment(token: str, db: Session = Depends(get_db)) -> AppointmentAccessOut:
    appointment, _ = resolve(db, token)
    view = access_view(db, appointment)
    db.commit()  # persist last_used_at
    return AppointmentAccessOut(**view)


@router.post("/{token}/cancel", response_model=CancelOut)
def cancel(token: str, db: Session = Depends(get_db)) -> CancelOut:
    appointment = cancel_appointment(db, token)
    return CancelOut(
        booking_reference=appointment.booking_reference,
        status=appointment.status,
        message="Your appointment has been cancelled. A confirmation SMS has been sent.",
    )


@router.get("/{token}/reschedule-options", response_model=RescheduleOptionsOut)
def get_reschedule_options(
    token: str,
    from_date: date | None = Query(default=None, alias="fromDate"),
    to_date: date | None = Query(default=None, alias="toDate"),
    db: Session = Depends(get_db),
) -> RescheduleOptionsOut:
    return RescheduleOptionsOut(**reschedule_options(db, token, from_date, to_date))


@router.post("/{token}/reschedule", response_model=RescheduleOut)
def reschedule(token: str, body: RescheduleIn, db: Session = Depends(get_db)) -> RescheduleOut:
    appointment = reschedule_appointment(db, token, body.new_slot_id)
    view = access_view(db, appointment)
    db.commit()
    return RescheduleOut(
        booking_reference=appointment.booking_reference,
        status=appointment.status,
        message="Your appointment has been rescheduled. A confirmation SMS has been sent.",
        start_at=view["start_at"],
        end_at=view["end_at"],
        meeting_status=view["meeting_status"],
    )