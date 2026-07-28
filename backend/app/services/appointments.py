"""Secure patient appointment access: token resolution, the read view, and the
cancel (§11.3) and reschedule (§11.4) transactions.

Security invariants: the raw token is looked up by hash only; nothing is
returned for an invalid/revoked/expired token; and no internal IDs or raw Zoom
URLs ever leave this layer.
"""

from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import hash_secret
from app.models import (
    Appointment,
    AppointmentAccessToken,
    AppointmentEvent,
    AvailabilitySlot,
    ClinicSettings,
    MeetingDetails,
    Notification,
)
from app.models.enums import (
    ActorType,
    AppointmentEventType,
    AppointmentStatus,
    ConsultationType,
    MeetingStatus,
    NotificationStatus,
    NotificationType,
    SlotBaseStatus,
)
from app.services.booking import mask_mobile
from app.services.notifications import queue_notification
from app.services.slots import (
    future_available_slots,
    ist_day_bounds_utc,
    to_ist,
    today_ist,
    utcnow,
)


def _clinic(db: Session) -> ClinicSettings:
    clinic = db.query(ClinicSettings).first()
    if clinic is None:
        raise HTTPException(503, "Clinic is not configured.")
    return clinic


def _instructions(consultation_type: str) -> str:
    if consultation_type == ConsultationType.TELECONSULTATION.value:
        return "Please call the clinic at your scheduled appointment time."
    return (
        "The doctor will add your unique Zoom link before the appointment, and you'll "
        "receive an SMS when it's ready. The Join button opens shortly before your time."
    )


def _within_cutoff(now: datetime, start_at: datetime, cutoff_minutes: int) -> bool:
    return now <= start_at - timedelta(minutes=cutoff_minutes)


def _cancel_future_reminders(db: Session, appointment_id, now: datetime) -> None:
    (
        db.query(Notification)
        .filter(
            Notification.appointment_id == appointment_id,
            Notification.notification_type == NotificationType.TELECONSULTATION_REMINDER.value,
            Notification.status == NotificationStatus.QUEUED.value,
            Notification.scheduled_at > now,
        )
        .update(
            {Notification.status: NotificationStatus.CANCELLED.value},
            synchronize_session=False,
        )
    )


def resolve(db: Session, raw_token: str, *, lock_appointment: bool = False):
    """(appointment, token_row) for a valid token, else 404. Stamps last_used_at."""
    now = utcnow()
    token = (
        db.query(AppointmentAccessToken)
        .filter(AppointmentAccessToken.token_hash == hash_secret(raw_token))
        .first()
    )
    if (
        token is None
        or token.revoked_at is not None
        or (token.expires_at is not None and token.expires_at <= now)
    ):
        raise HTTPException(404, "This appointment link is invalid or no longer available.")

    if lock_appointment:
        appointment = (
            db.query(Appointment)
            .filter(Appointment.id == token.appointment_id)
            .with_for_update()
            .first()
        )
    else:
        appointment = db.get(Appointment, token.appointment_id)
    token.last_used_at = now
    return appointment, token


def _meeting_status(db: Session, appointment: Appointment) -> str | None:
    if appointment.consultation_type == ConsultationType.TELECONSULTATION.value:
        return None
    md = (
        db.query(MeetingDetails)
        .filter(MeetingDetails.appointment_id == appointment.id)
        .first()
    )
    return md.status if md else None


def access_view(db: Session, appointment: Appointment) -> dict:
    now = utcnow()
    clinic = _clinic(db)
    slot = db.get(AvailabilitySlot, appointment.slot_id)
    is_tele = appointment.consultation_type == ConsultationType.TELECONSULTATION.value
    cutoff = clinic.cancellation_cutoff_minutes
    eligible = appointment.status == AppointmentStatus.CONFIRMED.value and _within_cutoff(
        now, slot.start_at, cutoff
    )
    deadline = to_ist(slot.start_at - timedelta(minutes=cutoff))
    return {
        "booking_reference": appointment.booking_reference,
        "consultation_type": appointment.consultation_type,
        "status": appointment.status,
        "start_at": to_ist(slot.start_at),
        "end_at": to_ist(slot.end_at),
        "timezone": settings.default_timezone,
        "instructions": _instructions(appointment.consultation_type),
        "masked_mobile": mask_mobile(appointment.mobile_e164),
        "clinic_phone": appointment.teleconsultation_phone_e164 if is_tele else None,
        "meeting_status": _meeting_status(db, appointment),
        "cancellation_deadline": deadline,
        "reschedule_deadline": deadline,
        "can_cancel": eligible,
        "can_reschedule": eligible,
    }


