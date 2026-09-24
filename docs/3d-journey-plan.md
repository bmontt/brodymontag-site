# 3D Journey — Refactor Plan

Plan to turn brodymontag.com from a 2D scroll journey into an interactive **3D camera
flight** in the spirit of the angular.dev homepage animation, without losing the site's
ASCII identity. Written 2026-09-24. Status: **approved 2026-09-24 · Phase 0 done · Phase 1 spike
done (§8.1), awaiting Brody's visual go/no-go**.

---

## 0. TL;DR

- **Interpretation.** "AngularJS-style journey" is read as the *angular.dev homepage scroll
  animation* (logo peels apart → camera dives through the shield → "Works at any scale" /
  meteor field / "Build for everyone"), **not** a framework rewrite. AngularJS 1.x is
  end-of-life, and that animation was framework-agnostic code (OGL + GSAP, later plain
  CSS+JS). Stay on Next.js 16. See §2.
- **Concept: "The Binary."** The gravitational-wave field is already a simulation of two
  orbiting black holes. Make it literal 3D: the two bodies stand for the two halves (code and
  sound). The journey follows the physics: **orbit → inspiral → merger → ringdown**. The
  timeline is the inspiral (a chirp, or a riser in DJ terms), and the epilogue *"technology
  in service of sound"* is the merger (the drop).
- **Tech.** React Three Fiber 9 + three.js, with a **custom ASCII post-process pass** that
  ports `lib/ascii-engine/draw.ts` to GLSL. The wave field moves from the CPU bake into a
  **vertex shader**. GSAP ScrollTrigger stays the single scroll writer, and the existing
  `journey-store` just gains a camera rig. The current 2D canvas engine becomes the
  **fallback** (reduced motion, low-end GPUs, no WebGL).
- **Opening moment.** The page first renders exactly like today's flat 2D field. On the
  first scroll the camera **dolly-zooms and tilts**, and the flat field turns out to be a 3D
  sheet you then dive through.
- **Effort.** ~22–32 focused days in 7 phases, each with a go/no-go gate. Phase 0 lands the
  uncommitted journey WIP first, because nothing should be built on a floating diff.

---

## 1. Where things stand (audited 2026-09-24)

| Area | State |
|---|---|
| Stack | Next.js 16.2.9 (Turbopack, App Router), React 19.2.4, Tailwind v4, GSAP 3.15 (+ SplitText, ScrambleText), framer-motion 12, Vercel |
| Live site | Older **tabbed** layout (presence · music · code · about · contact). The journey refactor is **not deployed**. |
| Local `main` | 1 commit ahead of `origin` (unpushed) **plus a large uncommitted WIP**: 8 modified files and new `components/journey/*`, `components/cards/*`, `components/vessel.tsx`, `lib/ascii-engine/*`, `lib/chapters.ts`, `lib/journey-store.ts`, `lib/timeline.ts` |
| WIP health | `tsc --noEmit` clean; `next build` green (4 routes). Playwright smoke-tested 2026-06-20 per the vault note. |
| Home JS payload | **11 scripts · ~957 KB raw · ~306 KB gzip** (measured from today's build) |
| Journey architecture | Server-rendered chapters (`app/page.tsx`) inside a client shell (`JourneyRoot` → `Vessel` + `TimelineNav` + `JourneyController`). **One global ScrollTrigger is the single writer** to a module store; the canvas rAF loop reads that store directly, so React never re-renders on scroll. |
| Chapters | hero → code → music → timeline (pinned horizontal year track) → epilogue |
| Vessel | 2D canvas ASCII field: CPU-baked seamless τ-loop, per-section `EraSkin`s blended with per-cell glyph dither, scroll-velocity phase, cursor repulsor, stochastic light |
| Dead code | `components/section-tabs.tsx` (no importers). framer-motion is used in 7 files (hero-chapter, typed-heading, platform-card, back-link, section-tabs, both detail pages). |

**Why this matters for the plan:** the hard architectural work is already done. The
single-writer store, the rAF-reads-store loop, the skin system and the reduced-motion
branch are the right foundations for 3D. The refactor **swaps the renderer and adds a
camera. It does not replace the journey system.**

---

## 2. Research: what the angular.dev journey actually was

Primary sources: Monogram's two build write-ups, and the Angular repo (`adev/src/app/features/home`).

**Timeline of the real thing**

1. **Nov 2023 (v17):** Monogram built it in **WebGL with OGL** (a three.js-like micro-library
   chosen for bundle size). It was prototyped first as a plain GSAP ScrollTrigger + SVG +
   MorphSVG page, then converted to WebGL using the same SVGs as **MSDF** textures. GSAP
   tweens values into each view's `userData`, and each `View.update()` applies them (a
   View-Controller pattern). Other pieces: delta-time-corrected lerp for 30/60/120 Hz, a
   single 512² gradient texture reused across scenes, instanced lines, and `?debug` /
   `?gradient` query flags.
2. **Dec 2024 (#59865):** the WebGL version was **replaced by a CSS+JS version** built on a
   small in-house engine. Fixed-position *layers*, rules like `{selector, timeframe:[a,b],
   from, to}`, and a scroll plugin that inserts a tall **spacer** so scroll position scrubs
   the master timeline.
3. **Jan 2026:** angular.dev got a **new homepage without the scroll animation**. The
   orphaned component was deleted in Aug 2026.

**The choreography (from the deleted `animation-definition.ts`, timings × 1.55)**

| t | Move | Why it feels 3D |
|---|---|---|
| 0–5 | Logo slides right while letters fade out one at a time (r, a, l, u, g, n, A) | Deconstruction draws focus to the mark |
| 5.5–10 | Shield `scale(1 → 50) rotate(0 → −360°)` | **Camera dives through the logo.** This is the signature move. |
| 5.7–8 | "Works at any scale" `scale(0.1 → 1)`, fade in | The scene arrives from depth |
| 8–18 | Meteor field `scale(1.42 → 1)` while meteors fly in over **4 random waves** (5% / 15% / 25% / rest) | Camera pull-back plus a particle swarm |
| 11–12.5, 19–20.5 | Scenes exit with `scale(1 → 1.5)`, fade out | The scene passes *behind the camera* |
| 19.5–21 | All meteors fly out together | Sweeps the stage before the next scene |
| 22–25 | "Build for everyone" fades in, and the gradient `background-position` sweeps across the title | Brand-color reveal |

**Takeaways for us**

- The "3D" came from a few moves: **scale-from-depth in, scale-past-camera out, a fly-through
  of the mark, and particle waves**. These translate directly into a real camera in a real
  scene.
- **Scroll only scrubs time.** Content sits on a fixed stage, which is the same thesis as the
  current `Vessel` (fixed canvas, content flows over it).
- **Caution:** Angular moved WebGL → CSS → nothing. A heavy scroll-jacked hero has a
  maintenance and performance cost, and it can bury the content. So every scene here keeps
  its content in the DOM, pins are short, and there is a real fallback path.

**Framework question:** porting to Angular 22 would mean rewriting ~25 components and pages
for **zero visual gain**. The journey is GSAP + a store + a canvas, and none of that is tied
to a framework. If a literal Angular rewrite is actually wanted, that is a separate project
(see §12, decision 1).

---

## 3. Creative concept — "The Binary"

The field on the site today is a port of `blackholeASCII.py`: two orbiting masses,
interfering waves, and lensing. Instead of treating it as wallpaper, **the whole site
becomes a descent through that binary system**.

- **Body A (cool):** the build. Code, systems, models.
- **Body B (warm):** Monty. Rooms, records, the collective.
- **The orbit decays year by year:** the timeline is the inspiral, with the wave frequency
  rising (a chirp, or a riser).
- **Merger → ringdown:** the two halves become one remnant. The thesis line *technology in
  service of sound* lands as the drop.

The skin system already encodes this arc: `ERA_SEQUENCE` goes from sparse/cool/distant to
dense/warm/inspiral. The 3D version gives it geometry.

### Storyboard

| # | Scene (chapter id) | Scroll | 3D stage | DOM content (unchanged source) | Borrowed angular move | Skin |
|---|---|---|---|---|---|---|
| 0 | **Prologue** (`hero`) | pinned ~250dvh desktop, ~150dvh mobile | Starts as an **orthographic top-down view identical to today's 2D field**. Scroll triggers a **dolly-zoom** into perspective and tilts ~60°, revealing a 3D wave *sheet* with two glowing bodies. The camera rolls 360° while diving between them and punches through the sheet. | Typed name, subtitle, links, elevator pitch. Name glyphs peel off in reverse order during the tilt. | Letter-peel + shield `scale×50 rotate −360°` fly-through | `hero` |
| 1 | **The build** (`code`) | ~200dvh | Below the sheet: a cool, structured **lattice**. One **monolith per project** is placed along the camera path, and the stack orbits as a glyph ring around Body A. | Projects, experience, stack | "Works at any scale" in from 0.1, out to 1.5 | `code` |
| 2 | **Monty** (`music`) | ~200dvh | The lattice melts into a warm room around Body B. **Event photos are panels at depth that resolve from ASCII into a real photo as the camera approaches.** Supported-artist logos arrive as a **meteor shower in 4 waves**. | Next up, gigs, supported artists, releases, SoundCloud, collective | Meteor waves + field pull-back `1.42 → 1` | `music` |
| 3 | **Worldline** (`timeline`) | pinned, ~70dvh per year | Replaces the horizontal track. The camera flies **down a z-axis worldline through year gates 2021 → 2026**. The two bodies' orbit visibly tightens and speeds up (the chirp). The field assembles from sparse to dense. | Year panels. Each DOM panel scales 0.75 → 1 → 1.5 in sync with the camera passing its gate. | "Loved by millions" depth in/out per year | `ERA_SEQUENCE` |
| 4 | **Merger** (`epilogue`) | ~150dvh | Inspiral → **merger flash** → ringdown waves. The single remnant can be **drag-orbited**. | About, presence, contact. The headline gets the gradient-sweep reveal. | "Build for everyone" gradient sweep | `epilogue` |

**Skip affordances:** a persistent "skip intro ↓" during the prologue, and the right-rail
`TimelineNav` jumps straight to any station. No content is ever gated behind the animation.

---

## 4. Technical approach

### 4.1 Options considered

| Option | 3D fidelity | Bundle | Fits ASCII identity | Verdict |
|---|---|---|---|---|
| **A. R3F + three.js + custom ASCII pass** | Real camera, lighting, depth | Largest (lazy-loaded) | Yes. Glyph pass in GLSL, same skins. | **Recommended** |
| B. CSS 3D transforms + current 2D canvas (angular's 2024 approach) | Faked with scale | ~0 added | Yes | Fallback idea only. Doesn't deliver "more 3D". |
| C. OGL, hand-rolled (angular's 2023 approach) | Real | Small | Yes | No React integration or postprocessing ecosystem, and more custom code to own |
| D. Spline / prebuilt scene runtimes | Real | Heavy | No (hard to ASCII-ify) | Reject |
| E. three.js WebGPU renderer + TSL | Real | Similar to A | Yes | Later. The `postprocessing` library is WebGL-only. Revisit once the pass is stable. |

Versions checked 2026-09-24: `three@0.186.1`, `@react-three/fiber@9.8.0` (peer React
`>=19 <19.4`, so compatible with 19.2.4), `@react-three/drei@10.7.8`,
`@react-three/postprocessing@3.1.2`, `postprocessing@6.39.5` (ships `ASCIIEffect`, used for
the spike), `lenis@1.3.26`, `maath@0.10.8`. **Avoid `@theatre/*`** (no releases since
May 2024).

### 4.2 Architecture

```
 scroll ─► GSAP ScrollTrigger  (journey-controller: still the ONLY writer)
              │  master timeline tweens plain objects (angular's userData pattern)
              ▼
         journey-store ─ chapter · blend · velocity · timelineProgress   (exists)
                       ─ rig { u, fovMix, roll, tilt, lookAhead }        (new)
                       ─ scene { weights[5], merge, meteorWave, gateT }  (new)
                       ─ pointer { ndc, trail[], hoveredId }             (new)
                       ─ tier: "3d" | "2d" | "static"                    (new)
              │  read per frame, never through React state
      ┌───────┴────────────────────────────┐
      ▼                                    ▼
  <Stage> (R3F, lazy, ssr:false)       <Vessel2D>  = today's vessel.tsx
   ├ CameraRig  – spline + damping        (fallback + first paint)
   ├ Scenes     – weighted by scene.weights
   └ AsciiPass  – skins → uniforms
```

**Layering (unchanged z-model):** z-0 ghost numerals · **z-10 stage canvas** (replaces the
vessel) · z-20 DOM reading layer · z-50 nav.

**The stage lives in a layout, not the page.** Put `<StageRoot/>` in a route-group layout
(`app/(site)/layout.tsx`) so the canvas **survives navigation**. The home route runs the
journey. `/projects/[slug]` parks the camera *inside that project's monolith*, and
`/shows/[slug]` parks it inside that show's panel. Combined with React `<ViewTransition>`
(Next 16 `experimental.viewTransition`), clicking a project **flies into it** instead of
cutting to a new page. On the 3D tier this replaces the separate `AsciiBg` on detail pages;
the 2D and static tiers keep today's `AsciiBg` there.

### 4.3 The wave field on the GPU

`bake.ts#precompute` evaluates the two-body interference on the CPU for N×cells (~4.6M
cells) and caches the result. In 3D it becomes a **vertex shader on a subdivided plane**
(roughly 256² vertices):

- The body positions come from uniforms `uTau, uOrbitR, uWaveFreq`, using the same seamless
  τ-loop math. `uTau` still advances by the base rate plus scroll velocity × GAIN, so the
  "hybrid phase velocity" behavior carries over.
- **Amplitude is evaluated per fragment** from world position (so a cell-center sample is
  exact, which is what makes the parity gate possible). Height displacement is per vertex:
  `height = amp × uHeight`, where `amp = |sin(wf·lens(r1) − ψ + atan(dy1,dx1)) + …| × 0.5`,
  exactly as today. The analytic normal comes from the derivative, so **light comes from real
  geometry** instead of today's radial screen-center normals.
- **Merger:** `uMerge` 0 → 1 drives `orbitR → 0` with rising frequency (the chirp). After
  that, a single-source ringdown decays exponentially.
- **Payoff:** no bake, no bake cache, no worker. This removes the risk behind the
  previously deferred "Phase 3c worker field-states" entirely.

### 4.4 The ASCII pass (the identity-preserving piece)

A custom `postprocessing` `Effect` that ports `draw.ts` feature for feature. Glyphs stay on a
**fixed screen-space grid** and only their values change. This is why today's field reads
cleanly, and it's non-negotiable in 3D.

| `draw.ts` feature | GLSL port |
|---|---|
| amplitude → level 0–5 (`ampToLevel` thresholds) | Snap UV to the cell center, sample the scene buffer, then threshold with a `uLevelEdges[6]` uniform |
| `levelLut`, `chars` per skin | `uLut[6]` plus glyph indices into a **runtime glyph atlas** (Geist Mono drawn into a CanvasTexture after `document.fonts.ready`) |
| density cull + per-cell dither between skins A/B | Hash(cell) vs `uDensity` / `uBlendT`, with two skin uniform blocks |
| carve reading column (`center/left/right/none`, width, calm) | `uCarve` vec3 + mode int |
| cursor repulsor + comet trail | `uTrail[18]` (xy + age), `uRepel` (R, core) |
| stochastic light, hue drift, sat, glow threshold | `uLightAngle`, `uHuePhase`, `uLightSat` (HSL in shader, no prebuilt palettes), `uGlow*` |
| `styleAlphaMul`, `lightHueBias`, `transform` | Direct uniforms. `transform` becomes a camera concern. |

**Mixed rendering:** each object writes an `asciiAmount` mask (1 = glyphs, 0 = true color).
The pass lerps between glyph output and real color per pixel. This is how event photos
*materialize out of ASCII* as the camera approaches, and how the merger flash blooms.

**Single source of truth:** `EraSkin` / `SECTION_SKINS` / `ERA_SEQUENCE` in `skins.ts` feed
**both** the 2D fallback and the GLSL pass, via a `skinToUniforms()` adapter. Skin tuning
happens once and applies to both renderers.

### 4.5 Scroll → camera ("the director")

- **Keep native scroll + ScrollTrigger.** Do **not** use drei `ScrollControls`: it moves
  scrolling into an inner div, which breaks Cmd-F, anchors and screen readers, and it fights
  the existing pins.
- **Master timeline:** one GSAP timeline scrubbed by the global `#journey` trigger, with one
  label per station. It tweens the store's `rig` and `scene` objects, the same pattern as
  angular's View `userData`.
- **Camera path:** a `CatmullRomCurve3` through authored stations (`lib/director/stations.ts`).
  `rig.u` is progress along the curve, and the look target runs ahead on the same curve by
  `lookAhead`. Station data sits next to `chapters.ts`.
- **Smoothing:** mouse-wheel `scrollY` is steppy, which angular's README also warns about.
  The rig applies frame-rate-independent damping (`maath/easing.damp3`, using delta time) so
  the camera glides even when scroll jumps. **Lenis stays optional:** decide in Phase 6 by
  feel, and if adopted, run it through `gsap.ticker` with `lenis.on('scroll',
  ScrollTrigger.update)`.
- **Snap:** keep today's desktop-only directional snap to station boundaries.
- **Worldline pin:** the timeline keeps its pin + `invalidateOnRefresh`, but instead of
  translating the track sideways it drives `scene.gateT`. The DOM panels are stacked
  absolutely and scale in and out in sync. The vertical-stack CSS default stays as the
  reduced-motion / no-JS layout.

### 4.6 Interactivity (the "more interactive" part)

| Feature | Mechanism | Priority |
|---|---|---|
| Cursor dents the spacetime sheet | Raycast the pointer onto the sheet, pass a negative-mass term into the vertex shader, and keep the ASCII bubble on top | P1 |
| Mouse-look parallax | Camera offset ±2° from pointer NDC, damped | P1 |
| DOM ↔ 3D linking | Hovering a project/gig card lights its monolith/panel, and the reverse (`data-station-id` ↔ `pointer.hoveredId`) | P1 |
| Hover tilt on 3D objects | Raycast, then the object turns toward the cursor and its glyphs brighten | P1 |
| **Click to fly in** | Camera dives into the object (~400 ms), then `router.push`, with `<ViewTransition>` for the DOM. The stage persists (§4.2). | P1 |
| Drag-orbit the remnant | Constrained orbit in the epilogue that eases back to rest | P2 |
| Keyboard travel | PageDown/arrow keys go to the next station, and `focusin` on a card moves the camera to it | P1 (a11y) |
| `?debug` | Draws the spline and stations, shows an FPS/draw-call HUD, and adds a scrubber (angular had `?debug`) | P1 (dev) |
| Gyro parallax (mobile) | `DeviceOrientationEvent`. iOS needs a permission tap, so it's opt-in. | P3 |
| **Audio-reactive mode** | Opt-in "sound on" toggle plays a **self-hosted Monty clip**. A WebAudio `AnalyserNode` drives uniforms (low end → orbit speed/amplitude, highs → shimmer). *The SoundCloud iframe can't be analyzed because it's cross-origin.* | P3 (stretch) |

---

## 5. Accessibility, fallbacks, SEO

**Capability gate** (`components/stage/stage-root.tsx`, runs before the 3D chunk loads):

```
prefers-reduced-motion ─────────────► tier "static": Vessel2D static frame per chapter,
                                        no pins, no snap, vertical timeline (today's reduce branch)
no WebGL2 · Save-Data · weak-device ─► tier "2d": today's animated Vessel2D
  heuristic (deviceMemory/cores/renderer)
else ────────────────────────────────► tier "3d": show Vessel2D immediately, lazy-load the
                                        stage, crossfade on the first rendered 3D frame
runtime: PerformanceMonitor declines ─► step down dpr → cell size → effects → hand off to "2d"
webglcontextlost ────────────────────► hand off to "2d" (no blank screen, ever)
```

- **All content stays server-rendered DOM** (RSC). SEO, Cmd-F, screen readers and text
  selection are unaffected. The canvas is `aria-hidden`.
- The reading-column **carve** keeps text contrast above the field, same as today.
- No hydration-sensitive initial state: the stage is `ssr:false`. Keep the
  `typed-heading` rule of never initializing state from `useReducedMotion()`.
- Mobile: cap dpr at 1.5, shorter pins, lower sheet subdivision, fewer meteors, no bloom, no
  snap.

---

## 6. Performance budget

| Metric | Target | How |
|---|---|---|
| LCP | Unchanged vs today | Hero text is DOM, and the 3D chunk loads *after* first paint |
| CLS | 0 | Fixed canvas, DOM layout unchanged |
| Home JS before 3D | ≤ today (~306 KB gz) | Remove framer-motion (7 files → GSAP/CSS) to offset growth |
| 3D chunk | Measure in Phase 1; **target ≤ 250 KB gz** | `next/dynamic({ ssr:false })` in a client component, loaded on idle after hero paint |
| Frame rate | 60 fps on an M-series laptop; 30 fps floor on a mid Android phone | Instancing (meteors, glyph rings), < 50 draw calls, `frameloop` paused when hidden (as today) |
| Lighthouse (mobile) | Perf ≥ 90 · A11y 100 | Checked at every phase gate |

---

## 7. What stays, changes, goes

| Stays | Changes | Goes |
|---|---|---|
| `content.json` as the single copy source | `vessel.tsx` → `Vessel2D` (fallback + first paint) | `section-tabs.tsx` (already dead) |
| RSC page composition in `app/page.tsx` | `journey-controller.tsx` gains the master timeline + rig writes | framer-motion (after the 7-file migration) |
| `chapters.ts` (+ station data) | `journey-store.ts` gains `rig` / `scene` / `pointer` / `tier` | Separate `AsciiBg` usage on detail pages (the persistent stage replaces it; the 2D engine stays as fallback) |
| Single-writer store pattern | Horizontal timeline → z-worldline (vertical fallback kept) | Horizontal-track CSS (`.is-horizontal`) once the worldline ships |
| `skins.ts` (now feeds both renderers) | Hero parallax: framer → GSAP | |
| `TimelineNav` rail, detail pages, cards | Detail pages sit on the persistent stage + view transitions | |

**Target file map (new):**

```
app/(site)/layout.tsx                 route group: hosts <StageRoot/> so it persists
components/stage/
  stage-root.tsx                      capability gate, tier select, lazy import, crossfade
  stage-canvas.tsx                    <Canvas> (dpr, frameloop, PerformanceMonitor, context-loss)
  camera-rig.tsx                      spline follow + damping + mouse-look
  ascii-pass.tsx                      custom Effect wrapper
  scenes/{prologue,build,monty,worldline,merger}.tsx
  objects/{wave-sheet,binary,monolith,photo-panel,meteor-field,year-gate,remnant}.tsx
  debug-hud.tsx                       ?debug only
lib/ascii-engine/gl/                  GLSL lives in TS template strings (no Turbopack loader)
  wave-shader.ts  ascii-effect.ts     (spike, exist)   skin-uniforms.ts (Phase 2)
lib/director/
  stations.ts  camera-path.ts  master-timeline.ts  route-presets.ts
```

---

## 8. Phased roadmap (each phase ends in a gate)

| Phase | Scope | Est. | Gate (definition of done) |
|---|---|---|---|
| **0 · Land the baseline** | Commit the journey WIP in logical conventional commits on a branch (`feat/journey`), push, get a Vercel **preview**, tag `pre-3d`. Delete `section-tabs.tsx`. | 0.5 d | Preview URL works; build green. *Merging to `main` (auto-deploys prod) is Brody's call.* |
| **1 · Spike** (Monogram-style "prototype first") | `/lab/3d` route (noindex): R3F canvas, GPU wave sheet, **stock `ASCIIEffect`**, camera on a spline driven by the *existing* store. Test cell sizes 8×22 / 7×14 / 6×12. | 2–3 d | **Go/no-go:** ≥ 55 fps on laptop, 3D chunk size measured, reads on-brand. If no-go, fall back to option B (CSS depth + current canvas). |
| **2 · Engine port** | Custom ASCII pass (every row in §4.4), glyph atlas, `skinToUniforms()`, merger/ringdown uniforms. | 4–6 d | **Flat-sheet parity:** an orthographic top-down render matches today's 2D vessel's glyph levels and density in a screenshot diff. Light is compared by eye, since it now comes from real normals by design. |
| **3 · Director** | Store extensions, master timeline, stations + spline, scene weights, damping, snap, persistent stage in route-group layout, route presets. | 3–4 d | Scrubbing top→bottom visits every station smoothly; resize/refresh stays correct; no React renders per frame (Profiler). |
| **4 · Scenes** | Prologue fly-through, build lattice + monoliths, monty room + photo panels + meteor waves, worldline gates + DOM sync, merger + remnant. | 6–9 d | Playwright filmstrip reviewed by Brody; each scene gets a tuning pass. |
| **5 · Interaction** | Sheet dent, mouse-look, DOM↔3D linking, hover tilt, click-to-fly + view transitions, keyboard travel, `?debug`. (Stretch: drag-orbit, gyro, audio mode.) | 3–5 d | All P1 rows in §4.6 work with mouse, touch and keyboard. |
| **6 · Harden & ship** | Fallback matrix (§5), mobile tuning, framer-motion removal, Lenis go/no-go, Lighthouse, docs (LLD `docs/stage-3d.md` + ADR "3D stage over 2D canvas"), vault note. | 3–4 d | Budget table (§6) met; the reduced-motion, 2D-tier and context-loss paths are each verified. |


### 8.1 Phase 0 + Phase 1 results (2026-09-24)

**Phase 0 — done.** The journey WIP is committed on `feat/journey` in four conventional
commits and pushed. `section-tabs.tsx` is removed. `tsc` and `next build` are green.
Revert points are pushed as annotated tags:

| Tag | Commit | What it is |
|---|---|---|
| `original-live` | `b22b3d9` | Exactly what brodymontag.com serves today (the tabbed site) |
| `pre-3d` | `231ca49` | The 2D ASCII journey plus this plan, the last state before any 3D code |

To revert: `git checkout original-live` (or `pre-3d`). On Vercel, the current production
deployment can also be restored with Instant Rollback.

**Phase 1 — spike on `feat/3d-stage`, route `/lab/3d` (noindex).**

- **Built:** R3F canvas → GPU wave sheet (the `bake.ts` math, per-fragment amplitude,
  per-vertex relief) → a custom `BrandAsciiEffect`. I skipped the stock `ASCIIEffect`
  because it only supports square cells and a luminance charset, so it couldn't test the
  brand look. The camera reads the existing `journey-store`, fed by a ScrollTrigger. Stations:
  flat → dolly-zoom + tilt → rolled dive → a punch-through with a `┼` lattice flash →
  underside.
- **Brand parity (flat station):** glyphs, tones and vignette match the 2D vessel by eye.
  One real bug was found and fixed. Geist Mono glyphs are 9.6px wide in 8px cells, and in 2D
  they spill into the right-hand neighbor; that spill is what chains `◆◆◆` and joins the `┼`
  crossbars. The atlas now uses 16px slots, and each pixel composites its left neighbor's
  overflow, then its own cell.
- **Performance:** a real GPU (Apple M4 Pro, ANGLE/Metal, headless) holds a **steady
  120 fps** (the display cap) at 1440×900 and at 390×844. That's 2–4 draw calls and about
  206k triangles, with no shader errors. An integrated or mobile GPU has not been measured
  yet. The obvious win if it's needed: render the scene at **one pixel per cell**
  (180×41 instead of 1440×900) since the pass only samples cell centers. That's roughly
  150× fewer fragment evaluations.
- **Bundle:** the home page is **unchanged** (12 scripts, 306 KB gzip, no three.js). The
  3D code is one lazy chunk: **248 KB gzip** (945 KB raw), right at the ≤ 250 KB target.
  If it needs to shrink: drop the `postprocessing` library (the pass is a single
  full-screen shader, so a render target plus a quad replaces it), then consider plain three
  without R3F.
- **Cell size (8×22 / 7×14 / 6×12):** 8×22 keeps glyphs legible as characters and matches
  the site. Smaller cells render the 3D forms more smoothly but turn the glyphs into
  halftone. **Recommendation: 8×22 everywhere. Consider 7×14 on phones only** (at 390px,
  8×22 gives just 48 columns).
- **Tuning learned:** diving closer than ~350 px-units empties the frame, because the
  wavelength is ~520px. The edge-on plane crossing has to be brief (double-eased) and masked
  (the flash). Tilted views need +70% field intensity to hold presence.
- **Known spike shortcuts (fixed in Phase 2):** hero skin only (no section blending yet);
  the body markers are placeholder spheres; there's no reduced-motion or tier gate on
  `/lab`; R3F logs a harmless `THREE.Clock` deprecation warning.

**Gate verdict:** on the measurable criteria (fps, bundle, parity) → **GO**. The
remaining criterion, *reads on-brand*, is Brody's call after scrolling `/lab/3d`.

**Total ≈ 22–32 focused days** (Phases 0–1 are done). Phases 4 and 5 parallelize well (§9).

**Testing:** promote the throwaway Playwright smoke (June, `/tmp/smoke-test`) to a real
`e2e/` devDependency. With 3D, visual regressions will be constant. Run a filmstrip per
station at desktop and mobile widths, plus a reduced-motion run and a forced `tier=2d` run
(`?tier=2d` override). Headless Chromium renders WebGL through SwiftShader, which works for
screenshots; take fps numbers from a headed run on real hardware.

---

## 9. Multi-agent dispatch (Phases 2–5)

Lock these **contracts first**, since they are the interfaces every worker codes against:
`StageRig`, `SceneState`, `SceneProps { weight, skin }`, `skinToUniforms()` signature, and
the uniform names in §4.4.

| Wave | Worker | Owns (disjoint files) |
|---|---|---|
| 1 | engine | `lib/ascii-engine/gl/*`, `components/stage/ascii-pass.tsx` |
| 1 | director | `lib/journey-store.ts`, `lib/director/*`, `components/journey/journey-controller.tsx`, `components/stage/camera-rig.tsx` |
| 1 | shell | `app/(site)/layout.tsx`, `components/stage/{stage-root,stage-canvas,debug-hud}.tsx` |
| — | `coherence-reviewer` | contract check across wave 1 |
| 2 | scenes-A | `scenes/{prologue,merger}.tsx`, `objects/{wave-sheet,binary,remnant}.tsx` |
| 2 | scenes-B | `scenes/{build,monty}.tsx`, `objects/{monolith,photo-panel,meteor-field}.tsx` |
| 2 | scenes-C | `scenes/worldline.tsx`, `objects/year-gate.tsx`, `components/journey/timeline-section.tsx` |
| 2 | `qa-test-engineer` | `e2e/*` |
| — | `coherence-reviewer` → `deep-reviewer` | fallbacks, context loss, cleanup paths |

---

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Scroll-jack fatigue (angular itself dropped its animation) | Short pins, skip affordance, rail jump-nav, all content in DOM |
| ASCII legibility at 3D scale (coarse cells turn objects to mush) | Fixed screen-space grid; cell-size test in the spike; `asciiAmount` true-color escape for photos |
| Mobile GPU / battery | Tier gate, PerformanceMonitor step-down, hand-off to 2D, pause when hidden |
| Bundle growth | Lazy chunk on idle, framer-motion removal, measured at the Phase 1 gate |
| Next 16 specifics (AGENTS.md: "NOT the Next.js you know") | Read `node_modules/next/dist/docs` for `dynamic`, route groups and `viewTransition` before coding each piece |
| ScrollTrigger measurements after canvas/pin mount | `ScrollTrigger.refresh()` after stage ready + `invalidateOnRefresh` (already in place) |
| Glyph atlas built before the font loads | Build it after `document.fonts.ready`, and rebuild on DPR change |
| Merge conflicts with the current WIP | Phase 0 lands the WIP first |
| Scope creep | Audio mode, gyro and drag-orbit are explicitly stretch (P2/P3) |
| Content accuracy | No new claims; `content.json` stays the only copy source |

---

## 11. Verification checklist (per gate)

- [ ] `npx tsc --noEmit` and `next build` green
- [ ] Playwright filmstrip: desktop 1440×900, mobile 390×844, reduced-motion, `?tier=2d`
- [ ] No console errors; no hydration warnings
- [ ] React Profiler: zero commits during continuous scroll
- [ ] fps ≥ target on real hardware (headed), `?debug` HUD
- [ ] Lighthouse mobile ≥ 90 perf / 100 a11y
- [ ] Keyboard-only run through every station; VoiceOver reads all chapters in order
- [ ] Context-loss simulation (`WEBGL_lose_context`) hands off to 2D cleanly

---

## 12. Decisions needed from Brody

1. **Interpretation:** confirm an *angular.dev-style visual journey on the current Next.js
   stack* (recommended), rather than a literal Angular rewrite.
2. **Reverse June's "no Three.js" decision.** This plan requires it. The 2D engine survives
   as the fallback, so nothing already built is thrown away.
3. **Pin budget:** is a ~2.5-screen pinned prologue acceptable?
4. **Timeline:** z-worldline (recommended) or keep the horizontal track?
5. **Audio mode:** worth the stretch? If so, which self-owned track or clip?
6. **Merging the WIP:** OK to land it on `feat/journey` and deploy only as a Vercel preview
   until 3D ships? That would keep the live tabbed site as-is in the meantime.

---

## Sources

- Monogram, *How Monogram built the animations for angular.dev* —
  [Part 1](https://monogram.io/blog/how-monogram-built-animations-for-angular-part-1) ·
  [Part 2](https://monogram.io/blog/how-monogram-built-animations-for-angular-part-2)
- Angular repo: [`adev/.../home/animation/README.md`](https://github.com/angular/angular/tree/main/adev/src/app/features/home/animation) ·
  WebGL → CSS+JS replacement ([#59865](https://github.com/angular/angular/pull/59865), 2024-12-18) ·
  "new homepage" (2026-01-22) · orphaned animation removed (commit `eb6570b06`, 2026-08-20)
- CSS scroll-driven animations support: [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) ·
  [caniuse](https://caniuse.com/mdn-css_properties_animation-timeline_scroll). Firefox is
  still behind a flag, so GSAP ScrollTrigger stays the driver.
- Next.js 16 bundled docs: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/viewTransition.md`,
  `.../02-guides/lazy-loading.md`
- Internal: `docs/ascii-bg-interactions.md`, vault note *Coding/Projects/Brody Montag Site*
