from datetime import datetime

from app.schemas.base import CamelModel


class PatientSummaryOut(CamelModel):
    full_name: str
    email: str
    phone: str
    appointment_count: int
    last_appointment_at: datetime
