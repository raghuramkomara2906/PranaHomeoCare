def _login(client, password):
    return client.post(
        "/api/v1/admin/auth/login",
        json={"email": "doctor@example.com", "password": password},
    )


def test_login_success_sets_httponly_cookie(client, seeded_admin):
    r = _login(client, "changeme123")
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "doctor@example.com"
    assert body["role"] == "doctor_admin"
    # camelCase serialization matches the frontend TS types
    assert body["doctor"]["displayName"] == "[Practitioner Name]"
    cookie = r.headers.get("set-cookie", "").lower()
    assert "admin_session=" in cookie and "httponly" in cookie and "samesite=lax" in cookie


def test_login_wrong_password_is_401(client, seeded_admin):
    r = _login(client, "wrong")
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password."


def test_login_unknown_email_is_401(client, seeded_admin):
    r = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "ghost@example.com", "password": "x"},
    )
    assert r.status_code == 401


def test_me_requires_authentication(client, seeded_admin):
    assert client.get("/api/v1/admin/auth/me").status_code == 401


def test_me_returns_current_admin_when_authenticated(client, seeded_admin):
    _login(client, "changeme123")  # TestClient persists the cookie
    r = client.get("/api/v1/admin/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "doctor@example.com"


def test_logout_clears_session(client, seeded_admin):
    _login(client, "changeme123")
    assert client.post("/api/v1/admin/auth/logout").status_code == 200
    assert client.get("/api/v1/admin/auth/me").status_code == 401


def test_failed_logins_lock_account_after_threshold(client, seeded_admin):
    for _ in range(5):
        assert _login(client, "wrong").status_code == 401
    # 6th attempt is now locked out — even the correct password is refused.
    r = _login(client, "changeme123")
    assert r.status_code == 429


def test_login_records_audit_events(client, seeded_admin, db_session):
    from app.models import AuditEvent

    _login(client, "wrong")
    _login(client, "changeme123")
    actions = [e.action for e in db_session.query(AuditEvent).all()]
    assert "admin_login_failed" in actions
    assert "admin_login_success" in actions