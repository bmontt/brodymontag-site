// ── figure: Peak_Finding_Toolbox · the picks for waves I to V ─────────────────
// _detect_peaks_abr (Peak_Finding_Toolbox@f82d762, toolbox/peak_finder.py) on
// a drawn trace: five bumps at textbook latencies plus noise, smoothed with a
// Gaussian, then peaks before 9.6 ms (ABR_WAVE_V_WINDOW), then I–III–V
// triplets tried in the code's own order (itertools.combinations) against its
// windows (IP_I_III 1.80–2.30, IP_III_V 1.40–2.30, IP_I_V 3.76–4.70 ms) and
// scored |d13−2| + |d35−2| + 2|d15−4|; II and IV are the most prominent
// peaks between the anchors (0.2 ms margin). The trace is invented. The strip
// at the foot is real: the 54 signed Wave V errors (automatic − manual, ms)
// from bench/auto_peak_picks.csv and bench/manual_peak_picks.csv at f82d762.

import { minCss, r2, relPath, Tenths, type Seg } from "./svg";

const ERRORS = [
  -3.4, -2.4, -2.1, -1.92, -1.81, -1.08, -1.0, -0.6, -0.42, -0.4, -0.38, -0.33, -0.27, -0.25, -0.23, -0.06, -0.04, -0.02, -0.02,
  -0.02, -0.02, 0.0, 0.0, 0.0, 0.0, 0.0, 0.02, 0.04, 0.04, 0.06, 0.88, 0.94, 1.21, 1.25, 1.5, 1.56, 1.58, 1.6, 1.6, 1.83, 1.83,
  1.85, 1.98, 2.02, 2.4, 2.75, 3.6, 3.81, 4.02, 4.4, 4.56, 6.23, 6.52, 7.12,
];

const W = 720;
const H = 330;
const LOOP = 11;
const pct = (t: number) => `${((t / LOOP) * 100).toFixed(2)}%`;

// the trace: 0–12 ms at 0.05 ms
const T_MAX = 12;
const DT = 0.05;
const N = Math.round(T_MAX / DT) + 1;
const X0 = 70;
const X1 = 690;
const Y0 = 132; // the baseline
const AMP = 82;
const tx = (t: number) => X0 + (t / T_MAX) * (X1 - X0);
const ty = (v: number) => Y0 - v * AMP;

const WAVES = [
  { t: 1.6, a: 0.38, w: 0.18 }, // I
  { t: 2.75, a: 0.22, w: 0.17 }, // II
  { t: 3.65, a: 0.48, w: 0.2 }, // III
  { t: 4.75, a: 0.36, w: 0.2 }, // IV
  { t: 5.6, a: 0.8, w: 0.24 }, // V
  { t: 6.7, a: -0.55, w: 0.45 }, // the trough after V
];
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(7);
const RAW = [...Array(N).keys()].map((i) => {
  const t = i * DT;
  const clean = WAVES.reduce((s, w) => s + w.a * Math.exp(-(((t - w.t) / w.w) ** 2)), 0) * Math.min(1, t / 0.6);
  return clean + (r() - 0.5) * 0.22 + (r() - 0.5) * 0.12;
});
// gaussian_filter1d, sigma in samples
function gauss(x: number[], sigma: number) {
  const k = Math.ceil(sigma * 4);
  const kern = [...Array(2 * k + 1).keys()].map((i) => Math.exp(-(((i - k) / sigma) ** 2) / 2));
  const sum = kern.reduce((a, b) => a + b, 0);
  return x.map((_, i) => kern.reduce((s, kv, j) => s + kv * x[Math.min(x.length - 1, Math.max(0, i + j - k))], 0) / sum);
}
const SMOOTH = gauss(RAW, 2.4);

// candidates: local maxima of the smooth trace before 9.6 ms, above a floor
const CANDS = SMOOTH.map((v, i) => ({ v, i, t: i * DT }))
  .filter(({ v, i, t }) => i > 0 && i < N - 1 && v > SMOOTH[i - 1] && v >= SMOOTH[i + 1] && v > 0.08 && t <= 9.6);

