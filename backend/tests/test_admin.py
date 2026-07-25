from datetime import date, timedelta


def _login(client, practitioner):
    client.post(
        "/api/v1/auth/login",
        json={"email": practitioner.email, "password": "changeme123"},
    )


def test_admin_appointments_requires_auth(client):
    today = date.today()
    response = client.get(
        "/api/v1/admin/appointments",
        params={"start": today.isoformat(), "end": (today + timedelta(days=7)).isoformat()},
    )
    assert response.status_code == 401


def test_admin_appointments_returns_list_for_practitioner(client, practitioner, service):
    _login(client, practitioner)
    today = date.today()
    response = client.get(
        "/api/v1/admin/appointments",
        params={"start": today.isoformat(), "end": (today + timedelta(days=30)).isoformat()},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_replace_weekly_rules_updates_hours(client, practitioner):
    _login(client, practitioner)
    payload = [
        {"weekday": weekday, "startMinute": 8 * 60, "endMinute": 16 * 60, "isActive": weekday != 0}
        for weekday in range(7)
    ]
    response = client.put("/api/v1/admin/availability/rules", json=payload)
    assert response.status_code == 200
    rules = {r["weekday"]: r for r in response.json()}
    assert rules[1]["startMinute"] == 8 * 60
    assert rules[0]["isActive"] is False


def test_create_and_delete_exception(client, practitioner):
    _login(client, practitioner)
    target = (date.today() + timedelta(days=10)).isoformat()

    created = client.post(
        "/api/v1/admin/availability/exceptions",
        json={"date": target, "isClosed": True, "note": "Holiday"},
    )
    assert created.status_code == 201
    exception_id = created.json()["id"]

    listed = client.get(
        "/api/v1/admin/availability/exceptions",
        params={
            "start": date.today().isoformat(),
            "end": (date.today() + timedelta(days=30)).isoformat(),
        },
    )
    assert any(e["id"] == exception_id for e in listed.json())

    deleted = client.delete(f"/api/v1/admin/availability/exceptions/{exception_id}")
    assert deleted.status_code == 204
