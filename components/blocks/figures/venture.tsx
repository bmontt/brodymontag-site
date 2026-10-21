// ── figure: venture · the clock and the gates ─────────────────────────────────
// One day in 12 s. The dial is launchd's schedule (com.venture.cycle.plist:
// 00:15, 06:15, 12:15, 18:15; com.venture.tick.plist: every 900 s, 96 ticks
// a day). Each cycle sends one move through the allocator's order
// (venture/allocator.py): gas for the wallet goes on its own (housekeeping,
// capped by allocation.gas_buy_max_usd, $10); a move to Kalshi or to the
// wallet and Aave waits at the approval gate (the default "propose" mode: a
// keypress in the TUI or a tap in Telegram). The last slot shows the weekly
// review (venture/agent.py): its change to the crypto paper strategy goes
// through; a change anywhere else is dropped by code. The 11 locks are the
// LOCKED limits (venture/config.py). No amounts: the moves carry none.

const W = 720;
const H = 340;
const LOOP = 12;
const CX = 138;
const CY = 176;
const R = 100;
const SLOTS = [0.25, 6.25, 12.25, 18.25]; // hours
const slotT = (h: number) => (h / 24) * LOOP;
const ang = (h: number) => (h / 24) * 360 - 90; // 00:00 at the top
const pt = (h: number, r: number) => [CX + r * Math.cos((ang(h) * Math.PI) / 180), CY + r * Math.sin((ang(h) * Math.PI) / 180)];
const pct = (t: number) => `${((t / LOOP) * 100).toFixed(2)}%`;

// the money path
const COIN = { x: 300, y: 161, w: 96, h: 30 };
const ALLOC = { x: 430, y: 161, w: 96, h: 30 };
const GAS = { x: 604, y: 62, w: 104, h: 30 };
const GATE = { x: 566, y: 236 };
const KALSHI = { x: 610, y: 196, w: 92, h: 28 };
const AAVE = { x: 610, y: 260, w: 100, h: 28 };
const REVIEW = { x: 430, y: 302, w: 112, h: 28 };
const PAPER = { x: 604, y: 302, w: 104, h: 28 };
const mid = (b: { x: number; y: number; w: number; h: number }) => [b.x + b.w / 2, b.y + b.h / 2];

type P = [number, number];
const A_OUT: P = [ALLOC.x + ALLOC.w, ALLOC.y + ALLOC.h / 2];
const C_OUT: P = [COIN.x + COIN.w, COIN.y + COIN.h / 2];
const GAS_IN: P = [GAS.x, GAS.y + GAS.h / 2];
const GATE_IN: P = [GATE.x - 15, GATE.y];
const GATE_OUT: P = [GATE.x + 15, GATE.y];
const K_IN: P = [KALSHI.x, KALSHI.y + KALSHI.h / 2];
const AV_IN: P = [AAVE.x, AAVE.y + AAVE.h / 2];

/** a token's keyframes: hidden, then through the stops at their times, then gone */
function token(name: string, stops: [number, P][]) {
  const [t0] = stops[0];
  const [tn, pn] = stops[stops.length - 1];
  const at = (t: number, [x, y]: P, o = 1) => `${pct(t)} { transform: translate(${x.toFixed(1)}px, ${y.toFixed(1)}px); opacity: ${o}; }`;
  return `@keyframes ${name} { 0% { transform: translate(${stops[0][1][0]}px, ${stops[0][1][1]}px); opacity: 0; } ${pct(Math.max(0, t0 - 0.01))} { opacity: 0; } ${stops.map(([t, p]) => at(t, p)).join(" ")} ${at(tn + 0.25, pn, 0)} 100% { transform: translate(${pn[0]}px, ${pn[1]}px); opacity: 0; } }`;
}

