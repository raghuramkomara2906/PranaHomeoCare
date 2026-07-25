from typing import Literal

from app.schemas.base import CamelModel


class ServiceOut(CamelModel):
    id: str
    slug: str
    name: str
    short_description: str
    description: str
    duration_minutes: int
    price: float
    currency: str
    is_price_estimate: bool
    appropriate_for: list[str]
    included: list[str]
    is_online: Literal[True] = True
