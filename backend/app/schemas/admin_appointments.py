from datetime import datetime

from app.schemas.base import CamelModel


class AdminAppointmentListItem(CamelModel):
    id: str
    booking_reference: str
    patient_name: str
    mobile: str
    consultation_type: str
    status: str
    start_at: datetime
    end_at: datetime
    meeting_status: str | None = None
    last_notification_status: str | None = None


class AdminAppointmentListOut(CamelModel):
    timezone: str
    appointments: list[AdminAppointmentListItem]


class AdminEventOut(CamelModel):
    event_type: str
    actor_type: str
    created_at: datetime
    from_slot_id: str | None = None
    to_slot_id: str | None = None


class AdminNotificationOut(CamelModel):
    notification_type: str
    status: str
    scheduled_at: datetime
    sent_at: datetime | None = None
    error_code: str | None = None


class AdminMeetingOut(CamelModel):
    status: str | None = None
    has_link: bool = False
    join_url: str | None = None
    meeting_identifier: str | None = None


class AdminAppointmentDetailOut(CamelModel):
    id: str
    booking_reference: str
    patient_name: str
    mobile: str
    consultation_type: str
    status: str
    start_at: datetime
    end_at: datetime
    timezone: str
    slot_effective_status: str
    otp_verified: bool
    booking_created_at: datetime
    teleconsultation_phone: str | None = None
    meeting: AdminMeetingOut | None = None
    events: list[AdminEventOut]
    notifications: list[AdminNotificationOut]


class StatusPatchIn(CamelModel):
    status: str
    note: str | None = None


class StatusPatchOut(CamelModel):
    id: str
    status: str
    message: str


class MeetingPutIn(CamelModel):
    join_url: str
    meeting_identifier: str | None = None
    admin_note: str | None = None


class MeetingPutOut(CamelModel):
    id: str
    meeting_status: str
    replaced: bool
    message: str


class DoctorCancelIn(CamelModel):
    reason: str | None = None
    note: str | None = None


class DoctorRescheduleIn(CamelModel):
    new_slot_id: str


class DoctorActionOut(CamelModel):
    id: str
    status: str
    message: str
    start_at: datetime | None = None
    end_at: datetime | None = None
    meeting_status: str | None = None


class DashboardOut(CamelModel):
    timezone: str
    todays_appointments: int
    upcoming_appointments: int
    teleconsultations_today: int
    video_consultations_today: int
    video_links_pending: int
    available_slots: int
    cancelled_today: int
    sms_delivery_failures: int
