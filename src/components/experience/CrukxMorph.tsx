/**
 * Abstract before → after UI morph (illustrative; not Crukx's actual pages).
 * "Before": inconsistent spacing, radii, colours and alignment. "After": one grid, one system.
 */
type Box = { x: number; y: number; w: number; h: number; r: number; o: number };
const B = (x: number, y: number, w: number, h: number, r: number, o = 1): Box => ({ x, y, w, h, r, o });

const BLOCKS: { id: string; before: Box; after: Box; kind: "nav" | "title" | "text" | "btn" | "card" | "img" }[] = [
  { id: "nav", kind: "nav", before: B(3, 4, 88, 7, 0), after: B(5, 5, 90, 6, 10) },
  { id: "title", kind: "title", before: B(9, 18, 54, 10, 2), after: B(5, 19, 52, 9, 4) },
  { id: "title2", kind: "title", before: B(14, 30, 38, 8, 2), after: B(5, 30, 40, 9, 4) },
  { id: "text", kind: "text", before: B(6, 42, 62, 4, 0), after: B(5, 43, 46, 3.5, 2) },
  { id: "btn", kind: "btn", before: B(28, 51, 17, 7, 0), after: B(5, 51, 18, 7, 20) },
  { id: "img", kind: "img", before: B(66, 15, 30, 40, 26), after: B(60, 17, 35, 40, 12) },
  { id: "c1", kind: "card", before: B(4, 66, 26, 24, 2), after: B(5, 66, 28, 26, 12) },
  { id: "c2", kind: "card", before: B(36, 70, 34, 18, 16), after: B(36, 66, 28, 26, 12) },
  { id: "c3", kind: "card", before: B(72, 63, 22, 31, 6), after: B(67, 66, 28, 26, 12) },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function CrukxMorph({ t }: { t: number }) {
  const e = t * t * (3 - 2 * t);
  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        <span style={{ opacity: 1 - e * 0.7 }}>before</span>
        <span className="h-px flex-1 mx-3 bg-line-strong relative overflow-hidden">
          <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${e * 100}%` }} />
        </span>
        <span className={e > 0.5 ? "text-accent" : ""}>after</span>
      </div>
      <div
        className="relative aspect-[16/11] w-full overflow-hidden rounded-xl border border-line"
        style={{ background: `color-mix(in oklab, var(--bg-2) ${Math.round(e * 100)}%, #1d1a24)` }}
        role="img"
        aria-label="Illustration: a cluttered, inconsistent page layout morphing into a clean, aligned design system"
      >
        {BLOCKS.map((b, i) => {
          const s = {
            left: `${lerp(b.before.x, b.after.x, e)}%`,
            top: `${lerp(b.before.y, b.after.y, e)}%`,
            width: `${lerp(b.before.w, b.after.w, e)}%`,
            height: `${lerp(b.before.h, b.after.h, e)}%`,
            borderRadius: `${lerp(b.before.r, b.after.r, e)}px`,
            transform: `rotate(${lerp(i % 2 ? -1.6 : 1.2, 0, e)}deg)`,
          };
          const beforeColors = ["#5b6cff", "#ff5fa2", "#43c59e", "#c4b5fd", "#f97316", "#64748b", "#22d3ee", "#a3e635", "#e879f9"];
          const afterColor =
            b.kind === "btn" ? "var(--accent)" : b.kind === "title" ? "var(--fg)" : b.kind === "text" ? "var(--muted)" : b.kind === "img" ? "var(--accent-soft)" : "var(--bg-3)";
          return (
            <div
              key={b.id}
              className="absolute border"
              style={{
                ...s,
                background: `color-mix(in oklab, ${afterColor} ${Math.round(e * 100)}%, ${beforeColors[i]})`,
                borderColor: `color-mix(in oklab, var(--line) ${Math.round(e * 100)}%, transparent)`,
                opacity: lerp(0.75, b.kind === "title" ? 0.9 : 1, e),
              }}
            />
          );
        })}
        {/* alignment guides appear in "after" */}
        <div className="pointer-events-none absolute inset-y-0 left-[5%] w-px bg-accent" style={{ opacity: e * 0.5 }} />
        <div className="pointer-events-none absolute inset-y-0 right-[5%] w-px bg-accent" style={{ opacity: e * 0.5 }} />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">illustrative · responsive · one design language</p>
    </div>
  );
}