const [s1, s2, s3, s4] = SLOTS.map(slotT);
const CSS = `
.fig-venture[data-play] .vt-hand { animation: vt-hand ${LOOP}s linear infinite; }
.fig-venture[data-play] .vt-slot { animation: vt-slot ${LOOP}s ease-out infinite; animation-delay: calc(var(--t) * 1s - ${LOOP}s); }
.fig-venture[data-play] .vt-tok-gas { animation: vt-tok-gas ${LOOP}s linear infinite; }
.fig-venture[data-play] .vt-tok-k { animation: vt-tok-k ${LOOP}s linear infinite; }
.fig-venture[data-play] .vt-tok-a { animation: vt-tok-a ${LOOP}s linear infinite; }
.fig-venture[data-play] .vt-gate { animation: vt-gate ${LOOP}s linear infinite; }
.fig-venture[data-play] .vt-tap { animation: vt-tap ${LOOP}s linear infinite; }
.fig-venture[data-play] .vt-auto { animation: vt-auto ${LOOP}s linear infinite; }
.fig-venture[data-play] .vt-review { animation: vt-review ${LOOP}s linear infinite; }
.fig-venture[data-play] .vt-ok { animation: vt-ok ${LOOP}s linear infinite; }
.fig-venture[data-play] .vt-no { animation: vt-no ${LOOP}s linear infinite; }
@keyframes vt-hand { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes vt-slot { 0% { opacity: 0.9; transform: scale(0.6); } 14% { opacity: 0; transform: scale(2.4); } 100% { opacity: 0; transform: scale(2.4); } }
${token("vt-tok-gas", [[s1, C_OUT], [s1 + 0.4, A_OUT], [s1 + 0.9, GAS_IN]])}
${token("vt-tok-k", [[s2, C_OUT], [s2 + 0.4, A_OUT], [s2 + 0.8, GATE_IN], [s2 + 1.8, GATE_IN], [s2 + 1.95, GATE_OUT], [s2 + 2.3, K_IN]])}
${token("vt-tok-a", [[s3, C_OUT], [s3 + 0.4, A_OUT], [s3 + 0.8, GATE_IN], [s3 + 1.8, GATE_IN], [s3 + 1.95, GATE_OUT], [s3 + 2.3, AV_IN]])}
@keyframes vt-gate {
  0%, ${pct(s2 + 0.8)} { stroke: oklch(1 0 0 / 0.55); }
  ${pct(s2 + 0.85)}, ${pct(s2 + 1.75)} { stroke: oklch(1 0 0 / 0.95); }
  ${pct(s2 + 1.8)} { stroke: var(--pearl-sky); }
  ${pct(s2 + 2.2)}, ${pct(s3 + 0.8)} { stroke: oklch(1 0 0 / 0.55); }
  ${pct(s3 + 0.85)}, ${pct(s3 + 1.75)} { stroke: oklch(1 0 0 / 0.95); }
  ${pct(s3 + 1.8)} { stroke: var(--pearl-sky); }
  ${pct(s3 + 2.2)}, 100% { stroke: oklch(1 0 0 / 0.55); }
}
@keyframes vt-tap {
  0%, ${pct(s2 + 1.6)} { opacity: 0; } ${pct(s2 + 1.75)}, ${pct(s2 + 2.4)} { opacity: 1; } ${pct(s2 + 2.6)}, ${pct(s3 + 1.6)} { opacity: 0; }
  ${pct(s3 + 1.75)}, ${pct(s3 + 2.4)} { opacity: 1; } ${pct(s3 + 2.6)}, 100% { opacity: 0; }
}
@keyframes vt-auto { 0%, ${pct(s1 + 0.4)} { opacity: 0.55; } ${pct(s1 + 0.5)}, ${pct(s1 + 1.2)} { opacity: 1; fill: var(--pearl-sky); } ${pct(s1 + 1.6)}, 100% { opacity: 0.55; } }
@keyframes vt-review { 0%, ${pct(s4)} { stroke: oklch(1 0 0 / 0.4); } ${pct(s4 + 0.1)}, ${pct(s4 + 1.6)} { stroke: var(--pearl-orchid); } ${pct(s4 + 2)}, 100% { stroke: oklch(1 0 0 / 0.4); } }
@keyframes vt-ok { 0%, ${pct(s4 + 0.3)} { opacity: 0.25; stroke-dashoffset: 1; } ${pct(s4 + 0.8)} { opacity: 1; stroke-dashoffset: 0; } ${pct(s4 + 2.2)} { opacity: 1; } ${pct(LOOP - 0.2)}, 100% { opacity: 0.6; stroke-dashoffset: 0; } }
@keyframes vt-no { 0%, ${pct(s4 + 0.9)} { opacity: 0.25; } ${pct(s4 + 1.1)} { opacity: 1; } ${pct(s4 + 1.25)} { opacity: 0.4; } ${pct(s4 + 1.4)}, ${pct(s4 + 2.4)} { opacity: 1; } ${pct(LOOP - 0.2)}, 100% { opacity: 0.6; } }
`;

