from app.schemas.itinerary import ItineraryResult
from app.schemas.planner import TripContext

BANNED_TOPICS = ("hotel", "flight", "price", "budget", "taxi booking", "book transport")


def validate_itinerary(itinerary: ItineraryResult, context: TripContext) -> list[str]:
    warnings: list[str] = []
    if len(itinerary.days) != context.days:
        warnings.append("The itinerary day count was corrected to match the requested duration.")

    serialized = itinerary.model_dump_json().casefold()
    for topic in BANNED_TOPICS:
        if topic in serialized:
            warnings.append(f"Planner output should avoid recommendations about {topic}.")

    if context.excluded_destinations:
        excluded = {name.casefold() for name in context.excluded_destinations}
        sequence = {name.casefold() for name in itinerary.destination_sequence}
        if excluded & sequence:
            warnings.append("An excluded destination appeared in the route and needs removal.")

    return warnings
