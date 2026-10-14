/* ─── ASCII engine (GL) — cell + compose passes ─────────────────────────────── */

/**
 * The GLSL port of draw.ts, split so every per-cell decision runs once per
 * cell instead of once per screen pixel:
 *
 *   pass 1  scene   → sceneRT (cols × rows): r = amplitude, g = light facing,
 *                     b = presence. One fragment per cell, evaluated exactly at
 *                     the cell center (camera.setViewOffset aligns the grid).
 *   pass 2  cell    → cellRT (cols × rows): r = atlas slot (0 = empty),
 *                     g = level after LUT, b = base alpha, a = specular.
 *                     Laser cells (laser-shader.ts) — wherever no scene object
 *                     claims the cell — are marked g = -1 and carry a = hue.
 *                     Level quantize, skin dither, density cull, carve, cursor
 *                     repulsor, light — all per cell.
 *   pass 3  compose → screen (full res): stamps glyphs from the atlas, with the
 *                     left neighbour's overflow first (canvas paint order),
 *                     tinted light, brightness-gated glow halo, lattice flash.
 */

import { laserChunk } from "./laser-shader";

export const TRAIL_MAX = 18;

export const quadVertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const COMMON = /* glsl */ `
float hash(vec2 c) { return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }

int ampToLevel(float amp) {
  if (amp < 0.05 || amp > 0.82) return 0;
  if (amp < 0.14) return 1;
  if (amp < 0.28) return 2;
  if (amp < 0.46) return 3;
  if (amp < 0.65) return 4;
  return 5;
}
`;

export const cellFragment = /* glsl */ `
uniform sampler2D uScene;
uniform vec2  uGrid;               // cols, rows
uniform vec2  uCell;               // css px
uniform float uLutA[6];
uniform float uLutB[6];
uniform float uSlotsA[6];
uniform float uSlotsB[6];
uniform float uBlendT;
uniform float uDim;
uniform float uDensity;
uniform vec4  uCarve;              // centerX px (<0 = none), half-width px, calm, edge px
uniform vec4  uLight;              // sharpness, strength, glowThresholdFrac, glowStrength
uniform float uShimmerMin;
uniform vec3  uTrail[${TRAIL_MAX}];  // x, y (css px, y-down), age factor 0–1
uniform vec2  uRepel;              // radius, core
${COMMON}
${laserChunk}

float suppression(vec2 p) {
  float supp = 0.0;
  for (int i = 0; i < ${TRAIL_MAX}; i++) {
    float ageF = uTrail[i].z;
    if (ageF <= 0.0) continue;
    float r = uRepel.x * (0.4 + 0.6 * ageF);
    float d = distance(p, uTrail[i].xy);
    if (d >= r) continue;
    if (d < uRepel.y) return 1.0;
    float u = 1.0 - d / r;
    supp = max(supp, u * u * (3.0 - 2.0 * u) * ageF);
  }
  return min(supp, 1.0);
}

// reading-column calm: 1 outside the carve, 1 - calm at its center
float carveAt(vec2 ctr) {
  if (uCarve.x < 0.0) return 1.0;
  float inside = clamp((uCarve.y - abs(ctr.x - uCarve.x)) / uCarve.w, 0.0, 1.0);
  return 1.0 - uCarve.z * inside * inside * (3.0 - 2.0 * inside);
}

void main() {
  ivec2 tc   = ivec2(gl_FragCoord.xy);
  vec2  cell = vec2(float(tc.x), uGrid.y - 1.0 - float(tc.y));   // y-down, like draw.ts
  vec4  s    = texelFetch(uScene, tc, 0);
  vec4  outv = vec4(0.0);

  int   level = ampToLevel(s.r);
  float r     = hash(cell);                       // stable per cell (≈ 2D cellRand)
  if (level > 0 && s.b > 0.004 && r < uDensity) {
    bool  useB = fract(r * 1.6180339887) < uBlendT;  // decorrelated dither hash
    float lvl  = useB ? uLutB[level] : uLutA[level];
    if (lvl > 0.5) {
      int   li   = int(lvl + 0.5);
      float slot = useB ? uSlotsB[li] : uSlotsA[li];
      vec2  ctr  = (cell + 0.5) * uCell;

      // scene objects (presence > 1) are only partly calmed by the carve
      float mul = uDim * mix(carveAt(ctr), 1.0, s.b > 1.001 ? 0.6 : 0.0);
      // under the laser layer, scene objects step back so the beams lead
      mul *= 1.0 - 0.6 * uLaserMix;
      float baseAlpha = (1.0 - suppression(ctr)) * mul * s.b;
      float spec = (lvl >= uShimmerMin && s.g > 0.0)
        ? pow(s.g, uLight.x) * uLight.y * baseAlpha : 0.0;
      if (baseAlpha > 0.0 && slot > 0.5) outv = vec4(slot, lvl, baseAlpha, spec);
    }
  }
  // the laser layer fills every cell no scene object claimed
  if (outv.x < 0.5 && uLaserMix > 0.001) {
    vec2 ctr = (cell + 0.5) * uCell;
    vec3 l = laserCell(cell, ctr);
    // beams live beside the text now; the reading column calms them only a little
    float a = l.y * uLaserMix * mix(1.0, carveAt(ctr), 0.4) * (1.0 - suppression(ctr));
    if (l.x > 0.5 && a > 0.004) outv = vec4(l.x, -1.0, a, l.z);
  }
  gl_FragColor = outv;
}
`;

