from sqlalchemy import Boolean, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Service(Base):
    """Mirrors src/lib/types/service.ts exactly — the frontend Service shape."""

    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    short_description: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(String(2000))
    duration_minutes: Mapped[int] = mapped_column(Integer)
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    is_price_estimate: Mapped[bool] = mapped_column(Boolean, default=True)
    appropriate_for: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    included: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
