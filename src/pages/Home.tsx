import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import DestinationCard from "../components/DestinationCard";
import ExperienceSection from "../components/ExperienceSection";
import Hero from "../components/Hero";
import PowerBISection from "../components/PowerBISection";
import ThemeFilter from "../components/ThemeFilter";
import destinationsData from "../data/destinations.json";
import type { Destination, DestinationTheme } from "../types/destination";

gsap.registerPlugin(ScrollTrigger);

const imageModules = import.meta.glob("../assets/images/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const resolveImage = (image: string) => {
  if (!image.startsWith("src/assets/images/")) return image;

  const filename = image.replace("src/assets/images/", "");
  return imageModules[`../assets/images/${filename}`] ?? image;
};

const destinations = (destinationsData as Destination[]).map((destination) => ({
  ...destination,
  image: resolveImage(destination.image),
  galleryImages: destination.galleryImages.map(resolveImage),
}));

export default function Home() {
  const [activeTheme, setActiveTheme] = useState<DestinationTheme | "all">(
    "all",
  );
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const quoteRef = useRef<HTMLElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const galleryPreviewRef = useRef<HTMLImageElement | null>(null);
  const loopTween = useRef<gsap.core.Tween | null>(null);
  const destinationSwitchDirection = useRef<"next" | "prev" | null>(null);

  const themes = useMemo(() => {
    return Array.from(
      new Set(destinations.flatMap((destination) => destination.themes)),
    );
  }, []);

  const filteredDestinations = useMemo(() => {
    if (activeTheme === "all") return destinations;
    return destinations.filter((destination) =>
      destination.themes.includes(activeTheme),
    );
  }, [activeTheme]);

  const sliderDestinations = [...filteredDestinations, ...filteredDestinations];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".quote-line span", {
        yPercent: 115,
        opacity: 0,
        rotate: 2,
        stagger: 0.09,
        duration: 0.9,
        ease: "power4.out",
        scrollTrigger: {
          trigger: quoteRef.current,
          start: "top 68%",
          once: true,
        },
      });
    }, quoteRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const track = sliderRef.current;
    if (!track || filteredDestinations.length === 0) return;

    const startLoop = () => {
      loopTween.current?.kill();

      const firstCard = track.querySelector<HTMLElement>(".destination-card");
      if (!firstCard) return;

      const trackStyles = window.getComputedStyle(track);
      const firstCardCenter =
        Number.parseFloat(trackStyles.paddingLeft) + firstCard.offsetWidth / 2;
      const centeredStart = window.innerWidth / 2 - firstCardCenter;
      const loopDistance = track.scrollWidth / 2;

      gsap.set(track, { x: centeredStart });
      loopTween.current = gsap.to(track, {
        x: centeredStart - loopDistance,
        duration: Math.max(16, filteredDestinations.length * 5),
        repeat: -1,
        ease: "none",
      });
    };

    startLoop();
    window.addEventListener("resize", startLoop);

    return () => {
      loopTween.current?.kill();
      window.removeEventListener("resize", startLoop);
    };
  }, [filteredDestinations.length, activeTheme]);

  useEffect(() => {
    if (!selectedDestination) return;

    setActiveGalleryIndex(0);
    loopTween.current?.pause();
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const isSwitching = destinationSwitchDirection.current;
      const panelStartX = isSwitching === "next" ? 34 : -34;

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          ".destination-detail",
          { autoAlpha: isSwitching ? 1 : 0 },
          { autoAlpha: 1, duration: isSwitching ? 0 : 0.28 },
        )
        .fromTo(
          ".destination-detail-panel",
          {
            x: isSwitching ? panelStartX : 0,
            y: isSwitching ? 0 : 54,
            scale: isSwitching ? 1 : 0.96,
            autoAlpha: 0,
          },
          {
            x: 0,
            y: 0,
            scale: 1,
            autoAlpha: 1,
            duration: isSwitching ? 0.34 : 0.58,
          },
          "<",
        )
        .from(
          ".gallery-main, .destination-detail-copy > *",
          { y: 22, autoAlpha: 0, stagger: 0.06, duration: 0.5 },
          "-=0.2",
        );

      destinationSwitchDirection.current = null;
    });

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, [selectedDestination]);

  const moveSlider = (direction: "prev" | "next") => {
    const tween = loopTween.current;
    if (!tween || filteredDestinations.length === 0) return;

    const step = tween.duration() / filteredDestinations.length;
    const nextTime =
      direction === "next"
        ? tween.totalTime() + step
        : tween.totalTime() - step;

    tween.pause();
    gsap.to(tween, {
      totalTime: nextTime,
      duration: 0.65,
      ease: "power3.inOut",
      onComplete: () => tween.play(),
    });
  };

  const selectGalleryImage = (index: number) => {
    if (index === activeGalleryIndex) return;

    const preview = galleryPreviewRef.current;
    if (!preview) {
      setActiveGalleryIndex(index);
      return;
    }

    gsap
      .timeline()
      .to(preview, {
        autoAlpha: 0,
        scale: 0.96,
        duration: 0.18,
        ease: "power2.in",
        onComplete: () => setActiveGalleryIndex(index),
      })
      .to(preview, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.38,
        ease: "power3.out",
      });
  };

  const closeExpandedCard = () => {
    gsap
      .timeline({
        defaults: { ease: "power2.in" },
        onComplete: () => {
          setSelectedDestination(null);
          loopTween.current?.play();
        },
      })
      .to(".destination-detail-panel", {
        y: 38,
        scale: 0.97,
        autoAlpha: 0,
        duration: 0.26,
      })
      .to(".destination-detail", { autoAlpha: 0, duration: 0.2 }, "<");
  };

  const showAdjacentDestination = (direction: "next" | "prev") => {
    if (!selectedDestination || filteredDestinations.length === 0) return;

    const currentIndex = filteredDestinations.findIndex(
      (destination) => destination.id === selectedDestination.id,
    );
    const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;
    const offset = direction === "next" ? 1 : -1;
    const nextIndex =
      (fallbackIndex + offset + filteredDestinations.length) %
      filteredDestinations.length;

    destinationSwitchDirection.current = direction;

    gsap.to(".destination-detail-panel", {
      x: direction === "next" ? -34 : 34,
      autoAlpha: 0,
      duration: 0.24,
      ease: "power2.inOut",
      onComplete: () => {
        setActiveGalleryIndex(0);
        setSelectedDestination(filteredDestinations[nextIndex]);
      },
    });
  };

  return (
    <>
      <Hero />

      <main>
        <section className="quote-section" id="quote" ref={quoteRef}>
          <p className="quote-line">
            {"'Pearls don't lie on the sea shore. If you want one, you must dive for it'"
              .split(" ")
              .map((word, index) => (
                <span key={`${word}-${index}`}>{word}</span>
              ))}
          </p>
        </section>

        <section className="destinations-section" id="destinations">
          <div className="section-heading">
            <h2>Destination Recommendations</h2>
          </div>

          <ThemeFilter
            themes={themes}
            activeTheme={activeTheme}
            onThemeChange={setActiveTheme}
          />

          <div
            className="destination-slider"
            onMouseEnter={() => loopTween.current?.pause()}
            onMouseLeave={() => loopTween.current?.play()}
          >
            <div className="destination-track" ref={sliderRef}>
              {sliderDestinations.map((destination, index) => (
                <DestinationCard
                  destination={destination}
                  key={`${destination.id}-${index}`}
                  onSelect={setSelectedDestination}
                />
              ))}
            </div>
          </div>

          <div
            className="slider-controls"
            aria-label="Destination slider controls"
          >
            <button type="button" onClick={() => moveSlider("prev")}>
              <ChevronLeft size={19} />
              Prev
            </button>
            <button type="button" onClick={() => moveSlider("next")}>
              Next
              <ChevronRight size={19} />
            </button>
          </div>
        </section>

        <ExperienceSection />
        <PowerBISection />
      </main>

      {selectedDestination && (
        <div
          className="destination-detail"
          role="dialog"
          aria-modal="true"
          onClick={closeExpandedCard}
        >
          <button
            className="expanded-close"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closeExpandedCard();
            }}
            aria-label="Close destination"
          >
            <X size={22} />
          </button>

          <button
            className="expanded-nav expanded-nav-prev"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showAdjacentDestination("prev");
            }}
            aria-label="Show previous destination"
          >
            <ChevronLeft size={30} />
          </button>

          <section
            className="destination-detail-panel"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div
              className="destination-gallery"
              aria-label={`${selectedDestination.name} gallery`}
            >
              <figure className="gallery-main">
                <img
                  ref={galleryPreviewRef}
                  src={selectedDestination.galleryImages[activeGalleryIndex]}
                  alt={`${selectedDestination.name} selected gallery`}
                />
              </figure>

              <div className="gallery-options">
                {selectedDestination.galleryImages.map((image, index) => (
                  <button
                    className={`gallery-option ${
                      activeGalleryIndex === index ? "active" : ""
                    }`}
                    type="button"
                    key={image}
                    onClick={() => selectGalleryImage(index)}
                    aria-label={`Show gallery image ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`${selectedDestination.name} gallery ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="destination-detail-copy">
              <div>
                <small>{selectedDestination.province}</small>
                <h2>{selectedDestination.name}</h2>
              </div>

              <div className="detail-theme-row">
                {selectedDestination.themes.map((theme) => (
                  <span key={theme}>{theme}</span>
                ))}
              </div>

              <p>{selectedDestination.longDescription}</p>

              <div className="attractions-list">
                <small>Main Attractions</small>
                {selectedDestination.attractions.map((attraction) => (
                  <span key={attraction}>{attraction}</span>
                ))}
              </div>
            </div>
          </section>

          <button
            className="expanded-nav expanded-nav-next"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showAdjacentDestination("next");
            }}
            aria-label="Show next destination"
          >
            <ChevronRight size={30} />
          </button>
        </div>
      )}

      <footer className="site-footer">
        <div className="footer-brand">
          <span>Sri Lanka Tourism</span>
          <p>
            A compact guide to island landscapes, living culture, wildlife,
            beaches and travel insights.
          </p>
        </div>

        <nav className="footer-links" aria-label="Page sections">
          <span>Quick Links</span>
          <a href="#quote">Inspiration</a>
          <a href="#destinations">Destinations</a>
          <a href="#experiences">Experiences</a>
          <a href="#analytics">Travel Pulse</a>
        </nav>

        <div className="footer-links">
          <span>Plan Your Visit</span>
          <a href="https://srilanka.travel/" target="_blank" rel="noreferrer">
            Official Tourism
          </a>
          <a href="https://eta.gov.lk/slvisa/" target="_blank" rel="noreferrer">
            Visa Application
          </a>
          <a href="https://meteo.gov.lk/qris/" target="_blank" rel="noreferrer">
            Weather Forecast
          </a>
          <a
            href="https://www.srilanka.travel/airports"
            target="_blank"
            rel="noreferrer"
          >
            Airport Info
          </a>
        </div>

        <div className="footer-note">
          <span>Plan lightly. Travel deeply.</span>
          <p>
            Best explored slowly, with room for weather, festivals and detours.
          </p>
        </div>
      </footer>
    </>
  );
}
