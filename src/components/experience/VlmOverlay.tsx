import { VLM_SCRIPT } from "@/lib/content";

/** Types the VLM explanation out as the pitch progresses (t ∈ [0,1]). */
export default function VlmOverlay({ t, full = false }: { t: number; full?: boolean }) {
  const span = 1 / VLM_SCRIPT.length;
  return (
    <div className="panel w-full max-w-md bg-bg/80 p-4 font-mono text-[12px] leading-relaxed backdrop-blur-md md:text-[13px]">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
        <span>
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent align-middle" />
          vlm-reasoning.log
        </span>
        <span>illustrative</span>
      </div>
      <ul className="space-y-2.5">
        {VLM_SCRIPT.map((l, i) => {
          const local = full ? 1 : Math.max(0, Math.min(1, (t - i * span * 0.92) / (span * 0.85)));
          const chars = Math.round(l.text.length * local);
          const typing = local > 0 && local < 1;
          const tone = l.tag === "DESCRIBE" ? "text-muted line-through decoration-[var(--danger)]/60" : l.tag === "REASON" ? "text-fg" : l.tag === "VERIFY" ? "text-accent" : "text-fg";
          return (
            <li key={l.tag} className="grid grid-cols-[5.5rem_1fr] gap-2" style={{ opacity: local > 0 ? 1 : 0 }}>
              <span className={l.tag === "REASON" || l.tag === "VERIFY" ? "text-accent" : "text-muted"}>[{l.tag}]</span>
              <span className={tone}>
                <span className="sr-only">{l.text}</span>
                <span aria-hidden="true">
                  {l.text.slice(0, chars)}
                  {typing && <span className="text-accent">▍</span>}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
