// GLITCHCAM: the detail page below the card copy. STE (docs/portfolio-style-plan.md §4).
// Facts checked 2026-11-17 against glitchcam@254d711 (private): Sources/GlitchCam/
// Renderer.swift (the AUTO director), MotionAnalyzer.swift, AudioReactor.swift,
// AppDelegate.swift (pop-up windows), SelfTest.swift. The self-test figures come
// from `.build/release/GlitchCam --selftest` on that day.

import type { DetailDoc } from "./types";

const doc: DetailDoc = {
  key: "glitchcam",
  kind: "project",
  updated: "2026-11-17",
  sections: [
    {
      heading: "how it works",
      blocks: [
        {
          id: "how",
          type: "prose",
          text: "One capture session feeds all windows. Each camera frame goes to the GPU as a Metal texture with no copy. One fragment shader holds all the effects, and a window runs it one time for each active layer.",
        },
        {
          id: "how-2",
          type: "prose",
          text: "The app compares each camera frame with the last one on a 48 by 27 grid. From the cells that changed, it gets five cues: energy, spread, speed, sudden moves and stillness. The cues adapt to my own range of movement in the last 10 seconds.",
        },
        {
          id: "how-3",
          type: "prose",
          text: "An AUTO director turns the cues into a weight for each layer. A layer comes in within 0.12 seconds and lets go more slowly. After 1.5 seconds with no movement, the picture goes back slowly to the normal camera.",
        },
        {
          id: "flow",
          type: "diagram",
          caption: "figure 1 · from the camera and the audio input to the windows",
          alt: "Camera frames go to a movement grid and to the GPU. The audio input goes to a kick and drop detector. The director reads the cues and the beat, and sets the layers: mosh, tear, glyphs or 1-bit, and CRT. The movement grid also opens pop-up windows.",
          mermaid: `flowchart TD
  A[camera frame] --> B[movement grid 48 x 27]
  A --> G[Metal texture]
  C[audio input] --> D[kick and drop detector]
  B --> E[AUTO director]
  D --> E
  E --> F[layers: mosh, tear, glyphs or 1-bit, CRT]
  G --> F
  F --> H[main window]
  B --> I[pop-up windows at the place of the movement]
  F --> I`,
        },
      ],
    },
    {
      heading: "decisions",
      blocks: [
        {
          id: "focus",
          type: "decision",
          title: "Windows that never take the keyboard",
          status: "accepted",
          date: "2026-11-17",
          context: "The app runs above a DAW while I record the screen. A click on a camera window must not take the keyboard shortcuts from the DAW.",
          decision: "Each window is a borderless panel that cannot become the key window. The control dock follows the same rule.",
          cost: ["The dock cannot hold a text field. The name of a new preset goes into a standard alert, which takes the keyboard for a moment."],
        },
        {
          id: "chance",
          type: "decision",
          title: "Chance in the director",
          status: "accepted",
          date: "2026-11-17",
          context: "A direct map from movement to effects gave the same picture for the same movement. It looked mechanical.",
          decision: "Every 3 to 9 seconds the director picks a new lead layer. Random hits occur while I move, and the trigger points drift slowly. A Chaos slider sets how much chance there is.",
          cost: ["A take cannot repeat exactly. With Chaos at 0, the direct map comes back."],
        },
        {
          id: "threshold",
          type: "decision",
          title: "No manual kick threshold",
          status: "accepted",
          date: "2026-11-17",
          context: "The level of a loopback driver changes with the DAW volume. A fixed threshold stops its work after each volume change.",
          decision: "The detector follows the floor and the peak of the low band. A kick is a sharp rise into the upper part of that range. A strong kick after 1.5 seconds with none is a drop.",
          cost: ["The first kick after silence also counts as a drop."],
        },
        {
          id: "windows",
          type: "decision",
          title: "Pop-up windows show one large picture",
          status: "accepted",
          date: "2026-11-17",
          context: "Windows at random positions with unrelated crops looked wrong where they overlapped.",
          decision: "The camera picture lies across the screen as one large picture, with the main window as its middle. Each pop-up window is a view onto that picture, so an arm continues from one window into the next.",
          cost: ["Movement of a large part of the picture counts as a camera bump and opens no window. Two arms near the lens can reach that limit."],
        },
      ],
    },
    {
      heading: "results",
      blocks: [
        {
          id: "selftest",
          type: "table",
          columns: ["figure", "kind", "value"],
          rows: [
            ["kicks found at 120 BPM, full level", "measured", "10 of 10"],
            ["kicks found at 120 BPM, 12% level", "measured", "10 of 10"],
            ["drop found after a 4 second breakdown", "measured", "at 12.0 s, as expected"],
            ["effects that draw a picture", "measured", "7 of 7"],
          ],
          method: "the headless self-test of the app at 254d711. It draws each effect on synthetic frames and feeds synthetic kick signals to the detector. No camera and no microphone are in this test.",
          asOf: "2026-11-17",
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
            "The beat and drop response is checked with synthetic signals only, not with real DAW audio.",
            "The movement cues come from frame differences. A change of camera exposure looks like movement.",
            "The app has an ad-hoc signature and no notarization. It runs on my Mac only.",
            "It needs macOS 14 and Apple Silicon. There is no Xcode project.",
          ],
        },
      ],
    },
    {
      heading: "status and next",
      blocks: [
        {
          id: "status",
          type: "callout",
          kind: "status",
          items: [
            "Done on 2026-11-17: the windows, five effects, the AUTO director, kick and drop detection, pop-up windows, face priority and presets.",
            "Next: a check with real audio from FL Studio through a loopback driver.",
            "The repository is private.",
          ],
        },
      ],
    },
  ],
};

export default doc;
