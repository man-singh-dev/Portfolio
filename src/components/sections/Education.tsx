"use client";

import { useRef } from "react";
import { SectionHead } from "@/components/ui/motion";
import { EDUCATION } from "@/lib/content";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion, useNearViewport } from "@/lib/hooks";

export default function Education() {
  const ref = useRef<HTMLOListElement>(null);
  useNearViewport(ref, () => {
    if (prefersReducedMotion() || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-edu-line]", { scaleY: 0 }, { scaleY: 1, ease: "none", transformOrigin: "top", scrollTrigger: { trigger: ref.current, start: "top 75%", end: "bottom 60%", scrub: true } });
      gsap.utils.toArray<HTMLElement>("[data-edu-item]").forEach((el) => {
        gsap.from(el, { opacity: 0, x: -30, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 82%", once: true } });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="education" aria-labelledby="edu-title" className="section cv-auto">
      <div className="wrap">
        <SectionHead index="08" label="Education" title="Foundations" id="edu-title" />
        <ol ref={ref} className="relative ml-2 md:ml-4">
          <span data-edu-line aria-hidden="true" className="absolute bottom-2 left-0 top-2 w-px bg-accent" />
          {EDUCATION.map((e) => (
            <li key={e.title} data-edu-item className="relative grid gap-2 pb-14 pl-8 last:pb-0 md:grid-cols-[10rem_1fr_auto] md:items-baseline md:gap-8 md:pl-12">
              <span aria-hidden="true" className="absolute -left-[5px] top-2 h-[11px] w-[11px] rounded-full border-2 border-accent bg-bg" />
              <span className="font-mono text-sm text-muted">{e.period}</span>
              <span>
                <span className="block font-display text-3xl font-extrabold uppercase leading-none md:text-5xl">{e.title}</span>
                <span className="mt-2 block text-sm text-muted md:text-base">{e.place}</span>
              </span>
              <span className="font-display text-4xl font-extrabold leading-none text-accent md:text-6xl">
                {e.score}
                {e.scoreLabel && <span className="ml-2 align-middle font-mono text-xs font-normal text-muted">{e.scoreLabel}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
