import uuid

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType


def notify(
    db: Session,
    recipient_email: str,
    notification_type: NotificationType,
    message: str,
    appointment_id: uuid.UUID | None = None,
) -> None:
    """Queues a notification on the given session — the caller commits it
    together with whatever appointment change triggered it, so the two never
    drift out of sync."""
    db.add(
        Notification(
            recipient_email=recipient_email,
            type=notification_type,
            message=message,
            appointment_id=appointment_id,
        )
    )
