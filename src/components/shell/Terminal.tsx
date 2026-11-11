"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { bus, scrollToId } from "@/lib/bus";
import type { Summary } from "@/lib/data";
import { asset, PROFILE, SECTIONS } from "@/lib/site";
import { copyEmailWithConfetti, toggleTheme } from "@/lib/theme";

type Line = { kind: "in" | "out" | "err" | "accent"; text: string; href?: string };

const isTyping = (el: Element | null) =>
  !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement).isContentEditable);

export default function Terminal({ summary, defaultOpen = false }: { summary: Summary; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [lines, setLines] = useState<Line[]>([
    { kind: "accent", text: "man-singh.sys terminal. type `help` to list commands." },
  ]);
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setTimeout(() => lastFocus.current?.focus?.(), 0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "~" || e.key === "`") && !isTyping(document.activeElement)) {
        e.preventDefault();
        setOpen((o) => {
          if (!o) lastFocus.current = document.activeElement as HTMLElement;
          return !o;
        });
      }
    };
    const off = bus.on("terminal:open", () => {
      lastFocus.current = document.activeElement as HTMLElement;
      setOpen(true);
    });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      off();
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);

  const out = (text: string, kind: Line["kind"] = "out", href?: string): Line => ({ kind, text, href });

  const run = (raw: string) => {
    const cmd = raw.trim();
    const [name, ...args] = cmd.split(/\s+/);
    const res: Line[] = [];
    switch (name?.toLowerCase()) {
      case "":
        break;
      case "help":
        res.push(
          out("whoami      who is this"),
          out("projects    featured work"),
          out("prs         open-source pull requests"),
          out("stats       competitive programming + github numbers"),
          out("education   where I study"),
          out("contact     how to reach me (`contact --copy` copies email)"),
          out("socials     links"),
          out("resume      open the resume PDF"),
          out("cd <name>   jump to a section (ls to list)"),
          out("theme       toggle dark / light"),
          out("sudo hire-me"),
          out("clear, exit"),
        );
        break;
      case "whoami":
        res.push(
          out("Man Singh. B.Tech CSE @ IIIT Agartala (2024–2028), CGPA 8.82."),
          out("AI/ML Research Intern @ IIT Patna: do VLMs reason about football tactics or just describe them?"),
          out("Backend engineer at heart: queues, idempotency, constraints, and 'what happens when this fails?'"),
        );
        break;
      case "projects":
        res.push(
          out("SentinelOps   event ingestion: SHA-256 API keys, idempotent writes (Node/TS, Postgres)", "out", "https://github.com/man-singh-dev/SentinelOps"),
          out("DiffCraft     collaborative code review (Next.js, Fastify, Drizzle)", "out", "https://github.com/man-singh-dev/diffCraft"),
          out(`…and ${summary.repos - 2} more public repos: cd projects`),
        );
        break;
      case "prs":
        res.push(out(`${summary.prMerged}/${summary.prTotal} open-source PRs merged across ${summary.prOrgs} orgs:`, "accent"));
        summary.ossRepos.forEach((r) => res.push(out(`  ✓ ${r}`, "out", `https://github.com/${r}`)));
        break;
      case "stats":
        res.push(
          out(`LeetCode     ${summary.lcRating ?? "–"} rating · ${summary.lcBadge ?? ""} · top ${summary.lcTop ?? "–"}% · ${summary.lcSolved} solved`),
          out(`Codeforces   ${summary.cfRating} now · ${summary.cfMax} max · ${summary.cfSolved} solved`),
          out(`GitHub       ${summary.contributions} contributions in the last year · ${summary.repos} public repos`),
          out(`data refreshed ${summary.generatedAt.slice(0, 10)}`, "accent"),
        );
        break;
      case "education":
        res.push(
          out("IIIT Agartala, B.Tech CSE    2024–2028   CGPA 8.82/10"),
          out("Class XII                    2023        94.2%"),
          out("Class X                      2021        98.6%"),
        );
        break;
      case "contact":
        if (args.includes("--copy")) {
          void copyEmailWithConfetti(PROFILE.email);
          res.push(out(`copied ${PROFILE.email} ✓`, "accent"));
        } else res.push(out(PROFILE.email, "out", `mailto:${PROFILE.email}`));
        break;
      case "socials":
        res.push(
          out("github      man-singh-dev", "out", PROFILE.links.github),
          out("linkedin    maansingh0103", "out", PROFILE.links.linkedin),
          out("leetcode    Mansingh876", "out", PROFILE.links.leetcode),
          out("codeforces  maansimaan02", "out", PROFILE.links.codeforces),
        );
        break;
      case "resume":
        window.open(asset(PROFILE.links.resume), "_blank", "noopener,noreferrer");
        res.push(out("opening resume…"));
        break;
      case "ls":
        res.push(out(SECTIONS.map((s) => s.id).join("  ")));
        break;
      case "cd": {
        const target = SECTIONS.find((s) => s.id === args[0] || s.label.toLowerCase() === args.join(" ").toLowerCase());
        if (target) {
          res.push(out(`→ ${target.id}`));
          setTimeout(() => {
            close();
            scrollToId(target.id);
          }, 250);
        } else res.push(out(`cd: no such section: ${args[0] ?? ""} (try ls)`, "err"));
        break;
      }
      case "theme":
        toggleTheme();
        res.push(out("theme toggled"));
        break;
      case "sudo":
        if (args.join(" ") === "hire-me") {
          res.push(
            out("[sudo] password for recruiter: ********"),
            out("verifying… idempotency ✓  tests ✓  merged PRs ✓  curiosity ✓", "accent"),
            out("Access granted. Request stored exactly once."),
            out(`→ ${PROFILE.email}`, "out", `mailto:${PROFILE.email}?subject=Let's%20build%20something`),
          );
          void copyEmailWithConfetti(PROFILE.email);
        } else res.push(out("nice try. this incident has been reported.", "err"));
        break;
      case "clear":
        setLines([]);
        return;
      case "exit":
        close();
        return;
      case "echo":
        res.push(out(args.join(" ")));
        break;
      case "date":
        res.push(out(new Date().toString()));
        break;
      default:
        res.push(out(`command not found: ${name}. type help`, "err"));
    }
    setLines((l) => [...l, out(cmd, "in"), ...res]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(value);
      if (value.trim()) setHistory((h) => [value, ...h].slice(0, 50));
      setValue("");
      setHIdx(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.min(hIdx + 1, history.length - 1);
      if (history[n] !== undefined) {
        setHIdx(n);
        setValue(history[n]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = hIdx - 1;
      setHIdx(Math.max(n, -1));
      setValue(n >= 0 ? history[n] : "");
    } else if (e.key === "Escape" || ((e.key === "~" || e.key === "`") && !value)) {
      e.preventDefault();
      close();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Terminal"
          className="fixed inset-x-3 bottom-3 z-[255] mx-auto max-w-3xl overflow-hidden rounded-xl border border-line-strong bg-[#070708]/95 font-mono text-[13px] text-[#ede9e1] shadow-2xl backdrop-blur-md md:inset-x-6"
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ type: "spring", stiffness: 300, damping: 34 }}
          onClick={() => input.current?.focus()}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[11px] text-[#8f8d88]">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffb224]" aria-hidden="true" /> visitor@man-singh: ~
            </span>
            <button type="button" onClick={close} className="hover:text-white" aria-label="Close terminal">
              esc ✕
            </button>
          </div>
          <div ref={scroller} className="h-[min(46vh,360px)] overflow-y-auto px-4 py-3" data-lenis-prevent aria-live="polite">
            {lines.map((l, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap break-words leading-relaxed ${
                  l.kind === "err" ? "text-[#ff6b5b]" : l.kind === "accent" ? "text-[#ffb224]" : l.kind === "in" ? "text-white" : "text-[#c9c5bd]"
                }`}
              >
                {l.kind === "in" && <span className="text-[#ffb224]">$ </span>}
                {l.href ? (
                  <a href={l.href} target={l.href.startsWith("mailto") ? undefined : "_blank"} rel="noreferrer" className="underline decoration-white/30 underline-offset-4 hover:text-[#ffb224]">
                    {l.text}
                  </a>
                ) : (
                  l.text
                )}
              </div>
            ))}
            <div className="flex items-center">
              <span className="text-[#ffb224]">$&nbsp;</span>
              <input
                ref={input}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full bg-transparent text-white caret-[#ffb224] outline-none focus-visible:outline-none"
                aria-label="Terminal command"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
