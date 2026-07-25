import uuid

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import SESSION_COOKIE_NAME, decode_access_token
from app.database import get_db
from app.models.user import User, UserRole


def get_current_user(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
    )
    if not session_token:
        raise unauthorized

    try:
        payload = decode_access_token(session_token)
    except jwt.PyJWTError:
        raise unauthorized

    user = db.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        raise unauthorized
    return user


def get_the_practitioner(db: Session = Depends(get_db)) -> User:
    """This is a single-practitioner system — every public booking-facing
    endpoint (availability, appointment creation) needs to resolve to the
    one seeded PRACTITIONER account."""
    practitioner = db.query(User).filter(User.role == UserRole.PRACTITIONER).first()
    if practitioner is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No practitioner account is configured yet.",
        )
    return practitioner


def require_role(role: UserRole):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this resource.",
            )
        return current_user

    return dependency
