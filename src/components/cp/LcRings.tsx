"use client";

import { useInView } from "@/lib/hooks";

type K = "easy" | "medium" | "hard";

/** Three rings: solved / total available per difficulty. Labelled directly, so identity is never colour-alone. */
export default function LcRings({ solved, totals }: { solved: Record<K | "all", number>; totals: Record<K | "all", number> }) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, rootMargin: "-10% 0px" });
  const items: { k: K; label: string; op: number }[] = [
    { k: "easy", label: "Easy", op: 0.45 },
    { k: "medium", label: "Medium", op: 0.75 },
    { k: "hard", label: "Hard", op: 1 },
  ];
  const C = 2 * Math.PI * 42;
  return (
    <div ref={ref} className="grid grid-cols-3 gap-3 md:gap-6">
      {items.map((it, i) => {
        const pct = totals[it.k] ? solved[it.k] / totals[it.k] : 0;
        return (
          <figure key={it.k} className="flex flex-col items-center text-center">
            <div className="relative aspect-square w-full max-w-[150px]">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--line)" strokeWidth="7" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="var(--accent)"
                  strokeOpacity={it.op}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={inView ? C * (1 - pct) : C}
                  style={{ transition: `stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1) ${i * 150}ms` }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="font-display text-3xl font-extrabold leading-none md:text-4xl">{solved[it.k]}</span>
              </div>
            </div>
            <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
              {it.label}
              <span className="block normal-case tracking-normal">
                of {totals[it.k]} · {(pct * 100).toFixed(1)}%
              </span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
