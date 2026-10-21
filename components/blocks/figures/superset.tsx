// ── figure: superset · a greedy walk on the Camelot wheel ─────────────────────
// SetlistOptimizer (superset@f3c76b0, src/superset/analysis/setlist.py) run at
// build on ten drawn tracks: the "steady_climb" flow starts at the lowest
// tempo, and each step compares the cost to every track left and takes the
// cheapest (_greedy_order). The cost is the real formula for the terms these
// tracks differ in, with the default weights normalized over all six: tempo
// |Δbpm|/240, energy max(0, a−b) + 0.3|Δ|, key = Camelot clock distance
// + 1 for a mode change, over 6. Mood, spectral and position are equal for
// every track here, so they add the same to each cost and change nothing.
// The tracks are invented; the walk is what the code does with them.

const W = 720;
const H = 330;
const LOOP = 10.5;
const pct = (t: number) => `${((t / LOOP) * 100).toFixed(2)}%`;

type Track = { key: string; bpm: number; energy: number };
const TRACKS: Track[] = [
  { key: "8A", bpm: 122, energy: 0.3 },
  { key: "7A", bpm: 123, energy: 0.38 },
  { key: "4B", bpm: 125, energy: 0.42 },
  { key: "8B", bpm: 124, energy: 0.46 },
  { key: "9A", bpm: 124, energy: 0.52 },
  { key: "3A", bpm: 126, energy: 0.6 },
  { key: "9B", bpm: 125, energy: 0.6 },
  { key: "10A", bpm: 126, energy: 0.68 },
  { key: "10B", bpm: 127, energy: 0.8 },
  { key: "11A", bpm: 128, energy: 0.88 },
];

const RAW = { tempo: 0.3, energy: 0.25, key: 0.15, mood: 0.15, spectral: 0.1, position: 0.05 };
const SUM = Object.values(RAW).reduce((a, b) => a + b, 0);
const Wt = { tempo: RAW.tempo / SUM, energy: RAW.energy / SUM, key: RAW.key / SUM };

const cam = (k: string) => ({ n: Number(k.slice(0, -1)), m: k.slice(-1) });
function keyCost(a: string, b: string) {
  const A = cam(a), B = cam(b);
  let clock = Math.abs(A.n - B.n);
  clock = Math.min(clock, 12 - clock);
  return Math.min(1, (clock + (A.m === B.m ? 0 : 1)) / 6);
}
function cost(a: Track, b: Track) {
  const tempo = Math.min(1, Math.abs(a.bpm - b.bpm) / 240);
  const d = Math.abs(a.energy - b.energy);
  const energy = Math.min(1, Math.max(0, a.energy - b.energy) + 0.3 * d);
  return Wt.tempo * tempo + Wt.energy * energy + Wt.key * keyCost(a.key, b.key);
}

// _greedy_order, from the lowest tempo (steady_climb)
const ORDER: number[] = (() => {
  const start = TRACKS.reduce((best, t, i) => (t.bpm < TRACKS[best].bpm ? i : best), 0);
  const out = [start];
  const left = new Set(TRACKS.keys());
  left.delete(start);
  while (left.size) {
    const cur = out[out.length - 1];
    let next = -1;
    for (const j of left) if (next < 0 || cost(TRACKS[cur], TRACKS[j]) < cost(TRACKS[cur], TRACKS[next])) next = j;
    out.push(next);
    left.delete(next);
  }
  return out;
})();

