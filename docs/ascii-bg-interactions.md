# ASCII Background — Interaction & Light LLD

Low-level design for the interactive + lighting layers on the gravitational-wave ASCII
background (`components/ascii-bg.tsx`): seamless looping, a cursor repulsor, and a
directional stochastic-light shine.

## Design constraint: preserve the precompute

The base field is **fully precomputed** — `N` frames of wave physics baked into a
`Uint8Array` at mount, playback is pure array reads. All effects are **runtime overlays
that never touch the baked trig**, so the precompute optimization stays intact. Every
hyperparameter lives in `lib/ascii-config.ts` as a **fixed, frozen constant** — there is
no runtime UI to change them (values are tuned once in code).

```
┌─────────────────────────────────────────────────────────┐
│ LAYER 0  precomputed wave field   (baked, seamless loop) │
│ LAYER 1  cursor repulsor bubble   (runtime, local only)  │  ← clears + trails
│ COLOR    directional light shine  (runtime specular)     │  ← stochastic angle
│ CALM     scroll readability dim   (runtime multiplier)   │  ← parts behind text
└─────────────────────────────────────────────────────────┘
```

### Seamless loop (reparameterized bake)

The bake is parameterized by **loop-phase** `τ = f/N` rather than real time, so every
time term completes an integer number of cycles per loop and frame `N ≡ frame 0` (no
jump, matched velocity at the seam):

- orbit angle `θ = 2π·τ` — exactly one revolution per loop
- wave phase `ψ = 2π·Kwave·τ` — `Kwave = max(1, round(waveSpeed·6))` cycles
- breath `s = (1 − cos(2π·oscCycles·τ))/2 ∈ [0,1]` — sweeps `orbitFrac` and `waveFreq`
  between their Lo/Hi bounds **in sync** (orbit grows as frequency shrinks)

`N = clamp(round(2π/dt), 180, 480)` — so `dt` reads as orbital speed / loop length
(`dt = 0.0165 → N ≈ 381 ≈ 21 s` at 18 fps). `(1 − cos)` has zero derivative at the seam,
so even the breath's velocity matches across the loop point.

---

## 1. Cursor repulsor — "negative mass" bubble

Thematically: the two black holes bend space *inward* (gravitational lensing). The cursor
is the inverse — a **negative-mass repulsor** that pushes the field *outward*, carving a
clear bubble that trails as it moves.

**Mechanism (per rendered frame):**
- A `trail` ring buffer holds recent pointer samples `{x, y, t}`, pruned past `TRAIL_MS`.
- Suppression of a cell = `max` over live trail points of a smoothstep falloff; the
  influence radius **shrinks with sample age**, producing a comet tail of cleared space
  behind fast motion.
- Suppression drives `ctx.globalAlpha = 1 - supp` → smooth, elegant fade (no hard disc).
- A **bounding-box reject** keeps the per-cell trail loop local: ~99% of cells skip it.

```
supp(cell) = max over trail p of:
   r   = REPEL_R * (0.4 + 0.6 * ageFactor)     // ageFactor: 1 recent → 0 old
   t   = clamp(1 - dist(cell,p)/r, 0, 1)
   s   = t*t*(3-2t) * ageFactor                 // smoothstep × recency
core: dist < REPEL_CORE ⇒ supp = 1 (skip cell)
```

## 2. Directional "stochastic light" shine

Not a full rainbow — a subtle **specular highlight** that catches the edges of glyphs as
if lit from a single angle, where the angle slowly **random-walks**. Replaces the earlier
crest-rainbow.

- A unit light vector `(lx, ly) = (cos α, sin α)`; `α += lightDrift + (rand−0.5)·lightJitter`
  each frame → a steady rotation with stochastic wander.
- Per-cell outward normal `(nx, ny)` (precomputed from screen center at setup) gives
  `facing = nx·lx + ny·ly`; the highlight = `facing^lightSharpness · lightStrength`, so
  only cells whose edge faces the light pick up the shine (tight, side-lit band).
- Tint comes from `LIGHT[]` — a **low-saturation, near-white** palette
  (`hsl(h, lightSat, 0.86)`); a slowly drifting `lightHueDrift` + per-cell offset gives
  "parts" a faintly different shine. The glyph is drawn a second time on its own pixels
  with this tint at the spec alpha → light appears to catch its outline.
- Only levels ≥ `shimmerMin` catch light; `lightSat = 0` makes it pure white light.

## 3. Scroll readability calm

Past the hero the field competes with body text, so it's dimmed where it matters — as a
per-cell alpha multiplier, never a layout change.

- `past = smoothstep(clamp(scrollY / (0.8·vh), 0, 1))` — 0 in the hero, 1 once the first
  content viewport is reached (`scrollY` tracked via a passive `scroll` listener).
- Global dim: `dim = lerp(1 → contentDim, past)` fades the whole animation down.
- Reading-column calm: a per-column multiplier dims the centred column
  (`±columnWidth·W`, smoothstep edge) by a further `columnCalm·past`, so the field
  "parts" around the text while staying lively in the side margins. Cells whose multiplier
  drops below ~0.012 are skipped entirely (free clearing).

---

## Performance

Per frame added cost: trail prune `O(trail)`, a 4-compare box reject per cell, a short
trail loop for the few hundred cells inside the bubble, and a dot-product + one extra
`fillText` for lit cells. The `Math.pow` for the specular falloff runs only on lit-facing
cells. Stays within the `fpsCap` budget (default 18); idle (no pointer) cost is
effectively the bare playback.

The one-time bake is `O(N · cells)` at mount and on resize. At `dt = 0.0165`,
`cellW = 8` on 1080p that's ≈ 381 × 12 000 ≈ 4.6 M cells — a sub-second hitch masked by
the 1.5 s fade-in.

## Tunables

All live in `lib/ascii-config.ts` (`asciiConfig`) as frozen `as const` constants —
**no runtime UI**. Field params change the bake (re-run on resize); Light and Readability
params are read live each frame. Re-tune by editing the file.
