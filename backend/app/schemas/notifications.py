from datetime import datetime

from app.schemas.base import CamelModel


class NotificationOut(CamelModel):
    id: str
    notification_type: str
    status: str
    recipient_masked: str
    scheduled_at: datetime
    sent_at: datetime | None = None
    attempt_count: int
    error_code: str | None = None
    appointment_id: str | None = None


class NotificationListOut(CamelModel):
    notifications: list[NotificationOut]


class NotificationRetryOut(CamelModel):
    id: str
    status: str
    message: str


class AuditEventOut(CamelModel):
    id: str
    action: str
    actor_admin_id: str | None = None
    entity_type: str | None = None
    entity_id: str | None = None
    ip_address: str | None = None
    created_at: datetime
    metadata: dict | None = None


class AuditEventListOut(CamelModel):
    events: list[AuditEventOut]