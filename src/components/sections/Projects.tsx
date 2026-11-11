import ArchDiagram from "@/components/projects/ArchDiagram";
import DiffDemo from "@/components/projects/DiffDemo";
import IdempotencyViz from "@/components/projects/IdempotencyViz";
import RepoGrid from "@/components/projects/RepoGrid";
import { Reveal, SectionHead } from "@/components/ui/motion";
import { PROJECTS } from "@/lib/content";
import type { RepoVM } from "@/lib/data";

function StatusList({ label, items, tone }: { label: string; items: readonly string[]; tone: "done" | "wip" | "plan" }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((i) => (
          <li
            key={i}
            className={`chip ${tone === "done" ? "border-accent/60" : tone === "wip" ? "border-dashed" : "border-dashed text-muted"}`}
          >
            <span aria-hidden="true">{tone === "done" ? "✓" : tone === "wip" ? "◐" : "○"}</span> {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Projects({ repos, repoCount }: { repos: RepoVM[]; repoCount: number }) {
  const s = PROJECTS.sentinel;
  const d = PROJECTS.diffcraft;
  return (
    <section id="projects" aria-labelledby="projects-title" className="section">
      <div className="wrap">
        <SectionHead index="02" label="Projects" title="Case studies" id="projects-title">
          Backend systems where correctness comes from constraints, not hope. Two case studies, then everything else.
        </SectionHead>

        {/* ---------------- SentinelOps ---------------- */}
        <article className="grid grid-cols-[minmax(0,1fr)] gap-10 border-t border-line pt-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-16" aria-labelledby="sentinel-title">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow mb-4">
              <b>case 01</b> · {s.kicker}
            </p>
            <h3 id="sentinel-title" className="font-display text-[clamp(3rem,7vw,6.5rem)] font-extrabold uppercase leading-[0.85]" data-cursor="text">
              {s.name}
            </h3>
            <p className="mt-6 text-lg leading-snug md:text-xl">{s.pitch}</p>
            <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-muted">
              {s.points.map((p) => (
                <li key={p} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-4">
              <StatusList label="built with" items={s.stack} tone="done" />
              <StatusList label="in progress" items={s.inProgress} tone="wip" />
            </div>
            <p className="mt-5 font-mono text-xs text-muted">{s.status}</p>
            <a href={s.url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 font-mono text-sm text-accent underline-offset-4 hover:underline">
              github.com/man-singh-dev/SentinelOps <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="space-y-6">
            <IdempotencyViz />
            <ArchDiagram />
          </div>
        </article>

        {/* ---------------- DiffCraft ---------------- */}
        <article className="mt-28 grid grid-cols-[minmax(0,1fr)] gap-10 border-t border-line pt-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-16" aria-labelledby="diffcraft-title">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow mb-4">
              <b>case 02</b> · {d.kicker}
            </p>
            <h3 id="diffcraft-title" className="font-display text-[clamp(3rem,7vw,6.5rem)] font-extrabold uppercase leading-[0.85]" data-cursor="text">
              {d.name}
            </h3>
            <p className="mt-6 text-lg leading-snug md:text-xl">{d.pitch}</p>
            <div className="mt-6 space-y-4">
              <StatusList label="implemented" items={d.implemented} tone="done" />
              <StatusList label="in progress" items={d.inProgress} tone="wip" />
              <StatusList label="planned" items={d.planned} tone="plan" />
              <StatusList label="stack" items={d.stack} tone="done" />
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
              <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-accent underline-offset-4 hover:underline">
                source <span aria-hidden="true">↗</span>
              </a>
              <a href={d.demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-accent underline-offset-4 hover:underline">
                live demo <span aria-hidden="true">↗</span>
              </a>
            </div>
            <p className="mt-3 font-mono text-[11px] text-muted">Demo on the right is a concept of the full review flow; live sync and AI review are on the roadmap.</p>
          </div>
          <div className="pb-0 md:pb-20">
            <DiffDemo />
          </div>
        </article>

        {/* ---------------- Other repos ---------------- */}
        <div className="mt-32 border-t border-line pt-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h3 className="font-display text-[clamp(2.4rem,5vw,4.5rem)] font-extrabold uppercase leading-[0.9]">More builds</h3>
            <p className="font-mono text-xs text-muted">{repoCount} public repos · pulled live from GitHub</p>
          </div>
          <Reveal>
            <RepoGrid repos={repos} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
