import json

from app.services.destination_repository import find_project_root

EXPERIENCES_PATH = find_project_root() / "src" / "data" / "experiences.json"


def search_cultural_guidance(theme_names: list[str]) -> list[str]:
    experiences = json.loads(EXPERIENCES_PATH.read_text(encoding="utf-8"))
    notes: list[str] = []
    for experience in experiences:
        name = experience["name"].casefold()
        if any(theme.casefold() in name for theme in theme_names):
            notes.append(experience["description"])
    return notes[:3]