// the wheel: 12 at the top, like the clock the code measures on
const CX = 168;
const CY = 168;
const RB = 112; // B (major), outer
const RA = 74; // A (minor), inner
const pos = (k: string) => {
  const { n, m } = cam(k);
  const a = ((n * 30 - 90) * Math.PI) / 180;
  const r = m === "B" ? RB : RA;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

// the set, as energy bars
const BX0 = 392;
const BW = 26;
const BG = 4;
const BY = 262;
const BH = 150;

const STEP = 0.85;
const T0 = 0.6;
const stepT = (k: number) => T0 + k * STEP;

function css() {
  const rules: string[] = [];
  ORDER.slice(0, -1).forEach((_, k) => {
    const t = stepT(k);
    rules.push(`@keyframes ss-cand-${k} { 0%, ${pct(t)} { opacity: 0; } ${pct(t + 0.08)} { opacity: 1; } ${pct(t + 0.4)}, 100% { opacity: 0; } }`);
    rules.push(`@keyframes ss-edge-${k} { 0%, ${pct(t + 0.3)} { stroke-dashoffset: 1; } ${pct(t + 0.62)}, ${pct(LOOP - 0.5)} { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }`);
    rules.push(`.fig-superset[data-play] .ss-cand-${k} { animation: ss-cand-${k} ${LOOP}s linear infinite; }`);
    rules.push(`.fig-superset[data-play] .ss-edge-${k} { animation: ss-edge-${k} ${LOOP}s ease-out infinite; }`);
  });
  ORDER.forEach((_, k) => {
    const t = k === 0 ? 0.3 : stepT(k - 1) + 0.6;
    rules.push(`@keyframes ss-bar-${k} { 0%, ${pct(t)} { transform: scaleY(0); opacity: 0; } ${pct(t + 0.3)}, ${pct(LOOP - 0.5)} { transform: none; opacity: 1; } 100% { transform: none; opacity: 0; } }`);
    rules.push(`.fig-superset[data-play] .ss-bar-${k} { animation: ss-bar-${k} ${LOOP}s cubic-bezier(0.2, 0.8, 0.2, 1) infinite; }`);
    rules.push(`@keyframes ss-dot-${k} { 0%, ${pct(t - 0.05)} { fill: oklch(0.13 0 0); } ${pct(t)} { fill: var(--pearl-sky); } ${pct(t + 0.6)}, ${pct(LOOP - 0.5)} { fill: oklch(0.95 0 0); } 100% { fill: oklch(0.13 0 0); } }`);
    rules.push(`.fig-superset[data-play] .ss-dot-${k} { animation: ss-dot-${k} ${LOOP}s linear infinite; }`);
  });
  rules.push(`@keyframes ss-curve { 0%, ${pct(stepT(0) + 0.6)} { stroke-dashoffset: 1; } ${ORDER.slice(1).map((_, k) => `${pct(stepT(k) + 0.9)} { stroke-dashoffset: ${(1 - (k + 1) / (ORDER.length - 1)).toFixed(3)}; }`).join(" ")} ${pct(LOOP - 0.5)} { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }`);
  rules.push(`.fig-superset[data-play] .ss-curve { animation: ss-curve ${LOOP}s linear infinite; }`);
  return rules.join("\n");
}
const CSS = css();

/** where each track sits in the set */
const AT = new Map(ORDER.map((t, k) => [t, k]));

export default function SupersetFigure() {
  const curve = ORDER.map((t, k) => `${BX0 + k * (BW + BG) + BW / 2},${BY - TRACKS[t].energy * BH}`).join(" ");
  return (
    <>
      <style>{CSS}</style>
      <svg className="fig-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {/* the wheel */}
        <circle cx={CX} cy={CY} r={RB} fill="none" stroke="oklch(1 0 0 / 0.14)" />
        <circle cx={CX} cy={CY} r={RA} fill="none" stroke="oklch(1 0 0 / 0.14)" />
        {[...Array(12).keys()].map((i) => {
          const n = i + 1;
          const a = ((n * 30 - 90) * Math.PI) / 180;
          const [ox, oy] = [Math.cos(a), Math.sin(a)];
          return (
            <g key={n} fontSize="9.5" fill="oklch(1 0 0 / 0.62)" textAnchor="middle">
              <line x1={CX + ox * 40} y1={CY + oy * 40} x2={CX + ox * (RB + 10)} y2={CY + oy * (RB + 10)} stroke="oklch(1 0 0 / 0.06)" />
              <text x={CX + ox * (RB + 22)} y={CY + oy * (RB + 22) + 3.5}>{n}B</text>
              <text x={CX + ox * (RA - 20)} y={CY + oy * (RA - 20) + 3.5}>{n}A</text>
            </g>
          );
        })}
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="10" fill="oklch(1 0 0 / 0.62)">Camelot</text>

        {/* each step: the costs to every track left flash, then the cheapest draws */}
        {ORDER.slice(0, -1).map((cur, k) => {
          const [x1, y1] = pos(TRACKS[cur].key);
          return (
            <g key={`c${k}`} className={`ss-cand ss-cand-${k}`} opacity="0">
              {ORDER.slice(k + 1).map((j) => {
                const [x2, y2] = pos(TRACKS[j].key);
                return <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(1 0 0 / 0.22)" strokeDasharray="2 3" />;
              })}
            </g>
          );
        })}
        {ORDER.slice(0, -1).map((cur, k) => {
          const [x1, y1] = pos(TRACKS[cur].key);
          const [x2, y2] = pos(TRACKS[ORDER[k + 1]].key);
          return <line key={`e${k}`} className={`ss-edge ss-edge-${k}`} pathLength={1} strokeDasharray="1 1" x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(1 0 0 / 0.85)" strokeWidth="1.4" />;
        })}
        {TRACKS.map((t, i) => {
          const [x, y] = pos(t.key);
          const k = AT.get(i)!;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="9" fill="oklch(0.13 0 0)" stroke="oklch(1 0 0 / 0.6)" />
              <circle className={`ss-dot ss-dot-${k}`} cx={x} cy={y} r="4.5" fill="oklch(0.95 0 0)" />
            </g>
          );
        })}

        {/* the set */}
        <text x={BX0} y={54} fontSize="11" fill="oklch(1 0 0 / 0.7)">the set, in walk order · energy</text>
        <text x={BX0} y={70} fontSize="10" fill="oklch(1 0 0 / 0.62)">start: the lowest tempo</text>
        <text x={BX0} y={84} fontSize="10" fill="oklch(1 0 0 / 0.62)">each step: the cheapest next track</text>
        <line x1={BX0 - 6} y1={BY} x2={BX0 + ORDER.length * (BW + BG)} y2={BY} stroke="oklch(1 0 0 / 0.3)" />
        {ORDER.map((t, k) => {
          const x = BX0 + k * (BW + BG);
          const h = TRACKS[t].energy * BH;
          return (
            <g key={k} fontSize="9.5" textAnchor="middle">
              <rect className={`ss-bar ss-bar-${k}`} style={{ transformBox: "fill-box", transformOrigin: "bottom" }} x={x} y={BY - h} width={BW} height={h} fill={k === 0 ? "oklch(0.86 0.09 205 / 0.35)" : "oklch(1 0 0 / 0.16)"} stroke="oklch(1 0 0 / 0.45)" />
              <text x={x + BW / 2} y={BY + 14} fill="oklch(1 0 0 / 0.75)">{TRACKS[t].key}</text>
              <text x={x + BW / 2} y={BY + 27} fill="oklch(1 0 0 / 0.62)">{TRACKS[t].bpm}</text>
            </g>
          );
        })}
        <polyline className="ss-curve" pathLength={1} strokeDasharray="1 1" points={curve} fill="none" stroke="var(--pearl-orchid)" strokeWidth="1.3" />
        <text x={BX0 - 6} y={BY + 14} textAnchor="end" fontSize="9.5" fill="oklch(1 0 0 / 0.62)">key</text>
        <text x={BX0 - 6} y={BY + 27} textAnchor="end" fontSize="9.5" fill="oklch(1 0 0 / 0.62)">bpm</text>
      </svg>
    </>
  );
}
