"use client";

import { useState } from "react";
import { Reveal, SectionHead } from "@/components/ui/motion";
import { ACHIEVEMENTS } from "@/lib/content";

interface Card {
  id: string;
  front: string;
  sub: string;
  back: string;
}

function FlipCard({ card, index }: { card: Card; index: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="group h-[300px] [perspective:1200px]" onMouseEnter={() => setFlipped(true)} onMouseLeave={() => setFlipped(false)}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={`${card.front}, ${card.sub}. ${flipped ? "Showing details" : "Show details"}`}
        className="relative h-full w-full text-left transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateY(180deg)" : "none" }}
      >
        <span className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-line bg-bg-2 p-6 [backface-visibility:hidden]">
          <span className="flex items-center justify-between font-mono text-[11px] text-muted">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">tap / hover ↻</span>
          </span>
          <span>
            <span className="block font-display text-[clamp(2.8rem,5vw,4.2rem)] font-extrabold uppercase leading-[0.85] text-accent">{card.front}</span>
            <span className="mt-3 block text-sm text-muted">{card.sub}</span>
          </span>
        </span>
        <span className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-accent bg-accent p-6 text-accent-ink [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">{card.sub}</span>
          <span className="text-lg font-medium leading-snug">{card.back}</span>
        </span>
      </button>
    </div>
  );
}

export default function Achievements({ lc, cf }: { lc: { rating: number | null; badge: string | null; top: number | null; solved: number }; cf: { max: number | null; solved: number } }) {
  const cards: Card[] = [
    {
      id: "lc",
      front: `${lc.rating ?? ""}`,
      sub: `LeetCode contest rating · ${lc.badge ?? ""}`,
      back: `${lc.badge ?? "LeetCode"} badge, top ${lc.top ?? "–"}% of contest participants, with ${lc.solved} problems solved.`,
    },
    {
      id: "cf",
      front: `${cf.max ?? ""}`,
      sub: "Codeforces max rating",
      back: `Peak Codeforces rating of ${cf.max}, with ${cf.solved} problems solved in C++.`,
    },
    ...ACHIEVEMENTS,
  ];
  return (
    <section id="achievements" aria-labelledby="ach-title" className="section cv-auto">
      <div className="wrap">
        <SectionHead index="07" label="Achievements & leadership" title="Receipts" id="ach-title" />
        <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" stagger={0.1}>
          {cards.map((c, i) => (
            <FlipCard key={c.id} card={c} index={i} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
