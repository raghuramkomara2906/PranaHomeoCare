import uuid

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    ADMIN_SESSION_COOKIE,
    PATIENT_SESSION_COOKIE,
    decode_admin_token,
    decode_patient_token,
)
from app.database import get_db
from app.models import AdminUser, DoctorProfile, PatientAccount

__all__ = ["get_db", "get_current_admin", "get_current_patient", "get_the_doctor"]


def get_current_admin(
    admin_session: str | None = Cookie(default=None, alias=ADMIN_SESSION_COOKIE),
    db: Session = Depends(get_db),
) -> AdminUser:
    """Resolve the authenticated doctor/admin from the httpOnly session cookie.

    Protects every /admin/* endpoint. Returns 401 on a missing, malformed, or
    expired token, or when the referenced account is missing/deactivated.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
    )
    if not admin_session:
        raise unauthorized

    try:
        payload = decode_admin_token(admin_session)
    except jwt.PyJWTError:
        raise unauthorized

    admin = db.get(AdminUser, uuid.UUID(payload["sub"]))
    if admin is None or not admin.is_active:
        raise unauthorized
    return admin


def get_the_doctor(db: Session = Depends(get_db)) -> DoctorProfile:
    """Single-practitioner system: resolve the one active doctor profile that
    public booking-facing endpoints (availability, appointments) hang off of."""
    doctor = db.query(DoctorProfile).filter(DoctorProfile.is_active.is_(True)).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No doctor profile is configured yet.",
        )
    return doctor


def get_current_patient(
    patient_session: str | None = Cookie(default=None, alias=PATIENT_SESSION_COOKIE),
    db: Session = Depends(get_db),
) -> PatientAccount:
    """Resolve the authenticated patient from the httpOnly session cookie.
    Entirely separate from get_current_admin — a patient session can never
    address an /admin endpoint."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
    )
    if not patient_session:
        raise unauthorized
    try:
        payload = decode_patient_token(patient_session)
    except jwt.PyJWTError:
        raise unauthorized
    account = db.get(PatientAccount, uuid.UUID(payload["sub"]))
    if account is None:
        raise unauthorized
    return account
