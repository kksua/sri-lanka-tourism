from fastapi import APIRouter, Depends, HTTPException

from app.agents.travel_planner import TravelPlannerOrchestrator, UnsupportedRefinementError
from app.config import Settings, get_settings
from app.schemas.itinerary import ItineraryResult
from app.schemas.planner import RefineRequest, TripContext
from app.services.session_store import session_store

router = APIRouter(prefix="/api/itineraries", tags=["itineraries"])


def get_orchestrator(settings: Settings = Depends(get_settings)) -> TravelPlannerOrchestrator:
    return TravelPlannerOrchestrator(settings)


@router.post("/generate", response_model=ItineraryResult, response_model_by_alias=True)
async def generate_itinerary(
    context: TripContext,
    orchestrator: TravelPlannerOrchestrator = Depends(get_orchestrator),
) -> ItineraryResult:
    return await orchestrator.generate(context)


@router.post(
    "/{session_id}/refine", response_model=ItineraryResult, response_model_by_alias=True
)
async def refine_itinerary(
    session_id: str,
    request: RefineRequest,
    orchestrator: TravelPlannerOrchestrator = Depends(get_orchestrator),
) -> ItineraryResult:
    try:
        itinerary = await orchestrator.refine(session_id, request.message, request.context)
    except UnsupportedRefinementError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    if itinerary is None:
        raise HTTPException(status_code=404, detail="Planner session not found")
    return itinerary


@router.get("/{session_id}", response_model=ItineraryResult, response_model_by_alias=True)
async def get_itinerary(session_id: str) -> ItineraryResult:
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Planner session not found")
    return session.itinerary
