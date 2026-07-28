from datetime import datetime
from uuid import UUID

from app.schemas.base import CamelModel


class BookingRequestCreateIn(CamelModel):
    consultation_type: str
    slot_id: str
    patient_name: str
    mobile_number: str  # 10-digit local or +91XXXXXXXXXX; normalized server-side
    sms_consent: bool
    terms_accepted: bool
    idempotency_key: UUID


class OtpVerifyIn(CamelModel):
    otp: str


class BookingRequestOut(CamelModel):
    id: str
    status: str
    consultation_type: str
    masked_mobile: str
    otp_expires_at: datetime
    resend_available_in_seconds: int


class OtpResendOut(CamelModel):
    id: str
    masked_mobile: str
    otp_expires_at: datetime
    resend_available_in_seconds: int
    resend_count: int
    max_resends: int


class AppointmentConfirmationOut(CamelModel):
    booking_reference: str
    consultation_type: str
    status: str
    start_at: datetime
    end_at: datetime
    timezone: str
    masked_mobile: str
    fee: str = "free"
    instructions: str
    clinic_phone: str | None = None
    meeting_status: str | None = None
    access_token: str | None = None  # raw token for the secure appointment URL
    appointment_path: str | None = None
    already_confirmed: bool = False