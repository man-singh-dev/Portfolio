"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion, useInView } from "@/lib/hooks";

const N = 25;
const WINNER = 11; // which packet's insert wins the race (arbitrary)

/**
 * 25 identical concurrent POST /events → exactly one row.
 * Status codes match SentinelOps' Stage 2 code: 201 Created for the inserted
 * event, 200 { duplicate: true } for every repeat of the same eventId.
 */
export default function IdempotencyViz() {
  const svg = useRef<SVGSVGElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [viewRef, inView] = useInView<HTMLDivElement>({ once: true, rootMargin: "-15% 0px" });
  const rowsRef = useRef<HTMLSpanElement>(null);
  const okRef = useRef<HTMLSpanElement>(null);
  const dupRef = useRef<HTMLSpanElement>(null);

  const setCounts = (rows: number, ok: number, dup: number) => {
    if (rowsRef.current) rowsRef.current.textContent = String(rows);
    if (okRef.current) okRef.current.textContent = String(ok);
    if (dupRef.current) dupRef.current.textContent = String(dup);
  };

  const build = useCallback(() => {
    const root = svg.current;
    if (!root) return;
    tl.current?.kill();
    const packets = gsap.utils.toArray<SVGGElement>(root.querySelectorAll("[data-pkt]"));
    const labels = gsap.utils.toArray<SVGTextElement>(root.querySelectorAll("[data-lbl]"));
    const bodies = gsap.utils.toArray<SVGGElement>(root.querySelectorAll("[data-body]"));
    const cyl = root.querySelector("[data-cyl]");
    const win = root.querySelector("[data-win]");
    const winLbl = root.querySelector("[data-win-lbl]");

    const final = () => {
      gsap.set(packets, { opacity: 0 });
      gsap.set([win, winLbl], { opacity: 1 });
      setCounts(1, 1, N - 1);
    };
    if (prefersReducedMotion()) {
      final();
      return;
    }

    setCounts(0, 0, 0);
    gsap.set(packets, { x: 0, y: 0, opacity: 1, rotate: 0, transformOrigin: "50% 50%" });
    gsap.set(bodies, { opacity: 1, scale: 1 });
    gsap.set(labels, { opacity: 0 });
    gsap.set([win, winLbl], { opacity: 0, y: 0 });

    const t = gsap.timeline();
    let ok = 0,
      dup = 0;
    packets.forEach((p, i) => {
      const y0 = Number(p.dataset.y);
      const arrive = 0.9 + Math.random() * 0.35;
      const isWinner = i === WINNER;
      const dy = 180 - y0;
      t.to(p, { x: 360, y: dy * 0.85, duration: arrive, ease: "power2.in" }, 0.05 * Math.random());
      const body = p.querySelector("[data-body]");
      const lbl = p.querySelector("[data-lbl]");
      if (isWinner) {
        t.to(p, { x: 450, y: dy - 20, duration: 0.35, ease: "power2.out" }, ">")
          .to(body, { opacity: 0, duration: 0.3 }, "<0.05")
          .add(() => {
            ok = 1;
            setCounts(1, ok, dup);
          }, "<0.2")
          .to(win, { opacity: 1, duration: 0.3 }, "<")
          .fromTo(cyl, { scale: 1 }, { scale: 1.06, duration: 0.15, yoyo: true, repeat: 1, transformOrigin: "50% 50%" }, "<")
          .fromTo(winLbl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, "<");
      } else {
        t.to(p, { x: 230 + Math.random() * 60, y: dy * 0.85 + (Math.random() - 0.5) * 140, rotate: (Math.random() - 0.5) * 40, duration: 0.8, ease: "power3.out" }, ">")
          .to(body, { opacity: 0.18, duration: 0.8 }, "<")
          .add(() => {
            dup++;
            setCounts(ok, ok, dup);
          }, "<")
          .to(lbl, { opacity: 0.9, duration: 0.25 }, "<")
          .to(lbl, { opacity: 0, duration: 0.5 }, ">0.5");
      }
    });
    t.add(() => setCounts(1, 1, N - 1));
    tl.current = t;
  }, []);

  useEffect(() => {
    if (inView) build();
  }, [inView, build]);
  useEffect(() => () => void tl.current?.kill(), []);

  return (
    <div ref={viewRef} className="panel relative overflow-hidden p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        <span>idempotency.test · 25 concurrent POST /api/v1/events</span>
        <button
          type="button"
          onClick={build}
          className="rounded-full border border-line-strong px-3 py-1 text-fg transition-colors hover:border-accent hover:text-accent"
        >
          ↻ replay
        </button>
      </div>
      {/* click-to-replay for pointer users; keyboard users have the replay button above */}
      <div onClick={build} className="block w-full cursor-pointer" data-cursor="view" data-cursor-label="REPLAY">
        <svg ref={svg} viewBox="0 0 600 360" className="h-auto w-full" aria-hidden="true">
          {/* postgres cylinder */}
          <g data-cyl transform="translate(470 110)">
            <path d="M0 18 v110 a55 18 0 0 0 110 0 v-110" fill="var(--bg-3)" stroke="var(--line-strong)" />
            <ellipse cx="55" cy="18" rx="55" ry="18" fill="var(--bg-2)" stroke="var(--line-strong)" />
            <path d="M0 58 a55 18 0 0 0 110 0 M0 94 a55 18 0 0 0 110 0" fill="none" stroke="var(--line)" />
            <text x="55" y="150" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">
              events
            </text>
            <rect data-win x="22" y="66" width="66" height="16" rx="3" fill="var(--accent)" opacity="0" />
            <text x="55" y="78" textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill="var(--accent-ink)">
              evt_42
            </text>
          </g>
          {/* packets */}
          {Array.from({ length: N }, (_, i) => {
            const y = 20 + (i * 320) / (N - 1);
            return (
              <g key={i} data-pkt data-y={y}>
                <g data-body transform={`translate(18 ${y - 7})`}>
                  <rect width="54" height="14" rx="3" fill={i === WINNER ? "var(--accent)" : "var(--bg-3)"} stroke="var(--line-strong)" />
                  <text x="27" y="10" textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill={i === WINNER ? "var(--accent-ink)" : "var(--fg)"}>
                    POST evt_42
                  </text>
                </g>
                {/* duplicate label travels with its packet */}
                {i !== WINNER && (
                  <text data-lbl x={78} y={y + 3} fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted)" opacity="0">
                    200 duplicate
                  </text>
                )}
              </g>
            );
          })}
          <text data-win-lbl x="525" y="96" textAnchor="middle" fontSize="15" fontWeight="600" fontFamily="var(--font-mono)" fill="var(--accent)" opacity="0">
            201 Created
          </text>
          <text x="525" y="300" textAnchor="middle" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--muted)">
            UNIQUE (service_id, event_id)
          </text>
        </svg>
      </div>
      <p className="sr-only">
        Animation: 25 identical requests race to insert the same event. One is stored and returns 201 Created; the other 24 return 200 duplicate. Rows stored: 1.
      </p>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 font-mono">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">201 created</dt>
          <dd className="text-2xl text-accent md:text-3xl">
            <span ref={okRef}>1</span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">200 duplicate</dt>
          <dd className="text-2xl md:text-3xl">
            <span ref={dupRef}>24</span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">rows stored</dt>
          <dd className="font-display text-4xl font-extrabold text-accent md:text-5xl">
            <span ref={rowsRef}>1</span>
          </dd>
        </div>
      </dl>
      <p className="mt-3 font-mono text-[11px] text-muted">
        <span className="text-accent">INSERT</span> … <span className="text-accent">ON CONFLICT</span> (service_id, event_id) <span className="text-accent">DO NOTHING</span>
      </p>
    </div>
  );
}
