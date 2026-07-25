from datetime import date, timedelta


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


def test_notifications_requires_auth(client):
    response = client.get("/api/v1/notifications/me")
    assert response.status_code == 401


def test_booking_creates_notification_for_patient(client, practitioner, service, patient):
    slot = _next_available_slot(client, service.id)
    client.post(
        "/api/v1/appointments",
        json={
            "serviceId": service.id,
            "startTimeUtc": slot,
            "patient": {
                "fullName": patient.full_name,
                "email": patient.email,
                "phone": "+15551234567",
            },
        },
    )

    _login(client, patient, "patientpass123")
    response = client.get("/api/v1/notifications/me")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["type"] == "APPOINTMENT_CONFIRMED"
    assert body[0]["isRead"] is False


def test_mark_notification_read(client, practitioner, service, patient):
    slot = _next_available_slot(client, service.id)
    client.post(
        "/api/v1/appointments",
        json={
            "serviceId": service.id,
            "startTimeUtc": slot,
            "patient": {
                "fullName": patient.full_name,
                "email": patient.email,
                "phone": "+15551234567",
            },
        },
    )

    _login(client, patient, "patientpass123")
    notification_id = client.get("/api/v1/notifications/me").json()[0]["id"]

    response = client.patch(f"/api/v1/notifications/{notification_id}/read")
    assert response.status_code == 200
    assert response.json()["isRead"] is True


def test_cannot_read_someone_elses_notification(client, db_session, practitioner, service, patient):
    import uuid

    from app.models.notification import Notification, NotificationType

    other_notification = Notification(
        recipient_email="someone-else@example.com",
        type=NotificationType.APPOINTMENT_CONFIRMED,
        message="Not yours.",
    )
    db_session.add(other_notification)
    db_session.commit()
    db_session.refresh(other_notification)

    _login(client, patient, "patientpass123")
    response = client.patch(f"/api/v1/notifications/{other_notification.id}/read")
    assert response.status_code == 404
