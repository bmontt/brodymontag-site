// ── figure: here comes the kicker · four pitches, in fixed steps ──────────────
// The four PitchTypes (here-comes-the-kicker-unity@4e5017f, Sim/Pitching.cs:
// ROLLER, SKIPPER, CURVE, BIG HOP with their speed, curve, hops and last-leg
// time), solved by ComputePitchLaunch and stepped by StepPitch at
// Tuning.SimDt = 1/120 s, here at build. Every dot is one step; the ball
// moves at real speed. Each pitch aims at the middle of the zone, so the
// rng's accuracy jitter is left out, and the curve breaks to one side. The
// side view shows height; the strip above shows the curve's sideways break.
// The callout is one of the game's own (UI/Shouts.cs).

import { minCss, r2, relPath, Tenths, type Seg } from "./svg";

const DT = 1 / 120;
const PITCH_G = 8;
const BALL_R = 0.42;
const START_Z = -16;
const AIM_Y = 1.12; // the zone's middle: (0.30 + 1.95) / 2
const TYPES = [
  { name: "ROLLER", speed: 9.6, curve: 0, hops: 0, hopT: 0.26 },
  { name: "SKIPPER", speed: 8.4, curve: 0, hops: 3, hopT: 0.4 },
  { name: "CURVE", speed: 8.6, curve: 5.0, hops: 0, hopT: 0.3 },
  { name: "BIG HOP", speed: 6.6, curve: 0, hops: 1, hopT: 0.66 },
];

type Step = { x: number; y: number; z: number };
function fly(t: (typeof TYPES)[number]): Step[] {
  const T = (0 - START_Z) / t.speed;
  const a = t.curve; // the sign draw: this side
  const nRoll = Math.max(1, Math.floor((T - Math.min(t.hopT, T * 0.85)) / DT + 0.5));
  const tRoll = nRoll * DT;
  const tLast = Math.max(DT, T - tRoll);
  const k = T * T + T * DT;
  const kl = tLast * tLast + tLast * DT;
  let vx = (0 - 0.5 * a * k) / T;
  const vyB = (AIM_Y - BALL_R + 0.5 * PITCH_G * kl) / tLast;
  let x = 0, y = BALL_R, z = START_Z, vy = 0, bt = 0, up = false;
  const out: Step[] = [{ x, y, z }];
  while (z < 0) {
    bt += DT;
    if (a) vx += a * DT;
    x += vx * DT;
    z += t.speed * DT;
    if (bt < tRoll) {
      if (t.hops > 0) {
        const per = tRoll / t.hops;
        const tau = bt % per;
        y = BALL_R + 0.5 * PITCH_G * per * tau - 0.5 * PITCH_G * tau * tau;
      } else y = BALL_R;
      vy = 0;
    } else {
      if (!up) {
        up = true;
        y = BALL_R;
        vy = vyB;
      }
      vy -= PITCH_G * DT;
      y += vy * DT;
    }
    out.push({ x, y, z });
  }
  return out;
}
const FLIGHTS = TYPES.map(fly);

// drawing
const W = 720;
const H = 320;
const ZX0 = 70; // the mound, z = -16
const ZX1 = 652; // the plate, z = 0
const GROUND = 280;
const UNIT = 50; // px per unit of height
const LAT_Y = 50; // the top-view strip's centre line
const LAT = 8; // px per unit sideways
const px = (z: number) => ZX0 + ((z - START_Z) / -START_Z) * (ZX1 - ZX0);
const py = (y: number) => GROUND - y * UNIT;
const ly = (x: number) => LAT_Y - x * LAT;

const GAP = 0.7;
const STARTS = FLIGHTS.reduce<number[]>((acc, f, i) => [...acc, i === 0 ? 0.4 : acc[i - 1] + FLIGHTS[i - 1].length * DT + GAP], []);
const LOOP = STARTS[3] + FLIGHTS[3].length * DT + 2.2;
const pct = (t: number) => `${((t / LOOP) * 100).toFixed(3)}%`;

