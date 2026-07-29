"""Feature 11 — optional patient accounts.

An account is identified by a verified mobile number and is a view over every
appointment that shares that mobile (no patient_id on appointments). Entirely
separate from admin auth. Reuses the existing OTP, cancel/reschedule/join logic.
"""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import (
    generate_numeric_otp,
    hash_password,
    hash_secret,
    verify_password,
    verify_secret,
)
from app.models import Appointment, AvailabilitySlot, PatientAccount
from app.models.account import AccountOtpChallenge
from app.services.appointments import (
    access_view,
    join_for,
    join_status_for,
    perform_cancel,
    perform_reschedule,
    reschedule_options_for,
)
from app.services.booking import mask_mobile, normalize_mobile
from app.services.sms import send_otp
from app.models.enums import ActorType

REGISTRATION = "registration"
PASSWORD_RESET = "password_reset"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _account_by_mobile(db: Session, mobile: str) -> PatientAccount | None:
    return (
        db.query(PatientAccount).filter(PatientAccount.mobile_e164 == mobile).first()
    )


# --- OTP (registration / password reset) -----------------------------------
def request_otp(db: Session, raw_mobile: str, purpose: str) -> dict:
    mobile = normalize_mobile(raw_mobile)
    existing = _account_by_mobile(db, mobile)
    if purpose == REGISTRATION and existing is not None:
        raise HTTPException(409, "An account already exists for this mobile. Please sign in.")
    if purpose == PASSWORD_RESET and existing is None:
        raise HTTPException(404, "No account exists for this mobile.")

    # Supersede any earlier pending challenges for this mobile+purpose.
    (
        db.query(AccountOtpChallenge)
        .filter(
            AccountOtpChallenge.mobile_e164 == mobile,
            AccountOtpChallenge.purpose == purpose,
            AccountOtpChallenge.status == "pending",
        )
        .update({"status": "superseded"})
    )

    otp = generate_numeric_otp()
    expires_at = _utcnow() + timedelta(seconds=settings.otp_ttl_seconds)
    db.add(
        AccountOtpChallenge(
            mobile_e164=mobile,
            purpose=purpose,
            otp_hash=hash_secret(otp),
            expires_at=expires_at,
            status="pending",
        )
    )
    db.commit()
    send_otp(mobile, otp)
    return {
        "masked_mobile": mask_mobile(mobile),
        "otp_expires_at": expires_at,
        "resend_available_in_seconds": settings.otp_resend_cooldown_seconds,
    }


def _consume_otp(db: Session, mobile: str, purpose: str, otp: str) -> None:
    challenge = (
        db.query(AccountOtpChallenge)
        .filter(
            AccountOtpChallenge.mobile_e164 == mobile,
            AccountOtpChallenge.purpose == purpose,
            AccountOtpChallenge.status == "pending",
        )
        .order_by(AccountOtpChallenge.created_at.desc())
        .first()
    )
    invalid = HTTPException(400, "The verification code is incorrect or has expired.")
    if challenge is None:
        raise invalid
    if _utcnow() > challenge.expires_at:
        challenge.status = "expired"
        db.commit()
        raise invalid
    if challenge.attempts >= settings.otp_max_attempts:
        challenge.status = "expired"
        db.commit()
        raise invalid
    if not verify_secret(otp, challenge.otp_hash):
        challenge.attempts += 1
        db.commit()
        raise invalid
    challenge.status = "verified"
    db.flush()


