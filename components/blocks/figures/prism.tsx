// ── figure: Prism · the stems fill ahead of the playhead ──────────────────────
// ProgressiveExtractor and StemTransport (stem-box@a4db71f, src/sync) as a
// loop: a track loads, the worker runs HTDemucs on 10 s windows that step by
// 7.5 s (StemSegment::CHUNK_SECS, STEP_MS), each finished step lands in the
// ring of 12 segments (BUFFER_SEGMENTS), and the stem return stays silent
// until 40 s are buffered (ACTIVATION_SECONDS): with the default step, after
// the sixth window. The stems are in HTDemucs order (drums, bass, other,
// vocals). Then an encoder turns the drums down and back up. The waveforms
// are drawn, not measured, and the speed of the front is not to scale.
// The timeline is computed here and written as this figure's own CSS, so
// the keyframes and the drawing share one set of numbers.

const W = 720;
const H = 340;
const X0 = 118; // the axis: 0 s
const X1 = 694; // 80 s
const TRACK = 80; // s
const PX = (X1 - X0) / TRACK; // px per second of track
const HOP = 7.5; // s, StemSegment::STEP_MS
const WIN = 10; // s, StemSegment::CHUNK_SECS
const LIVE_AT = 40; // s, ACTIVATION_SECONDS
const LOOP = 13; // s of animation

const STEMS = ["drums", "bass", "other", "vocals"] as const;
const LANE_H = 30;
const MIX_Y = 72;
const STEM_Y0 = 128;
const LANE_GAP = 40;
const laneY = (i: number) => STEM_Y0 + i * LANE_GAP;
const STEMS_TOP = STEM_Y0 - LANE_H / 2 - 6;
const STEMS_BOT = laneY(3) + LANE_H / 2 + 6;

// the worker's schedule (animation seconds): window k finishes at T(k)
const START = 0.7;
const STEP_T = 0.62;
const N_WIN = Math.ceil(TRACK / HOP); // 11 windows for an 80 s track
const T = (k: number) => START + STEP_T * (k + 1);
const cursorAfter = (k: number) => Math.min(TRACK, HOP * (k + 1));
const LIVE_K = [...Array(N_WIN).keys()].find((k) => cursorAfter(k) >= LIVE_AT)!; // 5: the sixth window
const pct = (t: number) => `${((t / LOOP) * 100).toFixed(2)}%`;

// ── drawn waveforms (a schematic arrangement: intro, build, drop, break, outro)
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const section = (t: number) => (t < 16 ? 0 : t < 32 ? 1 : t < 64 ? 2 : t < 72 ? 3 : 4);
const LEVELS: Record<(typeof STEMS)[number], number[]> = {
  drums: [0.45, 0.6, 0.95, 0.08, 0.55],
  bass: [0.12, 0.3, 0.85, 0.05, 0.35],
  other: [0.4, 0.75, 0.55, 0.7, 0.35],
  vocals: [0, 0.6, 0.45, 0.65, 0],
};
const JITTER = { drums: 0.55, bass: 0.15, other: 0.35, vocals: 0.4 };
const BAR = 2.9; // px between bars

function amps(stem: (typeof STEMS)[number], seed: number) {
  const r = rng(seed);
  const out: number[] = [];
  for (let x = 0; x < X1 - X0; x += BAR) {
    const t = x / PX;
    let a = LEVELS[stem][section(t)] * (1 - JITTER[stem] + JITTER[stem] * r());
    if (stem === "vocals" && (t % 16) > 12) a *= 0.15; // phrase gaps
    out.push(a);
  }
  return out;
}
const AMPS = STEMS.map((s, i) => amps(s, 17 + i * 101));
const MIX = AMPS[0].map((_, j) => Math.min(1, (AMPS[0][j] + AMPS[1][j] + AMPS[2][j] + AMPS[3][j]) / 2.2));

const wave = (a: number[], cy: number, h: number) =>
  a.map((v, j) => `M${(X0 + j * BAR).toFixed(1)} ${(cy - Math.max(0.6, v * h)).toFixed(1)}V${(cy + Math.max(0.6, v * h)).toFixed(1)}`).join("");

