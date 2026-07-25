import random
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_the_practitioner
from app.core.notifications import notify
from app.core.scheduling import PRACTITIONER_TIMEZONE, compute_join_status
from app.database import get_db
from app.models.appointment import ACTIVE_APPOINTMENT_STATUSES, Appointment, AppointmentStatus
from app.models.notification import NotificationType
from app.models.service import Service
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentJoinStatusOut,
    AppointmentOut,
    AppointmentRescheduleRequest,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _get_own_appointment(db: Session, appointment_id: uuid.UUID, current_user: User) -> Appointment:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None or appointment.patient_email != current_user.email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    return appointment


def _to_appointment_out(appointment: Appointment, service_name: str, practitioner_name: str) -> AppointmentOut:
    return AppointmentOut(
        id=appointment.id,
        public_reference=appointment.public_reference,
        practitioner_id=appointment.practitioner_id,
        service_id=appointment.service_id,
        service_name=service_name,
        practitioner_name=practitioner_name,
        start_time_utc=appointment.start_time_utc,
        end_time_utc=appointment.end_time_utc,
        display_timezone=appointment.display_timezone,
        status=appointment.status,
    )


REFERENCE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no ambiguous chars


def _generate_public_reference(db: Session) -> str:
    for _ in range(10):
        code = "BK-" + "".join(random.choices(REFERENCE_CHARS, k=6))
        exists = db.scalar(select(Appointment).where(Appointment.public_reference == code))
        if exists is None:
            return code
    raise RuntimeError("Could not generate a unique booking reference.")


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreateRequest,
    db: Session = Depends(get_db),
    practitioner: User = Depends(get_the_practitioner),
):
    service = db.get(Service, payload.service_id)
    if service is None or not service.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")

    start_time_utc = payload.start_time_utc
    end_time_utc = start_time_utc + timedelta(minutes=service.duration_minutes)

    overlapping = db.scalar(
        select(Appointment).where(
            Appointment.practitioner_id == practitioner.id,
            Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
            Appointment.start_time_utc < end_time_utc,
            Appointment.end_time_utc > start_time_utc,
        )
    )
    if overlapping is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That time was just booked by someone else — please pick another slot.",
        )

    appointment = Appointment(
        public_reference=_generate_public_reference(db),
        practitioner_id=practitioner.id,
        service_id=service.id,
        patient_full_name=payload.patient.full_name,
        patient_email=payload.patient.email,
        patient_phone=payload.patient.phone,
        patient_notes=payload.patient.notes,
        start_time_utc=start_time_utc,
        end_time_utc=end_time_utc,
        display_timezone=PRACTITIONER_TIMEZONE,
        status=AppointmentStatus.CONFIRMED,
    )
    db.add(appointment)
    notify(
        db,
        appointment.patient_email,
        NotificationType.APPOINTMENT_CONFIRMED,
        f"Your {service.name} is confirmed for "
        f"{start_time_utc.strftime('%b %d, %Y %H:%M UTC')}.",
        appointment_id=appointment.id,
    )
    db.commit()
    db.refresh(appointment)

    return _to_appointment_out(appointment, service.name, practitioner.full_name)


@router.get("/me", response_model=list[AppointmentOut])
def list_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointments = db.scalars(
        select(Appointment)
        .where(Appointment.patient_email == current_user.email)
        .order_by(Appointment.start_time_utc)
    ).all()

    services_by_id = {s.id: s.name for s in db.scalars(select(Service)).all()}
    practitioners_by_id = {u.id: u.full_name for u in db.scalars(select(User)).all()}

    return [
        _to_appointment_out(
            appt,
            services_by_id.get(appt.service_id, appt.service_id),
            practitioners_by_id.get(appt.practitioner_id, "Practitioner"),
        )
        for appt in appointments
    ]


@router.get("/{appointment_id}/join-status", response_model=AppointmentJoinStatusOut)
def get_join_status(
    appointment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = _get_own_appointment(db, appointment_id, current_user)
    return compute_join_status(appointment)


@router.patch("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_my_appointment(
    appointment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = _get_own_appointment(db, appointment_id, current_user)
    if appointment.status not in ACTIVE_APPOINTMENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This appointment can no longer be cancelled.",
        )

    appointment.status = AppointmentStatus.CANCELLED_BY_PATIENT

    service = db.get(Service, appointment.service_id)
    notify(
        db,
        appointment.patient_email,
        NotificationType.APPOINTMENT_CANCELLED,
        f"You cancelled your {service.name if service else 'appointment'}.",
        appointment_id=appointment.id,
    )
    db.commit()
    db.refresh(appointment)

    practitioner = db.get(User, appointment.practitioner_id)
    return _to_appointment_out(
        appointment,
        service.name if service else appointment.service_id,
        practitioner.full_name if practitioner else "Practitioner",
    )


@router.patch("/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_my_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentRescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = _get_own_appointment(db, appointment_id, current_user)
    if appointment.status not in ACTIVE_APPOINTMENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This appointment can no longer be rescheduled.",
        )

    service = db.get(Service, appointment.service_id)
    new_start = payload.start_time_utc
    new_end = new_start + timedelta(minutes=service.duration_minutes)

    overlapping = db.scalar(
        select(Appointment).where(
            Appointment.id != appointment.id,
            Appointment.practitioner_id == appointment.practitioner_id,
            Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
            Appointment.start_time_utc < new_end,
            Appointment.end_time_utc > new_start,
        )
    )
    if overlapping is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That time was just booked by someone else — please pick another slot.",
        )

    appointment.start_time_utc = new_start
    appointment.end_time_utc = new_end
    appointment.status = AppointmentStatus.RESCHEDULED

    notify(
        db,
        appointment.patient_email,
        NotificationType.APPOINTMENT_RESCHEDULED,
        f"Your {service.name} was rescheduled to "
        f"{new_start.strftime('%b %d, %Y %H:%M UTC')}.",
        appointment_id=appointment.id,
    )
    db.commit()
    db.refresh(appointment)

    practitioner = db.get(User, appointment.practitioner_id)
    return _to_appointment_out(
        appointment,
        service.name,
        practitioner.full_name if practitioner else "Practitioner",
    )
