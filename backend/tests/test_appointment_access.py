import re
from datetime import datetime, timedelta
from uuid import uuid4
from zoneinfo import ZoneInfo

import pytest

from app.models import (
    Appointment,
    AppointmentEvent,
    MeetingDetails,
    Notification,
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


def make_slot(client, day=1, hour=9):
    start = datetime(2030, 6, day, hour, 0, tzinfo=IST).isoformat()
    r = client.post("/api/v1/admin/slots", json={"startAt": start})
    assert r.status_code == 201
    return r.json()["id"]


def make_near_slot(client, minutes=30):
    start = (datetime.now(IST) + timedelta(minutes=minutes)).replace(second=0, microsecond=0).isoformat()
    r = client.post("/api/v1/admin/slots", json={"startAt": start})
    assert r.status_code == 201
    return r.json()["id"]


def last_otp():
    return re.search(r"\d{6}", MemorySmsProvider.messages[-1]["body"]).group()


def book(client, slot_id, ctype="teleconsultation"):
    body = {
        "consultationType": ctype, "slotId": slot_id, "patientName": "Asha Rao",
        "mobileNumber": "9876543210", "smsConsent": True, "termsAccepted": True,
        "idempotencyKey": str(uuid4()),
    }
    bid = client.post("/api/v1/booking-requests", json=body).json()["id"]
    r = client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": last_otp()})
    assert r.status_code == 200
    return r.json()["accessToken"]


def test_access_returns_appointment_no_internal_ids(client, seeded_admin):
    login(client)
    token = book(client, make_slot(client))
    r = client.get(f"/api/v1/appointments/access/{token}")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "confirmed"
    assert body["bookingReference"].startswith("HOM-")
    assert body["canCancel"] is True and body["canReschedule"] is True
    assert body["clinicPhone"]
    assert "id" not in body and "slotId" not in body and "appointmentId" not in body


def test_access_invalid_token_404(client, seeded_admin):
    assert client.get("/api/v1/appointments/access/not-a-real-token").status_code == 404


def test_cancel_releases_slot_and_notifies(client, seeded_admin, db_session):
    login(client)
    sid = make_slot(client)
    token = book(client, sid)
    r = client.post(f"/api/v1/appointments/access/{token}/cancel")
    assert r.status_code == 200 and r.json()["status"] == "cancelled"

    pub = client.get("/api/v1/availability/slots", params={"date": "2030-06-01"}).json()
    assert any(s["id"] == sid for s in pub["slots"])
    appt = db_session.query(Appointment).one()
    assert db_session.query(AppointmentEvent).filter_by(
        appointment_id=appt.id, event_type="appointment_cancelled"
    ).count() == 1
    notifs = {n.notification_type: n.status for n in db_session.query(Notification).all()}
    assert notifs["appointment_cancelled"] == "queued"
    assert notifs["teleconsultation_reminder"] == "cancelled"


def test_cancel_twice_conflicts(client, seeded_admin):
    login(client)
    token = book(client, make_slot(client))
    assert client.post(f"/api/v1/appointments/access/{token}/cancel").status_code == 200
    assert client.post(f"/api/v1/appointments/access/{token}/cancel").status_code == 409


def test_cancel_after_deadline_blocked(client, seeded_admin):
    login(client)
    token = book(client, make_near_slot(client, minutes=30))  # inside the 60-min cutoff
    assert client.post(f"/api/v1/appointments/access/{token}/cancel").status_code == 409


def test_access_shows_cancelled_after_cancel(client, seeded_admin):
    login(client)
    token = book(client, make_slot(client))
    client.post(f"/api/v1/appointments/access/{token}/cancel")
    body = client.get(f"/api/v1/appointments/access/{token}").json()
    assert body["status"] == "cancelled"
    assert body["canCancel"] is False and body["canReschedule"] is False


def test_reschedule_options_lists_available_dates(client, seeded_admin):
    login(client)
    token = book(client, make_slot(client, day=1))
    make_slot(client, day=2)
    make_slot(client, day=3)
    r = client.get(f"/api/v1/appointments/access/{token}/reschedule-options", params={"fromDate": "2030-06-01", "toDate": "2030-06-05"})
    assert r.status_code == 200
    body = r.json()
    assert body["canReschedule"] is True
    dates = {d["date"] for d in body["dates"]}
    assert {"2030-06-02", "2030-06-03"} <= dates
    assert "2030-06-01" not in dates


def test_reschedule_moves_appointment(client, seeded_admin, db_session):
    login(client)
    old = make_slot(client, day=1, hour=9)
    token = book(client, old)
    new = make_slot(client, day=2, hour=10)
    r = client.post(f"/api/v1/appointments/access/{token}/reschedule", json={"newSlotId": new})
    assert r.status_code == 200
    assert r.json()["status"] == "confirmed"
    assert datetime.fromisoformat(r.json()["startAt"]).astimezone(IST).day == 2

    d1 = client.get("/api/v1/availability/slots", params={"date": "2030-06-01"}).json()
    d2 = client.get("/api/v1/availability/slots", params={"date": "2030-06-02"}).json()
    assert any(s["id"] == old for s in d1["slots"])
    assert all(s["id"] != new for s in d2["slots"])

    appt = db_session.query(Appointment).one()
    assert appt.reschedule_count == 1
    ev = db_session.query(AppointmentEvent).filter_by(
        appointment_id=appt.id, event_type="appointment_rescheduled"
    ).one()
    assert str(ev.from_slot_id) == old and str(ev.to_slot_id) == new
    assert db_session.query(Notification).filter_by(
        notification_type="appointment_rescheduled"
    ).count() == 1


def test_reschedule_to_same_slot_rejected(client, seeded_admin):
    login(client)
    sid = make_slot(client)
    token = book(client, sid)
    assert client.post(
        f"/api/v1/appointments/access/{token}/reschedule", json={"newSlotId": sid}
    ).status_code == 422


def test_reschedule_to_blocked_slot_conflicts(client, seeded_admin):
    login(client)
    token = book(client, make_slot(client, day=1))
    other = make_slot(client, day=2)
    client.patch(f"/api/v1/admin/slots/{other}", json={"baseStatus": "blocked"})
    assert client.post(
        f"/api/v1/appointments/access/{token}/reschedule", json={"newSlotId": other}
    ).status_code == 409


def test_reschedule_video_flags_meeting_for_review(client, seeded_admin, db_session):
    login(client)
    token = book(client, make_slot(client, day=1), ctype="video_consultation")
    new = make_slot(client, day=2)
    r = client.post(f"/api/v1/appointments/access/{token}/reschedule", json={"newSlotId": new})
    assert r.status_code == 200
    assert r.json()["meetingStatus"] == "review_required"
    appt = db_session.query(Appointment).one()
    assert db_session.query(MeetingDetails).filter_by(
        appointment_id=appt.id
    ).one().status == "review_required"


def test_reschedule_after_deadline_blocked(client, seeded_admin):
    login(client)
    token = book(client, make_near_slot(client, minutes=30))
    new = make_slot(client, day=5)
    assert client.post(
        f"/api/v1/appointments/access/{token}/reschedule", json={"newSlotId": new}
    ).status_code == 409