// ── director / laser ──────────────────────────────────────────────────────────
// Drives the laser layer (lib/ascii-engine/gl/laser-shader.ts) as one
// continuous piece across the whole scroll — a linear animation, not a set of
// scenes: every figure's parameters are functions of global progress (plus a
// slow clock so it never freezes), and neighbouring figures crossfade on the
// same chapter weights the camera uses.
//
//   hero      green oscilloscope trace; its harmonics build as you read, then
//             it folds into the knot during the prologue dive
//   code      a cyan 3:2 Lissajous knot spinning in the right margin
//   music     red → magenta club fans sweeping from the floor on a 124 bpm pulse
//   timeline  a violet → cyan perspective floor that runs with the year track
//   epilogue  two beam rings (red, cyan) in a decaying orbit, merging to white,
//             then an amber ringdown — the same merger/ring the track drives
//
// The glitch amount rises with scroll speed, spikes at chapter boundaries, and
// fires rare short bursts on its own.

import type { LaserUniforms } from "@/lib/ascii-engine/gl/laser-shader";
import { chapterWeight } from "./weights";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export interface LaserInput {
  g: number;
  ids: readonly string[];
  bounds: readonly number[];
  timelineProgress: number; // -1 when the year track isn't pinned
  merge: number;
  ring: number;
  velocity: number; // px/s
  time: number; // s
  delta: number; // s
  viewW: number;
  viewH: number;
}

/** stateful only for accumulated phases (so speed changes never jump) */
export function createLaserDirector() {
  let orbitPhase = 0;
  let lissSpin = 0;

  return function update(u: LaserUniforms, x: LaserInput): number {
    const { g, ids, bounds, time, viewW: W, viewH: H } = x;
    const M = Math.min(W, H);
    const w = (id: string, lead = 0.35, tail = 0.35) => chapterWeight(id, g, ids, bounds, lead, tail);
    const local = (id: string) => {
      const i = ids.indexOf(id);
      if (i < 0 || bounds.length !== ids.length) return 0;
      const s = bounds[i];
      const e = i + 1 < bounds.length ? bounds[i + 1] : 1;
      return clamp01((g - s) / Math.max(e - s, 1e-4));
    };

    // ── hero: oscilloscope → knot ────────────────────────────────────────
    const lh = local("hero");
    // the hero is on stage from the very top (no fade-in before progress 0)
    const hi = ids.indexOf("hero");
    const he = hi >= 0 && hi + 1 < bounds.length ? bounds[hi + 1] : 0.1;
    const wh = 1 - smooth(he - 0.02, he + 0.06, g);
    const fold = smooth(0.5, 0.88, lh);
    u.uScope.value.set(wh * (1 - fold), H * lerp(0.012, 0.07, smooth(0, 0.5, lh)), lerp(2, 4.5, lh), time * 0.9 + g * 30);
    u.uScopeB.value.set(H * 0.74, 0.36, smooth(0.1, 0.5, lh), 0);

    // ── code: Lissajous knot ─────────────────────────────────────────────
    const wc = w("code", 0.5, 0.4);
    const lc = local("code");
    lissSpin += x.delta * (0.35 + Math.min(Math.abs(x.velocity) / 2500, 1.5));
    const lissW = Math.max(wc, wh * fold);
    const inHero = wh * fold > wc ? 1 : 0;
    const cx = lerp(W * 0.72, W * 0.5, inHero * (1 - smooth(0.85, 1, lh)));
    u.uLiss.value.set(lissW * 0.95, 3, 2, time * 0.25 + g * 9);
    u.uLissB.value.set(lissSpin, M * lerp(0.3, 0.34, lc) * lerp(1, fold, inHero), lerp(0.36, 0.5, smooth(0, 0.4, lc)), 0.35 + 0.25 * Math.sin(time * 0.2));
    u.uLissC.value.set(cx, H * 0.5);

    // ── music: club fans ────────────────────────────────────────────────
    const wm = w("music", 0.45, 0.35);
    const lm = local("music");
    const beat = Math.pow(1 - ((time * 124) / 60) % 1, 3); // 124 bpm kick, decaying
    u.uFan.value.set(wm * (0.7 + 0.3 * beat), 7, lerp(0.9, 1.35, lm), 0.42 * Math.sin(time * 0.55 + lm * 7));
    u.uFanB.value.set(W * 0.5, H * 1.04, lerp(0.0, 0.9, lm), H * 1.35);

    // ── timeline: laser floor ───────────────────────────────────────────
    const wt = w("timeline", 0.4, 0.3);
    const tp = x.timelineProgress >= 0 ? x.timelineProgress : local("timeline");
    u.uGridL.value.set(wt * 0.85, H * 0.56, tp * 14 + time * 0.12, lerp(0.76, 0.52, tp));
    u.uGridB.value.set(W * (0.5 + 0.22 * (0.5 - tp)), W * 0.085, 1.1, 0);

    // ── epilogue: binary merger + ringdown ──────────────────────────────
    const we = w("epilogue", 0.45, 0);
    const merge = clamp01(x.merge);
    const ring = clamp01(x.ring);
    orbitPhase += x.delta * (0.7 + 7 * merge * merge);
    const collapsed = smooth(0.9, 1, merge);
    u.uOrbit.value.set(we * (1 - collapsed * smooth(0, 0.15, ring)), lerp(W * 0.24, 0, Math.pow(merge, 1.4)), orbitPhase, M * lerp(0.06, 0.1, merge));
    // red + cyan beams: where they overlap at the merger, additive light goes white
    u.uOrbitB.value.set(W * 0.5, H * 0.5, 0.0, 0.5);
    u.uRingL.value.set(we * smooth(0, 0.06, ring) * (1 - ring), ring * Math.hypot(W, H) * 0.6, 0.11, 0);

    // ── analog: scanner wobble + glitch ─────────────────────────────────
    const speed = Math.min(Math.abs(x.velocity) / 3000, 1);
    let edge = 0;
    for (let i = 1; i < bounds.length; i++) edge = Math.max(edge, Math.exp(-(((g - bounds[i]) / 0.007) ** 2)));
    const burst = hash(Math.floor(time * 4)) > 0.975 ? 0.55 : 0;
    const glitch = clamp01(0.025 + 0.5 * speed + 0.55 * edge + burst);
    u.uJitter.value.set(Math.sin(time * 37) * 0.35 + (hash(time * 60) - 0.5) * 6 * glitch, Math.cos(time * 23) * 0.25);
    u.uLaserTime.value = time;
    return glitch;
  };
}