# --- §11.3: cancel ---------------------------------------------------------
def perform_cancel(
    db: Session,
    appointment: Appointment,
    *,
    actor_type: str,
    actor_admin_id=None,
    enforce_cutoff: bool,
    reason: str | None = None,
    note: str | None = None,
) -> Appointment:
    """Core cancel transaction on an already-locked appointment. Does NOT commit
    (the caller does, so it can add its own audit row in the same transaction).
    Shared by the patient (cutoff-enforced) and doctor (override) entry points."""
    now = utcnow()
    if appointment.status == AppointmentStatus.CANCELLED.value:
        raise HTTPException(409, "This appointment has already been cancelled.")
    if appointment.status != AppointmentStatus.CONFIRMED.value:
        raise HTTPException(409, "This appointment can no longer be cancelled.")

    slot = (
        db.query(AvailabilitySlot)
        .filter(AvailabilitySlot.id == appointment.slot_id)
        .with_for_update()
        .first()
    )
    clinic = _clinic(db)
    if enforce_cutoff and not _within_cutoff(now, slot.start_at, clinic.cancellation_cutoff_minutes):
        raise HTTPException(
            409, "Online cancellation is no longer available. Please contact the clinic."
        )

    appointment.status = AppointmentStatus.CANCELLED.value
    appointment.cancelled_at = now
    # Releasing the slot is implicit: no confirmed appointment references it now.

    if appointment.consultation_type == ConsultationType.VIDEO_CONSULTATION.value:
        md = (
            db.query(MeetingDetails)
            .filter(MeetingDetails.appointment_id == appointment.id)
            .first()
        )
        if md:
            md.status = MeetingStatus.REVOKED.value

    _cancel_future_reminders(db, appointment.id, now)
    meta = {k: v for k, v in {"reason": reason, "note": note}.items() if v} or None
    db.add(
        AppointmentEvent(
            appointment_id=appointment.id,
            event_type=AppointmentEventType.APPOINTMENT_CANCELLED.value,
            actor_type=actor_type,
            actor_admin_id=actor_admin_id,
            from_slot_id=slot.id,
            event_metadata=meta,
        )
    )
    queue_notification(
        db,
        notification_type=NotificationType.APPOINTMENT_CANCELLED.value,
        recipient_e164=appointment.mobile_e164,
        template_key="appointment_cancelled",
        template_data={"bookingReference": appointment.booking_reference},
        scheduled_at=now,
        deduplication_key=f"appointment_cancelled:{appointment.id}",
        appointment_id=appointment.id,
    )
    return appointment


def cancel_appointment(db: Session, raw_token: str) -> Appointment:
    appointment, _ = resolve(db, raw_token, lock_appointment=True)
    perform_cancel(db, appointment, actor_type=ActorType.PATIENT.value, enforce_cutoff=True)
    db.commit()
    return appointment


# --- reschedule options ----------------------------------------------------
def reschedule_options(db: Session, raw_token: str, from_date: date | None = None, to_date: date | None = None) -> dict:
    now = utcnow()
    appointment, _ = resolve(db, raw_token)
    clinic = _clinic(db)
    slot = db.get(AvailabilitySlot, appointment.slot_id)
    cutoff = clinic.cancellation_cutoff_minutes
    can = appointment.status == AppointmentStatus.CONFIRMED.value and _within_cutoff(
        now, slot.start_at, cutoff
    )
    deadline = to_ist(slot.start_at - timedelta(minutes=cutoff))

    dates: list[dict] = []
    if can:
        window_from = from_date or today_ist()
        window_to = to_date or (window_from + timedelta(days=30))
        start_utc, _ = ist_day_bounds_utc(window_from)
        _, end_utc = ist_day_bounds_utc(window_to)
        counts: dict[date, int] = defaultdict(int)
        for s in future_available_slots(db, start_utc, end_utc):
            counts[to_ist(s.start_at).date()] += 1
        dates = [
            {"date": d.isoformat(), "available_count": counts[d]} for d in sorted(counts)
        ]

    db.commit()  # persist last_used_at
    return {
        "timezone": settings.default_timezone,
        "reschedule_deadline": deadline,
        "can_reschedule": can,
        "current": {
            "booking_reference": appointment.booking_reference,
            "consultation_type": appointment.consultation_type,
            "start_at": to_ist(slot.start_at),
            "end_at": to_ist(slot.end_at),
        },
        "dates": dates,
    }


