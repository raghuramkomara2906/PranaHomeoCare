import uuid
from datetime import datetime

from sqlalchemy import (
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
from app.models.enums import MOBILE_E164_CHECK, OtpPurpose
from app.models.mixins import CreatedAtMixin, TimestampMixin


class BookingRequest(Base, TimestampMixin):
    """The temporary booking session that exists *before* an appointment.

    Created when the patient requests an OTP; it holds the chosen slot for a
    short window (normally until the OTP expires). Exactly one active hold per
    slot is enforced by a partial unique index (statuses pending_otp /
    otp_verified). idempotency_key makes repeated submit clicks safe.
    """

    __tablename__ = "booking_requests"
    __table_args__ = (
        CheckConstraint(MOBILE_E164_CHECK, name="ck_booking_mobile_e164"),
        # Only one live hold may exist for a slot at a time.
        Index(
            "uq_active_booking_request_per_slot",
            "slot_id",
            unique=True,
            postgresql_where=text("status IN ('pending_otp', 'otp_verified')"),
        ),
        Index("ix_booking_slot_status", "slot_id", "status"),
        Index("ix_booking_mobile_created", "mobile_e164", "created_at"),
        Index("ix_booking_hold_expires", "hold_expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    slot_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("availability_slots.id"), nullable=False
    )
    consultation_type: Mapped[str] = mapped_column(String(30), nullable=False)
    patient_name: Mapped[str] = mapped_column(String(150), nullable=False)
    mobile_e164: Mapped[str] = mapped_column(String(16), nullable=False)
    sms_consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    terms_accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    terms_version: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    hold_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    idempotency_key: Mapped[uuid.UUID] = mapped_column(unique=True, nullable=False)
    # The appointment this request produced. FK-bearing side of the link is
    # Appointment.booking_request_id; this column stays a plain unique UUID to
    # avoid a circular FK at DDL time.
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(unique=True, nullable=True)


class OtpChallenge(Base, CreatedAtMixin):
    """OTP verification state for a booking request. The plain OTP is NEVER
    stored or logged — only a hash. A resend supersedes the prior active OTP."""

    __tablename__ = "otp_challenges"
    __table_args__ = (
        Index("ix_otp_booking_status", "booking_request_id", "status"),
        Index("ix_otp_mobile_created", "mobile_e164", "created_at"),
        Index("ix_otp_expires", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    booking_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("booking_requests.id"), nullable=False
    )
    mobile_e164: Mapped[str] = mapped_column(String(16), nullable=False)
    purpose: Mapped[str] = mapped_column(
        String(30), default=OtpPurpose.BOOKING.value, nullable=False
    )
    otp_hash: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempt_count: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(SmallInteger, default=5, nullable=False)
    resend_count: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    last_resend_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    provider_message_id: Mapped[str | None] = mapped_column(String(150), nullable=True)