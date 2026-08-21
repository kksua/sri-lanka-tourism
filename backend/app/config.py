from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-5-mini"
    frontend_origin: str = "http://localhost:5173"
    max_agent_turns: int = 8
    google_maps_api_key: str = ""
    google_maps_routes_enabled: bool = False
    google_maps_geocoding_enabled: bool = False
    google_maps_timeout_seconds: float = 5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
