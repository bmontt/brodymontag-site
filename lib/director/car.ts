// ── director / car ────────────────────────────────────────────────────────────
// A car on the timeline's road (about), seen from behind like an arcade chase
// cam: a low-poly wireframe in laser strokes — the white body, the two tail
// lights burning pearl, their glow streaking down the road toward you. It
// drives on as the years go by, pulling away toward the horizon by "now", and
// sways a little in its lane.
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
  // close behind it in 2021, pulling away toward the horizon by now
  const zc = 1.3 + 4.4 * Math.pow(Math.min(Math.max(c.tp, 0), 1), 1.1);
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
    const w = (kind === 0 ? 0.8 : kind === 1 ? 1.3 : 0.45) * c.weight;
    // distance haze, like the rungs fading toward the horizon
    const fog = (z: number) => Math.exp(-Math.max(z - 1.3, 0) * 0.06);
    segs.set([a[0], a[1], b[0], b[1]], n * 4);
    segsB.set([pal, w * fog(a[2]), kind === 2 ? 0 : w * fog(b[2]), 0], n * 4);
    n++;
  }
  // the body's silhouette — only once it's really there (fading in, the road
  // shows through)
  const h = c.weight > 0.5 ? convexHull(pts) : [];
  const hullN = Math.min(h.length, CAR_HULL);
  for (let i = 0; i < hullN; i++) hull.set(h[Math.floor((i * h.length) / hullN)], i * 2);
  return { n, hullN };
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
