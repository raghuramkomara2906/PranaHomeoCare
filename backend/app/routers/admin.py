import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.core.notifications import notify
from app.database import get_db
from app.models.appointment import ACTIVE_APPOINTMENT_STATUSES, Appointment, AppointmentStatus
from app.models.availability import AvailabilityException, WeeklyAvailabilityRule
from app.models.contact_message import ContactMessage
from app.models.notification import NotificationType
from app.models.service import Service
from app.models.user import User, UserRole
from app.schemas.analytics import AnalyticsSummaryOut, MonthlyCountItem, StatusBreakdownItem
from backend.app.schemas.appointments import AdminAppointmentOut, AppointmentUpdateRequest
from app.schemas.availability import ExceptionIn, ExceptionOut, WeeklyRuleIn, WeeklyRuleOut
from app.schemas.contact import ContactMessageOut
from app.schemas.patient import PatientSummaryOut

router = APIRouter(prefix="/admin", tags=["admin"])
require_practitioner = require_role(UserRole.PRACTITIONER)


def _to_admin_out(appointment: Appointment, service_name: str, practitioner_name: str) -> AdminAppointmentOut:
    return AdminAppointmentOut(
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
        patient_full_name=appointment.patient_full_name,
        patient_email=appointment.patient_email,
        patient_phone=appointment.patient_phone,
        patient_notes=appointment.patient_notes,
    )


# ---- Consultations lined up for the week/month ----------------------------


@router.get("/appointments", response_model=list[AdminAppointmentOut])
def list_appointments(
    start: date,
    end: date,
    db: Session = Depends(get_db),
    practitioner: User = Depends(require_practitioner),
):
    range_start = datetime.combine(start, datetime.min.time())
    range_end = datetime.combine(end, datetime.max.time())

    appointments = db.scalars(
        select(Appointment)
        .where(
            Appointment.practitioner_id == practitioner.id,
            Appointment.start_time_utc >= range_start,
            Appointment.start_time_utc <= range_end,
        )
        .order_by(Appointment.start_time_utc)
    ).all()

    services_by_id = {s.id: s.name for s in db.scalars(select(Service)).all()}
    return [
        _to_admin_out(appt, services_by_id.get(appt.service_id, appt.service_id), practitioner.full_name)
        for appt in appointments
    ]


@router.patch("/appointments/{appointment_id}", response_model=AdminAppointmentOut)
def update_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentUpdateRequest,
    db: Session = Depends(get_db),
    practitioner: User = Depends(require_practitioner),
):
    appointment = db.get(Appointment, appointment_id)
    if appointment is None or appointment.practitioner_id != practitioner.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    service = db.get(Service, appointment.service_id)

    if payload.start_time_utc is not None:
        new_start = payload.start_time_utc
        new_end = new_start + timedelta(minutes=service.duration_minutes)
        overlapping = db.scalar(
            select(Appointment).where(
                Appointment.id != appointment.id,
                Appointment.practitioner_id == practitioner.id,
                Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
                Appointment.start_time_utc < new_end,
                Appointment.end_time_utc > new_start,
            )
        )
        if overlapping is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="That time overlaps another appointment.",
            )
        appointment.start_time_utc = new_start
        appointment.end_time_utc = new_end
        notify(
            db,
            appointment.patient_email,
            NotificationType.APPOINTMENT_RESCHEDULED,
            f"Your {service.name} was rescheduled to "
            f"{new_start.strftime('%b %d, %Y %H:%M UTC')}.",
            appointment_id=appointment.id,
        )

    if payload.status is not None:
        appointment.status = payload.status
        if payload.status == AppointmentStatus.CANCELLED_BY_PRACTITIONER:
            notify(
                db,
                appointment.patient_email,
                NotificationType.APPOINTMENT_CANCELLED,
                f"Your {service.name} on "
                f"{appointment.start_time_utc.strftime('%b %d, %Y %H:%M UTC')} was cancelled by the practitioner.",
                appointment_id=appointment.id,
            )

    db.commit()
    db.refresh(appointment)
    return _to_admin_out(appointment, service.name, practitioner.full_name)


