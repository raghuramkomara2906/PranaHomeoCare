"""Canonical value sets for every VARCHAR status/type column.

These mirror section 8 ("Status model summary") of the Database Model Design
doc verbatim. Columns are stored as plain VARCHAR (not PG ENUM types) so the
value sets can evolve without an enum-altering migration; these classes are the
single source of truth the service layer validates against.
"""

import enum


class ConsultationType(str, enum.Enum):
    TELECONSULTATION = "teleconsultation"
    VIDEO_CONSULTATION = "video_consultation"


class SlotBaseStatus(str, enum.Enum):
    AVAILABLE = "available"
    BLOCKED = "blocked"
    ARCHIVED = "archived"


class EffectiveSlotStatus(str, enum.Enum):
    """Never stored — derived by the API from base_status + active holds/appts."""

    AVAILABLE = "available"
    HELD = "held"
    BOOKED = "booked"
    BLOCKED = "blocked"


class BookingRequestStatus(str, enum.Enum):
    PENDING_OTP = "pending_otp"
    OTP_VERIFIED = "otp_verified"
    COMPLETED = "completed"
    EXPIRED = "expired"
    ABANDONED = "abandoned"


# The two states that constitute an *active* hold on a slot.
ACTIVE_BOOKING_REQUEST_STATUSES = (
    BookingRequestStatus.PENDING_OTP.value,
    BookingRequestStatus.OTP_VERIFIED.value,
)


class OtpStatus(str, enum.Enum):
    ISSUED = "issued"
    VERIFIED = "verified"
    EXPIRED = "expired"
    LOCKED = "locked"
    SUPERSEDED = "superseded"


class OtpPurpose(str, enum.Enum):
    BOOKING = "booking"


class AppointmentStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class AccessTokenPurpose(str, enum.Enum):
    MANAGE = "manage"


class MeetingProvider(str, enum.Enum):
    ZOOM = "zoom"


class MeetingStatus(str, enum.Enum):
    PENDING = "pending"
    READY = "ready"
    REVIEW_REQUIRED = "review_required"
    REVOKED = "revoked"


class NotificationType(str, enum.Enum):
    BOOKING_CONFIRMATION = "booking_confirmation"
    TELECONSULTATION_REMINDER = "teleconsultation_reminder"
    VIDEO_LINK_READY = "video_link_ready"
    VIDEO_LINK_UPDATED = "video_link_updated"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"
    APPOINTMENT_CANCELLED = "appointment_cancelled"


class NotificationStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AppointmentEventType(str, enum.Enum):
    APPOINTMENT_BOOKED = "appointment_booked"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    APPOINTMENT_COMPLETED = "appointment_completed"
    APPOINTMENT_NO_SHOW = "appointment_no_show"
    MEETING_LINK_ADDED = "meeting_link_added"
    MEETING_LINK_REPLACED = "meeting_link_replaced"
    MEETING_LINK_REVIEWED = "meeting_link_reviewed"
    NOTIFICATION_FAILED = "notification_failed"
    NOTIFICATION_RETRIED = "notification_retried"


class ActorType(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    SYSTEM = "system"


class AdminRole(str, enum.Enum):
    DOCTOR_ADMIN = "doctor_admin"


# Reused CHECK expression: Indian mobile numbers in E.164 form (+91, 6-9 lead).
MOBILE_E164_CHECK = r"mobile_e164 ~ '^\+91[6-9][0-9]{9}$'"