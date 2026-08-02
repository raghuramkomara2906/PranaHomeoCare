from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.audit import record_audit, safe_inet
from app.core.deps import get_current_admin
from app.core.security import (
    ADMIN_SESSION_COOKIE,
    create_admin_token,
    hash_password,
    needs_rehash,
    verify_password,
)
from app.database import get_db
from app.models import AdminUser, DoctorProfile
from app.schemas.auth import AdminLoginRequest, AdminMeOut, DoctorProfileOut

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])

# Simple lockout: after this many consecutive failures, lock for the window.
MAX_FAILED_LOGINS = 5
LOCKOUT_MINUTES = 15


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=ADMIN_SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        # Frontend (pranahomeocare.com) and API (api.pranahomeocare.com)
        # share a registrable domain, so this is same-site — Lax is both
        # sufficient and, unlike None, still sent when third-party cookies
        # are blocked.
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )


def _me(admin: AdminUser, db: Session) -> AdminMeOut:
    profile = (
        db.query(DoctorProfile).filter(DoctorProfile.admin_user_id == admin.id).first()
    )
    doctor = (
        DoctorProfileOut(
            id=str(profile.id),
            display_name=profile.display_name,
            qualification=profile.qualification,
        )
        if profile
        else None
    )
    return AdminMeOut(id=str(admin.id), email=admin.email, role=admin.role, doctor=doctor)


@router.post("/login", response_model=AdminMeOut)
def login(
    body: AdminLoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
) -> AdminMeOut:
    now = datetime.now(timezone.utc)
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password."
    )
    ip = safe_inet(request.client.host if request.client else None)
    ua = request.headers.get("user-agent")

    admin = db.query(AdminUser).filter(AdminUser.email == body.email).first()

    # Unknown / deactivated account — audit and fail with a generic message.
    if admin is None or not admin.is_active:
        record_audit(db, action="admin_login_failed", ip_address=ip, user_agent=ua,
                     metadata={"email": body.email, "reason": "unknown_or_inactive"})
        db.commit()
        raise invalid

    # Locked out?
    if admin.locked_until and admin.locked_until > now:
        record_audit(db, action="admin_login_failed", actor_admin_id=admin.id,
                     ip_address=ip, user_agent=ua, metadata={"reason": "locked"})
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account temporarily locked due to repeated failed logins. Try again later.",
        )

    # Wrong password — count the failure, lock if over threshold.
    if not verify_password(body.password, admin.password_hash):
        admin.failed_login_attempts += 1
        if admin.failed_login_attempts >= MAX_FAILED_LOGINS:
            admin.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            admin.failed_login_attempts = 0
        record_audit(db, action="admin_login_failed", actor_admin_id=admin.id,
                     ip_address=ip, user_agent=ua, metadata={"reason": "bad_password"})
        db.commit()
        raise invalid

    # Success — reset counters, stamp last login, issue the session cookie.
    if needs_rehash(admin.password_hash):
        admin.password_hash = hash_password(body.password)
    admin.failed_login_attempts = 0
    admin.locked_until = None
    admin.last_login_at = now
    record_audit(db, action="admin_login_success", actor_admin_id=admin.id,
                 ip_address=ip, user_agent=ua)
    db.commit()

    _set_session_cookie(response, create_admin_token(admin.id, admin.role))
    return _me(admin, db)


@router.post("/logout")
def logout(response: Response, admin: AdminUser = Depends(get_current_admin)) -> dict:
    response.delete_cookie(ADMIN_SESSION_COOKIE, path="/")
    return {"status": "logged_out"}


@router.get("/me", response_model=AdminMeOut)
def me(
    admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)
) -> AdminMeOut:
    return _me(admin, db)