import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  CalendarDays,
  ChevronRight,
  Compass,
  MapPinned,
} from "lucide-react";
import type { Destination, DestinationTheme } from "../../types/destination";
import PlannerModal from "./PlannerModal";

const plannerImage = new URL(
  "../../assets/images/Sri-Lanka-1.jpg",
  import.meta.url,
).href;

interface PlannerSectionProps {
  destinations: Destination[];
  themes: DestinationTheme[];
}

export default function PlannerSection({
  destinations,
  themes,
}: PlannerSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          once: true,
        },
      });

      timeline
        .from(".planner-visual", {
          y: 42,
          scale: 0.98,
          autoAlpha: 0,
          duration: 0.85,
          ease: "power3.out",
        })
        .from(
          ".planner-card h2, .planner-card p",
          {
            y: 24,
            autoAlpha: 0,
            stagger: 0.08,
            duration: 0.62,
            ease: "power3.out",
          },
          "-=0.44",
        )
        .from(
          ".planner-search-card",
          {
            y: 38,
            autoAlpha: 0,
            duration: 0.7,
            ease: "back.out(1.2)",
          },
          "-=0.2",
        )
        .from(
          ".planner-search-item, .planner-search-action",
          {
            y: 18,
            autoAlpha: 0,
            stagger: 0.07,
            duration: 0.45,
            ease: "power2.out",
          },
          "-=0.42",
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="planner-section" id="planner" ref={sectionRef}>
      <div className="planner-card">
        <div className="planner-copy">
          <h2>Plan your journey</h2>
          <p>
            Set your route around days, season and travel style, then let the
            planner shape a smoother Sri Lanka itinerary.
          </p>
        </div>

        <figure className="planner-visual">
          <img
            src={plannerImage}
            alt="Tea estates and winding roads in Sri Lanka"
          />
        </figure>

        <div className="planner-search-card" aria-label="Planner highlights">
          <span className="planner-search-item">
            <MapPinned size={18} />
            <span>
              <small>Start</small>
              Colombo or arrival city
            </span>
          </span>
          <span className="planner-search-item">
            <CalendarDays size={18} />
            <span>
              <small>Season</small>
              Month-aware routing
            </span>
          </span>
          <span className="planner-search-item">
            <Compass size={18} />
            <span>
              <small>Pace</small>
              Relaxed to packed
            </span>
          </span>
          <button
            className="planner-search-action"
            type="button"
            onClick={() => setOpen(true)}
          >
            Plan now
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <PlannerModal
        open={open}
        destinations={destinations}
        themes={themes}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
