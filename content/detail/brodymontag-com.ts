// brodymontag.com: the detail page below the card copy. STE (docs/portfolio-style-plan.md §4).
// Facts checked 2026-10-19 against this repo at 57d2653 and docs/performance.md.

import type { DetailDoc } from "./types";

const doc: DetailDoc = {
  key: "brodymontag-com",
  kind: "project",
  updated: "2026-10-19",
  sections: [
    {
      heading: "how it works",
      blocks: [
        {
          id: "figure",
          type: "figure",
          name: "brodymontag-com",
          caption: "figure 1 · from a scene to glyphs · schematic",
          alt: "A small network of lines and nodes is sampled into a grid of 8 by 22 pixel cells. Each cell gets a level, and then each cell becomes a glyph.",
        },
        {
          id: "how",
          type: "prose",
          text: "The site mounts one stage in the shared layout, so the stage stays on screen when a visitor changes pages. Every visitor first sees a 2D version that the CPU paints. A capable device then loads the 3D version and fades to it.",
        },
        {
          id: "tiers",
          type: "prose",
          text: "The 2D version stays for reduced motion, Save-Data, low memory, few CPU cores, or no WebGL2. If the 3D version loses its WebGL context, the 2D version comes back.",
        },
        {
          id: "flow",
          type: "diagram",
          caption: "figure 2 · from scroll to glyphs",
          alt: "Scroll input goes to GSAP ScrollTrigger, which writes the journey store. The director reads the store and sets the targets. A tier gate sends the frame to the 2D painter in a Web Worker or to the three.js scene. A GLSL cell pass and a glyph pass turn the scene into text.",
          mermaid: `flowchart TD
  A[wheel and touch] --> B[GSAP ScrollTrigger]
  B --> C[journey store]
  C --> D[director]
  D --> E{tier}
  E -->|2D| F[CPU painter in a Web Worker]
  E -->|3D| G[three.js scene]
  G --> H[GLSL cell pass]
  H --> I[glyph atlas pass]`,
        },
        {
          id: "passes",
          type: "code",
          caption: "the three GPU passes for each frame",
          excerpt: "site/ascii-render-passes",
          lang: "ts",
        },
      ],
    },
    {
      heading: "decisions",
      blocks: [
        {
          id: "single-writer",
          type: "decision",
          title: "GSAP is the only writer of scroll state",
          status: "accepted",
          date: "2026-09-24",
          context: "A React state update on each scroll frame causes a React render on each frame. The stage must keep its frame budget while the page scrolls.",
          decision: "GSAP ScrollTrigger writes scroll values into a plain module object. The render loop reads the object. React gets an update only when the chapter changes.",
          cost: [
            "Scroll logic is outside React.",
            "A Playwright test must guard the rule. The test allows at most 4 React commits for a full scroll.",
          ],
        },
        {
          id: "test",
          type: "code",
          caption: "the test that guards the rule",
          excerpt: "site/react-commit-test",
          lang: "ts",
          highlight: [34],
        },
        {
          id: "morph",
          type: "decision",
          title: "Figures move to the new page, they do not cut",
          status: "accepted",
          date: "2026-10-13",
          context: "Each page has its own composition of figures. A hard cut between two compositions looks like a reload.",
          decision: "On each frame, every value moves part of the way to its target. The part depends on the frame time, so the motion is the same at 60 Hz and at 120 Hz. A figure that was invisible takes its place at once.",
          cost: ["Each value comes close to its target but never reaches it exactly."],
        },
        {
          id: "damp",
          type: "code",
          caption: "the step toward the targets",
          excerpt: "site/morph-damping",
          lang: "ts",
          highlight: [429],
        },
      ],
    },
    {
      heading: "results",
      blocks: [
        {
          id: "frames",
          type: "table",
          columns: ["figure", "kind", "before", "after"],
          rows: [
            ["scroll at 6× CPU", "measured", "87 fps, p95 24.6 ms", "120 fps, p95 9.3 ms"],
            ["scroll at 4× CPU", "measured", "108 fps, p95 16.7 ms", "120 fps, p95 9.2 ms"],
            ["style recalc while scrolling, 6× CPU", "measured", "411 ms per s", "69 ms per s"],
            ["2D tier, frames painted", "measured", "29 per s", "110–120 per s"],
          ],
          method: "production build, Chromium, real GPU (ANGLE Metal), M4 Pro, 120 Hz display, 1440×900 at 2×, scripted wheel scroll. 6× CPU is Chromium's CPU throttle.",
          asOf: "2026-10-14",
        },
      ],
    },
    {
      heading: "limits",
      blocks: [
        {
          id: "limits",
          type: "callout",
          kind: "limits",
          items: [
            "The frame figures come from one machine.",
            "A 60 Hz display limits the rate to 60 fps.",
            "The CPU throttle slows the CPU only. It does not slow the GPU.",
            "The frame-test scripts are not in the public repo.",
          ],
        },
      ],
    },
    {
      heading: "proof",
      blocks: [
        {
          id: "proof",
          type: "links",
          items: [
            { label: "performance notes at 57d2653", href: "https://github.com/bmontt/brodymontag-site/blob/57d2653af76add71f414837e3eca38a98bad8787/docs/performance.md" },
            { label: "stage tests at 57d2653", href: "https://github.com/bmontt/brodymontag-site/blob/57d2653af76add71f414837e3eca38a98bad8787/e2e/stage.spec.ts" },
            { label: "source", href: "https://github.com/bmontt/brodymontag-site" },
          ],
        },
      ],
    },
  ],
};

export default doc;
