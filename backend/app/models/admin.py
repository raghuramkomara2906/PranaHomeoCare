import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import CITEXT, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import AdminRole
from app.models.mixins import TimestampMixin


class AdminUser(Base, TimestampMixin):
    """Doctor-dashboard login. Authentication only — public/operational profile
    lives separately in DoctorProfile so credentials and displayed info never
    share a row."""

    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # CITEXT => case-insensitive uniqueness without lower() gymnastics.
    email: Mapped[str] = mapped_column(CITEXT, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(
        String(30), default=AdminRole.DOCTOR_ADMIN.value, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    password_changed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class DoctorProfile(Base, TimestampMixin):
    """Public + operational doctor info. Version 1 has one doctor, but keeping a
    doctor_id on availability/appointments (FK'd here) makes multi-doctor
    possible later without a redesign."""

    __tablename__ = "doctor_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    admin_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("admin_users.id"), unique=True, nullable=False
    )
    display_name: Mapped[str] = mapped_column(String(150), nullable=False)
    qualification: Mapped[str] = mapped_column(String(250), nullable=False)
    biography: Mapped[str | None] = mapped_column(Text, nullable=True)
    languages: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    profile_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)