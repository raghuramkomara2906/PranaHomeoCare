from datetime import datetime, timedelta, timezone
from uuid import uuid4
from zoneinfo import ZoneInfo

from app.models import Appointment, BookingRequest, DoctorProfile

IST = ZoneInfo("Asia/Kolkata")


def login(client):
    r = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "doctor@example.com", "password": "changeme123"},
    )
    assert r.status_code == 200


def ist_iso(year=2030, month=6, day=1, hour=9, minute=0):
    return datetime(year, month, day, hour, minute, tzinfo=IST).isoformat()


def create_slot(client, iso):
    return client.post("/api/v1/admin/slots", json={"startAt": iso})


def _now():
    return datetime.now(timezone.utc)


def _doctor_id(db):
    return db.query(DoctorProfile).first().id


def make_hold(db, slot_id):
    br = BookingRequest(
        slot_id=slot_id, consultation_type="teleconsultation", patient_name="Held",
        mobile_e164="+919876543210", sms_consent_at=_now(), terms_accepted_at=_now(),
        terms_version="v1", status="pending_otp",
        hold_expires_at=_now() + timedelta(minutes=5), idempotency_key=uuid4(),
    )
    db.add(br)
    db.commit()
    return br


def make_booked(db, slot_id):
    br = BookingRequest(
        slot_id=slot_id, consultation_type="teleconsultation", patient_name="Booked",
        mobile_e164="+919876543210", sms_consent_at=_now(), terms_accepted_at=_now(),
        terms_version="v1", status="completed",
        hold_expires_at=_now() + timedelta(minutes=5), idempotency_key=uuid4(),
    )
    db.add(br)
    db.flush()
    appt = Appointment(
        booking_reference=f"REF-{uuid4().hex[:8]}", doctor_id=_doctor_id(db), slot_id=slot_id,
        booking_request_id=br.id, patient_name="Booked", mobile_e164="+919876543210",
        consultation_type="teleconsultation", status="confirmed", sms_consent_at=_now(),
        terms_accepted_at=_now(), terms_version="v1", confirmed_at=_now(),
    )
    db.add(appt)
    db.commit()
    return appt


def test_create_slot_requires_auth(client, seeded_admin):
    assert create_slot(client, ist_iso()).status_code == 401


def test_create_slot_success(client, seeded_admin):
    login(client)
    r = create_slot(client, ist_iso(hour=9))
    assert r.status_code == 201
    b = r.json()
    assert b["effectiveStatus"] == "available"
    start = datetime.fromisoformat(b["startAt"])
    end = datetime.fromisoformat(b["endAt"])
    assert (end - start) == timedelta(minutes=30)


def test_create_past_slot_rejected(client, seeded_admin):
    login(client)
    assert create_slot(client, ist_iso(year=2020)).status_code == 422


def test_overlapping_slot_rejected(client, seeded_admin):
    login(client)
    assert create_slot(client, ist_iso(hour=9, minute=0)).status_code == 201
    assert create_slot(client, ist_iso(hour=9, minute=15)).status_code == 409


def test_adjacent_slots_allowed(client, seeded_admin):
    login(client)
    assert create_slot(client, ist_iso(hour=9, minute=0)).status_code == 201
    assert create_slot(client, ist_iso(hour=9, minute=30)).status_code == 201


def test_list_slots_returns_created(client, seeded_admin):
    login(client)
    create_slot(client, ist_iso(hour=9))
    create_slot(client, ist_iso(hour=10))
    r = client.get("/api/v1/admin/slots", params={"fromDate": "2030-06-01", "toDate": "2030-06-02"})
    assert r.status_code == 200
    body = r.json()
    assert body["timezone"] == "Asia/Kolkata"
    assert len(body["slots"]) == 2


def test_block_then_unblock(client, seeded_admin):
    login(client)
    sid = create_slot(client, ist_iso(hour=9)).json()["id"]
    r = client.patch(f"/api/v1/admin/slots/{sid}", json={"baseStatus": "blocked", "blockedReason": "Away"})
    assert r.status_code == 200 and r.json()["effectiveStatus"] == "blocked"
    r = client.patch(f"/api/v1/admin/slots/{sid}", json={"baseStatus": "available"})
    assert r.status_code == 200 and r.json()["effectiveStatus"] == "available"


def test_cannot_block_booked_slot(client, seeded_admin, db_session):
    login(client)
    sid = create_slot(client, ist_iso(hour=9)).json()["id"]
    make_booked(db_session, sid)
    assert client.patch(f"/api/v1/admin/slots/{sid}", json={"baseStatus": "blocked"}).status_code == 409


def test_delete_available_slot(client, seeded_admin):
    login(client)
    sid = create_slot(client, ist_iso(hour=9)).json()["id"]
    assert client.delete(f"/api/v1/admin/slots/{sid}").status_code == 204
    listing = client.get("/api/v1/admin/slots", params={"fromDate": "2030-06-01", "toDate": "2030-06-02"}).json()
    assert all(s["id"] != sid for s in listing["slots"])


def test_cannot_delete_booked_slot(client, seeded_admin, db_session):
    login(client)
    sid = create_slot(client, ist_iso(hour=9)).json()["id"]
    make_booked(db_session, sid)
    assert client.delete(f"/api/v1/admin/slots/{sid}").status_code == 409


def test_public_slots_returns_available(client, seeded_admin):
    login(client)
    create_slot(client, ist_iso(hour=9))
    r = client.get("/api/v1/availability/slots", params={"date": "2030-06-01"})
    assert r.status_code == 200
    body = r.json()
    assert body["timezone"] == "Asia/Kolkata"
    assert len(body["slots"]) == 1


def test_public_slots_excludes_blocked(client, seeded_admin):
    login(client)
    sid = create_slot(client, ist_iso(hour=9)).json()["id"]
    client.patch(f"/api/v1/admin/slots/{sid}", json={"baseStatus": "blocked"})
    body = client.get("/api/v1/availability/slots", params={"date": "2030-06-01"}).json()
    assert body["slots"] == []


def test_public_slots_excludes_held(client, seeded_admin, db_session):
    login(client)
    sid = create_slot(client, ist_iso(hour=9)).json()["id"]
    make_hold(db_session, sid)
    body = client.get("/api/v1/availability/slots", params={"date": "2030-06-01"}).json()
    assert body["slots"] == []
    admin_list = client.get("/api/v1/admin/slots", params={"fromDate": "2030-06-01", "toDate": "2030-06-02"}).json()
    assert admin_list["slots"][0]["effectiveStatus"] == "held"


def test_public_dates_lists_dates_with_counts(client, seeded_admin):
    login(client)
    create_slot(client, ist_iso(day=1, hour=9))
    create_slot(client, ist_iso(day=1, hour=10))
    create_slot(client, ist_iso(day=2, hour=9))
    r = client.get("/api/v1/availability/dates", params={"fromDate": "2030-06-01", "toDate": "2030-06-05"})
    dates = {d["date"]: d["availableCount"] for d in r.json()["dates"]}
    assert dates == {"2030-06-01": 2, "2030-06-02": 1}


def test_public_slots_unknown_type_rejected(client, seeded_admin):
    r = client.get("/api/v1/availability/slots", params={"date": "2030-06-01", "consultationType": "psychic"})
    assert r.status_code == 422