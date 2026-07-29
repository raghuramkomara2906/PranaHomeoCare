import uuid
from datetime import datetime

from sqlalchemy import DateTime, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import CreatedAtMixin, TimestampMixin


class PatientAccount(Base, TimestampMixin):
    """Optional patient account (Feature 11). Identity is the verified mobile
    number, which is also the key that links the account to its appointments
    (there is no patient_id on appointments — ownership is by mobile match).
    Entirely separate from admin_users."""

    __tablename__ = "patient_accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    mobile_e164: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    mobile_verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    failed_login_count: Mapped[int] = mapped_column(
        SmallInteger, default=0, nullable=False
    )
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class AccountOtpChallenge(Base, CreatedAtMixin):
    """OTP challenge for account registration / password reset. Kept separate
    from the booking OtpChallenge (which is tied to a booking_request) so the
    fully-tested booking OTP path is untouched."""

    __tablename__ = "account_otp_challenges"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    mobile_e164: Mapped[str] = mapped_column(String(16), nullable=False)
    purpose: Mapped[str] = mapped_column(String(30), nullable=False)  # registration|password_reset
    otp_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempts: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
