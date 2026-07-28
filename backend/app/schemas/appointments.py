from datetime import datetime

from app.schemas.base import CamelModel
from app.schemas.slots import AvailableDateOut


class AppointmentAccessOut(CamelModel):
    """Everything the secure page shows. No internal IDs, no raw Zoom URL — the
    token in the URL is the only identifier the client needs."""

    booking_reference: str
    consultation_type: str
    status: str
    start_at: datetime
    end_at: datetime
    timezone: str
    instructions: str
    masked_mobile: str
    clinic_phone: str | None = None
    meeting_status: str | None = None
    cancellation_deadline: datetime
    reschedule_deadline: datetime
    can_cancel: bool
    can_reschedule: bool


class CancelOut(CamelModel):
    booking_reference: str
    status: str
    message: str


class RescheduleCurrentOut(CamelModel):
    booking_reference: str
    consultation_type: str
    start_at: datetime
    end_at: datetime


class RescheduleOptionsOut(CamelModel):
    timezone: str
    reschedule_deadline: datetime
    can_reschedule: bool
    current: RescheduleCurrentOut
    dates: list[AvailableDateOut]


class RescheduleIn(CamelModel):
    new_slot_id: str


class RescheduleOut(CamelModel):
    booking_reference: str
    status: str
    message: str
    start_at: datetime
    end_at: datetime
    meeting_status: str | None = None


class JoinStatusOut(CamelModel):
    state: str
    can_join: bool
    meeting_status: str | None = None
    join_opens_at: datetime | None = None
    message: str


class JoinOut(CamelModel):
    join_url: str
