import uuid
from datetime import datetime

from pydantic import EmailStr

from app.schemas.base import CamelModel


class ContactMessageIn(CamelModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    message: str


class ContactMessageOut(CamelModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: str | None = None
    message: str
    is_read: bool
    created_at: datetime
