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
