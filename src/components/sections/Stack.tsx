import {
  siCplusplus,
  siCss,
  siDocker,
  siDrizzle,
  siFastify,
  siGit,
  siGithub,
  siGo,
  siHtml5,
  siJavascript,
  siNextdotjs,
  siNodedotjs,
  siOpenjdk,
  siPostgresql,
  siPython,
  siReact,
  siRedis,
  siSocketdotio,
  siTypescript,
  siVitest,
  siZod,
  type SimpleIcon,
} from "simple-icons";
import SkillSphereClient from "@/components/stack/SkillSphereClient";
import { Reveal, SectionHead } from "@/components/ui/motion";
import { SKILLS } from "@/lib/content";

type Item = { name: string; icon?: SimpleIcon; glyph?: string };

const ROW_A: Item[] = [
  { name: "C++", icon: siCplusplus },
  { name: "Java", icon: siOpenjdk },
  { name: "Go", icon: siGo },
  { name: "Python", icon: siPython },
  { name: "TypeScript", icon: siTypescript },
  { name: "JavaScript", icon: siJavascript },
  { name: "SQL", glyph: "SQL" },
  { name: "HTML", icon: siHtml5 },
  { name: "CSS", icon: siCss },
  { name: "Node.js", icon: siNodedotjs },
  { name: "Fastify", icon: siFastify },
];
const ROW_B: Item[] = [
  { name: "Next.js", icon: siNextdotjs },
  { name: "React", icon: siReact },
  { name: "Socket.IO", icon: siSocketdotio },
  { name: "BullMQ", glyph: "MQ" },
  { name: "PostgreSQL", icon: siPostgresql },
  { name: "Redis", icon: siRedis },
  { name: "Drizzle", icon: siDrizzle },
  { name: "Docker", icon: siDocker },
  { name: "Git", icon: siGit },
  { name: "GitHub", icon: siGithub },
  { name: "Vitest", icon: siVitest },
  { name: "Zod", icon: siZod },
  { name: "OpenAI API", glyph: "AI" },
];

function Logo({ item }: { item: Item }) {
  return (
    <li className="flex h-16 shrink-0 items-center gap-3 rounded-full border border-line bg-bg-2 px-6 md:h-20 md:px-8">
      {item.icon ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current md:h-7 md:w-7" aria-hidden="true">
          <use href={`#ic-${item.icon.slug}`} />
        </svg>
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded-md border border-line-strong font-mono text-[10px]" aria-hidden="true">
          {item.glyph}
        </span>
      )}
      <span className="font-display text-2xl font-bold uppercase md:text-3xl">{item.name}</span>
    </li>
  );
}

function Marquee({ items, reverse, dur }: { items: Item[]; reverse?: boolean; dur: string }) {
  return (
    <div className="marquee" data-reverse={reverse ? "" : undefined} style={{ ["--dur" as string]: dur }}>
      <ul className="marquee__track" aria-label={reverse ? "Data and tooling" : "Languages and backend"}>
        {items.map((i) => (
          <Logo key={i.name} item={i} />
        ))}
      </ul>
      <ul className="marquee__track" aria-hidden="true">
        {items.map((i) => (
          <Logo key={i.name} item={i} />
        ))}
      </ul>
    </div>
  );
}

/** Each icon path is emitted once; both marquee copies reference it with <use>. */
function IconSprite() {
  const icons = [...ROW_A, ...ROW_B].flatMap((i) => (i.icon ? [i.icon] : []));
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        {icons.map((ic) => (
          <symbol key={ic.slug} id={`ic-${ic.slug}`} viewBox="0 0 24 24">
            <path d={ic.path} />
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

export default function Stack() {
  const sphereWords = SKILLS.filter((g) => g.group !== "Coursework").flatMap((g) => g.items);
  return (
    <section id="stack" aria-labelledby="stack-title" className="section cv-auto overflow-hidden">
      <IconSprite />
      <div className="wrap">
        <SectionHead index="04" label="Stack" title="Tools of the trade" id="stack-title" />
      </div>
      <div className="space-y-4 py-2">
        <Marquee items={ROW_A} dur="48s" />
        <Marquee items={ROW_B} reverse dur="56s" />
      </div>
      <div className="wrap mt-20 grid items-center gap-10 lg:grid-cols-2">
        <Reveal className="space-y-7">
          {SKILLS.map((g) => (
            <div key={g.group} className="grid gap-2 border-t border-line pt-4 sm:grid-cols-[10rem_1fr]">
              <h3 className="eyebrow pt-1">{g.group}</h3>
              <ul className="flex flex-wrap gap-2">
                {g.items.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
        <SkillSphereClient words={sphereWords} />
      </div>
    </section>
  );
}
