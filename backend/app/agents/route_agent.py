from app.config import Settings
from app.schemas.destination import DestinationRecord
from app.schemas.itinerary import RouteLeg
from app.services.google_routes import GoogleRoutesClient
from app.services.route_cache import route_cache
from app.tools.route_calculator import approximate_route_leg

try:
    from agents import Agent
except ImportError:  # pragma: no cover - exercised only when SDK is absent.
    Agent = None  # type: ignore[assignment]


class RouteSpecialist:
    def __init__(self, settings: Settings) -> None:
        self.google_routes = GoogleRoutesClient(settings)
        self.agent = (
            Agent(
                name="Sri Lanka Route Specialist",
                instructions=(
                    "Compare route legs for Sri Lanka itineraries. Return only distance "
                    "and duration evidence; do not recommend transport bookings."
                ),
            )
            if Agent is not None
            else None
        )

    async def calculate_road_route(
        self,
        origin: DestinationRecord,
        destination: DestinationRecord,
    ) -> RouteLeg:
        cached = route_cache.get(origin.name, destination.name)
        if cached:
            return cached

        route = await self.google_routes.calculate_road_route(origin, destination)
        if route is None:
            route = approximate_route_leg(origin, destination)

        route_cache.set(origin.name, destination.name, route)
        return route
