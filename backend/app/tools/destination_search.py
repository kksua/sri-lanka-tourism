from app.schemas.destination import DestinationRecord
from app.schemas.planner import TripContext
from app.services.destination_repository import repository


def search_destinations(context: TripContext) -> list[DestinationRecord]:
    return repository.search(context)


def get_destination_details(name: str) -> DestinationRecord | None:
    return repository.get_by_name(name)
