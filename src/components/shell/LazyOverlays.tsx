"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { bus } from "@/lib/bus";
import type { Summary } from "@/lib/data";

// Loaded on first use only: keeps framer-motion + overlay code off the critical path.
const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });
const Terminal = dynamic(() => import("./Terminal"), { ssr: false });

const isTyping = (el: Element | null) =>
  !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement).isContentEditable);

export default function LazyOverlays({ summary }: { summary: Summary }) {
  const [palette, setPalette] = useState<null | { open: boolean }>(null);
  const [terminal, setTerminal] = useState<null | { open: boolean }>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!palette && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette({ open: true });
      } else if (!terminal && (e.key === "~" || e.key === "`") && !isTyping(document.activeElement)) {
        e.preventDefault();
        setTerminal({ open: true });
      }
    };
    const offP = palette ? undefined : bus.on("palette:open", () => setPalette({ open: true }));
    const offT = terminal ? undefined : bus.on("terminal:open", () => setTerminal({ open: true }));
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      offP?.();
      offT?.();
    };
  }, [palette, terminal]);

  return (
    <>
      {palette && <CommandPalette defaultOpen={palette.open} />}
      {terminal && <Terminal summary={summary} defaultOpen={terminal.open} />}
    </>
  );
}
