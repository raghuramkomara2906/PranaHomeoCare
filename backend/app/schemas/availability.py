import uuid
from datetime import date, datetime

from app.schemas.base import CamelModel


class TimeSlotOut(CamelModel):
    start_time_utc: datetime
    end_time_utc: datetime
    display_timezone: str


class WeeklyRuleOut(CamelModel):
    id: uuid.UUID
    weekday: int
    start_minute: int
    end_minute: int
    is_active: bool


class WeeklyRuleIn(CamelModel):
    weekday: int
    start_minute: int
    end_minute: int
    is_active: bool


class ExceptionOut(CamelModel):
    id: uuid.UUID
    date: date
    is_closed: bool
    start_minute: int | None = None
    end_minute: int | None = None
    note: str | None = None


class ExceptionIn(CamelModel):
    date: date
    is_closed: bool = True
    start_minute: int | None = None
    end_minute: int | None = None
    note: str | None = None
