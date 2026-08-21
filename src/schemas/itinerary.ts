import type { DestinationTheme } from "../types/destination";
import type { TripContext, TripPace } from "../types/itinerary";

export const travelMonths = [
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
];

export const paceOptions: TripPace[] = ["relaxed", "balanced", "packed"];

export interface PlannerValidation {
  valid: boolean;
  errors: Partial<Record<keyof TripContext, string>>;
}

export function validateTripContext(context: TripContext): PlannerValidation {
  const errors: PlannerValidation["errors"] = {};

  if (!Number.isInteger(context.days) || context.days < 1 || context.days > 21) {
    errors.days = "Choose 1 to 21 days.";
  }

  if (!travelMonths.includes(context.month)) {
    errors.month = "Choose a travel month.";
  }

  if (context.startingLocation.trim().length < 2) {
    errors.startingLocation = "Add a starting city or arrival point.";
  }

  if (!paceOptions.includes(context.pace)) {
    errors.pace = "Choose a travel pace.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function toggleArrayValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function parseDestinationInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const emptyTripContext: TripContext = {
  days: 7,
  month: "August",
  startingLocation: "Colombo",
  preferredThemes: ["nature", "culture"] as DestinationTheme[],
  pace: "balanced",
  requiredDestinations: [],
};
