// ── director / rig ────────────────────────────────────────────────────────────
// Camera poses as keyframes on the journey's scroll progress. A pure function
// of globalProgress, evaluated by the stage every frame — GSAP's global
// ScrollTrigger stays the only thing that reads scroll (the "single writer").
//
// Poses use an orbit parameterization rather than world positions: easier to
// author (tilt, dolly-zoom, roll) and interpolates without the camera cutting
// corners. `dist: "frame"` means "the distance at which the viewport height
// exactly frames the sheet at this fov" — two "frame" keys in a row produce a
// true dolly-zoom (framing held while the fov changes).

export interface Pose {
  /** look target on the sheet, px units (x right, y up) */
  tx: number;
  ty: number;
  /** degrees above the sheet (90 = straight down, <0 = from underneath) */
  elev: number;
  /** degrees; rotates the approach direction around the vertical axis */
  az: number;
  dist: number | "frame";
  /** radians about the view axis */
  roll: number;
  fov: number;
  /** 0 = flat 2D-identical field, 1 = full 3D relief + real lighting */
  relief: number;
  /** pointer mouse-look strength 0–1 */
  look: number;
  /** stage: inspiral 0→1 and ringdown 0→1 */
  merge: number;
  ring: number;
}

export type Anchor = { g: number } | { chapter: string; t: number };

export interface Station {
  at: Anchor;
  pose: Partial<Pose>;
  /** easing for the segment ARRIVING at this station (default smoothstep) */
  ease?: (t: number) => number;
}

export const FLAT: Pose = {
  tx: 0, ty: 0, elev: 90, az: 0, dist: "frame", roll: 0, fov: 4,
  relief: 0, look: 0, merge: 0, ring: 0,
};

export const smooth = (t: number) => t * t * (3 - 2 * t);
export const smoother = (t: number) => smooth(smooth(t));
export const linear = (t: number) => t;

const DEG = Math.PI / 180;
export const framingDist = (fov: number, viewH: number) => viewH / 2 / Math.tan((fov * DEG) / 2);

/** Resolve an anchor to global progress given chapter start bounds. */
export function anchorToG(a: Anchor, chapterIds: readonly string[], bounds: readonly number[]): number {
  if ("g" in a) return a.g;
  const i = chapterIds.indexOf(a.chapter);
  if (i < 0) return 0;
  const start = bounds[i] ?? 0;
  const end = i + 1 < bounds.length ? bounds[i + 1] : 1;
  return start + (end - start) * a.t;
}

export interface ResolvedTrack { g: number[]; poses: Pose[]; eases: ((t: number) => number)[]; }

/** Fill each station from the previous one (keys carry forward) and resolve anchors. */
export function resolveTrack(
  stations: readonly Station[],
  chapterIds: readonly string[],
  bounds: readonly number[],
): ResolvedTrack {
  const g: number[] = [];
  const poses: Pose[] = [];
  const eases: ((t: number) => number)[] = [];
  let prev = FLAT;
  for (const s of stations) {
    const pose = { ...prev, ...s.pose };
    g.push(anchorToG(s.at, chapterIds, bounds));
    poses.push(pose);
    eases.push(s.ease ?? smooth);
    prev = pose;
  }
  return { g, poses, eases };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Evaluate the track at global progress `p` into `out` (no allocation). */
export function poseAt(track: ResolvedTrack, p: number, viewH: number, out: Pose): Pose {
  const { g, poses, eases } = track;
  const n = poses.length;
  if (n === 0) return Object.assign(out, FLAT);
  let i = 0;
  while (i < n - 1 && p >= g[i + 1]) i++;
  const A = poses[i];
  if (i === n - 1 || p <= g[i]) {
    Object.assign(out, A);
    out.dist = A.dist === "frame" ? framingDist(A.fov, viewH) : A.dist;
    return out;
  }
  const B = poses[i + 1];
  const span = g[i + 1] - g[i];
  const e = eases[i + 1](span > 1e-6 ? (p - g[i]) / span : 1);

  out.tx = lerp(A.tx, B.tx, e);
  out.ty = lerp(A.ty, B.ty, e);
  out.elev = lerp(A.elev, B.elev, e);
  out.az = lerp(A.az, B.az, e);
  out.roll = lerp(A.roll, B.roll, e);
  out.fov = lerp(A.fov, B.fov, e);
  out.relief = lerp(A.relief, B.relief, e);
  out.look = lerp(A.look, B.look, e);
  out.merge = lerp(A.merge, B.merge, e);
  out.ring = lerp(A.ring, B.ring, e);
  // "frame" ends track the interpolated fov, so frame→frame is a true dolly-zoom
  const dA = A.dist === "frame" ? framingDist(out.fov, viewH) : A.dist;
  const dB = B.dist === "frame" ? framingDist(out.fov, viewH) : B.dist;
  out.dist = lerp(dA, dB, e);
  return out;
}
