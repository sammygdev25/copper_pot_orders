import pytest

pytestmark = pytest.mark.django_db


class TestCategoryViewSet:

    def test_list_public(self, api_client):
        response = api_client.get("/api/api/categories/")
        assert response.status_code == 200
    def test_create_unauthenticated(self, api_client):
        response = api_client.post("/api/api/categories/", {})
        assert response.status_code in (400, 401, 403)


class TestMenuItemViewSet:

    def test_list_public(self, api_client):
        response = api_client.get("/api/api/menu-items/")
        assert response.status_code == 200
    def test_create_unauthenticated(self, api_client):
        response = api_client.post("/api/api/menu-items/", {})
        assert response.status_code in (400, 401, 403)


class TestOrderViewSet:

    def test_list_public(self, api_client):
        response = api_client.get("/api/api/orders/")
        assert response.status_code == 200
    def test_create_unauthenticated(self, api_client):
        response = api_client.post("/api/api/orders/", {})
        assert response.status_code in (400, 401, 403)
