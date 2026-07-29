"""Shared helpers for appointment-related tests."""
import re
from datetime import datetime, timedelta
from uuid import uuid4
from zoneinfo import ZoneInfo

from app.services.sms import MemorySmsProvider

IST = ZoneInfo("Asia/Kolkata")
ZOOM_URL = "https://us05web.zoom.us/j/84123456789?pwd=Abc123"


def login(client):
    assert client.post(
        "/api/v1/admin/auth/login",
        json={"email": "doctor@example.com", "password": "changeme123"},
    ).status_code == 200


def make_slot(client, day=1, hour=9):
    start = datetime(2030, 6, day, hour, 0, tzinfo=IST).isoformat()
    r = client.post("/api/v1/admin/slots", json={"startAt": start})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def make_near_slot(client, minutes=3):
    start = (datetime.now(IST) + timedelta(minutes=minutes)).replace(second=0, microsecond=0).isoformat()
    r = client.post("/api/v1/admin/slots", json={"startAt": start})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _last_otp():
    return re.search(r"\d{6}", MemorySmsProvider.messages[-1]["body"]).group()


def book(client, slot_id, ctype="teleconsultation"):
    body = {
        "consultationType": ctype, "slotId": slot_id, "patientName": "Asha Rao",
        "mobileNumber": "9876543210", "smsConsent": True, "termsAccepted": True,
        "idempotencyKey": str(uuid4()),
    }
    bid = client.post("/api/v1/booking-requests", json=body).json()["id"]
    r = client.post(f"/api/v1/booking-requests/{bid}/verify", json={"otp": _last_otp()})
    assert r.status_code == 200, r.text
    return r.json()  # includes accessToken, bookingReference


def find_appt_id(client, reference):
    lst = client.get("/api/v1/admin/appointments").json()["appointments"]
    return next(a["id"] for a in lst if a["bookingReference"] == reference)
