from dataclasses import dataclass, field
from datetime import UTC, datetime

from app.schemas.itinerary import ItineraryResult
from app.schemas.planner import TripContext


@dataclass
class PlannerSession:
    session_id: str
    context: TripContext
    itinerary: ItineraryResult
    messages: list[str] = field(default_factory=list)
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class SessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, PlannerSession] = {}

    def set(self, session: PlannerSession) -> None:
        session.updated_at = datetime.now(UTC)
        self._sessions[session.session_id] = session

    def get(self, session_id: str) -> PlannerSession | None:
        return self._sessions.get(session_id)


session_store = SessionStore()