# --- §11.4: reschedule -----------------------------------------------------
def perform_reschedule(
    db: Session,
    appointment: Appointment,
    new_slot_id: str,
    *,
    actor_type: str,
    actor_admin_id=None,
    enforce_cutoff: bool,
) -> Appointment:
    """Core reschedule transaction on an already-locked appointment. Flushes
    (so the unique indexes fire) but does NOT commit — the caller commits."""
    now = utcnow()
    if appointment.status != AppointmentStatus.CONFIRMED.value:
        raise HTTPException(409, "This appointment can no longer be rescheduled.")
    if str(appointment.slot_id) == new_slot_id:
        raise HTTPException(422, "Please choose a different appointment time.")

    clinic = _clinic(db)
    from_slot_id = appointment.slot_id

    # Lock both slots in a consistent (sorted) id order to avoid deadlocks.
    ordered_ids = sorted({str(from_slot_id), new_slot_id})
    locked = {
        sid: db.query(AvailabilitySlot)
        .filter(AvailabilitySlot.id == sid)
        .with_for_update()
        .first()
        for sid in ordered_ids
    }
    old_slot = locked[str(from_slot_id)]
    new_slot = locked.get(new_slot_id)

    if enforce_cutoff and not _within_cutoff(now, old_slot.start_at, clinic.cancellation_cutoff_minutes):
        raise HTTPException(
            409, "Online rescheduling is no longer available. Please contact the clinic."
        )

    new_unavailable = HTTPException(
        409, "That appointment time is no longer available. Please choose another."
    )
    if (
        new_slot is None
        or new_slot.deleted_at is not None
        or new_slot.base_status != SlotBaseStatus.AVAILABLE.value
        or new_slot.start_at <= now
    ):
        raise new_unavailable
    if (
        db.query(Appointment.id)
        .filter(
            Appointment.slot_id == new_slot.id,
            Appointment.status == AppointmentStatus.CONFIRMED.value,
        )
        .first()
        is not None
    ):
        raise new_unavailable

    appointment.slot_id = new_slot.id
    appointment.reschedule_count += 1
    count = appointment.reschedule_count

    is_tele = appointment.consultation_type == ConsultationType.TELECONSULTATION.value
    if not is_tele:
        md = (
            db.query(MeetingDetails)
            .filter(MeetingDetails.appointment_id == appointment.id)
            .first()
        )
        if md:
            md.status = MeetingStatus.REVIEW_REQUIRED.value  # doctor must re-confirm the link

    _cancel_future_reminders(db, appointment.id, now)
    if is_tele:
        remind_at = new_slot.start_at - timedelta(minutes=clinic.tele_reminder_minutes)
        if remind_at > now:
            queue_notification(
                db,
                notification_type=NotificationType.TELECONSULTATION_REMINDER.value,
                recipient_e164=appointment.mobile_e164,
                template_key="teleconsultation_reminder",
                template_data={"bookingReference": appointment.booking_reference},
                scheduled_at=remind_at,
                deduplication_key=f"tele_reminder:{appointment.id}:{count}",
                appointment_id=appointment.id,
            )

    db.add(
        AppointmentEvent(
            appointment_id=appointment.id,
            event_type=AppointmentEventType.APPOINTMENT_RESCHEDULED.value,
            actor_type=actor_type,
            actor_admin_id=actor_admin_id,
            from_slot_id=from_slot_id,
            to_slot_id=new_slot.id,
        )
    )
    queue_notification(
        db,
        notification_type=NotificationType.APPOINTMENT_RESCHEDULED.value,
        recipient_e164=appointment.mobile_e164,
        template_key="appointment_rescheduled",
        template_data={
            "bookingReference": appointment.booking_reference,
            "startAtUtc": new_slot.start_at.isoformat(),
        },
        scheduled_at=now,
        deduplication_key=f"appointment_rescheduled:{appointment.id}:{count}",
        appointment_id=appointment.id,
    )

    try:
        db.flush()  # surfaces the one-confirmed-per-slot unique index as a race guard
    except IntegrityError:
        db.rollback()
        raise new_unavailable
    return appointment


