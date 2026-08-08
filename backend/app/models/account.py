import uuid
from datetime import datetime

from sqlalchemy import DateTime, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import CreatedAtMixin, TimestampMixin


class PatientAccount(Base, TimestampMixin):
    """Optional patient account.

    Identity is either a verified mobile number OR an email address:
      - Mobile accounts: mobile_e164 is the primary key for lookups.
                         Used when OTP SMS is available.
      - Email accounts:  email is the primary key for lookups.
                         Used as fallback when OTP is not available.

    Appointments are linked by mobile_e164 match (no patient_id on
    appointments) — email accounts without a mobile won't see booking
    history until they add a mobile number.

    Entirely separate from admin_users.
    """

    __tablename__ = "patient_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )

    # Mobile-based identity — primary when OTP is available
    mobile_e164: Mapped[str | None] = mapped_column(
        String(16), unique=True, nullable=True
    )

    # Email-based identity — fallback when OTP is not available
    email: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )

    # Display name — optional for both registration paths
    full_name: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    # Nullable — only set for mobile accounts that verified via OTP
    mobile_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
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
    """OTP challenge for account registration / password reset.

    Kept separate from the booking OtpChallenge (which is tied to a
    booking_request) so the fully-tested booking OTP path is untouched.
    Re-enabled when DLT registration is complete and SMS OTP is working.
    """

    __tablename__ = "account_otp_challenges"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    mobile_e164: Mapped[str] = mapped_column(String(16), nullable=False)
    purpose: Mapped[str] = mapped_column(
        String(30), nullable=False  # registration | password_reset
    )
    otp_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    attempts: Mapped[int] = mapped_column(
        SmallInteger, default=0, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )