import pytest

pytestmark = pytest.mark.django_db


class TestRegistration:
    def test_register_success(self, api_client):
        response = api_client.post("/api/auth/register/", {
            "username": "newuser",
            "email": "new@example.com",
            "password": "newpass123",
        })
        assert response.status_code in (200, 201)
        assert "token" in response.data

    def test_register_duplicate_email(self, api_client, create_user):
        response = api_client.post("/api/auth/register/", {
            "username": "another",
            "email": "test@example.com",
            "password": "pass123",
        })
        assert response.status_code == 400


class TestLogin:
    def test_login_success(self, api_client, create_user, user_data):
        response = api_client.post("/api/auth/login/", {
            "username": user_data["username"],
            "password": user_data["password"],
        })
        assert response.status_code == 200
        assert "token" in response.data

    def test_login_wrong_password(self, api_client, create_user):
        response = api_client.post("/api/auth/login/", {
            "username": "testuser",
            "password": "wrongpassword",
        })
        assert response.status_code in (400, 401)

    def test_login_nonexistent_user(self, api_client):
        response = api_client.post("/api/auth/login/", {
            "username": "nobody",
            "password": "nopass",
        })
        assert response.status_code in (400, 401)


class TestProfile:
    def test_profile_authenticated(self, auth_client):
        response = auth_client.get("/api/auth/profile/")
        assert response.status_code == 200
        assert "username" in response.data

    def test_profile_unauthenticated(self, api_client):
        response = api_client.get("/api/auth/profile/")
        assert response.status_code == 401
