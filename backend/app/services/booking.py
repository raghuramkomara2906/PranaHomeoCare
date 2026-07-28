"""Booking core: hold + OTP, resend, and the atomic verify->confirm transaction.

Implements DB doc §11.1 (OTP request / temporary hold) and §11.2 (OTP verify /
appointment creation). All the concurrency safety lives here: row locks on the
slot / booking_request / OTP challenge, the partial unique indexes as a
last-resort guard, and the idempotency key.
"""

import secrets
import string
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.models import (
    Appointment,
    AppointmentAccessToken,
    AppointmentEvent,
    AvailabilitySlot,
    BookingRequest,
    ClinicSettings,
    MeetingDetails,
    OtpChallenge,
)
from app.models.enums import (
    ACTIVE_BOOKING_REQUEST_STATUSES,
    ActorType,
    AppointmentEventType,
    AppointmentStatus,
    BookingRequestStatus,
    ConsultationType,
    MeetingStatus,
    NotificationType,
    OtpStatus,
    SlotBaseStatus,
)
from app.core.security import (
    generate_access_token,
    generate_numeric_otp,
    hash_secret,
    verify_secret,
)
from app.services.notifications import queue_notification
from app.services.slots import utcnow

_VALID_TYPES = {t.value for t in ConsultationType}
_REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no ambiguous chars


# --- small helpers ---------------------------------------------------------
def normalize_mobile(raw: str) -> str:
    digits = "".join(ch for ch in (raw or "") if ch.isdigit())
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    if len(digits) != 10 or digits[0] not in "6789":
        raise HTTPException(422, "Enter a valid 10-digit Indian mobile number.")
    return f"+91{digits}"


def mask_mobile(e164: str) -> str:
    local = e164[-10:]
    return f"+91 {local[:2]}XXX XX{local[-3:]}"


def _clinic(db: Session) -> ClinicSettings:
    clinic = db.query(ClinicSettings).first()
    if clinic is None:
        raise HTTPException(503, "Clinic is not configured.")
    return clinic


def _generate_reference(db: Session) -> str:
    for _ in range(6):
        ref = "HOM-" + "".join(secrets.choice(_REF_ALPHABET) for _ in range(6))
        if db.query(Appointment.id).filter(Appointment.booking_reference == ref).first() is None:
            return ref
    raise HTTPException(500, "Could not allocate a booking reference.")


def latest_challenge(db: Session, booking_request_id) -> OtpChallenge | None:
    return (
        db.query(OtpChallenge)
        .filter(OtpChallenge.booking_request_id == booking_request_id)
        .order_by(OtpChallenge.sent_at.desc())
        .first()
    )


def resend_available_in_seconds(challenge: OtpChallenge) -> int:
    elapsed = (utcnow() - challenge.sent_at).total_seconds()
    return max(0, int(settings.otp_resend_cooldown_seconds - elapsed))


