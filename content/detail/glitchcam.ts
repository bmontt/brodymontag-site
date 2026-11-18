// GLITCHCAM: the detail page below the card copy. STE (docs/portfolio-style-plan.md §4).
// Facts checked 2026-11-18 against glitchcam@9f4dedd (private): README.md,
// CHANGELOG.md, docs/DISTRIBUTION.md, Sources/GlitchCamCore/ (Renderer.swift for
// the AUTO director, MotionAnalyzer.swift, AudioReactor.swift, AppDelegate.swift
// for the pop-up windows, PluginBridge.swift, License.swift, SelfTest.swift) and
// vst3/smoketest.cpp. The results table counts the checks in the two test
// sources. The tests were not run again for this page.

import type { DetailDoc } from "./types";

const doc: DetailDoc = {
  key: "glitchcam",
  kind: "project",
  updated: "2026-11-18",
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
          text: "The core compares each camera frame with the last one on a 48 by 27 grid. From the cells that changed, it gets five cues: energy, spread, speed, sudden moves and stillness. The cues adapt to my own range of movement in the last 10 seconds.",
        },
        {
          id: "how-3",
          type: "prose",
          text: "An AUTO director turns the cues and the beat into a weight for each layer. A layer comes in within 0.12 seconds and lets go more slowly. After 1.5 seconds with no movement, the picture goes back slowly to the normal camera. One master control with the name \"glitch\" sets the depth, and each layer has its own fader.",
        },
        {
          id: "how-4",
          type: "prose",
          text: "The same Swift core makes the app and the plugin. A C++ layer on the Steinberg VST 3 SDK links the core as a static library. The plugin passes the audio through with no change and gives the level of its track to the kick detector. The standalone app reads an audio input for the same detector.",
        },
        {
          id: "how-5",
          type: "prose",
          text: "The control panel is the same in the app and in the plugin window of the DAW. All 21 settings are plugin parameters. The DAW can automate them, and it stores them in its presets and its projects.",
        },
        {
          id: "flow",
          type: "diagram",
          caption: "figure 1 · from the camera and the audio to the windows",
          alt: "Camera frames go to a movement grid and to the GPU. The audio of the plugin track, or an audio input in the app, goes to a kick and drop detector. The director reads the cues and the beat, and sets the layers: mosh, tear, glyphs or 1-bit, and CRT. The movement grid also opens pop-up windows.",
          mermaid: `flowchart TD
  A[camera frame] --> B[movement grid 48 x 27]
  A --> G[Metal texture]
  C[plugin track audio, or an audio input in the app] --> D[kick and drop detector]
  B --> E[AUTO director]
  D --> E
  P[control panel and 21 plugin parameters] --> E
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
          context: "The windows stay above a DAW while I record the screen. A click on a camera window must not take the keyboard shortcuts from the DAW.",
          decision: "Each window is a borderless panel that cannot become the key window. The control panel of the standalone app follows the same rule.",
          cost: ["The panel cannot hold a text field. The name of a new preset goes into a standard alert, which takes the keyboard for a moment."],
        },
        {
          id: "chance",
          type: "decision",
          title: "Chance in the director",
          status: "accepted",
          date: "2026-11-17",
          context: "A direct map from movement to effects gave the same picture for the same movement. It looked mechanical.",
          decision: "Every 3 to 9 seconds the director picks a new lead layer. Random hits occur while I move, and the trigger points drift slowly. A Chaos control sets how much chance there is.",
          cost: ["A take cannot repeat exactly. With Chaos at 0, the direct map comes back."],
        },
        {
          id: "threshold",
          type: "decision",
          title: "No manual kick threshold",
          status: "accepted",
          date: "2026-11-17",
          context: "The level of the audio changes with the DAW volume and with the track. A fixed threshold stops its work after each change.",
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
          decision: "The camera picture lies across the screen as one large picture, with the main window as its middle. Each pop-up window is a view onto that picture, so an arm continues from one window into the next. The limit is 18 windows, and an option gives my face priority.",
          cost: ["Movement of a large part of the picture counts as a camera bump and opens no window. Two arms near the lens can reach that limit."],
        },
        {
          id: "plugin",
          type: "decision",
          title: "A plugin that takes the beat from its own track",
          status: "accepted",
          date: "2026-11-17",
          context: "The standalone app gets the beat from an audio input, so the DAW output must go through a loopback driver. That setup is a barrier for other people.",
          decision: "GLITCHCAM is also a VST3 effect. The plugin measures the low band of its track, so no loopback driver is necessary. The build uses the Command Line Tools only, with no Xcode and no CMake.",
          cost: [
            "The host must permit camera access to its plugins. FL Studio 2025 and Ableton Live 12 declare it.",
            "There is no Audio Unit, so Logic Pro cannot load it.",
          ],
        },
        {
          id: "license",
          type: "decision",
          title: "License keys through public endpoints only",
          status: "accepted",
          date: "2026-11-17",
          context: "A paid app needs a key check, and a secret in the app can leak.",
          decision: "The app activates a key online through the public endpoints of a merchant-of-record seller. No secret ships in the app. Without a key, the app is a demo with a mark on the windows.",
          cost: ["The check is off until the shop exists. Only recorded answers of the server test it, with no live purchase."],
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
            ["self-test: kick detection at 120 BPM, at full level and at 12% level", "measured", "2 checks"],
            ["self-test: drop detection after a 4 second breakdown", "measured", "1 check"],
            ["self-test: modes that must draw a picture (five effects, the clean camera, AUTO)", "measured", "7 checks"],
            ["self-test: recorded license answers", "measured", "7 checks"],
            ["plugin smoke test: load, audio, parameters, state, editor view", "measured", "19 checks"],
          ],
          method: "a count of the checks in SelfTest.swift and vst3/smoketest.cpp at 9f4dedd. Each figure is a number of checks, not a pass result. The self-test uses synthetic frames and synthetic kick signals, with no camera, no microphone and no network. The smoke test loads the built plugin as a host does and sends 375 audio blocks through it.",
          asOf: "2026-11-18",
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
            "No other person confirmed that it works in a different setup.",
            "The beat response is checked with synthetic signals and with my own use only.",
            "The app and the plugin are not signed with a Developer ID and not notarized. macOS shows a block on the first open.",
            "There is no Windows version and no Audio Unit.",
            "The plugin needs a host that permits camera access to plugins. FL Studio 2025 and Ableton Live 12 declare it.",
            "The movement cues come from frame differences. A change of camera exposure looks like movement.",
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
            "Done by 2026-11-18: the app and the VST3 plugin for macOS 14 or later, on Apple Silicon and Intel.",
            "Done: five effect layers, the AUTO director, kick and drop detection, pop-up windows, face priority, presets and 21 plugin parameters.",
            "Done: one release script makes a disk image, an installer wizard package and zips with a double-click installer.",
            "A friends beta build is out for feedback. It is the full version until 2027-01-16, then the demo.",
            "Next: an Apple Developer ID for the signature and the notarization, and the shop account that turns on the license keys.",
            "The version is 0.1.0, not released. The source repository is private.",
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
          items: [{ label: "the product page", href: "https://www.brodymontag.com/glitchcam" }],
        },
      ],
    },
  ],
};

export default doc;
