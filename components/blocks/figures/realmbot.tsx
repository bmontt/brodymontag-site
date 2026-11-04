// ── figure: realmbot · a tick, and who owns it ────────────────────────────────
// Six seconds of the bot, moving past like a strip chart (the right edge is
// now). Server ticks come about every 200 ms (the M1 soak: 17,997 NEWTICK in
// 3,600 s) and a PING every 3 s (1,200 in the same hour); deterministic code
// answers each one. About once a second the decision loop asks the model for
// a mode (ADR-0002); the arbiter (rb_brain/arbiter.py) takes it, or falls
// back to the heuristic on low confidence (below the mode spec's 0.55) or a
// timeout (ADR-0006), and a tripped safety check sends the bot to the Nexus
// whatever the model says. The answers and their confidences are invented;
// the rules that judge them are the code's.

import { minCss, r2 } from "./svg";

const W = 720;
const H = 300;
const LOOP = 6; // s, one copy of the pattern
const X0 = 150;
const NOW = 662;
const PX = (NOW - X0) / LOOP;
const x = (t: number) => X0 + t * PX;

const LANES = { server: 62, reply: 104, model: 160, mode: 226 };
const TICKS = [...Array(30).keys()].map((i) => i * 0.2 + 0.05);
const PINGS = [0.95, 3.95];

type Ask = { at: number; back?: number; mode?: string; p?: number; outcome: "model" | "low" | "timeout" };
const ASKS: Ask[] = [
  { at: 0.12, back: 0.32, mode: "engage", p: 0.82, outcome: "model" },
  { at: 1.12, back: 1.42, mode: "kite", p: 0.74, outcome: "model" },
  { at: 2.12, back: 2.27, mode: "loot", p: 0.41, outcome: "low" },
  { at: 3.12, outcome: "timeout" },
  { at: 4.12, back: 4.27, mode: "travel", p: 0.9, outcome: "model" },
];
const TIMEOUT_AT = 3.62;
const SAFETY_AT = 5.2;

type Seg = { from: number; to: number; mode: string; by: "model" | "heuristic" | "safety" };
const SEGS: Seg[] = [
  { from: 0.32, to: 1.42, mode: "engage", by: "model" },
  { from: 1.42, to: 2.27, mode: "kite", by: "model" },
  { from: 2.27, to: TIMEOUT_AT, mode: "kite", by: "heuristic" },
  { from: TIMEOUT_AT, to: 4.27, mode: "travel", by: "heuristic" },
  { from: 4.27, to: SAFETY_AT, mode: "travel", by: "model" },
  { from: SAFETY_AT, to: LOOP + 0.32, mode: "nexus", by: "safety" },
];

const CSS = minCss(`
.fig-realmbot[data-play] .rb-belt { animation: rb-belt ${LOOP}s linear infinite; }
@keyframes rb-belt { from { transform: translateX(0); } to { transform: translateX(${-(NOW - X0)}px); } }
.fig-realmbot[data-play] .rb-now { animation: rb-now 0.2s steps(1) infinite; }
@keyframes rb-now { 0% { opacity: 1; } 50% { opacity: 0.55; } }
`);

