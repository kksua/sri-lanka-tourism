from app.schemas.destination import DestinationRecord
from app.tools.cultural_search import search_cultural_guidance

try:
    from agents import Agent
except ImportError:  # pragma: no cover
    Agent = None  # type: ignore[assignment]


class ExperienceSpecialist:
    def __init__(self) -> None:
        self.agent = (
            Agent(
                name="Sri Lanka Experience Specialist",
                instructions=(
                    "Provide concise cultural and seasonal context for Sri Lanka travel. "
                    "Avoid hotel, flight, budget, and booking advice."
                ),
            )
            if Agent is not None
            else None
        )

    def guidance_for(self, destination: DestinationRecord) -> list[str]:
        notes = list(destination.cultural_notes)
        notes.extend(search_cultural_guidance(list(destination.themes)))
        return notes[:3]
