import json
from pathlib import Path

from app.schemas.destination import DestinationRecord
from app.schemas.planner import TripContext


def find_project_root() -> Path:
    for candidate in (Path.cwd(), *Path(__file__).resolve().parents):
        if (candidate / "src" / "data" / "destinations.json").exists():
            return candidate
        if (candidate.parent / "src" / "data" / "destinations.json").exists():
            return candidate.parent
    raise FileNotFoundError("Could not locate src/data/destinations.json")


DESTINATIONS_PATH = find_project_root() / "src" / "data" / "destinations.json"

SEED_COORDINATES: dict[str, tuple[float, float]] = {
    "Yala National Park": (6.3728, 81.5168),
    "Sigiriya Rock Fortress": (7.9568, 80.7603),
    "Ella": (6.8667, 81.0466),
    "Galle Fort": (6.0269, 80.217),
    "Mirissa": (5.9483, 80.4716),
    "Kandy": (7.2906, 80.6337),
    "Nuwara Eliya": (6.9497, 80.7891),
    "Colombo": (6.9271, 79.8612),
    "Dambulla": (7.8567, 80.6492),
    "Jaffna": (9.6615, 80.0255),
    "Trincomalee": (8.5874, 81.2152),
    "Polonnaruwa": (7.9403, 81.0188),
    "Matale": (7.4675, 80.6234),
    "Arugam Bay": (6.8404, 81.8368),
    "Weligama": (5.975, 80.4297),
    "Gampola": (7.1643, 80.5767),
    "Udawalawe": (6.4204, 80.8894),
    "Wilpattu": (8.3698, 80.1039),
}

SEED_MONTHS: dict[str, list[str]] = {
    "beach": ["January", "February", "March", "July", "August", "September"],
    "wildlife": ["February", "March", "June", "July", "August", "September"],
    "nature": ["January", "February", "March", "April", "July", "August"],
    "culture": ["January", "February", "March", "July", "August", "December"],
    "heritage": ["January", "February", "March", "July", "August", "December"],
    "adventure": ["January", "February", "March", "July", "August", "September"],
}


class DestinationRepository:
    def __init__(self, path: Path = DESTINATIONS_PATH) -> None:
        self.path = path
        self._destinations: tuple[DestinationRecord, ...] | None = None

    def list_destinations(self) -> tuple[DestinationRecord, ...]:
        if self._destinations is not None:
            return self._destinations

        raw_destinations = json.loads(self.path.read_text(encoding="utf-8"))
        destinations: list[DestinationRecord] = []

        for raw in raw_destinations:
            name = raw["name"]
            if "coordinates" not in raw and name in SEED_COORDINATES:
                lat, lng = SEED_COORDINATES[name]
                raw["coordinates"] = {
                    "lat": lat,
                    "lng": lng,
                    "verificationStatus": "seed",
                }
            if "recommendedDays" not in raw:
                raw["recommendedDays"] = 2 if len(raw["attractions"]) >= 4 else 1
            if "suitableMonths" not in raw:
                months = {
                    month for theme in raw["themes"] for month in SEED_MONTHS.get(theme, [])
                }
                raw["suitableMonths"] = sorted(months)
            raw.setdefault("activities", raw["attractions"])
            raw.setdefault("nearbyDestinations", [])
            raw.setdefault(
                "culturalNotes",
                [
                    "Respect temple dress codes and local customs around sacred sites.",
                ]
                if "culture" in raw["themes"] or "heritage" in raw["themes"]
                else [],
            )
            raw.setdefault(
                "seasonalNotes",
                ["Weather and sea conditions vary by coast and month; verify locally."],
            )
            raw.setdefault(
                "travelWarnings",
                ["Seed metadata requires verification before production use."],
            )
            destinations.append(DestinationRecord.model_validate(raw))

        self._destinations = tuple(destinations)
        return self._destinations

    def get_by_name(self, name: str) -> DestinationRecord | None:
        normalized = name.casefold().strip()
        return next(
            (
                destination
                for destination in self.list_destinations()
                if destination.name.casefold() == normalized
            ),
            None,
        )

    def search(self, context: TripContext) -> list[DestinationRecord]:
        excluded = {name.casefold() for name in context.excluded_destinations}
        required = [
            destination
            for destination in (
                self.get_by_name(name) for name in context.required_destinations
            )
            if destination is not None
        ]

        candidates = [
            destination
            for destination in self.list_destinations()
            if destination.name.casefold() not in excluded
        ]

        def score(destination: DestinationRecord) -> tuple[int, int, int]:
            theme_score = len(set(context.preferred_themes) & set(destination.themes))
            month_score = 1 if context.month in destination.suitable_months else 0
            required_score = 3 if any(item.name == destination.name for item in required) else 0
            return required_score, theme_score, month_score

        ordered = sorted(candidates, key=score, reverse=True)
        selected = list(required)
        for destination in ordered:
            if all(item.name != destination.name for item in selected):
                selected.append(destination)
            if len(selected) >= max(3, min(context.days, 8)):
                break

        return selected


repository = DestinationRepository()