/** one copy of the pattern; the belt draws a second with <use> */
function Pattern() {
  return (
    <g id="rb-pattern">
      {/* server: NEWTICK every tick, PING every 3 s; the replies under them */}
      {TICKS.map((t) => (
        <use key={t} href="#rb-tick" x={r2(x(t))} />
      ))}
      {PINGS.map((t) => (
        <g key={t} fontSize="9.5">
          <text x={r2(x(t) + 4)} y={LANES.server - 12} fill="oklch(1 0 0 / 0.7)">PING</text>
          <text x={r2(x(t + 0.03) + 5)} y={LANES.reply + 16} fill="oklch(1 0 0 / 0.7)">PONG</text>
        </g>
      ))}
      {/* the model, about once a second */}
      {ASKS.map((a) => {
        const end = a.back ?? TIMEOUT_AT;
        return (
          <g key={a.at} fontSize="10">
            <circle cx={r2(x(a.at))} cy={LANES.model} r="3" fill="none" stroke="oklch(1 0 0 / 0.7)" />
            <line x1={r2(x(a.at) + 3)} y1={LANES.model} x2={r2(x(end))} y2={LANES.model} stroke="oklch(1 0 0 / 0.35)" strokeDasharray={a.outcome === "timeout" ? "2 3" : undefined} />
            {a.outcome === "timeout" ? (
              <text x={r2(x(end))} y={LANES.model + 4} textAnchor="middle" fill="oklch(1 0 0 / 0.85)">×</text>
            ) : (
              <circle cx={r2(x(end))} cy={LANES.model} r="3.2" fill={a.outcome === "low" ? "var(--pearl-sky)" : "oklch(1 0 0)"} />
            )}
            <text x={r2(x(end) + 5)} y={LANES.model - 9} fill={a.outcome === "model" ? "oklch(1 0 0 / 0.85)" : "var(--pearl-sky)"}>
              {a.outcome === "timeout" ? "timeout" : `${a.mode} ${a.p!.toFixed(2)}`}
            </text>
            {a.outcome === "low" && (
              <text x={r2(x(end) + 5)} y={LANES.model + 15} fill="oklch(1 0 0 / 0.62)">
                {"< 0.55"}
              </text>
            )}
          </g>
        );
      })}
      {/* the arbiter's mode */}
      {SEGS.map((s) => (
        <g key={s.from}>
          <rect
            x={r2(x(s.from) + 1)}
            y={LANES.mode - 13}
            width={r2(x(s.to) - x(s.from) - 2)}
            height="26"
            rx="3"
            fill={s.by === "safety" ? "oklch(0.84 0.1 315 / 0.16)" : "oklch(1 0 0 / 0.05)"}
            stroke={s.by === "safety" ? "var(--pearl-orchid)" : s.by === "heuristic" ? "oklch(1 0 0 / 0.35)" : "oklch(1 0 0 / 0.6)"}
            strokeDasharray={s.by === "heuristic" ? "3 3" : undefined}
          />
          <text x={r2(x(s.from) + 7)} y={LANES.mode + 1} fontSize="11" fill="oklch(1 0 0 / 0.92)">{s.mode}</text>
          <text x={r2(x(s.from) + 7)} y={LANES.mode + 11} fontSize="9.5" fill={s.by === "safety" ? "var(--pearl-orchid)" : "oklch(1 0 0 / 0.5)"}>{s.by}</text>
        </g>
      ))}
      <g fontSize="10">
        <line x1={r2(x(SAFETY_AT))} y1={LANES.reply + 22} x2={r2(x(SAFETY_AT))} y2={LANES.mode - 15} stroke="var(--pearl-orchid)" strokeDasharray="2 2" />
        <text x={r2(x(SAFETY_AT) + 5)} y={LANES.model + 30} fill="var(--pearl-orchid)">HP low: safety wins</text>
      </g>
    </g>
  );
}

export default function RealmbotFigure() {
  return (
    <>
      <style>{CSS}</style>
      <svg className="fig-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          {/* one tick at t = 0: the server's mark, the line down, the reply */}
          <g id="rb-tick">
            <line x1="0" y1={LANES.server - 9} x2="0" y2={LANES.server + 9} stroke="oklch(1 0 0 / 0.55)" />
            <line x1="0" y1={LANES.server + 12} x2={r2(0.03 * PX)} y2={LANES.reply - 7} stroke="oklch(1 0 0 / 0.12)" />
            <rect x={r2(0.03 * PX - 2.5)} y={LANES.reply - 2.5} width="5" height="5" fill="oklch(1 0 0 / 0.8)" />
          </g>
          <clipPath id="rb-window">
            <rect x={X0 - 6} y="0" width={NOW - X0 + 6} height={H} />
          </clipPath>
          <linearGradient id="rb-fade" x1="0" x2="1">
            <stop offset="0" stopColor="oklch(0.13 0 0)" stopOpacity="1" />
            <stop offset="1" stopColor="oklch(0.13 0 0)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fontSize="11" fill="oklch(1 0 0 / 0.7)">
          <text x="20" y={LANES.server + 4}>server ticks</text>
          <text x="20" y={LANES.reply + 4}>replies · code</text>
          <text x="20" y={LANES.model + 4}>model · ~1 Hz</text>
          <text x="20" y={LANES.mode + 4}>mode · arbiter</text>
        </g>
        {[LANES.server, LANES.reply, LANES.model, LANES.mode].map((y) => (
          <line key={y} x1={X0 - 6} y1={y} x2={NOW} y2={y} stroke="oklch(1 0 0 / 0.06)" />
        ))}
        <g clipPath="url(#rb-window)">
          <g className="rb-belt">
            <Pattern />
            <use href="#rb-pattern" x={NOW - X0} />
          </g>
          <rect x={X0 - 6} y="0" width="34" height={H} fill="url(#rb-fade)" />
        </g>
        <line className="rb-now" x1={NOW} y1={LANES.server - 22} x2={NOW} y2={LANES.mode + 18} stroke="oklch(1 0 0 / 0.9)" />
        <text x={NOW} y={LANES.server - 28} textAnchor="middle" fontSize="10" fill="oklch(1 0 0 / 0.7)">now</text>
        <text x={NOW} y={H - 14} textAnchor="end" fontSize="10" fill="oklch(1 0 0 / 0.62)">soak · 60 min · 17,997 ticks answered · 0 disconnects</text>
      </svg>
    </>
  );
}
