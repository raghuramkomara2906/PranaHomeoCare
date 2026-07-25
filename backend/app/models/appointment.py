import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AppointmentStatus(str, enum.Enum):
    """Matches AppointmentStatus in src/lib/types/appointment.ts exactly."""

    SLOT_HELD = "SLOT_HELD"
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    RESCHEDULED = "RESCHEDULED"
    CANCELLED_BY_PATIENT = "CANCELLED_BY_PATIENT"
    CANCELLED_BY_PRACTITIONER = "CANCELLED_BY_PRACTITIONER"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"
    EXPIRED = "EXPIRED"


ACTIVE_APPOINTMENT_STATUSES = (
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.RESCHEDULED,
)


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    public_reference: Mapped[str] = mapped_column(String(32), unique=True, index=True)

    practitioner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id"))

    # Guest checkout — no patient account/FK, matches the booking flow's
    # deliberate no-account decision.
    patient_full_name: Mapped[str] = mapped_column(String(255))
    patient_email: Mapped[str] = mapped_column(String(255))
    patient_phone: Mapped[str] = mapped_column(String(64))
    patient_notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    start_time_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    display_timezone: Mapped[str] = mapped_column(String(64))

    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, name="appointment_status"),
        default=AppointmentStatus.CONFIRMED,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
