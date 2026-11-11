"use client";

import { useEffect, useRef, useState } from "react";
import { Magnetic } from "@/components/ui/motion";
import { prefersReducedMotion } from "@/lib/hooks";
import { asset, PROFILE } from "@/lib/site";
import { copyEmailWithConfetti } from "@/lib/theme";

export default function Contact({ refreshed }: { refreshed: string }) {
  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const turb = useRef<SVGFETurbulenceElement>(null);
  const [hovering, setHovering] = useState(false);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  // animate displacement strength toward target while hovering
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    let scale = Number(disp.current?.getAttribute("scale") ?? 0);
    let seed = 0;
    const target = hovering ? 26 : 0;
    const tick = () => {
      scale += (target - scale) * 0.12;
      seed += 0.6;
      disp.current?.setAttribute("scale", scale.toFixed(2));
      turb.current?.setAttribute("seed", String(Math.floor(seed)));
      if (Math.abs(target - scale) > 0.2 || hovering) raf = requestAnimationFrame(tick);
      else disp.current?.setAttribute("scale", String(target));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovering]);

  const copy = async (e: React.MouseEvent) => {
    const ok = await copyEmailWithConfetti(PROFILE.email, { x: e.clientX, y: e.clientY });
    setCopied(ok ? "ok" : "fail");
    setTimeout(() => setCopied("idle"), 2400);
  };

  const socials = [
    { label: "GitHub", href: PROFILE.links.github },
    { label: "LinkedIn", href: PROFILE.links.linkedin },
    { label: "LeetCode", href: PROFILE.links.leetcode },
    { label: "Codeforces", href: PROFILE.links.codeforces },
    { label: "Resume", href: asset(PROFILE.links.resume) },
  ];

  return (
    <section id="contact" aria-labelledby="contact-title" className="section relative overflow-hidden !pb-10">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="distort">
          <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="1" />
          <feDisplacementMap ref={disp} in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="wrap">
        <p className="eyebrow mb-6">
          <b>(09)</b> · Contact
        </p>
        <h2
          id="contact-title"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className="font-display text-[clamp(4rem,15vw,15rem)] font-extrabold uppercase leading-[0.82]"
          style={{ filter: hovering ? "url(#distort)" : undefined }}
          data-cursor="text"
        >
          Let&apos;s build <span className="text-accent">something.</span>
        </h2>

        <div className="mt-14 grid gap-10 border-t border-line pt-10 md:grid-cols-2">
          <div>
            <p className="max-w-md text-lg leading-snug text-muted">
              Internships, open-source collaboration, research on video understanding, or a good conversation about queues and idempotency. My inbox is open.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <button
                  type="button"
                  onClick={copy}
                  className="flex h-14 items-center gap-3 rounded-full bg-accent px-7 font-mono text-sm font-medium text-accent-ink"
                >
                  <span aria-hidden="true">{copied === "ok" ? "✓" : "⧉"}</span>
                  {copied === "ok" ? "Copied!" : copied === "fail" ? "Copy failed, use the link" : PROFILE.email}
                </button>
              </Magnetic>
              <a href={`mailto:${PROFILE.email}`} className="flex h-14 items-center rounded-full border border-line-strong px-6 font-mono text-sm hover:border-accent">
                Open mail ↗
              </a>
              <span className="sr-only" role="status" aria-live="polite">
                {copied === "ok" ? "Email address copied to clipboard" : ""}
              </span>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 font-display text-3xl font-bold uppercase md:text-4xl">
            {socials.map((s) => (
              <li key={s.label} className="border-b border-line">
                <a href={s.href} target="_blank" rel="noreferrer" className="group flex items-center justify-between py-3 transition-colors hover:text-accent">
                  {s.label}
                  <span className="text-xl transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <footer className="mt-24 flex flex-col gap-4 border-t border-line pt-6 font-mono text-[11px] text-muted md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Man Singh · systems + vision</span>
          <span>
            stats refreshed {refreshed} · press <kbd className="rounded border border-line px-1">⌘K</kbd> or{" "}
            <kbd className="rounded border border-line px-1">~</kbd>
          </span>
          <a href="#top" className="hover:text-accent">
            back to top ↑
          </a>
        </footer>
      </div>
    </section>
  );
}
