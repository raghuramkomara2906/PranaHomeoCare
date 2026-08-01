from datetime import datetime

from pydantic import Field

from app.schemas.base import CamelModel


class RegisterOtpIn(CamelModel):
    mobile_number: str


class OtpChallengeOut(CamelModel):
    masked_mobile: str
    otp_expires_at: datetime
    resend_available_in_seconds: int


class RegisterConfirmIn(CamelModel):
    mobile_number: str
    otp: str
    password: str = Field(min_length=8, max_length=72)


class LoginIn(CamelModel):
    mobile_number: str
    password: str = Field(max_length=72)


class AccountMe(CamelModel):
    id: str
    mobile_masked: str


class AccountAppointmentItem(CamelModel):
    id: str
    booking_reference: str
    consultation_type: str
    status: str
    start_at: datetime
    end_at: datetime
    timezone: str
    clinic_phone: str | None = None
    meeting_status: str | None = None
    can_cancel: bool
    can_reschedule: bool
    cancellation_deadline: datetime
    reschedule_deadline: datetime


class AccountAppointmentsOut(CamelModel):
    timezone: str
    appointments: list[AccountAppointmentItem]


class PasswordResetOtpIn(CamelModel):
    mobile_number: str


class PasswordResetConfirmIn(CamelModel):
    mobile_number: str
    otp: str
    password: str = Field(min_length=8, max_length=72)
