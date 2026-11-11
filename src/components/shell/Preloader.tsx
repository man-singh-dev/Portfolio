"use client";

import { useEffect, useRef, useState } from "react";
import { bootState, bus } from "@/lib/bus";

interface Props {
  lines: string[];
}

/**
 * Terminal boot sequence → progress counter → splits open.
 * Rendered in the server HTML so nothing flashes before it. A head script sets
 * html[data-booted] on repeat visits / reduced motion, which hides it instantly via CSS.
 */
export default function Preloader({ lines }: Props) {
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<"boot" | "split" | "gone">("boot");
  const root = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const finish = () => {
      bootState.done = true;
      bus.emit("booted");
    };
    if (html.dataset.booted) {
      setPhase("gone");
      finish();
      return;
    }
    window.__lenis?.stop();
    html.style.overflow = "hidden";

    const total = 1400;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      const eased = 1 - Math.pow(1 - t, 3);
      // counter is written straight to the DOM: no React render per frame during page load
      if (pctRef.current) pctRef.current.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      setShown(Math.min(lines.length, Math.floor(eased * (lines.length + 0.6)))); // bails out when unchanged
      if (t < 1) raf = requestAnimationFrame(step);
      else {
        setTimeout(() => setPhase("split"), 220);
        setTimeout(() => {
          setPhase("gone");
          html.style.overflow = "";
          html.dataset.booted = "1";
          try {
            sessionStorage.setItem("booted", "1");
          } catch {}
          window.__lenis?.start();
        }, 1250);
        setTimeout(finish, 520);
      }
    };
    raf = requestAnimationFrame(step);
    // let anyone skip with a key / click
    const skip = () => {
      cancelAnimationFrame(raf);
      if (pctRef.current) pctRef.current.textContent = "100";
      setShown(lines.length);
      setPhase("split");
      setTimeout(() => {
        setPhase("gone");
        html.style.overflow = "";
        html.dataset.booted = "1";
        window.__lenis?.start();
      }, 900);
      finish();
    };
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", skip);
    };
  }, [lines.length]);

  if (phase === "gone") return null;

  const split = phase === "split";
  const half = "absolute inset-x-0 h-1/2 bg-bg transition-transform duration-[1000ms] ease-[cubic-bezier(.76,0,.24,1)]";

  return (
    <div ref={root} className="preloader fixed inset-0 z-[250]" role="status" aria-live="polite" aria-label="Loading">
      <div className={`${half} top-0 border-b border-line`} style={{ transform: split ? "translateY(-100%)" : "none" }} />
      <div className={`${half} bottom-0`} style={{ transform: split ? "translateY(100%)" : "none" }} />
      <div
        className="absolute inset-0 flex flex-col justify-between p-5 font-mono text-[13px] text-fg transition-opacity duration-300 md:p-10"
        style={{ opacity: split ? 0 : 1 }}
      >
        <div className="flex items-center justify-between text-muted">
          <span>man-singh.sys</span>
          <span>v2026.11</span>
        </div>
        <ul className="space-y-1.5" aria-hidden="true">
          {lines.map((l, i) => (
            <li
              key={l}
              className="transition-opacity duration-150"
              style={{ opacity: i < shown ? 1 : 0 }}
            >
              <span className="text-accent">&gt;</span> {l}
              {i === shown - 1 && i < lines.length - 1 && <span className="ml-1 animate-pulse">▍</span>}
            </li>
          ))}
        </ul>
        <div className="flex items-end justify-between">
          <span className="text-muted">press any key to skip</span>
          <span ref={pctRef} className="font-display text-[clamp(9rem,42vw,18rem)] font-extrabold leading-[0.8] tabular-nums text-accent">
            000
          </span>
        </div>
      </div>
    </div>
  );
}
