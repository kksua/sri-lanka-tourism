"""Dry-run helper for later Google Geocoding verification.

This script intentionally does not update destination data unless --apply is
passed. It is meant for the future step where a human reviews Geocoding API
results before promoting seed coordinates to verified coordinates.
"""

import argparse
import asyncio

from app.config import get_settings
from app.services.destination_repository import repository
from app.services.google_geocoding import GoogleGeocodingClient


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Reserved for reviewed updates.")
    parser.add_argument("--force", action="store_true", help="Include already verified coordinates.")
    args = parser.parse_args()

    if args.apply:
        raise SystemExit("Apply mode is intentionally not implemented until results are reviewed.")

    client = GoogleGeocodingClient(get_settings())
    for destination in repository.list_destinations():
        if destination.coordinates and destination.coordinates.verification_status == "verified" and not args.force:
            continue
        result = await client.geocode_destination(f"{destination.name}, Sri Lanka")
        print(
            {
                "name": destination.name,
                "currentCoordinates": destination.coordinates.model_dump() if destination.coordinates else None,
                "googleResultAvailable": result is not None,
            },
        )


if __name__ == "__main__":
    asyncio.run(main())
