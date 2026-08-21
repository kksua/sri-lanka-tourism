from app.schemas.itinerary import RouteLeg


class RouteCache:
    def __init__(self) -> None:
        self._store: dict[tuple[str, str], RouteLeg] = {}

    def get(self, origin: str, destination: str) -> RouteLeg | None:
        return self._store.get((origin.casefold(), destination.casefold()))

    def set(self, origin: str, destination: str, route: RouteLeg) -> None:
        self._store[(origin.casefold(), destination.casefold())] = route


route_cache = RouteCache()
