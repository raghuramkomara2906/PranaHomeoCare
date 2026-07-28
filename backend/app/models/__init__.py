"""Version 1 data model — 12 tables, per Database Model Design doc.

Importing this package registers every table on Base.metadata (used by Alembic's
env.py for autogenerate).
"""

from app.models.admin import AdminUser, DoctorProfile
from app.models.appointment import (
    Appointment,
    AppointmentAccessToken,
    MeetingDetails,
)
from app.models.availability import AvailabilitySlot
from app.models.booking import BookingRequest, OtpChallenge
from app.models.clinic import ClinicSettings
from app.models.events import AppointmentEvent, AuditEvent
from app.models.notification import Notification

__all__ = [
    "ClinicSettings",
    "AdminUser",
    "DoctorProfile",
    "AvailabilitySlot",
    "BookingRequest",
    "OtpChallenge",
    "Appointment",
    "AppointmentAccessToken",
    "MeetingDetails",
    "Notification",
    "AppointmentEvent",
    "AuditEvent",
]