// ── the timeline as CSS ──────────────────────────────────────────────────────
function css() {
  const k = [...Array(N_WIN).keys()];
  // the front (the cover over what is not yet extracted) steps right as each
  // window lands; the window bracket sits on the window in progress
  const front = [
    `0%, ${pct(START)} { transform: translateX(0); }`,
    ...k.map((i) => `${pct(T(i) - 0.1)} { transform: translateX(${((i ? cursorAfter(i - 1) : 0) * PX).toFixed(1)}px); } ${pct(T(i))} { transform: translateX(${(cursorAfter(i) * PX).toFixed(1)}px); }`),
    `${pct(LOOP - 0.5)} { transform: translateX(${(TRACK * PX).toFixed(1)}px); opacity: 1; } 100% { transform: translateX(${(TRACK * PX).toFixed(1)}px); opacity: 0; }`,
  ].join(" ");
  const bracket = [
    `0%, ${pct(START - 0.15)} { opacity: 0; transform: translateX(0); }`,
    `${pct(START)} { opacity: 1; transform: translateX(0); }`,
    ...k.slice(0, -1).map((i) => `${pct(T(i) - 0.001)} { opacity: 1; transform: translateX(${(HOP * i * PX).toFixed(1)}px); } ${pct(T(i))} { opacity: 1; transform: translateX(${(HOP * (i + 1) * PX).toFixed(1)}px); }`),
    `${pct(T(N_WIN - 1))} { opacity: 1; transform: translateX(${(HOP * (N_WIN - 1) * PX).toFixed(1)}px); }`,
    `${pct(T(N_WIN - 1) + 0.3)}, 100% { opacity: 0; transform: translateX(${(HOP * (N_WIN - 1) * PX).toFixed(1)}px); }`,
  ].join(" ");
  const ring = k
    .map((i) => `@keyframes pk-seg-${i} { 0%, ${pct(T(i) - 0.01)} { fill: transparent; } ${pct(T(i))} { fill: oklch(0.95 0 0); } ${pct(T(i) + 0.5)}, ${pct(LOOP - 0.5)} { fill: oklch(0.8 0 0 / 0.75); } 100% { fill: transparent; } }
.fig-prism[data-play] .pk-seg-${i} { animation: pk-seg-${i} ${LOOP}s linear infinite; }`)
    .join("\n");
  const live = pct(T(LIVE_K));
  const turnDown = [6.4, 7.0];
  const turnUp = [9.6, 10.2];
  return `
.fig-prism[data-play] .pk-front { animation: pk-front ${LOOP}s linear infinite; }
.fig-prism[data-play] .pk-bracket { animation: pk-bracket ${LOOP}s linear infinite; }
.fig-prism[data-play] .pk-head { animation: pk-head ${LOOP}s linear infinite; }
.fig-prism[data-play] .pk-load { animation: pk-load ${LOOP}s ease-out infinite; }
.fig-prism[data-play] .pk-silent { animation: pk-silent ${LOOP}s linear infinite; }
.fig-prism[data-play] .pk-live { animation: pk-live ${LOOP}s linear infinite; }
.fig-prism[data-play] .pk-led { animation: pk-led ${LOOP}s linear infinite; }
.fig-prism[data-play] .pk-mark { animation: pk-mark ${LOOP}s linear infinite; }
.fig-prism[data-play] .pk-knob-0 { animation: pk-knob ${LOOP}s ease-in-out infinite; }
.fig-prism[data-play] .pk-lane-0 { animation: pk-lane ${LOOP}s ease-in-out infinite; }
@keyframes pk-front { ${front} }
@keyframes pk-bracket { ${bracket} }
@keyframes pk-head { 0% { transform: translateX(0); } ${pct(LOOP - 0.5)} { transform: translateX(${(20 * PX).toFixed(1)}px); opacity: 1; } 100% { transform: translateX(${(20 * PX).toFixed(1)}px); opacity: 0; } }
@keyframes pk-load { 0% { opacity: 0; } 2% { opacity: 1; } ${pct(2.2)} { opacity: 1; } ${pct(3)}, 100% { opacity: 0.35; } }
@keyframes pk-silent { 0%, ${live} { opacity: 1; } ${pct(T(LIVE_K) + 0.05)}, 100% { opacity: 0; } }
@keyframes pk-live { 0%, ${live} { opacity: 0; } ${pct(T(LIVE_K) + 0.05)}, ${pct(LOOP - 0.4)} { opacity: 1; } 100% { opacity: 0; } }
@keyframes pk-led { 0%, ${live} { fill: oklch(0.6 0 0); } ${pct(T(LIVE_K) + 0.05)}, ${pct(LOOP - 0.4)} { fill: var(--pearl-sky); } 100% { fill: oklch(0.6 0 0); } }
@keyframes pk-mark { 0%, ${live} { opacity: 0.55; } ${pct(T(LIVE_K) + 0.05)} { opacity: 1; } ${pct(T(LIVE_K) + 1)}, 100% { opacity: 0.8; } }
@keyframes pk-knob { 0%, ${pct(turnDown[0])} { transform: rotate(135deg); } ${pct(turnDown[1])}, ${pct(turnUp[0])} { transform: rotate(-135deg); } ${pct(turnUp[1])}, 100% { transform: rotate(135deg); } }
@keyframes pk-lane { 0%, ${pct(turnDown[0])} { opacity: 1; } ${pct(turnDown[1])}, ${pct(turnUp[0])} { opacity: 0.16; } ${pct(turnUp[1])}, 100% { opacity: 1; } }
${ring}`;
}

