import type { ItineraryResult, TripContext } from "../types/itinerary";

const API_BASE_URL =
  import.meta.env.VITE_PLANNER_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.detail ??
        body?.message ??
        `Planner request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export function generateItinerary(context: TripContext) {
  return requestJson<ItineraryResult>("/api/itineraries/generate", {
    method: "POST",
    body: JSON.stringify(context),
  });
}

export function refineItinerary(
  sessionId: string,
  message: string,
  context?: TripContext,
) {
  return requestJson<ItineraryResult>(`/api/itineraries/${sessionId}/refine`, {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
}

export function getItinerary(sessionId: string) {
  return requestJson<ItineraryResult>(`/api/itineraries/${sessionId}`);
}
