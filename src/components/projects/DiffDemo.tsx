"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion, useInView } from "@/lib/hooks";

/* Concept demo of the DiffCraft review flow. The code, reviewers and findings are
   sample content, not a real review. */
const CODE: { n: number; t: "ctx" | "add" | "del"; code: string }[] = [
  { n: 12, t: "ctx", code: "export async function approveReview(id: string, userId: string) {" },
  { n: 13, t: "del", code: "  const review = await db.query.reviews.findFirst({ where: eq(reviews.id, id) });" },
  { n: 13, t: "add", code: "  const review = await getReviewForUpdate(id);" },
  { n: 14, t: "add", code: "  if (review.authorId === userId) throw forbidden('cannot approve own review');" },
  { n: 15, t: "ctx", code: "  logger.info({ review, token: req.headers.authorization }, 'approve');" },
  { n: 16, t: "del", code: "  db.update(reviews).set({ status: 'approved' }).where(eq(reviews.id, id));" },
  { n: 16, t: "add", code: "  await db.update(reviews).set({ status: 'approved', version: review.version + 1 })" },
  { n: 17, t: "add", code: "    .where(and(eq(reviews.id, id), eq(reviews.version, review.version)));" },
  { n: 18, t: "ctx", code: "}" },
];

const COMMENTS = [
  { line: 3, who: "reviewer-a", text: "getReviewForUpdate can return undefined. Guard before reading authorId?", at: 700 },
  { line: 3, who: "reviewer-b", text: "+1, and a 404 instead of a 500 here.", at: 1700, reply: true },
  { line: 7, who: "reviewer-b", text: "Nice: optimistic locking on version. Approving.", at: 2700 },
];

const FINDINGS = [
  { sev: "high", title: "Secret written to logs", where: "L15", fix: "Drop the authorization header from the log payload; redact before logging." },
  { sev: "med", title: "Possible undefined dereference", where: "L14", fix: "Return 404 when the review is missing before checking authorId." },
  { sev: "low", title: "Unchecked update result", where: "L16–17", fix: "If 0 rows are updated, report a 409 version conflict to the client." },
];

export default function DiffDemo() {
  const [viewRef, inView] = useInView<HTMLDivElement>({ once: true, rootMargin: "-20% 0px" });
  const [step, setStep] = useState(0); // 0..COMMENTS.length, then +1 = AI card
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout);
    if (prefersReducedMotion()) {
      setStep(COMMENTS.length + 1);
      return;
    }
    setStep(0);
    COMMENTS.forEach((c, i) => timers.current.push(setTimeout(() => setStep(i + 1), c.at)));
    timers.current.push(setTimeout(() => setStep(COMMENTS.length + 1), 3900));
  }, []);

  useEffect(() => {
    if (inView) play();
  }, [inView, play]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <div ref={viewRef} className="relative">
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[11px] text-muted">
          <span>apps/api/src/reviews/approve.ts</span>
          <span className="flex items-center gap-3">
            <span>
              <span className="text-accent">+5</span> −2
            </span>
            <button type="button" onClick={play} className="rounded-full border border-line-strong px-2.5 py-0.5 text-fg hover:border-accent hover:text-accent">
              ↻ replay
            </button>
          </span>
        </div>
        <div className="overflow-x-auto font-mono text-[11.5px] leading-6 md:text-[12.5px]" data-lenis-prevent>
          {CODE.map((l, i) => (
            <div key={i}>
              <div
                className={`flex min-w-max ${l.t === "add" ? "bg-accent-soft" : l.t === "del" ? "bg-[color-mix(in_oklab,var(--danger)_12%,transparent)]" : ""}`}
              >
                <span className="w-10 shrink-0 select-none pr-2 text-right text-fg/60">{l.n}</span>
                <span className={`w-5 shrink-0 select-none text-center ${l.t === "add" ? "text-accent" : l.t === "del" ? "text-[var(--danger)]" : "text-muted"}`}>
                  {l.t === "add" ? "+" : l.t === "del" ? "−" : " "}
                </span>
                <code className="whitespace-pre pr-4">{l.code}</code>
              </div>
                {COMMENTS.map((c, ci) =>
                  c.line === i && step > ci ? (
                    <div key={ci} className="pop-in">
                      <div className={`mx-3 my-1.5 flex gap-2.5 rounded-lg border border-line bg-bg px-3 py-2 font-sans text-[13px] ${c.reply ? "ml-10" : ""}`}>
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[10px] ${c.who === "reviewer-a" ? "bg-fg text-bg" : "bg-accent text-accent-ink"}`} aria-hidden="true">
                          {c.who === "reviewer-a" ? "A" : "B"}
                        </span>
                        <span>
                          <span className="font-mono text-[11px] text-muted">@{c.who}</span>
                          <span className="block leading-snug">{c.text}</span>
                        </span>
                      </div>
                    </div>
                  ) : null,
                )}
            </div>
          ))}
        </div>
      </div>

        {step > COMMENTS.length && (
          <aside className="slide-in panel relative z-10 mt-4 border-accent/40 p-4 md:absolute md:-bottom-16 md:-right-6 md:mt-0 md:w-[min(420px,80%)] md:shadow-2xl"
            aria-label="AI review findings (sample)"
          >
            <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              <span>
                <span className="text-accent">◆</span> ai review · suggestions
              </span>
              <span>verify before applying</span>
            </div>
            <ul className="space-y-2.5">
              {FINDINGS.map((f) => (
                <li key={f.title} className="rounded-lg border border-line bg-bg/60 p-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                        f.sev === "high" ? "bg-[var(--danger)] text-white" : f.sev === "med" ? "bg-accent text-accent-ink" : "border border-line-strong text-muted"
                      }`}
                    >
                      {f.sev}
                    </span>
                    <span className="font-medium">{f.title}</span>
                    <span className="ml-auto font-mono text-[11px] text-muted">{f.where}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-snug text-muted">{f.fix}</p>
                </li>
              ))}
            </ul>
          </aside>
        )}
    </div>
  );
}