// one round-capped dot per step, to 0.1 of a unit, written in tenths (drawn in <Tenths>)
const dots = (f: Step[], to: (s: Step) => [number, number]) =>
  relPath(f.flatMap((s): Seg[] => { const [a, b] = to(s); return [["M", a, b], ["H", a]]; }), 1, true);

function css() {
  const r: string[] = [];
  FLIGHTS.forEach((f, i) => {
    const t0 = STARTS[i];
    const dur = f.length * DT;
    const t1 = t0 + dur;
    const until = i === 3 ? LOOP - 0.4 : STARTS[i + 1] - 0.15;
    // the trail: shown from launch, held until the next pitch
    r.push(`@keyframes kk-trail-${i} { 0%, ${pct(t0 - 0.01)} { opacity: 0; } ${pct(t0)}, ${pct(until)} { opacity: 1; } ${pct(until + 0.15)}, 100% { opacity: 0; } }`);
    // the cover over the steps not yet taken slides with the ball
    r.push(`@keyframes kk-cover-${i} { 0%, ${pct(t0)} { transform: translateX(0); } ${pct(t1)}, 100% { transform: translateX(${(ZX1 - ZX0 + 30).toFixed(1)}px); } }`);
    // the ball, sampled every 6 steps (linear between); opacity 1 is set on
    // the first and last frame, and the frames between hold it
    const frames = f.filter((_, j) => j % 6 === 0 || j === f.length - 1).map((s, j, arr) => {
      const end = j === arr.length - 1;
      const tt = t0 + (end ? dur : j * 6 * DT);
      return `${pct(tt)} { transform: translate(${px(s.z).toFixed(1)}px, ${py(s.y).toFixed(1)}px);${j === 0 || end ? " opacity: 1;" : ""} }`;
    });
    const s0 = f[0], sn = f[f.length - 1];
    r.push(`@keyframes kk-ball-${i} { 0%, ${pct(t0 - 0.01)} { transform: translate(${r2(px(s0.z))}px, ${r2(py(s0.y))}px); opacity: 0; } ${frames.join(" ")} ${pct(t1 + 0.3)}, 100% { transform: translate(${px(sn.z).toFixed(1)}px, ${py(sn.y).toFixed(1)}px); opacity: 0; } }`);
    r.push(`.fig-here-comes-the-kicker[data-play] .kk-trail-${i} { animation: kk-trail-${i} ${LOOP.toFixed(3)}s linear infinite; }`);
    r.push(`.fig-here-comes-the-kicker[data-play] .kk-cover-${i} { animation: kk-cover-${i} ${LOOP.toFixed(3)}s linear infinite; }`);
    r.push(`.fig-here-comes-the-kicker[data-play] .kk-ball-${i} { animation: kk-ball-${i} ${LOOP.toFixed(3)}s linear infinite; }`);
  });
  const tEnd = STARTS[3] + FLIGHTS[3].length * DT;
  r.push(`@keyframes kk-shout { 0%, ${pct(tEnd)} { opacity: 0; transform: scale(1.6) skewX(-12deg); } ${pct(tEnd + 0.12)} { opacity: 1; transform: scale(1) skewX(-12deg); } ${pct(LOOP - 0.5)} { opacity: 1; transform: scale(1) skewX(-12deg); } 100% { opacity: 0; transform: scale(1) skewX(-12deg); } }`);
  r.push(`.fig-here-comes-the-kicker[data-play] .kk-shout { animation: kk-shout ${LOOP.toFixed(3)}s cubic-bezier(0.2, 0.8, 0.2, 1) infinite; }`);
  return r.join("\n");
}
const CSS = minCss(css());

/** where each name sits: above its highest point, or on its roll, or by its break */
function label(i: number, f: Step[]): [number, number] {
  const t = TYPES[i];
  if (t.curve) {
    const far = f.reduce((m, s) => (Math.abs(s.x) > Math.abs(m.x) ? s : m), f[0]);
    return [px(far.z), ly(far.x) + (far.x > 0 ? -10 : 18)];
  }
  if (t.hops === 0) return [px(-12), GROUND - 12];
  const mid = f.slice(0, Math.floor(f.length * 0.75));
  const apex = mid.reduce((m, s) => (s.y > m.y ? s : m), mid[0]);
  return [px(apex.z), py(apex.y) - 10];
}