def reschedule_appointment(db: Session, raw_token: str, new_slot_id: str) -> Appointment:
    appointment, _ = resolve(db, raw_token, lock_appointment=True)
    perform_reschedule(
        db, appointment, new_slot_id, actor_type=ActorType.PATIENT.value, enforce_cutoff=True
    )
    db.commit()
    return appointment


# --- WF-004: video join window --------------------------------------------
def _video_window(clinic, slot):
    from datetime import timedelta

    open_at = slot.start_at - timedelta(minutes=clinic.video_join_early_minutes)
    close_at = slot.end_at + timedelta(minutes=settings.video_join_grace_minutes)
    return open_at, close_at


def join_status(db: Session, raw_token: str) -> dict:
    now = utcnow()
    appointment, _ = resolve(db, raw_token)
    if appointment.consultation_type != ConsultationType.VIDEO_CONSULTATION.value:
        raise HTTPException(400, "This is not a video consultation.")

    clinic = _clinic(db)
    slot = db.get(AvailabilitySlot, appointment.slot_id)

    def result(state, can_join, message, join_opens_at=None, meeting_status=None):
        db.commit()  # persist last_used_at
        return {
            "state": state,
            "can_join": can_join,
            "meeting_status": meeting_status,
            "join_opens_at": join_opens_at,
            "message": message,
        }

    if appointment.status != AppointmentStatus.CONFIRMED.value:
        return result("unavailable", False, "This appointment is no longer active.")

    md = db.query(MeetingDetails).filter_by(appointment_id=appointment.id).first()
    if md is None or md.status != MeetingStatus.READY.value:
        return result(
            "pending", False,
            "Your appointment is confirmed. The meeting link has not been added yet — "
            "you'll receive an SMS when it's ready.",
            meeting_status=md.status if md else None,
        )

    open_at, close_at = _video_window(clinic, slot)
    if now < open_at:
        return result(
            "too_early", False,
            f"Your meeting link is ready. Join access opens at {to_ist(open_at):%-I:%M %p} IST.",
            join_opens_at=to_ist(open_at), meeting_status=md.status,
        )
    if now <= close_at:
        return result("available", True, "Your video consultation is ready to join.",
                      meeting_status=md.status)
    return result("ended", False, "The joining window for this consultation has ended.",
                  meeting_status=md.status)


def join(db: Session, raw_token: str) -> dict:
    """Final gate: returns the decrypted Zoom URL only after re-validating every
    condition. This is the sole place the raw URL leaves the backend."""
    from app.core.crypto import decrypt_secret

    now = utcnow()
    appointment, _ = resolve(db, raw_token, lock_appointment=True)
    if appointment.consultation_type != ConsultationType.VIDEO_CONSULTATION.value:
        raise HTTPException(400, "This is not a video consultation.")
    if appointment.status != AppointmentStatus.CONFIRMED.value:
        raise HTTPException(409, "This appointment is no longer active.")

    clinic = _clinic(db)
    slot = db.get(AvailabilitySlot, appointment.slot_id)
    md = db.query(MeetingDetails).filter_by(appointment_id=appointment.id).first()
    if md is None or md.status != MeetingStatus.READY.value or not md.join_url_encrypted:
        raise HTTPException(409, "The meeting link is not ready yet.")

    open_at, close_at = _video_window(clinic, slot)
    if now < open_at:
        raise HTTPException(409, "Join access has not opened yet.")
    if now > close_at:
        raise HTTPException(409, "The joining window for this consultation has ended.")

    url = decrypt_secret(md.join_url_encrypted)
    db.commit()  # persist last_used_at
    return {"join_url": url}