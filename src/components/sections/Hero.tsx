"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { bootState, bus } from "@/lib/bus";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion, useCapable3D, useInView, useIsoLayoutEffect } from "@/lib/hooks";
import { asset, PROFILE } from "@/lib/site";
import { Magnetic, ScrambleCycle } from "@/components/ui/motion";

const HeroParticles = dynamic(() => import("@/components/three/HeroParticles"), { ssr: false });

interface Props {
  ticker: string[];
}

export default function Hero({ ticker }: Props) {
  const capable = useCapable3D();
  const [ready, setReady] = useState(false);
  const scatter = useRef(0);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const section = useRef<HTMLElement>(null);
  const [inViewRef, inView] = useInView<HTMLDivElement>({ rootMargin: "100px" });

  // intro choreography after boot
  useIsoLayoutEffect(() => {
    if (prefersReducedMotion() || !section.current) return;
    const ctx = gsap.context(() => {
      gsap.set("[data-hero-in]", { y: 30, opacity: 0 });
      // the name stays painted (it's the LCP element on mobile); it only settles from a slight skew
      gsap.set("[data-hero-letter]", { yPercent: 14, skewY: 6 });
    }, section);
    const play = () =>
      ctx.add(() => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.to("[data-hero-letter]", { yPercent: 0, skewY: 0, duration: 1.4, stagger: 0.045 }, 0.05).to(
          "[data-hero-in]",
          { y: 0, opacity: 1, duration: 1.2, stagger: 0.08 },
          0.35,
        );
      });
    if (bootState.done) play();
    const off = bus.on("booted", play);
    return () => {
      off();
      ctx.revert();
    };
  }, []);

  // scroll: scatter particles, drift + fade the copy, slide kinetic line
  useEffect(() => {
    if (!section.current) return;
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.to(scatter, {
        current: 1,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
      });
      if (reduced) return;
      gsap.to("[data-hero-copy]", {
        yPercent: -30,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-kinetic='a']", {
        xPercent: -18,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-kinetic='b']", {
        xPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!capable) setReady(false);
  }, [capable]);

  const showParticles = capable;
  const name = "MAN SINGH";

  return (
    <section
      id="top"
      ref={section}
      aria-label="Introduction"
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-4 pb-6 pt-28 md:px-10"
    >
      {/* backdrop grid + vignette */}
      <div aria-hidden="true" className="hairline-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

      <div ref={inViewRef} className="pointer-events-none absolute inset-0">
        {showParticles && (
          <HeroParticles anchor={nameRef} scatter={scatter} active={inView} text={name} onReady={() => setReady(true)} />
        )}
      </div>

      <div data-hero-copy className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p data-hero-in className="max-w-md font-mono text-xs leading-relaxed text-muted md:text-sm">
            <span className="text-accent">●</span> AI/ML Research Intern @ IIT Patna
            <br />
            B.Tech CSE @ IIIT Agartala · 2024–2028
          </p>
          <p data-hero-in className="hidden text-right font-mono text-xs leading-relaxed text-muted md:block">
            {PROFILE.location}
            <br />
            open to internships &amp; OSS
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <h1
            ref={nameRef}
            className="font-display select-none text-center text-[clamp(4.5rem,19.5vw,21rem)] font-extrabold uppercase leading-[0.8] transition-opacity duration-700"
            style={{ opacity: showParticles && ready ? 0 : 1 }}
          >
            <span className="sr-only">Man Singh</span>
            <span aria-hidden="true" className="inline-flex overflow-hidden pb-[0.04em]">
              {name.split("").map((ch, i) => (
                <span key={i} data-hero-letter className="inline-block whitespace-pre">
                  {ch}
                </span>
              ))}
            </span>
          </h1>

          <p data-hero-in className="mt-6 text-center font-mono text-sm text-muted md:mt-10 md:text-lg">
            <span className="text-fg">I am a</span>{" "}
            <span className="inline-block min-w-[22ch] text-left text-accent">
              <ScrambleCycle words={PROFILE.roles} />
            </span>
          </p>
        </div>

        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div data-hero-in className="flex flex-wrap gap-3">
            <Magnetic>
              <a
                href={PROFILE.links.github}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-mono text-sm font-medium text-accent-ink"
              >
                GitHub <span aria-hidden="true">↗</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={PROFILE.links.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center gap-2 rounded-full border border-line-strong px-6 font-mono text-sm backdrop-blur-sm hover:border-accent"
              >
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={asset(PROFILE.links.resume)}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center gap-2 rounded-full border border-line-strong px-6 font-mono text-sm backdrop-blur-sm hover:border-accent"
              >
                Resume <span aria-hidden="true">↓</span>
                <span className="sr-only">(PDF)</span>
              </a>
            </Magnetic>
          </div>
          <ul data-hero-in className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted" aria-label="Quick stats">
            {ticker.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* kinetic typography band */}
      <div aria-hidden="true" className="pointer-events-none relative z-0 mt-10 select-none overflow-hidden">
        <div data-kinetic="a" className="font-display whitespace-nowrap text-[clamp(3rem,11vw,10rem)] font-extrabold uppercase leading-[0.85] text-transparent [-webkit-text-stroke:1px_var(--line-strong)]">
          systems + vision — systems + vision — systems + vision
        </div>
        <div data-kinetic="b" className="font-display -ml-[20%] whitespace-nowrap text-[clamp(3rem,11vw,10rem)] font-extrabold uppercase leading-[0.85] text-transparent [-webkit-text-stroke:1px_var(--line-strong)]">
          backend · research · cp — backend · research · cp
        </div>
      </div>
    </section>
  );
}