const IN = (d: number, [lo, hi]: [number, number]) => d >= lo && d <= hi;
const IP13: [number, number] = [1.8, 2.3];
const IP35: [number, number] = [1.4, 2.3];
const IP15: [number, number] = [3.76, 4.7];
type Tri = { a: number; b: number; c: number; ok: boolean; score: number };
const TRIS: Tri[] = [];
for (let a = 0; a < CANDS.length; a++)
  for (let b = a + 1; b < CANDS.length; b++)
    for (let c = b + 1; c < CANDS.length; c++) {
      const [tI, tIII, tV] = [CANDS[a].t, CANDS[b].t, CANDS[c].t];
      const d13 = tIII - tI, d35 = tV - tIII, d15 = tV - tI;
      const ok = IN(d13, IP13) && IN(d35, IP35) && IN(d15, IP15);
      TRIS.push({ a, b, c, ok, score: Math.abs(d13 - 2) + Math.abs(d35 - 2) + 2 * Math.abs(d15 - 4) });
    }
const BEST = TRIS.filter((x) => x.ok).sort((p, q) => p.score - q.score)[0];
if (!BEST) throw new Error("figure peak-finding-toolbox: no triplet fits the drawn trace");
// the first two the loop tries and rejects, in its own order
const TRIED = TRIS.filter((x) => !x.ok).slice(0, 2);
const between = (lo: number, hi: number) => {
  const inside = CANDS.filter((c) => c.t > lo + 0.2 && c.t < hi - 0.2);
  return inside.sort((p, q) => q.v - p.v)[0];
};
const [I, III, V] = [CANDS[BEST.a], CANDS[BEST.b], CANDS[BEST.c]];
const II = between(I.t, III.t);
const IV = between(III.t, V.t);

// to 0.1 of a unit, written in tenths (drawn in <Tenths>)
const path = (ys: number[]) => relPath(ys.map((v, i): Seg => [i ? "L" : "M", tx(i * DT), ty(v)]), 1, true);

// the error strip
const SX0 = 150;
const SX1 = 690;
const SY = 290;
const sx = (e: number) => SX0 + ((e + 4) / 12) * (SX1 - SX0);
const STACK = (() => {
  const seen = new Map<number, number>();
  return ERRORS.map((e) => {
    const key = Math.round(sx(e) / 5);
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    // two columns per stack, so a tall pile stays low
    return { e, x: sx(e) + (n % 2 ? 2.4 : -2.4) * (n > 0 ? 1 : 0), y: SY - 5 - Math.floor(n / 2) * 4.6 };
  });
})();

const T_RAW = [0.2, 1.3];
const T_SMOOTH = [1.4, 2.4];
const T_CANDS = 2.6;
const T_TRY = [3.3, 4.2];
const T_BEST = 5.1;
const T_MID = 6.2;
const T_STRIP = 7.0;

