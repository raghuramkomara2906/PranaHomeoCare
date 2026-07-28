from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(tags=["system"])


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict:
    """Liveness + DB readiness. Returns db="up" only if a trivial query
    succeeds, so the frontend's health check reflects real connectivity."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "up"
    except Exception:
        db_status = "down"
    return {"status": "ok", "db": db_status}