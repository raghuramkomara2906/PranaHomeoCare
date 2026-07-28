from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.audit import record_audit
from app.core.deps import get_current_admin, get_the_doctor
from app.database import get_db
from app.models import AdminUser, AvailabilitySlot, DoctorProfile
from app.models.enums import EffectiveSlotStatus, SlotBaseStatus
from app.schemas.slots import (
    AdminSlotListOut,
    AdminSlotOut,
    SlotCreateIn,
    SlotPatchIn,
)
from app.services.slots import (
    compute_effective_statuses,
    ist_day_bounds_utc,
    to_ist,
    to_utc,
    today_ist,
    utcnow,
)

router = APIRouter(prefix="/admin/slots", tags=["admin-slots"])


def _out(slot: AvailabilitySlot, effective: str) -> AdminSlotOut:
    return AdminSlotOut(
        id=str(slot.id),
        start_at=to_ist(slot.start_at),
        end_at=to_ist(slot.end_at),
        base_status=slot.base_status,
        effective_status=effective,
        blocked_reason=slot.blocked_reason,
    )


def _get_or_404(db: Session, slot_id: str) -> AvailabilitySlot:
    slot = db.get(AvailabilitySlot, slot_id)
    if slot is None or slot.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Slot not found.")
    return slot


@router.post("", response_model=AdminSlotOut, status_code=status.HTTP_201_CREATED)
def create_slot(
    body: SlotCreateIn,
    admin: AdminUser = Depends(get_current_admin),
    doctor: DoctorProfile = Depends(get_the_doctor),
    db: Session = Depends(get_db),
) -> AdminSlotOut:
    start_utc = to_utc(body.start_at)
    if start_utc <= utcnow():
        raise HTTPException(status_code=422, detail="Slot must be in the future.")

    slot = AvailabilitySlot(
        doctor_id=doctor.id,
        start_at=start_utc,
        end_at=start_utc + timedelta(minutes=settings.slot_duration_minutes),
        base_status=SlotBaseStatus.AVAILABLE.value,
        created_by_admin_id=admin.id,
    )
    db.add(slot)
    try:
        db.flush()  # trips the 30-min CHECK / overlap EXCLUDE if violated
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This slot overlaps an existing slot for that time.",
        )

    record_audit(
        db, action="slot_created", actor_admin_id=admin.id,
        entity_type="availability_slot", entity_id=slot.id,
        metadata={"start_at": start_utc.isoformat()},
    )
    db.commit()
    return _out(slot, EffectiveSlotStatus.AVAILABLE.value)


@router.get("", response_model=AdminSlotListOut)
def list_slots(
    from_date: date | None = Query(default=None, alias="fromDate"),
    to_date: date | None = Query(default=None, alias="toDate"),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminSlotListOut:
    if from_date is None:
        from_date = today_ist()
    if to_date is None:
        to_date = from_date + timedelta(days=30)
    start_utc, _ = ist_day_bounds_utc(from_date)
    _, end_utc = ist_day_bounds_utc(to_date)

    slots = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.deleted_at.is_(None),
            AvailabilitySlot.start_at >= start_utc,
            AvailabilitySlot.start_at < end_utc,
        )
        .order_by(AvailabilitySlot.start_at)
        .all()
    )
    effective = compute_effective_statuses(db, slots)
    return AdminSlotListOut(
        timezone=settings.default_timezone,
        slots=[_out(s, effective[s.id]) for s in slots],
    )


@router.patch("/{slot_id}", response_model=AdminSlotOut)
def patch_slot(
    slot_id: str,
    body: SlotPatchIn,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminSlotOut:
    slot = _get_or_404(db, slot_id)
    if slot.start_at <= utcnow():
        raise HTTPException(status_code=409, detail="Past slots are read-only.")

    target = body.base_status
    if target not in (SlotBaseStatus.AVAILABLE.value, SlotBaseStatus.BLOCKED.value):
        raise HTTPException(status_code=422, detail="baseStatus must be 'available' or 'blocked'.")

    effective = compute_effective_statuses(db, [slot])[slot.id]

    if target == SlotBaseStatus.BLOCKED.value:
        if effective != EffectiveSlotStatus.AVAILABLE.value:
            raise HTTPException(
                status_code=409,
                detail="Only an available slot can be blocked "
                f"(current status: {effective}).",
            )
        slot.base_status = SlotBaseStatus.BLOCKED.value
        slot.blocked_reason = body.blocked_reason
        action = "slot_blocked"
    else:  # unblock
        if slot.base_status != SlotBaseStatus.BLOCKED.value:
            raise HTTPException(status_code=409, detail="Slot is not blocked.")
        slot.base_status = SlotBaseStatus.AVAILABLE.value
        slot.blocked_reason = None
        action = "slot_unblocked"

    record_audit(db, action=action, actor_admin_id=admin.id,
                 entity_type="availability_slot", entity_id=slot.id)
    db.commit()
    effective = compute_effective_statuses(db, [slot])[slot.id]
    return _out(slot, effective)


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(
    slot_id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Response:
    slot = _get_or_404(db, slot_id)
    if slot.start_at <= utcnow():
        raise HTTPException(status_code=409, detail="Past slots are read-only.")

    effective = compute_effective_statuses(db, [slot])[slot.id]
    if effective in (EffectiveSlotStatus.BOOKED.value, EffectiveSlotStatus.HELD.value):
        raise HTTPException(
            status_code=409,
            detail="A booked or held slot cannot be deleted. Cancel the appointment first.",
        )

    slot.deleted_at = utcnow()
    slot.base_status = SlotBaseStatus.ARCHIVED.value
    record_audit(db, action="slot_deleted", actor_admin_id=admin.id,
                 entity_type="availability_slot", entity_id=slot.id)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)