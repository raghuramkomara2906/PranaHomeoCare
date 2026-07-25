import uuid
from datetime import datetime

from pydantic import EmailStr

from app.models.appointment import AppointmentStatus
from app.schemas.base import CamelModel


class PatientContactDetailsIn(CamelModel):
    full_name: str
    email: EmailStr
    phone: str
    notes: str | None = None


class AppointmentCreateRequest(CamelModel):
    service_id: str
    start_time_utc: datetime
    patient: PatientContactDetailsIn


class AppointmentOut(CamelModel):
    id: uuid.UUID
    public_reference: str
    patient_user_id: str = "guest"
    practitioner_id: uuid.UUID
    service_id: str
    service_name: str
    practitioner_name: str
    start_time_utc: datetime
    end_time_utc: datetime
    display_timezone: str
    status: AppointmentStatus


class AdminAppointmentOut(AppointmentOut):
    """Adds the guest contact details, visible only to the practitioner."""

    patient_full_name: str
    patient_email: str
    patient_phone: str
    patient_notes: str | None = None


class AppointmentUpdateRequest(CamelModel):
    status: AppointmentStatus | None = None
    start_time_utc: datetime | None = None


class AppointmentRescheduleRequest(CamelModel):
    start_time_utc: datetime


class AppointmentJoinStatusOut(CamelModel):
    appointment_id: uuid.UUID
    status: AppointmentStatus
    can_join: bool
    join_available_at: datetime
    join_closes_at: datetime
    server_time_utc: datetime
