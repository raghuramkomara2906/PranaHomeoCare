import uuid
from datetime import datetime

from app.models.notification import NotificationType
from app.schemas.base import CamelModel


class NotificationOut(CamelModel):
    id: uuid.UUID
    type: NotificationType
    message: str
    appointment_id: uuid.UUID | None = None
    is_read: bool
    created_at: datetime
