from datetime import date

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.deps import get_current_patient, get_db
from app.core.security import PATIENT_SESSION_COOKIE, create_patient_token
from app.config import settings
from app.models import PatientAccount
from app.schemas.account import (
    AccountAppointmentsOut,
    AccountMe,
    EmailLoginIn,
    EmailRegisterIn,
    LoginIn,
    MobileLoginIn,
    MobileRegisterIn,
    OtpChallengeOut,
    PasswordResetConfirmIn,
    PasswordResetOtpIn,
    RegisterConfirmIn,
    RegisterOtpIn,
)
from app.schemas.appointments import (
    CancelOut,
    JoinOut,
    JoinStatusOut,
    RescheduleIn,
    RescheduleOptionsOut,
    RescheduleOut,
)
from app.services import accounts
from app.services.accounts import PASSWORD_RESET, REGISTRATION
from app.services.appointments import access_view
from app.services.booking import mask_mobile

router = APIRouter(prefix="/account", tags=["account"])


def _set_session(response: Response, account: PatientAccount) -> None:
    response.set_cookie(
        key=PATIENT_SESSION_COOKIE,
        value=create_patient_token(account.id),
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
    )


def _me(account: PatientAccount) -> AccountMe:
    """Build AccountMe response for any account type."""
    return AccountMe(
        id=str(account.id),
        mobile_masked=(
            mask_mobile(account.mobile_e164) if account.mobile_e164 else None
        ),
        email=account.email,
        full_name=account.full_name,
        has_mobile=bool(account.mobile_e164),
        has_email=bool(account.email),
    )


# ---------------------------------------------------------------------------
# OTP-based registration (existing — re-enabled when DLT SMS is ready)
# ---------------------------------------------------------------------------

@router.post("/register/request-otp", response_model=OtpChallengeOut)
def register_request_otp(
    body: RegisterOtpIn,
    db: Session = Depends(get_db),
) -> OtpChallengeOut:
    return OtpChallengeOut(
        **accounts.request_otp(db, body.mobile_number, REGISTRATION)
    )


@router.post("/register/confirm", response_model=AccountMe)
def register_confirm(
    body: RegisterConfirmIn,
    response: Response,
    db: Session = Depends(get_db),
) -> AccountMe:
    account = accounts.register(db, body.mobile_number, body.otp, body.password)
    _set_session(response, account)
    return _me(account)


# ---------------------------------------------------------------------------
# Password-only registration (new — no OTP required)
# ---------------------------------------------------------------------------

@router.post("/register/mobile", response_model=AccountMe)
def register_mobile(
    body: MobileRegisterIn,
    response: Response,
    db: Session = Depends(get_db),
) -> AccountMe:
    """Register with mobile number + password. No OTP verification.
    Mobile is stored for appointment reminders once SMS is live."""
    account = accounts.register_with_mobile(
        db,
        raw_mobile=body.mobile_number,
        password=body.password,
        full_name=body.full_name,
    )
    _set_session(response, account)
    return _me(account)


@router.post("/register/email", response_model=AccountMe)
def register_email(
    body: EmailRegisterIn,
    response: Response,
    db: Session = Depends(get_db),
) -> AccountMe:
    """Register with email + password. No OTP required."""
    account = accounts.register_with_email(
        db,
        email=body.email,
        password=body.password,
        full_name=body.full_name,
    )
    _set_session(response, account)
    return _me(account)


# ---------------------------------------------------------------------------
# Login — OTP-verified mobile (existing)
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AccountMe)
def login(
    body: LoginIn,
    response: Response,
    db: Session = Depends(get_db),
) -> AccountMe:
    account = accounts.login(db, body.mobile_number, body.password)
    _set_session(response, account)
    return _me(account)


# ---------------------------------------------------------------------------
# Login — password-only (new)
# ---------------------------------------------------------------------------

@router.post("/login/mobile", response_model=AccountMe)
def login_mobile(
    body: MobileLoginIn,
    response: Response,
    db: Session = Depends(get_db),
) -> AccountMe:
    """Login with mobile number + password (no OTP)."""
    account = accounts.login_with_mobile(db, body.mobile_number, body.password)
    _set_session(response, account)
    return _me(account)


@router.post("/login/email", response_model=AccountMe)
def login_email(
    body: EmailLoginIn,
    response: Response,
    db: Session = Depends(get_db),
) -> AccountMe:
    """Login with email + password."""
    account = accounts.login_with_email(db, body.email, body.password)
    _set_session(response, account)
    return _me(account)


# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------

@router.post("/logout")
def logout(response: Response) -> dict:
    response.delete_cookie(PATIENT_SESSION_COOKIE)
    return {"ok": True}


@router.get("/me", response_model=AccountMe)
def me(account: PatientAccount = Depends(get_current_patient)) -> AccountMe:
    return _me(account)


# ---------------------------------------------------------------------------
# Appointments (unchanged)
# ---------------------------------------------------------------------------

@router.get("/appointments", response_model=AccountAppointmentsOut)
def appointments(
    account: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
) -> AccountAppointmentsOut:
    return AccountAppointmentsOut(**accounts.list_appointments(db, account))


@router.get(
    "/appointments/{appointment_id}/join-status",
    response_model=JoinStatusOut,
)
def join_status(
    appointment_id: str,
    account: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
) -> JoinStatusOut:
    return JoinStatusOut(**accounts.join_status(db, account, appointment_id))


@router.post("/appointments/{appointment_id}/join", response_model=JoinOut)
def join(
    appointment_id: str,
    account: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
) -> JoinOut:
    return JoinOut(**accounts.join(db, account, appointment_id))


@router.get(
    "/appointments/{appointment_id}/reschedule-options",
    response_model=RescheduleOptionsOut,
)
def reschedule_options(
    appointment_id: str,
    account: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
) -> RescheduleOptionsOut:
    return RescheduleOptionsOut(
        **accounts.reschedule_options(db, account, appointment_id)
    )


@router.post(
    "/appointments/{appointment_id}/reschedule",
    response_model=RescheduleOut,
)
def reschedule(
    appointment_id: str,
    body: RescheduleIn,
    account: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
) -> RescheduleOut:
    appt = accounts.reschedule(db, account, appointment_id, body.new_slot_id)
    view = access_view(db, appt)
    db.commit()
    return RescheduleOut(
        booking_reference=appt.booking_reference,
        status=appt.status,
        message="Your appointment has been rescheduled. A confirmation SMS has been sent.",
        start_at=view["start_at"],
        end_at=view["end_at"],
        meeting_status=view["meeting_status"],
    )


@router.post("/appointments/{appointment_id}/cancel", response_model=CancelOut)
def cancel(
    appointment_id: str,
    account: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
) -> CancelOut:
    appt = accounts.cancel(db, account, appointment_id)
    return CancelOut(
        booking_reference=appt.booking_reference,
        status=appt.status,
        message="Your appointment has been cancelled. A confirmation SMS has been sent.",
    )


# ---------------------------------------------------------------------------
# Password reset (unchanged)
# ---------------------------------------------------------------------------

@router.post("/password-reset/request-otp", response_model=OtpChallengeOut)
def password_reset_request_otp(
    body: PasswordResetOtpIn,
    db: Session = Depends(get_db),
) -> OtpChallengeOut:
    return OtpChallengeOut(
        **accounts.request_otp(db, body.mobile_number, PASSWORD_RESET)
    )


@router.post("/password-reset/confirm")
def password_reset_confirm(
    body: PasswordResetConfirmIn,
    db: Session = Depends(get_db),
) -> dict:
    accounts.reset_password(db, body.mobile_number, body.otp, body.password)
    return {"ok": True}