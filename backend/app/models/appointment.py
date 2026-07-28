import uuid
from datetime import datetime

from sqlalchemy import (
    CHAR,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import (
    MOBILE_E164_CHECK,
    AccessTokenPurpose,
    AppointmentStatus,
    MeetingProvider,
)
from app.models.mixins import CreatedAtMixin, TimestampMixin


class Appointment(Base, TimestampMixin):
    """The final confirmed appointment.

    "rescheduled" is not a status — a rescheduled appointment stays `confirmed`
    with a new slot_id and an appointment_event recording the move. A partial
    unique index (status='confirmed') guarantees at most one active appointment
    per slot while still letting a cancelled appointment free the slot for reuse.
    """

    __tablename__ = "appointments"
    __table_args__ = (
        CheckConstraint(MOBILE_E164_CHECK, name="ck_appt_mobile_e164"),
        Index(
            "uq_active_appointment_per_slot",
            "slot_id",
            unique=True,
            postgresql_where=text("status = 'confirmed'"),
        ),
        Index("ix_appt_slot", "slot_id"),
        Index("ix_appt_mobile", "mobile_e164"),
        Index("ix_appt_status", "status"),
        Index("ix_appt_doctor_status", "doctor_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    booking_reference: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    doctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("doctor_profiles.id"), nullable=False)
    slot_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("availability_slots.id"), nullable=False)
    booking_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("booking_requests.id"), unique=True, nullable=False
    )
    patient_name: Mapped[str] = mapped_column(String(150), nullable=False)
    mobile_e164: Mapped[str] = mapped_column(String(16), nullable=False)
    consultation_type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=AppointmentStatus.CONFIRMED.value, nullable=False
    )
    # Snapshot of the clinic number in effect at booking time, so the record
    # stays consistent even if the clinic number changes later.
    teleconsultation_phone_e164: Mapped[str | None] = mapped_column(String(16), nullable=True)
    sms_consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    terms_accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    terms_version: Mapped[str] = mapped_column(String(30), nullable=False)
    confirmed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    no_show_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reschedule_count: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)


class AppointmentAccessToken(Base, CreatedAtMixin):
    """Account-free secure access to one appointment. Only the SHA-256 hash of
    the token is stored; the raw token lives solely in the URL sent to the
    patient and is never persisted."""

    __tablename__ = "appointment_access_tokens"
    __table_args__ = (
        Index("ix_access_token_hash", "token_hash"),
        Index("ix_access_token_appointment", "appointment_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    appointment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("appointments.id"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(CHAR(64), unique=True, nullable=False)
    purpose: Mapped[str] = mapped_column(
        String(20), default=AccessTokenPurpose.MANAGE.value, nullable=False
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MeetingDetails(Base, TimestampMixin):
    """Zoom meeting info for a video consultation. The join URL is encrypted at
    rest, never returned by general appointment APIs, and only surfaced after
    join-window validation."""

    __tablename__ = "meeting_details"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    appointment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("appointments.id"), unique=True, nullable=False
    )
    provider: Mapped[str] = mapped_column(
        String(20), default=MeetingProvider.ZOOM.value, nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    join_url_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    meeting_identifier_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    set_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("admin_users.id"), nullable=True
    )
    set_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)