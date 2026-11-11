"use client";

import { useMemo, useRef, useState } from "react";
import { CountUp, SectionHead } from "@/components/ui/motion";
import type { PrStatus, PrVM } from "@/lib/data";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion, useNearViewport } from "@/lib/hooks";

type Filter = "all" | PrStatus;

const BADGE: Record<PrStatus, string> = {
  merged: "bg-accent text-accent-ink",
  open: "border border-fg text-fg",
  closed: "border border-[var(--danger)] text-[var(--danger)]",
};
const ICON: Record<PrStatus, string> = { merged: "⑂", open: "○", closed: "✕" };

const fmtStars = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function OpenSource({ prs, stats }: { prs: PrVM[]; stats: { total: number; merged: number; orgs: number; topStars: number } }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [includeOwn, setIncludeOwn] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  const scoped = useMemo(() => prs.filter((p) => includeOwn || !p.own), [prs, includeOwn]);
  const shown = useMemo(
    () => scoped.filter((p) => filter === "all" || p.status === filter).sort((a, b) => b.date.localeCompare(a.date)),
    [scoped, filter],
  );
  // stable lane per repo owner, assigned by first appearance (colour/lane follows entity, not rank)
  const lanes = useMemo(() => {
    const order: string[] = [];
    [...prs].sort((a, b) => a.date.localeCompare(b.date)).forEach((p) => !order.includes(p.owner) && order.push(p.owner));
    return order;
  }, [prs]);
  const visibleLanes = lanes.filter((o) => shown.some((p) => p.owner === o));
  const span = useMemo(() => {
    const m = new Map<string, [number, number]>();
    shown.forEach((p, i) => {
      const s = m.get(p.owner);
      m.set(p.owner, s ? [Math.min(s[0], i), Math.max(s[1], i)] : [i, i]);
    });
    return m;
  }, [shown]);

  const counts: Record<Filter, number> = {
    all: scoped.length,
    merged: scoped.filter((p) => p.status === "merged").length,
    open: scoped.filter((p) => p.status === "open").length,
    closed: scoped.filter((p) => p.status === "closed").length,
  };

  useNearViewport(listRef, () => {
    if (prefersReducedMotion() || !listRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-lane-line]", {
        scaleY: 0,
        transformOrigin: "top",
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.04,
        scrollTrigger: { trigger: listRef.current, start: "top 80%", once: true },
      });
      gsap.from("[data-node]", {
        scale: 0,
        duration: 0.6,
        ease: "back.out(2)",
        stagger: 0.06,
        scrollTrigger: { trigger: listRef.current, start: "top 80%", once: true },
      });
    }, listRef);
    return () => ctx.revert();
  }, []);

  const laneW = 18;
  const gutter = Math.max(1, visibleLanes.length) * laneW + 8;

  return (
    <section id="open-source" aria-labelledby="oss-title" className="section cv-auto">
      <div className="wrap">
        <SectionHead index="03" label="Open source" title="Merged upstream" id="oss-title">
          Small, careful pull requests to other people&apos;s codebases: root cause, fix, tests. Pulled live from GitHub.
        </SectionHead>

        <dl className="mb-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {[
            { k: "Pull requests", v: stats.total, s: "" },
            { k: "Merged", v: stats.merged, s: "" },
            { k: "Orgs contributed to", v: stats.orgs, s: "" },
            { k: "Biggest repo ★", v: Math.round(stats.topStars / 100) / 10, s: "k", raw: fmtStars(stats.topStars) },
          ].map((c) => (
            <div key={c.k} className="bg-bg p-5 md:p-7">
              <dt className="eyebrow">{c.k}</dt>
              <dd className="mt-3 font-display text-6xl font-extrabold leading-none text-accent md:text-8xl">
                {c.raw ? c.raw : <CountUp to={c.v} />}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter pull requests by state">
            {(["all", "merged", "open", "closed"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`chip capitalize transition-colors ${filter === f ? "border-accent bg-accent text-accent-ink" : "hover:border-accent"}`}
              >
                {f} <span className="opacity-60">{counts[f]}</span>
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-muted">
            <input type="checkbox" checked={includeOwn} onChange={(e) => setIncludeOwn(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            include PRs to my own repos
          </label>
        </div>

        <ol ref={listRef} className="relative border-t border-line" aria-label="Pull requests, newest first">
            {shown.map((p, i) => (
              <li key={`${filter}-${includeOwn}-${p.url}`} className="pop-in group relative flex items-stretch border-b border-line" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
                {/* lanes gutter: one lane per org */}
                <div className="relative hidden shrink-0 sm:block" style={{ width: gutter }} aria-hidden="true">
                  {visibleLanes.map((o, li) => {
                    const sp = span.get(o);
                    if (!sp || i < sp[0] || i > sp[1]) return null;
                    const x = 8 + li * laneW + laneW / 2;
                    const mine = p.owner === o;
                    return (
                      <span key={o}>
                        <span
                          data-lane-line
                          className="absolute w-px bg-line-strong"
                          style={{ left: x, top: i === sp[0] ? "50%" : 0, bottom: i === sp[1] ? "50%" : 0 }}
                        />
                        {mine && (
                          <span
                            data-node
                            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-bg ${
                              p.status === "merged" ? "bg-accent" : p.status === "open" ? "border-2 border-fg bg-bg" : "bg-[var(--danger)]"
                            }`}
                            style={{ left: x }}
                          />
                        )}
                      </span>
                    );
                  })}
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 flex-1 flex-col gap-3 py-5 pr-2 transition-colors hover:bg-bg-2 sm:flex-row sm:items-center sm:gap-5 sm:pl-2"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${p.avatar}${p.avatar.includes("?") ? "&" : "?"}s=64`} alt="" width={36} height={36} loading="lazy" className="h-9 w-9 shrink-0 rounded-lg border border-line bg-bg-3" />
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-xs text-muted">
                        {p.repo}
                        {p.repoStars >= 20 && <span className="ml-2 text-accent">★ {fmtStars(p.repoStars)}</span>}
                      </span>
                      <span className="mt-0.5 block text-base leading-snug md:text-lg">{p.title}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 pl-[3.25rem] font-mono text-xs sm:pl-0">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider ${BADGE[p.status]}`}>
                      <span aria-hidden="true">{ICON[p.status]}</span> {p.status}
                    </span>
                    <span className="w-20 text-muted">{p.size}</span>
                    <time className="w-24 text-right text-muted" dateTime={p.date}>
                      {p.date}
                    </time>
                    <span className="hidden text-accent transition-transform group-hover:translate-x-1 md:inline" aria-hidden="true">
                      ↗
                    </span>
                  </span>
                </a>
              </li>
            ))}
          {shown.length === 0 && (
            <li className="py-12 text-center font-mono text-sm text-muted">No {filter} pull requests{includeOwn ? "" : " to other people's repos"} yet.</li>
          )}
        </ol>
      </div>
    </section>
  );
}
