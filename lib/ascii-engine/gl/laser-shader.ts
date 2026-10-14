/* ─── ASCII engine (GL) — laser layer ───────────────────────────────────────── */

import { Vector2, Vector4 } from "three";

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
 *   liss   — a spinning 3D Lissajous knot (hero dive → the build)
 *   fan    — club fan beams sweeping from the floor (monty)
 *   grid   — a perspective laser floor that runs with the year track (timeline)
 *   orbit  — two beam rings in a decaying binary orbit, then the ringdown (merger)
 */

export interface LaserUniforms {
  uLaserMix: { value: number };
  uView: { value: Vector2 };
  uJitter: { value: Vector2 };
  uLaserTime: { value: number };
  uLaserSlots: { value: Vector4 };
  uLaserDot: { value: number };
  uScope: { value: Vector4 };
  uScopeB: { value: Vector4 };
  uScopeC: { value: Vector4 };
  uLiss: { value: Vector4 };
  uLissB: { value: Vector4 };
  uLissC: { value: Vector2 };
  uFan: { value: Vector4 };
  uFanB: { value: Vector4 };
  uFanC: { value: Vector4 };
  uGridL: { value: Vector4 };
  uGridB: { value: Vector4 };
  uRails: { value: Vector4 };
  uOrbit: { value: Vector4 };
  uOrbitB: { value: Vector4 };
  uRingL: { value: Vector4 };
}

export function makeLaserUniforms(): LaserUniforms {
  return {
    uLaserMix: { value: 0 },
    uView: { value: new Vector2(1, 1) },
    uJitter: { value: new Vector2() },
    uLaserTime: { value: 0 },
    uLaserSlots: { value: new Vector4() },
    uLaserDot: { value: 0 },
    uScope: { value: new Vector4() },
    uScopeB: { value: new Vector4() },
    uScopeC: { value: new Vector4() },
    uLiss: { value: new Vector4() },
    uLissB: { value: new Vector4() },
    uLissC: { value: new Vector2() },
    uFan: { value: new Vector4() },
    uFanB: { value: new Vector4() },
    uFanC: { value: new Vector4() },
    uGridL: { value: new Vector4() },
    uGridB: { value: new Vector4() },
    uRails: { value: new Vector4() },
    uOrbit: { value: new Vector4() },
    uOrbitB: { value: new Vector4() },
    uRingL: { value: new Vector4() },
  };
}

