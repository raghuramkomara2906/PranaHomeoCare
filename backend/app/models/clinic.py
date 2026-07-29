import uuid

from sqlalchemy import Boolean, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import TimestampMixin


class ClinicSettings(Base, TimestampMixin):
    """Application-wide clinic + scheduling configuration.

    Version 1 keeps exactly one active row. Every timing rule (slot length,
    cancellation cutoff, video early-join, tele reminder) is read from here —
    never hard-coded in FastAPI or React — so the practice can be re-tuned
    without a deploy.
    """

    __tablename__ = "clinic_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    clinic_name: Mapped[str] = mapped_column(String(150), nullable=False)
    clinic_phone_e164: Mapped[str] = mapped_column(String(16), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata", nullable=False)
    slot_duration_minutes: Mapped[int] = mapped_column(SmallInteger, default=30, nullable=False)
    cancellation_cutoff_minutes: Mapped[int] = mapped_column(
        SmallInteger, default=1440, nullable=False
    )
    reschedule_cutoff_minutes: Mapped[int] = mapped_column(
        SmallInteger, default=180, nullable=False
    )
    video_join_early_minutes: Mapped[int] = mapped_column(
        SmallInteger, default=5, nullable=False
    )
    tele_reminder_minutes: Mapped[int] = mapped_column(
        SmallInteger, default=180, nullable=False
    )
    booking_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    current_terms_version: Mapped[str] = mapped_column(String(30), nullable=False)
