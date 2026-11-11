/**
 * An illustrative tactical sequence (not real match data) used to visualise the
 * research question: the winger drags the full-back wide, the half-space opens,
 * 8 plays the through-ball into the lane between CB and FB, and 9 runs onto it.
 * Pitch units: x ∈ [-5.25, 5.25] (length, attacking +x), y ∈ [-3.4, 3.4] (width).
 */
export const PITCH = { w: 10.5, h: 6.8 };

export type Team = "att" | "def" | "ball";
export interface Track {
  id: string;
  team: Team;
  label: string;
  keys: [t: number, x: number, y: number][];
}

export const TRACKS: Track[] = [
  { id: "8", team: "att", label: "8", keys: [[0, 0.5, 0.4], [0.5, 0.9, 0.5], [1, 1.4, 0.6]] },
  { id: "9", team: "att", label: "9", keys: [[0, 3.1, -0.1], [0.35, 3.2, -0.05], [0.72, 4.45, 1.3], [1, 4.75, 1.15]] },
  { id: "lw", team: "att", label: "LW", keys: [[0, 2.3, 2.2], [0.42, 3.0, 2.95], [1, 3.25, 3.0]] },
  { id: "rw", team: "att", label: "RW", keys: [[0, 2.5, -2.5], [0.5, 2.95, -2.6], [1, 3.3, -2.4]] },
  { id: "6", team: "att", label: "6", keys: [[0, -0.6, -0.6], [1, 0.1, -0.4]] },
  { id: "fb", team: "def", label: "FB", keys: [[0, 3.3, 1.85], [0.45, 3.45, 2.75], [1, 3.6, 2.7]] },
  { id: "cb", team: "def", label: "CB", keys: [[0, 3.85, 0.7], [0.45, 3.9, 0.25], [0.82, 4.3, 0.85], [1, 4.45, 0.95]] },
  { id: "cb2", team: "def", label: "CB", keys: [[0, 3.85, -0.8], [1, 3.95, -0.6]] },
  { id: "lb", team: "def", label: "FB", keys: [[0, 3.3, -2.1], [1, 3.45, -2.25]] },
  { id: "dm", team: "def", label: "DM", keys: [[0, 1.8, 0.2], [0.5, 2.0, -0.1], [1, 2.2, 0.1]] },
  { id: "gk", team: "def", label: "GK", keys: [[0, 5.0, 0], [0.8, 4.95, 0.35], [1, 4.9, 0.55]] },
];

const ease = (t: number) => t * t * (3 - 2 * t);

export function posAt(track: Track, t: number): [number, number] {
  const k = track.keys;
  if (t <= k[0][0]) return [k[0][1], k[0][2]];
  for (let i = 0; i < k.length - 1; i++) {
    const [t0, x0, y0] = k[i];
    const [t1, x1, y1] = k[i + 1];
    if (t <= t1) {
      const u = ease((t - t0) / (t1 - t0));
      return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
    }
  }
  const last = k[k.length - 1];
  return [last[1], last[2]];
}

const byId = (id: string) => TRACKS.find((t) => t.id === id)!;

/** Ball: at 8's feet, through-ball into 9's run between 0.55 and 0.78, then with 9. */
export function ballAt(t: number): [number, number] {
  const [ex, ey] = posAt(byId("8"), Math.min(t, 0.55));
  const [nx, ny] = posAt(byId("9"), Math.max(t, 0.78));
  if (t <= 0.55) return [ex + 0.18, ey - 0.05];
  if (t >= 0.78) return [nx + 0.16, ny - 0.04];
  const u = ease((t - 0.55) / 0.23);
  return [ex + 0.18 + (nx + 0.16 - ex - 0.18) * u, ey - 0.05 + (ny - 0.04 - ey + 0.05) * u];
}

export interface Lane {
  id: string;
  from: string;
  to: string | [number, number];
  start: number;
  end: number;
  key?: boolean;
}

/** Passing lanes that "draw themselves". The key lane is the through-ball. */
export const LANES: Lane[] = [
  { id: "l-lw", from: "8", to: "lw", start: 0.12, end: 0.26 },
  { id: "l-rw", from: "8", to: "rw", start: 0.18, end: 0.32 },
  { id: "l-key", from: "8", to: [4.45, 1.3], start: 0.44, end: 0.58, key: true },
];

export function laneEnds(l: Lane, t: number): { a: [number, number]; b: [number, number]; draw: number } {
  const a = posAt(byId(l.from), t);
  const b = typeof l.to === "string" ? posAt(byId(l.to), t) : l.to;
  const draw = Math.max(0, Math.min(1, (t - l.start) / (l.end - l.start)));
  return { a, b, draw };
}

/** The half-space that opens when the full-back is dragged wide. */
export const SPACE = { x: 4.05, y: 1.55, r: 0.85, start: 0.26, end: 0.46 };
export const spaceAlpha = (t: number) => Math.max(0, Math.min(1, (t - SPACE.start) / (SPACE.end - SPACE.start))) * (t > 0.9 ? 1 - (t - 0.9) * 6 : 1);