function Box({ b, label, className }: { b: { x: number; y: number; w: number; h: number }; label: string; className?: string }) {
  const [x, y] = mid(b);
  return (
    <g>
      <rect className={className} x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill="oklch(0.16 0 0)" stroke="oklch(1 0 0 / 0.4)" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="11.5" fill="oklch(1 0 0 / 0.88)">{label}</text>
    </g>
  );
}

const line = (a: P, b: P, extra?: Record<string, string | number>) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="oklch(1 0 0 / 0.38)" {...extra} />;

export default function VentureFigure() {
  return (
    <>
      <style>{CSS}</style>
      <svg className="fig-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {/* ── the day ─────────────────────────────────────────────── */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="oklch(1 0 0 / 0.16)" />
        {[...Array(96).keys()].map((i) => {
          const h = i / 4;
          const [x1, y1] = pt(h, R - 5);
          const [x2, y2] = pt(h, R);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(1 0 0 / 0.28)" />;
        })}
        {SLOTS.map((h) => {
          const [x1, y1] = pt(h, R - 14);
          const [x2, y2] = pt(h, R + 3);
          const [lx, ly] = pt(h, R + 19);
          const [px, py] = pt(h, R);
          return (
            <g key={h}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(1 0 0 / 0.9)" strokeWidth="1.6" />
              <circle className="vt-slot" style={{ ["--t" as string]: slotT(h), transformBox: "fill-box", transformOrigin: "center" }} cx={px} cy={py} r="7" fill="none" stroke="var(--pearl-sky)" opacity="0" />
              <text x={lx} y={ly + 4} textAnchor="middle" fontSize="11" fill="oklch(1 0 0 / 0.7)">{`${String(Math.floor(h)).padStart(2, "0")}:15`}</text>
            </g>
          );
        })}
        <g transform={`translate(${CX} ${CY})`}>
          <g className="vt-hand" style={{ transformOrigin: "0 0", transform: "rotate(110deg)" }}>
            {/* the ticks it has just passed: a trail that turns with the hand
                (one rotating group, so the dial costs one transform per frame) */}
            {[...Array(8).keys()].map((k) => {
              const a = (-(k + 1) * 3.75 * Math.PI) / 180 - Math.PI / 2;
              return <line key={k} x1={(R - 5) * Math.cos(a)} y1={(R - 5) * Math.sin(a)} x2={R * Math.cos(a)} y2={R * Math.sin(a)} stroke={`oklch(1 0 0 / ${(0.9 - k * 0.1).toFixed(2)})`} strokeWidth="1.2" />;
            })}
            <line x1="0" y1="8" x2="0" y2={-(R - 18)} stroke="oklch(1 0 0 / 0.9)" strokeWidth="1.3" />
          </g>
          <circle r="3" fill="oklch(1 0 0)" />
        </g>
        <g stroke="oklch(0.13 0 0)" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">
          <text x={CX} y={CY + 32} textAnchor="middle" fontSize="11" fill="oklch(1 0 0 / 0.8)">4 cycles a day</text>
          <text x={CX} y={CY + 48} textAnchor="middle" fontSize="10.5" fill="oklch(1 0 0 / 0.62)">a tick every 15 min</text>
        </g>

        {/* ── the money path ─────────────────────────────────────── */}
        <text x={COIN.x} y={COIN.y - 8} fontSize="10.5" fill="oklch(1 0 0 / 0.62)">the main way in</text>
        {line(C_OUT, [ALLOC.x, ALLOC.y + ALLOC.h / 2])}
        {line(A_OUT, GAS_IN)}
        {line(A_OUT, GATE_IN)}
        {line(GATE_OUT, K_IN)}
        {line(GATE_OUT, AV_IN)}
        <text className="vt-auto" x={(A_OUT[0] + GAS_IN[0]) / 2 + 8} y={(A_OUT[1] + GAS_IN[1]) / 2 + 2} fontSize="10.5" fill="oklch(1 0 0 / 0.75)">auto · ≤ $10</text>
        <Box b={COIN} label="Coinbase" />
        <Box b={ALLOC} label="allocator" />
        <Box b={GAS} label="wallet gas" />
        <Box b={KALSHI} label="Kalshi" />
        <Box b={AAVE} label="wallet · Aave" />
        <polygon className="vt-gate" points={`${GATE.x},${GATE.y - 15} ${GATE.x + 15},${GATE.y} ${GATE.x},${GATE.y + 15} ${GATE.x - 15},${GATE.y}`} fill="oklch(0.16 0 0)" stroke="oklch(1 0 0 / 0.55)" strokeWidth="1.2" />
        <text x={GATE.x - 22} y={GATE.y + 4} textAnchor="end" fontSize="10.5" fill="oklch(1 0 0 / 0.6)">waits for you</text>
        <text className="vt-tap" x={GATE.x} y={GATE.y + 30} textAnchor="middle" fontSize="11" fill="var(--pearl-sky)" opacity="0">✓ tap</text>

        {/* the 11 LOCKED limits */}
        <text x={ALLOC.x} y={ALLOC.y - 26} fontSize="10.5" fill="oklch(1 0 0 / 0.62)">11 locked limits</text>
        {[...Array(11).keys()].map((i) => (
          <g key={i} transform={`translate(${ALLOC.x + 3 + i * 8.4} ${ALLOC.y - 16})`}>
            <path d="M1.2 0 V-2.2 a1.8 1.8 0 0 1 3.6 0 V0" fill="none" stroke="oklch(1 0 0 / 0.55)" strokeWidth="0.9" />
            <rect x="0" y="0" width="6" height="5" rx="0.8" fill="oklch(1 0 0 / 0.55)" />
          </g>
        ))}

        {/* the weekly review */}
        <Box b={REVIEW} label="Claude · weekly" className="vt-review" />
        <Box b={PAPER} label="crypto paper" />
        <line className="vt-ok" pathLength={1} strokeDasharray="1 1" x1={REVIEW.x + REVIEW.w} y1={REVIEW.y + REVIEW.h / 2} x2={PAPER.x} y2={PAPER.y + PAPER.h / 2} stroke="oklch(1 0 0 / 0.75)" />
        <text className="vt-ok" x={(REVIEW.x + REVIEW.w + PAPER.x) / 2} y={REVIEW.y + 6} textAnchor="middle" fontSize="11" fill="var(--pearl-orchid)">✓</text>
        <line x1={ALLOC.x + 14} y1={REVIEW.y} x2={ALLOC.x + 14} y2={ALLOC.y + ALLOC.h} stroke="oklch(1 0 0 / 0.3)" strokeDasharray="3 3" />
        <g className="vt-no">
          <text x={ALLOC.x + 14} y={(REVIEW.y + ALLOC.y + ALLOC.h) / 2 + 4} textAnchor="middle" fontSize="13" fill="oklch(1 0 0 / 0.9)" stroke="oklch(0.13 0 0)" strokeWidth="5" paintOrder="stroke">×</text>
          <text x={ALLOC.x + 2} y={(REVIEW.y + ALLOC.y + ALLOC.h) / 2 + 4} textAnchor="end" fontSize="10" fill="oklch(1 0 0 / 0.6)">change elsewhere: dropped by code</text>
        </g>

        {/* the moves */}
        {["gas", "k", "a"].map((k) => (
          <g key={k} className={`vt-tok vt-tok-${k}`} opacity="0">
            <circle r="7" fill="oklch(1 0 0 / 0.12)" />
            <circle r="3.6" fill="oklch(1 0 0)" />
          </g>
        ))}
      </svg>
    </>
  );
}