export const laserChunk = /* glsl */ `
uniform float uLaserMix;           // 0 = wave field, 1 = laser layer
uniform vec2  uView;               // css px
uniform vec2  uJitter;             // css px — analog scanner wobble, per frame
uniform float uLaserTime;
uniform vec4  uLaserSlots;         // atlas slots: ─ │ ╲ ╱
uniform float uLaserDot;           // atlas slot: ·
uniform vec4  uScope;              // weight, amplitude px, cycles across the view, phase
uniform vec4  uScopeB;             // baseline y px, hue 0–1, harmonics 0–1, hue of the second trace
uniform vec4  uScopeC;             // second trace: weight, phase offset, frequency ratio, amplitude ratio
uniform vec4  uLiss;               // weight, a, b, phase
uniform vec4  uLissB;              // spin rad, radius px, hue, tilt rad
uniform vec2  uLissC;              // center px
uniform vec4  uFan;                // weight, beam count, spread rad, sweep rad
uniform vec4  uFanB;               // origin px (xy), hue, length px
uniform vec4  uFanC;               // hue spread across the beams, —, —, —
uniform vec4  uGridL;              // weight, horizon y px, scroll, hue
uniform vec4  uGridB;              // vanishing x px, rail spacing px (at the bottom), rung density, —
uniform vec4  uRails;              // two lit rails to the vanishing point: weight, half-gap px at the bottom, hue A, hue B
uniform vec4  uOrbit;              // weight, separation px, phase rad, ring radius px
uniform vec4  uOrbitB;             // center px (xy), hue A, hue B
uniform vec4  uRingL;              // weight, radius px, hue, —

struct Hit { float score; float d; vec2 n; float hue; float w; };

// A px-space candidate (distance + unit normal) → cell units; the strongest
// (nearest, weighted) primitive wins the cell.
void take(inout Hit h, float dpx, vec2 n, float hue, float w) {
  if (w < 0.002) return;
  float dc = dpx * length(n / uCell);
  float score = dc - 1.5 * w;
  if (score < h.score) { h.score = score; h.d = dc; h.n = n; h.hue = hue; h.w = w; }
}

// nearest point on segment ab → (distance px, normal) folded into best
void segMin(vec2 p, vec2 a, vec2 b, inout float best, inout vec2 bn) {
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  vec2 dv = p - (a + ab * t);
  float d = length(dv);
  if (d < best) { best = d; bn = d > 1e-3 ? dv / d : normalize(vec2(-ab.y, ab.x) + 1e-5); }
}

float scopeF(float x, float ph, float fr, float amp) {
  float k = 6.2831853 * uScope.z * fr / uView.x;
  return uScope.y * amp * (sin(x * k + ph) * 0.62
    + sin(x * k * 2.31 - ph * 1.37) * 0.28 * uScopeB.z
    + sin(x * k * 5.7 + ph * 2.1) * 0.1 * uScopeB.z);
}

void traceL(inout Hit h, vec2 p, float ph, float fr, float amp, float hue, float w) {
  float f = scopeF(p.x, ph, fr, amp);
  float df = (scopeF(p.x + 1.0, ph, fr, amp) - scopeF(p.x - 1.0, ph, fr, amp)) * 0.5;
  float dy = p.y - (uScopeB.x + f);
  take(h, abs(dy) / sqrt(1.0 + df * df), normalize(vec2(-df, 1.0)), hue, w);
}

// one or two traces on a shared baseline (the two signals)
void scopeL(inout Hit h, vec2 p) {
  if (uScope.x < 0.002 && uScopeC.x < 0.002) return;
  if (uScope.x > 0.002) traceL(h, p, uScope.w, 1.0, 1.0, uScopeB.y, uScope.x);
  if (uScopeC.x > 0.002) traceL(h, p, uScope.w + uScopeC.y, uScopeC.z, uScopeC.w, uScopeB.w, uScopeC.x);
}

vec3 lissPt(float t) {
  vec3 q = vec3(sin(uLiss.y * t + uLiss.w), sin(uLiss.z * t), cos(uLiss.y * t + uLiss.w * 0.5));
  float c = cos(uLissB.x), s = sin(uLissB.x);
  q = vec3(c * q.x + s * q.z, q.y, -s * q.x + c * q.z);            // spin about y
  float ct = cos(uLissB.w), st = sin(uLissB.w);
  q = vec3(q.x, ct * q.y - st * q.z, st * q.y + ct * q.z);         // tilt about x
  return vec3(uLissC + q.xy * uLissB.y * (2.6 / (2.6 + q.z)), q.z); // perspective, + depth
}

void lissL(inout Hit h, vec2 p) {
  if (uLiss.x < 0.002 || uLissB.y < 1.0) return;
  if (distance(p, uLissC) > uLissB.y * 1.9 + 80.0) return;         // outside figure + haze
  float best = 1e9, bz = 0.0; vec2 bn = vec2(0.0, 1.0);
  vec3 a = lissPt(0.0);
  for (int i = 1; i <= 120; i++) {
    vec3 b = lissPt(float(i) * (6.2831853 / 120.0));
    float before = best;
    segMin(p, a.xy, b.xy, best, bn);
    if (best < before) bz = a.z;
    a = b;
  }
  // far strands sink toward black within the knot's scale — monochrome depth
  take(h, best, bn, uLissB.z * mix(1.0, 0.4, (bz + 1.0) * 0.5), uLiss.x);
}

void fanL(inout Hit h, vec2 p) {
  if (uFan.x < 0.002) return;
  int n = int(uFan.y + 0.5);
  float best = 1e9, bk = 0.0; vec2 bn = vec2(0.0, 1.0);
  for (int i = 0; i < 12; i++) {
    if (i >= n) break;
    float k = n > 1 ? float(i) / float(n - 1) - 0.5 : 0.0;
    float ang = -1.5707963 + uFan.w + k * uFan.z;                    // -π/2 = straight up (y-down)
    float before = best;
    segMin(p, uFanB.xy, uFanB.xy + vec2(cos(ang), sin(ang)) * uFanB.w, best, bn);
    if (best < before) bk = k;
  }
  float lo = uFanB.z < 0.5 ? 0.0 : 0.5;
  take(h, best, bn, clamp(uFanB.z + bk * uFanC.x, lo, lo + 0.499), uFan.x);
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

void orbitL(inout Hit h, vec2 p) {
  if (uOrbit.x >= 0.002) {
    vec2 o = vec2(cos(uOrbit.z), sin(uOrbit.z) * 0.42) * uOrbit.y; // inclined orbit
    circleL(h, p, uOrbitB.xy + o, uOrbit.w, uOrbitB.z, uOrbit.x);
    circleL(h, p, uOrbitB.xy - o, uOrbit.w, uOrbitB.w, uOrbit.x);
  }
  if (uRingL.x >= 0.002) circleL(h, p, uOrbitB.xy, uRingL.y, uRingL.z, uRingL.x);
}

// → (slot, alpha, hue); slot 0 = nothing here
vec3 laserCell(vec2 cell, vec2 ctr) {
  vec2 p = ctr + uJitter;
  Hit h = Hit(1e9, 1e9, vec2(0.0, 1.0), 0.0, 0.0);
  scopeL(h, p);
  lissL(h, p);
  fanL(h, p);
  gridL(h, p);
  orbitL(h, p);
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
