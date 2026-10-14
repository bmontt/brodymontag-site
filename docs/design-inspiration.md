# Design inspiration — reverse-engineering notes

Four reference sites, inspected 2026-10-05 with an instrumented headless browser. It hooked
`shaderSource` and `getContext` to capture every compiled shader and context, and recorded
libraries, fonts, canvases, scroll setup and screenshots at a few scroll positions. These
are notes on **techniques and design moves**, not code to copy. unicorn.studio's shaders
carry an explicit "no copying" notice, and nothing below reuses anyone's source.

---

## What each site actually does

### unicorn.studio — layered WebGL effect stacks
- **Stack:** a custom WebGL2 compositor, 7 canvases, 31 unique shaders, no framework
  globals. It's a no-code tool whose embeds are effect *layers*: uniforms are namespaced
  per layer (`uL0_… uL5_*`), and each layer has opacity, mask, mouse-tracking and time.
- **Signature effects:** an aurora / light-streak hero; light "strands" converging on a
  point; chrome-glow display type; dither ×4, bloom, Kawase-style blur, ASCII and
  SDF-text passes.
- **Cursor:** a GPU particle system. Positions and lifecycle live in a ping-pong state
  texture (`uPingPongTexture`, `texelFetch` by particle id, up to 840 particles), and it
  spawns from `uPreviousMousePos` → `uMousePos` velocity.
- **Takeaway:** everything is a stack of cheap passes with per-layer masks and pointer
  coupling. Polish comes from *combinations* (bloom + grain + subtle chromatic shift), not
  any single heavy effect.

### lenis.dev — Lenis + kinetic typography + one physical object
- **Stack:** Next.js, Lenis (`html.lenis`), one WebGL2 canvas with only 4 shaders.
- **Hero:** blackletter "LENIS" in salmon with physical-material depth (the captured
  shaders include `MeshPhysicalMaterial` with iridescence, dispersion, transmission and
  clearcoat), plus Panchang-wide "SMOOTH SCROLL".
- **Kinetic type:** screen-filling Anton letters slide past as you scroll. They are
  **SVG** (29 inline SVGs; no DOM text above 150px), so transforms are cheap and crisp.
- **Starfield:** each particle wobbles in depth with simplex noise and is displaced by
  `uScroll × depth`, then wrapped with `mod(y, height)`. That's infinite parallax, and
  scroll *speed* reads as depth.
- **Takeaway:** extreme typographic scale contrast (enormous display type next to tiny
  mono labels), and one small particle trick that sells depth during scroll.

