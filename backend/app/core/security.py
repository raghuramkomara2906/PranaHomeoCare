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

import bcrypt  # legacy-hash verification only — never used to create new hashes
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHash, VerifyMismatchError

from app.config import settings

ADMIN_SESSION_COOKIE = settings.admin_session_cookie
PATIENT_SESSION_COOKIE = settings.patient_session_cookie

_ph = PasswordHasher()


# --- Admin/patient password hashing -----------------------------------------
# Argon2id: no arbitrary length cap, memory-hard against GPU/ASIC cracking.
# Accounts created before this switch still have bcrypt hashes ("$2a$"/"$2b$"/
# "$2y$" prefix); verify_password keeps checking those with bcrypt so existing
# logins don't break, and needs_rehash() tells the caller to re-hash with
# argon2 the next time that password is confirmed correct.
def hash_password(plain_password: str) -> str:
    return _ph.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    if password_hash.startswith("$2"):
        try:
            return bcrypt.checkpw(plain_password.encode()[:72], password_hash.encode())
        except ValueError:
            return False
    try:
        return _ph.verify(password_hash, plain_password)
    except (VerifyMismatchError, InvalidHash):
        return False


def needs_rehash(password_hash: str) -> bool:
    return password_hash.startswith("$2")


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
