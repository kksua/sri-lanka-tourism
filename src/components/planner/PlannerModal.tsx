import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { X } from "lucide-react";
import { emptyTripContext } from "../../schemas/itinerary";
import { useItineraryPlanner } from "../../hooks/useItineraryPlanner";
import type { Destination, DestinationTheme } from "../../types/destination";
import type { TripContext } from "../../types/itinerary";
import FollowUpChat from "./FollowUpChat";
import ItineraryView from "./ItineraryView";
import PreferenceForm from "./PreferenceForm";

const plannerSlides = [
  new URL("../../assets/images/sigiriya rock.avif", import.meta.url).href,
  new URL("../../assets/images/sl.webp", import.meta.url).href,
  new URL("../../assets/images/beruwala-light-house.jpg", import.meta.url).href,
  new URL("../../assets/images/Secret-Beach-Mirissa.jpg", import.meta.url).href,
];

interface PlannerModalProps {
  open: boolean;
  destinations: Destination[];
  themes: DestinationTheme[];
  onClose: () => void;
}

export default function PlannerModal({
  open,
  destinations,
  themes,
  onClose,
}: PlannerModalProps) {
  const [context, setContext] = useState<TripContext>(emptyTripContext);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousItineraryRef = useRef<string | null>(null);
  const { itinerary, messages, isLoading, error, generate, refine } =
    useItineraryPlanner();

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".planner-backdrop", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.26 })
        .fromTo(
          panelRef.current,
          { y: 48, scale: 0.97, autoAlpha: 0 },
          { y: 0, scale: 1, autoAlpha: 1, duration: 0.5 },
          "<",
        );

      const slides = gsap.utils.toArray<HTMLElement>(".planner-panel-slide");
      gsap.set(slides, { autoAlpha: 0, scale: 1.04, zIndex: 0 });
      gsap.set(slides[0], { autoAlpha: 1, scale: 1, zIndex: 1 });

      const slideshow = gsap.timeline({ repeat: -1 });
      slides.forEach((slide, index) => {
        const nextSlide = slides[(index + 1) % slides.length];

        slideshow
          .set(nextSlide, { zIndex: 2, scale: 1.04 })
          .to(
            nextSlide,
            {
              autoAlpha: 1,
              scale: 1,
              duration: 1.4,
              ease: "sine.inOut",
            },
            "+=4",
          )
          .set(slide, { autoAlpha: 0, zIndex: 0 })
          .set(nextSlide, { zIndex: 1 });
      });
    }, panelRef);

    window.setTimeout(() => closeButtonRef.current?.focus(), 60);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!itinerary || !resultRef.current) return;

    const previousGeneratedAt = previousItineraryRef.current;
    previousItineraryRef.current = itinerary.generatedAt;

    if (previousGeneratedAt === itinerary.generatedAt) {
      return;
    }

    gsap.to(resultRef.current, {
      scrollTop: 0,
      duration: 0.55,
      ease: "power2.out",
    });

    if (panelRef.current && window.matchMedia("(max-width: 680px)").matches) {
      gsap.to(panelRef.current, {
        scrollTop: Math.max(resultRef.current.offsetTop - 16, 0),
        duration: 0.55,
        ease: "power2.out",
      });
    }
  }, [itinerary]);

  if (!open) return null;

  return (
    <div className="planner-modal" role="dialog" aria-modal="true">
      <div className="planner-backdrop" onClick={onClose} />
      <div className="planner-panel" ref={panelRef}>
        <div className="planner-panel-background" aria-hidden="true">
          {plannerSlides.map((slide, index) => (
            <img
              className={`planner-panel-slide planner-panel-slide-${index}`}
              src={slide}
              alt=""
              key={slide}
            />
          ))}
        </div>

        <button
          className="planner-close"
          type="button"
          onClick={onClose}
          ref={closeButtonRef}
          aria-label="Close itinerary planner"
        >
          <X size={22} />
        </button>

        <div className="planner-panel-heading">
          <h2>Plan your Sri Lanka journey</h2>
        </div>

        <div className="planner-panel-grid">
          <div>
            <PreferenceForm
              context={context}
              destinations={destinations}
              themes={themes}
              isLoading={isLoading}
              onChange={setContext}
              onSubmit={generate}
            />
            {error && (
              <div className="planner-error" role="alert">
                <p>{error}</p>
              </div>
            )}
          </div>

          <div className="planner-result" ref={resultRef}>
            {itinerary ? (
              <>
                <ItineraryView itinerary={itinerary} />
                <FollowUpChat
                  disabled={isLoading}
                  messages={messages}
                  suggestions={itinerary.followUpSuggestions}
                  onSend={refine}
                />
              </>
            ) : (
              <div className="planner-empty">
                <span>Ready when you are</span>
                <p>
                  The result will appear here with a route sequence, daily
                  rhythm, cultural notes, seasonal notes and route caveats.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
