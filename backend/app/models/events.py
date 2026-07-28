import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import CreatedAtMixin


class AppointmentEvent(Base, CreatedAtMixin):
    """Append-only operational history for one appointment (booked, rescheduled,
    cancelled, meeting-link added/replaced/reviewed, notification failed/retried,
    ...). Rows are never updated or deleted."""

    __tablename__ = "appointment_events"
    __table_args__ = (Index("ix_appt_event_appointment_created", "appointment_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    appointment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("appointments.id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(40), nullable=False)
    actor_type: Mapped[str] = mapped_column(String(20), nullable=False)
    actor_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("admin_users.id"), nullable=True
    )
    from_slot_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    to_slot_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    # `metadata` is reserved on Declarative classes, so the attribute is
    # `event_metadata` while the DB column keeps the spec's name "metadata".
    event_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)


class AuditEvent(Base, CreatedAtMixin):
    """Sensitive admin/auth activity (logins, slot changes, cancellations,
    zoom-link changes, manual SMS retries). Must never contain passwords, plain
    OTPs, raw Zoom URLs, or auth tokens."""

    __tablename__ = "audit_events"
    __table_args__ = (
        Index("ix_audit_actor_created", "actor_admin_id", "created_at"),
        Index("ix_audit_entity", "entity_type", "entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    actor_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("admin_users.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    request_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    event_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)