const ZONE_TOP = py(1.95);
const ZONE_BOT = py(0.3);

export default function KickerFigure() {
  return (
    <>
      <style>{CSS}</style>
      <svg className="fig-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          <clipPath id="kk-field">
            <rect x={ZX0 - 8} y="0" width={ZX1 - ZX0 + 14} height={GROUND + 4} />
          </clipPath>
        </defs>
        {FLIGHTS.map((f, i) => {
          const at = label(i, f);
          return (
            <g key={i} className={`kk-trail kk-trail-${i}`} clipPath="url(#kk-field)">
              <Tenths w={W} h={H}>
                <path d={dots(f, (s) => [px(s.z), py(s.y)])} stroke="oklch(1 0 0 / 0.85)" strokeWidth="21" strokeLinecap="round" />
                {TYPES[i].curve !== 0 && <path d={dots(f, (s) => [px(s.z), ly(s.x)])} stroke="var(--pearl-orchid)" strokeWidth="21" strokeLinecap="round" />}
              </Tenths>
              <text x={at[0]} y={at[1]} textAnchor="middle" fontSize="11" fill="oklch(1 0 0 / 0.85)" style={{ letterSpacing: "0.08em" }}>{TYPES[i].name}</text>
              <rect className={`kk-cover-${i}`} x={ZX0 - 4} y="0" width={ZX1 - ZX0 + 60} height={GROUND - 1} fill="oklch(0.13 0 0)" style={{ transform: `translateX(${ZX1 - ZX0 + 30}px)` }} />
            </g>
          );
        })}
        {FLIGHTS.map((f, i) => (
          <g key={i} className={`kk-ball kk-ball-${i}`} opacity="0">
            <circle r="7" fill="oklch(1 0 0 / 0.12)" />
            <circle r={BALL_R * UNIT * 0.5} fill="oklch(1 0 0)" />
          </g>
        ))}

        {/* the field */}
        <line x1={ZX0 - 30} y1={GROUND} x2={ZX1 + 40} y2={GROUND} stroke="oklch(1 0 0 / 0.4)" />
        <path d={`M${ZX0 - 26} ${GROUND} q 26 -14 52 0`} fill="none" stroke="oklch(1 0 0 / 0.35)" />
        <text x={ZX0} y={GROUND + 18} textAnchor="middle" fontSize="10.5" fill="oklch(1 0 0 / 0.62)">mound</text>
        <text x={ZX1} y={GROUND + 18} textAnchor="middle" fontSize="10.5" fill="oklch(1 0 0 / 0.62)">plate</text>
        <rect x={ZX1 - 3} y={ZONE_TOP} width="6" height={ZONE_BOT - ZONE_TOP} fill="oklch(0.86 0.09 205 / 0.12)" stroke="oklch(0.86 0.09 205 / 0.6)" />
        <text x={ZX1 + 10} y={(ZONE_TOP + ZONE_BOT) / 2 + 4} fontSize="10" fill="oklch(0.86 0.09 205 / 0.8)">zone</text>
        {/* the top-view strip */}
        <line x1={ZX0} y1={LAT_Y} x2={ZX1} y2={LAT_Y} stroke="oklch(1 0 0 / 0.12)" strokeDasharray="2 4" />
        <text x={ZX0 - 30} y={LAT_Y - 26} fontSize="10" fill="oklch(1 0 0 / 0.62)">from above</text>
        <text x={ZX0 - 30} y={GROUND - 128} fontSize="10" fill="oklch(1 0 0 / 0.62)">from the side</text>

        <text x={ZX1 + 40} y={20} textAnchor="end" fontSize="10" fill="oklch(1 0 0 / 0.62)">each dot: one step of 1/120 s · real speed</text>
        <text className="kk-shout" x={ZX1 - 70} y={GROUND - 150} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--pearl-orchid)" opacity="0" style={{ transformBox: "fill-box", transformOrigin: "center", letterSpacing: "0.04em" }}>STEEEERIKE</text>
      </svg>
    </>
  );
}
