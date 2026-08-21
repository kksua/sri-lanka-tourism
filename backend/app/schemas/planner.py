from typing import Literal

from pydantic import BaseModel, Field, field_validator

DestinationTheme = Literal["wildlife", "nature", "beach", "culture", "heritage", "adventure"]
TripPace = Literal["relaxed", "balanced", "packed"]

MONTHS = {
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
}


class TripContext(BaseModel):
    days: int = Field(ge=1, le=21)
    month: str
    starting_location: str = Field(alias="startingLocation", min_length=2, max_length=80)
    preferred_themes: list[DestinationTheme] = Field(default_factory=list, alias="preferredThemes")
    pace: TripPace = "balanced"
    required_destinations: list[str] = Field(default_factory=list, alias="requiredDestinations")
    excluded_destinations: list[str] = Field(default_factory=list, alias="excludedDestinations")

    @field_validator("month")
    @classmethod
    def valid_month(cls, value: str) -> str:
        if value not in MONTHS:
            raise ValueError("month must be a calendar month name")
        return value

    @field_validator("required_destinations", "excluded_destinations")
    @classmethod
    def normalize_destinations(cls, values: list[str]) -> list[str]:
        return [value.strip() for value in values if value.strip()]


class RefineRequest(BaseModel):
    message: str = Field(min_length=2, max_length=800)
    context: TripContext | None = None
