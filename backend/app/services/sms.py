"""SMS delivery abstraction.

Two channels, deliberately separate:
  * OTP codes go out *directly* through this provider at request time (the plain
    code must never touch the notifications outbox or the app logs).
  * Everything else (confirmation, reminders, link-ready) is written to the
    notifications outbox and sent later by a worker.

V1 ships a console provider (dev delivery) and a memory provider (tests). Real
providers (MSG91/Twilio/etc.) slot in behind get_sms_provider() later.
"""

import uuid

from app.config import settings


class SmsProvider:
    def send(self, to_e164: str, body: str) -> str:  # pragma: no cover - interface
        raise NotImplementedError


class ConsoleSmsProvider(SmsProvider):
    """Dev delivery channel: prints the message. This IS the SMS in dev, not an
    application log line."""

    def send(self, to_e164: str, body: str) -> str:
        print(f"[SMS -> {to_e164}] {body}")
        return f"console-{uuid.uuid4().hex[:12]}"


class MemorySmsProvider(SmsProvider):
    """Captures messages in-process so tests can assert on them / read the OTP."""

    messages: list[dict] = []
    fail: bool = False

    def send(self, to_e164: str, body: str) -> str:
        if MemorySmsProvider.fail:
            raise RuntimeError("simulated provider failure")
        mid = f"mem-{len(MemorySmsProvider.messages)}"
        MemorySmsProvider.messages.append({"to": to_e164, "body": body, "id": mid})
        return mid


_console = ConsoleSmsProvider()
_memory = MemorySmsProvider()


def get_sms_provider() -> SmsProvider:
    if settings.sms_provider == "memory":
        return _memory
    return _console


def send_otp(to_e164: str, otp: str) -> str:
    minutes = max(1, settings.otp_ttl_seconds // 60)
    return get_sms_provider().send(
        to_e164, f"Your verification code is {otp}. It expires in {minutes} minutes."
    )