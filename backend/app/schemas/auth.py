from pydantic import EmailStr, Field

from app.schemas.base import CamelModel


class AdminLoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(max_length=72)


class DoctorProfileOut(CamelModel):
    id: str
    display_name: str
    qualification: str


class AdminMeOut(CamelModel):
    """The authenticated doctor/admin, as returned by POST /admin/auth/login
    and GET /admin/auth/me. No password material ever appears here."""

    id: str
    email: str
    role: str
    doctor: DoctorProfileOut | None = None