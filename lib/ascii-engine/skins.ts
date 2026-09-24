/* ─── ASCII engine — skins ──────────────────────────────────────────────────── */

/**
 * An EraSkin fully describes the visual character of the ASCII field for one
 * era/chapter. The journey "assembles" the field from sparse/cool/dim (origins)
 * to dense/warm/bright (now) purely through these draw-time parameters — no
 * re-baking. lerpSkin() blends two skins continuously across a chapter boundary;
 * discrete fields (chars, levelLut) are dithered per-cell in draw() so the glyph
 * vocabulary cross-fades instead of popping.
 */
export interface EraSkin {
  /** Length-6 remap of baked levels 0–5. Identity = [0,1,2,3,4,5]. */
  levelLut: readonly number[];
  /** Glyph vocabulary; indexed by the *remapped* level. */
  chars: readonly string[];
  /** Overall field intensity multiplier (folds in the old contentDim). */
  styleAlphaMul: number;
  /** Hue bias (in palette-step units) added before tint lookup. */
  lightHueBias: number;
  /** Tint saturation (0 = pure white) — selects the prebuilt palette. */
  lightSat: number;
  /** Max specular highlight alpha. */
  lightStrength: number;
  /** Halo alpha multiplier above the glow threshold. */
  glowStrength: number;
  /** Field transform about viewport center (subtle per-era drift/zoom). */
  transform: { scale: number; rotate: number };
  /** Per-cell keep-probability (1 = keep all → "assembly" as it climbs to 1). */
  density: number;
  /** Where the field carves space for the reading column. */
  carve: {
    mode: "center" | "left" | "right" | "none";
    width: number;   // half-width fraction of viewport
    calm: number;    // extra dimming inside the column
  };
  /** Wave-field variant selector (0 = current two-body field). Phase 3c. */
  fieldState: 0 | 1 | 2;
}

/** Base tones for amplitude levels 0–5 (calm steel → neutral). */
export const STYLES: readonly string[] = [
  "",
  "rgba(190,200,215,0.060)",
  "rgba(190,200,215,0.092)",
  "rgba(210,212,218,0.112)",
  "rgba(210,212,218,0.098)",
  "rgba(210,212,218,0.110)",
];

/**
 * DEFAULT_SKIN reproduces today's exact visual output. The detail-page wrapper
 * (ascii-bg.tsx) passes this with past-driven dimming, so styleAlphaMul=1 and
 * carve params match the old asciiConfig exactly → pixel-identical.
 */
export const DEFAULT_SKIN: EraSkin = {
  levelLut:      [0, 1, 2, 3, 4, 5],
  chars:         [" ", "·", "∘", "╌", "┼", "◆"],
  styleAlphaMul: 1,
  lightHueBias:  0,
  lightSat:      0.58,
  lightStrength: 0.26,
  glowStrength:  0.55,
  transform:     { scale: 1, rotate: 0 },
  density:       1,
  carve: { mode: "center", width: 0.34, calm: 0.55 },
  fieldState: 0,
};

/* ─── section skins ─────────────────────────────────────────────────────────────
 * One skin per thematic section (see lib/chapters.ts). The Vessel maps chapter
 * index → id → skin, falling back to DEFAULT_SKIN. Distinct character per
 * section: hero = open showcase; code = structured/cool/crisp; music =
 * warm/dense/energetic; timeline = sparse entry point that EVOLVES internally
 * (see ERA_SEQUENCE / evolveEra) as you scroll the horizontal year track;
 * epilogue = a calm, present-day close (kept near the era end so leaving the
 * timeline is continuous). First-pass tuning — every value is a named knob.
 */
export const SECTION_SKINS: Record<string, EraSkin> = {
  hero: {
    levelLut:      [0, 1, 2, 3, 4, 5],
    chars:         [" ", "·", "∘", "╌", "┼", "◆"],
    styleAlphaMul: 1.0,
    lightHueBias:  0,
    lightSat:      0.58,
    lightStrength: 0.26,
    glowStrength:  0.55,
    transform:     { scale: 1.0, rotate: 0 },
    density:       1.0,
    carve: { mode: "center", width: 0.34, calm: 0.0 },
    fieldState: 0,
  },
  code: {
    levelLut:      [0, 1, 2, 3, 4, 5],
    chars:         [" ", "·", "∶", "╌", "┼", "▦"], // crisp, structured glyphs
    styleAlphaMul: 0.50,
    lightHueBias:  48,                              // cool tint
    lightSat:      0.40,
    lightStrength: 0.22,
    glowStrength:  0.42,
    transform:     { scale: 1.0, rotate: -0.004 },
    density:       0.85,
    carve: { mode: "center", width: 0.34, calm: 0.55 },
    fieldState: 0,
  },
  music: {
    levelLut:      [0, 1, 2, 3, 4, 5],
    chars:         [" ", "·", "∘", "○", "❉", "◆"], // rounder, warmer glyphs
    styleAlphaMul: 0.60,
    lightHueBias:  6,                               // warm tint
    lightSat:      0.62,
    lightStrength: 0.30,
    glowStrength:  0.62,
    transform:     { scale: 0.99, rotate: 0.005 },
    density:       1.0,
    carve: { mode: "center", width: 0.34, calm: 0.52 },
    fieldState: 0,
  },
  timeline: {
    // entry point ≈ the first era (origins) so crossing music→timeline thins
    // the field as the chronology rewinds to its start.
    levelLut:      [0, 1, 1, 2, 2, 3],
    chars:         [" ", "·", "·", "∙", "∘", "∘"],
    styleAlphaMul: 0.40,
    lightHueBias:  40,
    lightSat:      0.30,
    lightStrength: 0.13,
    glowStrength:  0.28,
    transform:     { scale: 1.05, rotate: -0.020 },
    density:       0.42,
    carve: { mode: "center", width: 0.32, calm: 0.45 },
    fieldState: 0,
  },
  epilogue: {
    levelLut:      [0, 1, 2, 3, 4, 5],
    chars:         [" ", "·", "∘", "╌", "┼", "◆"],
    styleAlphaMul: 0.50,
    lightHueBias:  6,
    lightSat:      0.50,
    lightStrength: 0.22,
    glowStrength:  0.44,
    transform:     { scale: 0.99, rotate: 0 },
    density:       0.82,
    carve: { mode: "center", width: 0.40, calm: 0.55 },
    fieldState: 0,
  },
};

