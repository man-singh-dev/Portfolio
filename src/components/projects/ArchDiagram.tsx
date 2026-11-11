"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion, useNearViewport } from "@/lib/hooks";

/**
 * SentinelOps architecture, split honestly by status (from the README):
 * solid = implemented in Stage 2, dashed = Stage 3 (in progress).
 */
const Node = ({ x, y, w, h, title, sub, dashed, accent }: { x: number; y: number; w: number; h: number; title: string; sub?: string[]; dashed?: boolean; accent?: boolean }) => (
  <g data-node transform={`translate(${x} ${y})`}>
    <rect width={w} height={h} rx="10" fill={accent ? "var(--accent-soft)" : "var(--bg-2)"} stroke={accent ? "var(--accent)" : "var(--line-strong)"} strokeDasharray={dashed ? "5 4" : undefined} />
    <text x="14" y="24" fontSize="13" fontFamily="var(--font-mono)" fill={dashed ? "var(--muted)" : "var(--fg)"} fontWeight="600">
      {title}
    </text>
    {sub?.map((s, i) => (
      <text key={s} x="14" y={44 + i * 16} fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--muted)">
        {s}
      </text>
    ))}
  </g>
);

export default function ArchDiagram() {
  const ref = useRef<SVGSVGElement>(null);
  useNearViewport(ref, () => {
    if (prefersReducedMotion() || !ref.current) return;
    const ctx = gsap.context(() => {
      const paths = ref.current!.querySelectorAll<SVGPathElement>("[data-path]");
      paths.forEach((p) => {
        p.style.strokeDasharray = p.dataset.dash ? "" : "1";
      });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top 80%", end: "bottom 55%", scrub: 0.6 },
      });
      tl.from("[data-node]", { opacity: 0, y: 14, stagger: 0.12, duration: 0.4 })
        .fromTo("[data-path]", { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, stagger: 0.15, duration: 0.6 }, 0.1)
        .from("[data-flow]", { opacity: 0, duration: 0.3 }, ">-0.2");
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <figure className="panel overflow-x-auto p-4 md:p-6">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        <span>architecture</span>
        <span className="flex items-center gap-4 normal-case tracking-normal">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-fg" /> implemented
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t border-dashed border-muted" /> in progress
          </span>
        </span>
      </figcaption>
      <svg ref={ref} viewBox="0 0 760 380" className="h-auto w-full min-w-[560px]" role="img" aria-label="SentinelOps architecture. Implemented: services send events over REST to a Fastify API that authenticates SHA-256 hashed API keys, validates the body, and inserts idempotently into PostgreSQL with a unique constraint, all in Docker. In progress: a RabbitMQ pipeline and a Go worker pool.">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10z" fill="var(--fg)" />
          </marker>
          <marker id="arr-m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10z" fill="var(--muted)" />
          </marker>
        </defs>
        <rect data-node x="150" y="8" width="602" height="364" rx="16" fill="none" stroke="var(--line)" strokeDasharray="2 6" />
        <text data-node x="166" y="30" fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">
          docker compose
        </text>

        <Node x={8} y={70} w={124} h={70} title="Services" sub={["POST /events", "X-API-Key"]} />
        <Node x={180} y={52} w={250} h={108} title="Fastify API · Node/TS" sub={["① SHA-256(key) lookup", "② Zod body validation", "③ idempotent INSERT", "201 new · 200 duplicate"]} accent />
        <Node x={500} y={52} w={240} h={108} title="PostgreSQL" sub={["events", "UNIQUE (service_id, event_id)", "service_api_keys (hash only)"]} />

        <Node x={180} y={250} w={170} h={80} title="RabbitMQ" sub={["durable queue", "retries · DLQ"]} dashed />
        <Node x={410} y={250} w={190} h={80} title="Go worker pool" sub={["in progress", "fingerprint · correlate"]} dashed />

        <path data-path pathLength={1} d="M132 105 H178" fill="none" stroke="var(--fg)" strokeWidth="1.5" markerEnd="url(#arr)" />
        <path data-path pathLength={1} d="M430 106 H498" fill="none" stroke="var(--fg)" strokeWidth="1.5" markerEnd="url(#arr)" />
        <path data-path data-dash="1" d="M305 160 V248" fill="none" stroke="var(--muted)" strokeWidth="1.2" strokeDasharray="5 5" markerEnd="url(#arr-m)" />
        <path data-path data-dash="1" d="M350 290 H408" fill="none" stroke="var(--muted)" strokeWidth="1.2" strokeDasharray="5 5" markerEnd="url(#arr-m)" />
        <path data-path data-dash="1" d="M600 290 H640 V162" fill="none" stroke="var(--muted)" strokeWidth="1.2" strokeDasharray="5 5" markerEnd="url(#arr-m)" />

        <text data-flow x="466" y="96" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--accent)">
          ON CONFLICT
        </text>
        <text data-flow x="200" y="215" fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted)">
          stage 3: 202 after publish-confirm
        </text>
      </svg>
    </figure>
  );
}
