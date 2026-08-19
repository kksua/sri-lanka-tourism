import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Menu, X } from "lucide-react";

const slides = [
  new URL("../assets/images/sigiriya rock.avif", import.meta.url).href,
  new URL("../assets/images/sl.webp", import.meta.url).href,
  new URL("../assets/images/beruwala-light-house.jpg", import.meta.url).href,
  new URL("../assets/images/Secret-Beach-Mirissa.jpg", import.meta.url).href,
];

export default function Hero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuTween = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          ".hero-curve",
          { clipPath: "ellipse(55% 0% at 50% 0%)" },
          { clipPath: "ellipse(135% 120% at 50% 0%)", duration: 1.25 },
        )
        .from(
          ".hero-copy > *",
          { y: 36, opacity: 0, stagger: 0.12, duration: 0.9 },
          "-=0.55",
        );

      const heroSlides = gsap.utils.toArray<HTMLElement>(".hero-slide");
      gsap.set(heroSlides, { autoAlpha: 0, zIndex: 0 });
      gsap.set(heroSlides[0], { autoAlpha: 1, zIndex: 1 });

      const slideshow = gsap.timeline({ repeat: -1 });
      heroSlides.forEach((slide, index) => {
        const nextSlide = heroSlides[(index + 1) % heroSlides.length];

        slideshow
          .set(nextSlide, { zIndex: 2 })
          .to(
            nextSlide,
            {
              autoAlpha: 1,
              duration: 1.35,
              ease: "sine.inOut",
            },
            "+=3.2",
          )
          .set(slide, { autoAlpha: 0, zIndex: 0 })
          .set(nextSlide, { zIndex: 1 });
      });

      menuTween.current = gsap
        .timeline({
          paused: true,
          reversed: true,
          defaults: { ease: "expo.inOut" },
        })
        .to(".menu-panel", { y: 0, opacity: 1, duration: 0.7 })
        .from(
          ".menu-link",
          { y: 22, opacity: 0, stagger: 0.07, duration: 0.45 },
          "-=0.35",
        );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const toggleMenu = () => {
    const tween = menuTween.current;
    if (!tween) return;
    if (tween.reversed()) {
      tween.play();
    } else {
      tween.reverse();
    }
  };

  return (
    <section className="hero" ref={rootRef}>
      <div className="hero-curve">
        {slides.map((slide, index) => (
          <img
            className={`hero-slide hero-slide-${index}`}
            src={slide}
            alt=""
            aria-hidden="true"
            key={slide}
          />
        ))}
        <div className="hero-shade" />
      </div>

      <button
        className="menu-button"
        type="button"
        onClick={toggleMenu}
        aria-label="Open navigation"
      >
        <Menu size={21} />
      </button>

      <div className="menu-panel" ref={menuRef}>
        <button
          className="menu-close"
          type="button"
          onClick={toggleMenu}
          aria-label="Close navigation"
        >
          <X size={22} />
        </button>
        <a className="menu-link" href="#quote" onClick={toggleMenu}>
          Inspiration
        </a>
        <a className="menu-link" href="#destinations" onClick={toggleMenu}>
          Destinations
        </a>
        <a className="menu-link" href="#experiences" onClick={toggleMenu}>
          Experiences
        </a>
        <a className="menu-link" href="#analytics" onClick={toggleMenu}>
          Analytics
        </a>
      </div>

      <div className="hero-copy">
        <span>Island journeys shaped by ocean, forest and ancient stone</span>
        <h1>Sri Lanka</h1>
        <p>
          Discover wild national parks, tea-country trails, sacred cities and
          warm southern beaches in one unforgettable island route.
        </p>
      </div>
    </section>
  );
}
