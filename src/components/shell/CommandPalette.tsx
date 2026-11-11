"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { bus, scrollToId } from "@/lib/bus";
import { asset, PROFILE, SECTIONS } from "@/lib/site";
import { copyEmailWithConfetti, toggleTheme } from "@/lib/theme";

interface Item {
  id: string;
  label: string;
  group: "Navigate" | "Actions" | "Links";
  hint?: string;
  run: () => void;
}

const ext = (url: string) => () => window.open(url, "_blank", "noopener,noreferrer");

export default function CommandPalette({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const listId = useId();

  const close = useCallback(() => {
    setOpen(false);
    window.__lenis?.start();
    setTimeout(() => lastFocus.current?.focus?.(), 0);
  }, []);

  const items: Item[] = useMemo(
    () => [
      ...SECTIONS.map((s) => ({
        id: `go-${s.id}`,
        label: `Go to ${s.label}`,
        group: "Navigate" as const,
        hint: s.key.toUpperCase(),
        run: () => scrollToId(s.id),
      })),
      {
        id: "copy",
        label: "Copy email address",
        group: "Actions",
        run: () => void copyEmailWithConfetti(PROFILE.email),
      },
      { id: "theme", label: "Toggle dark / light theme", group: "Actions", run: () => toggleTheme() },
      { id: "term", label: "Open terminal", group: "Actions", hint: "~", run: () => bus.emit("terminal:open") },
      { id: "resume", label: "Open resume (PDF)", group: "Links", run: ext(asset(PROFILE.links.resume)) },
      { id: "gh", label: "GitHub: man-singh-dev", group: "Links", run: ext(PROFILE.links.github) },
      { id: "li", label: "LinkedIn", group: "Links", run: ext(PROFILE.links.linkedin) },
      { id: "lc", label: "LeetCode: Mansingh876", group: "Links", run: ext(PROFILE.links.leetcode) },
      { id: "cf", label: "Codeforces: maansimaan02", group: "Links", run: ext(PROFILE.links.codeforces) },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => {
      const hay = `${i.label} ${i.group}`.toLowerCase();
      let k = 0;
      for (const ch of hay) if (ch === s[k]) k++;
      return hay.includes(s) || k === s.length; // substring or subsequence
    });
  }, [q, items]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) lastFocus.current = document.activeElement as HTMLElement;
          return !o;
        });
      }
    };
    const offOpen = bus.on("palette:open", () => {
      lastFocus.current = document.activeElement as HTMLElement;
      setOpen(true);
    });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      offOpen();
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      window.__lenis?.stop();
      setTimeout(() => input.current?.focus(), 10);
    }
  }, [open]);

  const runItem = (i: Item) => {
    close();
    setTimeout(i.run, 60);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => (s + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => (s - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === "Enter" && filtered[sel]) {
      e.preventDefault();
      runItem(filtered[sel]);
    } else if (e.key === "Tab") {
      e.preventDefault(); // keep focus in the dialog
    }
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[260] flex items-start justify-center bg-black/55 px-4 pt-[14vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-bg-2 shadow-2xl"
            initial={{ y: 16, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <span className="font-mono text-accent" aria-hidden="true">
                &gt;
              </span>
              <input
                ref={input}
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Jump to a section or run a command…"
                className="h-14 w-full bg-transparent font-mono text-sm text-fg outline-none placeholder:text-muted focus-visible:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={filtered[sel] ? `cmd-${filtered[sel].id}` : undefined}
                aria-autocomplete="list"
                aria-label="Search commands"
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">ESC</kbd>
            </div>
            <ul id={listId} role="listbox" aria-label="Commands" className="max-h-[50vh] overflow-y-auto p-2" data-lenis-prevent>
              {filtered.length === 0 && <li className="px-3 py-6 text-center font-mono text-sm text-muted">No matches.</li>}
              {filtered.map((i, n) => {
                const header = i.group !== lastGroup ? (lastGroup = i.group) : null;
                return (
                  <li key={i.id} role="presentation">
                    {header && (
                      <div className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted" aria-hidden="true">
                        {header}
                      </div>
                    )}
                    <div
                      id={`cmd-${i.id}`}
                      role="option"
                      aria-selected={n === sel}
                      onMouseEnter={() => setSel(n)}
                      onClick={() => runItem(i)}
                      className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        n === sel ? "bg-accent text-accent-ink" : "text-fg"
                      }`}
                    >
                      <span>{i.label}</span>
                      {i.hint && <span className="font-mono text-[11px] opacity-70">{i.hint}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
