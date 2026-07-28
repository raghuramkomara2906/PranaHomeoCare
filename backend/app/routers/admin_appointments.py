from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.database import get_db
from app.models import AdminUser
from app.schemas.admin_appointments import (
    AdminAppointmentDetailOut,
    AdminAppointmentListOut,
    DoctorActionOut,
    DoctorCancelIn,
    DoctorRescheduleIn,
    MeetingPutIn,
    MeetingPutOut,
    StatusPatchIn,
    StatusPatchOut,
)
from app.services.admin_appointments import (
    appointment_detail,
    doctor_cancel,
    doctor_reschedule,
    list_appointments,
    set_meeting_link,
    set_status,
)
from app.services.appointments import access_view

router = APIRouter(prefix="/admin/appointments", tags=["admin-appointments"])


@router.get("", response_model=AdminAppointmentListOut)
def list_(
    from_date: date | None = Query(default=None, alias="fromDate"),
    to_date: date | None = Query(default=None, alias="toDate"),
    consultation_type: str | None = Query(default=None, alias="consultationType"),
    status: str | None = Query(default=None),
    meeting_status: str | None = Query(default=None, alias="meetingStatus"),
    q: str | None = Query(default=None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminAppointmentListOut:
    return AdminAppointmentListOut(
        **list_appointments(
            db, from_date=from_date, to_date=to_date, consultation_type=consultation_type,
            status=status, meeting_status=meeting_status, q=q,
        )
    )


@router.get("/{appointment_id}", response_model=AdminAppointmentDetailOut)
def detail(
    appointment_id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminAppointmentDetailOut:
    return AdminAppointmentDetailOut(**appointment_detail(db, appointment_id))


@router.patch("/{appointment_id}/status", response_model=StatusPatchOut)
def patch_status(
    appointment_id: str,
    body: StatusPatchIn,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> StatusPatchOut:
    appt = set_status(db, appointment_id, body.status, body.note, admin)
    return StatusPatchOut(
        id=str(appt.id), status=appt.status, message=f"Appointment marked {appt.status}."
    )


@router.put("/{appointment_id}/meeting", response_model=MeetingPutOut)
def put_meeting(
    appointment_id: str,
    body: MeetingPutIn,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> MeetingPutOut:
    md, replaced = set_meeting_link(
        db, appointment_id, join_url=body.join_url,
        meeting_identifier=body.meeting_identifier, admin_note=body.admin_note, admin=admin,
    )
    return MeetingPutOut(
        id=appointment_id,
        meeting_status=md.status,
        replaced=replaced,
        message="Zoom link saved. The patient notification has been scheduled.",
    )

@router.post("/{appointment_id}/cancel", response_model=DoctorActionOut)
def cancel(
    appointment_id: str,
    body: DoctorCancelIn,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> DoctorActionOut:
    appt = doctor_cancel(db, appointment_id, body.reason, body.note, admin)
    return DoctorActionOut(id=str(appt.id), status=appt.status, message="Appointment cancelled. The patient has been notified.")


@router.post("/{appointment_id}/reschedule", response_model=DoctorActionOut)
def reschedule(
    appointment_id: str,
    body: DoctorRescheduleIn,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> DoctorActionOut:
    appt = doctor_reschedule(db, appointment_id, body.new_slot_id, admin)
    view = access_view(db, appt)
    db.commit()
    return DoctorActionOut(
        id=str(appt.id), status=appt.status,
        message="Appointment rescheduled. The patient has been notified.",
        start_at=view["start_at"], end_at=view["end_at"], meeting_status=view["meeting_status"],
    )