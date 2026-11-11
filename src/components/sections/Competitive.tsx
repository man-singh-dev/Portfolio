import LcRings from "@/components/cp/LcRings";
import RatingChart from "@/components/cp/RatingChart";
import { Odometer, Reveal, SectionHead } from "@/components/ui/motion";
import type { CpVM } from "@/lib/data";

function Stat({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: boolean }) {
  return (
    <div className="border-t border-line pt-4">
      <p className="eyebrow">{label}</p>
      <p className={`mt-3 font-display text-[clamp(3.5rem,8vw,7rem)] font-extrabold leading-none ${accent ? "text-accent" : ""}`}>
        <Odometer value={value} />
      </p>
      {sub && <p className="mt-2 font-mono text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function Competitive({ cp }: { cp: CpVM }) {
  const { lc, cf } = cp;
  return (
    <section id="cp" aria-labelledby="cp-title" className="section cv-auto">
      <div className="wrap">
        <SectionHead index="05" label="Competitive programming" title="Problems solved under the clock" id="cp-title">
          C++ is my problem-solving language. Numbers update daily from the LeetCode and Codeforces APIs.
        </SectionHead>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          <Stat label="LeetCode contest rating" value={lc.rating ?? 0} sub={`${lc.badge ?? ""} · top ${lc.topPercentage ?? "–"}% · ${lc.attended} contests`} accent />
          <Stat label="LeetCode solved" value={lc.solved.all} sub={`@${lc.username}`} />
          <Stat label="Codeforces max rating" value={cf.maxRating ?? 0} sub={`now ${cf.rating} · ${cf.maxRank ?? ""} · ${cf.contests} contests`} accent />
          <Stat label="Codeforces solved" value={cf.solved} sub={`@${cf.handle}`} />
        </div>

        <div className="mt-20 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Reveal className="panel p-5 md:p-8">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-3xl font-extrabold uppercase md:text-4xl">Codeforces rating</h3>
              <a href={cf.url} target="_blank" rel="noreferrer" className="font-mono text-xs text-accent hover:underline">
                profile ↗
              </a>
            </div>
            <RatingChart data={cf.history} label="Codeforces rating history" />
          </Reveal>
          <Reveal className="panel p-5 md:p-8">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-3xl font-extrabold uppercase md:text-4xl">LeetCode</h3>
              <a href={lc.url} target="_blank" rel="noreferrer" className="font-mono text-xs text-accent hover:underline">
                profile ↗
              </a>
            </div>
            <LcRings solved={lc.solved} totals={lc.totals} />
            <p className="mt-6 font-mono text-xs leading-relaxed text-muted">
              {lc.solved.all} accepted · {lc.solved.medium + lc.solved.hard} medium + hard
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
