from pydantic import EmailStr, Field

from app.schemas.base import CamelModel
from app.schemas.user import UserOut


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class LoginResponse(CamelModel):
    user: UserOut


class RegisterRequest(CamelModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
