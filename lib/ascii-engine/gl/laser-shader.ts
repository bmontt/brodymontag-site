/* ─── ASCII engine (GL) — laser layer ───────────────────────────────────────── */

import type { Texture } from "three";
import { Vec2 as Vector2, Vec4 as Vector4 } from "../vec";

/** max projected room segments per frame (lib/director/room.ts) */
export const ROOM_SEGS = 64;

/** max points of the car's silhouette (lib/director/car.ts) */
export const CAR_HULL = 12;

/**
 * The journey's background as an analog laser show written in glyphs: thin
 * beams on black instead of a screen-filling field. Evaluated per cell in the
 * cell pass (one fragment per cell), so it costs nothing at full resolution.
 *
 * Every primitive is measured in css px, then converted to *cell* units along
 * its normal — cells are 8×22, so a beam is one glyph thick in any direction.
 * The beam's tangent picks the glyph (─ ╲ │ ╱); the falloff around it scatters
 * flickering · as haze. One parametric figure per chapter, crossfaded and
 * always moving (lib/director/laser.ts drives the uniforms from scroll).
 *
 * Color is a palette coordinate, not a hue — two monochrome scales:
 *   [0, 0.5)  tech  — black → grey → white
 *   [0.5, 1)  sound — the site's pearlescent shimmer (sky blue ↔ orchid), dark → luminous → white-hot
 * (the compose pass maps it; see laserColor in ascii-shaders.ts). Figures:
 *   scope  — an oscilloscope trace (hero)
 *   segs   — segments projected from 3D on the CPU: the room, the car, and
 *            the software page's network (lib/director/software-figure.ts)
 *   fan    — club fan beams sweeping from the floor (monty)
 *   grid   — a perspective laser floor that runs with the year track (timeline)
 *   orbit  — two beam rings in a decaying binary orbit, then the ringdown (merger)
 */

export interface LaserUniforms {
  uLaserMix: { value: number };
  uView: { value: Vector2 };
  uLaserTime: { value: number };
  uLaserSlots: { value: Vector4 };
  uLaserDot: { value: number };
  uScope: { value: Vector4 };
  uScopeB: { value: Vector4 };
  uScopeC: { value: Vector4 };
  uScopeD: { value: Vector4 };
  uFan: { value: Vector4 };
  uFanB: { value: Vector4 };
  uFanC: { value: Vector4 };
  uGridL: { value: Vector4 };
  uGridB: { value: Vector4 };
  uRails: { value: Vector4 };
  uOrbit: { value: Vector4 };
  uOrbitB: { value: Vector4 };
  uOrbitC: { value: Vector4 };
  uRingL: { value: Vector4 };
  /** projected segments (a.xy, b.xy px) + (palette, weight at a, weight at b, packet): the room,
   *  the car, the software figure. packet 0 = none, 1 + t = a pulse at t along it, < 0 = a node
   *  (a diamond: center xy, half-size zw) */
  uSegs: { value: Vector4[] };
  uSegsB: { value: Vector4[] };
  uSegN: { value: number };
  /** the car's silhouette on screen (convex hull, px) · its point count (0 = none) */
  uCarHull: { value: Vector2[] };
  uCarN: { value: number };
  /** shader transition: origin px (xy), radius px, ragged band px · (alpha, palette, —, —) */
  uWipe: { value: Vector4 };
  uWipeB: { value: Vector4 };
  /** 3D title: mask texture · center px (xy), width px, alpha · (palette, mask h/w, rotation, —) */
  uTitleTex: { value: Texture | null };
  uTitle: { value: Vector4 };
  uTitleB: { value: Vector4 };
}