### basement.studio — a real place, plus a machine-readable twin
- **Stack:** Next.js, 2 WebGL2 canvases, 73 unique shaders. Set in **Geist + Geist Mono**
  (your site's mono) plus a display face, "flauta".
- **Hero:** their office as a lightmapped 3D interior. Uniforms show day/night city
  lighting (`uCityNight`, `uNightFactor`, `uCloudCover`, `uSunDir`), godrays, matcap
  glass, lamp lightmaps and an **inspect mode** (`inspectingEnabled`).
- **Featured projects:** stippled / halftone 3D renders. The "dither" in their shaders is
  three.js's standard anti-banding, so the stylization lives in the assets.
- **"HUMAN / MACHINE" toggle:** *Machine* goes to **`/ai/home`**, a **plain-text,
  machine-readable mirror** of the site. It has a box-drawing ASCII banner, slash-nav,
  "MACHINE-READABLE INDEX", and all content as text, and it uses no canvas at all.
- **Takeaway:** a physical "place" as identity, an inspect interaction (our click-to-fly
  is the same idea), and an AI-native second face of the site.

### shadergradient.co — animated noise gradients + grain
- **Stack:** Framer site; the product is a three.js/R3F component. 9 WebGL2 canvases, 8
  unique shaders.
- **Technique:** a plane or sphere displaced by Perlin noise (`uNoiseDensity`,
  `uNoiseStrength`, `uFrequency`, `uAmplitude`, `uSpeed`), lit with physical shading, with
  three colors (`uC1…uC3`) and heavy film grain.
- **Seamless loops:** noise is sampled at 4 points around a circle in noise space, then
  interpolated (`uLoop`, `uLoopDuration`). This is the same idea as the site's τ-loop
  bake, a nice validation.
- **Takeaway:** color as a slowly moving *field*, not a flat fill; grain makes gradients
  feel physical.

---

## What to adopt — proposals for brodymontag.com

Ranked by fit with the ASCII / "The Binary" identity, divided by effort.

| # | Proposal | From | Fit | Effort | Notes |
|---|---|---|---|---|---|
| **1** | **Human / Machine mode.** A toggle pill (bottom center) switches to `/machine`: a plain-text mirror generated from `content.json` with a box-drawing banner, slash-nav and every project, show and release as text. Ship `/llms.txt` alongside. | basement | ★★★★★ ASCII aesthetic + agentic-AI engineer; also SEO / LLM discoverability | S (≈0.5–1 d) | Server-rendered, no JS, no canvas. Single source = `content.json`, so it can't drift. |
| **2** | **Field-native kinetic type.** At each chapter transition the chapter word (THE BUILD · MONTY · 2021→NOW · MERGER) is written *into the wave sheet*. A text mask from an offscreen canvas raises the amplitude, so giant lettering emerges in glyphs and dissolves back into waves (angular's MSDF headline, ASCII-native). | lenis, angular | ★★★★★ | M (≈1.5–2 d) | Reuses the sheet + ASCII pass, so there's no new renderer. DOM headings stay for a11y/SEO. |
| **3** | **Moving gradient for the glyph light.** Replace the per-cell hue cycle with a slow 3-color noise gradient across the screen (cool in code, warm in music, iridescent in the hero), keeping the current saturation caps. | shadergradient | ★★★★ richer "iridescent" theme, still terminal-crisp | S (≈0.5 d) | A compose-pass change only; skins carry the three colors. |
| **4** | **Scroll-parallax glyph dust.** Sparse `·` / `∘` specks at several depths, displaced by scroll velocity × depth and wrapped, mostly visible during fast scrolls and transitions. | lenis | ★★★★ | S (≈0.5 d) | Instanced, cell-sized, through the existing ASCII pass. Off on the flat hero station. |
| **5** | **Lenis smooth scroll** (the plan's Phase 6 go/no-go). Today the camera glides while the DOM steps per wheel tick; Lenis aligns them. | lenis | ★★★ | S | `ScrollTrigger.update` on scroll, `gsap.ticker` drives `lenis.raf`, native touch (no `syncTouch`), disabled under reduced motion. |
| **6** | **Typographic scale contrast.** One oversized display moment per chapter (Neue Haas, `clamp(4rem, 12vw, 10rem)`) set against the existing tiny mono labels. | lenis, basement | ★★★ | S | CSS + the existing SplitText entrance. |
| 7 | Grain + bloom finish: a whisper of film grain and bloom on peak glyph cells only. | unicorn, shadergradient | ★★ | S | Optional. Risks muddying the crisp terminal look, so test behind a flag. |
| — | **Not adopted:** cursor particle trails (unicorn). | unicorn | — | — | You removed spawned cursor particles in June ("cursor clears, doesn't eject"). The current repulsor plus the sheet dent is the deliberate choice. |
| — | **Not adopted (for now):** a lightmapped "real place" hero (basement). | basement | ★★ | L | A DJ booth / studio scene is a big asset job and fights the ASCII identity. Revisit as a detail-page easter egg. |

**Recommended next step:** build **#1 (Machine mode)** and **#3 (gradient glyph light)**
first. They're small, distinctive and low-risk. Then **#2 (field-native kinetic type)**
as the signature moment, and fold **#4–#6** into Phase 6 hardening.

## Status (2026-10-05)

- **#1 Human / Machine mode — shipped.**
  - `/machine` is a server-rendered plain-text mirror from `lib/machine.ts`, with an
    original block-letter banner. It works without JavaScript and prerenders statically.
  - `/llms.txt` follows the llmstxt.org format and is static `text/plain`.
  - Every page advertises it with `<link rel="alternate" type="text/plain">`, and a
    human/machine pill sits bottom-right.
- **#3 Moving-gradient glyph light — shipped, subtle by design.**
  - Hue is now a slow two-octave noise field, ±55° around each skin's bias, with a
    1.5× saturation lift.
  - Measured on lit frames: more tinted glyphs than the old per-cell cycle (≈3.0k vs
    1.7k px), arranged in coherent regions. Average saturation stays low (≈0.06)
    because the highlights are faint.
  - Lab key `g` A/Bs it against the old cycle.
- **#2 Field-native kinetic type — first pass.**
  - THE BUILD, MONTY and THE MERGER (`content.json` → `journey.<id>.word`) assemble
    cell by cell out of glyphs on a plane. It is placed at each chapter's destination
    camera pose (the director's first station) and dissolves as reading begins.
  - The timeline title was dropped: its pinned DOM track already carries giant year
    numerals, and the low worldline camera made it hard to frame.
  - **Bug found and fixed on the way:** upright planes were rotated by `+az` instead of
    `−az`, so every one faced 2·az off-axis. The music photo panels were about 48° off.
    `faceRotation()` in `layouts.ts` now derives rotation from the facing direction.

## Round 1 inspection feedback (2026-10-13)

- **Background → analog laser layer.**
  - The full-screen wave field read as too busy, so the journey's background is
    now one continuous, scroll-driven laser piece rendered through the same
    ASCII pipeline (`lib/ascii-engine/gl/laser-shader.ts`, directed by
    `lib/director/laser.ts`). Sequence: an oscilloscope trace, then a Lissajous
    knot, club fan beams, a perspective laser floor, and finally the binary
    merger and its ringdown.
  - Beams are one glyph thick in any direction, and the glyph is picked by the
    beam's direction (─ ╲ │ ╱) with flickering · haze around it.
  - The glitch layer in the compose pass adds row tears with an RGB split,
    scanlines and flicker. It rises with scroll speed and at chapter boundaries.
  - Scene objects dim to 40% underneath the beams. `?bg=wave` restores the wave
    field for A/B, and the lab still uses the wave field (parity test).
- **Machine view without a toggle:** `proxy.ts` and `lib/agent.ts` serve
  `/machine` to AI crawlers, `/machine.txt` to CLI clients and text/markdown
  requests, and the journey to browsers, search engines and unfurlers.
- **Headings:** the sticky mono rail is gone. The bold white display line is the
  chapter's `h2`.
- **Artist logos:** each logo is cropped to its content and sized to equal visual
  area. noizu and rivo show as wordmarks until logo files exist.

## Round 2: story, palette, layout (2026-10-14)

- **The background tells a story with two signals.**
  - **Tech** is the white-grey-black scale; **sound** is the red scale (black,
    then deep red, then white-hot).
  - **Hero (apart):** a grey trace and a deep-red trace run along the rule
    under the name, out of phase.
  - **Code (clarity):** a white knot, shaded by depth, sits beside the
    projects, with red murmuring along the floor.
  - **Music (heat):** red fans pulse at 124 bpm beside the gigs, and the glitch
    hits on the kick.
  - **Timeline (memory):** a grey floor carries a white rail and a red rail
    that converge over the years.
  - **Epilogue (union):** white and red rings orbit inside the circle the about
    text wraps around. They fuse white-hot (a one-shot flash), ring down
    through cooling reds, and resolve into one calm trace.
  - Mood (brightness, white-hot core, glitch) is set per chapter in
    `lib/director/laser.ts`.
- **Figures live in the layout.** `figure` chapters (code, music) split into a
  text column and a figure gutter, `[data-laser-anchor]`, where the figure is
  sticky inside its gutter.
  - The about paragraphs wrap a `shape-outside: circle()` float.
  - The hero traces ride the name rule.
  - Reveals in figure chapters slide out of the figure's side and resolve from
    a blur.
  - Phones keep one column, and the figures float free there.
- **Interaction:** hovering a project heats and spins the knot, and hovering a
  show drives the fans harder. A click bursts the figure, with a glitch surge,
  while the page changes.
- **In laser mode the old 3D objects are gone** (monoliths, photo panels,
  year gates, glyph titles). `?bg=wave` still restores them along with the
  wave field.
- **Site palette:** the accent and the old iridescent classes are now
  monochrome "sheen" (a lightness breath) via `--sheen-*` and `--accent`.
  `#music` and `.theme-sound` (show pages) switch to the red scale. Platform
  glows follow the same rule: tech platforms white, music platforms red.
- **Robustness:**
  - A WebGL context that fails to create, even though the probe passed, now
    falls back to the 2D laser (`StageBoundary`). This had crashed the stage
    in a real browser.
  - The 2D tier draws the same story on the CPU (`laser-cpu.ts`).
- **Update (later on 2026-10-14):** the sound scale is now the site's
  **iridescent shimmer** instead of red. It's a pastel that circles hue once
  every 4.2s, like the pills, and drifts along each beam. Tech stays
  white-grey-black. This applies across the board: the laser layer (GPU and
  CPU), `#music`/`.theme-sound` (shimmering sheen classes and a pastel accent),
  the hero `>` (`.text-shimmer`), and music-platform glows (`"iridescent"` →
  `lib/glow.ts`, animated by `.iri-cycle`).

## Round 3: the split site (2026-10-14)

- **The site is a landing page plus three section pages.** The single long scroll
  is gone.
  - **`/`** shows the name typing in over a split rule: a white trace on the
    left half and a pearl trace on the right, flattening to meet in the
    middle. Below it are **software** (left, white), **music** (right,
    shimmer) and **about me** (centered below, a white-to-pearl blend).
  - Each choice has its figure asleep behind it: the knot, the fans and the
    rings. Hover wakes it, and picking it bursts it.
- **`/software`:** projects, experience and stack. A white trace under the
  heading and a white knot in the gutter that tilts as you read. Almost no
  glitch.
- **`/music`:** shows, artists, releases and the collective. A pearl trace
  pulsing on the kick, shimmering fans in the gutter, and glitch on the kick.
- **`/about`:** the about text (the union orbit, a timed fusion and ringdown,
  then one calm trace), presence and contact, then the timeline coda. The calm
  trace becomes the floor's horizon, with converging white and pearl rails.
- **Transitions:** internal links burst the picked figure for 420ms, then
  navigate. The stage persists, and the director damps every figure
  parameter toward the new page's targets, so the background morphs between
  pages.
- **Plumbing:**
  - `lib/director/laser.ts` is now page-based: compositions plus damping,
    with `laserInputFrom()` shared by both tiers.
  - The scroll controller measures only the chapters on the current page, in
    document order.
  - Route kinds are home, software, music, about, project and show.
  - Pages get a minimal site nav (`components/nav.tsx`).
  - The proxy covers the new routes.
  - The hero, timeline-nav, vessel and ascii-bg components are retired.

## Round 4: flow, 3D and flags (2026-10-14)

- **Page flow:**
  - **Section openers:** each section page opens with the index, the title
    as h1, the heading line and a "now" line.
  - **Title morph:** the word you pick morphs into the page title (React
    `<ViewTransition>`), and pages leave and arrive with a blur.
  - **Next-section links:** software → music → about → start over, and the
    next page's figure starts drawing as you approach the link.
  - **Landing:** now lines under each choice, plus the S / M / A keys.
- **3D:**
  - **The laser room** (`lib/director/room.ts`): a corridor of floor and
    ceiling rails and rungs, with four ceiling emitters sweeping beams at the
    page's figure. It's projected from world space each frame, so it
    parallaxes with the cursor, dollies with scroll and fades into fog. It is
    split white and pearl on the landing.
  - **Drag the knot** (`lib/stage-input.ts`): grab it with the mouse, fling it
    and it coasts, and its tilt eases back.
  - **Shader transitions:** a ragged glyph shockwave from the click, and
    another from the new page's title as it lands.
  - **3D titles:** the page word as laser outlines (the gradient of the mask
    picks the strokes), huge and faint behind the opener. It flies past the
    camera as you scroll out.
- **Flags** (`lib/flags.ts`):
  - **Build flags** (`openers`, `morph`, `next`, `now`): set with
    `NEXT_PUBLIC_FLAGS`, e.g. `-morph`. They change markup, so they're fixed
    per deploy.
  - **Runtime flags** (`room`, `drag`, `wipe`, `titles`): also settable live
    with `?ff=-room,titles`, remembered in localStorage until `?ff=reset`.
    `window.__flags` shows the resolved set.

## Round 5: calmer, more detail (2026-10-14)

- **Removed:**
  - **The VHS glitch:** row tears, ghost echo, scanlines, flicker and the
    scanner jitter, in both tiers.
  - **The laser room and 3D titles:** too crowded, so they're off by default
    (`room` and `titles` flags; `?ff=room,titles` brings them back).
  - **The grey glyph balls:** the old wave field's two sphere bodies were
    still drawn under the lasers. They're hidden in laser mode now.
  - **The scroll dust.**
- **More detail in the main figures:**
  - **Knot:** far strands thin out as well as darken, so the near ones cross
    in front. Two lights run along the curve, like a galvo drawing it.
  - **Fans:** a pulse runs up every beam, on the kick on the music page and
    slow and faint elsewhere. Away from the music page the beams fade as they
    rise, so their tops read as far away.
  - **Rings → hoops:** each ring spins about its own axis, shown as an
    ellipse that breathes. The pair orbit in an inclined plane, with the
    near one larger and brighter.
- **About: a binary held by gravity:**
  - The hoops orbit on a Kepler ellipse: faster at periapsis, faster overall
    as the orbit tightens (a^-1.5).
  - Reading the about text tightens the orbit. Past it, they wait off to the
    right, smaller and calmer.
  - They keep twirling until "Let's work together." comes on screen. Then
    they drift beside it, spiral in and fuse, and one hoop stays there,
    breathing.
- **Landing:** hovering a choice glows it and dims the other two, both the
  words and their laser figures.
- **Title morph fix:** JourneyRoot's wrapper had an opaque background. Its
  view-transition snapshot is painted above the title's and the stage's, so
  the title faded out and then popped back when the transition ended. It's
  transparent now (e2e guard). Words without a partner on the new page
  leave with the page.
- **Transition points (`[data-tp]`):**
  - A pearl hairline draws out of each section label as it comes into view,
    and a glint runs along it once.
  - Each label drifts on a scrubbed, sine-eased offset (±36px). It slows as
    it crosses mid-screen and catches up after, so the momentum varies from
    section to section.