function css() {
  const r2: string[] = [];
  const rule = (cls: string, kf: string, ease = "linear") => {
    r2.push(`@keyframes ${cls} { ${kf} }`);
    r2.push(`.fig-peak-finding-toolbox[data-play] .${cls} { animation: ${cls} ${LOOP}s ${ease} infinite; }`);
  };
  rule("pf-raw", `0%, ${pct(T_RAW[0])} { stroke-dashoffset: 1; opacity: 1; } ${pct(T_RAW[1])} { stroke-dashoffset: 0; opacity: 1; } ${pct(T_SMOOTH[1])}, ${pct(LOOP - 0.4)} { stroke-dashoffset: 0; opacity: 0.3; } 100% { stroke-dashoffset: 0; opacity: 0; }`);
  rule("pf-smooth", `0%, ${pct(T_SMOOTH[0])} { stroke-dashoffset: 1; } ${pct(T_SMOOTH[1])}, ${pct(LOOP - 0.4)} { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; }`);
  rule("pf-cand", `0%, ${pct(T_CANDS)} { opacity: 0; } ${pct(T_CANDS + 0.3)}, ${pct(LOOP - 0.4)} { opacity: 1; } 100% { opacity: 0; }`);
  TRIED.forEach((_, k) => rule(`pf-try-${k}`, `0%, ${pct(T_TRY[k])} { opacity: 0; } ${pct(T_TRY[k] + 0.1)}, ${pct(T_TRY[k] + 0.7)} { opacity: 1; } ${pct(T_TRY[k] + 0.85)}, 100% { opacity: 0; }`));
  rule("pf-best", `0%, ${pct(T_BEST)} { opacity: 0; } ${pct(T_BEST + 0.15)}, ${pct(LOOP - 0.4)} { opacity: 1; } 100% { opacity: 0; }`);
  rule("pf-win", `0%, ${pct(T_BEST)} { opacity: 0; transform: scaleY(0); } ${pct(T_BEST + 0.35)}, ${pct(LOOP - 0.4)} { opacity: 1; transform: none; } 100% { opacity: 0; }`, "cubic-bezier(0.2, 0.8, 0.2, 1)");
  rule("pf-mid", `0%, ${pct(T_MID)} { opacity: 0; } ${pct(T_MID + 0.25)}, ${pct(LOOP - 0.4)} { opacity: 1; } 100% { opacity: 0; }`);
  rule("pf-strip", `0%, ${pct(T_STRIP)} { opacity: 0; transform: translateY(6px); } ${pct(T_STRIP + 0.4)}, ${pct(LOOP - 0.4)} { opacity: 1; transform: none; } 100% { opacity: 0; }`, "cubic-bezier(0.2, 0.8, 0.2, 1)");
  return r2.join("\n");
}
const CSS = minCss(css());

function Bracket({ a, b, y, label, ok }: { a: number; b: number; y: number; label: string; ok: boolean }) {
  return (
    <g>
      <path d={`M${r2(tx(a))} ${y + 5}V${y}H${r2(tx(b))}V${y + 5}`} fill="none" stroke={ok ? "var(--pearl-sky)" : "oklch(1 0 0 / 0.55)"} />
      <text x={r2((tx(a) + tx(b)) / 2)} y={y - 4} textAnchor="middle" fontSize="9.5" fill={ok ? "var(--pearl-sky)" : "oklch(1 0 0 / 0.6)"}>{label}</text>
    </g>
  );
}

function Triplet({ t, cls }: { t: Tri; cls: string }) {
  const [a, b, c] = [CANDS[t.a].t, CANDS[t.b].t, CANDS[t.c].t];
  const f = (d: number) => d.toFixed(2);
  return (
    <g className={cls} opacity={t.ok ? undefined : "0"}>
      <Bracket a={a} b={b} y={44} label={`${f(b - a)} ms`} ok={IN(b - a, IP13)} />
      <Bracket a={b} b={c} y={44} label={`${f(c - b)} ms`} ok={IN(c - b, IP35)} />
      <Bracket a={a} b={c} y={24} label={`${f(c - a)} ms${t.ok ? "" : " ×"}`} ok={IN(c - a, IP15)} />
    </g>
  );
}

