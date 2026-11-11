import { Suspense } from "react";
import Achievements from "@/components/sections/Achievements";
import Activity from "@/components/sections/Activity";
import Competitive from "@/components/sections/Competitive";
import Contact from "@/components/sections/Contact";
import Education from "@/components/sections/Education";
import Experience from "@/components/sections/Experience";
import Hero from "@/components/sections/Hero";
import OpenSource from "@/components/sections/OpenSource";
import Projects from "@/components/sections/Projects";
import Stack from "@/components/sections/Stack";
import AppShell from "@/components/shell/AppShell";
import { floorPlus, getActivity, getCp, getOtherRepos, getPrs, getPrStats, getRepoCount, getSummary } from "@/lib/data";

export default function Home() {
  const summary = getSummary();
  const cp = getCp();
  const prStats = getPrStats();

  const bootLines = [
    "initializing man-singh.sys…",
    "mounting /research/vlm-football-bench",
    "loading projects: SentinelOps, DiffCraft",
    `${floorPlus(summary.solvedTotal)} problems solved`,
    `${prStats.merged} merged PRs across ${prStats.orgs} orgs`,
    "ready.",
  ];

  const ticker = [
    `LeetCode ${cp.lc.rating} · ${cp.lc.badge}`,
    `${summary.solvedTotal} problems solved`,
    `${prStats.merged} merged OSS PRs`,
  ];

  return (
    <AppShell summary={summary} bootLines={bootLines}>
      <Hero ticker={ticker} />
      {/* Each Suspense boundary is hydrated as its own task (selective hydration),
          which splits one long main-thread task into many short ones. */}
      <Suspense>
        <Experience />
      </Suspense>
      <Suspense>
        <Projects repos={getOtherRepos()} repoCount={getRepoCount()} />
      </Suspense>
      <Suspense>
        <OpenSource prs={getPrs()} stats={prStats} />
      </Suspense>
      <Suspense>
        <Stack />
      </Suspense>
      <Suspense>
        <Competitive cp={cp} />
      </Suspense>
      <Suspense>
        <Activity data={getActivity()} />
      </Suspense>
      <Suspense>
        <Achievements
          lc={{ rating: cp.lc.rating, badge: cp.lc.badge, top: cp.lc.topPercentage, solved: cp.lc.solved.all }}
          cf={{ max: cp.cf.maxRating, solved: cp.cf.solved }}
        />
      </Suspense>
      <Suspense>
        <Education />
      </Suspense>
      <Suspense>
        <Contact refreshed={summary.generatedAt.slice(0, 10)} />
      </Suspense>
    </AppShell>
  );
}
