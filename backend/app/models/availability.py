import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    literal_column,
    text,
)
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import SlotBaseStatus
from app.models.mixins import TimestampMixin


class AvailabilitySlot(Base, TimestampMixin):
    """One individual 30-minute slot created by the doctor.

    "booked" is deliberately NOT a base_status. A slot's effective state is
    derived: blocked (base_status) > booked (active confirmed appointment) >
    held (active unexpired booking_request) > available. That avoids two
    conflicting sources of truth for whether a slot is taken.
    """

    __tablename__ = "availability_slots"
    __table_args__ = (
        CheckConstraint("end_at > start_at", name="ck_slot_end_after_start"),
        CheckConstraint(
            "end_at = start_at + interval '30 minutes'",
            name="ck_slot_is_30_minutes",
        ),
        # No two live slots for the same doctor may overlap. Requires the
        # btree_gist extension (for the '=' on doctor_id inside a gist index).
        ExcludeConstraint(
            (literal_column("doctor_id"), "="),
            (literal_column("tstzrange(start_at, end_at, '[)')"), "&&"),
            name="ex_no_overlapping_slots",
            using="gist",
            where=text("deleted_at IS NULL"),
        ),
        Index("ix_slots_doctor_start", "doctor_id", "start_at"),
        Index("ix_slots_status_start", "base_status", "start_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("doctor_profiles.id"), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    base_status: Mapped[str] = mapped_column(
        String(20), default=SlotBaseStatus.AVAILABLE.value, nullable=False
    )
    blocked_reason: Mapped[str | None] = mapped_column(String(250), nullable=True)
    created_by_admin_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("admin_users.id"), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)