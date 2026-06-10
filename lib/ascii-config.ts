/**
 * Fixed hyperparameters for the ASCII gravitational-wave background.
 *
 * These are baked constants — there is intentionally no runtime UI to change
 * them. The values were tuned once and frozen; edit here to re-tune.
 *
 * The wave field is baked over a seamless loop: every time-dependent term is a
 * function of loop-phase τ = f/N (integer cycles per loop), so frame N ≡ frame 0.
 * `dt` sets the loop length (≈ one orbit per loop); `orbitFrac`/`waveFreq`
 * oscillate between their Lo/Hi bounds `oscCycles` times per loop, in sync.
 */

export const asciiConfig = {
  // Field (baked) ----------------------------------------------------------
  orbitFracLo:    0.09,   // orbit radius at the low point of the breath
  orbitFracHi:    0.16,   // orbit radius at the high point of the breath
  waveFreqLo:     0.012,  // wave freq paired with orbitFracLo
  waveFreqHi:     0.007,  // wave freq paired with orbitFracHi (synced/inverse)
  oscCycles:      1,      // breaths per loop (integer → seamless)
  waveSpeed:      0.30,   // → wave temporal cycles per loop (×6, min 1)
  lensR:          89,
  lensG:          1,
  dt:             0.0165, // smaller = slower orbit = longer seamless loop
  cellW:          8,
  cellH:          22,
  fpsCap:         18,
  // Cursor repulsor — the field clears a bubble around the pointer ---------
  repelR:         59,
  repelCore:      18,
  trailMs:        380,
  // Directional "stochastic light" shine -----------------------------------
  shimmerMin:     2,      // min amplitude level that catches light (1–5)
  lightSharpness: 3.4,    // specular exponent — tightness of the shine
  lightStrength:  0.22,   // max highlight alpha
  lightJitter:    0.07,   // stochastic per-frame wander of the light angle
  lightDrift:     0.015,  // steady rotation of the light angle
  lightSat:       0.58,   // tint saturation (0 = pure white light)
  lightHueDrift:  1.2,    // how fast the faint tint hue travels
  // Readability — calm the field behind content past the hero ---------------
  contentDim:     0.42,   // overall animation intensity once scrolled past hero
  columnCalm:     0.55,   // extra dimming inside the centred reading column
  columnWidth:    0.34,   // reading-column half-width as a fraction of viewport
} as const;

export type AsciiConfig = typeof asciiConfig;
