// ── director / about scene ────────────────────────────────────────────────────
// The about page as a place rather than a figure in a box: the floor of the
// timeline's road, seen first as a sheet of spacetime. It runs from a high
// horizon past every edge of the screen and into the haze. The two signals,
// the white hoop and the pearl one, orbit on it ahead of you, each over the
// well its weight presses into the grid (its rim in the hoop's color), and the
// orbit sends ripples out across the sheet in rings, white and pearl by turns,
// that roll under you and off the screen. Reading carries you over the sheet
// toward them: the orbit tightens, the ripples come faster, the wells run
// together.
// At "Let's work together." they plunge and fuse; the ringdown's ring races out
// over the sheet and past you, and the sheet goes still behind it — level, the
// road's floor. What they fused into lifts off it and settles onto the horizon
// as a sun, banded white and pearl. As the timeline rises the camera tilts up
// to the road's horizon and the fusion's debris lands on it as the rails and
// the car, which drives off into the sun at the end.
//
// The sheet is the floor primitive itself (laser-shader.ts gridL → sheetL),
// level when its wells and ripples are at rest, so the hand-off to the road is
// the same lines under the same horizon. This module damps the sheet's state,
// projects the pair into it — the floor's own perspective (car.ts): the camera
// one unit above the floor, a point at height Y and depth Z drawn at
// y = hy + depth·(1 − Y)/Z — and writes the placed hoops (uOrbitD), the
// sheet (uSheet*) and the sun (uSun*). The director (laser.ts) still tells the story: where the
// pair is on screen, how tight the orbit, when they fuse.

import type { LaserUniforms } from "@/lib/ascii-engine/gl/laser-shader";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** the floor's horizon: high while it's spacetime (looking down on the sheet),
 *  the road's own (laser.ts) once the timeline has risen */
export const sheetHorizon = (H: number, road: number) => H * lerp(0.34, 0.56, clamp01(road));

/** how high a hoop floats over the sheet, in its own radii */
const HOVER = 1.15;
/** the ripples' speed over the sheet, floor units/s */
const WAVE_C = 1.4;
/** the ringdown front's speed */
const RING_C = 3.2;

/** Where hoops of radius `ring` (floor units) `Z` units away sit on screen
 *  (their center's y) under the horizon `hy`, and their radius px. */
export function placePair(H: number, hy: number, Z: number, ring: number) {
  const depth = H - hy;
  return { y: hy + (depth * (1 - HOVER * ring)) / Z, r: (ring * depth) / Z };
}

/** The other way: how far away hoops of radius `ring` are when their center is at `y`. */
export function pairDistance(H: number, hy: number, y: number, ring: number) {
  const reach = (H - hy) * (1 - HOVER * ring);
  return reach / Math.max(y - hy, reach / 9);
}

export interface SceneInput {
  W: number;
  H: number;
  time: number;
  dt: number; // s (0 = reduced motion: no easing, a still frame)
  /** this is the about page (the sheet and the placed hoops fade in) */
  on: boolean;
  /** 0 → 1: the road takes over — the sheet levels and the camera tilts up to the road's horizon */
  road: number;
  /** the vanishing point's x px */
  vx: number;
  /** the pair, as the director damps it: the hoops' visual center px, each body's
   *  distance from it px (Kepler), the hoop radius px, the orbit's phase and rate rad/s */
  ox: number;
  oy: number;
  dist: number;
  ringR: number;
  phase: number;
  rate: number;
  /** 0–1: the plunge */
  merge: number;
  /** s since they fused (< 0: not yet) */
  ringAge: number;
  /** 0 → 1: the merged hoop becoming the sun on the horizon */
  sun: number;
  /** how far the sun has set (0 as it arrives, ~1 by "now", a little more on the drive-off) */
  sunSet: number;
  /** the sun's band palettes: white top, white bottom, pearl top, pearl bottom */
  sunPal: [number, number, number, number];
  /** a narrow screen: a lighter sheet, under the text */
  compact: boolean;
  /** crest palettes: the white arm, the pearl arm */
  palA: number;
  palB: number;
}

