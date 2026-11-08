import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client():
    """Unauthenticated API client."""
    return APIClient()


@pytest.fixture
def user_data():
    """Default test user data."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
    }


@pytest.fixture
def create_user(user_data):
    """Create and return a test user."""
    user = User.objects.create_user(
        username=user_data["username"],
        email=user_data["email"],
        password=user_data["password"],
    )
    return user


@pytest.fixture
def auth_client(api_client, create_user, user_data):
    """Authenticated API client with token."""
    response = api_client.post("/api/auth/login/", {
        "username": user_data["username"],
        "password": user_data["password"],
    })
    token = response.data.get("token")
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    return api_client
