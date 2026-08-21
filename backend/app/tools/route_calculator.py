from math import asin, cos, radians, sin, sqrt

from app.schemas.destination import Coordinates, DestinationRecord
from app.schemas.itinerary import RouteLeg


def calculate_geographic_distance(
    origin: Coordinates | None,
    destination: Coordinates | None,
) -> float | None:
    if origin is None or destination is None:
        return None

    radius_km = 6371.0
    lat_delta = radians(destination.lat - origin.lat)
    lng_delta = radians(destination.lng - origin.lng)
    lat1 = radians(origin.lat)
    lat2 = radians(destination.lat)

    value = sin(lat_delta / 2) ** 2 + cos(lat1) * cos(lat2) * sin(lng_delta / 2) ** 2
    return 2 * radius_km * asin(sqrt(value))


def approximate_route_leg(origin: DestinationRecord, destination: DestinationRecord) -> RouteLeg:
    distance = calculate_geographic_distance(origin.coordinates, destination.coordinates)
    if distance is None:
        return RouteLeg(
            **{
                "from": origin.name,
                "to": destination.name,
                "source": "unavailable",
                "label": "Road transfer unavailable; verify routing locally.",
            },
        )

    road_distance = round(distance * 1.28)
    duration = round(max(1.0, road_distance / 42), 1)
    return RouteLeg(
        **{
            "from": origin.name,
            "to": destination.name,
            "distanceKm": road_distance,
            "durationHours": duration,
            "source": "fallback",
            "label": (
                f"Approximate road transfer: {road_distance} km, around {duration:g} hours "
                "(fallback estimate, not Google Routes)."
            ),
        },
    )


def optimise_route(
    start: Coordinates | None,
    destinations: list[DestinationRecord],
) -> list[DestinationRecord]:
    if not destinations:
        return []

    ordered: list[DestinationRecord] = []
    remaining = destinations.copy()
    current = start or remaining[0].coordinates

    while remaining:
        next_destination = min(
            remaining,
            key=lambda destination: calculate_geographic_distance(
                current,
                destination.coordinates,
            )
            or 10_000,
        )
        ordered.append(next_destination)
        remaining.remove(next_destination)
        current = next_destination.coordinates

    return ordered
