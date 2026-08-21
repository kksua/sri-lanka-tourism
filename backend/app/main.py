import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.planner import router as planner_router
from app.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

settings = get_settings()

app = FastAPI(title="Sri Lanka Travel Planner API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)
app.include_router(planner_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
