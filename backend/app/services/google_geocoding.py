import httpx

from app.config import Settings


class GoogleGeocodingClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def geocode_destination(self, query: str) -> dict[str, object] | None:
        if not self.settings.google_maps_geocoding_enabled:
            return None
        if not self.settings.google_maps_api_key:
            return None

        url = "https://geocode.googleapis.com/v4/geocode:geocodeAddress"
        headers = {
            "X-Goog-Api-Key": self.settings.google_maps_api_key,
            "Content-Type": "application/json",
        }
        payload = {"address": {"addressLines": [query], "regionCode": "LK"}}

        async with httpx.AsyncClient(
            timeout=self.settings.google_maps_timeout_seconds
        ) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
