from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.deps import get_current_admin
from app.database import get_db
from app.models import AdminUser, AuditEvent, Notification
from app.models.enums import NotificationStatus
from app.schemas.notifications import (
    AuditEventListOut,
    AuditEventOut,
    NotificationListOut,
    NotificationOut,
    NotificationRetryOut,
)
from app.services.booking import mask_mobile
from app.services.notification_worker import retry_notification

router = APIRouter(prefix="/admin", tags=["admin-notifications"])


def _notification_out(n: Notification) -> NotificationOut:
    return NotificationOut(
        id=str(n.id),
        notification_type=n.notification_type,
        status=n.status,
        recipient_masked=mask_mobile(n.recipient_e164),
        scheduled_at=n.scheduled_at,
        sent_at=n.sent_at,
        attempt_count=n.attempt_count,
        error_code=n.error_code,
        appointment_id=str(n.appointment_id) if n.appointment_id else None,
    )


@router.get("/notifications", response_model=NotificationListOut)
def list_notifications(
    status: str | None = Query(default=None),
    notification_type: str | None = Query(default=None, alias="type"),
    appointment_id: str | None = Query(default=None, alias="appointmentId"),
    limit: int = Query(default=100, ge=1, le=500),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> NotificationListOut:
    query = db.query(Notification)
    if status:
        query = query.filter(Notification.status == status)
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    if appointment_id:
        query = query.filter(Notification.appointment_id == appointment_id)
    rows = query.order_by(Notification.scheduled_at.desc()).limit(limit).all()
    return NotificationListOut(notifications=[_notification_out(n) for n in rows])


@router.post("/notifications/{notification_id}/retry", response_model=NotificationRetryOut)
def retry(
    notification_id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> NotificationRetryOut:
    n = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .with_for_update()
        .first()
    )
    if n is None:
        raise HTTPException(404, "Notification not found.")
    if n.status != NotificationStatus.FAILED.value:
        raise HTTPException(409, "Only a failed notification can be retried.")
    retry_notification(db, n)
    record_audit(
        db, action="sms_manually_retried", actor_admin_id=admin.id,
        entity_type="notification", entity_id=n.id,
    )
    db.commit()
    return NotificationRetryOut(
        id=str(n.id), status=n.status, message="Notification requeued for delivery."
    )


@router.get("/audit-events", response_model=AuditEventListOut)
def list_audit_events(
    action: str | None = Query(default=None),
    entity_type: str | None = Query(default=None, alias="entityType"),
    limit: int = Query(default=100, ge=1, le=500),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AuditEventListOut:
    query = db.query(AuditEvent)
    if action:
        query = query.filter(AuditEvent.action == action)
    if entity_type:
        query = query.filter(AuditEvent.entity_type == entity_type)
    rows = query.order_by(AuditEvent.created_at.desc()).limit(limit).all()
    return AuditEventListOut(
        events=[
            AuditEventOut(
                id=str(e.id),
                action=e.action,
                actor_admin_id=str(e.actor_admin_id) if e.actor_admin_id else None,
                entity_type=e.entity_type,
                entity_id=str(e.entity_id) if e.entity_id else None,
                ip_address=e.ip_address,
                created_at=e.created_at,
                metadata=e.event_metadata,
            )
            for e in rows
        ]
    )