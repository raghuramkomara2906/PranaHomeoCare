from app.schemas.base import CamelModel


class StatusBreakdownItem(CamelModel):
    status: str
    count: int


class MonthlyCountItem(CamelModel):
    month: str  # "YYYY-MM"
    count: int


class AnalyticsSummaryOut(CamelModel):
    total_appointments: int
    total_patients: int
    cancellation_rate: float
    status_breakdown: list[StatusBreakdownItem]
    patients_per_month: list[MonthlyCountItem]
