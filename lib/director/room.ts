// ── director / room ───────────────────────────────────────────────────────────
// The 3D laser room behind every page (flag: room): a corridor of floor and
// ceiling rails and rungs receding into fog, and four emitters on the ceiling
// sweeping beams down at the page's figure. Built in world space and projected
// on the CPU each frame — a handful of segments, so the camera can truly move:
// it parallaxes with the cursor, dollies forward with scroll (the rungs flow
// past), and sways a little on its own. The shader draws the projected
// segments in the same strokes as everything else (laser-shader.ts roomL), with
// fog carried in each end's weight.
//
// Palette follows the page: white rails for software, the shimmer for music,
// both for about — and on the landing the room is split like the site: the
// left half white, the right half pearl.

import { ROOM_SEGS } from "@/lib/ascii-engine/gl/laser-shader";
import type { StageRouteKind } from "@/lib/journey-store";

export interface RoomInput {
  page: StageRouteKind;
  W: number;
  H: number;
  p: number; // page scroll progress
  time: number;
  pointer: { x: number; y: number }; // −1…1
  /** screen point the beams converge on (the page's figure) */
  focus: { x: number; y: number };
  tech: (t: number) => number;
  sound: (t: number) => number;
  weight: number; // overall presence (0 = off)
}

const DEG = Math.PI / 180;
const FLOOR = -1.7, CEIL = 2.3, HALF_W = 4.5, FAR = 42;

/** Fills `segs` (a.xy, b.xy) and `segsB` (palette, wA, wB, 0) as flat arrays; returns the count. */
export function buildRoom(r: RoomInput, segs: Float32Array, segsB: Float32Array): number {
  if (r.weight < 0.002) return 0;
  const { W, H } = r;
  const f = H / 2 / Math.tan(30 * DEG); // 60° vertical fov
  const yaw = (r.pointer.x * 7 + Math.sin(r.time * 0.13) * 1.5) * DEG;
  const pitch = (-r.pointer.y * 4 - 3 + Math.sin(r.time * 0.17) * 0.8) * DEG;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const dolly = (r.p * 14 + r.time * 0.25) % 3; // rungs flow past as you scroll
  let n = 0;

  // world → camera (yaw then pitch), camera looks down −z
  const cam = (x: number, y: number, z: number): [number, number, number] => {
    const x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
    const y2 = cp * y - sp * z1, z2 = sp * y + cp * z1;
    return [x1, y2, z2];
  };
  const fog = (z: number) => Math.exp(-Math.max(-z - 2, 0) * 0.075);
  // project a world segment, clipped to the near plane; weights carry the fog
  const seg = (a: [number, number, number], b: [number, number, number], pal: number, w: number) => {
    if (n >= ROOM_SEGS) return;
    let A = cam(...a), B = cam(...b);
    const NEAR = -0.4;
    if (A[2] > NEAR && B[2] > NEAR) return;
    if (A[2] > NEAR || B[2] > NEAR) {
      const t = (NEAR - A[2]) / (B[2] - A[2]);
      const C: [number, number, number] = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, NEAR];
      if (A[2] > NEAR) A = C; else B = C;
    }
    const px = (P: [number, number, number]) => [W / 2 + (P[0] / -P[2]) * f, H / 2 - (P[1] / -P[2]) * f];
    const [ax, ay] = px(A), [bx, by] = px(B);
    segs.set([ax, ay, bx, by], n * 4);
    segsB.set([pal, w * fog(A[2]), w * fog(B[2]), 0], n * 4);
    n++;
  };

  const side = (x: number, t = 0.55) =>
    r.page === "software" || r.page === "project" ? r.tech(t + 0.1)
    : r.page === "music" || r.page === "show" ? r.sound(t)
    : r.page === "home" ? (x < 0 ? r.tech(t + 0.1) : r.sound(t))
    : x < 0 ? r.tech(t + 0.1) : r.sound(t); // about: both

  const w = r.weight;
  // floor + ceiling rails
  for (let i = 0; i <= 6; i++) {
    const x = -HALF_W + (i * 2 * HALF_W) / 6;
    seg([x, FLOOR, -1], [x, FLOOR, -FAR], side(x, 0.4), 0.55 * w);
    if (i % 2 === 0) seg([x, CEIL, -1], [x, CEIL, -FAR], side(x, 0.3), 0.3 * w);
  }
  // floor rungs, flowing toward the camera
  for (let k = 0; k < 9; k++) {
    const z = -(k * 3 + 3 - dolly);
    seg([-HALF_W, FLOOR, z], [HALF_W, FLOOR, z], side(k % 2 ? 1 : -1, 0.35), 0.45 * w);
  }
  // emitters on the ceiling sweep beams at the figure: unproject the focus to a
  // point 9 units deep, then fan each beam around it
  const fz = -9;
  const fx = ((r.focus.x - W / 2) / f) * -fz, fy = (-(r.focus.y - H / 2) / f) * -fz;
  const em: [number, number][] = [[-HALF_W * 0.85, -7], [HALF_W * 0.85, -7], [-HALF_W * 0.85, -18], [HALF_W * 0.85, -18]];
  em.forEach(([ex, ez], i) => {
    const sweep = Math.sin(r.time * (0.4 + i * 0.07) + i * 1.7) * 1.6;
    const tx = fx + sweep, ty = fy + Math.cos(r.time * 0.3 + i) * 0.6;
    // aim through the focus and on to the floor
    const dx = tx - ex, dy = ty - CEIL, dz = fz - ez;
    const k = (FLOOR - CEIL) / Math.min(dy, -0.2);
    seg([ex, CEIL, ez], [ex + dx * k, FLOOR, ez + dz * k], side(ex, 0.75), 0.75 * w);
  });
  return n;
}
