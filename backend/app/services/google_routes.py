import re

import httpx

from app.config import Settings
from app.schemas.destination import DestinationRecord
from app.schemas.itinerary import RouteLeg


def _parse_duration_hours(duration: str | None) -> float | None:
    if not duration:
        return None
    match = re.match(r"^([0-9.]+)s$", duration)
    if not match:
        return None
    return round(float(match.group(1)) / 3600, 1)


class GoogleRoutesClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def calculate_road_route(
        self,
        origin: DestinationRecord,
        destination: DestinationRecord,
    ) -> RouteLeg | None:
        if not self.settings.google_maps_routes_enabled:
            return None
        if not self.settings.google_maps_api_key:
            return None
        if origin.coordinates is None or destination.coordinates is None:
            return None

        url = "https://routes.googleapis.com/directions/v2:computeRoutes"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.settings.google_maps_api_key,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
        }
        payload = {
            "origin": {
                "location": {
                    "latLng": {
                        "latitude": origin.coordinates.lat,
                        "longitude": origin.coordinates.lng,
                    },
                },
            },
            "destination": {
                "location": {
                    "latLng": {
                        "latitude": destination.coordinates.lat,
                        "longitude": destination.coordinates.lng,
                    },
                },
            },
            "travelMode": "DRIVE",
            "routingPreference": "TRAFFIC_AWARE",
            "computeAlternativeRoutes": False,
            "languageCode": "en-US",
            "units": "METRIC",
        }

        async with httpx.AsyncClient(timeout=self.settings.google_maps_timeout_seconds) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            body = response.json()

        route = (body.get("routes") or [{}])[0]
        distance_km = round((route.get("distanceMeters") or 0) / 1000)
        duration_hours = _parse_duration_hours(route.get("duration"))
        if not distance_km or duration_hours is None:
            return None

        return RouteLeg(
            **{
                "from": origin.name,
                "to": destination.name,
                "distanceKm": distance_km,
                "durationHours": duration_hours,
                "source": "google_routes",
                "label": (
                    f"Approximate road transfer: {distance_km} km, around {duration_hours:g} hours."
                ),
            },
        )
