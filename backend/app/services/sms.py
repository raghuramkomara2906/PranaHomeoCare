"""SMS delivery abstraction.

Two channels, deliberately separate:

  OTP delivery (blocking — patient can't book without it)
  ───────────────────────────────────────────────────────
  get_otp_provider().send_otp_code(to, otp)
  → Twilio: set OTP_PROVIDER=twilio
  → 2Factor: set OTP_PROVIDER=twofactor

  General SMS — confirmations, reminders, Zoom-link ready (non-blocking)
  ───────────────────────────────────────────────────────────────────────
  get_sms_provider().send(to, body)
  → Twilio: set SMS_PROVIDER=twilio (recommended — works without DLT)
  → Console: set SMS_PROVIDER=console (logs to terminal, no real SMS)

Environment variables
─────────────────────
  OTP_PROVIDER             twilio | twofactor | console | memory
  SMS_PROVIDER             twilio | console | memory

  TWILIO_ACCOUNT_SID       Account SID from twilio.com/console
  TWILIO_AUTH_TOKEN        Auth Token from twilio.com/console
  TWILIO_FROM_NUMBER       Your Twilio phone number (E.164: +1234567890)

  TWOFACTOR_API_KEY        Your 2Factor API key (if using twofactor)
  TWOFACTOR_OTP_TEMPLATE   Optional registered template name (leave blank on trial)
"""

import uuid

from app.config import settings


# ---------------------------------------------------------------------------
# Base interface
# ---------------------------------------------------------------------------

