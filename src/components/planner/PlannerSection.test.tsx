import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PlannerSection from "./PlannerSection";
import type { Destination } from "../../types/destination";

vi.mock("gsap", () => ({
  default: {
    context: (callback: () => void) => {
      callback();
      return { revert: vi.fn() };
    },
    from: vi.fn(),
    timeline: () => ({
      from: vi.fn().mockReturnThis(),
    }),
  },
}));

const destinations: Destination[] = [
  {
    id: 1,
    name: "Kandy",
    province: "Central Province",
    themes: ["culture"],
    image: "",
    galleryImages: [],
    description: "Temple city",
    longDescription: "Temple city",
    attractions: ["Temple of the Tooth"],
  },
];

describe("PlannerSection", () => {
  it("renders the planner call to action", () => {
    render(<PlannerSection destinations={destinations} themes={["culture"]} />);

    expect(screen.getByRole("button", { name: /plan now/i })).toBeInTheDocument();
    expect(screen.getByText(/plan your journey/i)).toBeInTheDocument();
    expect(screen.getByText(/colombo or arrival city/i)).toBeInTheDocument();
  });
});
