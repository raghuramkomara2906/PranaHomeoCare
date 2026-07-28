import re
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from zoneinfo import ZoneInfo

import pytest

from app.models import (
    Appointment,
    AppointmentAccessToken,
    AppointmentEvent,
    BookingRequest,
    DoctorProfile,
    MeetingDetails,
    Notification,
    OtpChallenge,
)
from app.services.sms import MemorySmsProvider

IST = ZoneInfo("Asia/Kolkata")


@pytest.fixture(autouse=True)
def _clear_sms():
    MemorySmsProvider.messages.clear()
    yield
    MemorySmsProvider.messages.clear()


def login(client):
    assert client.post(
        "/api/v1/admin/auth/login",
        json={"email": "doctor@example.com", "password": "changeme123"},
    ).status_code == 200


def make_slot(client, hour=9, day=1):
    start = datetime(2030, 6, day, hour, 0, tzinfo=IST).isoformat()
    r = client.post("/api/v1/admin/slots", json={"startAt": start})
    assert r.status_code == 201
    return r.json()["id"]


def book_body(slot_id, ctype="teleconsultation", mobile="9876543210"):
    return {
        "consultationType": ctype,
        "slotId": slot_id,
        "patientName": "Asha Rao",
        "mobileNumber": mobile,
        "smsConsent": True,
        "termsAccepted": True,
        "idempotencyKey": str(uuid4()),
    }


def create_booking(client, slot_id, **kw):
    return client.post("/api/v1/booking-requests", json=book_body(slot_id, **kw))


def last_otp():
    return re.search(r"\d{6}", MemorySmsProvider.messages[-1]["body"]).group()


