"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { bootState, bus } from "@/lib/bus";

const FOV = 35;
const CAM_Z = 10;

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uScatter;
  uniform vec2  uMouse;
  uniform float uRadius;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute vec3 aTarget;
  attribute vec3 aRandom;
  attribute float aSeed;
  attribute float aAmbient;
  varying float vSeed;
  varying float vAlpha;

  void main() {
    float a = clamp(uAssemble * 1.5 - aSeed * 0.5, 0.0, 1.0);
    a = a * a * (3.0 - 2.0 * a);
    vec3 p = mix(aRandom, aTarget, a * (1.0 - aAmbient));
    // idle drift
    p.x += sin(uTime * 0.7 + aSeed * 40.0) * (0.012 + aAmbient * 0.25);
    p.y += cos(uTime * 0.55 + aSeed * 27.0) * (0.012 + aAmbient * 0.2);
    // mouse repel
    vec2 d = p.xy - uMouse;
    float dist = length(d);
    float f = 1.0 - smoothstep(0.0, uRadius, dist);
    p.xy += normalize(d + 1e-5) * f * f * uRadius * 0.85;
    p.z += f * 0.6;
    // scatter on scroll
    vec3 away = aRandom * 1.8 + vec3(0.0, 0.0, 3.0 + aSeed * 5.0);
    p = mix(p, away, uScatter * uScatter);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.55 + aSeed * 0.9) * (10.0 / -mv.z);
    vSeed = aSeed;
    vAlpha = mix(1.0, 0.35, aAmbient) * (1.0 - uScatter * 0.85) * (0.25 + 0.75 * max(a, aAmbient));
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vSeed;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float soft = 1.0 - smoothstep(0.15, 0.5, r); // edge0 < edge1 (reversed edges are undefined in GLSL)
    vec3 col = mix(uColorB, uColorA, step(0.72, vSeed));
    gl_FragColor = vec4(col, soft * vAlpha);
  }