const CSS = css();
const RING_X = X1 - 12 * 13 + 3;
const AXIS_Y = STEMS_BOT + 14;

export default function PrismFigure() {
  return (
    <>
      <style>{CSS}</style>
      <svg className="fig-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          <pattern id="pk-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="oklch(1 0 0 / 0.07)" strokeWidth="1" />
          </pattern>
          <clipPath id="pk-track">
            <rect x={X0 - 1} y="0" width={X1 - X0 + 2} height={H} />
          </clipPath>
          <clipPath id="pk-stems">
            <rect x={X0} y={STEMS_TOP} width={X1 - X0} height={STEMS_BOT - STEMS_TOP} />
          </clipPath>
        </defs>

        {/* header: the load event and the stem return's state */}
        <g fontSize="11.5">
          <text className="pk-load" x={X0} y={26} fill="oklch(1 0 0 / 0.8)">CDJ · new track ID → extract</text>
          <circle className="pk-led" cx={X1 - 132} cy={22} r="4" fill="var(--pearl-sky)" />
          <text className="pk-silent" x={X1 - 120} y={26} fill="oklch(1 0 0 / 0.6)" opacity="0">stem return: silent</text>
          <text className="pk-live" x={X1 - 120} y={26} fill="oklch(1 0 0 / 0.9)">stem return: live</text>
        </g>

        {/* the mix */}
        <text x={20} y={MIX_Y + 4} fontSize="11.5" fill="oklch(1 0 0 / 0.62)">track</text>
        <path d={wave(MIX, MIX_Y, LANE_H / 2)} stroke="oklch(1 0 0 / 0.38)" strokeWidth="1.6" />

        {/* the four stems, with an encoder each */}
        {STEMS.map((s, i) => (
          <g key={s}>
            <text x={20} y={laneY(i) + 4} fontSize="11.5" fill="oklch(1 0 0 / 0.7)">{s}</text>
            <g transform={`translate(${X0 - 24} ${laneY(i)})`}>
              <circle r="8" fill="none" stroke="oklch(1 0 0 / 0.4)" />
              <g className={`pk-knob pk-knob-${i}`} style={{ transform: "rotate(135deg)", transformOrigin: "0 0" }}>
                <line x1="0" y1="0" x2="0" y2="-6.5" stroke="oklch(1 0 0 / 0.9)" strokeWidth="1.4" strokeLinecap="round" />
              </g>
            </g>
            <path className={`pk-lane pk-lane-${i}`} d={wave(AMPS[i], laneY(i), LANE_H / 2)} stroke="oklch(1 0 0 / 0.72)" strokeWidth="1.6" />
          </g>
        ))}

        {/* not yet extracted: a cover whose left edge is the extraction front */}
        <g clipPath="url(#pk-stems)">
          <g className="pk-front" style={{ transform: `translateX(${(TRACK * PX).toFixed(1)}px)` }}>
            <rect x={X0} y={STEMS_TOP} width={X1 - X0 + 2} height={STEMS_BOT - STEMS_TOP} fill="oklch(0.13 0 0)" />
            <rect x={X0} y={STEMS_TOP} width={X1 - X0 + 2} height={STEMS_BOT - STEMS_TOP} fill="url(#pk-hatch)" />
            <line x1={X0} y1={STEMS_TOP} x2={X0} y2={STEMS_BOT} stroke="oklch(1 0 0 / 0.9)" strokeWidth="1.2" />
          </g>
        </g>

        {/* the window in progress: 10 s, its first 2.5 s overlapping the last */}
        <g clipPath="url(#pk-track)">
        <g className="pk-bracket" opacity="0">
          <rect x={X0} y={STEMS_TOP - 3} width={(WIN - HOP) * PX} height={STEMS_BOT - STEMS_TOP + 6} fill="oklch(0.86 0.09 205 / 0.14)" />
          <rect x={X0} y={STEMS_TOP - 3} width={WIN * PX} height={STEMS_BOT - STEMS_TOP + 6} fill="none" stroke="oklch(1 0 0 / 0.7)" strokeDasharray="3 3" />
          <text x={X0 + 3} y={STEMS_TOP - 7} fontSize="10.5" fill="oklch(1 0 0 / 0.7)">10 s window</text>
        </g>
        </g>

        {/* the axis, and the 40 s mark */}
        <g fontSize="10.5" fill="oklch(1 0 0 / 0.62)">
          <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke="oklch(1 0 0 / 0.25)" />
          {[0, 10, 20, 30, 40, 50, 60, 70, 80].map((s) => (
            <g key={s}>
              <line x1={X0 + s * PX} y1={AXIS_Y} x2={X0 + s * PX} y2={AXIS_Y + 4} stroke="oklch(1 0 0 / 0.35)" />
              <text x={X0 + s * PX} y={AXIS_Y + 16} textAnchor="middle">{s === 80 ? "80 s" : s}</text>
            </g>
          ))}
          <g className="pk-mark">
            <line x1={X0 + LIVE_AT * PX} y1={MIX_Y - LANE_H / 2 - 14} x2={X0 + LIVE_AT * PX} y2={AXIS_Y} stroke="var(--pearl-sky)" strokeDasharray="2 3" />
            <text x={X0 + LIVE_AT * PX + 5} y={MIX_Y - LANE_H / 2 - 4} fill="var(--pearl-sky)">40 s ready → controls live</text>
          </g>
        </g>

        {/* the playhead, at the CDJ position */}
        <g className="pk-head" style={{ transform: `translateX(${(20 * PX).toFixed(1)}px)` }}>
          <line x1={X0} y1={MIX_Y - LANE_H / 2 - 4} x2={X0} y2={STEMS_BOT} stroke="oklch(1 0 0)" strokeWidth="1.3" />
          <path d={`M${X0 - 4} ${MIX_Y - LANE_H / 2 - 8}h8l-4 5z`} fill="oklch(1 0 0)" />
        </g>

        {/* the ring of 12 segments */}
        <g fontSize="10.5">
          <text x={RING_X - 8} y={H - 18} textAnchor="end" fill="oklch(1 0 0 / 0.62)">ring · 12 segments</text>
          {[...Array(12).keys()].map((i) => (
            <rect key={i} className={`pk-seg pk-seg-${i}`} x={RING_X + i * 13} y={H - 28} width="10" height="12" rx="1.5" fill={i < N_WIN ? "oklch(0.8 0 0 / 0.75)" : "transparent"} stroke="oklch(1 0 0 / 0.4)" />
          ))}
        </g>
      </svg>
    </>
  );
}