# --- registration -----------------------------------------------------------
def register(db: Session, raw_mobile: str, otp: str, password: str) -> PatientAccount:
    mobile = normalize_mobile(raw_mobile)
    if len(password) < settings.password_min_length:
        raise HTTPException(422, f"Password must be at least {settings.password_min_length} characters.")
    _consume_otp(db, mobile, REGISTRATION, otp)
    if _account_by_mobile(db, mobile) is not None:
        raise HTTPException(409, "An account already exists for this mobile. Please sign in.")
    account = PatientAccount(
        mobile_e164=mobile,
        password_hash=hash_password(password),
        mobile_verified_at=_utcnow(),
        last_login_at=_utcnow(),
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


# --- login ------------------------------------------------------------------
def login(db: Session, raw_mobile: str, password: str) -> PatientAccount:
    mobile = normalize_mobile(raw_mobile)
    account = _account_by_mobile(db, mobile)
    invalid = HTTPException(401, "Incorrect mobile number or password.")
    if account is None:
        raise invalid
    now = _utcnow()
    if account.locked_until is not None and account.locked_until > now:
        raise HTTPException(423, "Account temporarily locked after too many attempts. Try again later.")
    if not verify_password(password, account.password_hash):
        account.failed_login_count += 1
        if account.failed_login_count >= settings.account_lockout_threshold:
            account.locked_until = now + timedelta(minutes=settings.account_lockout_minutes)
            account.failed_login_count = 0
        db.commit()
        raise invalid
    account.failed_login_count = 0
    account.locked_until = None
    account.last_login_at = now
    db.commit()
    db.refresh(account)
    return account


# --- password reset ---------------------------------------------------------
def reset_password(db: Session, raw_mobile: str, otp: str, password: str) -> None:
    mobile = normalize_mobile(raw_mobile)
    if len(password) < settings.password_min_length:
        raise HTTPException(422, f"Password must be at least {settings.password_min_length} characters.")
    _consume_otp(db, mobile, PASSWORD_RESET, otp)
    account = _account_by_mobile(db, mobile)
    if account is None:
        raise HTTPException(404, "No account exists for this mobile.")
    account.password_hash = hash_password(password)
    account.failed_login_count = 0
    account.locked_until = None
    db.commit()


# --- appointments view + scoped actions ------------------------------------
def _appt_view(db: Session, appt: Appointment) -> dict:
    return {**access_view(db, appt), "id": str(appt.id)}


def list_appointments(db: Session, account: PatientAccount) -> dict:
    rows = (
        db.query(Appointment)
        .join(AvailabilitySlot, Appointment.slot_id == AvailabilitySlot.id)
        .filter(Appointment.mobile_e164 == account.mobile_e164)
        .order_by(AvailabilitySlot.start_at.desc())
        .all()
    )
    return {
        "timezone": settings.default_timezone,
        "appointments": [_appt_view(db, a) for a in rows],
    }


def _owned_appointment(db: Session, account: PatientAccount, appointment_id: str) -> Appointment:
    appt = db.get(Appointment, appointment_id)
    if appt is None or appt.mobile_e164 != account.mobile_e164:
        raise HTTPException(404, "Appointment not found.")
    return appt


def cancel(db: Session, account: PatientAccount, appointment_id: str) -> Appointment:
    appt = _owned_appointment(db, account, appointment_id)
    perform_cancel(db, appt, actor_type=ActorType.PATIENT.value, enforce_cutoff=True)
    db.commit()
    db.refresh(appt)
    return appt


def reschedule_options(db: Session, account: PatientAccount, appointment_id: str) -> dict:
    appt = _owned_appointment(db, account, appointment_id)
    return reschedule_options_for(db, appt)


def reschedule(db: Session, account: PatientAccount, appointment_id: str, new_slot_id: str) -> Appointment:
    appt = _owned_appointment(db, account, appointment_id)
    perform_reschedule(db, appt, new_slot_id, actor_type=ActorType.PATIENT.value, enforce_cutoff=True)
    db.commit()
    db.refresh(appt)
    return appt


def join_status(db: Session, account: PatientAccount, appointment_id: str) -> dict:
    appt = _owned_appointment(db, account, appointment_id)
    return join_status_for(db, appt)


def join(db: Session, account: PatientAccount, appointment_id: str) -> dict:
    appt = _owned_appointment(db, account, appointment_id)
    return join_for(db, appt)