# --- §11.1: create hold + issue OTP ---------------------------------------
def create_booking_request(db: Session, body) -> tuple[BookingRequest, str | None]:
    """Returns (booking_request, plain_otp). The caller sends the OTP *after*
    commit. plain_otp is None when an idempotent replay returns an existing
    still-valid session (no new code is issued)."""
    now = utcnow()
    name = (body.patient_name or "").strip()
    if not (2 <= len(name) <= 150):
        raise HTTPException(422, "Please enter your full name.")
    if body.consultation_type not in _VALID_TYPES:
        raise HTTPException(422, "Choose a valid consultation type.")
    if not body.sms_consent:
        raise HTTPException(422, "SMS consent is required to receive appointment messages.")
    if not body.terms_accepted:
        raise HTTPException(422, "You must accept the booking terms to continue.")
    mobile = normalize_mobile(body.mobile_number)

    # Idempotency: same key -> same session (if still live), else refuse reuse.
    existing = (
        db.query(BookingRequest)
        .filter(BookingRequest.idempotency_key == body.idempotency_key)
        .first()
    )
    if existing is not None:
        if (
            existing.status == BookingRequestStatus.PENDING_OTP.value
            and existing.hold_expires_at > now
        ):
            return existing, None
        raise HTTPException(409, "This booking session can no longer be used. Please start again.")

    # Lock the slot for the duration of the checks (§11.1 step 1).
    slot = (
        db.query(AvailabilitySlot)
        .filter(AvailabilitySlot.id == body.slot_id)
        .with_for_update()
        .first()
    )
    if slot is None or slot.deleted_at is not None:
        raise HTTPException(404, "That appointment time could not be found.")
    if slot.base_status != SlotBaseStatus.AVAILABLE.value:
        raise HTTPException(409, "This appointment time is no longer available.")
    if slot.start_at <= now:
        raise HTTPException(422, "This appointment time is in the past.")

    # No confirmed appointment may already own the slot.
    if (
        db.query(Appointment.id)
        .filter(
            Appointment.slot_id == slot.id,
            Appointment.status == AppointmentStatus.CONFIRMED.value,
        )
        .first()
        is not None
    ):
        raise HTTPException(409, "This appointment time is no longer available.")

    # Expire stale holds; if a live hold remains, the slot is taken.
    active = (
        db.query(BookingRequest)
        .filter(
            BookingRequest.slot_id == slot.id,
            BookingRequest.status.in_(ACTIVE_BOOKING_REQUEST_STATUSES),
        )
        .with_for_update()
        .all()
    )
    for hold in active:
        if hold.hold_expires_at <= now:
            hold.status = BookingRequestStatus.EXPIRED.value
    if any(
        h.status in ACTIVE_BOOKING_REQUEST_STATUSES and h.hold_expires_at > now
        for h in active
    ):
        raise HTTPException(409, "This appointment time is no longer available.")
    db.flush()  # release the partial-unique-index slot before inserting the new hold

    clinic = _clinic(db)
    booking = BookingRequest(
        slot_id=slot.id,
        consultation_type=body.consultation_type,
        patient_name=name,
        mobile_e164=mobile,
        sms_consent_at=now,
        terms_accepted_at=now,
        terms_version=clinic.current_terms_version,
        status=BookingRequestStatus.PENDING_OTP.value,
        hold_expires_at=now + timedelta(seconds=settings.booking_hold_ttl_seconds),
        idempotency_key=body.idempotency_key,
    )
    db.add(booking)
    db.flush()

    otp = generate_numeric_otp()
    db.add(
        OtpChallenge(
            booking_request_id=booking.id,
            mobile_e164=mobile,
            otp_hash=hash_secret(otp),
            status=OtpStatus.ISSUED.value,
            expires_at=now + timedelta(seconds=settings.otp_ttl_seconds),
            sent_at=now,
        )
    )
    db.commit()
    return booking, otp


# --- OTP resend ------------------------------------------------------------
def resend_otp(db: Session, booking_request_id: str) -> tuple[BookingRequest, str]:
    now = utcnow()
    booking = (
        db.query(BookingRequest)
        .filter(BookingRequest.id == booking_request_id)
        .with_for_update()
        .first()
    )
    if booking is None:
        raise HTTPException(404, "Booking session not found.")
    if booking.status != BookingRequestStatus.PENDING_OTP.value or booking.hold_expires_at <= now:
        raise HTTPException(409, "This booking session has expired. Please start again.")

    current = latest_challenge(db, booking.id)
    if current is not None:
        wait = resend_available_in_seconds(current)
        if wait > 0:
            raise HTTPException(429, f"Please wait {wait} seconds before requesting another code.")
        if current.resend_count >= settings.otp_max_resends:
            raise HTTPException(429, "Too many verification codes requested. Please start again.")
        current.status = OtpStatus.SUPERSEDED.value
        next_count = current.resend_count + 1
    else:
        next_count = 0

    otp = generate_numeric_otp()
    db.add(
        OtpChallenge(
            booking_request_id=booking.id,
            mobile_e164=booking.mobile_e164,
            otp_hash=hash_secret(otp),
            status=OtpStatus.ISSUED.value,
            expires_at=now + timedelta(seconds=settings.otp_ttl_seconds),
            sent_at=now,
            resend_count=next_count,
            last_resend_at=now,
        )
    )
    db.commit()
    return booking, otp


