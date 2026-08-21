import re
from datetime import UTC, datetime
from uuid import uuid4

from app.agents.experience_agent import ExperienceSpecialist
from app.agents.route_agent import RouteSpecialist
from app.config import Settings
from app.schemas.destination import Coordinates, DestinationRecord
from app.schemas.itinerary import ItineraryDay, ItineraryResult
from app.schemas.planner import TripContext
from app.services.destination_repository import repository
from app.services.session_store import PlannerSession, session_store
from app.tools.destination_search import search_destinations
from app.tools.itinerary_validator import validate_itinerary
from app.tools.route_calculator import optimise_route
from app.tools.seasonal_checker import check_seasonal_suitability

try:
    from agents import Agent
except ImportError:  # pragma: no cover
    Agent = None  # type: ignore[assignment]


SEED_STARTS: dict[str, Coordinates] = {
    "colombo": Coordinates(lat=6.9271, lng=79.8612, verificationStatus="seed"),
    "bandaranaike international airport": Coordinates(
        lat=7.1808,
        lng=79.8841,
        verificationStatus="seed",
    ),
    "negombo": Coordinates(lat=7.2083, lng=79.8358, verificationStatus="seed"),
}

THEME_KEYWORDS = {
    "beach": ("beach", "beaches", "coast", "coastal", "ocean", "sea", "surf"),
    "wildlife": ("wildlife", "safari", "leopard", "elephant", "birds"),
    "nature": ("nature", "tea", "hill", "hills", "waterfall", "forest"),
    "culture": ("culture", "cultural", "festival", "perahera", "temple", "food"),
    "heritage": ("heritage", "history", "historic", "ancient", "ruins"),
    "adventure": ("adventure", "hike", "hiking", "surf", "active"),
}

MINIMUM_REQUIRED_DESTINATION_COUNT = 1


class UnsupportedRefinementError(ValueError):
    pass


class TravelPlannerOrchestrator:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.route_specialist = RouteSpecialist(settings)
        self.experience_specialist = ExperienceSpecialist()
        self.agent = (
            Agent(
                name="Sri Lanka Travel Planner Orchestrator",
                instructions=(
                    "Create destination-first Sri Lanka itineraries using only supplied "
                    "tools and structured output. Do not recommend hotels, flights, "
                    "transport bookings, budgets, or prices. Include road-transfer "
                    "labels only when route evidence is supplied."
                ),
                output_type=ItineraryResult,
            )
            if Agent is not None and settings.openai_api_key
            else None
        )

    async def generate(self, context: TripContext) -> ItineraryResult:
        destinations = search_destinations(context)
        destinations, planning_note = self._fit_required_destinations_to_days(
            context,
            destinations,
        )
        ordered, start_origin = self._prepare_route_destinations(context, destinations)
        itinerary = await self._compose_itinerary(
            context,
            ordered,
            uuid4().hex,
            start_origin,
            planning_note,
        )
        validation_warnings = validate_itinerary(itinerary, context)
        itinerary.warnings.extend(
            warning for warning in validation_warnings if warning not in itinerary.warnings
        )
        session_store.set(
            PlannerSession(
                session_id=itinerary.session_id,
                context=context,
                itinerary=itinerary,
            ),
        )
        return itinerary

    async def refine(
        self,
        session_id: str,
        message: str,
        fallback_context: TripContext | None = None,
    ) -> ItineraryResult | None:
        session = session_store.get(session_id)
        if session is None and fallback_context is None:
            return None

        base_context = session.context if session is not None else fallback_context
        if base_context is None:
            return None

        context = self._refine_context_from_message(base_context, message)
        destinations = search_destinations(context)
        destinations, planning_note = self._fit_required_destinations_to_days(
            context,
            destinations,
        )
        if self._requests_fewer_moves(message):
            required_count = min(len(context.required_destinations), context.days)
            destination_count = max(required_count, max(1, (context.days + 1) // 2))
            destinations = destinations[:destination_count]

        ordered, start_origin = self._prepare_route_destinations(context, destinations)
        refined = await self._compose_itinerary(
            context,
            ordered,
            session_id,
            start_origin,
            planning_note,
        )
        refined.summary = f"Refined: {refined.summary}"
        if session is None:
            session = PlannerSession(
                session_id=session_id,
                context=context,
                itinerary=refined,
                messages=[message],
            )
        else:
            session.messages.append(message)
            session.context = context
            session.itinerary = refined
        session_store.set(session)
        return refined

    def _refine_context_from_message(self, context: TripContext, message: str) -> TripContext:
        normalized = message.casefold()
        updates: dict[str, object] = {}

        days_match = re.search(r"\b([1-9]|1[0-9]|2[0-1])\s*days?\b", normalized)
        if days_match:
            updates["days"] = int(days_match.group(1))

        for month in (
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ):
            if month.casefold() in normalized:
                updates["month"] = month
                break

        start_location = self._extract_starting_location(normalized)
        if start_location is not None:
            updates["starting_location"] = start_location

        if self._requests_fewer_moves(message) or "relaxed" in normalized:
            updates["pace"] = "relaxed"
        elif any(word in normalized for word in ("packed", "busy", "faster", "more stops")):
            updates["pace"] = "packed"
        elif "balanced" in normalized:
            updates["pace"] = "balanced"

        preferred_themes = list(context.preferred_themes)
        for theme, keywords in THEME_KEYWORDS.items():
            if any(keyword in normalized for keyword in keywords) and theme not in preferred_themes:
                preferred_themes.append(theme)  # type: ignore[arg-type]
        if preferred_themes != context.preferred_themes:
            updates["preferred_themes"] = preferred_themes

        required_destinations = list(context.required_destinations)
        for destination in repository.list_destinations():
            if (
                destination.name.casefold() in normalized
                and destination.name not in required_destinations
            ):
                required_destinations.append(destination.name)
        if required_destinations != context.required_destinations:
            updates["required_destinations"] = required_destinations

        if not updates:
            raise UnsupportedRefinementError(
                "That request is outside my itinerary-planning scope. I can adjust your days, destinations, themes, pace or travel month instead."
            )

        return context.model_copy(update=updates) if updates else context

    def _extract_starting_location(self, normalized_message: str) -> str | None:
        if not any(
            phrase in normalized_message
            for phrase in ("start", "starting", "begin", "from")
        ):
            return None

        starting_options = {
            "colombo": "Colombo",
            "bandaranaike international airport": "Bandaranaike International Airport",
        }
        starting_options.update(
            {
                destination.name.casefold(): destination.name
                for destination in repository.list_destinations()
            },
        )
        for normalized_name, name in starting_options.items():
            if normalized_name in normalized_message:
                return name
        return None

    @staticmethod
    def _requests_fewer_moves(message: str) -> bool:
        normalized = message.casefold()
        return any(
            phrase in normalized
            for phrase in (
                "slower",
                "fewer overnight",
                "less overnight",
                "fewer moves",
                "less moving",
                "less rushed",
            )
        )

    def _prepare_route_destinations(
        self,
        context: TripContext,
        destinations: list[DestinationRecord],
    ) -> tuple[list[DestinationRecord], DestinationRecord | None]:
        start_origin = self._resolve_start_origin(context.starting_location)
        route_destinations = destinations.copy()
        start_destination = (
            repository.get_by_name(start_origin.name)
            if start_origin is not None
            else None
        )

        if start_destination is not None and any(
            destination.name == start_destination.name for destination in route_destinations
        ):
            remaining = [
                destination
                for destination in route_destinations
                if destination.name != start_destination.name
            ]
            return (
                [start_destination]
                + optimise_route(start_destination.coordinates, remaining),
                start_origin,
            )

        start_coordinates = start_origin.coordinates if start_origin is not None else None
        return optimise_route(start_coordinates, route_destinations), start_origin

    def _fit_required_destinations_to_days(
        self,
        context: TripContext,
        destinations: list[DestinationRecord],
    ) -> tuple[list[DestinationRecord], str | None]:
        if len(context.required_destinations) <= context.days:
            return destinations, None

        feasible_required_count = max(MINIMUM_REQUIRED_DESTINATION_COUNT, context.days)
        required_names = set(context.required_destinations)
        required_destinations = [
            destination
            for destination in destinations
            if destination.name in required_names
        ]
        must_see_destinations = required_destinations[:feasible_required_count]
        must_see_names = {destination.name for destination in must_see_destinations}
        filtered_destinations = [
            destination
            for destination in destinations
            if destination.name in must_see_names or destination.name not in required_names
        ]
        considered = ", ".join(destination.name for destination in must_see_destinations)
        skipped = [
            destination.name
            for destination in required_destinations
            if destination.name not in must_see_names
        ]
        skipped_copy = f" Other selected destinations can be added by increasing the trip length."
        if skipped:
            skipped_copy = (
                f" {', '.join(skipped)} can be added by increasing the trip length."
            )

        return (
            filtered_destinations,
            (
                f"This {context.days}-day itinerary was generated considering the must-see "
                f"selected destinations: {considered}.{skipped_copy}"
            ),
        )

    def _resolve_start_origin(self, starting_location: str) -> DestinationRecord | None:
        start_destination = repository.get_by_name(starting_location)
        if start_destination is not None:
            return start_destination

        coordinates = SEED_STARTS.get(starting_location.casefold())
        if coordinates is None:
            return None

        return DestinationRecord.model_validate(
            {
                "id": 0,
                "name": starting_location,
                "province": "Arrival point",
                "themes": ["culture"],
                "image": "",
                "galleryImages": [],
                "description": f"Starting point for this itinerary: {starting_location}.",
                "longDescription": f"Starting point for this itinerary: {starting_location}.",
                "attractions": [starting_location],
                "coordinates": coordinates.model_dump(by_alias=True),
                "recommendedDays": 0,
                "suitableMonths": [],
                "activities": [],
                "nearbyDestinations": [],
                "culturalNotes": [],
                "seasonalNotes": [],
                "travelWarnings": [],
            },
        )

    async def _compose_itinerary(
        self,
        context: TripContext,
        destinations: list[DestinationRecord],
        session_id: str,
        start_origin: DestinationRecord | None = None,
        planning_note: str | None = None,
    ) -> ItineraryResult:
        destination_sequence = [destination.name for destination in destinations]
        days: list[ItineraryDay] = []
        pace_copy = {
            "relaxed": "Leave wider pauses and keep one main focus today.",
            "balanced": "Mix one major sight with a softer second stop.",
            "packed": "Use the day actively while keeping meals and weather buffers.",
        }[context.pace]

        day_destinations = [
            destinations[index % len(destinations)] for index in range(context.days)
        ]

        for day_number, destination in enumerate(day_destinations, start=1):
            previous = (
                day_destinations[day_number - 2]
                if day_number > 1
                else start_origin
            )
            if previous is not None and previous.name == destination.name:
                previous = None
            route = (
                await self.route_specialist.calculate_road_route(previous, destination)
                if previous is not None
                else None
            )
            attractions = destination.attractions or [destination.name]
            days.append(
                ItineraryDay(
                    day=day_number,
                    base=destination.name,
                    morning=f"Start with {attractions[0]} and orient around {destination.name}.",
                    afternoon=(
                        f"Continue with {attractions[min(1, len(attractions) - 1)]}. {pace_copy}"
                    ),
                    evening=(
                        f"Keep the evening light near {destination.name}, with time for local food or a quiet walk."
                    ),
                    route=route,
                    culturalNotes=self.experience_specialist.guidance_for(destination),
                    seasonalNotes=check_seasonal_suitability(destination, context.month),
                    warnings=destination.travel_warnings[:1],
                ),
            )

        route_note = (
            "Actual travel time depends on traffic, road conditions, stops and the chosen transport method."
        )
        warnings = [route_note]
        return ItineraryResult(
            sessionId=session_id,
            title=f"{context.days}-day Sri Lanka route from {context.starting_location}",
            summary=(
                f"A {context.pace} {context.days}-day journey through "
                f"{', '.join(destination_sequence[:4])}"
                f"{' and more' if len(destination_sequence) > 4 else ''}."
            ),
            destinationSequence=destination_sequence,
            planningNote=planning_note,
            routeNote=route_note,
            days=days,
            warnings=warnings,
            followUpSuggestions=[
                "Make it 4 days",
                "Change month to December",
                "Add more beach destinations",
            ],
            context=context,
            generatedAt=datetime.now(UTC),
        )
