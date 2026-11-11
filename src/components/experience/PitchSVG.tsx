import { ballAt, LANES, laneEnds, PITCH, posAt, SPACE, spaceAlpha, TRACKS } from "./pitchModel";

/** 2D top-down fallback for mobile / low-end / reduced motion. Same model as the 3D scene. */
export default function PitchSVG({ t }: { t: number }) {
  const hw = PITCH.w / 2,
    hh = PITCH.h / 2;
  const X = (x: number) => x + hw + 0.3;
  const Y = (y: number) => hh - y + 0.3;
  const [bx, by] = ballAt(t);
  return (
    <svg viewBox={`0 0 ${PITCH.w + 0.6} ${PITCH.h + 0.6}`} className="h-full w-full" role="img" aria-label="Tactics board: the winger drags the full-back wide, opening a lane for a through-ball to the striker">
      <rect x="0" y="0" width={PITCH.w + 0.6} height={PITCH.h + 0.6} rx="0.2" fill="var(--pitch)" />
      <g fill="none" stroke="var(--fg)" strokeOpacity="0.3" strokeWidth="0.03">
        <rect x={X(-hw)} y={Y(hh)} width={PITCH.w} height={PITCH.h} />
        <line x1={X(0)} y1={Y(hh)} x2={X(0)} y2={Y(-hh)} />
        <circle cx={X(0)} cy={Y(0)} r="0.915" />
        <rect x={X(hw - 1.65)} y={Y(2.02)} width="1.65" height="4.04" />
        <rect x={X(-hw)} y={Y(2.02)} width="1.65" height="4.04" />
      </g>
      <circle cx={X(SPACE.x)} cy={Y(SPACE.y)} r={SPACE.r} fill="var(--accent)" opacity={spaceAlpha(t) * 0.22} />
      {LANES.map((l) => {
        const { a, b, draw } = laneEnds(l, t);
        if (draw <= 0) return null;
        return (
          <line
            key={l.id}
            x1={X(a[0])}
            y1={Y(a[1])}
            x2={X(a[0] + (b[0] - a[0]) * draw)}
            y2={Y(a[1] + (b[1] - a[1]) * draw)}
            stroke={l.key ? "var(--accent)" : "var(--fg)"}
            strokeOpacity={l.key ? 1 : 0.5}
            strokeWidth={l.key ? 0.07 : 0.035}
            strokeDasharray={l.key ? undefined : "0.12 0.08"}
            strokeLinecap="round"
          />
        );
      })}
      {TRACKS.map((tr) => {
        const [x, y] = posAt(tr, t);
        const att = tr.team === "att";
        return (
          <g key={tr.id} transform={`translate(${X(x)} ${Y(y)})`}>
            <circle r="0.17" fill={att ? "var(--accent)" : "var(--bg)"} stroke={att ? "none" : "var(--fg)"} strokeWidth="0.03" />
            <text y="0.06" textAnchor="middle" fontSize="0.15" fontFamily="var(--font-mono)" fill={att ? "var(--accent-ink)" : "var(--fg)"}>
              {tr.label}
            </text>
          </g>
        );
      })}
      <circle cx={X(bx)} cy={Y(by)} r="0.07" fill="var(--fg)" />
    </svg>
  );
}
