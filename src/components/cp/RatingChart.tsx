"use client";

import { useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion, useNearViewport } from "@/lib/hooks";

type Pt = { rating: number; date: string; contest: string };

const W = 720,
  H = 300,
  PAD = { l: 44, r: 16, t: 16, b: 30 };

/** Codeforces rank bands (recessive reference lines, not a second axis). */
const BANDS = [
  { at: 1200, label: "pupil" },
  { at: 1400, label: "specialist" },
];

export default function RatingChart({ data, label }: { data: Pt[]; label: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { pts, yTicks, path, x, y } = useMemo(() => {
    const t = data.map((d) => new Date(d.date).getTime());
    const t0 = Math.min(...t),
      t1 = Math.max(...t);
    const r0 = Math.floor(Math.min(...data.map((d) => d.rating), 1000) / 200) * 200;
    const r1 = Math.ceil(Math.max(...data.map((d) => d.rating), 1400) / 200) * 200;
    const x = (ms: number) => PAD.l + ((ms - t0) / Math.max(1, t1 - t0)) * (W - PAD.l - PAD.r);
    const y = (r: number) => PAD.t + (1 - (r - r0) / (r1 - r0)) * (H - PAD.t - PAD.b);
    const pts = data.map((d, i) => ({ ...d, cx: x(t[i]), cy: y(d.rating) }));
    const yTicks: number[] = [];
    for (let r = r0; r <= r1; r += 200) yTicks.push(r);
    const path = pts.map((p, i) => `${i ? "L" : "M"}${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(" ");
    return { pts, yTicks, path, x, y };
  }, [data]);
  void x;

  useNearViewport(svg, () => {
    if (prefersReducedMotion() || !svg.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: svg.current, start: "top 80%", end: "bottom 60%", scrub: 0.8 } });
      tl.fromTo("[data-line]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", duration: 1 }).from("[data-dot]", { opacity: 0, scale: 0, transformOrigin: "center", stagger: 0.03, duration: 0.2 }, 0.1);
    }, svg);
    return () => ctx.revert();
  }, []);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    pts.forEach((p, i) => Math.abs(p.cx - mx) < Math.abs(pts[best].cx - mx) && (best = i));
    setHover(best);
  };

  const h = hover !== null ? pts[hover] : null;
  const peak = pts.reduce((a, b) => (b.rating > a.rating ? b : a), pts[0]);
  const last = pts[pts.length - 1];

  return (
    <figure className="relative">
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y"
        role="img"
        aria-label={`${label}: ${data.length} rated contests, peak ${peak.rating}, latest ${last.rating}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {yTicks.map((r) => (
          <g key={r}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(r)} y2={y(r)} stroke="var(--line)" />
            <text x={PAD.l - 8} y={y(r) + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">
              {r}
            </text>
          </g>
        ))}
        {BANDS.map((b) =>
          b.at > yTicks[0] && b.at < yTicks[yTicks.length - 1] ? (
            <text key={b.label} x={W - PAD.r} y={y(b.at) - 4} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted)">
              {b.label} {b.at}+
            </text>
          ) : null,
        )}
        <text x={PAD.l} y={H - 8} fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">
          {data[0].date.slice(0, 7)}
        </text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">
          {last.date.slice(0, 7)}
        </text>

        <path data-line d={path} pathLength={1} strokeDasharray="1" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} data-dot cx={p.cx} cy={p.cy} r={hover === i ? 6 : 4} fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
        ))}
        {/* direct label on peak only */}
        <text x={peak.cx} y={peak.cy - 12} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--fg)">
          max {peak.rating}
        </text>
        {h && (
          <line x1={h.cx} x2={h.cx} y1={PAD.t} y2={H - PAD.b} stroke="var(--line-strong)" strokeDasharray="3 3" pointerEvents="none" />
        )}
      </svg>
      {h && (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-[240px] -translate-x-1/2 -translate-y-full rounded-lg border border-line-strong bg-bg-2 px-3 py-2 font-mono text-[11px] shadow-xl"
          style={{ left: `${(h.cx / W) * 100}%`, top: `${(h.cy / H) * 100}%`, marginTop: -12 }}
        >
          <div className="text-base text-fg">{h.rating}</div>
          <div className="text-muted">{h.date}</div>
          <div className="mt-0.5 leading-snug text-muted">{h.contest}</div>
        </div>
      )}
      <div className="sr-only">
      <table>
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Contest</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date + d.contest}>
              <td>{d.date}</td>
              <td>{d.contest}</td>
              <td>{d.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