# --- §11.2: verify OTP + create appointment atomically --------------------
def verify_and_confirm(db: Session, booking_request_id: str, otp_code: str):
    """Returns (appointment, raw_access_token | None). raw token is None on an
    idempotent replay of an already-confirmed booking."""
    now = utcnow()
    booking = (
        db.query(BookingRequest)
        .filter(BookingRequest.id == booking_request_id)
        .with_for_update()
        .first()
    )
    if booking is None:
        raise HTTPException(404, "Booking session not found.")

    # Idempotent double-submit: already confirmed -> return the appointment.
    if booking.status == BookingRequestStatus.COMPLETED.value and booking.appointment_id:
        return db.get(Appointment, booking.appointment_id), None

    if booking.status != BookingRequestStatus.PENDING_OTP.value:
        raise HTTPException(409, "This booking session is no longer valid. Please start again.")
    if booking.hold_expires_at <= now:
        booking.status = BookingRequestStatus.EXPIRED.value
        db.commit()
        raise HTTPException(409, "This booking session has expired and the slot was released.")

    challenge = latest_challenge(db, booking.id)
    if challenge is not None:
        challenge = (
            db.query(OtpChallenge).filter(OtpChallenge.id == challenge.id).with_for_update().one()
        )
    if challenge is None:
        raise HTTPException(400, "Please request a verification code first.")
    if challenge.status == OtpStatus.LOCKED.value:
        raise HTTPException(429, "Too many incorrect attempts. Request a new verification code.")
    if challenge.status == OtpStatus.EXPIRED.value or challenge.expires_at <= now:
        challenge.status = OtpStatus.EXPIRED.value
        db.commit()
        raise HTTPException(400, "The verification code has expired. Request a new code.")
    if challenge.status != OtpStatus.ISSUED.value:
        raise HTTPException(400, "Please request a verification code first.")
    if challenge.attempt_count >= challenge.max_attempts:
        challenge.status = OtpStatus.LOCKED.value
        db.commit()
        raise HTTPException(429, "Too many incorrect attempts. Request a new verification code.")

    if not verify_secret(otp_code, challenge.otp_hash):
        challenge.attempt_count += 1
        if challenge.attempt_count >= challenge.max_attempts:
            challenge.status = OtpStatus.LOCKED.value
        db.commit()
        raise HTTPException(400, "The verification code is incorrect.")

    # Correct code — re-validate the slot under lock (§11.2 steps 3,6,7).
    slot = (
        db.query(AvailabilitySlot)
        .filter(AvailabilitySlot.id == booking.slot_id)
        .with_for_update()
        .first()
    )
    slot_unavailable = HTTPException(
        409, "This appointment time was booked by another patient. Please choose another time."
    )
    if (
        slot is None
        or slot.deleted_at is not None
        or slot.base_status != SlotBaseStatus.AVAILABLE.value
    ):
        raise slot_unavailable
    if (
        db.query(Appointment.id)
        .filter(
            Appointment.slot_id == slot.id,
            Appointment.status == AppointmentStatus.CONFIRMED.value,
        )
        .first()
        is not None
    ):
        raise slot_unavailable

    clinic = _clinic(db)
    is_tele = booking.consultation_type == ConsultationType.TELECONSULTATION.value

    appointment = Appointment(
        booking_reference=_generate_reference(db),
        doctor_id=slot.doctor_id,
        slot_id=slot.id,
        booking_request_id=booking.id,
        patient_name=booking.patient_name,
        mobile_e164=booking.mobile_e164,
        consultation_type=booking.consultation_type,
        status=AppointmentStatus.CONFIRMED.value,
        teleconsultation_phone_e164=clinic.clinic_phone_e164 if is_tele else None,
        sms_consent_at=booking.sms_consent_at,
        terms_accepted_at=booking.terms_accepted_at,
        terms_version=booking.terms_version,
        confirmed_at=now,
    )
    db.add(appointment)

    raw_token, token_hash = generate_access_token()
    try:
        db.flush()  # unique indexes (ref, one-confirmed-per-slot) are the final guard
        db.add(
            AppointmentAccessToken(appointment_id=appointment.id, token_hash=token_hash)
        )
        if not is_tele:
            db.add(
                MeetingDetails(
                    appointment_id=appointment.id, status=MeetingStatus.PENDING.value
                )
            )
        booking.status = BookingRequestStatus.COMPLETED.value
        booking.appointment_id = appointment.id
        challenge.status = OtpStatus.VERIFIED.value
        challenge.verified_at = now
        db.add(
            AppointmentEvent(
                appointment_id=appointment.id,
                event_type=AppointmentEventType.APPOINTMENT_BOOKED.value,
                actor_type=ActorType.PATIENT.value,
            )
        )

        template_data = {
            "bookingReference": appointment.booking_reference,
            "startAtUtc": slot.start_at.isoformat(),
        }
        if is_tele:
            template_data["clinicPhone"] = clinic.clinic_phone_e164
        queue_notification(
            db,
            notification_type=NotificationType.BOOKING_CONFIRMATION.value,
            recipient_e164=appointment.mobile_e164,
            template_key=f"booking_confirmation_{'tele' if is_tele else 'video'}",
            template_data=template_data,
            scheduled_at=now,
            deduplication_key=f"booking_confirmation:{appointment.id}",
            appointment_id=appointment.id,
        )

        # Tele reminder, unless the booking is inside the reminder window already.
        if is_tele:
            remind_at = slot.start_at - timedelta(minutes=clinic.tele_reminder_minutes)
            if remind_at > now:
                queue_notification(
                    db,
                    notification_type=NotificationType.TELECONSULTATION_REMINDER.value,
                    recipient_e164=appointment.mobile_e164,
                    template_key="teleconsultation_reminder",
                    template_data=template_data,
                    scheduled_at=remind_at,
                    deduplication_key=f"tele_reminder:{appointment.id}",
                    appointment_id=appointment.id,
                )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise slot_unavailable

    return appointment, raw_token


