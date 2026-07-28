from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.database import get_db
from app.models import AdminUser
from app.schemas.admin_appointments import DashboardOut
from app.services.admin_appointments import dashboard_summary

router = APIRouter(prefix="/admin", tags=["admin-dashboard"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> DashboardOut:
    return DashboardOut(**dashboard_summary(db))