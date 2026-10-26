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
  - Project and role cards don't prefetch (`prefetch={false}`). A project
    page is 70–112 KB of RSC (its figure is 22–66 KB of that), and scrolling
    `/software` used to fetch all 12 detail pages: 154 KB on the wire, 804 KB
    decoded. A page now loads on click (2026-10-21).

## Page payload outside the figures (2026-10-26)

A direct visit gets each part of a project page twice: as HTML, and again in
the RSC payload inlined in the same page, where every `<` and `"` costs extra
bytes. The parts outside the figures now cost less in both. Measured on
`npm run build` output (`.next/server/app/projects`), KB (1024 bytes),
before → after; the last two columns are with the figure payload of PR #7
merged too:

| page | HTML | RSC | HTML with #7 | RSC with #7 |
|---|---|---|---|---|
| agent-forge | 138.6 → 108.0 | 69.8 → 55.4 | 136.2 → 105.5 | 68.6 → 54.2 |
| brodymontag-com | 222.1 → 186.5 | 112.5 → 96.1 | 147.0 → 111.3 | 72.8 → 56.5 |
| here-comes-the-kicker | 180.5 → 148.1 | 90.1 → 75.2 | 159.1 → 126.6 | 79.3 → 64.5 |
| peak-finding-toolbox | 163.2 → 130.3 | 82.2 → 66.8 | 155.3 → 122.3 | 78.2 → 62.7 |
| prism | 202.4 → 161.3 | 99.2 → 80.8 | 187.1 → 145.9 | 91.5 → 73.2 |
| realmbot | 193.2 → 158.4 | 97.4 → 80.9 | 142.2 → 107.3 | 71.5 → 55.1 |
| superset | 170.5 → 140.5 | 85.5 → 71.4 | 157.4 → 127.4 | 78.9 → 64.9 |
| venture | 181.1 → 146.1 | 88.7 → 72.4 | 154.6 → 119.6 | 75.8 → 59.5 |

Each part, smallest–largest page (HTML counts the markup and the inlined RSC):

| part | RSC | HTML |
|---|---|---|
| page frame (Next's root tree, client references, metadata) | 10.9–11.0 → same | 17.3–17.4 → same |
| title, rows, copy, highlights | 4.8–5.3 → 4.4–4.8 | 9.2–10.1 → 8.2–9.1 |
| ASCII rules | 4.0 → 0.4 | 7.9 → 0.8 |
| code (shiki HTML) | 8.3–15.5 → 5.1–10.0 | 21.8–41.2 → 13.8–26.4 |
| diagram (SVG) | 8.0–10.2 → 3.9–5.1 | 17.4–22.2 → 8.8–11.4 |
| section text | 10.0–18.5 → 8.7–15.8 | 18.5–34.1 → 15.9–28.7 |

How, with the page unchanged:

- **Code** (`lib/highlight.ts`): the HTML is written from shiki's tokens. One
  two-letter class per color (`globals.css .code-block .kw …`), no span for
  text in the foreground color, one span per run of one color (whitespace
  takes any color), each line a bare `<span>` under `<code>`, and attribute
  values without quotes.
- **Diagrams** (`lib/diagram.ts`): beautiful-mermaid's palette, derived
  colors, font and the paint of every node, label and edge are in
  `detail.css`, once. The SVG loses the `data-*` attributes that only
  `wire()` reads, the whitespace between elements and trailing zeros. If a
  new beautiful-mermaid writes another `<style>`, or a diagram gives a node
  or an edge its own paint, the build fails and says what to copy.
- **ASCII rules**: the 300 dashes are `.ascii-rule::before` in `globals.css`.
- **Block text**: table cells, decision records, list items and captions
  use one short class per row, or none (`detail.css`, `@apply` of the same
  utilities); the metadata rows under the title use `.dmeta-row`.

The RSC payload of a page can't be sent once: React needs the whole tree in
it for hydration and for client navigation, and leaving a static part out
would need new client JavaScript.

Checked against the old build: the page text, the computed style of every
element outside code and diagrams, and the computed paint of every diagram
element are the same; each code character keeps its color and each marked
line its mark. Full pages at rest (reduced motion, stage hidden) at 1440 and
390 px differ by at most 9 of 255 on a few pixels. Frozen frames of each
block's entrance (5 times) are the same, except code blocks: where token
spans now merge, a few glyphs land on the next subpixel position (up to 100
of 255 on single glyph edges, not visible at 3× zoom).

Still over the limit in `docs/portfolio-style-plan.md` §7 (92 KB HTML,
52.5 KB RSC): with both changes, a page is 105–146 KB HTML and 54–73 KB RSC.
Without its figure, the RSC is 39–47 KB and the HTML 76–94 KB. The page frame
alone is 17 KB of HTML. The rest is the figure (20–52 KB HTML), the code
(14–26 KB) and the section text (16–29 KB), which are the content. Options
not taken: code tokens as custom elements (`<t-k>`, about 5 KB less HTML on
prism), a small `app/not-found.tsx` in place of Next's default 404 tree that
every page's RSC carries twice (about 2.5 KB, but the 404 page would look
different), and fewer or shorter excerpts (a content change).

Scripts (gitignored, `e2e/_vt/`): `parts.mjs` (the bytes of each part of a
page in its HTML, its RSC and the RSC inlined in the HTML: it follows the RSC
rows from row 0 and gives each element the part of its nearest labelled
ancestor), `table.mjs` / `sizes.mjs` / `partsum.mjs` (tables from its JSON),
`codecmp.py` (text, color and marks of every code block, two builds),
`pagediff.mjs` (full pages and frozen block frames between two servers,
computed styles, text), `mkdiff.mjs` (a diff image).

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
