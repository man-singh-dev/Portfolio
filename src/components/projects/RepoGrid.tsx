"use client";

import { useMemo, useRef, useState } from "react";
import type { RepoVM } from "@/lib/data";
import { prefersReducedMotion } from "@/lib/hooks";

function TiltCard({ repo }: { repo: RepoVM }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const glare = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 12}deg) rotateY(${(px - 0.5) * 14}deg) translateZ(0)`;
    if (glare.current) {
      glare.current.style.opacity = "1";
      glare.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgb(255 255 255 / 0.16), transparent 55%)`;
    }
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
    if (glare.current) glare.current.style.opacity = "0";
  };

  return (
    <a
      ref={ref}
      href={repo.url}
      target="_blank"
      rel="noreferrer"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor="view"
      className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-line bg-bg-2 p-5 transition-[transform,border-color] duration-300 ease-out [transform-style:preserve-3d] hover:border-accent/60 focus-visible:border-accent"
    >
      <span ref={glare} aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300" />
      <div className="flex items-center justify-between font-mono text-[11px] text-muted [transform:translateZ(30px)]">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: repo.languageColor ?? "var(--muted)" }} aria-hidden="true" />
          {repo.language}
        </span>
        <span>updated {repo.updatedAt}</span>
      </div>
      <h4 className="mt-6 font-display text-3xl font-extrabold uppercase leading-none [transform:translateZ(50px)]">{repo.name}</h4>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted [transform:translateZ(25px)]">{repo.description || "No description yet."}</p>
      <div className="mt-auto flex items-center justify-between pt-5 font-mono text-xs [transform:translateZ(30px)]">
        <span className="text-muted">★ {repo.stars}</span>
        <span className="text-accent transition-transform group-hover:translate-x-1">
          view repo <span aria-hidden="true">↗</span>
        </span>
      </div>
    </a>
  );
}

export default function RepoGrid({ repos }: { repos: RepoVM[] }) {
  const langs = useMemo(() => {
    const counts = new Map<string, number>();
    repos.forEach((r) => counts.set(r.language, (counts.get(r.language) ?? 0) + 1));
    return [["All", repos.length] as const, ...[...counts.entries()].sort((a, b) => b[1] - a[1])];
  }, [repos]);
  const [lang, setLang] = useState("All");
  const shown = lang === "All" ? repos : repos.filter((r) => r.language === lang);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter repositories by language">
        {langs.map(([l, n]) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`chip transition-colors ${lang === l ? "border-accent bg-accent text-accent-ink" : "hover:border-accent"}`}
          >
            {l} <span className="opacity-60">{n}</span>
          </button>
        ))}
      </div>
      <ul key={lang} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {shown.map((r, i) => (
            <li key={r.name} className="pop-in" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <TiltCard repo={r} />
            </li>
          ))}
        </ul>
    </div>
  );
}
