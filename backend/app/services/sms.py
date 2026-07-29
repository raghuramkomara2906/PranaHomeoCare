"""SMS delivery abstraction.

Two channels, deliberately separate:

  OTP delivery (blocking — patient can't book without it)
  ───────────────────────────────────────────────────────
  get_otp_provider().send_otp_code(to, otp)
  → 2Factor send-your-own-OTP: POST .../API/V1/{key}/SMS/{phone}/{otp}
    Works without DLT registration. Set OTP_PROVIDER=twofactor.

  General SMS — confirmations, reminders, Zoom-link ready (non-blocking)
  ───────────────────────────────────────────────────────────────────────
  get_sms_provider().send(to, body)
  → Requires DLT-registered transactional templates.
    Until DLT is completed, set SMS_PROVIDER=console — messages are logged
    to the server terminal. Appointments still confirm; only the notification
    is deferred. Add a transactional provider once DLT is registered.

Environment variables
─────────────────────
  OTP_PROVIDER           twofactor | console | memory
  TWOFACTOR_API_KEY      your 2Factor API key
  TWOFACTOR_OTP_TEMPLATE optional registered template name (leave blank on trial)
  SMS_PROVIDER           console | memory   (transactional; extend when DLT ready)
"""

import uuid

from app.config import settings


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


class ConsoleSmsProvider(SmsProvider):
    """Logs every message to stdout.

    Used in local dev (OTPs appear in the uvicorn terminal) and as the
    SMS_PROVIDER fallback while DLT transactional registration is pending.
    Non-fatal: the caller succeeds even though no real text is sent.
    """

    def send(self, to_e164: str, body: str) -> str:
        mid = f"console-{uuid.uuid4().hex[:10]}"
        print(f"[SMS {mid} -> {to_e164}] {body}")
        return mid


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
            f"    Set SMS_PROVIDER to a transactional provider for this message."
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


_console   = ConsoleSmsProvider()
_memory    = MemorySmsProvider()
_twofactor = TwoFactorOtpProvider()


def _resolve(name: str) -> SmsProvider:
    if name == "memory":    return _memory
    if name == "twofactor": return _twofactor
    return _console


def get_sms_provider() -> SmsProvider:
    return _resolve(settings.sms_provider)


def get_otp_provider() -> SmsProvider:
    name = settings.otp_provider or settings.sms_provider
    return _resolve(name)


def send_otp(to_e164: str, otp: str) -> str:
    return get_otp_provider().send_otp_code(to_e164, otp)