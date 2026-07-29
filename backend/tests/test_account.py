"""Feature 11 — optional patient accounts."""
from uuid import uuid4

from app.models import Notification
from tests._appt_helpers import (
    ZOOM_URL, _last_otp, book, find_appt_id, login, make_near_slot, make_slot,
)


def register_account(client, mobile="9876543210", password="secret123"):
    r = client.post("/api/v1/account/register/request-otp", json={"mobileNumber": mobile})
    assert r.status_code == 200, r.text
    r = client.post(
        "/api/v1/account/register/confirm",
        json={"mobileNumber": mobile, "otp": _last_otp(), "password": password},
    )
    assert r.status_code == 200, r.text
    return r.json()


# --- registration + session ------------------------------------------------
def test_register_then_me(client, seeded_admin):
    me = register_account(client)
    assert me["mobileMasked"].startswith("+91")
    r = client.get("/api/v1/account/me")
    assert r.status_code == 200
    assert r.json()["id"] == me["id"]


def test_me_requires_auth(client, seeded_admin):
    client.cookies.clear()
    assert client.get("/api/v1/account/me").status_code == 401


def test_duplicate_registration_blocked(client, seeded_admin):
    register_account(client)
    r = client.post("/api/v1/account/register/request-otp", json={"mobileNumber": "9876543210"})
    assert r.status_code == 409


# --- login + lockout -------------------------------------------------------
def test_login_ok_and_wrong_password(client, seeded_admin):
    register_account(client, password="secret123")
    client.cookies.clear()
    assert client.post("/api/v1/account/login", json={"mobileNumber": "9876543210", "password": "secret123"}).status_code == 200
    assert client.post("/api/v1/account/login", json={"mobileNumber": "9876543210", "password": "nope"}).status_code == 401


def test_login_lockout(client, seeded_admin):
    register_account(client, password="secret123")
    client.cookies.clear()
    for _ in range(5):
        client.post("/api/v1/account/login", json={"mobileNumber": "9876543210", "password": "wrong"})
    # now locked — even the correct password is refused
    r = client.post("/api/v1/account/login", json={"mobileNumber": "9876543210", "password": "secret123"})
    assert r.status_code == 423


# --- appointments view (by mobile, incl. guest bookings) -------------------
def test_account_sees_guest_booking(client, seeded_admin):
    login(client)
    booked = book(client, make_slot(client, day=1))          # guest, mobile 9876543210
    register_account(client)                                  # same mobile
    appts = client.get("/api/v1/account/appointments").json()["appointments"]
    assert any(a["bookingReference"] == booked["bookingReference"] for a in appts)


def test_far_future_allows_cancel_and_reschedule(client, seeded_admin):
    login(client)
    book(client, make_slot(client, day=1))
    register_account(client)
    a = client.get("/api/v1/account/appointments").json()["appointments"][0]
    assert a["canCancel"] is True
    assert a["canReschedule"] is True


def test_near_slot_blocks_both(client, seeded_admin):
    login(client)
    book(client, make_near_slot(client, minutes=3))
    register_account(client)
    a = client.get("/api/v1/account/appointments").json()["appointments"][0]
    assert a["canCancel"] is False        # within 24h
    assert a["canReschedule"] is False    # within 3h


# --- ownership -------------------------------------------------------------
def test_cannot_touch_other_mobiles_appointment(client, seeded_admin):
    login(client)
    booked = book(client, make_slot(client, day=1))          # mobile 9876543210
    appt_id = find_appt_id(client, booked["bookingReference"])
    register_account(client, mobile="9811111111")            # different mobile
    assert client.post(f"/api/v1/account/appointments/{appt_id}/cancel").status_code == 404
    assert client.get(f"/api/v1/account/appointments/{appt_id}/join-status").status_code == 404


# --- account-initiated actions ---------------------------------------------
def test_account_cancel(client, seeded_admin):
    login(client)
    booked = book(client, make_slot(client, day=1))
    appt_id = find_appt_id(client, booked["bookingReference"])
    register_account(client)
    r = client.post(f"/api/v1/account/appointments/{appt_id}/cancel")
    assert r.status_code == 200
    assert r.json()["status"] == "cancelled"


def test_video_reschedule_returns_ready_and_notifies(client, seeded_admin, db_session):
    login(client)
    booked = book(client, make_slot(client, day=1, hour=9), ctype="video_consultation")
    appt_id = find_appt_id(client, booked["bookingReference"])
    # admin adds the Zoom link -> ready
    assert client.put(
        f"/api/v1/admin/appointments/{appt_id}/meeting", json={"joinUrl": ZOOM_URL}
    ).status_code == 200
    target = make_slot(client, day=2, hour=9)
    register_account(client)
    r = client.post(
        f"/api/v1/account/appointments/{appt_id}/reschedule", json={"newSlotId": target}
    )
    assert r.status_code == 200, r.text
    assert r.json()["meetingStatus"] == "ready"       # decision B: not review_required
    updated = (
        db_session.query(Notification)
        .filter(Notification.notification_type == "video_link_updated")
        .count()
    )
    assert updated >= 1


# --- password reset --------------------------------------------------------
def test_password_reset(client, seeded_admin):
    register_account(client, password="secret123")
    assert client.post(
        "/api/v1/account/password-reset/request-otp", json={"mobileNumber": "9876543210"}
    ).status_code == 200
    assert client.post(
        "/api/v1/account/password-reset/confirm",
        json={"mobileNumber": "9876543210", "otp": _last_otp(), "password": "newpass123"},
    ).status_code == 200
    client.cookies.clear()
    assert client.post("/api/v1/account/login", json={"mobileNumber": "9876543210", "password": "newpass123"}).status_code == 200
    assert client.post("/api/v1/account/login", json={"mobileNumber": "9876543210", "password": "secret123"}).status_code == 401
