"""Transactional-outbox helper. Callers add a queued notification row inside the
same DB transaction as the business change; a background worker (later slice)
picks up 'queued' rows and sends them. The unique deduplication_key makes the
whole thing idempotent under retries."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Notification
from app.models.enums import NotificationStatus


def queue_notification(
    db: Session,
    *,
    notification_type: str,
    recipient_e164: str,
    template_key: str,
    template_data: dict,
    scheduled_at: datetime,
    deduplication_key: str,
    template_version: str = "v1",
    appointment_id=None,
    booking_request_id=None,
) -> Notification:
    notification = Notification(
        notification_type=notification_type,
        recipient_e164=recipient_e164,
        template_key=template_key,
        template_version=template_version,
        template_data=template_data,
        scheduled_at=scheduled_at,
        status=NotificationStatus.QUEUED.value,
        deduplication_key=deduplication_key,
        appointment_id=appointment_id,
        booking_request_id=booking_request_id,
    )
    db.add(notification)
    return notification