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
 *                     Level quantize, skin dither, density cull, carve, cursor
 *                     repulsor, light — all per cell.
 *   pass 3  compose → screen (full res): stamps glyphs from the atlas, with the
 *                     left neighbour's overflow first (canvas paint order),
 *                     tinted light, brightness-gated glow halo, lattice flash.
 */

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

      float mul = uDim;
      if (uCarve.x >= 0.0) {
        float inside = clamp((uCarve.y - abs(ctr.x - uCarve.x)) / uCarve.w, 0.0, 1.0);
        mul *= 1.0 - uCarve.z * inside * inside * (3.0 - 2.0 * inside);
      }
      float baseAlpha = (1.0 - suppression(ctr)) * mul * s.b;
      float spec = (lvl >= uShimmerMin && s.g > 0.0)
        ? pow(s.g, uLight.x) * uLight.y * baseAlpha : 0.0;
      if (baseAlpha > 0.0 && slot > 0.5) outv = vec4(slot, lvl, baseAlpha, spec);
    }
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

const float STEPS = 90.0;

vec3 hsl2rgb(float h, float s, float l) {
  vec3 k = mod(vec3(0.0, 8.0, 4.0) + h / 30.0, 12.0);
  float a = s * min(l, 1.0 - l);
  return l - a * max(min(min(k - 3.0, 9.0 - k), 1.0), -1.0);
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
    float hi  = mod(floor(uHue.x + uHue.y + cell.x * 0.7 + cell.y * 0.5), STEPS);
    vec3 tint = hsl2rgb(hi / STEPS * 360.0, uHue.z, 0.86);
    col = mix(col, tint, g * spec);
    if (glows) {
      float k = (spec - glowThr) / max(strength - glowThr, 0.001) * uLight.w;
      vec3 glowTint = hsl2rgb(hi / STEPS * 360.0, min(uHue.z * 1.15, 1.0), 0.93);
      col = mix(col, glowTint, clamp(halo * k * 0.16, 0.0, 1.0));
      col = mix(col, glowTint, g * k * spec);
    }
  }
}

void main() {
  vec3 col  = uBg;
  vec2 px   = vec2(gl_FragCoord.x, uViewport.y * uDpr - gl_FragCoord.y) / uDpr;  // y-down css px
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
  gl_FragColor = vec4(col, 1.0);
}
`;
