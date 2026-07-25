def test_register_creates_patient_and_starts_session(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Jordan Rivera",
            "email": "jordan@example.com",
            "password": "supersecret123",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["role"] == "PATIENT"
    assert body["user"]["email"] == "jordan@example.com"
    assert "session_token" in response.cookies

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "jordan@example.com"


def test_register_duplicate_email_returns_409(client, practitioner):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Someone Else",
            "email": practitioner.email,
            "password": "supersecret123",
        },
    )
    assert response.status_code == 409


def test_register_short_password_returns_422(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"fullName": "Jordan Rivera", "email": "short@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_login_wrong_password_returns_401(client, practitioner):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": practitioner.email, "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_login_unknown_email_returns_401(client, practitioner):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "changeme123"},
    )
    assert response.status_code == 401


def test_login_success_sets_cookie_and_returns_role(client, practitioner):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": practitioner.email, "password": "changeme123"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "PRACTITIONER"
    assert "session_token" in response.cookies


def test_me_requires_authentication(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user_after_login(client, practitioner):
    client.post(
        "/api/v1/auth/login",
        json={"email": practitioner.email, "password": "changeme123"},
    )
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == practitioner.email


def test_update_profile_requires_auth(client):
    response = client.patch("/api/v1/auth/me", json={"phone": "+15551234567"})
    assert response.status_code == 401


def test_update_profile_happy_path(client, patient):
    client.post(
        "/api/v1/auth/login",
        json={"email": patient.email, "password": "patientpass123"},
    )
    response = client.patch(
        "/api/v1/auth/me", json={"fullName": "Updated Name", "phone": "+15559876543"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["fullName"] == "Updated Name"
    assert body["phone"] == "+15559876543"
