"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import CrukxMorph from "@/components/experience/CrukxMorph";
import PitchSVG from "@/components/experience/PitchSVG";
import VlmOverlay from "@/components/experience/VlmOverlay";
import { SectionHead } from "@/components/ui/motion";
import { EXPERIENCE } from "@/lib/content";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useCapable3D, useInView, useNearViewport, useMediaQuery, useReducedMotion } from "@/lib/hooks";

const PitchScene = dynamic(() => import("@/components/three/PitchScene"), { ssr: false });

export default function Experience() {
  const capable = useCapable3D();
  const reduced = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 1024px) and (min-height: 760px)", true);
  const pinned = desktop && !reduced;

  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const iitPanel = useRef<HTMLDivElement>(null);
  const crukxPanel = useRef<HTMLDivElement>(null);
  const pitchRef = useRef(0);
  const [pitchT, setPitchT] = useState(reduced ? 1 : 0);
  const [morphT, setMorphT] = useState(reduced ? 1 : 0);
  const [pitchVisRef, pitchVisible] = useInView<HTMLDivElement>({ rootMargin: "200px" });

  useNearViewport(wrap, () => {
    if (reduced) {
      pitchRef.current = 1;
      setPitchT(1);
      setMorphT(1);
      return;
    }
    const ctx = gsap.context(() => {
      const setPitch = (v: number) => {
        pitchRef.current = v;
        setPitchT(v);
      };
      if (pinned && track.current && wrap.current) {
        // pitch plays → slide to Crukx → morph plays
        const state = { pitch: 0, morph: 0 };
        const distance = () => track.current!.scrollWidth - window.innerWidth;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: wrap.current,
            pin: true,
            scrub: 0.6,
            start: "top top",
            end: () => `+=${window.innerHeight * 3.2}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        tl.to(state, { pitch: 1, duration: 1.4, onUpdate: () => setPitch(state.pitch) })
          .to(track.current, { x: () => -distance(), duration: 1 })
          .to(state, { morph: 1, duration: 0.9, onUpdate: () => setMorphT(state.morph) })
          .to({}, { duration: 0.15 });
        // sections below may have created their triggers already; re-measure with the pin spacer
        requestAnimationFrame(() => ScrollTrigger.refresh());
      } else {
        ScrollTrigger.create({
          trigger: iitPanel.current,
          start: "top 75%",
          end: "bottom 35%",
          scrub: 0.5,
          onUpdate: (s) => setPitch(s.progress),
        });
        ScrollTrigger.create({
          trigger: crukxPanel.current,
          start: "top 70%",
          end: "center 40%",
          scrub: 0.5,
          onUpdate: (s) => setMorphT(s.progress),
        });
      }
    }, wrap);
    return () => ctx.revert();
  }, [pinned, reduced]);

  const { iit, crukx } = EXPERIENCE;
  const panel = pinned ? "h-screen w-screen shrink-0 px-10 pt-20 pb-8" : "w-full px-4 py-10 md:px-10";

  return (
    <section id="experience" aria-labelledby="experience-title" className="relative">
      <div className="section !pb-0">
        <div className="wrap">
          <SectionHead index="01" label="Experience" title="Where I've worked" id="experience-title">
            Research on how machines read the game, and shipping UI people actually use.
          </SectionHead>
        </div>
      </div>

      <div ref={wrap} className="relative overflow-hidden">
        <div ref={track} className={pinned ? "flex w-max will-change-transform" : "flex flex-col"}>
          {/* ---------------- IIT Patna ---------------- */}
          <article ref={iitPanel} className={panel} aria-labelledby="iit-title">
            <div className="mx-auto grid h-full max-w-[1500px] grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
              <div className="flex flex-col justify-center">
                <p className="eyebrow mb-4">
                  <b>{iit.period}</b> · {iit.area}
                </p>
                <h3 id="iit-title" className="font-display text-[clamp(2.4rem,min(5vw,8vh),4.8rem)] font-extrabold uppercase leading-[0.9]">
                  {iit.role}
                  <span className="block text-accent">{iit.org}</span>
                </h3>
                <p className="mt-2 font-mono text-xs text-muted">{iit.mentor}</p>
                <p className="mt-6 text-lg leading-snug md:text-xl">&ldquo;{iit.question}&rdquo;</p>
                <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-muted">
                  {iit.bullets.map((b) => (
                    <li key={b} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div ref={pitchVisRef} className="relative flex min-h-[320px] flex-col justify-center lg:min-h-0">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-bg-2">
                  {capable ? (
                    <PitchScene progress={pitchRef} active={pitchVisible} />
                  ) : (
                    <div className="absolute inset-0 p-3">
                      <PitchSVG t={pitchT} />
                    </div>
                  )}
                  <div className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                    tactics board · {Math.round(pitchT * 100)}%
                  </div>
                </div>
                <div className="relative z-10 mt-4 ml-auto w-full sm:-mt-10 sm:w-[92%] lg:-mt-24 lg:mr-[-1rem]">
                  <VlmOverlay t={pitchT} full={reduced} />
                </div>
              </div>
            </div>
          </article>

          {/* ---------------- Crukx ---------------- */}
          <article ref={crukxPanel} className={panel} aria-labelledby="crukx-title">
            <div className="mx-auto grid h-full max-w-[1500px] grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
              <div>
                <p className="eyebrow mb-4">
                  <b>{crukx.period}</b> · Frontend
                </p>
                <h3 id="crukx-title" className="font-display text-[clamp(2.4rem,min(5vw,8vh),4.8rem)] font-extrabold uppercase leading-[0.9]">
                  {crukx.role}
                  <span className="block text-accent">{crukx.org}</span>
                </h3>
                <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-muted">
                  {crukx.bullets.map((b) => (
                    <li key={b} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["TypeScript", "JavaScript", "HTML/CSS", "Responsive"].map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <CrukxMorph t={morphT} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
