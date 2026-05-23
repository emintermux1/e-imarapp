from __future__ import annotations

from fastapi.testclient import TestClient

from app.database import get_db
from app.main import create_app


class _ScalarResult:
    def __init__(self, value):
        self.value = value

    def scalar_one(self):
        return self.value


class _ScalarsResult:
    def __init__(self, rows):
        self.rows = rows

    def scalars(self):
        return self

    def all(self):
        return self.rows


class _FakeDb:
    def __init__(self, results):
        self.results = list(results)

    async def execute(self, statement):
        result = self.results.pop(0)
        if isinstance(result, Exception):
            raise result
        return result


def _client(fake_db: _FakeDb | None = None) -> TestClient:
    app = create_app()
    if fake_db is not None:
        async def override_db():
            yield fake_db

        app.dependency_overrides[get_db] = override_db
    return TestClient(app)


def test_admin_dashboard_labels_database_and_registry_data_sources():
    client = _client(_FakeDb([_ScalarResult(2), _ScalarResult(4)]))

    response = client.get("/api/v1/admin/dashboard", headers={"X-User-Id": "42"})

    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["requested_by_user_id"] == 42
    assert "official live" in body["meta"]["data_notice"]
    sources = {metric["key"]: metric["data_source"] for metric in body["metrics"]}
    assert sources["users_total"] == "database-derived"
    assert sources["reports_total"] == "database-derived"
    assert sources["sources_total"] == "registry-derived"


def test_admin_sources_returns_registry_derived_source_records():
    client = _client()

    response = client.get("/api/v1/admin/sources?limit=3&category=central")

    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["data_source"] == "registry-derived"
    assert body["meta"]["total"] >= 1
    assert body["sources"]
    assert all(source["data_source"] == "registry-derived" for source in body["sources"])
    assert "category" in body["rollup"]


def test_admin_analytics_demo_trends_are_explicitly_labelled_demo():
    client = _client(_FakeDb([_ScalarResult(7), _ScalarResult(3)]))

    response = client.get("/api/v1/admin/analytics")

    assert response.status_code == 200
    body = response.json()
    assert all(point["data_source"] == "demo-placeholder" for point in body["demo_trends"])
    assert any("demo placeholders" in note for note in body["notes"])
    assert body["database_metrics"][0]["data_source"] == "database-derived"


def test_admin_reports_gracefully_marks_unavailable_database():
    client = _client(_FakeDb([RuntimeError("database unavailable")]))

    response = client.get("/api/v1/admin/reports")

    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["db_status"] == "unavailable"
    assert body["meta"]["data_source"] == "database-derived"
    assert body["reports"] == []


def test_admin_openapi_includes_mvp_paths():
    client = _client()

    response = client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    for path in [
        "/api/v1/admin/dashboard",
        "/api/v1/admin/users",
        "/api/v1/admin/sources",
        "/api/v1/admin/reports",
        "/api/v1/admin/analytics",
    ]:
        assert path in paths
