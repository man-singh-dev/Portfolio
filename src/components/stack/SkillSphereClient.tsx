"use client";

import dynamic from "next/dynamic";
import { useCapable3D, useInView } from "@/lib/hooks";

const SkillSphere = dynamic(() => import("@/components/three/SkillSphere"), { ssr: false });

export default function SkillSphereClient({ words }: { words: string[] }) {
  const capable = useCapable3D();
  const [ref, near] = useInView<HTMLDivElement>({ rootMargin: "300px" });
  const [vref, visible] = useInView<HTMLDivElement>();
  if (!capable) return null; // the grouped list beside it carries the same content
  return (
    <div ref={ref} className="relative">
      <div ref={vref} className="relative aspect-square w-full max-w-[640px] justify-self-center" data-cursor="view" data-cursor-label="DRAG">
        {near && <SkillSphere words={words} active={visible} />}
        <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">drag to rotate</p>
      </div>
    </div>
  );
}
