"use client";

import Cursor from "./Cursor";
import LazyOverlays from "./LazyOverlays";
import Nav from "./Nav";
import Preloader from "./Preloader";
import SmoothScroll from "./SmoothScroll";
import type { Summary } from "@/lib/data";

export default function AppShell({ summary, bootLines, children }: { summary: Summary; bootLines: string[]; children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Preloader lines={bootLines} />
      <SmoothScroll />
      <Nav />
      <main id="main">{children}</main>
      <LazyOverlays summary={summary} />
      <Cursor />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