# ---- Meeting timings: weekly hours -----------------------------------------


@router.get("/availability/rules", response_model=list[WeeklyRuleOut])
def list_weekly_rules(
    db: Session = Depends(get_db), practitioner: User = Depends(require_practitioner)
):
    return db.scalars(
        select(WeeklyAvailabilityRule)
        .where(WeeklyAvailabilityRule.practitioner_id == practitioner.id)
        .order_by(WeeklyAvailabilityRule.weekday)
    ).all()


@router.put("/availability/rules", response_model=list[WeeklyRuleOut])
def replace_weekly_rules(
    payload: list[WeeklyRuleIn],
    db: Session = Depends(get_db),
    practitioner: User = Depends(require_practitioner),
):
    existing_by_weekday = {
        rule.weekday: rule
        for rule in db.scalars(
            select(WeeklyAvailabilityRule).where(
                WeeklyAvailabilityRule.practitioner_id == practitioner.id
            )
        ).all()
    }

    for rule_in in payload:
        rule = existing_by_weekday.get(rule_in.weekday)
        if rule is None:
            rule = WeeklyAvailabilityRule(practitioner_id=practitioner.id, weekday=rule_in.weekday)
            db.add(rule)
        rule.start_minute = rule_in.start_minute
        rule.end_minute = rule_in.end_minute
        rule.is_active = rule_in.is_active

    db.commit()

    return db.scalars(
        select(WeeklyAvailabilityRule)
        .where(WeeklyAvailabilityRule.practitioner_id == practitioner.id)
        .order_by(WeeklyAvailabilityRule.weekday)
    ).all()


# ---- Meeting timings: one-off exceptions -----------------------------------


@router.get("/availability/exceptions", response_model=list[ExceptionOut])
def list_exceptions(
    start: date,
    end: date,
    db: Session = Depends(get_db),
    practitioner: User = Depends(require_practitioner),
):
    return db.scalars(
        select(AvailabilityException)
        .where(
            AvailabilityException.practitioner_id == practitioner.id,
            AvailabilityException.date >= start,
            AvailabilityException.date <= end,
        )
        .order_by(AvailabilityException.date)
    ).all()


