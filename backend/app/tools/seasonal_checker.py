from app.schemas.destination import DestinationRecord


def check_seasonal_suitability(destination: DestinationRecord, month: str) -> list[str]:
    notes = list(destination.seasonal_notes)
    if destination.suitable_months and month not in destination.suitable_months:
        notes.append(
            f"{month} is outside the seed suitable-month list for {destination.name}; verify weather and access before committing.",
        )
    return notes
