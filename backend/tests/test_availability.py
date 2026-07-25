from datetime import date, datetime, timedelta, timezone

from app.core.scheduling import compute_available_slots
from app.models.appointment import Appointment, AppointmentStatus
from app.models.availability import AvailabilityException


def _next_weekday(target_weekday_js: int) -> date:
    """Next date (strictly in the future) whose JS-style weekday
    (0=Sunday..6=Saturday) matches target_weekday_js."""
    today = date.today()
    for offset in range(1, 15):
        candidate = today + timedelta(days=offset)
        if (candidate.weekday() + 1) % 7 == target_weekday_js:
            return candidate
    raise AssertionError("could not find matching weekday")


def test_open_weekday_returns_slots(db_session, practitioner, service):
    monday = _next_weekday(1)
    slots = compute_available_slots(db_session, practitioner.id, service.duration_minutes, monday)
    assert len(slots) > 0
    assert all(slot["display_timezone"] == "America/Phoenix" for slot in slots)


def test_closed_weekday_returns_no_slots(db_session, practitioner, service):
    sunday = _next_weekday(0)
    slots = compute_available_slots(db_session, practitioner.id, service.duration_minutes, sunday)
    assert slots == []


def test_exception_closes_an_otherwise_open_day(db_session, practitioner, service):
    monday = _next_weekday(1)
    db_session.add(
        AvailabilityException(practitioner_id=practitioner.id, date=monday, is_closed=True)
    )
    db_session.commit()

    slots = compute_available_slots(db_session, practitioner.id, service.duration_minutes, monday)
    assert slots == []


def test_booked_slot_is_excluded(db_session, practitioner, service):
    monday = _next_weekday(1)
    slots_before = compute_available_slots(
        db_session, practitioner.id, service.duration_minutes, monday
    )
    assert len(slots_before) > 0
    taken = slots_before[0]

    db_session.add(
        Appointment(
            public_reference="BK-TEST01",
            practitioner_id=practitioner.id,
            service_id=service.id,
            patient_full_name="Jordan Rivera",
            patient_email="jordan@example.com",
            patient_phone="+15551234567",
            start_time_utc=taken["start_time_utc"],
            end_time_utc=taken["end_time_utc"],
            display_timezone="America/Phoenix",
            status=AppointmentStatus.CONFIRMED,
        )
    )
    db_session.commit()

    slots_after = compute_available_slots(
        db_session, practitioner.id, service.duration_minutes, monday
    )
    assert taken["start_time_utc"] not in [s["start_time_utc"] for s in slots_after]
    assert len(slots_after) == len(slots_before) - 1


def test_cancelled_appointment_does_not_block_slot(db_session, practitioner, service):
    monday = _next_weekday(1)
    slots_before = compute_available_slots(
        db_session, practitioner.id, service.duration_minutes, monday
    )
    taken = slots_before[0]

    db_session.add(
        Appointment(
            public_reference="BK-TEST02",
            practitioner_id=practitioner.id,
            service_id=service.id,
            patient_full_name="Jordan Rivera",
            patient_email="jordan@example.com",
            patient_phone="+15551234567",
            start_time_utc=taken["start_time_utc"],
            end_time_utc=taken["end_time_utc"],
            display_timezone="America/Phoenix",
            status=AppointmentStatus.CANCELLED_BY_PATIENT,
        )
    )
    db_session.commit()

    slots_after = compute_available_slots(
        db_session, practitioner.id, service.duration_minutes, monday
    )
    assert len(slots_after) == len(slots_before)
