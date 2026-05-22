from fastapi.testclient import TestClient


def test_fake_login_creates_user(client: TestClient) -> None:
    res = client.post(
        "/api/auth/fake-login",
        json={"name": "Jane Doe", "email": "jane@example.com"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Jane Doe"
    assert body["email"] == "jane@example.com"
    assert isinstance(body["id"], int) and body["id"] > 0


def test_fake_login_returns_same_user_for_same_email(client: TestClient) -> None:
    first = client.post(
        "/api/auth/fake-login",
        json={"name": "Jane", "email": "jane@example.com"},
    ).json()
    second = client.post(
        "/api/auth/fake-login",
        json={"name": "Jane Doe", "email": "jane@example.com"},
    ).json()
    assert first["id"] == second["id"]
    assert second["name"] == "Jane Doe"


def test_fake_login_rejects_invalid_email(client: TestClient) -> None:
    res = client.post(
        "/api/auth/fake-login",
        json={"name": "Jane", "email": "not-an-email"},
    )
    assert res.status_code == 422


def test_fake_login_rejects_empty_name(client: TestClient) -> None:
    res = client.post(
        "/api/auth/fake-login",
        json={"name": "", "email": "jane@example.com"},
    )
    assert res.status_code == 422
