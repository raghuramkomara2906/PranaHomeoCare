import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import TimestampMixin


class Notification(Base, TimestampMixin):
    """SMS outbox row. Booking/reschedule/cancel/link events write a row here
    inside the same transaction; a background worker picks up `queued` rows and
    sends them. This keeps a confirmed appointment valid even if the SMS
    provider is momentarily down (the send just retries).

    OTP delivery is tracked on otp_challenges instead — the plain OTP must never
    appear in a notification payload.
    """

    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notif_status_scheduled", "status", "scheduled_at"),
        Index("ix_notif_appointment_created", "appointment_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("appointments.id"), nullable=True
    )
    booking_request_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("booking_requests.id"), nullable=True
    )
    notification_type: Mapped[str] = mapped_column(String(40), nullable=False)
    recipient_e164: Mapped[str] = mapped_column(String(16), nullable=False)
    template_key: Mapped[str] = mapped_column(String(100), nullable=False)
    template_version: Mapped[str] = mapped_column(String(30), nullable=False)
    template_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    provider_message_id: Mapped[str | None] = mapped_column(String(150), nullable=True)
    attempt_count: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Sanitised on write — never store raw provider payloads / secrets here.
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    deduplication_key: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)