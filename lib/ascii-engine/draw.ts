/* ─── ASCII engine — per-frame draw ─────────────────────────────────────────── */

import { clamp, TWO_PI } from "./bake";
import type { DrawConfig, DrawInput, FrameBuf } from "./types";
import { DEFAULT_SKIN, STYLES } from "./skins";
import type { EraSkin } from "./skins";

export type { EraSkin };

/* ─── palette constants ───────────────────────────────────────────────────────── */
/** Light-tint palette resolution. */
const STEPS = 90;

/* ─── palette builders ───────────────────────────────────────────────────────── */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1)      [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else             [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * Build the near-white light-tint palette whose faint hue drifts.
 * Alpha is applied live via globalAlpha.
 * Exported so the wrapper / Vessel can build palettes before calling draw().
 */
export function buildLight(sat: number, lightness = 0.86): string[] {
  return Array.from({ length: STEPS }, (_, i) => {
    const [r, g, b] = hslToRgb((i / STEPS) * 360, sat, lightness);
    return `rgb(${r},${g},${b})`;
  });
}

/* ─── cursor suppression ──────────────────────────────────────────────────────── */

/** Cursor trail point. */
export interface TrailPt { x: number; y: number; t: number; }

/**
 * Returns 0–1 suppression strength at pixel (px,py) given the pointer trail.
 * 1 = fully suppressed (inside core), 0 = no effect.
 */
export function suppression(
  px: number,
  py: number,
  now: number,
  trail: readonly TrailPt[],
  cfg: Pick<DrawConfig, "trailMs" | "repelR" | "repelCore">,
): number {
  let supp = 0;
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    const ageF = 1 - (now - p.t) / cfg.trailMs;
    if (ageF <= 0) continue;
    const r = cfg.repelR * (0.4 + 0.6 * ageF);
    const d = Math.hypot(px - p.x, py - p.y);
    if (d >= r) continue;
    if (d < cfg.repelCore) return 1;
    const u = 1 - d / r;
    const s = u * u * (3 - 2 * u) * ageF;
    if (s > supp) supp = s;
  }
  return supp > 1 ? 1 : supp;
}

/* ─── dither blend context ────────────────────────────────────────────────────── */

/**
 * When two skins differ in glyph vocabulary across a chapter boundary, the
 * Vessel passes both skins' discrete tables here. draw() picks A or B per cell
 * via a stable per-cell hash compared against `t`, so the vocabulary dissolves
 * rather than pops. Omitted (null) when not blending → zero overhead.
 */
export interface DitherBlend {
  charsA: readonly string[];
  lutA: readonly number[];
  charsB: readonly string[];
  lutB: readonly number[];
  t: number; // 0 → all A, 1 → all B
}

/* ─── carve geometry ──────────────────────────────────────────────────────────── */
function carveCenterX(mode: EraSkin["carve"]["mode"], logW: number): number {
  switch (mode) {
    case "left":  return logW * 0.28;
    case "right": return logW * 0.72;
    case "none":  return Number.NaN; // sentinel — handled by caller
    default:      return logW / 2;
  }
}

/* ─── main draw function ──────────────────────────────────────────────────────── */

/**
 * Render one frame of the ASCII field onto `gfx`.
 *
 * SEAM: `input.past` is a 0–1 smoothstepped readability calm value.
 * - Wrapper: computes  pRaw = clamp(scrollY/(logH*0.8),0,1);
 *            past = subpage ? 1 : smoothstep(pRaw)
 * - Future Vessel: derives past from journey store's chapter progress.
 * The engine only receives the already-smoothstepped value.
 *
 * LIGHT ADVANCE: the wrapper advances lightAngle/lightHuePhase BEFORE calling
 * draw() on non-static frames. draw() reads them as-is and does NOT mutate them.
 * This matches the original behavior: lightAngle advances once per drawn
 * non-static frame (the original guarded it with `if (!isStatic)` at the top of
 * drawFrame, before the fps gate — so here the wrapper skips the advance call
 * when isStatic, preserving identical semantics).
 *
 * @param gfx        Canvas 2D context (already scaled for DPR).
 * @param buf        Pre-baked frame buffer.
 * @param normX      Per-cell X normal (from computeNormals).
 * @param normY      Per-cell Y normal.
 * @param logW       Logical canvas width in CSS px.
 * @param logH       Logical canvas height in CSS px.
 * @param gridW      Cell width in px (cellW from config).
 * @param gridH      Cell height in px (cellH from config).
 * @param trail      Pointer trail ring-buffer. draw() evicts stale points as a side effect (matches original drawFrame behavior).
 * @param lightPalette  Pre-built primary light palette (buildLight(lightSat)).
 * @param glowPalette   Pre-built glow halo palette.
 * @param dcfg       Static DrawConfig fields from the site config.
 * @param input      Per-frame variable inputs.
 * @param skin       EraSkin — pass DEFAULT_SKIN for pixel-identical output.
 */
export function draw(
  gfx: CanvasRenderingContext2D,
  buf: FrameBuf,
  normX: Float32Array<ArrayBuffer>,
  normY: Float32Array<ArrayBuffer>,
  logW: number,
  logH: number,
  gridW: number,
  gridH: number,
  trail: TrailPt[],
  lightPalette: string[],
  glowPalette: string[],
  dcfg: DrawConfig,
  input: DrawInput,
  skin: EraSkin = DEFAULT_SKIN,
  cellRand?: Float32Array,
  blend?: DitherBlend | null,
): void {
  const { frameIndex, past, now, lightAngle, lightHuePhase } = input;

  const lx = Math.cos(lightAngle), ly = Math.sin(lightAngle);
  const sharp       = dcfg.lightSharpness;
  const strength    = skin.lightStrength;
  const shimmerMin  = dcfg.shimmerMin;
  const glowThr     = strength * dcfg.glowThresholdFrac;
  const glowRange   = Math.max(strength - glowThr, 0.001);
  const glowStr     = skin.glowStrength;
  const hueBias     = skin.lightHueBias;

  // evict stale trail points
  while (trail.length && now - trail[0].t > dcfg.trailMs) {
    trail.shift();
  }

  // Overall field intensity. styleAlphaMul carries the per-era brightness;
  // the past factor preserves the detail-page contract (subpage → past=1 →
  // dim = styleAlphaMul·contentDim; DEFAULT_SKIN styleAlphaMul=1 → identical).
  const dim = skin.styleAlphaMul * (1 + past * (dcfg.contentDim - 1));

  // per-column carve multiplier (reading column dimmed per the skin)
  const { cols, rows, data } = buf;
  const colMul = new Float32Array(cols);
  {
    const carveX  = carveCenterX(skin.carve.mode, logW);
    const noCarve = skin.carve.mode === "none" || Number.isNaN(carveX);
    const halfCol = skin.carve.width * logW;
    const colCalm = skin.carve.calm;
    const edge    = Math.max(halfCol * 0.5, 1);
    for (let c = 0; c < cols; c++) {
      if (noCarve) { colMul[c] = dim; continue; }
      const dxc = Math.abs(c * gridW + gridW / 2 - carveX);
      const inside = clamp((halfCol - dxc) / edge, 0, 1);
      const ct = inside * inside * (3 - 2 * inside);
      colMul[c] = dim * (1 - colCalm * ct);
    }
  }

  // density-cull / dither are stable per-cell via the prebaked cellRand array;
  // when absent (detail pages) the field draws every cell with its own glyphs.
  const density   = skin.density;
  const useRand    = cellRand !== undefined;
  const dither     = useRand && blend != null && blend.t > 0 && blend.t < 1;

  // local influence box so suppression stays cheap
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  const R = dcfg.repelR;
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    if (p.x - R < bx0) bx0 = p.x - R;
    if (p.y - R < by0) by0 = p.y - R;
    if (p.x + R > bx1) bx1 = p.x + R;
    if (p.y + R > by1) by1 = p.y + R;
  }
  const hasBubble = trail.length > 0;

  const cells   = cols * rows;
  gfx.clearRect(0, 0, logW, logH);

  // subtle per-era field transform about viewport center (skip if identity)
  const { scale, rotate } = skin.transform;
  const hasTransform = scale !== 1 || rotate !== 0;
  if (hasTransform) {
    gfx.save();
    gfx.translate(logW / 2, logH / 2);
    gfx.scale(scale, scale);
    gfx.rotate(rotate);
    gfx.translate(-logW / 2, -logH / 2);
  }

  const base = frameIndex * cells;
  let curAlpha = 1;
  gfx.globalAlpha = 1;

  // default vocabulary (single-skin); per-cell dither overrides when blending
  const skinChars = skin.chars;
  const skinLut   = skin.levelLut;

  for (let row = 0; row < rows; row++) {
    const yPx = row * gridH;
    const cyc = yPx + gridH / 2;
    const off = base + row * cols;
    const rowInBox = hasBubble && cyc >= by0 && cyc <= by1;
    const rowBase = row * cols;
    for (let col = 0; col < cols; col++) {
      const level = data[off + col];
      if (level === 0) continue;
      const cellMul = colMul[col];
      if (cellMul < 0.012) continue;               // column fully calmed → skip

      const idx = rowBase + col;

      // density cull + glyph dither — both stable per cell via cellRand
      let chars = skinChars, lut = skinLut;
      if (useRand) {
        const cr = cellRand![idx];
        if (cr >= density) continue;               // sparser eras drop cells
        if (dither) {
          // decorrelate the dither hash from the density hash
          const dith = (cr * 1.6180339887) % 1;
          if (dith < blend!.t) { chars = blend!.charsB; lut = blend!.lutB; }
          else                 { chars = blend!.charsA; lut = blend!.lutA; }
        }
      }

      const lvl = lut[level];
      if (lvl === 0) continue;                     // remapped to empty
      const xPx = col * gridW;

      let supp = 0;
      if (rowInBox) {
        const cxc = xPx + gridW / 2;
        if (cxc >= bx0 && cxc <= bx1) {
          supp = suppression(cxc, cyc, now, trail, dcfg);
          if (supp >= 0.999) continue;
        }
      }

      const baseAlpha = (1 - supp) * cellMul;
      if (baseAlpha !== curAlpha) { gfx.globalAlpha = baseAlpha; curAlpha = baseAlpha; }
      gfx.fillStyle = STYLES[lvl];
      gfx.fillText(chars[lvl], xPx, yPx);

      // directional specular highlight on lit-facing edge cells
      if (lvl >= shimmerMin) {
        const facing = normX[idx] * lx + normY[idx] * ly;
        if (facing > 0) {
          const spec = Math.pow(facing, sharp) * strength * baseAlpha;
          if (spec > 0.012) {
            let hi = ((lightHuePhase + hueBias + col * 0.7 + row * 0.5) | 0) % STEPS;
            if (hi < 0) hi += STEPS;
            gfx.globalAlpha = spec; curAlpha = spec;
            gfx.fillStyle = lightPalette[hi];
            gfx.fillText(chars[lvl], xPx, yPx);

            // brightness-gated glow: only peak-band cells get a soft halo —
            // a 4-offset fake bloom + brighter core (no shadowBlur in the hot path)
            if (spec > glowThr) {
              const g = ((spec - glowThr) / glowRange) * glowStr;
              const ch = chars[lvl];
              gfx.fillStyle = glowPalette[hi];
              gfx.globalAlpha = g * 0.16;
              gfx.fillText(ch, xPx - 1, yPx);
              gfx.fillText(ch, xPx + 1, yPx);
              gfx.fillText(ch, xPx, yPx - 1);
              gfx.fillText(ch, xPx, yPx + 1);
              gfx.globalAlpha = g * spec; curAlpha = g * spec;
              gfx.fillText(ch, xPx, yPx);
            }
          }
        }
      }
    }
  }

  if (curAlpha !== 1) gfx.globalAlpha = 1;
  if (hasTransform) gfx.restore();

  // Note: frameIndex advance is NOT done here; the wrapper increments it after
  // each non-static draw call.
}

// Re-export TWO_PI for wrapper convenience (avoids a direct bake import there).
export { TWO_PI, clamp };
