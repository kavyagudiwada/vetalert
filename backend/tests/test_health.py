from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_root_endpoint():
    resp = client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"]
    assert body["version"] == "1.0.0"
    assert body["docs"] == "/docs"


def test_swagger_docs_available():
    resp = client.get("/docs")
    assert resp.status_code == 200