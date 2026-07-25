from datetime import datetime, timedelta, timezone

from app.models.appointment import Appointment, AppointmentStatus


def _login(client, user, password):
    response = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": password}
    )
    assert response.status_code == 200


def _make_appointment(db_session, practitioner, service, *, patient_email, start_time_utc, status=AppointmentStatus.CONFIRMED):
    import uuid

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


def test_list_patients_requires_practitioner_role(client, patient):
    _login(client, patient, "patientpass123")
    response = client.get("/api/v1/admin/patients")
    assert response.status_code == 403


def test_list_patients_aggregates_by_email(client, db_session, practitioner, service):
    _make_appointment(
        db_session, practitioner, service,
        patient_email="a@example.com",
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=1),
    )
    _make_appointment(
        db_session, practitioner, service,
        patient_email="a@example.com",
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=2),
    )
    _make_appointment(
        db_session, practitioner, service,
        patient_email="b@example.com",
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=3),
    )

    _login(client, practitioner, "changeme123")
    response = client.get("/api/v1/admin/patients")
    assert response.status_code == 200
    body = {row["email"]: row for row in response.json()}
    assert body["a@example.com"]["appointmentCount"] == 2
    assert body["b@example.com"]["appointmentCount"] == 1


def test_get_patient_appointments(client, db_session, practitioner, service):
    _make_appointment(
        db_session, practitioner, service,
        patient_email="a@example.com",
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=1),
    )

    _login(client, practitioner, "changeme123")
    response = client.get("/api/v1/admin/patients/appointments", params={"email": "a@example.com"})
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_analytics_summary_shape(client, db_session, practitioner, service):
    _make_appointment(
        db_session, practitioner, service,
        patient_email="a@example.com",
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=1),
    )
    _make_appointment(
        db_session, practitioner, service,
        patient_email="b@example.com",
        start_time_utc=datetime.now(timezone.utc) + timedelta(days=2),
        status=AppointmentStatus.CANCELLED_BY_PATIENT,
    )

    _login(client, practitioner, "changeme123")
    response = client.get("/api/v1/admin/analytics/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["totalAppointments"] == 2
    assert body["totalPatients"] == 2
    assert body["cancellationRate"] == 0.5
    assert isinstance(body["statusBreakdown"], list)
    assert isinstance(body["patientsPerMonth"], list)


def test_analytics_requires_practitioner_role(client, patient):
    _login(client, patient, "patientpass123")
    response = client.get("/api/v1/admin/analytics/summary")
    assert response.status_code == 403