export function makeLaserUniforms(): LaserUniforms {
  return {
    uLaserMix: { value: 0 },
    uView: { value: new Vector2(1, 1) },
    uLaserTime: { value: 0 },
    uLaserSlots: { value: new Vector4() },
    uLaserDot: { value: 0 },
    uScope: { value: new Vector4() },
    uScopeB: { value: new Vector4() },
    uScopeC: { value: new Vector4() },
    uScopeD: { value: new Vector4(-1, 1, 0, 0) },
    uFan: { value: new Vector4() },
    uFanB: { value: new Vector4() },
    uFanC: { value: new Vector4() },
    uGridL: { value: new Vector4() },
    uGridB: { value: new Vector4() },
    uRails: { value: new Vector4() },
    uOrbit: { value: new Vector4() },
    uOrbitB: { value: new Vector4() },
    uOrbitC: { value: new Vector4(0, 0, 1, 0) },
    uRingL: { value: new Vector4() },
    uSegs: { value: Array.from({ length: ROOM_SEGS }, () => new Vector4()) },
    uSegsB: { value: Array.from({ length: ROOM_SEGS }, () => new Vector4()) },
    uSegN: { value: 0 },
    uCarHull: { value: Array.from({ length: CAR_HULL }, () => new Vector2()) },
    uCarN: { value: 0 },
    uWipe: { value: new Vector4() },
    uWipeB: { value: new Vector4() },
    uTitleTex: { value: null }, // the 3D tier binds its mask (ascii-renderer.ts)
    uTitle: { value: new Vector4() },
    uTitleB: { value: new Vector4(0, 0.25, 0, 0) },
  };
}