`;

function readColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    a: new THREE.Color(s.getPropertyValue("--accent").trim() || "#ffb224"),
    b: new THREE.Color(s.getPropertyValue("--fg").trim() || "#ede9e1"),
  };
}

function Particles({
  anchor,
  scatter,
  text,
}: {
  anchor: React.RefObject<HTMLElement | null>;
  scatter: React.RefObject<number>;
  text: string;
}) {
  const { size, gl, viewport } = useThree();
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const mouse = useRef(new THREE.Vector2(99, 99));
  const mouseTarget = useRef(new THREE.Vector2(99, 99));
  const assembleStart = useRef<number | null>(null);

  // Build the material ourselves and always mutate material.uniforms: passing a uniforms
  // object as a JSX prop can leave us holding a detached copy (updates never reach the GPU).
  const material = useMemo(() => {
    const c = typeof document !== "undefined" ? readColors() : { a: new THREE.Color(), b: new THREE.Color() };
    return new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAssemble: { value: 0 },
        uScatter: { value: 0 },
        uMouse: { value: new THREE.Vector2(99, 99) },
        uRadius: { value: 0.75 },
        uSize: { value: 2.6 },
        uPixelRatio: { value: 1 },
        uColorA: { value: c.a },
        uColorB: { value: c.b },
      },
    });
  }, []);
  const uniforms = material.uniforms as {
    uTime: { value: number };
    uAssemble: { value: number };
    uScatter: { value: number };
    uMouse: { value: THREE.Vector2 };
    uRadius: { value: number };
    uSize: { value: number };
    uPixelRatio: { value: number };
    uColorA: { value: THREE.Color };
    uColorB: { value: THREE.Color };
  };
  useEffect(() => () => material.dispose(), [material]);

  // theme changes → recolor
  useEffect(() => {
    const mo = new MutationObserver(() => {
      const c = readColors();
      uniforms.uColorA.value.copy(c.a);
      uniforms.uColorB.value.copy(c.b);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [uniforms]);

  // start assembling once boot preloader is done
  useEffect(() => {
    const start = () => (assembleStart.current = performance.now());
    if (bootState.done) start();
    return bus.on("booted", start);
  }, []);

  // pointer → world coords at z=0
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      const h = 2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z;
      mouseTarget.current.set((nx * h * (r.width / r.height)) / 2, (ny * h) / 2);
    };
    const onLeave = () => mouseTarget.current.set(99, 99);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [gl]);

  // sample the name's pixels → particle targets, aligned to the real <h1>
  useEffect(() => {
    let cancelled = false;
    const build = async () => {
      await document.fonts.ready;
      if (cancelled || !anchor.current) return;
      const el = anchor.current;
      const rect = el.getBoundingClientRect();
      const crect = gl.domElement.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize);
      const family = cs.fontFamily;

      const W = Math.ceil(rect.width);
      const H = Math.ceil(rect.height);
      const cvs = document.createElement("canvas");
      cvs.width = W;
      cvs.height = H;
      const ctx = cvs.getContext("2d", { willReadFrequently: true })!;
      ctx.fillStyle = "#fff";
      ctx.font = `800 ${fontSize}px ${family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = cs.letterSpacing;
      ctx.fillText(text, W / 2, H / 2 + fontSize * 0.04);
      const data = ctx.getImageData(0, 0, W, H).data;

      let filled = 0;
      for (let i = 3; i < data.length; i += 16) if (data[i] > 128) filled++;
      filled *= 4;
      const target = Math.min(9000, Math.max(3500, Math.round((W * H) / 220)));
      const step = Math.max(2, Math.round(Math.sqrt(filled / target)));

      const visibleH = 2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z;
      const wpp = visibleH / crect.height;
      const ox = rect.left - crect.left;
      const oy = rect.top - crect.top;

      const pts: number[] = [];
      for (let y = 0; y < H; y += step)
        for (let x = 0; x < W; x += step)
          if (data[(y * W + x) * 4 + 3] > 128) {
            const jx = x + (Math.random() - 0.5) * step * 0.6;
            const jy = y + (Math.random() - 0.5) * step * 0.6;
            pts.push((ox + jx - crect.width / 2) * wpp, -(oy + jy - crect.height / 2) * wpp, 0);
          }

      const nText = pts.length / 3;
      const nAmbient = Math.round(nText * 0.25);
      const n = nText + nAmbient;
      const aTarget = new Float32Array(n * 3);
      const aRandom = new Float32Array(n * 3);
      const aSeed = new Float32Array(n);
      const aAmbient = new Float32Array(n);
      const halfW = (visibleH * (crect.width / crect.height)) / 2;
      for (let i = 0; i < n; i++) {
        const amb = i >= nText;
        if (!amb) {
          aTarget[i * 3] = pts[i * 3];
          aTarget[i * 3 + 1] = pts[i * 3 + 1];
          aTarget[i * 3 + 2] = 0;
        }
        aRandom[i * 3] = (Math.random() * 2 - 1) * halfW * 1.15;
        aRandom[i * 3 + 1] = (Math.random() * 2 - 1) * (visibleH / 2) * 1.15;
        aRandom[i * 3 + 2] = (Math.random() * 2 - 1) * 2.5;
        if (amb) {
          aTarget[i * 3] = aRandom[i * 3];
          aTarget[i * 3 + 1] = aRandom[i * 3 + 1];
          aTarget[i * 3 + 2] = aRandom[i * 3 + 2];
        }
        aSeed[i] = Math.random();
        aAmbient[i] = amb ? 1 : 0;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(aTarget.slice(), 3));
      g.setAttribute("aTarget", new THREE.BufferAttribute(aTarget, 3));
      g.setAttribute("aRandom", new THREE.BufferAttribute(aRandom, 3));
      g.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
      g.setAttribute("aAmbient", new THREE.BufferAttribute(aAmbient, 1));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
      if (!cancelled)
        setGeo((old) => {
          old?.dispose();
          return g;
        });
      uniforms.uSize.value = Math.max(1.6, Math.min(3.2, step * 0.95));
    };
    const id = setTimeout(build, 60);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [size.width, size.height, anchor, gl, text, uniforms]);

  useFrame((state, dt) => {
    uniforms.uTime.value += dt;
    uniforms.uPixelRatio.value = viewport.dpr;
    mouse.current.lerp(mouseTarget.current, 0.12);
    uniforms.uMouse.value.copy(mouse.current);
    uniforms.uScatter.value += ((scatter.current ?? 0) - uniforms.uScatter.value) * 0.12;
    if (assembleStart.current !== null) {
      const t = Math.min(1, (performance.now() - assembleStart.current) / 2600);
      uniforms.uAssemble.value = 1 - Math.pow(1 - t, 3);
    }
  });

  if (!geo) return null;
  return (
    <points geometry={geo} material={material} frustumCulled={false} />
  );
}

export default function HeroParticles(props: {
  anchor: React.RefObject<HTMLElement | null>;
  scatter: React.RefObject<number>;
  active: boolean;
  text: string;
  onReady?: () => void;
}) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.1, far: 50 }}
      frameloop={props.active ? "always" : "never"}
      onCreated={() => props.onReady?.()}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Particles anchor={props.anchor} scatter={props.scatter} text={props.text} />
    </Canvas>
  );
}
