import uuid
from datetime import date as date_

from sqlalchemy import Boolean, Date, ForeignKey, Integer, SmallInteger, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WeeklyAvailabilityRule(Base):
    """Recurring practice hours — one row per weekday. This is what the
    practitioner edits under "Meeting Timings"."""

    __tablename__ = "weekly_availability_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    practitioner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    # 0 = Sunday .. 6 = Saturday, matching CLOSED_WEEKDAY in the frontend's
    # (now-retired) mock generator at src/data/availability.ts.
    weekday: Mapped[int] = mapped_column(SmallInteger)
    start_minute: Mapped[int] = mapped_column(Integer)
    end_minute: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class AvailabilityException(Base):
    """A one-off override for a specific date — a holiday (is_closed) or
    different hours just for that day (start/end override)."""

    __tablename__ = "availability_exceptions"
    __table_args__ = (UniqueConstraint("practitioner_id", "date"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    practitioner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    date: Mapped[date_] = mapped_column(Date)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=True)
    start_minute: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end_minute: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
