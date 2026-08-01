"""Security primitives for the platform.

Three distinct secret types, three distinct treatments (per the data-security
classification in the DB doc):

  * admin password  -> bcrypt hash (slow, salted)           -> admin_users.password_hash
  * OTP / access token -> SHA-256 + pepper (fast, one-shot) -> *_hash columns
  * Zoom join URL   -> Fernet symmetric encryption (reversible) -> *_encrypted columns
"""

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import settings

ADMIN_SESSION_COOKIE = settings.admin_session_cookie
PATIENT_SESSION_COOKIE = settings.patient_session_cookie


# --- Admin password hashing -------------------------------------------------
# bcrypt hard-rejects (ValueError) any password whose UTF-8 encoding exceeds
# 72 bytes rather than truncating it, so we truncate explicitly here — this
# matches bcrypt's historical behavior and keeps hash/verify symmetric.
def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode()[:72], bcrypt.gensalt()).decode()


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode()[:72], password_hash.encode())
    except ValueError:
        return False


# --- Admin session token ----------------------------------------------------
def create_admin_token(admin_user_id: uuid.UUID, role: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(admin_user_id), "role": role, "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_admin_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def create_patient_token(account_id: uuid.UUID) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(account_id), "typ": "patient", "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_patient_token(token: str) -> dict:
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("typ") != "patient":
        raise jwt.InvalidTokenError("not a patient token")
    return payload


# --- One-shot secrets: OTPs and appointment access tokens -------------------
def generate_numeric_otp(length: int | None = None) -> str:
    length = length or settings.otp_length
    return "".join(secrets.choice("0123456789") for _ in range(length))


def hash_secret(raw: str) -> str:
    """SHA-256(pepper || raw) as hex. Used for both OTP codes and the raw
    appointment access token. Never store the raw value."""
    peppered = f"{settings.token_hash_pepper}{raw}".encode()
    return hashlib.sha256(peppered).hexdigest()


def verify_secret(raw: str, stored_hash: str) -> bool:
    return hmac.compare_digest(hash_secret(raw), stored_hash)


def generate_access_token() -> tuple[str, str]:
    """Returns (raw_token_for_url, sha256_hash_for_db). The raw token is shown to
    the patient exactly once, inside their secure appointment URL."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_secret(raw)
