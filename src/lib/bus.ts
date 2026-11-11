"use client";

/** Tiny global UI state shared by the shell (palette, terminal, boot, smooth scroll). */
type Events = {
  booted: void;
  "palette:open": void;
  "terminal:open": void;
  "theme:toggle": { x: number; y: number } | void;
};

type Handler<T> = (payload: T) => void;
const handlers = new Map<keyof Events, Set<Handler<unknown>>>();

export const bus = {
  on<K extends keyof Events>(event: K, fn: Handler<Events[K]>) {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(fn as Handler<unknown>);
    return (): void => {
      handlers.get(event)!.delete(fn as Handler<unknown>);
    };
  },
  emit<K extends keyof Events>(event: K, payload?: Events[K]) {
    handlers.get(event)?.forEach((fn) => fn(payload));
  },
};

/** Whether the boot preloader has finished (so hero intro can start). */
export const bootState = { done: false };

/** Smooth-scroll to a section id, using Lenis when active. */
export function scrollToId(id: string) {
  const el = id === "top" ? document.body : document.getElementById(id);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement | number, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(id === "top" ? 0 : el, { duration: 1.4 });
  else if (id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
  else el.scrollIntoView({ behavior: "smooth" });
  // move focus for keyboard / screen-reader users
  if (id !== "top") {
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }
}
