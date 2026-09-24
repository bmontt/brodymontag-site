/* ─── ASCII engine (GL) — brand ASCII post-process ──────────────────────────── */

import { CanvasTexture, NearestFilter, Uniform, Vector2, Vector3, Vector4 } from "three";
import { Effect } from "postprocessing";
import type { EraSkin } from "../skins";

/**
 * GLSL port of draw.ts. The scene (the wave sheet) writes amplitude / light
 * facing / presence into r/g/b; this pass snaps every pixel to its screen-space
 * cell, samples the scene at the cell CENTER, quantizes with ampToLevel's
 * thresholds, and stamps the skin's glyph from a runtime atlas. Glyphs never
 * move — only their values change — which is what keeps the field legible.
 *
 * Colors are composed in sRGB space (like canvas 2D) and written straight out:
 * the Canvas runs with `linear` so nothing re-encodes them.
 */

export const TRAIL_MAX = 18;
const LEVELS = 6;

const fragment = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec2  uViewport;          // css px
uniform vec2  uCell;              // css px
uniform float uSlotW;             // atlas slot width, css px (≥ glyph advance)
uniform vec3  uBg;                // sRGB
uniform vec4  uStyles[${LEVELS}]; // sRGB rgb + alpha per level
uniform float uLut[${LEVELS}];
uniform float uDim;               // skin.styleAlphaMul
uniform float uDensity;
uniform vec4  uCarve;             // centerX px (<0 = none), halfWidth px, calm, edge px
uniform vec4  uLight;             // sharpness, strength, glowThresholdFrac, glowStrength
uniform float uShimmerMin;
uniform vec3  uHue;               // huePhase (palette steps), hueBias, saturation
uniform vec3  uTrail[${TRAIL_MAX}];  // x, y (css px, y-down), age factor 0–1
uniform vec2  uRepel;             // radius, core
uniform float uFlash;             // 0–1 full-grid lattice flash (punch-through)

const float STEPS = 90.0;

