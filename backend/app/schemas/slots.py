from datetime import datetime

from app.schemas.base import CamelModel


class SlotCreateIn(CamelModel):
    """Doctor supplies the start; end is server-computed as start + 30 min.
    A naive datetime is read as Asia/Kolkata."""

    start_at: datetime


class SlotPatchIn(CamelModel):
    """Block or unblock a slot. base_status is 'blocked' or 'available'."""

    base_status: str
    blocked_reason: str | None = None


class AdminSlotOut(CamelModel):
    id: str
    start_at: datetime
    end_at: datetime
    base_status: str
    effective_status: str
    blocked_reason: str | None = None


class AdminSlotListOut(CamelModel):
    timezone: str
    slots: list[AdminSlotOut]


class PublicSlotOut(CamelModel):
    id: str
    start_at: datetime
    end_at: datetime


class PublicSlotListOut(CamelModel):
    date: str
    timezone: str
    slots: list[PublicSlotOut]


class AvailableDateOut(CamelModel):
    date: str
    available_count: int


class AvailableDatesOut(CamelModel):
    timezone: str
    dates: list[AvailableDateOut]