# Sri Lanka Planner Backend

FastAPI backend for the itinerary planner. It exposes destination-first itinerary endpoints and keeps OpenAI/Google services optional through environment flags.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Environment

`GOOGLE_MAPS_ROUTES_ENABLED=false` and `GOOGLE_MAPS_GEOCODING_ENABLED=false` keep the app on deterministic seed/fallback behavior. When enabled, Google calls stay in the backend and request only route distance/duration fields.

The OpenAI Agents SDK orchestration objects are scaffolded for one manager/orchestrator with route and experience specialists. The deterministic path remains available for local development and tests.