@router.post(
    "/availability/exceptions",
    response_model=ExceptionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_exception(
    payload: ExceptionIn,
    db: Session = Depends(get_db),
    practitioner: User = Depends(require_practitioner),
):
    existing = db.scalar(
        select(AvailabilityException).where(
            AvailabilityException.practitioner_id == practitioner.id,
            AvailabilityException.date == payload.date,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An exception for that date already exists.",
        )

    exception = AvailabilityException(practitioner_id=practitioner.id, **payload.model_dump())
    db.add(exception)
    db.commit()
    db.refresh(exception)
    return exception


@router.delete("/availability/exceptions/{exception_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exception(
    exception_id: uuid.UUID,
    db: Session = Depends(get_db),
    practitioner: User = Depends(require_practitioner),
):
    exception = db.get(AvailabilityException, exception_id)
    if exception is None or exception.practitioner_id != practitioner.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exception not found.")
    db.delete(exception)
    db.commit()


# ---- Patients (Doctor "patient details" / Admin "user management") --------


@router.get("/patients", response_model=list[PatientSummaryOut])
def list_patients(
    db: Session = Depends(get_db), practitioner: User = Depends(require_practitioner)
):
    rows = db.execute(
        select(
            Appointment.patient_email,
            func.max(Appointment.patient_full_name).label("full_name"),
            func.max(Appointment.patient_phone).label("phone"),
            func.count(Appointment.id).label("appointment_count"),
            func.max(Appointment.start_time_utc).label("last_appointment_at"),
        )
        .where(Appointment.practitioner_id == practitioner.id)
        .group_by(Appointment.patient_email)
        .order_by(func.max(Appointment.start_time_utc).desc())
    ).all()

    return [
        PatientSummaryOut(
            full_name=row.full_name,
            email=row.patient_email,
            phone=row.phone,
            appointment_count=row.appointment_count,
            last_appointment_at=row.last_appointment_at,
        )
        for row in rows
    ]


@router.get("/patients/appointments", response_model=list[AdminAppointmentOut])
def get_patient_appointments(
    email: str,
    db: Session = Depends(get_db),
    practitioner: User = Depends(require_practitioner),
):
    appointments = db.scalars(
        select(Appointment)
        .where(
            Appointment.practitioner_id == practitioner.id,
            Appointment.patient_email == email,
        )
        .order_by(Appointment.start_time_utc.desc())
    ).all()

    services_by_id = {s.id: s.name for s in db.scalars(select(Service)).all()}
    return [
        _to_admin_out(appt, services_by_id.get(appt.service_id, appt.service_id), practitioner.full_name)
        for appt in appointments
    ]


# ---- Analytics --------------------------------------------------------------


@router.get("/analytics/summary", response_model=AnalyticsSummaryOut)
def get_analytics_summary(
    db: Session = Depends(get_db), practitioner: User = Depends(require_practitioner)
):
    total_appointments = (
        db.scalar(
            select(func.count(Appointment.id)).where(
                Appointment.practitioner_id == practitioner.id
            )
        )
        or 0
    )
    total_patients = (
        db.scalar(
            select(func.count(func.distinct(Appointment.patient_email))).where(
                Appointment.practitioner_id == practitioner.id
            )
        )
        or 0
    )

    status_rows = db.execute(
        select(Appointment.status, func.count(Appointment.id))
        .where(Appointment.practitioner_id == practitioner.id)
        .group_by(Appointment.status)
    ).all()
    status_breakdown = [
        StatusBreakdownItem(status=row[0].value, count=row[1]) for row in status_rows
    ]

    cancelled = sum(
        item.count
        for item in status_breakdown
        if item.status in ("CANCELLED_BY_PATIENT", "CANCELLED_BY_PRACTITIONER")
    )
    cancellation_rate = (cancelled / total_appointments) if total_appointments else 0.0

    first_seen_subq = (
        select(
            Appointment.patient_email,
            func.min(Appointment.start_time_utc).label("first_seen"),
        )
        .where(Appointment.practitioner_id == practitioner.id)
        .group_by(Appointment.patient_email)
        .subquery()
    )
    six_months_ago = datetime.now(timezone.utc) - timedelta(days=182)
    month_expr = func.to_char(first_seen_subq.c.first_seen, "YYYY-MM")
    monthly_rows = db.execute(
        select(month_expr.label("month"), func.count().label("count"))
        .select_from(first_seen_subq)
        .where(first_seen_subq.c.first_seen >= six_months_ago)
        .group_by(month_expr)
        .order_by(month_expr)
    ).all()
    patients_per_month = [
        MonthlyCountItem(month=row.month, count=row.count) for row in monthly_rows
    ]

    return AnalyticsSummaryOut(
        total_appointments=total_appointments,
        total_patients=total_patients,
        cancellation_rate=round(cancellation_rate, 4),
        status_breakdown=status_breakdown,
        patients_per_month=patients_per_month,
    )


# ---- Contact form submissions -----------------------------------------------


@router.get("/contact-messages", response_model=list[ContactMessageOut])
def list_contact_messages(
    db: Session = Depends(get_db), practitioner: User = Depends(require_practitioner)
):
    return db.scalars(
        select(ContactMessage).order_by(ContactMessage.created_at.desc())
    ).all()


@router.patch("/contact-messages/{message_id}/read", response_model=ContactMessageOut)
def mark_contact_message_read(
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    practitioner: User = Depends(require_practitioner),
):
    message = db.get(ContactMessage, message_id)
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found.")
    message.is_read = True
    db.commit()
    db.refresh(message)
    return message
