from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.booking import (
    AppointmentConfirmationOut,
    BookingRequestCreateIn,
    BookingRequestOut,
    OtpResendOut,
    OtpVerifyIn,
)
from app.services.booking import (
    confirmation_payload,
    create_booking_request,
    latest_challenge,
    mask_mobile,
    resend_available_in_seconds,
    resend_otp,
    verify_and_confirm,
)
from app.services.sms import send_otp

router = APIRouter(prefix="/booking-requests", tags=["booking"])


def _request_out(db: Session, booking) -> BookingRequestOut:
    challenge = latest_challenge(db, booking.id)
    return BookingRequestOut(
        id=str(booking.id),
        status=booking.status,
        consultation_type=booking.consultation_type,
        masked_mobile=mask_mobile(booking.mobile_e164),
        otp_expires_at=challenge.expires_at,
        resend_available_in_seconds=resend_available_in_seconds(challenge),
    )


@router.post("", response_model=BookingRequestOut, status_code=status.HTTP_201_CREATED)
def create(body: BookingRequestCreateIn, db: Session = Depends(get_db)) -> BookingRequestOut:
    booking, otp = create_booking_request(db, body)
    if otp is not None:  # None on an idempotent replay of a live session
        send_otp(booking.mobile_e164, otp)
    return _request_out(db, booking)


@router.post("/{booking_request_id}/otp/resend", response_model=OtpResendOut)
def resend(booking_request_id: str, db: Session = Depends(get_db)) -> OtpResendOut:
    booking, otp = resend_otp(db, booking_request_id)
    send_otp(booking.mobile_e164, otp)
    challenge = latest_challenge(db, booking.id)
    return OtpResendOut(
        id=str(booking.id),
        masked_mobile=mask_mobile(booking.mobile_e164),
        otp_expires_at=challenge.expires_at,
        resend_available_in_seconds=resend_available_in_seconds(challenge),
        resend_count=challenge.resend_count,
        max_resends=settings.otp_max_resends,
    )


@router.post("/{booking_request_id}/verify", response_model=AppointmentConfirmationOut)
def verify(
    booking_request_id: str, body: OtpVerifyIn, db: Session = Depends(get_db)
) -> AppointmentConfirmationOut:
    appointment, raw_token = verify_and_confirm(db, booking_request_id, body.otp)
    return AppointmentConfirmationOut(**confirmation_payload(db, appointment, raw_token))