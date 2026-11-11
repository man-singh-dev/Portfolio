"use client";

/** Toggle dark/light with a circular reveal from (x, y) using the View Transitions API. */
export function toggleTheme(x?: number, y?: number) {
  const root = document.documentElement;
  const next = root.dataset.theme === "light" ? "dark" : "light";
  const apply = () => {
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!doc.startViewTransition || reduced) {
    apply();
    return;
  }
  const cx = x ?? window.innerWidth - 40;
  const cy = y ?? 40;
  const r = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
  const t = doc.startViewTransition(apply);
  t.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${r}px at ${cx}px ${cy}px)`] },
      { duration: 750, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  });
}

export async function copyEmailWithConfetti(email: string, origin?: { x: number; y: number }) {
  let ok = false;
  try {
    await navigator.clipboard.writeText(email);
    ok = true;
  } catch {
    ok = false;
  }
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const confetti = (await import("canvas-confetti")).default;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ffb224";
    confetti({
      particleCount: 90,
      spread: 75,
      startVelocity: 38,
      origin: origin
        ? { x: origin.x / window.innerWidth, y: origin.y / window.innerHeight }
        : { x: 0.5, y: 0.7 },
      colors: [accent, "#ede9e1", "#8f8d88"],
      disableForReducedMotion: true,
      zIndex: 400,
    });
  }
  return ok;
}
