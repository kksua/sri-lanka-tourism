import { describe, expect, it } from "vitest";
import { emptyTripContext, validateTripContext } from "./itinerary";

describe("validateTripContext", () => {
  it("accepts a complete planner request", () => {
    expect(validateTripContext(emptyTripContext).valid).toBe(true);
  });

  it("rejects invalid day counts and empty starts", () => {
    const result = validateTripContext({
      ...emptyTripContext,
      days: 0,
      startingLocation: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.days).toBeDefined();
    expect(result.errors.startingLocation).toBeDefined();
  });
});
