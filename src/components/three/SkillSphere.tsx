"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const R = 2.3;

/** Projects each word's 3D position to screen space every frame and moves plain DOM labels.
 *  (Cheaper than one React root per label, and crisp text.) */
function Projector({ positions, els }: { positions: THREE.Vector3[]; els: React.RefObject<(HTMLSpanElement | null)[]> }) {
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const camLen = camera.position.length();
    positions.forEach((p, i) => {
      const el = els.current?.[i];
      if (!el) return;
      const d = tmp.copy(p).distanceTo(camera.position);
      const k = 1 - (d - (camLen - R)) / (2 * R); // 1 = front, 0 = back
      tmp.copy(p).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${(0.7 + k * 0.45).toFixed(3)})`;
      el.style.opacity = (0.15 + k * 0.85).toFixed(3);
      el.style.color = k > 0.82 ? "var(--accent)" : "var(--fg)";
      el.style.zIndex = String(Math.round(k * 100));
    });
  });
  return (
    <mesh>
      <sphereGeometry args={[R * 0.98, 32, 32]} />
      <meshBasicMaterial color="#8f8d88" wireframe transparent opacity={0.06} />
    </mesh>
  );
}

export default function SkillSphere({ words, active }: { words: string[]; active: boolean }) {
  const els = useRef<(HTMLSpanElement | null)[]>([]);
  const positions = useMemo(() => {
    // Fibonacci sphere: even distribution
    const n = words.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    return words.map((_, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      return new THREE.Vector3(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R);
    });
  }, [words]);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 7.4], fov: 45 }} dpr={[1, 1.5]} frameloop={active ? "always" : "never"}>
        <Projector positions={positions} els={els} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.1} rotateSpeed={0.6} enableDamping />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {words.map((w, i) => (
          <span
            key={w}
            ref={(el) => {
              els.current[i] = el;
            }}
            className="absolute left-0 top-0 whitespace-nowrap font-mono text-[13px] will-change-transform"
            style={{ opacity: 0 }}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