export function createAboutScene() {
  // damped sheet state (floor units)
  const s = { on: 0, hy: -1, well: 0, amp: 0, crest: 0, weight: 0, k: 1, grid: 0 };

  /** Writes the sheet and the placed hoops; returns the horizon the floor and the road use. */
  return function write(u: LaserUniforms, x: SceneInput): number {
    const { H, dt } = x;
    const still = dt <= 0;
    const ease = (rate: number) => (still ? 1 : 1 - Math.exp(-rate * Math.min(dt, 0.1)));
    const to = (k: keyof typeof s, v: number, rate: number) => { s[k] += (v - s[k]) * ease(rate); };
    const on = x.on ? 1 : 0;
    const hyT = sheetHorizon(H, x.road);
    if (s.hy < 0) s.hy = hyT;
    to("on", on, 3);
    to("hy", hyT, 6);
    if (s.on < 0.005) {
      s.on = 0;
      u.uOrbitC.value.w = 0;
      u.uSun.value.w = 0;
      u.uSheet.value.set(0, 0, 0, 0);
      u.uSheetC.value.set(0, 0, 0, 0);
      return H * 0.56;
    }
    const level = 1 - clamp01(x.road); // the sheet's own life: gone once the road is down
    const fused = x.ringAge >= 0;
    // the wells deepen as the pair closes in, then relax once they've fused
    to("well", on * level * (x.compact ? 0.3 : 0.42) * (1 + 0.3 * x.merge) * (fused ? 1 - smooth(0, 1.4, x.ringAge) : 1), 4);
    // ripples swell through the chirp; the crests trace them, dim
    to("amp", on * level * (x.compact ? 0.05 : 0.085) * (0.6 + 0.8 * x.merge), 4);
    to("crest", on * level * (x.compact ? 0.4 : 0.7), 3);
    // the grid stays through the hand-off: the road's floor (laser.ts gW) outweighs it once it's down
    to("weight", on * (x.compact ? 0.24 : 0.34), 3);
    to("grid", on * level, 3);
    // the ripples' wavelength follows the orbit's pace (two crests per orbit,
    // rolling out at WAVE_C), eased so the far crests never whip round
    to("k", Math.min(Math.max((2 * x.rate) / WAVE_C, 3.2), 8), 0.8);

    const hy = s.hy, depth = Math.max(H - hy, 1), vx = x.vx;
    // the pair's center: the ground point under the hoops' visual center
    const ground = x.oy + HOVER * x.ringR;
    const Zc = depth / Math.max(ground - hy, depth / 14);
    const Xc = ((x.ox - vx) * Zc) / depth;
    const d = (x.dist * Zc) / depth, R = (x.ringR * Zc) / depth;
    const c = Math.cos(x.phase), sn = Math.sin(x.phase);
    // the orbit lies flat on the sheet: sin > 0 is the near side (laser-shader.ts orbitL)
    const aX = Xc + d * c, aZ = Math.max(Zc - d * sn, 0.55);
    const bX = Xc - d * c, bZ = Math.max(Zc + d * sn, 0.55);
    const lift = 1 - HOVER * R;
    const pa = [vx + (depth * aX) / aZ, hy + (depth * lift) / aZ, (R * depth) / aZ];
    const pb = [vx + (depth * bX) / bZ, hy + (depth * lift) / bZ, (R * depth) / bZ];
    // fading in from (or out to) the plain figure, so a page change never jumps
    const z = Math.min(Math.max(x.dist / Math.max(x.ringR, 1), 0), 1) * sn;
    const t = s.on;
    u.uOrbitD.value.set(
      lerp(x.ox + c * x.dist, pa[0], t), lerp(x.oy + 0.42 * sn * x.dist, pa[1], t),
      lerp(x.ox - c * x.dist, pb[0], t), lerp(x.oy - 0.42 * sn * x.dist, pb[1], t),
    );
    u.uOrbit.value.w = lerp(x.ringR * (1 + 0.14 * z), pa[2], t);
    u.uOrbitC.value.w = Math.max(lerp(x.ringR * (1 - 0.14 * z), pb[2], t), 0.5);

    // the remnant: once they've fused the merged hoop lifts off the sheet,
    // swelling, clears the horizon and settles onto it at the vanishing point —
    // a sun the road runs into, setting a little further through the years.
    // It's at infinity, so it rides the horizon as the camera tilts to the road.
    if (x.sun > 0) {
      const e = x.sun;
      const lift = smooth(0, 0.55, e), settle = smooth(0.45, 1, e);
      const R = lerp(x.ringR, Math.min(H * 0.17, x.W * 0.22), smooth(0, 0.8, e));
      const clear = hy - 1.25 * R, rest = hy - R * (0.45 - 0.3 * x.sunSet);
      u.uSun.value.set(lerp(x.ox, vx, lift), lerp(lerp(x.oy, clear, lift), rest, settle), R, 0.8 * t * smooth(0, 0.1, e));
      // the floor hides what's below the horizon once it's out over it
      u.uSunB.value.set(lift >= 1 ? hy : 1e5, smooth(0.3, 0.9, e), x.time * 0.35, 0);
      u.uSunC.value.set(...x.sunPal);
    } else u.uSun.value.w = 0;

    const ringFront = fused ? x.ringAge * RING_C : 0;
    const ring = fused ? 1.2 * Math.exp(-x.ringAge * 0.5) * (1 - smooth(4, 6, x.ringAge)) * t : 0;
    u.uSheet.value.set(s.well, 0.8 + 0.8 * R, s.amp, s.crest);
    u.uSheetB.value.set(aX, aZ, bX, bZ);
    u.uSheetC.value.set(2 * x.phase, s.k, ringFront, ring);
    u.uSheetD.value.set(x.palA, x.palB, Xc, Zc);
    // the floor itself: the sheet's square grid, easing into the road's
    // (rails a quarter road apart, rungs 1.1 a unit — laser.ts) as it levels
    const g = u.uGridL.value, gb = u.uGridB.value;
    g.x = Math.max(g.x, s.weight);
    g.y = hy;
    gb.x = vx;
    const dens = x.compact ? 2.4 : 3.2;
    gb.y = lerp(gb.y, depth / dens, s.grid);
    gb.z = lerp(gb.z, dens, s.grid);
    gb.w = s.grid;
    return hy;
  };
}
