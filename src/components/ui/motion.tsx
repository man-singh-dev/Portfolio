"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion, useInView } from "@/lib/hooks";

/* ------------------------------------------------------------------ Reveal helpers
   IntersectionObserver + CSS transitions (see .rv-* / .sh-* in globals.css).
   No layout reads at load, content is visible in the server HTML, and with
   reduced motion nothing is ever hidden. */
function useIoReveal(waitClass: string, inClass: string, rootMargin = "0px 0px -12% 0px") {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    // No layout reads here (they'd force rendering of content-visibility:auto sections).
    // The first IO callback tells us whether it is already on screen: if so, leave it alone.
    let first = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (first) {
          first = false;
          if (e.isIntersecting) return io.disconnect();
          el.classList.add(waitClass);
          return;
        }
        if (!e.isIntersecting) return;
        el.classList.add(inClass);
        el.classList.remove(waitClass);
        io.disconnect();
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [waitClass, inClass, rootMargin]);
  return ref;
}

export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ul" | "ol" | "section" | "article";
}) {
  const ref = useIoReveal("rv-wait", "rv-in");
  useEffect(() => {
    Array.from(ref.current?.children ?? []).forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(Math.min(i, 8))));
  }, [ref]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = Tag as any;
  return (
    <T ref={ref} className={className}>
      {children}
    </T>
  );
}

/* ------------------------------------------------------------------ SplitHeading
   Masked word-by-word rise when it enters the viewport. */
export function SplitHeading({
  text,
  className = "h-section",
  as: Tag = "h2",
  id,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  id?: string;
}) {
  const ref = useIoReveal("sh-wait", "sh-in", "0px 0px -8% 0px");
  const words = text.split(" ");
  return (
    <Tag ref={ref as React.RefObject<HTMLHeadingElement>} id={id} className={className} aria-label={text} data-cursor="text">
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.06em] align-bottom" aria-hidden="true">
          <span data-w className="inline-block" style={{ ["--i" as string]: i }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}

export function SectionHead({ index, label, title, id, children }: { index: string; label: string; title: string; id: string; children?: React.ReactNode }) {
  return (
    <div className="mb-14 md:mb-20">
      <p className="eyebrow mb-5">
        <b>({index})</b> · {label}
      </p>
      <SplitHeading text={title} id={id} />
      {children && <div className="mt-6 max-w-2xl text-base text-muted md:text-lg">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ ScrambleText */
const GLYPHS = "!<>-_\\/[]{}—=+*^?#01ABCDEFX";

export function ScrambleCycle({ words, interval = 2600 }: { words: readonly string[]; interval?: number }) {
  const [text, setText] = useState(words[0]);
  const current = useRef(words[0]);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let i = 0;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    const scrambleTo = (to: string) => {
      const from = current.current;
      current.current = to;
      const len = Math.max(from.length, to.length);
      const queue = Array.from({ length: len }, (_, k) => ({
        from: from[k] ?? "",
        to: to[k] ?? "",
        start: Math.floor(Math.random() * 18),
        end: Math.floor(Math.random() * 18) + 18,
      }));
      let frame = 0;
      const tick = () => {
        let done = 0;
        const s = queue
          .map((q) => {
            if (frame >= q.end) {
              done++;
              return q.to;
            }
            if (frame >= q.start) return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            return q.from;
          })
          .join("");
        setText(s);
        frame++;
        if (done < queue.length) raf = requestAnimationFrame(tick);
        else timer = setTimeout(next, interval);
      };
      tick();
    };
    const next = () => {
      i = (i + 1) % words.length;
      scrambleTo(words[i]);
    };
    timer = setTimeout(next, interval);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, interval]);
  return (
    <>
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true">{text}</span>
    </>
  );
}

/* ------------------------------------------------------------------ Magnetic */
export function Magnetic({ children, strength = 0.35, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return (
    <div ref={ref} className={`inline-block ${className ?? ""}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Odometer */
export function Odometer({ value, className, pad = 0 }: { value: number; className?: string; pad?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>({ once: true, rootMargin: "-10% 0px" });
  const digits = String(value).padStart(pad, "0").split("");
  return (
    <span ref={ref} className={`inline-flex tabular-nums ${className ?? ""}`}>
      <span className="sr-only">{value}</span>
      {digits.map((d, i) => (
        <span key={i} aria-hidden="true" className="relative inline-block h-[1em] w-[0.56em] overflow-hidden text-center leading-none">
          <span
            className="flex flex-col transition-transform duration-[1600ms] ease-[cubic-bezier(.16,1,.3,1)]"
            style={{
              transform: `translateY(-${inView ? Number(d) * 10 : 0}%)`,
              transitionDelay: `${(digits.length - i) * 90}ms`,
            }}
          >
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n} className="block h-[1em] leading-none">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ CountUp */
export function CountUp({ to, duration = 1600, className, suffix = "" }: { to: number; duration?: number; className?: string; suffix?: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>({ once: true });
  const [n, setN] = useState(to);
  const started = useRef(false);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    setN(0);
  }, []);
  useEffect(() => {
    if (!inView || started.current || prefersReducedMotion()) return;
    started.current = true;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {n}
      {suffix}
    </span>
  );
}
