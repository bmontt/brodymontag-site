/* ─── ASCII engine — shared types ───────────────────────────────────────────── */

/** A pre-baked seamless loop of per-cell amplitude levels (0-5). */
export interface FrameBuf {
  data: Uint8Array;
  cols: number;
  rows: number;
  frames: number;
}

/**
 * The subset of asciiConfig that `precompute` reads.
 * Field names are intentionally identical to asciiConfig keys so callers can
 * pass asciiConfig directly (structural supertype — fine under TS structural typing).
 */
export interface BakeParams {
  orbitFracLo:  number;
  orbitFracHi:  number;
  waveFreqLo:   number;
  waveFreqHi:   number;
  oscCycles:    number;
  waveSpeed:    number;
  lensR:        number;
  lensG:        number;
  dt:           number;
}

/**
 * Static tuning fields that `draw` reads from asciiConfig.
 * The wrapper builds one of these from asciiConfig and passes it on every call.
 */
export interface DrawConfig {
  trailMs:           number;
  repelR:            number;
  repelCore:         number;
  shimmerMin:        number;
  lightSharpness:    number;
  glowThresholdFrac: number;
  contentDim:        number;
}

/** Per-frame inputs to `draw`. */
export interface DrawInput {
  frameIndex:    number;
  /** 0–1 smoothstepped readability calm (subpage → 1, hero → 0). */
  past:          number;
  isStatic:      boolean;
  now:           number;
  /** Current light angle in radians. Updated by the wrapper each frame. */
  lightAngle:    number;
  /** Current light hue phase offset (index units). Updated by wrapper. */
  lightHuePhase: number;
}

/** A bake-cache entry, extended with stateId for multi-skin future use. */
export interface CacheEntry {
  key:     string;
  stateId: string;
  buf:     FrameBuf;
  normX:   Float32Array<ArrayBuffer>;
  normY:   Float32Array<ArrayBuffer>;
}
