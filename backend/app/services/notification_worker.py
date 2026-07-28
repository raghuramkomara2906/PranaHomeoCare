"""Outbox processor for the notifications table (WF-005).

A background loop calls process_due_notifications(); it picks up `queued` rows
whose scheduled_at (and next_retry_at) have arrived, renders the SMS body, and
sends it via the configured provider. Transient failures back off and retry;
after MAX_ATTEMPTS a row is terminally `failed`. Reminders are gated: if the
appointment is no longer confirmed by send time, the reminder is cancelled
rather than sent.

Rows are locked FOR UPDATE SKIP LOCKED so multiple workers can run safely.
"""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Appointment, AvailabilitySlot, Notification
from app.models.enums import (
    AppointmentStatus,
    NotificationStatus,
    NotificationType,
)
from app.services.slots import to_ist, utcnow
from app.services.sms import get_sms_provider

MAX_ATTEMPTS = 5
RETRY_BASE_SECONDS = 60
RETRY_CAP_SECONDS = 3600


def _backoff(attempt: int) -> timedelta:
    return timedelta(seconds=min(RETRY_BASE_SECONDS * (2 ** (attempt - 1)), RETRY_CAP_SECONDS))


def render_body(n: Notification, appointment: Appointment | None, slot: AvailabilitySlot | None) -> str:
    data = n.template_data or {}
    ref = data.get("bookingReference", "")

    start_ist = None
    if slot is not None:
        start_ist = to_ist(slot.start_at)
    elif data.get("startAtUtc"):
        start_ist = to_ist(datetime.fromisoformat(data["startAtUtc"]))
    date_str = start_ist.strftime("%d %b %Y") if start_ist else ""
    time_str = start_ist.strftime("%-I:%M %p") if start_ist else ""

    clinic_phone = data.get("clinicPhone") or (
        appointment.teleconsultation_phone_e164 if appointment else None
    )

    key = n.template_key
    if key == "booking_confirmation_tele":
        return (
            f"Appointment {ref} confirmed for {date_str} {time_str} IST. "
            f"Please call {clinic_phone} at your appointment time."
        )
    if key == "booking_confirmation_video":
        return (
            f"Video consultation {ref} confirmed for {date_str} {time_str} IST. "
            "We'll SMS your Zoom link before the appointment."
        )
    if key == "teleconsultation_reminder":
        return (
            f"Reminder: consultation {ref} today at {time_str} IST. "
            f"Please call {clinic_phone}."
        )
    if key == "video_link_ready":
        return f"Your Zoom link for {ref} is ready. Open your appointment page to join near the time."
    if key == "video_link_updated":
        return f"Your appointment {ref} details changed. Open your appointment page for the latest."
    if key == "appointment_cancelled":
        return f"Your appointment {ref} has been cancelled."
    if key == "appointment_rescheduled":
        return f"Your appointment {ref} is now on {date_str} at {time_str} IST."
    return f"Update on your appointment {ref}."


def _due_query(db: Session, now: datetime):
    return (
        db.query(Notification)
        .filter(
            Notification.status == NotificationStatus.QUEUED.value,
            Notification.scheduled_at <= now,
            (Notification.next_retry_at.is_(None)) | (Notification.next_retry_at <= now),
        )
        .order_by(Notification.scheduled_at)
    )


def process_due_notifications(db: Session, *, now: datetime | None = None, limit: int = 100) -> dict:
    now = now or utcnow()
    provider = get_sms_provider()
    rows = _due_query(db, now).limit(limit).with_for_update(skip_locked=True).all()

    sent = failed = skipped = 0
    for n in rows:
        appt = db.get(Appointment, n.appointment_id) if n.appointment_id else None
        slot = db.get(AvailabilitySlot, appt.slot_id) if appt else None

        # Reminder gate (WF-005 step 4): only send if the appointment is still active.
        if n.notification_type == NotificationType.TELECONSULTATION_REMINDER.value and (
            appt is None or appt.status != AppointmentStatus.CONFIRMED.value
        ):
            n.status = NotificationStatus.CANCELLED.value
            skipped += 1
            continue

        body = render_body(n, appt, slot)
        try:
            message_id = provider.send(n.recipient_e164, body)
            n.status = NotificationStatus.SENT.value
            n.sent_at = now
            n.provider_message_id = message_id
            n.error_code = None
            n.error_message = None
            sent += 1
        except Exception as exc:  # transient provider failure
            n.attempt_count += 1
            n.error_code = "send_failed"
            n.error_message = str(exc)[:500]  # sanitised, truncated
            if n.attempt_count >= MAX_ATTEMPTS:
                n.status = NotificationStatus.FAILED.value
                n.failed_at = now
                failed += 1
            else:
                n.status = NotificationStatus.QUEUED.value
                n.next_retry_at = now + _backoff(n.attempt_count)

    db.commit()
    return {"sent": sent, "failed": failed, "skipped": skipped, "picked": len(rows)}


def retry_notification(db: Session, notification: Notification) -> Notification:
    """Requeue a failed notification for immediate reprocessing (idempotent on
    the same row / dedup key)."""
    notification.status = NotificationStatus.QUEUED.value
    notification.next_retry_at = None
    notification.attempt_count = 0
    notification.error_code = None
    notification.error_message = None
    return notification