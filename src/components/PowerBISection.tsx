import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const insights = [
  {
    value: 2,
    suffix: "M+",
    label: "2025 Total Arrivals",
    note: "Sri Lanka passed the two-million visitor mark in 2025."
  },
  {
    value: 8,
    suffix: "",
    label: "UNESCO Sites",
    note: "Ancient cities, sacred places, rainforests and highlands."
  },
  {
    value: 26,
    suffix: "",
    label: "National Parks",
    note: "Protected landscapes for wildlife, safari routes and birdlife."
  },
  {
    value: 18,
    suffix: "",
    label: "Curated Destinations",
    note: "A balanced mix of coast, culture, wildlife and hill country."
  }
];

export default function PowerBISection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".insights-heading > *", {
        y: 24,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 72%",
          once: true
        }
      });

      gsap.from(".insight-card", {
        y: 34,
        autoAlpha: 0,
        stagger: 0.09,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".insights-grid",
          start: "top 78%",
          once: true
        }
      });

      gsap.utils.toArray<HTMLElement>(".insight-number").forEach((number) => {
        const target = Number(number.dataset.value ?? 0);
        const suffix = number.dataset.suffix ?? "";
        const counter = { value: 0 };

        gsap.to(counter, {
          value: target,
          duration: 1.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: number,
            start: "top 84%",
            once: true
          },
          onUpdate: () => {
            number.textContent = `${Math.round(counter.value)}${suffix}`;
          }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="tourism-insights" id="analytics" ref={sectionRef}>
      <div className="insights-heading">
        <span>Travel pulse</span>
        <h2>Sri Lanka by the numbers</h2>
      </div>

      <div className="insights-grid">
        {insights.map((insight) => (
          <article className="insight-card" key={insight.label}>
            <strong
              className="insight-number"
              data-value={insight.value}
              data-suffix={insight.suffix}
            >
              0{insight.suffix}
            </strong>
            <h3>{insight.label}</h3>
            <p>{insight.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
