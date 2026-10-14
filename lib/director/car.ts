// ── director / car ────────────────────────────────────────────────────────────
// A car on the timeline's road (about), seen from behind like an arcade chase
// cam: a low-poly wireframe in laser strokes — the white body, the two tail
// lights burning pearl, their glow streaking down the road toward you. It
// holds its place just ahead of you through the years, swaying a little in its
// lane while the road and the lamp posts beside it stream past, and only pulls
// away into the distance when "start over" comes up (`away`).
//
// It lives in the floor's own perspective (laser-shader.ts gridL): the horizon
// at hy, the vanishing point at vx, the camera one unit above the road, and a
// ground point at depth z drawn at y = hy + depth/z — so it sits on the rungs
// and between the rails at any screen size. Projected on the CPU each frame
// into the same segment slots as the room (laser-shader.ts roomL), so both
// tiers draw it. Its silhouette (the convex hull of the body, on screen) hides
// the road behind it — without that the floor's rungs run straight through
// the body and it dissolves into the grid.

import { CAR_HULL, ROOM_SEGS } from "@/lib/ascii-engine/gl/laser-shader";

export interface CarInput {
  W: number;
  H: number;
  /** horizon y px, vanishing point x px */
  hy: number;
  vx: number;
  /** the road's half-width at the bottom edge (the rails' half-gap), px */
  roadHalf: number;
  /** timeline progress 0–1 */
  tp: number;
  /** 0–1: the drive-off — 0 holding just ahead, 1 gone over the horizon */
  away: number;
  time: number;
  weight: number;
  body: number; // palette
  light: number;
  glow: number;
}

// [x1, y1, z1, x2, y2, z2, kind] in car units: half-width 1, y up from the
// road, z forward from the rear face. kind 0 body · 1 tail light · 2 road glow.
// Drawn for a glyph grid (cells are 8×22 px): rows are coarse, so the shape is
// carried by verticals and slants — one line at the bumper, one at the roof,
// the tail lights burning between them — and the shoulders run off toward the
// vanishing point for depth. Horizontal edges any closer than that would merge
// into one another and into the rungs.
type Seg = [number, number, number, number, number, number, 0 | 1 | 2];
const mirror = (s: Seg[]): Seg[] => s.flatMap((g) => [g, [-g[0], g[1], g[2], -g[3], g[4], g[5], g[6]] as Seg]);
const CAR: Seg[] = [
  [-1, 0.14, 0, 1, 0.14, 0, 0], // bumper
  [-0.55, 0.95, 1.4, 0.55, 0.95, 1.4, 0], // roof
  ...mirror([
    [-1, 0.14, 0, -1, 0.5, 0, 0], // body side
    [-1, 0.5, 0, -0.78, 0.56, 0.6, 0], // deck, in to the cabin
    [-0.78, 0.56, 0.6, -0.55, 0.95, 1.4, 0], // rear pillar
    [-1, 0.5, 0, -0.95, 0.48, 3.5, 0], // shoulder, off toward the horizon
    [-0.95, 0, 0.4, -0.95, 0.14, 0.4, 0], // tire, outer
    [-0.72, 0, 0.4, -0.72, 0.14, 0.4, 0], // tire, inner
    [-0.92, 0.36, -0.01, -0.5, 0.36, -0.01, 1], // tail light
    [-0.7, 0, -0.02, -0.7, 0, -2.6, 2], // its glow on the road
  ]),
];

/** Appends the car to `segs`/`segsB` from index n0 and writes its screen
 *  silhouette into `hull` (xy pairs); returns the segment count and hull size. */