# --- output builders -------------------------------------------------------
def confirmation_payload(db: Session, appointment: Appointment, raw_token: str | None):
    from app.services.slots import to_ist

    slot = db.get(AvailabilitySlot, appointment.slot_id)
    is_tele = appointment.consultation_type == ConsultationType.TELECONSULTATION.value
    meeting = None
    if not is_tele:
        md = db.query(MeetingDetails).filter(
            MeetingDetails.appointment_id == appointment.id
        ).first()
        meeting = md.status if md else MeetingStatus.PENDING.value

    if is_tele:
        instructions = "Please call the clinic at your scheduled appointment time."
    else:
        instructions = (
            "Your video consultation is confirmed. The doctor will add your unique "
            "Zoom link before the appointment, and you'll receive an SMS when it's ready."
        )

    return {
        "booking_reference": appointment.booking_reference,
        "consultation_type": appointment.consultation_type,
        "status": appointment.status,
        "start_at": to_ist(slot.start_at),
        "end_at": to_ist(slot.end_at),
        "timezone": settings.default_timezone,
        "masked_mobile": mask_mobile(appointment.mobile_e164),
        "instructions": instructions,
        "clinic_phone": appointment.teleconsultation_phone_e164,
        "meeting_status": meeting,
        "access_token": raw_token,
        "appointment_path": f"/appointment/{raw_token}" if raw_token else None,
        "already_confirmed": raw_token is None,
    }