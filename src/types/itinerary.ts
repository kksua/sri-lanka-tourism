import type { DestinationTheme } from "./destination";

export type TripPace = "relaxed" | "balanced" | "packed";

export interface TripContext {
  days: number;
  month: string;
  startingLocation: string;
  preferredThemes: DestinationTheme[];
  pace: TripPace;
  requiredDestinations: string[];
}

export interface RouteLeg {
  from: string;
  to: string;
  distanceKm?: number;
  durationHours?: number;
  source: "google_routes" | "fallback" | "unavailable";
  label: string;
}

export interface ItineraryDay {
  day: number;
  base: string;
  morning: string;
  afternoon: string;
  evening: string;
  route?: RouteLeg;
  culturalNotes: string[];
  seasonalNotes: string[];
  warnings: string[];
}

export interface ItineraryResult {
  sessionId: string;
  title: string;
  summary: string;
  destinationSequence: string[];
  planningNote?: string;
  routeNote: string;
  days: ItineraryDay[];
  warnings: string[];
  followUpSuggestions: string[];
  context?: TripContext;
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