/* ─── era sequence (timeline-internal evolution) ─────────────────────────────────
 * The chronological assembly the vessel plays WITHIN the horizontal timeline:
 * sparse/cool/dim (2021) → dense/warm/bright (2026). evolveEra(t) blends across
 * it by the timeline's horizontal-scroll progress.
 */
export const ERA_SEQUENCE: EraSkin[] = [
  // origins (2021–23)
  {
    levelLut: [0, 1, 1, 2, 2, 3], chars: [" ", "·", "·", "∙", "∘", "∘"],
    styleAlphaMul: 0.40, lightHueBias: 40, lightSat: 0.30, lightStrength: 0.13,
    glowStrength: 0.28, transform: { scale: 1.05, rotate: -0.020 }, density: 0.42,
    carve: { mode: "center", width: 0.32, calm: 0.45 }, fieldState: 0,
  },
  // 2024
  {
    levelLut: [0, 1, 2, 2, 3, 4], chars: [" ", "·", "∘", "∘", "╌", "┼"],
    styleAlphaMul: 0.47, lightHueBias: 28, lightSat: 0.40, lightStrength: 0.17,
    glowStrength: 0.38, transform: { scale: 1.03, rotate: -0.012 }, density: 0.64,
    carve: { mode: "center", width: 0.33, calm: 0.48 }, fieldState: 0,
  },
  // 2025
  {
    levelLut: [0, 1, 2, 3, 4, 5], chars: [" ", "·", "∘", "╌", "┼", "◆"],
    styleAlphaMul: 0.55, lightHueBias: 14, lightSat: 0.50, lightStrength: 0.23,
    glowStrength: 0.50, transform: { scale: 1.01, rotate: -0.006 }, density: 0.84,
    carve: { mode: "center", width: 0.34, calm: 0.50 }, fieldState: 0,
  },
  // now (2026)
  {
    levelLut: [0, 1, 2, 3, 4, 5], chars: [" ", "·", "∘", "╌", "┼", "◆"],
    styleAlphaMul: 0.64, lightHueBias: 0, lightSat: 0.64, lightStrength: 0.30,
    glowStrength: 0.64, transform: { scale: 0.985, rotate: 0.004 }, density: 1.0,
    carve: { mode: "center", width: 0.34, calm: 0.50 }, fieldState: 0,
  },
];

/* ─── blending ────────────────────────────────────────────────────────────────── */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Continuously blend two skins. Numeric fields interpolate; discrete fields
 * (chars, levelLut, carve.mode, fieldState) snap at t=0.5 — but draw() dithers
 * chars/levelLut per-cell using the from/to skins directly, so the t=0.5 choice
 * here only matters when dithering is disabled.
 */
export function lerpSkin(a: EraSkin, b: EraSkin, t: number): EraSkin {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    levelLut:      t < 0.5 ? a.levelLut : b.levelLut,
    chars:         t < 0.5 ? a.chars : b.chars,
    styleAlphaMul: lerp(a.styleAlphaMul, b.styleAlphaMul, t),
    lightHueBias:  lerp(a.lightHueBias, b.lightHueBias, t),
    lightSat:      lerp(a.lightSat, b.lightSat, t),
    lightStrength: lerp(a.lightStrength, b.lightStrength, t),
    glowStrength:  lerp(a.glowStrength, b.glowStrength, t),
    transform: {
      scale:  lerp(a.transform.scale, b.transform.scale, t),
      rotate: lerp(a.transform.rotate, b.transform.rotate, t),
    },
    density: lerp(a.density, b.density, t),
    carve: {
      mode:  t < 0.5 ? a.carve.mode : b.carve.mode,
      width: lerp(a.carve.width, b.carve.width, t),
      calm:  lerp(a.carve.calm, b.carve.calm, t),
    },
    fieldState: t < 0.5 ? a.fieldState : b.fieldState,
  };
}

/**
 * Resolve the timeline vessel skin for horizontal progress t ∈ [0,1] by blending
 * across ERA_SEQUENCE. t=0 → first era (origins), t=1 → last era (now). Also
 * returns the two bracketing eras so draw() can dither glyphs across them.
 */
export function evolveEra(t: number): {
  skin: EraSkin;
  from: EraSkin;
  to: EraSkin;
  i: number; // lower bracketing era index (palette select: f<0.5 ? i : i+1)
  f: number;
} {
  const n = ERA_SEQUENCE.length;
  const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
  const x = clamped * (n - 1);
  let i = Math.floor(x);
  if (i > n - 2) i = n - 2;
  const f = x - i;
  const from = ERA_SEQUENCE[i];
  const to = ERA_SEQUENCE[i + 1];
  return { skin: lerpSkin(from, to, f), from, to, i, f };
}
