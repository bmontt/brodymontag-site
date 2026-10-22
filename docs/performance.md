# Performance

Measured on production builds (`next build && next start`) in Chromium with
the e2e scripts. Mobile means 4× CPU throttle plus a ~1.6 Mbps / 150 ms network.
TBT is the sum of long-task time over 50 ms in the first ~6 s.

| | before | after |
|---|---|---|
| Critical-path JS on the landing (uncompressed) | 1.30 MB | 0.81 MB |
| Landing TBT, mobile | 1,280 ms | ~640 ms |
| `/music` load event, desktop | 1,842 ms | ~80 ms |
| `/music` TBT, mobile | up to 559 ms | ~170 ms |
| Display font | 102 KB TTF | 26 KB WOFF2 |
| Project / show pages | client-rendered on request | static HTML (SSG), no page JS |

Visual appearance and behaviour are unchanged. Each item below was checked
against the previous rendering. The 2D worker matches pixel for pixel (PSNR
108 dB on still frames), and entrances run at the same values, easing and
start point.

## What changed, and why it's invisible

- **Three.js left the critical path.** The 2D tier only needed `Vector2` and
  `Vector4` as uniform holders, but importing them pulled ~400 KB of three into
  every page. `lib/ascii-engine/vec.ts` provides three-free vectors. three
  uploads uniforms by duck typing (x/y/z/w, `toArray`), so the 3D tier accepts
  them unchanged.
- **framer-motion removed** (~120 KB). Every mount animation is now CSS
  (`lib/enter.ts`, `.enter` / `@keyframes mount-in`). Values and easing are the
  same: framer's default tween is `easeInOut`, which is CSS `ease-in-out`.
  - On the landing, entrances wait on a gate opened at hydration, which is
    where framer started them. That keeps the choreography with the typed
    name.
  - The expand panel is a `grid-template-rows` 0fr ↔ 1fr transition (0.22 s
    ease-in-out). Photo hover and social-icon hover are CSS.
- **Static detail pages.** Project and show pages became server components
  with `generateStaticParams`, so they're prerendered HTML.
- **The 2D painter runs in a worker** (`laser-2d.worker.ts`, OffscreenCanvas).
  - The page keeps only the director, which reads layout, and posts packed
    uniforms each frame (Float64, ~3 KB). Frames wait while the worker is
    busy (backpressure).
  - The worker registers the page's own `@font-face` rules and loads only the
    faces covering the glyphs it draws.
  - An OffscreenCanvas can't inherit the page's macOS
    `-webkit-font-smoothing: antialiased`, but `textRendering =
    "geometricPrecision"` reproduces it exactly. Where `textRendering` isn't
    supported, painting stays on the main thread.
  - `?laser2d=main` forces the main-thread painter for A/B comparison.
- **Nothing heavy competes with first paint.**
  - The GPU probe (a throwaway WebGL2 context, a long task on phones) and the
    3D stage chunk (~1 MB) wait for the load event plus idle (≤ 1.5 s). The 2D
    tier paints the identical piece until then.
  - The SoundCloud player (~3 MB of script) mounts once the page has loaded
    and gone idle, and only when it's within 1.5 screens of view.
- **Parallel shader compilation.** `AsciiRenderer.compile()` compiles all
  three passes with `compileAsync` (`KHR_parallel_shader_compile`), each with
  its render target bound, before the first frame.
- **Anchors.** `readAnchor` caches misses until the DOM changes, instead of
  running a full-document `querySelector` per frame for every page's anchors.
- **Network.**
  - The proxy skips RSC / prefetch requests: only the app's router sends
    those, so client navigations cost no proxy hop.
  - Images are AVIF first.
  - `/artistLogos`, `/BrodyEvents` and `/fonts` are cached for a day, then
    served stale-while-revalidate for a week.

## Measuring

Scratch scripts live in `e2e/_vt/` (gitignored). `measure.mjs` gives paint,
LCP, CLS, TBT and bytes per route. Run it with `MOBILE=1` for the throttled
profile and `BASE=` to point it elsewhere.

On project pages, LCP is now the description fading in. Chrome counts a CSS
fade-in toward LCP but ignored framer's script-driven one. The fade is the
same, and it now starts at first paint rather than after hydration.

## Frame rate pass (2026-10-14)

Measured on production builds in Chromium on the real GPU (ANGLE Metal, M4
Pro, 120 Hz), 1440×900 at 2×, with scripted wheel scrolling. "6× CPU" is
Chromium's CPU throttle, standing in for an older or battery-throttled laptop.

| | before | after |
|---|---|---|
| Scroll at 6× CPU | 87 fps, p95 24.6 ms | 120 fps, p95 9.3 ms |
| Scroll at 4× CPU | 108 fps, p95 16.7 ms | 120 fps, p95 9.2 ms |
| Style recalc while scrolling, 1× / 6× CPU | 150 / 411 ms per s | 20 / 69 ms per s |
| Style recalc idle, /software | 266 ms per s | 7 ms per s |
| 2D tier, frames painted | 29 per s | 110–120 per s |
| Click to new page | 280 ms hold + render | render only (65–140 ms in dev) |

