from datetime import datetime

from pydantic import Field, EmailStr

from app.schemas.base import CamelModel


# ---------------------------------------------------------------------------
# OTP-based registration (existing — re-enabled when DLT is ready)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Password-based registration (new — no OTP required)
# ---------------------------------------------------------------------------

class MobileRegisterIn(CamelModel):
    """Register with mobile number + password. No OTP verification for now.
    Mobile is stored and used for appointment reminders once SMS is live."""
    mobile_number: str
    password: str = Field(min_length=8, max_length=72)
    full_name: str | None = None


class EmailRegisterIn(CamelModel):
    """Register with email + password. Used when OTP SMS is not available."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str | None = None


# ---------------------------------------------------------------------------
# Login (existing OTP-based + new password-based)
# ---------------------------------------------------------------------------

class LoginIn(CamelModel):
    """Existing OTP-verified mobile login."""
    mobile_number: str
    password: str = Field(max_length=72)


class MobileLoginIn(CamelModel):
    """Login with mobile number + password."""
    mobile_number: str
    password: str = Field(max_length=72)


class EmailLoginIn(CamelModel):
    """Login with email + password."""
    email: EmailStr
    password: str = Field(max_length=72)


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class AccountMe(CamelModel):
    id: str
    mobile_masked: str | None = None   # None for email-only accounts
    email: str | None = None           # None for mobile-only accounts
    full_name: str | None = None
    has_mobile: bool = False
    has_email: bool = False


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


# ---------------------------------------------------------------------------
# Password reset (existing — re-enabled when DLT is ready)
# ---------------------------------------------------------------------------

class PasswordResetOtpIn(CamelModel):
    mobile_number: str


class PasswordResetConfirmIn(CamelModel):
    mobile_number: str
    otp: str
    password: str = Field(min_length=8, max_length=72)