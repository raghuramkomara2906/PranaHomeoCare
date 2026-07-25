def _login(client, user, password):
    response = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": password}
    )
    assert response.status_code == 200


def test_submit_contact_message(client):
    response = client.post(
        "/api/v1/contact",
        json={
            "fullName": "Jordan Rivera",
            "email": "jordan@example.com",
            "phone": "+15551234567",
            "message": "I have a question about your services.",
        },
    )
    assert response.status_code == 201
    assert response.json()["isRead"] is False


def test_list_contact_messages_requires_practitioner(client, patient):
    _login(client, patient, "patientpass123")
    response = client.get("/api/v1/admin/contact-messages")
    assert response.status_code == 403


def test_list_and_mark_read_contact_message(client, practitioner):
    client.post(
        "/api/v1/contact",
        json={
            "fullName": "Jordan Rivera",
            "email": "jordan@example.com",
            "message": "Question.",
        },
    )
    _login(client, practitioner, "changeme123")

    listed = client.get("/api/v1/admin/contact-messages")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    message_id = listed.json()[0]["id"]

    marked = client.patch(f"/api/v1/admin/contact-messages/{message_id}/read")
    assert marked.status_code == 200
    assert marked.json()["isRead"] is True