def test_create_issues_otp_and_masks_mobile(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    r = create_booking(client, sid)
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "pending_otp"
    assert body["maskedMobile"] == "+91 98XXX XX210"
    assert len(MemorySmsProvider.messages) == 1
    assert re.search(r"\d{6}", MemorySmsProvider.messages[0]["body"])


def test_create_holds_slot(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    create_booking(client, sid)
    pub = client.get("/api/v1/availability/slots", params={"date": "2030-06-01"}).json()
    assert pub["slots"] == []


def test_invalid_mobile_rejected(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    assert create_booking(client, sid, mobile="1234567890").status_code == 422


def test_consent_required(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    body = book_body(sid)
    body["smsConsent"] = False
    assert client.post("/api/v1/booking-requests", json=body).status_code == 422


def test_cannot_book_blocked_slot(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    client.patch(f"/api/v1/admin/slots/{sid}", json={"baseStatus": "blocked"})
    assert create_booking(client, sid).status_code == 409


def test_idempotent_create_returns_same_session(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    body = book_body(sid)
    r1 = client.post("/api/v1/booking-requests", json=body)
    r2 = client.post("/api/v1/booking-requests", json=body)
    assert r1.json()["id"] == r2.json()["id"]
    assert len(MemorySmsProvider.messages) == 1


def test_second_hold_on_same_slot_conflicts(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    assert create_booking(client, sid).status_code == 201
    assert create_booking(client, sid).status_code == 409


def test_verify_wrong_otp(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    bid = create_booking(client, sid).json()["id"]
    r = client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": "000000"})
    assert r.status_code == 400


def test_verify_success_creates_appointment(client, seeded_admin, db_session):
    login(client)
    sid = make_slot(client)
    bid = create_booking(client, sid).json()["id"]
    r = client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": last_otp()})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "confirmed"
    assert body["bookingReference"].startswith("HOM-")
    assert body["accessToken"] and body["appointmentPath"].startswith("/appointment/")
    assert body["clinicPhone"]

    appt = db_session.query(Appointment).one()
    assert appt.status == "confirmed"
    assert db_session.query(AppointmentAccessToken).filter_by(appointment_id=appt.id).count() == 1
    assert db_session.query(AppointmentEvent).filter_by(
        appointment_id=appt.id, event_type="appointment_booked"
    ).count() == 1
    assert db_session.get(BookingRequest, appt.booking_request_id).status == "completed"
    types = {n.notification_type for n in db_session.query(Notification).all()}
    assert types == {"booking_confirmation", "teleconsultation_reminder"}


def test_verify_booked_slot_leaves_it_unavailable(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    bid = create_booking(client, sid).json()["id"]
    client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": last_otp()})
    admin = client.get("/api/v1/admin/slots", params={"fromDate": "2030-06-01", "toDate": "2030-06-02"}).json()
    assert admin["slots"][0]["effectiveStatus"] == "booked"


def test_verify_video_creates_pending_meeting(client, seeded_admin, db_session):
    login(client)
    sid = make_slot(client)
    bid = create_booking(client, sid, ctype="video_consultation").json()["id"]
    r = client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": last_otp()})
    assert r.status_code == 200
    assert r.json()["meetingStatus"] == "pending"
    appt = db_session.query(Appointment).one()
    assert db_session.query(MeetingDetails).filter_by(appointment_id=appt.id).one().status == "pending"
    types = {n.notification_type for n in db_session.query(Notification).all()}
    assert types == {"booking_confirmation"}


def test_verify_idempotent_double_submit(client, seeded_admin, db_session):
    login(client)
    sid = make_slot(client)
    bid = create_booking(client, sid).json()["id"]
    otp = last_otp()
    r1 = client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": otp})
    r2 = client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": otp})
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json()["bookingReference"] == r2.json()["bookingReference"]
    assert r2.json()["alreadyConfirmed"] is True
    assert db_session.query(Appointment).count() == 1


def test_verify_expired_otp(client, seeded_admin, db_session):
    login(client)
    sid = make_slot(client)
    bid = create_booking(client, sid).json()["id"]
    ch = db_session.query(OtpChallenge).filter_by(booking_request_id=bid).one()
    ch.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db_session.commit()
    r = client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": last_otp()})
    assert r.status_code == 400


def test_verify_locks_after_max_attempts(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    bid = create_booking(client, sid).json()["id"]
    for _ in range(5):
        client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": "000000"})
    r = client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": last_otp()})
    assert r.status_code == 429


def test_verify_slot_taken_between_hold_and_verify(client, seeded_admin, db_session):
    """A confirmed appointment appears on the slot after the hold — verify must
    refuse rather than double-book."""
    login(client)
    sid = make_slot(client)
    bid = create_booking(client, sid).json()["id"]
    otp = last_otp()
    other = BookingRequest(
        slot_id=sid, consultation_type="teleconsultation", patient_name="Other",
        mobile_e164="+919812345678", sms_consent_at=datetime.now(timezone.utc),
        terms_accepted_at=datetime.now(timezone.utc), terms_version="v1",
        status="completed", hold_expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        idempotency_key=uuid4(),
    )
    db_session.add(other)
    db_session.flush()
    doctor_id = db_session.query(DoctorProfile).one().id
    db_session.add(Appointment(
        booking_reference=f"HOM-{uuid4().hex[:6].upper()}",
        doctor_id=doctor_id,
        slot_id=sid, booking_request_id=other.id, patient_name="Other",
        mobile_e164="+919812345678", consultation_type="teleconsultation", status="confirmed",
        sms_consent_at=datetime.now(timezone.utc), terms_accepted_at=datetime.now(timezone.utc),
        terms_version="v1", confirmed_at=datetime.now(timezone.utc),
    ))
    db_session.commit()
    r = client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": otp})
    assert r.status_code == 409


def test_resend_cooldown_blocks_immediate(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    bid = create_booking(client, sid).json()["id"]
    assert client.post(f"/api/v1/booking-requests/{bid}/otp/resend").status_code == 429


def test_resend_supersedes_after_cooldown(client, seeded_admin, db_session):
    login(client)
    sid = make_slot(client)
    bid = create_booking(client, sid).json()["id"]
    first_otp = last_otp()
    ch = db_session.query(OtpChallenge).filter_by(booking_request_id=bid).one()
    ch.sent_at = datetime.now(timezone.utc) - timedelta(seconds=120)
    db_session.commit()
    assert client.post(f"/api/v1/booking-requests/{bid}/otp/resend").status_code == 200
    new_otp = last_otp()
    assert client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": first_otp}).status_code == 400
    assert client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": new_otp}).status_code == 200