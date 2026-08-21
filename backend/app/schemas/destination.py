from typing import Literal

from pydantic import BaseModel, Field

DestinationTheme = Literal["wildlife", "nature", "beach", "culture", "heritage", "adventure"]


class Coordinates(BaseModel):
    lat: float
    lng: float
    verification_status: Literal["seed", "verified"] = Field(
        default="seed",
        alias="verificationStatus",
    )


class DestinationRecord(BaseModel):
    id: int
    name: str
    province: str
    themes: list[DestinationTheme]
    image: str
    gallery_images: list[str] = Field(alias="galleryImages")
    description: str
    long_description: str = Field(alias="longDescription")
    attractions: list[str]
    coordinates: Coordinates | None = None
    google_place_id: str | None = Field(default=None, alias="googlePlaceId")
    recommended_days: int = Field(default=1, alias="recommendedDays")
    suitable_months: list[str] = Field(default_factory=list, alias="suitableMonths")
    activities: list[str] = Field(default_factory=list)
    nearby_destinations: list[str] = Field(default_factory=list, alias="nearbyDestinations")
    cultural_notes: list[str] = Field(default_factory=list, alias="culturalNotes")
    seasonal_notes: list[str] = Field(default_factory=list, alias="seasonalNotes")
    travel_warnings: list[str] = Field(default_factory=list, alias="travelWarnings")
