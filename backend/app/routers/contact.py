from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contact_message import ContactMessage
from app.schemas.contact import ContactMessageIn, ContactMessageOut

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactMessageOut, status_code=status.HTTP_201_CREATED)
def submit_contact_message(payload: ContactMessageIn, db: Session = Depends(get_db)):
    message = ContactMessage(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        message=payload.message,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
