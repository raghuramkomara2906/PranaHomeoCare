import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.models.appointment import Appointment, AppointmentStatus
from app.models.notification import Notification, NotificationType


def _login(client, user, password):
    response = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": password}
    )
    assert response.status_code == 200


def _next_available_slot(client, service_id: str) -> str:
    for offset in range(1, 15):
        target = date.today() + timedelta(days=offset)
        response = client.get(
            "/api/v1/availability", params={"service_id": service_id, "date": target.isoformat()}
        )
        slots = response.json()
        if slots:
            return slots[0]["startTimeUtc"]
    raise AssertionError("no available slot found in the next 14 days")


def test_create_appointment_happy_path(client, practitioner, service):
    slot = _next_available_slot(client, service.id)

    response = client.post(
        "/api/v1/appointments",
        json={
            "serviceId": service.id,
            "startTimeUtc": slot,
            "patient": {
                "fullName": "Jordan Rivera",
                "email": "jordan@example.com",
                "phone": "+15551234567",
                "notes": "First time booking.",
            },
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "CONFIRMED"
    assert body["publicReference"].startswith("BK-")
    assert body["serviceName"] == service.name


def test_double_booking_same_slot_returns_409(client, practitioner, service):
    slot = _next_available_slot(client, service.id)
    payload = {
        "serviceId": service.id,
        "startTimeUtc": slot,
        "patient": {
            "fullName": "Jordan Rivera",
            "email": "jordan@example.com",
            "phone": "+15551234567",
        },
    }

    first = client.post("/api/v1/appointments", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/appointments", json=payload)
    assert second.status_code == 409


def test_create_appointment_unknown_service_returns_404(client, practitioner):
    response = client.post(
        "/api/v1/appointments",
        json={
            "serviceId": "svc_does_not_exist",
            "startTimeUtc": "2026-08-03T16:00:00Z",
            "patient": {
                "fullName": "Jordan Rivera",
                "email": "jordan@example.com",
                "phone": "+15551234567",
            },
        },
    )
    assert response.status_code == 404


def _make_appointment(db_session, practitioner, service, *, patient_email, start_time_utc, status=AppointmentStatus.CONFIRMED):
    appointment = Appointment(
        public_reference=f"BK-{uuid.uuid4().hex[:8].upper()}",
        practitioner_id=practitioner.id,
        service_id=service.id,
        patient_full_name="Test Patient",
        patient_email=patient_email,
        patient_phone="+15551234567",
        start_time_utc=start_time_utc,
        end_time_utc=start_time_utc + timedelta(minutes=service.duration_minutes),
        display_timezone="America/Phoenix",
        status=status,
    )
    db_session.add(appointment)
    db_session.commit()
    db_session.refresh(appointment)
    return appointment


def test_my_appointments_requires_auth(client):
    response = client.get("/api/v1/appointments/me")
    assert response.status_code == 401


def test_my_appointments_matches_by_email_only(client, db_session, practitioner, service, patient):
    _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email=patient.email,
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=1),
    )
    _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email="someone-else@example.com",
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=2),
    )

    _login(client, patient, "patientpass123")
    response = client.get("/api/v1/appointments/me")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["serviceName"] == service.name


def test_join_status_before_and_during_window(client, db_session, practitioner, service, patient):
    appointment = _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email=patient.email,
        start_time_utc=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    _login(client, patient, "patientpass123")

    before = client.get(f"/api/v1/appointments/{appointment.id}/join-status")
    assert before.status_code == 200
    assert before.json()["canJoin"] is False

    appointment.start_time_utc = datetime.now(timezone.utc) + timedelta(minutes=5)
    appointment.end_time_utc = appointment.start_time_utc + timedelta(minutes=service.duration_minutes)
    db_session.commit()

    during = client.get(f"/api/v1/appointments/{appointment.id}/join-status")
    assert during.status_code == 200
    assert during.json()["canJoin"] is True


def test_join_status_rejects_non_owner(client, db_session, practitioner, service, patient):
    appointment = _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email="someone-else@example.com",
        start_time_utc=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    _login(client, patient, "patientpass123")
    response = client.get(f"/api/v1/appointments/{appointment.id}/join-status")
    assert response.status_code == 404


def test_cancel_appointment_happy_path(client, db_session, practitioner, service, patient):
    appointment = _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email=patient.email,
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=1),
    )
    _login(client, patient, "patientpass123")

    response = client.patch(f"/api/v1/appointments/{appointment.id}/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED_BY_PATIENT"


def test_cancel_already_cancelled_appointment_returns_409(client, db_session, practitioner, service, patient):
    appointment = _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email=patient.email,
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=1),
        status=AppointmentStatus.CANCELLED_BY_PATIENT,
    )
    _login(client, patient, "patientpass123")

    response = client.patch(f"/api/v1/appointments/{appointment.id}/cancel")
    assert response.status_code == 409


def test_cancel_creates_notification(client, db_session, practitioner, service, patient):
    appointment = _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email=patient.email,
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=1),
    )
    _login(client, patient, "patientpass123")
    client.patch(f"/api/v1/appointments/{appointment.id}/cancel")

    notification = db_session.scalar(
        select(Notification).where(Notification.appointment_id == appointment.id)
    )
    assert notification is not None
    assert notification.type == NotificationType.APPOINTMENT_CANCELLED
    assert notification.recipient_email == patient.email


def test_reschedule_happy_path(client, db_session, practitioner, service, patient):
    appointment = _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email=patient.email,
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=1),
    )
    _login(client, patient, "patientpass123")

    new_start = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    response = client.patch(
        f"/api/v1/appointments/{appointment.id}/reschedule",
        json={"startTimeUtc": new_start},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "RESCHEDULED"

    notification = db_session.scalar(
        select(Notification).where(
            Notification.appointment_id == appointment.id,
            Notification.type == NotificationType.APPOINTMENT_RESCHEDULED,
        )
    )
    assert notification is not None


def test_reschedule_into_conflicting_slot_returns_409(client, db_session, practitioner, service, patient):
    target_time = datetime.now(timezone.utc) + timedelta(days=3)
    _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email="someone-else@example.com",
        start_time_utc=target_time,
    )
    appointment = _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email=patient.email,
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=1),
    )
    _login(client, patient, "patientpass123")

    response = client.patch(
        f"/api/v1/appointments/{appointment.id}/reschedule",
        json={"startTimeUtc": target_time.isoformat()},
    )
    assert response.status_code == 409


def test_reschedule_rejects_non_owner(client, db_session, practitioner, service, patient):
    appointment = _make_appointment(
        db_session,
        practitioner,
        service,
        patient_email="someone-else@example.com",
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=1),
    )
    _login(client, patient, "patientpass123")

    response = client.patch(
        f"/api/v1/appointments/{appointment.id}/reschedule",
        json={"startTimeUtc": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()},
    )
    assert response.status_code == 404