export default function PeakFindingFigure() {
  const winBand = (from: number, [lo, hi]: [number, number], y: number) => (
    <rect className="pf-win" style={{ transformBox: "fill-box", transformOrigin: "bottom" }} x={r2(tx(from + lo))} y={y} width={r2(tx(from + hi) - tx(from + lo))} height={Y0 + 40 - y} fill="oklch(0.86 0.09 205 / 0.09)" stroke="oklch(0.86 0.09 205 / 0.35)" strokeDasharray="2 3" />
  );
  const mark = (c: { t: number; v: number }, name: string, big: boolean) => (
    <g key={name}>
      <circle cx={r2(tx(c.t))} cy={r2(ty(c.v))} r={big ? 4.5 : 3.5} fill={big ? "oklch(1 0 0)" : "var(--pearl-orchid)"} />
      <text x={r2(tx(c.t))} y={r2(ty(c.v) - 10)} textAnchor="middle" fontSize={big ? 12 : 11} fill={big ? "oklch(1 0 0)" : "var(--pearl-orchid)"}>{name}</text>
    </g>
  );
  const median = [...ERRORS].map(Math.abs).sort((a, b) => a - b);
  const med = (median[26] + median[27]) / 2;
  return (
    <>
      <style>{CSS}</style>
      <svg className="fig-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {/* axis */}
        <line x1={X0} y1={Y0 + 40} x2={X1} y2={Y0 + 40} stroke="oklch(1 0 0 / 0.25)" />
        {[0, 2, 4, 6, 8, 10, 12].map((t) => (
          <g key={t}>
            <line x1={r2(tx(t))} y1={Y0 + 40} x2={r2(tx(t))} y2={Y0 + 44} stroke="oklch(1 0 0 / 0.35)" />
            <text x={r2(tx(t))} y={Y0 + 56} textAnchor="middle" fontSize="10" fill="oklch(1 0 0 / 0.62)">{t === 12 ? "12 ms" : t}</text>
          </g>
        ))}
        <line x1={r2(tx(9.6))} y1={14} x2={r2(tx(9.6))} y2={Y0 + 40} stroke="oklch(1 0 0 / 0.25)" strokeDasharray="2 3" />
        <text x={r2(tx(9.6) + 4)} y={22} fontSize="9.5" fill="oklch(1 0 0 / 0.62)">9.6 ms: last V</text>

        {/* the windows, hung from the chosen I and III */}
        {winBand(I.t, IP13, 60)}
        {winBand(III.t, IP35, 60)}

        <Tenths w={W} h={H}>
          <path className="pf-raw" pathLength={1} strokeDasharray="1 1" d={path(RAW)} fill="none" stroke="oklch(1 0 0 / 0.5)" strokeWidth="10" style={{ opacity: 0.3 }} />
          <path className="pf-smooth" pathLength={1} strokeDasharray="1 1" d={path(SMOOTH)} fill="none" stroke="oklch(1 0 0 / 0.95)" strokeWidth="16" />
        </Tenths>
        <g className="pf-cand">
          {CANDS.map((c) => <line key={c.i} x1={r2(tx(c.t))} y1={r2(ty(c.v) - 3)} x2={r2(tx(c.t))} y2={Y0 + 40} stroke="oklch(1 0 0 / 0.18)" />)}
        </g>
        {TRIED.map((t, k) => <Triplet key={k} t={t} cls={`pf-try-${k}`} />)}
        <Triplet t={BEST} cls="pf-best" />
        <g className="pf-best">{[mark(I, "I", true), mark(III, "III", true), mark(V, "V", true)]}</g>
        <g className="pf-mid">{[II && mark(II, "II", false), IV && mark(IV, "IV", false)]}</g>

        {/* the real benchmark */}
        <g className="pf-strip">
          <text x={16} y={SY - 26} fontSize="10" fill="oklch(1 0 0 / 0.7)">Wave V benchmark</text>
          <text x={16} y={SY - 12} fontSize="9.5" fill="oklch(1 0 0 / 0.62)">54 picks · 8 subjects</text>
          <text x={16} y={SY + 2} fontSize="9.5" fill="oklch(1 0 0 / 0.62)">auto − manual, ms</text>
          <rect x={r2(sx(-0.5))} y={SY - 56} width={r2(sx(0.5) - sx(-0.5))} height={56} fill="oklch(0.86 0.09 205 / 0.1)" />
          <line x1={SX0} y1={SY} x2={SX1} y2={SY} stroke="oklch(1 0 0 / 0.3)" />
          {[-4, -2, 0, 2, 4, 6, 8].map((e) => (
            <text key={e} x={r2(sx(e))} y={SY + 13} textAnchor="middle" fontSize="9.5" fill="oklch(1 0 0 / 0.62)">{e > 0 ? `+${e}` : e}</text>
          ))}
          {STACK.map((d, i) => <circle key={i} cx={r2(d.x)} cy={r2(d.y)} r="2" fill={Math.abs(d.e) <= 0.5 ? "var(--pearl-sky)" : "oklch(1 0 0 / 0.8)"} />)}
          <text x={r2(sx(0.5) + 6)} y={SY - 44} fontSize="9.5" fill="var(--pearl-sky)">±0.5 ms: 41%</text>
          <text x={SX1} y={SY - 44} textAnchor="end" fontSize="9.5" fill="oklch(1 0 0 / 0.6)">{`median |error| ${med.toFixed(2)} ms`}</text>
        </g>
      </svg>
    </>
  );
}
