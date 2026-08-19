import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import experiencesData from "../data/experiences.json";
import type { Experience } from "../types/experience";

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

const experiences = (experiencesData as Experience[]).map((experience) => ({
  ...experience,
  image: resolveImage(experience.image),
}));

export default function ExperienceSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);

  const activeExperience = experiences[activeIndex];

  const currentLabel = useMemo(() => {
    return String(activeIndex + 1).padStart(2, "0");
  }, [activeIndex]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            once: true,
          },
          defaults: { ease: "power3.out" },
        })
        .from(".experience-visual", { x: -36, autoAlpha: 0, duration: 0.8 })
        .from(
          ".experience-copy > *",
          { y: 26, autoAlpha: 0, stagger: 0.08, duration: 0.65 },
          "-=0.45",
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const selectExperience = (nextIndex: number) => {
    if (nextIndex === activeIndex) return;

    const direction = nextIndex > activeIndex ? 1 : -1;

    gsap
      .timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => setActiveIndex(nextIndex),
      })
      .to([imageRef.current, copyRef.current], {
        x: direction * -28,
        autoAlpha: 0,
        duration: 0.22,
      });
  };

  useEffect(() => {
    if (!imageRef.current || !copyRef.current) return;

    gsap.fromTo(
      [imageRef.current, copyRef.current],
      { x: 28, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.48, ease: "power3.out" },
    );
  }, [activeIndex]);

  const showAdjacentExperience = (direction: "prev" | "next") => {
    const offset = direction === "next" ? 1 : -1;
    const nextIndex = (activeIndex + offset + experiences.length) % experiences.length;
    selectExperience(nextIndex);
  };

  return (
    <section className="experience-section" id="experiences" ref={sectionRef}>
      <div className="experience-visual">
        <img ref={imageRef} src={activeExperience.image} alt={activeExperience.name} />
        <div className="experience-controls">
          <button type="button" onClick={() => showAdjacentExperience("prev")} aria-label="Previous experience">
            <ChevronLeft size={21} />
          </button>
          <button type="button" onClick={() => showAdjacentExperience("next")} aria-label="Next experience">
            <ChevronRight size={21} />
          </button>
          <span>{currentLabel}</span>
        </div>
      </div>

      <div className="experience-content">
        <div className="experience-copy" ref={copyRef}>
          <span>Experience Sri Lanka Beyond the Landmarks</span>
          <h2>{activeExperience.name}</h2>
          <p>{activeExperience.description}</p>
        </div>

        <div className="experience-options">
          {experiences.map((experience, index) => (
            <button
              className={`experience-option ${activeIndex === index ? "active" : ""}`}
              type="button"
              key={experience.id}
              onClick={() => selectExperience(index)}
            >
              <img src={experience.image} alt={experience.name} />
              <span>{experience.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