export const composeFragment = /* glsl */ `
uniform sampler2D uCells;
uniform sampler2D uAtlas;
uniform vec2  uViewport;           // css px
uniform float uDpr;
uniform vec2  uCell;               // css px
uniform vec2  uGrid;               // cols, rows
uniform float uSlotW;              // css px
uniform float uSlotCount;
uniform vec3  uBg;                 // sRGB
uniform vec4  uStyles[6];          // sRGB rgb + alpha per level
uniform vec4  uLight;              // sharpness, strength, glowThresholdFrac, glowStrength
uniform vec3  uHue;                // phase (palette steps), bias, saturation
uniform float uFlash;              // 0–1 full-grid glyph flash
uniform float uFlashSlot;
uniform float uTime;               // seconds
uniform float uGradientMix;        // 1 = moving gradient light, 0 = the 2D vessel's per-cell hue cycle
uniform float uGlitch;             // 0–1 analog glitch: row tears, RGB split, flicker (laser mode)
uniform vec2  uLaserTone;          // laser brightness, white-hot amount — the story's emotional temperature

const float STEPS = 90.0;

float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Hue (degrees) of the light that catches a cell. The gradient mode borrows
// shadergradient's idea — color as a slowly moving field, not a per-cell
// rainbow: two octaves of value noise sweep ±55° around the skin's hue bias
// (cool in code, warm in music) and drift over time.
float lightHue(vec2 cell) {
  if (uGradientMix < 0.5) {
    return mod(floor(uHue.x + uHue.y + cell.x * 0.7 + cell.y * 0.5), STEPS) / STEPS * 360.0;
  }
  vec2 q = cell * vec2(0.045, 0.11) + vec2(uTime * 0.05, -uTime * 0.035);
  float n = vnoise(q) * 0.65 + vnoise(q * 2.3 + 7.31) * 0.35;
  return mod(uHue.y / STEPS * 360.0 + (n - 0.5) * 110.0 + uTime * 3.0, 360.0);
}

vec3 hsl2rgb(float h, float s, float l) {
  vec3 k = mod(vec3(0.0, 8.0, 4.0) + h / 30.0, 12.0);
  float a = s * min(l, 1.0 - l);
  return l - a * max(min(min(k - 3.0, 9.0 - k), 1.0), -1.0);
}

// laser palette coordinate → color. [0,0.5): the tech scale, black → grey →
// white. [0.5,1): the sound scale — the site's pearlescent shimmer
// (globals.css pill-hue-cycle: sky blue ↔ orchid, 205°–315°, every 6s) as
// light, drifting along the beam, dark → luminous → a white-hot crest.
const float SHIMMER_CENTER = 260.0, SHIMMER_SWING = 55.0, SHIMMER_PERIOD = 6.0;
vec3 laserColor(float v, vec2 cell) {
  if (v < 0.5) return vec3(mix(0.16, 1.0, v * 2.0));
  float t = (v - 0.5) * 2.0;
  float hue = SHIMMER_CENTER + SHIMMER_SWING * sin(6.2831853 * uTime / SHIMMER_PERIOD + cell.x * 0.035 + cell.y * 0.09);
  vec3 iri = hsl2rgb(hue, 0.7, mix(0.16, 0.74, smoothstep(0.0, 0.75, t)));
  return mix(iri, vec3(1.0), 0.7 * smoothstep(0.85, 1.0, t));
}

// off = css px from the cell's top-left; slots are wider than cells
float glyphAt(float slot, vec2 off) {
  if (off.x < 0.0 || off.x >= uSlotW || off.y < 0.0 || off.y >= uCell.y) return 0.0;
  return texture2D(uAtlas, vec2((slot * uSlotW + off.x) / (uSlotW * uSlotCount), 1.0 - off.y / uCell.y)).a;
}

void shade(vec2 cell, vec2 off, inout vec3 col) {
  if (cell.x < 0.0) return;
  vec4 c = texelFetch(uCells, ivec2(int(cell.x), int(uGrid.y - 1.0 - cell.y)), 0);
  if (c.x < 0.5) return;
  float slot = floor(c.x + 0.5);
  if (c.y < -0.5) {
    // laser beam: saturated, additive, with a soft bloom off the stroke
    float lg = glyphAt(slot, off);
    float bloom = glyphAt(slot, off + vec2(1.0, 0.0)) + glyphAt(slot, off - vec2(1.0, 0.0))
                + glyphAt(slot, off + vec2(0.0, 1.0)) + glyphAt(slot, off - vec2(0.0, 1.0));
    vec3 lc = laserColor(c.w, cell) * uLaserTone.x;
    col += lc * (lg * c.z + bloom * 0.07 * c.z);
    col = mix(col, laserColor(c.w < 0.5 ? 0.499 : 0.999, cell), lg * c.z * c.z * uLaserTone.y);  // hot core
    return;
  }
  float baseAlpha = c.z;
  float spec = c.w;
  float strength = uLight.y;
  float glowThr = strength * uLight.z;
  bool  glows = spec > 0.012 && spec > glowThr;

  float g = glyphAt(slot, off);
  float halo = 0.0;
  if (glows) {
    halo = glyphAt(slot, off + vec2(1.0, 0.0)) + glyphAt(slot, off - vec2(1.0, 0.0))
         + glyphAt(slot, off + vec2(0.0, 1.0)) + glyphAt(slot, off - vec2(0.0, 1.0));
  }
  if (g <= 0.0 && halo <= 0.0) return;

  vec4 st = uStyles[int(c.y + 0.5)];
  col = mix(col, st.rgb, g * st.a * baseAlpha);

  if (spec > 0.012) {
    float hue = lightHue(cell);
    // the gradient light carries more color so its regions read as cool/warm washes
    float sat = uGradientMix > 0.5 ? min(uHue.z * 1.5, 0.9) : uHue.z;
    vec3 tint = hsl2rgb(hue, sat, 0.86);
    col = mix(col, tint, g * spec);
    if (glows) {
      float k = (spec - glowThr) / max(strength - glowThr, 0.001) * uLight.w;
      vec3 glowTint = hsl2rgb(hue, min(sat * 1.15, 1.0), 0.93);
      col = mix(col, glowTint, clamp(halo * k * 0.16, 0.0, 1.0));
      col = mix(col, glowTint, g * k * spec);
    }
  }
}

vec3 field(vec2 px) {
  vec3 col  = uBg;
  vec2 cell = floor(px / uCell);
  vec2 off  = px - cell * uCell;
  // left neighbour first (its glyph overflows into this cell), then own cell —
  // the same left-to-right paint order as the 2D canvas loop
  shade(cell - vec2(1.0, 0.0), off + vec2(uCell.x, 0.0), col);
  shade(cell, off, col);
  if (uFlash > 0.0) {
    float fg = max(glyphAt(uFlashSlot, off), glyphAt(uFlashSlot, off + vec2(uCell.x, 0.0)));
    col = mix(col, vec3(0.9, 0.91, 0.93), fg * uFlash * 0.55);
  }
  return col;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uViewport.y * uDpr - gl_FragCoord.y) / uDpr;  // y-down css px
  if (uGlitch <= 0.0) {
    gl_FragColor = vec4(field(px), 1.0);
    return;
  }
  // analog glitch — bands of three rows tear sideways for a tick (14/s) and
  // leave a dim ghost echo (monochrome — no RGB fringes in a two-scale
  // palette); faint scanlines and a brightness flicker
  float tick = floor(uTime * 14.0);
  float band = floor(px.y / (uCell.y * 3.0));
  float roll = h21(vec2(band, tick));
  float tear = step(1.0 - uGlitch * 0.35, roll);
  px.x += tear * (h21(vec2(roll * 91.7, tick)) - 0.5) * (14.0 + 90.0 * uGlitch);
  vec3 col = field(px);
  if (tear > 0.0) col = max(col, field(px + vec2(6.0 + 14.0 * uGlitch, 0.0)) * 0.45);
  col *= 1.0 - 0.06 * step(0.5, fract(px.y * 0.5));                  // scanlines
  col *= 1.0 - 0.08 * uGlitch * h21(vec2(tick, 9.1));               // flicker
  gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
}
`;