export const laserChunk = /* glsl */ `
uniform float uLaserMix;           // 0 = wave field, 1 = laser layer
uniform vec2  uView;               // css px
uniform float uLaserTime;
uniform vec4  uLaserSlots;         // atlas slots: ─ │ ╲ ╱
uniform float uLaserDot;           // atlas slot: ·
uniform vec4  uScope;              // weight, amplitude px, cycles across the view, phase
uniform vec4  uScopeB;             // baseline y px, hue 0–1, harmonics 0–1, hue of the second trace
uniform vec4  uScopeC;             // second trace: weight, phase offset, frequency ratio, amplitude ratio
uniform vec4  uScopeD;             // split x px (< 0 = none: both traces span the view), flatten width px
uniform vec4  uFan;                // weight, beam count, spread rad, sweep rad
uniform vec4  uFanB;               // origin px (xy), hue, length px
uniform vec4  uFanC;               // hue spread across the beams, far fade 0–1, pulse position (0 origin … 1 tip), pulse strength
uniform vec4  uGridL;              // weight, horizon y px, scroll, hue
uniform vec4  uGridB;              // vanishing x px, rail spacing px (at the bottom), rung density, —
uniform vec4  uRails;              // two lit rails to the vanishing point: weight, half-gap px at the bottom, hue A, hue B
uniform vec4  uOrbit;              // weight, separation px, phase rad, ring radius px
uniform vec4  uOrbitB;             // center px (xy), hue A, hue B
uniform vec4  uOrbitC;             // hoop spin A rad, hoop spin B rad, roundness (1 = plain circles), —
uniform vec4  uRingL;              // weight, radius px, hue, —
uniform vec4  uSegs[${ROOM_SEGS}];    // the room: projected segments a.xy, b.xy (px)
uniform vec4  uSegsB[${ROOM_SEGS}];   // palette, weight at a, weight at b (depth fog), packet (0 = none, 1 + t along it; < 0: a node, see roomL)
uniform float uSegN;
uniform vec2  uCarHull[${CAR_HULL}];  // the car's silhouette (px): convex, counter-clockwise
uniform float uCarN;               // its point count (0 = no car)
uniform vec4  uWipe;               // transition: origin px (xy), radius px, ragged band px
uniform vec4  uWipeB;              // alpha, palette
uniform sampler2D uTitleTex;       // the page title as a mask (white on black)
uniform vec4  uTitle;              // center px (xy), width px, alpha
uniform vec4  uTitleB;             // palette, mask h/w, rotation rad

struct Hit { float score; float d; vec2 n; float hue; float w; };

// A px-space candidate (distance + unit normal) → cell units; the strongest
// (nearest, weighted) primitive wins the cell.
void take(inout Hit h, float dpx, vec2 n, float hue, float w) {
  if (w < 0.002) return;
  float dc = dpx * length(n / uCell);
  float score = dc - 1.5 * w;
  if (score < h.score) { h.score = score; h.d = dc; h.n = n; h.hue = hue; h.w = w; }
}

float scopeF(float x, float ph, float fr, float amp) {
  float k = 6.2831853 * uScope.z * fr / uView.x;
  return uScope.y * amp * (sin(x * k + ph) * 0.62
    + sin(x * k * 2.31 - ph * 1.37) * 0.28 * uScopeB.z
    + sin(x * k * 5.7 + ph * 2.1) * 0.1 * uScopeB.z);
}

// side: -1 = only left of the split, 1 = only right of it, 0 = everywhere.
// With a split, both traces flatten as they reach it — two signals meeting.
void traceL(inout Hit h, vec2 p, float ph, float fr, float amp, float hue, float w, float side) {
  if (uScopeD.x >= 0.0) {
    if (side * (p.x - uScopeD.x) < 0.0) return;
    amp *= smoothstep(0.0, uScopeD.y, abs(p.x - uScopeD.x));
  }
  float f = scopeF(p.x, ph, fr, amp);
  float df = (scopeF(p.x + 1.0, ph, fr, amp) - scopeF(p.x - 1.0, ph, fr, amp)) * 0.5;
  float dy = p.y - (uScopeB.x + f);
  take(h, abs(dy) / sqrt(1.0 + df * df), normalize(vec2(-df, 1.0)), hue, w);
}

// one or two traces on a shared baseline (the two signals)
void scopeL(inout Hit h, vec2 p) {
  if (uScope.x < 0.002 && uScopeC.x < 0.002) return;
  if (uScope.x > 0.002) traceL(h, p, uScope.w, 1.0, 1.0, uScopeB.y, uScope.x, -1.0);
  if (uScopeC.x > 0.002) traceL(h, p, uScope.w + uScopeC.y, uScopeC.z, uScopeC.w, uScopeB.w, uScopeC.x, 1.0);
}

void fanL(inout Hit h, vec2 p) {
  if (uFan.x < 0.002) return;
  int n = int(uFan.y + 0.5);
  float best = 1e9, bk = 0.0, bt = 0.0; vec2 bn = vec2(0.0, 1.0);
  for (int i = 0; i < 12; i++) {
    if (i >= n) break;
    float k = n > 1 ? float(i) / float(n - 1) - 0.5 : 0.0;
    float ang = -1.5707963 + uFan.w + k * uFan.z;                    // -π/2 = straight up (y-down)
    vec2 ab = vec2(cos(ang), sin(ang)) * uFanB.w;
    float t = clamp(dot(p - uFanB.xy, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
    vec2 dv = p - (uFanB.xy + ab * t);
    float d = length(dv);
    if (d < best) { best = d; bn = d > 1e-3 ? dv / d : normalize(vec2(-ab.y, ab.x) + 1e-5); bk = k; bt = t; }
  }
  float lo = uFanB.z < 0.5 ? 0.0 : 0.5;
  // away from the music page the beams fade as they rise — their tops far
  // away; a pulse runs up every beam
  float far = mix(1.0, pow(1.0 - bt, 1.6), uFanC.y);
  float pd = (bt - uFanC.z) / 0.07;
  take(h, best, bn, clamp(uFanB.z + bk * uFanC.x, lo, lo + 0.499), uFan.x * far * (1.0 + uFanC.w * exp(-pd * pd)));
}

void gridL(inout Hit h, vec2 p) {
  if (uGridL.x < 0.002) return;
  float hy = uGridL.y;
  float below = p.y - hy;
  // the horizon itself — one bright scan line
  take(h, abs(below), vec2(0.0, 1.0), uGridL.w, uGridL.x * 0.9);
  if (below <= 1.0) return;
  float depth = max(uView.y - hy, 1.0);
  float fade = smoothstep(0.0, 0.3, below / depth) * uGridL.x;      // rungs crowd at the horizon
  // rungs: depth z = depth/below; a rung at every integer of z·density + scroll
  float u = (depth / below) * uGridB.z + uGridL.z;
  float fu = fract(u);
  float dz = min(fu, 1.0 - fu) / uGridB.z;
  take(h, dz * below * below / depth, vec2(0.0, 1.0), uGridL.w, fade);
  // rails: lines through the vanishing point, evenly spaced along the bottom edge
  float ri = floor((p.x - uGridB.x) / below * depth / uGridB.y + 0.5);
  vec2 dir = normalize(vec2(ri * uGridB.y, depth));
  vec2 rel = p - vec2(uGridB.x, hy);
  take(h, abs(rel.x * dir.y - rel.y * dir.x), vec2(dir.y, -dir.x), uGridL.w, fade);
  // the two signals as lit rails, converging on the vanishing point
  if (uRails.x > 0.002) {
    for (int k = 0; k < 2; k++) {
      float side = k == 0 ? -1.0 : 1.0;
      vec2 rd = normalize(vec2(side * uRails.y, depth));
      take(h, abs(rel.x * rd.y - rel.y * rd.x), vec2(rd.y, -rd.x), k == 0 ? uRails.z : uRails.w, uRails.x);
    }
  }
}

void circleL(inout Hit h, vec2 p, vec2 c, float r, float hue, float w) {
  vec2 dv = p - c;
  float L = length(dv);
  take(h, abs(L - r), L > 1e-3 ? dv / L : vec2(0.0, 1.0), hue, w);
}

// a hoop: a circle spinning about an in-plane axis, seen as an ellipse whose
// minor axis breathes with the spin (round = 1: a plain circle). First-order
// distance to the ellipse — exact enough within the couple of cells that light.
void hoopL(inout Hit h, vec2 p, vec2 c, float r, float spin, float axis, float round, float hue, float w) {
  float ca = cos(axis), sa = sin(axis);
  vec2 q = p - c;
  q = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);
  vec2 ab = vec2(r, r * mix(0.22 + 0.78 * abs(cos(spin)), 1.0, round));
  vec2 u = q / ab;
  float L = length(u);
  if (L < 1e-4) return;
  vec2 g = u / ab;
  float gl = max(length(g), 1e-5);
  vec2 n = g / gl;
  take(h, abs(L - 1.0) * L / gl, vec2(ca * n.x - sa * n.y, sa * n.x + ca * n.y), hue, w);
}

void orbitL(inout Hit h, vec2 p) {
  if (uOrbit.x >= 0.002) {
    // the binary, its orbit inclined toward you: the body in front is a
    // touch larger and brighter, and wins where they cross
    vec2 o = vec2(cos(uOrbit.z), sin(uOrbit.z) * 0.42) * uOrbit.y;
    float z = sin(uOrbit.z) * clamp(uOrbit.y / max(uOrbit.w, 1.0), 0.0, 1.0);
    hoopL(h, p, uOrbitB.xy + o, uOrbit.w * (1.0 + 0.14 * z), uOrbitC.x, uOrbitC.x * 0.37, uOrbitC.z, uOrbitB.z, uOrbit.x * (1.0 + 0.3 * z));
    hoopL(h, p, uOrbitB.xy - o, uOrbit.w * (1.0 - 0.14 * z), uOrbitC.y, -uOrbitC.y * 0.29, uOrbitC.z, uOrbitB.w, uOrbit.x * (1.0 - 0.3 * z));
  }
  if (uRingL.x >= 0.002) circleL(h, p, uOrbitB.xy, uRingL.y, uRingL.z, uRingL.x);
}

// the room: segments projected from 3D on the CPU each frame (perspective,
// parallax, depth fog in the per-end weights)
void roomL(inout Hit h, vec2 p) {
  int n = int(uSegN + 0.5);
  for (int i = 0; i < ${ROOM_SEGS}; i++) {
    if (i >= n) break;
    vec4 sg = uSegs[i];
    vec4 sb = uSegsB[i];
    if (sb.w < -0.5) {
      // a node (packet < 0): a diamond's outline around sg.xy, half-width
      // sg.z, half-height sg.w (px) — ╱╲ over ╲╱
      vec2 q = p - sg.xy;
      if (abs(q.x) > sg.z + 70.0 || abs(q.y) > sg.w + 70.0) continue;
      vec2 ea = vec2(sg.z, 0.0), e = vec2(-sg.z, sg.w);
      float t = clamp(dot(abs(q) - ea, e) / max(dot(e, e), 1e-4), 0.0, 1.0);
      vec2 dv = abs(q) - (ea + e * t);
      float d = length(dv);
      vec2 n = (d > 1e-3 ? dv / d : normalize(vec2(sg.w, sg.z) + 1e-5)) * vec2(q.x < 0.0 ? -1.0 : 1.0, q.y < 0.0 ? -1.0 : 1.0);
      take(h, d, n, sb.x, sb.y);
      continue;
    }
    vec2 ab = sg.zw - sg.xy;
    float t = clamp(dot(p - sg.xy, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
    vec2 dv = p - (sg.xy + ab * t);
    float d = length(dv);
    if (d > 70.0) continue;
    float w = mix(sb.y, sb.z, t);
    // a packet riding the segment (w = 1 + its position along it): a bright
    // pulse a couple of glyphs long
    if (sb.w > 0.5) { float pd = (t - (sb.w - 1.0)) * length(ab) / 16.0; w *= 1.0 + 2.2 * exp(-pd * pd); }
    take(h, d, d > 1e-3 ? dv / d : normalize(vec2(-ab.y, ab.x) + 1e-5), sb.x, w);
  }
}

// inside the car's silhouette (grown by about a glyph, so a dark halo parts
// it from the rungs): the road behind it is hidden
bool inCar(vec2 p) {
  int n = int(uCarN + 0.5);
  if (n < 3) return false;
  for (int i = 0; i < ${CAR_HULL}; i++) {
    if (i >= n) break;
    vec2 a = uCarHull[i], b = uCarHull[i + 1 >= n ? 0 : i + 1];
    if ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) < -12.0 * length(b - a)) return false;
  }
  return true;
}

// shader transition: a ragged shockwave ring of strokes from the click, sparse
// static inside it
void wipeL(inout Hit h, vec2 p, vec2 cell) {
  if (uWipeB.x < 0.002) return;
  vec2 rel = p - uWipe.xy;
  float n = hash(cell * 0.37 + 11.0);
  float d = length(rel) + (n - 0.5) * uWipe.w;
  float ring = abs(d - uWipe.z);
  vec2 rd = rel / max(length(rel), 1e-3);
  take(h, ring, rd, uWipeB.y, uWipeB.x);
  if (d < uWipe.z - uWipe.w && hash(cell + floor(uLaserTime * 12.0)) < 0.07)
    take(h, uCell.y * 0.95, vec2(0.0, 1.0), uWipeB.y, uWipeB.x * 0.7);
}

// 3D title: the page's word as a mask; its outline becomes strokes along the
// edge (the mask gradient picks the direction), a sparse fill inside
float titleMask(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
  return texture2D(uTitleTex, vec2(uv.x, 1.0 - uv.y)).r;
}
void titleL(inout Hit h, vec2 p, vec2 cell) {
  if (uTitle.w < 0.002 || uTitle.z < 1.0) return;
  vec2 q = p - uTitle.xy;
  float c = cos(uTitleB.z), s = sin(uTitleB.z);
  q = vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
  vec2 size = vec2(uTitle.z, uTitle.z * uTitleB.y);
  vec2 uv = q / size + 0.5;
  if (uv.x < -0.05 || uv.x > 1.05 || uv.y < -0.05 || uv.y > 1.05) return;
  vec2 e = uCell / size;
  float gx = titleMask(uv + vec2(e.x, 0.0)) - titleMask(uv - vec2(e.x, 0.0));
  float gy = titleMask(uv + vec2(0.0, e.y)) - titleMask(uv - vec2(0.0, e.y));
  float g = length(vec2(gx, gy));
  if (g > 0.3) take(h, 0.0, vec2(gx, gy) / g, uTitleB.x, uTitle.w * min(g, 1.0));
  else if (titleMask(uv) > 0.5 && hash(cell + 3.1) < 0.1) take(h, uCell.y * 0.95, vec2(0.0, 1.0), uTitleB.x, uTitle.w * 0.6);
}

// → (slot, alpha, hue); slot 0 = nothing here
vec3 laserCell(vec2 cell, vec2 ctr) {
  vec2 p = ctr;
  Hit h = Hit(1e9, 1e9, vec2(0.0, 1.0), 0.0, 0.0);
  bool car = inCar(p);
  if (!car) scopeL(h, p);
  fanL(h, p);
  if (!car) gridL(h, p);
  orbitL(h, p);
  roomL(h, p);
  titleL(h, p, cell);
  wipeL(h, p, cell);
  if (h.w < 0.002) return vec3(0.0);
  float core = 1.0 - smoothstep(0.38, 0.82, h.d);
  if (core > 0.05) {
    // the beam's direction in cell space picks the stroke
    vec2 t = vec2(h.n.y, -h.n.x) / uCell;
    float ang = atan(t.y, t.x);
    if (ang < 0.0) ang += 3.1415927;
    float slot = ang < 0.3927 || ang > 2.7489 ? uLaserSlots.x      // ─
               : ang < 1.1781 ? uLaserSlots.z                       // ╲ (y-down)
               : ang < 1.9635 ? uLaserSlots.y                       // │
               : uLaserSlots.w;                                     // ╱
    return vec3(slot, core * h.w, h.hue);
  }
  // haze: sparse flickering dots hugging the beam
  float haze = (1.0 - smoothstep(0.82, 2.4, h.d)) * 0.38 * h.w;
  if (haze > 0.03 && hash(cell + floor(uLaserTime * 9.0) * 0.137) < 0.5) return vec3(uLaserDot, haze, h.hue);
  return vec3(0.0);
}
`;
