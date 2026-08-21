import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.planner import TripContext
from app.services.destination_repository import repository
from app.tools.route_calculator import calculate_geographic_distance


def test_destination_search_includes_required_destination() -> None:
    context = TripContext.model_validate(
        {
            "days": 5,
            "month": "August",
            "startingLocation": "Colombo",
            "preferredThemes": ["culture"],
            "pace": "balanced",
            "requiredDestinations": ["Kandy"],
            "excludedDestinations": [],
        },
    )

    names = [destination.name for destination in repository.search(context)]
    assert "Kandy" in names


def test_geographic_distance_uses_seed_coordinates() -> None:
    colombo = repository.get_by_name("Colombo")
    kandy = repository.get_by_name("Kandy")
    assert colombo is not None
    assert kandy is not None
    assert calculate_geographic_distance(colombo.coordinates, kandy.coordinates) is not None


@pytest.mark.asyncio
async def test_generate_itinerary_api() -> None:
    payload = {
        "days": 3,
        "month": "August",
        "startingLocation": "Colombo",
        "preferredThemes": ["culture", "nature"],
        "pace": "balanced",
        "requiredDestinations": ["Kandy"],
        "excludedDestinations": [],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post("/api/itineraries/generate", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["sessionId"]
    assert len(body["days"]) == 3
    assert "Kandy" in body["destinationSequence"]


@pytest.mark.asyncio
async def test_itinerary_routes_follow_consecutive_day_bases() -> None:
    payload = {
        "days": 4,
        "month": "August",
        "startingLocation": "Colombo",
        "preferredThemes": ["culture", "nature"],
        "pace": "balanced",
        "requiredDestinations": ["Kandy", "Nuwara Eliya", "Ella"],
        "excludedDestinations": [],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post("/api/itineraries/generate", json=payload)

    assert response.status_code == 200
    days = response.json()["days"]
    assert days[0]["route"]["from"] == "Colombo"
    assert days[0]["route"]["to"] == days[0]["base"]
    for previous_day, current_day in zip(days, days[1:]):
        assert current_day["route"]["from"] == previous_day["base"]
        assert current_day["route"]["to"] == current_day["base"]


@pytest.mark.asyncio
async def test_known_start_city_becomes_first_day_base() -> None:
    payload = {
        "days": 3,
        "month": "August",
        "startingLocation": "Galle Fort",
        "preferredThemes": ["culture"],
        "pace": "balanced",
        "requiredDestinations": ["Galle Fort", "Kandy"],
        "excludedDestinations": [],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post("/api/itineraries/generate", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["days"][0]["base"] == "Galle Fort"
    assert body["days"][0]["route"] is None


@pytest.mark.asyncio
async def test_unselected_known_start_city_only_adds_first_day_transfer() -> None:
    payload = {
        "days": 3,
        "month": "August",
        "startingLocation": "Galle Fort",
        "preferredThemes": ["culture"],
        "pace": "balanced",
        "requiredDestinations": ["Kandy"],
        "excludedDestinations": [],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post("/api/itineraries/generate", json=payload)

    assert response.status_code == 200
    first_day = response.json()["days"][0]
    assert first_day["base"] != "Galle Fort"
    assert first_day["route"]["from"] == "Galle Fort"
    assert first_day["route"]["to"] == first_day["base"]


@pytest.mark.asyncio
async def test_arrival_start_adds_first_day_transfer() -> None:
    payload = {
        "days": 3,
        "month": "August",
        "startingLocation": "Bandaranaike International Airport",
        "preferredThemes": ["culture"],
        "pace": "balanced",
        "requiredDestinations": ["Kandy"],
        "excludedDestinations": [],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post("/api/itineraries/generate", json=payload)

    assert response.status_code == 200
    first_day = response.json()["days"][0]
    assert first_day["route"]["from"] == "Bandaranaike International Airport"
    assert first_day["route"]["to"] == first_day["base"]


@pytest.mark.asyncio
async def test_too_many_required_destinations_adds_planning_note() -> None:
    payload = {
        "days": 2,
        "month": "August",
        "startingLocation": "Colombo",
        "preferredThemes": ["culture", "nature"],
        "pace": "balanced",
        "requiredDestinations": ["Kandy", "Nuwara Eliya", "Ella", "Jaffna"],
        "excludedDestinations": [],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post("/api/itineraries/generate", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["planningNote"].startswith(
        "This 2-day itinerary was generated considering the must-see selected destinations:"
    )
    assert "Kandy" in body["planningNote"]
    assert len(body["days"]) == 2
    required_bases = {"Kandy", "Nuwara Eliya", "Ella", "Jaffna"} & {
        day["base"] for day in body["days"]
    }
    assert len(required_bases) <= 2


@pytest.mark.asyncio
async def test_refine_updates_day_count() -> None:
    payload = {
        "days": 3,
        "month": "August",
        "startingLocation": "Colombo",
        "preferredThemes": ["culture", "nature"],
        "pace": "balanced",
        "requiredDestinations": ["Kandy"],
        "excludedDestinations": [],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post("/api/itineraries/generate", json=payload)
        session_id = response.json()["sessionId"]
        refined = await client.post(
            f"/api/itineraries/{session_id}/refine",
            json={"message": "make it 4 days"},
        )

    assert refined.status_code == 200
    body = refined.json()
    assert body["title"].startswith("4-day")
    assert len(body["days"]) == 4


@pytest.mark.asyncio
async def test_refine_adds_requested_theme() -> None:
    payload = {
        "days": 4,
        "month": "August",
        "startingLocation": "Colombo",
        "preferredThemes": ["culture"],
        "pace": "balanced",
        "requiredDestinations": ["Kandy"],
        "excludedDestinations": [],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post("/api/itineraries/generate", json=payload)
        session_id = response.json()["sessionId"]
        refined = await client.post(
            f"/api/itineraries/{session_id}/refine",
            json={"message": "Make it slower with more beach time"},
        )

    assert refined.status_code == 200
    destination_names = refined.json()["destinationSequence"]
    refined_destinations = [
        destination
        for destination in repository.list_destinations()
        if destination.name in destination_names
    ]
    assert any("beach" in destination.themes for destination in refined_destinations)


@pytest.mark.asyncio
async def test_refine_recovers_missing_session_with_context() -> None:
    fallback_context = {
        "days": 3,
        "month": "August",
        "startingLocation": "Colombo",
        "preferredThemes": ["culture"],
        "pace": "balanced",
        "requiredDestinations": ["Kandy"],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        refined = await client.post(
            "/api/itineraries/missing-session/refine",
            json={"message": "make it 4 days", "context": fallback_context},
        )

    assert refined.status_code == 200
    body = refined.json()
    assert body["sessionId"] == "missing-session"
    assert len(body["days"]) == 4
    assert body["context"]["days"] == 4


@pytest.mark.asyncio
async def test_refine_rejects_unsupported_requests() -> None:
    payload = {
        "days": 3,
        "month": "August",
        "startingLocation": "Colombo",
        "preferredThemes": ["culture"],
        "pace": "balanced",
        "requiredDestinations": ["Kandy"],
        "excludedDestinations": [],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post("/api/itineraries/generate", json=payload)
        session_id = response.json()["sessionId"]
        refined = await client.post(
            f"/api/itineraries/{session_id}/refine",
            json={"message": "book me a hotel"},
        )

    assert refined.status_code == 400
    assert refined.json()["detail"] == (
        "That request is outside my itinerary-planning scope. I can adjust your days, "
        "destinations, themes, pace or travel month instead."
    )
