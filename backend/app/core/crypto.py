"""Reversible encryption for operational secrets that must be read back later —
currently just the Zoom join URL (meeting_details.join_url_encrypted).

Distinct from core.security's one-way hashing (OTP / access tokens): those are
never recovered, this is. Uses Fernet (AES-128-CBC + HMAC)."""

import base64
import hashlib

from cryptography.fernet import Fernet

from app.config import settings


def _fernet() -> Fernet:
    key = settings.meeting_encryption_key
    if not key:
        # Dev fallback: a stable key derived from the pepper. Production MUST set
        # MEETING_ENCRYPTION_KEY to a real Fernet key.
        digest = hashlib.sha256(settings.token_hash_pepper.encode()).digest()
        key = base64.urlsafe_b64encode(digest).decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_secret(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt_secret(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()