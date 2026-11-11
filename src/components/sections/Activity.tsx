"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CountUp, SectionHead } from "@/components/ui/motion";
import type { ActivityVM } from "@/lib/data";
import { prefersReducedMotion } from "@/lib/hooks";


export default function Activity({ data }: { data: ActivityVM }) {
  const ref = useRef<HTMLDivElement>(null);
  // ripple-in: hide cells only on the client and only while below the fold
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let first = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (first) {
          first = false;
          if (e.isIntersecting) return io.disconnect();
          el.classList.add("hm-wait");
          return;
        }
        if (e.isIntersecting) {
          el.classList.remove("hm-wait");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const [hover, setHover] = useState<{ date: string; count: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const { cells, max, months } = useMemo(() => {
    const all = data.weeks.flat();
    const max = Math.max(1, ...all.map((d) => d[1]));
    const cells = data.weeks.flatMap((w, wi) => w.map(([date, count, wd]) => ({ date, count, wi, wd })));
    const months: { wi: number; label: string }[] = [];
    data.weeks.forEach((w, wi) => {
      const first = w[0]?.[0];
      if (!first) return;
      const d = new Date(first + "T00:00:00Z");
      if (d.getUTCDate() <= 7) months.push({ wi, label: d.toLocaleString("en", { month: "short", timeZone: "UTC" }) });
    });
    return { cells, max, months };
  }, [data]);

  // start scrolled to the most recent weeks on small screens (done lazily: no layout read at load)
  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        sc.scrollLeft = sc.scrollWidth;
        io.disconnect();
      }
    });
    io.observe(sc);
    return () => io.disconnect();
  }, []);

  const level = (c: number) => (c === 0 ? 0 : Math.min(4, Math.ceil((c / max) * 4)));
  const nW = data.weeks.length;
  // ripple origin: the most recent day
  const ox = nW - 1,
    oy = 3;

  return (
    <section id="activity" aria-labelledby="activity-title" className="section cv-auto">
      <div className="wrap">
        <SectionHead index="06" label="GitHub activity" title="Shipping, daily" id="activity-title" />
        <div className="mb-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { k: "contributions · last year", v: data.total },
            { k: "commits", v: data.commits },
            { k: "pull requests", v: data.pullRequests },
            { k: "in private repos", v: data.privateContributions },
          ].map((s) => (
            <div key={s.k} className="border-t border-line pt-4">
              <p className="eyebrow">{s.k}</p>
              <p className="mt-2 font-display text-6xl font-extrabold leading-none md:text-7xl">
                <CountUp to={s.v} />
              </p>
            </div>
          ))}
        </div>

        <div ref={ref} className="panel p-4 md:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-muted" aria-live="polite">
            <span>{hover ? `${hover.date} · ${hover.count} contribution${hover.count === 1 ? "" : "s"}` : `${data.start} → ${data.end}`}</span>
            <span className="flex items-center gap-1.5" aria-hidden="true">
              less
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={`hm l${i} h-2.5 w-2.5`} />
              ))}
              more
            </span>
          </div>
          <div ref={scroller} className="overflow-x-auto pb-2" data-lenis-prevent-wheel>
            <div className="relative min-w-[720px]">
              <div className="relative mb-1 h-4 font-mono text-[10px] text-muted" aria-hidden="true">
                {months.map((m) => (
                  <span key={m.wi} className="absolute" style={{ left: `${(m.wi / nW) * 100}%` }}>
                    {m.label}
                  </span>
                ))}
              </div>
              <div
                className="grid gap-[3px]"
                style={{ gridTemplateColumns: `repeat(${nW}, minmax(0, 1fr))`, gridTemplateRows: "repeat(7, auto)", gridAutoFlow: "column" }}
                role="img"
                aria-label={`Contribution calendar: ${data.total} contributions between ${data.start} and ${data.end}`}
                onPointerOver={(e) => {
                  const t = (e.target as HTMLElement).dataset;
                  if (t.date) setHover({ date: t.date, count: Number(t.c) });
                }}
                onPointerLeave={() => setHover(null)}
              >
                {Array.from({ length: cells[0]?.wd ?? 0 }, (_, i) => (
                  <span key={`pad${i}`} aria-hidden="true" />
                ))}
                {cells.map((c) => (
                  <span
                    key={c.date}
                    data-date={c.date}
                    data-c={c.count}
                    className={`hm l${level(c.count)}`}
                    style={{ ["--d" as string]: `${Math.round(Math.hypot(c.wi - ox, c.wd - oy) * 14)}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