class SmsProvider:
    def send(self, to_e164: str, body: str) -> str:  # pragma: no cover
        raise NotImplementedError

    def send_otp_code(self, to_e164: str, otp: str) -> str:
        minutes = max(1, settings.otp_ttl_seconds // 60)
        body = (
            f"Your Prana Homeo Care verification code is {otp}. "
            f"Valid for {minutes} minutes. Do not share with anyone."
        )
        return self.send(to_e164, body)


# ---------------------------------------------------------------------------
# Console — dev + fallback
# ---------------------------------------------------------------------------

class ConsoleSmsProvider(SmsProvider):
    """Logs every message to stdout. Used in local dev."""

    def send(self, to_e164: str, body: str) -> str:
        mid = f"console-{uuid.uuid4().hex[:10]}"
        print(f"[SMS {mid} -> {to_e164}] {body}")
        return mid


# ---------------------------------------------------------------------------
# Memory — test suite only
# ---------------------------------------------------------------------------

class MemorySmsProvider(SmsProvider):
    """Captures every send call in-process so tests can assert and read OTPs."""

    messages: list[dict] = []
    fail: bool = False

    def send(self, to_e164: str, body: str) -> str:
        if MemorySmsProvider.fail:
            raise RuntimeError("simulated provider failure")
        mid = f"mem-{len(MemorySmsProvider.messages)}"
        MemorySmsProvider.messages.append({"to": to_e164, "body": body, "id": mid})
        return mid


# ---------------------------------------------------------------------------
# Twilio — full SMS provider (OTP + transactional)
# ---------------------------------------------------------------------------

class TwilioSmsProvider(SmsProvider):
    """Twilio Programmable SMS.

    Works for both OTP delivery AND general SMS (confirmations, reminders).
    Unlike 2Factor, Twilio handles all message types — no DLT required
    for trial accounts (but only verified numbers on trial).

    Required env vars:
        TWILIO_ACCOUNT_SID   — from twilio.com/console
        TWILIO_AUTH_TOKEN    — from twilio.com/console
        TWILIO_FROM_NUMBER   — your Twilio number in E.164 (+1234567890)

    Note: For India production, Twilio requires DLT registration.
    On a trial account, you can only send to verified numbers.
    """

    def send(self, to_e164: str, body: str) -> str:
        if not settings.twilio_account_sid:
            raise RuntimeError("TWILIO_ACCOUNT_SID is not configured.")
        if not settings.twilio_auth_token:
            raise RuntimeError("TWILIO_AUTH_TOKEN is not configured.")
        if not settings.twilio_from_number:
            raise RuntimeError("TWILIO_FROM_NUMBER is not configured.")

        try:
            from twilio.rest import Client
            client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
            message = client.messages.create(
                body=body,
                from_=settings.twilio_from_number,
                to=to_e164,
            )
            return str(message.sid)
        except Exception as exc:
            raise RuntimeError(f"Twilio SMS failed: {exc}") from exc


# ---------------------------------------------------------------------------
# 2Factor — OTP delivery only (send-your-own-OTP, no DLT required)
# ---------------------------------------------------------------------------

class TwoFactorOtpProvider(SmsProvider):
    """2Factor send-your-own-OTP endpoint.

    YOUR app generates, hashes, stores, and verifies the OTP as normal.
    This class only delivers the 6-digit code via 2Factor's network.

    API: POST https://2factor.in/API/V1/{api_key}/SMS/{phone}/{otp}[/{template}]
    Success response: {"Status": "Success", "Details": "<session-id>"}

    Does NOT require DLT registration for OTP delivery.
    Set OTP_PROVIDER=twofactor and TWOFACTOR_API_KEY in the environment.
    """

    BASE_URL = "https://2factor.in/API/V1"

    def send(self, to_e164: str, body: str) -> str:
        """Not used for general SMS — falls back to console gracefully."""
        mid = f"console-{uuid.uuid4().hex[:10]}"
        print(
            f"[2Factor-general-fallback {mid} -> {to_e164}] {body}\n"
            f"  ↳ 2Factor can only deliver OTPs without DLT registration.\n"
            f"    Set SMS_PROVIDER=twilio for transactional messages."
        )
        return mid

    def send_otp_code(self, to_e164: str, otp: str) -> str:
        import httpx

        if not settings.twofactor_api_key:
            raise RuntimeError(
                "TWOFACTOR_API_KEY is not set. "
                "Add it to backend/.env to enable OTP delivery."
            )

        number = to_e164.strip()
        if number.startswith("+"):
            number = number[1:]

        parts = [self.BASE_URL, settings.twofactor_api_key, "SMS", number, otp]
        if settings.twofactor_otp_template:
            parts.append(settings.twofactor_otp_template)
        url = "/".join(parts)

        try:
            resp = httpx.post(url, timeout=15.0)
        except httpx.HTTPError as exc:
            raise RuntimeError(f"2Factor request failed: {exc}") from exc

        try:
            payload = resp.json()
        except ValueError:
            raise RuntimeError(
                f"2Factor returned a non-JSON response (HTTP {resp.status_code})."
            )

        if payload.get("Status") != "Success":
            raise RuntimeError(
                f"2Factor OTP delivery failed: {payload.get('Details', payload)}"
            )

        return str(payload.get("Details", f"2f-{uuid.uuid4().hex[:12]}"))


# ---------------------------------------------------------------------------
# Singletons + selectors
# ---------------------------------------------------------------------------

_console   = ConsoleSmsProvider()
_memory    = MemorySmsProvider()
_twilio    = TwilioSmsProvider()
_twofactor = TwoFactorOtpProvider()


def _resolve(name: str) -> SmsProvider:
    if name == "memory":    return _memory
    if name == "twilio":    return _twilio
    if name == "twofactor": return _twofactor
    return _console


def get_sms_provider() -> SmsProvider:
    """General SMS — confirmations, reminders, Zoom-link notifications."""
    return _resolve(settings.sms_provider)


def get_otp_provider() -> SmsProvider:
    """OTP delivery. Falls back to SMS_PROVIDER when OTP_PROVIDER is unset."""
    name = settings.otp_provider or settings.sms_provider
    return _resolve(name)


def send_otp(to_e164: str, otp: str) -> str:
    """Deliver an OTP the app has already generated."""
    return get_otp_provider().send_otp_code(to_e164, otp)