"use client";

import { useCallback, useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function subscribeMQ(query: string) {
  return (cb: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  };
}

export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    subscribeMQ(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let webglCache: boolean | null = null;
function hasWebGL() {
  if (webglCache !== null) return webglCache;
  try {
    const c = document.createElement("canvas");
    webglCache = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/**
 * true only on devices that should get the WebGL scenes:
 * not reduced-motion, WebGL available, not a small touch screen, not a very weak CPU / low memory.
 */
export function useCapable3D() {
  const reduced = useReducedMotion();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const smallTouch = window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 1024;
    const weak = (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) < 4;
    const saveData = !!nav.connection?.saveData;
    setOk(!reduced && !smallTouch && !weak && !saveData && window.innerWidth >= 768 && hasWebGL());
  }, [reduced]);
  return ok;
}

/**
 * Run `setup` (e.g. GSAP ScrollTrigger creation) only when the element comes within
 * ~1.5 viewports. Keeps forced layout work out of the initial hydration commit.
 * `setup` may return a cleanup function.
 */
export function useNearViewport(
  ref: React.RefObject<Element | null>,
  setup: () => void | (() => void),
  deps: React.DependencyList,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cleanup: void | (() => void);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        cleanup = setup();
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (typeof cleanup === "function") cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** IntersectionObserver hook. `once` keeps it true after first intersection. */
export function useInView<T extends Element>(opts: { rootMargin?: string; once?: boolean; threshold?: number } = {}) {
  // callback ref: works even when the element mounts after the hook (conditional rendering)
  const [el, setEl] = useState<T | null>(null);
  const ref = useCallback((node: T | null) => setEl(node), []);
  const [inView, setInView] = useState(false);
  const { rootMargin = "0px", once = false, threshold = 0 } = opts;
  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) setInView(false);
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el, rootMargin, once, threshold]);
  return [ref, inView] as const;
}
