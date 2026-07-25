from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_the_practitioner
from app.core.scheduling import compute_available_slots
from app.database import get_db
from app.models.service import Service
from app.models.user import User
from app.schemas.availability import TimeSlotOut

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get("", response_model=list[TimeSlotOut])
def get_availability(
    service_id: str,
    date: date,
    db: Session = Depends(get_db),
    practitioner: User = Depends(get_the_practitioner),
):
    service = db.get(Service, service_id)
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")

    slots = compute_available_slots(db, practitioner.id, service.duration_minutes, date)
    return slots
