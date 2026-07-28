"""Shared column mixins.

Every table stores time in UTC (the engine pins the session to UTC in
app.database); schedules are *evaluated and displayed* in Asia/Kolkata by the
service layer, never by the database. TIMESTAMPTZ everywhere keeps that honest.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CreatedAtMixin:
    """For append-only / immutable rows (events, tokens, OTP challenges)."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class TimestampMixin(CreatedAtMixin):
    """For mutable rows that also track their last change."""

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )