"""Doctor-facing appointment operations: list, detail, status transitions, and
the Zoom-link workflow (§11.5). Admin endpoints are authenticated, so they may
return the appointment id and full mobile — unlike the patient token pages."""

from datetime import date, datetime
from urllib.parse import urlparse

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import settings
from app.core.audit import record_audit
from app.core.crypto import decrypt_secret, encrypt_secret
from app.models import (
    AdminUser,
    Appointment,
    AppointmentEvent,
    AvailabilitySlot,
    BookingRequest,
    MeetingDetails,
    Notification,
    OtpChallenge,
)
from app.models.enums import (
    ActorType,
    AppointmentEventType,
    AppointmentStatus,
    ConsultationType,
    MeetingStatus,
    NotificationType,
    OtpStatus,
)
from app.services.slots import compute_effective_statuses, ist_day_bounds_utc, to_ist, utcnow


def _slot(db: Session, appointment: Appointment) -> AvailabilitySlot:
    return db.get(AvailabilitySlot, appointment.slot_id)


def _validate_zoom_url(url: str) -> str:
    url = (url or "").strip()
    if not url:
        raise HTTPException(422, "The Zoom meeting URL is required.")
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or not (host == "zoom.us" or host.endswith(".zoom.us")):
        raise HTTPException(422, "The link must be a valid https Zoom URL (a zoom.us domain).")
    return url


# --- list ------------------------------------------------------------------
def list_appointments(
    db: Session,
    *,
    from_date: date | None,
    to_date: date | None,
    consultation_type: str | None,
    status: str | None,
    meeting_status: str | None,
    q: str | None,
) -> dict:
    query = (
        db.query(Appointment, AvailabilitySlot, MeetingDetails)
        .join(AvailabilitySlot, Appointment.slot_id == AvailabilitySlot.id)
        .outerjoin(MeetingDetails, MeetingDetails.appointment_id == Appointment.id)
    )
    if from_date is not None:
        start_utc, _ = ist_day_bounds_utc(from_date)
        query = query.filter(AvailabilitySlot.start_at >= start_utc)
    if to_date is not None:
        _, end_utc = ist_day_bounds_utc(to_date)
        query = query.filter(AvailabilitySlot.start_at < end_utc)
    if consultation_type:
        query = query.filter(Appointment.consultation_type == consultation_type)
    if status:
        query = query.filter(Appointment.status == status)
    if meeting_status:
        query = query.filter(MeetingDetails.status == meeting_status)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Appointment.booking_reference.ilike(like),
                Appointment.patient_name.ilike(like),
                Appointment.mobile_e164.ilike(like),
            )
        )
    rows = query.order_by(AvailabilitySlot.start_at).all()

    # latest notification status per appointment (batch, no N+1)
    appt_ids = [a.id for a, _, _ in rows]
    last_status: dict = {}
    if appt_ids:
        notifs = (
            db.query(Notification)
            .filter(Notification.appointment_id.in_(appt_ids))
            .order_by(Notification.created_at)
            .all()
        )
        for n in notifs:
            last_status[n.appointment_id] = n.status

    items = [
        {
            "id": str(appt.id),
            "booking_reference": appt.booking_reference,
            "patient_name": appt.patient_name,
            "mobile": appt.mobile_e164,
            "consultation_type": appt.consultation_type,
            "status": appt.status,
            "start_at": to_ist(slot.start_at),
            "end_at": to_ist(slot.end_at),
            "meeting_status": md.status if md else None,
            "last_notification_status": last_status.get(appt.id),
        }
        for appt, slot, md in rows
    ]
    return {"timezone": settings.default_timezone, "appointments": items}


# --- detail ----------------------------------------------------------------
def appointment_detail(db: Session, appointment_id: str) -> dict:
    appt = db.get(Appointment, appointment_id)
    if appt is None:
        raise HTTPException(404, "Appointment not found.")
    slot = _slot(db, appt)
    is_video = appt.consultation_type == ConsultationType.VIDEO_CONSULTATION.value

    meeting = None
    if is_video:
        md = db.query(MeetingDetails).filter_by(appointment_id=appt.id).first()
        if md:
            meeting = {
                "status": md.status,
                "has_link": md.join_url_encrypted is not None,
                "join_url": decrypt_secret(md.join_url_encrypted) if md.join_url_encrypted else None,
                "meeting_identifier": decrypt_secret(md.meeting_identifier_encrypted)
                if md.meeting_identifier_encrypted
                else None,
            }
        else:
            meeting = {"status": None, "has_link": False, "join_url": None, "meeting_identifier": None}

    booking = db.get(BookingRequest, appt.booking_request_id)
    otp_verified = (
        db.query(OtpChallenge.id)
        .filter(
            OtpChallenge.booking_request_id == appt.booking_request_id,
            OtpChallenge.status == OtpStatus.VERIFIED.value,
        )
        .first()
        is not None
    )
    effective = compute_effective_statuses(db, [slot])[slot.id]

    events = [
        {
            "event_type": e.event_type,
            "actor_type": e.actor_type,
            "created_at": e.created_at,
            "from_slot_id": str(e.from_slot_id) if e.from_slot_id else None,
            "to_slot_id": str(e.to_slot_id) if e.to_slot_id else None,
        }
        for e in db.query(AppointmentEvent)
        .filter_by(appointment_id=appt.id)
        .order_by(AppointmentEvent.created_at)
        .all()
    ]
    notifications = [
        {
            "notification_type": n.notification_type,
            "status": n.status,
            "scheduled_at": n.scheduled_at,
            "sent_at": n.sent_at,
            "error_code": n.error_code,
        }
        for n in db.query(Notification)
        .filter_by(appointment_id=appt.id)
        .order_by(Notification.created_at)
        .all()
    ]

    return {
        "id": str(appt.id),
        "booking_reference": appt.booking_reference,
        "patient_name": appt.patient_name,
        "mobile": appt.mobile_e164,
        "consultation_type": appt.consultation_type,
        "status": appt.status,
        "start_at": to_ist(slot.start_at),
        "end_at": to_ist(slot.end_at),
        "timezone": settings.default_timezone,
        "slot_effective_status": effective,
        "otp_verified": otp_verified,
        "booking_created_at": booking.created_at if booking else appt.created_at,
        "teleconsultation_phone": appt.teleconsultation_phone_e164,
        "meeting": meeting,
        "events": events,
        "notifications": notifications,
    }


# --- status transitions ----------------------------------------------------
def set_status(db: Session, appointment_id: str, new_status: str, note: str | None, admin: AdminUser) -> Appointment:
    if new_status not in (AppointmentStatus.COMPLETED.value, AppointmentStatus.NO_SHOW.value):
        raise HTTPException(422, "Status must be 'completed' or 'no_show'.")
    appt = (
        db.query(Appointment).filter(Appointment.id == appointment_id).with_for_update().first()
    )
    if appt is None:
        raise HTTPException(404, "Appointment not found.")
    if appt.status != AppointmentStatus.CONFIRMED.value:
        raise HTTPException(409, f"A {appt.status} appointment cannot change status.")

    now = utcnow()
    appt.status = new_status
    if new_status == AppointmentStatus.COMPLETED.value:
        appt.completed_at = now
        event_type = AppointmentEventType.APPOINTMENT_COMPLETED.value
    else:
        appt.no_show_at = now
        event_type = AppointmentEventType.APPOINTMENT_NO_SHOW.value

    db.add(
        AppointmentEvent(
            appointment_id=appt.id,
            event_type=event_type,
            actor_type=ActorType.DOCTOR.value,
            actor_admin_id=admin.id,
            event_metadata={"note": note} if note else None,
        )
    )
    record_audit(
        db, action="appointment_status_changed", actor_admin_id=admin.id,
        entity_type="appointment", entity_id=appt.id, metadata={"status": new_status},
    )
    db.commit()
    return appt


# --- §11.5: add / replace Zoom link ----------------------------------------
def set_meeting_link(
    db: Session,
    appointment_id: str,
    *,
    join_url: str,
    meeting_identifier: str | None,
    admin_note: str | None,
    admin: AdminUser,
) -> tuple[MeetingDetails, bool]:
    url = _validate_zoom_url(join_url)
    appt = (
        db.query(Appointment).filter(Appointment.id == appointment_id).with_for_update().first()
    )
    if appt is None:
        raise HTTPException(404, "Appointment not found.")
    if appt.consultation_type != ConsultationType.VIDEO_CONSULTATION.value:
        raise HTTPException(422, "Only video consultations accept a Zoom link.")
    if appt.status != AppointmentStatus.CONFIRMED.value:
        raise HTTPException(409, f"A {appt.status} appointment cannot receive a Zoom link.")

    now = utcnow()
    md = db.query(MeetingDetails).filter_by(appointment_id=appt.id).with_for_update().first()
    if md is None:
        md = MeetingDetails(appointment_id=appt.id, status=MeetingStatus.PENDING.value)
        db.add(md)
    replaced = md.join_url_encrypted is not None

    md.join_url_encrypted = encrypt_secret(url)
    md.meeting_identifier_encrypted = (
        encrypt_secret(meeting_identifier) if meeting_identifier else None
    )
    md.status = MeetingStatus.READY.value
    md.set_by_admin_id = admin.id
    md.set_at = now
    md.reviewed_at = now

    event_type = (
        AppointmentEventType.MEETING_LINK_REPLACED.value
        if replaced
        else AppointmentEventType.MEETING_LINK_ADDED.value
    )
    db.add(
        AppointmentEvent(
            appointment_id=appt.id,
            event_type=event_type,
            actor_type=ActorType.DOCTOR.value,
            actor_admin_id=admin.id,
            event_metadata={"note": admin_note} if admin_note else None,
        )
    )

    notif_type = (
        NotificationType.VIDEO_LINK_UPDATED.value
        if replaced
        else NotificationType.VIDEO_LINK_READY.value
    )
    from app.services.notifications import queue_notification

    queue_notification(
        db,
        notification_type=notif_type,
        recipient_e164=appt.mobile_e164,
        template_key=notif_type,
        template_data={"bookingReference": appt.booking_reference},
        scheduled_at=now,
        # unique per (appointment, moment) so replacements never collide
        deduplication_key=f"{notif_type}:{appt.id}:{int(now.timestamp() * 1000)}",
        appointment_id=appt.id,
    )
    record_audit(
        db,
        action="zoom_link_replaced" if replaced else "zoom_link_added",
        actor_admin_id=admin.id,
        entity_type="appointment",
        entity_id=appt.id,
    )
    db.commit()
    return md, replaced
# --- doctor-initiated cancel / reschedule + dashboard ----------------------
def _get_and_lock(db: Session, appointment_id: str) -> Appointment:
    appt = (
        db.query(Appointment).filter(Appointment.id == appointment_id).with_for_update().first()
    )
    if appt is None:
        raise HTTPException(404, "Appointment not found.")
    return appt


def doctor_cancel(db: Session, appointment_id: str, reason: str | None, note: str | None, admin: AdminUser) -> Appointment:
    from app.services.appointments import perform_cancel  # avoid import cycle at module load

    appt = _get_and_lock(db, appointment_id)
    perform_cancel(  # doctor override: no 1-hour cutoff
        db, appt, actor_type=ActorType.DOCTOR.value, actor_admin_id=admin.id,
        enforce_cutoff=False, reason=reason, note=note,
    )
    record_audit(
        db, action="appointment_cancelled", actor_admin_id=admin.id,
        entity_type="appointment", entity_id=appt.id, metadata={"actor": "doctor"},
    )
    db.commit()
    return appt


def doctor_reschedule(db: Session, appointment_id: str, new_slot_id: str, admin: AdminUser) -> Appointment:
    from app.services.appointments import perform_reschedule

    appt = _get_and_lock(db, appointment_id)
    perform_reschedule(
        db, appt, new_slot_id, actor_type=ActorType.DOCTOR.value, actor_admin_id=admin.id,
        enforce_cutoff=False,
    )
    record_audit(
        db, action="appointment_rescheduled", actor_admin_id=admin.id,
        entity_type="appointment", entity_id=appt.id, metadata={"actor": "doctor"},
    )
    db.commit()
    return appt


def dashboard_summary(db: Session) -> dict:
    from datetime import timedelta

    from app.services.slots import future_available_slots, today_ist

    now = utcnow()
    day = today_ist()
    day_start, day_end = ist_day_bounds_utc(day)

    def confirmed_today(*extra):
        q = (
            db.query(Appointment.id)
            .join(AvailabilitySlot, Appointment.slot_id == AvailabilitySlot.id)
            .filter(
                Appointment.status == AppointmentStatus.CONFIRMED.value,
                AvailabilitySlot.start_at >= day_start,
                AvailabilitySlot.start_at < day_end,
            )
        )
        for e in extra:
            q = q.filter(e)
        return q.count()

    todays = confirmed_today()
    tele_today = confirmed_today(
        Appointment.consultation_type == ConsultationType.TELECONSULTATION.value
    )
    video_today = confirmed_today(
        Appointment.consultation_type == ConsultationType.VIDEO_CONSULTATION.value
    )

    upcoming = (
        db.query(Appointment.id)
        .join(AvailabilitySlot, Appointment.slot_id == AvailabilitySlot.id)
        .filter(
            Appointment.status == AppointmentStatus.CONFIRMED.value,
            AvailabilitySlot.start_at > now,
        )
        .count()
    )

    video_links_pending = (
        db.query(Appointment.id)
        .join(MeetingDetails, MeetingDetails.appointment_id == Appointment.id)
        .filter(
            Appointment.status == AppointmentStatus.CONFIRMED.value,
            Appointment.consultation_type == ConsultationType.VIDEO_CONSULTATION.value,
            MeetingDetails.status.in_(
                [MeetingStatus.PENDING.value, MeetingStatus.REVIEW_REQUIRED.value]
            ),
        )
        .count()
    )

    cancelled_today = (
        db.query(Appointment.id)
        .join(AvailabilitySlot, Appointment.slot_id == AvailabilitySlot.id)
        .filter(
            Appointment.status == AppointmentStatus.CANCELLED.value,
            AvailabilitySlot.start_at >= day_start,
            AvailabilitySlot.start_at < day_end,
        )
        .count()
    )

    win_start, _ = ist_day_bounds_utc(day)
    _, win_end = ist_day_bounds_utc(day + timedelta(days=30))
    available_slots = len(future_available_slots(db, win_start, win_end))

    from app.models.enums import NotificationStatus

    sms_failures = (
        db.query(Notification.id)
        .filter(Notification.status == NotificationStatus.FAILED.value)
        .count()
    )

    return {
        "timezone": settings.default_timezone,
        "todays_appointments": todays,
        "upcoming_appointments": upcoming,
        "teleconsultations_today": tele_today,
        "video_consultations_today": video_today,
        "video_links_pending": video_links_pending,
        "available_slots": available_slots,
        "cancelled_today": cancelled_today,
        "sms_delivery_failures": sms_failures,
    }