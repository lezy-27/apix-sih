import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_apix_daily():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/apix/daily")
    assert response.status_code == 200
    data = response.json()
    assert "national_apix_index" in data
    assert "daily_change_pct" in data
    assert "monthly_inflation_pct" in data
    assert "quotes_collected_today" in data

@pytest.mark.asyncio
async def test_apix_history():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/apix/history?days=7")
    assert response.status_code == 200
    data = response.json()
    assert data["range_days"] == 7
    assert len(data["points"]) > 0

@pytest.mark.asyncio
async def test_apix_routes():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/apix/routes")
    assert response.status_code == 200
    data = response.json()
    assert len(data["routes"]) == 6
    routes = [r["route"] for r in data["routes"]]
    assert "DEL-BOM" in routes
    assert "DEL-BLR" in routes

@pytest.mark.asyncio
async def test_elasticity():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/apix/elasticity?route=ALL")
    assert response.status_code == 200
    data = response.json()
    assert len(data["windows"]) == 5
    assert data["windows"][0]["window_label"] == "T+1"

@pytest.mark.asyncio
async def test_fares_explorer():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/fares?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) <= 10
    assert "total" in data

@pytest.mark.asyncio
async def test_scraping_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/scraping/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

@pytest.mark.asyncio
async def test_data_quality():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/data-quality")
    assert response.status_code == 200
    data = response.json()
    assert "quality_score_pct" in data

@pytest.mark.asyncio
async def test_scraping_trigger_run():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/scraping/run", json={"use_mock": True, "routes": ["DEL-BOM"], "advance_days": [7]})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["quotes_collected"] > 0

