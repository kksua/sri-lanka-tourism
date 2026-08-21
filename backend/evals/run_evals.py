import asyncio
import json
from pathlib import Path

from app.agents.travel_planner import TravelPlannerOrchestrator
from app.config import get_settings
from app.schemas.planner import TripContext


async def main() -> None:
    cases_path = Path(__file__).with_name("itinerary_cases.json")
    cases = json.loads(cases_path.read_text(encoding="utf-8"))
    orchestrator = TravelPlannerOrchestrator(get_settings())
    failures: list[str] = []

    for case in cases:
        itinerary = await orchestrator.generate(TripContext.model_validate(case["input"]))
        if "matches_day_count" in case["checks"] and len(itinerary.days) != case["input"]["days"]:
            failures.append(f"{case['name']}: day count mismatch")
        if "includes_required" in case["checks"]:
            for destination in case["input"]["requiredDestinations"]:
                if destination not in itinerary.destination_sequence:
                    failures.append(f"{case['name']}: missing {destination}")
        if "excludes_destinations" in case["checks"]:
            for destination in case["input"]["excludedDestinations"]:
                if destination in itinerary.destination_sequence:
                    failures.append(f"{case['name']}: included excluded {destination}")

    if failures:
        raise SystemExit("\n".join(failures))
    print(f"Passed {len(cases)} itinerary eval cases.")


if __name__ == "__main__":
    asyncio.run(main())
