from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.planner import TripContext


class RouteLeg(BaseModel):
    from_: str = Field(alias="from")
    to: str
    distance_km: float | None = Field(default=None, alias="distanceKm")
    duration_hours: float | None = Field(default=None, alias="durationHours")
    source: Literal["google_routes", "fallback", "unavailable"]
    label: str


class ItineraryDay(BaseModel):
    day: int
    base: str
    morning: str
    afternoon: str
    evening: str
    route: RouteLeg | None = None
    cultural_notes: list[str] = Field(default_factory=list, alias="culturalNotes")
    seasonal_notes: list[str] = Field(default_factory=list, alias="seasonalNotes")
    warnings: list[str] = Field(default_factory=list)


class ItineraryResult(BaseModel):
    session_id: str = Field(alias="sessionId")
    title: str
    summary: str
    destination_sequence: list[str] = Field(alias="destinationSequence")
    planning_note: str | None = Field(default=None, alias="planningNote")
    route_note: str = Field(alias="routeNote")
    days: list[ItineraryDay]
    warnings: list[str] = Field(default_factory=list)
    follow_up_suggestions: list[str] = Field(alias="followUpSuggestions")
    context: TripContext | None = None
    generated_at: datetime = Field(alias="generatedAt")
