"use client";

import { useEffect, useRef, useState } from "react";

type State = "default" | "link" | "view" | "text";

/** Dot + trailing ring. Only on fine pointers without reduced motion. */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState("VIEW");

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");

    let mx = -100,
      my = -100,
      rx = -100,
      ry = -100,
      raf = 0,
      visible = false;

    const setState = (s: State) => {
      if (ring.current && ring.current.dataset.state !== s) ring.current.dataset.state = s;
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        rx = mx;
        ry = my;
        dot.current!.style.opacity = "1";
        ring.current!.style.opacity = "1";
      }
      const t = e.target as HTMLElement;
      const tagged = t.closest<HTMLElement>("[data-cursor]");
      if (tagged) {
        const s = tagged.dataset.cursor as State;
        if (s === "view") setLabel(tagged.dataset.cursorLabel || "VIEW");
        setState(s);
      } else if (t.closest("a, button, [role='button'], input, select, label, summary")) setState("link");
      else setState("default");
    };
    const onLeave = () => {
      visible = false;
      dot.current!.style.opacity = "0";
      ring.current!.style.opacity = "0";
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className="cursor-ring" style={{ opacity: 0 }} aria-hidden="true">
        <span>{label}</span>
      </div>
      <div ref={dot} className="cursor-dot" style={{ opacity: 0 }} aria-hidden="true" />
    </>
  );
}
