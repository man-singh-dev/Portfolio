"use client";

import { useEffect, useState } from "react";
import { bus } from "@/lib/bus";
import { SECTIONS } from "@/lib/site";
import { toggleTheme } from "@/lib/theme";

export default function Nav() {
  const [active, setActive] = useState<string>("top");
  const [isMac, setIsMac] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));

    let last = window.scrollY;
    // hide on scroll down, reveal on scroll up
    const handler = () => {
      const y = window.scrollY;
      if (y > 300 && y > last + 4) setHidden(true);
      else if (y < last - 4 || y < 300) setHidden(false);
      last = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", handler);
    };
  }, []);

  const label = SECTIONS.find((s) => s.id === active)?.label ?? "";
  const idx = SECTIONS.findIndex((s) => s.id === active);

  return (
    <header
      className="fixed inset-x-0 top-0 z-[120] bg-gradient-to-b from-bg/85 via-bg/50 to-transparent transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
      style={{ transform: hidden ? "translateY(-110%)" : "none" }}
    >
      <nav aria-label="Primary" className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-4 md:px-10">
        <a href="#top" className="group flex items-center gap-3" aria-label="MS systems + vision: Man Singh, back to top">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-line-strong font-display text-lg font-extrabold transition-colors group-hover:bg-accent group-hover:text-accent-ink">
            MS
          </span>
          <span className="hidden font-mono text-xs text-muted sm:block">
            systems <span className="text-accent">+</span> vision
          </span>
        </a>

        <div className="hidden items-center gap-3 font-mono text-xs text-muted md:flex" aria-live="polite">
          <span className="tabular-nums text-accent">{String(Math.max(idx, 0)).padStart(2, "0")}</span>
          <span className="h-px w-10 bg-line-strong" />
          <span className="min-w-[8rem] uppercase tracking-[0.18em]">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => bus.emit("palette:open")}
            className="flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 font-mono text-xs backdrop-blur-md transition-colors hover:border-accent"
            aria-label="Open command menu"
            aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
          >
            <span className="hidden sm:inline">{isMac ? "⌘" : "Ctrl"} K</span>
            <span className="sm:hidden">Menu</span>
          </button>
          <button
            type="button"
            onClick={(e) => toggleTheme(e.clientX, e.clientY)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line-strong backdrop-blur-md transition-colors hover:border-accent"
            aria-label="Toggle dark / light theme"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
            </svg>
          </button>
          <a
            href="#contact"
            className="hidden h-10 items-center rounded-full bg-accent px-5 font-mono text-xs font-medium text-accent-ink transition-transform hover:scale-[1.04] md:flex"
          >
            Let&apos;s talk
          </a>
        </div>
      </nav>
    </header>
  );
}