float hash(vec2 c) { return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 hsl2rgb(float h, float s, float l) {
  vec3 k = mod(vec3(0.0, 8.0, 4.0) + h / 30.0, 12.0);
  float a = s * min(l, 1.0 - l);
  return l - a * max(min(min(k - 3.0, 9.0 - k), 1.0), -1.0);
}

int ampToLevel(float amp) {
  if (amp < 0.05 || amp > 0.82) return 0;
  if (amp < 0.14) return 1;
  if (amp < 0.28) return 2;
  if (amp < 0.46) return 3;
  if (amp < 0.65) return 4;
  return 5;
}

// off = css px from the cell's top-left. Slots are wider than cells: glyphs
// overflow into the next cell exactly like canvas fillText does.
float glyphAt(float lvl, vec2 off) {
  if (off.x < 0.0 || off.x >= uSlotW || off.y < 0.0 || off.y >= uCell.y) return 0.0;
  return texture(uAtlas, vec2((lvl * uSlotW + off.x) / (uSlotW * ${LEVELS}.0), 1.0 - off.y / uCell.y)).a;
}

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

// Composite one cell's glyph (and its light/glow) at pixel offset "off".
void shadeCell(vec2 cell, vec2 off, inout vec3 col) {
  vec2 ctr = (cell + 0.5) * uCell;
  vec4 s = texture(inputBuffer, vec2(ctr.x, uViewport.y - ctr.y) / uViewport);
  int level = ampToLevel(s.r);
  if (level == 0 || s.b <= 0.004 || hash(cell) >= uDensity) return;
  float lvl = uLut[level];
  if (lvl < 0.5) return;

  // reading-column carve
  float mul = uDim;
  if (uCarve.x >= 0.0) {
    float inside = clamp((uCarve.y - abs(ctr.x - uCarve.x)) / uCarve.w, 0.0, 1.0);
    mul *= 1.0 - uCarve.z * inside * inside * (3.0 - 2.0 * inside);
  }
  float baseAlpha = (1.0 - suppression(ctr)) * mul * s.b;
  if (baseAlpha <= 0.0) return;

  float strength = uLight.y;
  float spec = (lvl >= uShimmerMin && s.g > 0.0) ? pow(s.g, uLight.x) * strength * baseAlpha : 0.0;
  float glowThr = strength * uLight.z;
  bool glows = spec > 0.012 && spec > glowThr;

  float g = glyphAt(lvl, off);
  float halo = 0.0;
  if (glows) {
    halo = glyphAt(lvl, off + vec2(1.0, 0.0)) + glyphAt(lvl, off - vec2(1.0, 0.0))
         + glyphAt(lvl, off + vec2(0.0, 1.0)) + glyphAt(lvl, off - vec2(0.0, 1.0));
  }
  if (g <= 0.0 && halo <= 0.0) return;

  vec4 st = uStyles[int(lvl + 0.5)];
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

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 col  = uBg;
  vec2 px   = vec2(uv.x, 1.0 - uv.y) * uViewport;   // y-down css px
  vec2 cell = floor(px / uCell);
  vec2 off  = px - cell * uCell;
  // left neighbour first (its glyph overflows into this cell), then own cell —
  // the same left-to-right paint order as the 2D canvas loop
  shadeCell(cell - vec2(1.0, 0.0), off + vec2(uCell.x, 0.0), col);
  shadeCell(cell, off, col);
  if (uFlash > 0.0) {
    float fg = max(glyphAt(4.0, off), glyphAt(4.0, off + vec2(uCell.x, 0.0)));
    col = mix(col, vec3(0.9, 0.91, 0.93), fg * uFlash * 0.55);
  }
  outputColor = vec4(col, 1.0);
}
`;

/** Parse the rgba() strings in skins.ts STYLES into sRGB vec4s. */
function parseStyle(css: string): Vector4 {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return new Vector4(0, 0, 0, 0);
  const [r, g, b, a = "1"] = m[1].split(",").map((s) => s.trim());
  return new Vector4(+r / 255, +g / 255, +b / 255, +a);
}

/** Resolve the page background (an oklch() token) to sRGB 0–1 via canvas 2D. */
export function resolveCssColor(css: string): Vector3 {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new Vector3(r / 255, g / 255, b / 255);
}

/** Atlas slot width: two cells, enough for Geist Mono's 0.6em advance plus bearing. */
export const slotWidth = (cellW: number) => cellW * 2;

/**
 * One row of glyph slots (slotWidth × cellH, × dpr) — 1:1 texel mapping, so
 * nearest filtering stays crisp. Uses the real next/font family name (it is
 * renamed, so a literal 'Geist Mono' would silently fall back to monospace).
 */
export function buildGlyphAtlas(
  chars: readonly string[],
  cellW: number,
  cellH: number,
  dpr: number,
): CanvasTexture {
  const family =
    getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() ||
    "monospace";
  const w = Math.round(slotWidth(cellW) * dpr);
  const h = Math.round(cellH * dpr);
  const canvas = document.createElement("canvas");
  canvas.width = w * LEVELS;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "top";
  ctx.font = `${Math.round(cellH * 0.73 * dpr)}px ${family}`;
  for (let i = 0; i < LEVELS; i++) ctx.fillText(chars[i] ?? " ", i * w, 0);
  const tex = new CanvasTexture(canvas);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

export interface AsciiEffectOptions {
  styles: readonly string[];
  bg: Vector3;
  repelR: number;
  repelCore: number;
  shimmerMin: number;
  lightSharpness: number;
  glowThresholdFrac: number;
}

export class BrandAsciiEffect extends Effect {
  constructor(o: AsciiEffectOptions) {
    super("BrandAsciiEffect", fragment, {
      uniforms: new Map<string, Uniform>([
        ["uAtlas", new Uniform(null)],
        ["uViewport", new Uniform(new Vector2(1, 1))],
        ["uCell", new Uniform(new Vector2(8, 22))],
        ["uSlotW", new Uniform(16)],
        ["uBg", new Uniform(o.bg)],
        ["uStyles", new Uniform(o.styles.map(parseStyle))],
        ["uLut", new Uniform([0, 1, 2, 3, 4, 5])],
        ["uDim", new Uniform(1)],
        ["uDensity", new Uniform(1)],
        ["uCarve", new Uniform(new Vector4(-1, 0, 0, 1))],
        ["uLight", new Uniform(new Vector4(o.lightSharpness, 0.26, o.glowThresholdFrac, 0.55))],
        ["uShimmerMin", new Uniform(o.shimmerMin)],
        ["uHue", new Uniform(new Vector3(0, 0, 0.58))],
        ["uTrail", new Uniform(Array.from({ length: TRAIL_MAX }, () => new Vector3(0, 0, 0)))],
        ["uRepel", new Uniform(new Vector2(o.repelR, o.repelCore))],
        ["uFlash", new Uniform(0)],
      ]),
    });
  }

  u<T>(name: string): T {
    return this.uniforms.get(name)!.value as T;
  }

  setAtlas(tex: CanvasTexture) {
    const prev = this.u<CanvasTexture | null>("uAtlas");
    this.uniforms.get("uAtlas")!.value = tex;
    if (prev && prev !== tex) prev.dispose();
  }

  /** Push an EraSkin into the pass (the same skins the 2D vessel uses). */
  applySkin(skin: EraSkin, viewW: number) {
    (this.u<number[]>("uLut")).splice(0, LEVELS, ...skin.levelLut);
    this.uniforms.get("uDim")!.value = skin.styleAlphaMul;
    this.uniforms.get("uDensity")!.value = skin.density;
    const light = this.u<Vector4>("uLight");
    light.y = skin.lightStrength;
    light.w = skin.glowStrength;
    const hue = this.u<Vector3>("uHue");
    hue.y = skin.lightHueBias;
    hue.z = skin.lightSat;
    const carve = this.u<Vector4>("uCarve");
    const half = skin.carve.width * viewW;
    const cx =
      skin.carve.mode === "none" ? -1
      : skin.carve.mode === "left" ? viewW * 0.28
      : skin.carve.mode === "right" ? viewW * 0.72
      : viewW / 2;
    carve.set(skin.carve.calm > 0 ? cx : -1, half, skin.carve.calm, Math.max(half * 0.5, 1));
  }
}
