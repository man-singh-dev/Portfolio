"use client";

import { Line } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Line2 } from "three-stdlib";
import { ballAt, LANES, laneEnds, PITCH, posAt, SPACE, spaceAlpha, TRACKS } from "@/components/experience/pitchModel";

/* pitch (x, y) → world (x, 0, -y) */
const W = (x: number, y: number, h = 0) => new THREE.Vector3(x, h, -y);

function useThemeColors() {
  const colors = useRef({ accent: new THREE.Color("#ffb224"), fg: new THREE.Color("#ede9e1"), pitch: new THREE.Color("#0f1411") });
  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      colors.current.accent.set(s.getPropertyValue("--accent").trim());
      colors.current.fg.set(s.getPropertyValue("--fg").trim());
      colors.current.pitch.set(s.getPropertyValue("--pitch").trim());
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return colors;
}

function PitchMarkings({ color }: { color: THREE.Color }) {
  const hw = PITCH.w / 2,
    hh = PITCH.h / 2;
  const lines = useMemo(() => {
    const rect = (x0: number, y0: number, x1: number, y1: number) => [W(x0, y0, 0.01), W(x1, y0, 0.01), W(x1, y1, 0.01), W(x0, y1, 0.01), W(x0, y0, 0.01)];
    const circle = Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return W(Math.cos(a) * 0.915, Math.sin(a) * 0.915, 0.01);
    });
    return [
      rect(-hw, -hh, hw, hh),
      [W(0, -hh, 0.01), W(0, hh, 0.01)],
      circle,
      rect(hw - 1.65, -2.02, hw, 2.02),
      rect(-hw, -2.02, -hw + 1.65, 2.02),
      rect(hw - 0.55, -0.92, hw, 0.92),
      rect(-hw, -0.92, -hw + 0.55, 0.92),
    ];
  }, [hw, hh]);
  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={1} transparent opacity={0.35} />
      ))}
    </>
  );
}

function Scene({ progress }: { progress: React.RefObject<number> }) {
  const colors = useThemeColors();
  const t = useRef(0);
  const players = useRef<(THREE.Group | null)[]>([]);
  const ball = useRef<THREE.Mesh>(null);
  const space = useRef<THREE.Mesh>(null);
  const lanes = useRef<(Line2 | null)[]>([]);
  const attMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffb224", emissive: "#ffb224", emissiveIntensity: 0.45, roughness: 0.4 }), []);
  const defMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ede9e1", roughness: 0.6 }), []);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffb224", transparent: true, opacity: 0.3 }), []);
  const pitchMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0f1411", roughness: 1 }), []);

  useFrame((state) => {
    t.current += ((progress.current ?? 0) - t.current) * 0.1;
    const tt = t.current;
    attMat.color.copy(colors.current.accent);
    attMat.emissive.copy(colors.current.accent);
    ringMat.color.copy(colors.current.accent);
    defMat.color.copy(colors.current.fg);
    pitchMat.color.copy(colors.current.pitch);

    TRACKS.forEach((tr, i) => {
      const g = players.current[i];
      if (!g) return;
      const [x, y] = posAt(tr, tt);
      g.position.set(x, 0, -y);
    });
    if (ball.current) {
      const [bx, by] = ballAt(tt);
      const inFlight = tt > 0.55 && tt < 0.78;
      const hop = inFlight ? Math.sin(((tt - 0.55) / 0.23) * Math.PI) * 0.35 : 0;
      ball.current.position.set(bx, 0.07 + hop, -by);
    }
    if (space.current) {
      const a = spaceAlpha(tt);
      (space.current.material as THREE.MeshBasicMaterial).opacity = a * 0.22;
      const s = 0.6 + a * 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.03 * a;
      space.current.scale.set(s, s, s);
    }
    LANES.forEach((l, i) => {
      const line = lanes.current[i];
      if (!line) return;
      const { a, b, draw } = laneEnds(l, tt);
      const fade = tt > l.end + 0.25 && !l.key ? Math.max(0, 1 - (tt - l.end - 0.25) * 5) : 1;
      const ex = a[0] + (b[0] - a[0]) * Math.max(draw, 0.0001);
      const ey = a[1] + (b[1] - a[1]) * Math.max(draw, 0.0001);
      line.geometry.setPositions([a[0], 0.04, -a[1], ex, 0.04, -ey]);
      const m = line.material as THREE.Material & { opacity: number; color: THREE.Color };
      m.opacity = (draw > 0 ? 1 : 0) * fade * (l.key ? 1 : 0.55);
      m.color.copy(l.key ? colors.current.accent : colors.current.fg);
    });
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 8, 4]} intensity={1.4} />
      <mesh rotation-x={-Math.PI / 2} material={pitchMat}>
        <planeGeometry args={[PITCH.w + 0.8, PITCH.h + 0.8]} />
      </mesh>
      <PitchMarkings color={colors.current.fg} />
      <mesh ref={space} rotation-x={-Math.PI / 2} position={[SPACE.x, 0.02, -SPACE.y]}>
        <circleGeometry args={[SPACE.r, 48]} />
        <meshBasicMaterial color="#ffb224" transparent opacity={0} depthWrite={false} />
      </mesh>
      {LANES.map((l, i) => (
        <Line
          key={l.id}
          ref={(el) => {
            lanes.current[i] = el as unknown as Line2;
          }}
          points={[
            [0, 0, 0],
            [0.001, 0, 0],
          ]}
          color={l.key ? "#ffb224" : "#ede9e1"}
          lineWidth={l.key ? 3.5 : 1.5}
          dashed={!l.key}
          dashSize={0.12}
          gapSize={0.08}
          transparent
          opacity={0}
        />
      ))}
      {TRACKS.map((tr, i) => (
        <group
          key={tr.id}
          ref={(el) => {
            players.current[i] = el;
          }}
        >
          <mesh position={[0, 0.17, 0]} material={tr.team === "att" ? attMat : defMat}>
            <capsuleGeometry args={[0.1, 0.16, 4, 12]} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} material={tr.team === "att" ? ringMat : undefined}>
            <ringGeometry args={[0.15, 0.19, 32]} />
            {tr.team !== "att" && <meshBasicMaterial color="#8f8d88" transparent opacity={0.35} />}
          </mesh>
        </group>
      ))}
      <mesh ref={ball}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
    </>
  );
}

export default function PitchScene({ progress, active }: { progress: React.RefObject<number>; active: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [1.6, 6.2, 6.4], fov: 40, near: 0.1, far: 60 }}
      onCreated={({ camera }) => camera.lookAt(1.6, 0, 0)}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true }}
      aria-hidden="true"
    >
      <Scene progress={progress} />
    </Canvas>
  );
}