- **The shimmer runs on one clock** (`components/shimmer-clock.tsx`). The
  iridescent keyframes (`sheen`, `pill-hue-cycle`, `iri-cycle`,
  `subtitle-pulse`) animate colors and registered custom properties, which the
  compositor can't run. Every running one forced a style recalc of its element
  every frame, off screen or not: 50 on /software. They're now paused CSS
  animations stepped at 20 Hz, only while on screen. Keyframes, durations,
  easing and per-element phase offsets are unchanged. A 4–6 s drift moves well
  under 1% of its range per step. Stepped CSS timing (`steps()`) doesn't help:
  Blink still recalculates every frame.
- **No per-frame CSS variable on `<html>`.** The journey controller wrote
  `--journey-progress` to the root element on every scroll frame, which
  re-styles the whole document. Nothing read it.
- **The 2D tier paints at the display's rate.** It was capped at ~30 fps
  (`FRAME_MS = 33`). The worker now paints every frame, still waiting while
  busy. The main-thread fallback is held to 60 fps.
- **Navigation is immediate.** Clicks used to wait `TRANSITION_MS` (280 ms)
  for the figure's burst before routing. The burst and the click's wave now
  play over the route change. The wave's reach is capped (`waveReach` in
  `lib/director/laser.ts`).

Still open: each page change has one 24–34 ms frame (1× CPU), mostly GSAP
ScrollTrigger's setup re-measure. Each of ~25–30 triggers reads scroll
position after the previous one wrote styles, which forced ~60 layouts in that
frame. Batching the per-element reveal triggers would cut it, but changes how
entrances behave.

Scripts (gitignored, `e2e/_vt/`): `frames.mjs` (scroll + nav frame stats),
`stress.mjs` (window sizes, CPU throttle), `stagefps.mjs` (frames the stage
presents per tier), `style.mjs` / `style2.mjs` (style cost and fixes),
`stylewrites.mjs`, `htmlstyle.mjs`, `navstress.mjs`, `navtrace.mjs`
(transition frames and forced-layout callers). Run against a production build
beside `next dev` with `NEXT_DIST_DIR=.next-prod` (see `next.config.ts`).

## Figure payload (2026-10-22)

A direct visit gets each project figure twice: as HTML, and again in the RSC
payload inlined in the same page. The figures (`components/blocks/figures`)
were 16–52 KB of each page's RSC, most of it generated geometry and keyframes.
Measured on `npm run build` output (`.next/server/app/projects`), KB:

| page | HTML | RSC | figure in RSC |
|---|---|---|---|
| agent-forge | 138.5 → 136.1 | 69.8 → 68.6 | 16.3 → 15.2 |
| brodymontag-com | 222.0 → 146.9 | 112.4 → 72.8 | 52.1 → 12.5 |
| here-comes-the-kicker | 180.4 → 158.9 | 90.0 → 79.3 | 34.6 → 23.9 |
| peak-finding-toolbox | 163.0 → 155.2 | 82.1 → 78.2 | 22.0 → 18.2 |
| prism | 202.3 → 187.0 | 99.2 → 91.5 | 33.7 → 26.1 |
| realmbot | 193.1 → 142.1 | 97.3 → 71.5 | 35.9 → 10.1 |
| superset | 170.3 → 157.2 | 85.4 → 78.9 | 31.4 → 25.0 |
| venture | 181.0 → 154.5 | 88.7 → 75.8 | 30.6 → 17.8 |

How (`figures/svg.tsx`), with the drawing unchanged:

- Paths are written relative (`m l h v`, a repeated letter left out). The
  dense ones (prism's bars, the kicker's dots, the peak traces) are in whole
  tenths inside `<Tenths>`, a nested viewBox at 10×, with the stroke width ×10.
  Not a `transform` attribute: the print rule in `detail.css` sets
  `transform: none` on everything in a block.
- Coordinates round to 0.01 of a unit; generated CSS loses whitespace, last
  semicolons and trailing zeros (`minCss`).
- Repeats are drawn once and reused: realmbot's second strip and its 30 ticks
  are `<use>`. Superset's nine cost flashes share one keyframes rule, each
  group started by its own `--t` delay.
- Many marks of one color become one path (the site figure's cells by level,
  venture's 96 dial ticks), and the site figure's glyphs are one `<text>` per
  level with an x and a y for each glyph.

Checked with paused frames of every figure, old build against new (12 times
per loop, 1440 and 390 px, 2× scale). Shapes that were already one path draw
the same pixels. A `<rect>` or `<line>` merged into a shared path gets a
slightly different edge anti-aliasing in Chrome (most edge pixels change by
under 32 of 255), and rounding moves a few glyphs to the next subpixel
position. Neither shows at 3× zoom. Merge only where the saving is large:
`<use>` of a `<rect>` draws exactly like the `<rect>`.

Still open: without its figure, each page's RSC is 53–66 KB, over the 52.5 KB
limit in `docs/portfolio-style-plan.md` §7. The rest is the page frame, the
highlighted code, the diagrams and the section text.

Scripts (gitignored, `e2e/_vt/`): `figdiff.mjs` (pixel diff of every figure
between two servers), `figsheet.mjs` (live frames side by side, and the
animations each figure runs), `aa-test.mjs` (how Chrome draws each encoding).
