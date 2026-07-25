import uuid

from app.models.user import UserRole
from app.schemas.base import CamelModel


class UserOut(CamelModel):
    id: uuid.UUID
    email: str
    full_name: str
    phone: str | None = None
    role: UserRole


class UserUpdateRequest(CamelModel):
    full_name: str | None = None
    phone: str | None = None