export function buildCar(c: CarInput, segs: Float32Array, segsB: Float32Array, n0: number, hull: Float32Array): { n: number; hullN: number } {
  if (c.weight < 0.002) return { n: n0, hullN: 0 };
  const depth = Math.max(c.H - c.hy, 1);
  const road = c.roadHalf / depth; // road half-width, world units (camera height 1)
  const s = road * 0.46; // the car's half-width — about a quarter of the screen up close
  // close behind it through the years (easing back a touch by "now"), then
  // accelerating away over the horizon on the drive-off
  const away = Math.min(Math.max(c.away, 0), 1);
  const zc = 1.3 + 0.35 * Math.min(Math.max(c.tp, 0), 1) + 46 * Math.pow(away, 2.2);
  const t = c.time;
  const x0 = (Math.sin(t * 0.45) * 0.16 + Math.sin(t * 0.17 + 1) * 0.08) * road; // swaying in its lane
  const roll = -Math.cos(t * 0.45) * 0.04; // leaning into the sway
  const bob = Math.sin(t * 13) * 0.02 * s;
  const cr = Math.cos(roll), sr = Math.sin(roll);
  let n = n0;
  const P = (lx: number, ly: number, lz: number): [number, number, number] => {
    const X = x0 + (lx * cr - ly * sr) * s;
    const Y = ly <= 0 ? 0 : (lx * sr + ly * cr) * s + bob; // the road stays the road
    const Z = Math.max(zc + lz * s, 0.35);
    return [c.vx + (depth * X) / Z, c.hy + (depth * (1 - Y)) / Z, Z];
  };
  const pts: [number, number][] = [];
  for (const [x1, y1, z1, x2, y2, z2, kind] of CAR) {
    if (n >= ROOM_SEGS) break;
    const a = P(x1, y1, z1), b = P(x2, y2, z2);
    if (kind !== 2) pts.push([a[0], a[1]], [b[0], b[1]]);
    const pal = kind === 0 ? c.body : kind === 1 ? c.light : c.glow;
    // gone over the horizon: it fades out as it reaches the vanishing point
    const w = (kind === 0 ? 0.8 : kind === 1 ? 1.3 : 0.45) * c.weight * (1 - smoothstep(0.82, 1, away));
    // distance haze, like the rungs fading toward the horizon
    const fog = (z: number) => Math.exp(-Math.max(z - 1.3, 0) * 0.06);
    segs.set([a[0], a[1], b[0], b[1]], n * 4);
    segsB.set([pal, w * fog(a[2]), kind === 2 ? 0 : w * fog(b[2]), 0], n * 4);
    n++;
  }
  // the body's silhouette — only once it's really there (fading in, the road
  // shows through)
  const h = c.weight > 0.5 && c.away < 0.9 ? convexHull(pts) : [];
  const hullN = Math.min(h.length, CAR_HULL);
  for (let i = 0; i < hullN; i++) hull.set(h[Math.floor((i * h.length) / hullN)], i * 2);
  return { n, hullN };
}

// ── the roadside: lamp posts streaming past ───────────────────────────────────
// A row of posts on each side, just outside the rails, at the floor's own pace:
// the rungs sit where z·density + scroll is a whole number (laser-shader.ts
// gridL), and a post stands on every third rung — so posts and rungs move as
// one ground. Each is a post (body palette) and a lamp at its head (light
// palette, leaning over the road). They fade in from the haze and out as they
// pass beside you, so none ever pops.

export interface RoadsideInput {
  H: number;
  hy: number;
  vx: number;
  roadHalf: number;
  /** the floor's rung scroll (uGridL.z) and density (uGridB.z) */
  scroll: number;
  density: number;
  weight: number;
  post: number; // palette
  lamp: number;
}

const POSTS_PER_SIDE = 4;
const RUNGS_APART = 3;
const Z_NEAR = 0.45;

export function buildRoadside(r: RoadsideInput, segs: Float32Array, segsB: Float32Array, n0: number): number {
  if (r.weight < 0.002) return n0;
  const depth = Math.max(r.H - r.hy, 1);
  const road = r.roadHalf / depth;
  const P = (X: number, Y: number, Z: number) => [r.vx + (depth * X) / Z, r.hy + (depth * (1 - Y)) / Z];
  const gap = RUNGS_APART / r.density; // world units between posts
  const span = gap * POSTS_PER_SIDE;
  let n = n0;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < POSTS_PER_SIDE; i++) {
      if (n + 2 > ROOM_SEGS) return n;
      // a post on every RUNGS_APART-th rung, wrapping from just beside you back
      // out to the haze (the two sides staggered by half a gap)
      const k = i * gap + (side > 0 ? gap / 2 : 0) - r.scroll / r.density;
      const z = Z_NEAR + (((k - Z_NEAR) % span) + span) % span;
      const fade = smoothstep(Z_NEAR, Z_NEAR + 0.9, z) * (1 - smoothstep(Z_NEAR + span - gap, Z_NEAR + span, z));
      const w = r.weight * fade * Math.exp(-Math.max(z - 1.3, 0) * 0.07);
      if (w < 0.01) continue;
      const X = side * road * 1.32;
      const foot = P(X, 0, z), head = P(X, 1.12, z);
      const arm = P(X - side * road * 0.22, 1.08, z);
      segs.set([foot[0], foot[1], head[0], head[1]], n * 4);
      segsB.set([r.post, 0.75 * w, 0.75 * w, 0], n * 4);
      n++;
      segs.set([head[0], head[1], arm[0], arm[1]], n * 4);
      segsB.set([r.lamp, 1.1 * w, 1.1 * w, 0], n * 4);
      n++;
    }
  }
  return n;
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Andrew's monotone chain, counter-clockwise (y-down screen: clockwise on screen). */
function convexHull(p: [number, number][]): [number, number][] {
  if (p.length < 3) return [];
  const s = [...p].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [], upper: [number, number][] = [];
  for (const q of s) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  for (let i = s.length - 1; i >= 0; i--) {
    const q = s[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
