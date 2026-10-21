// Prism: the detail page below the card copy. STE (docs/portfolio-style-plan.md §4).
// Facts checked 2026-10-20 against stem-box@a4db71f (src/sync, src/inference,
// tests, docs/lld/06 and 07, commits 1a6fc97, 7c13c0b, 4486ab8, 779ec20) and
// the vault note Coding/Projects/Prism.md (the 2026-07-14 speed run and FLOP
// count, ADR-008 to ADR-011). The repo is private: excerpts show text only.

import type { DetailDoc } from "./types";

const doc: DetailDoc = {
  key: "prism",
  kind: "project",
  updated: "2026-10-20",
  sections: [
    {
      heading: "how it works",
      blocks: [
        {
          id: "figure",
          type: "figure",
          name: "prism",
          caption: "figure 1 · the stems fill ahead of the playhead · schematic",
          alt: "A track loads. The model fills four stem lanes ahead of the playhead, in windows that overlap. The stem controls go live when 40 seconds of stems are ready.",
        },
        {
          id: "how",
          type: "prose",
          text: "A CDJ sends its state over Pro DJ Link on UDP port 50002. When a new track ID arrives, Prism starts to extract stems from the start of that track. A worker thread runs the model on 10-second windows in time order. Each window adds 7.5 seconds of new audio, so two windows overlap by 2.5 seconds.",
        },
        {
          id: "how-2",
          type: "prose",
          text: "The audio callback runs in JACK at 192 kHz. It reads the stems at the CDJ position, which it moves forward between packets at the CDJ pitch. It reads only segments that the worker finished. Until 40 seconds of stems are ready, the stem return stays silent and the DJ hears the dry track through the mixer.",
        },
        {
          id: "flow",
          type: "diagram",
          caption: "figure 2 · from a track load to the mixer",
          alt: "The CDJ sends a track load over Pro DJ Link. The extractor runs HTDemucs on 10-second windows and stores the stems in a ring of 12 segments. The transport mixes the stems at the encoder levels and sends them to the mixer.",
          mermaid: `flowchart TD
  A[CDJ] -->|Pro DJ Link| B[PdjMonitor]
  B -->|track load| C[ProgressiveExtractor]
  C -->|10 s windows| D[HTDemucs INT8 on CPU]
  D --> E[ring of 12 segments]
  E --> F[StemTransport]
  G[encoders and DJM MIDI] -->|stem levels| F
  F -->|JACK 192 kHz| H[mixer FX return]`,
        },
        {
          id: "worker",
          type: "code",
          caption: "the worker: windows in time order, live at 40 seconds",
          excerpt: "prism/worker-loop",
          lang: "cpp",
          highlight: [124, 125, 126],
        },
      ],
    },
    {
      heading: "decisions",
      blocks: [
        {
          id: "time-order",
          type: "decision",
          title: "Extract in time order, and play only finished segments",
          status: "accepted",
          date: "2026-07-01",
          context: "A DJ loads a track and can play it at once. A full-track extraction takes longer than that. The audio callback must never wait for the model.",
          decision: "The worker extracts the track from its start, one window at a time. The callback plays only segments that the worker finished. Until 40 seconds are ready, it writes silence and the dry signal plays.",
          cost: [
            "The stem controls do nothing for the first seconds after a track loads.",
            "A seek past the extraction point gives silence on the stem return until the worker gets there.",
          ],
        },
        {
          id: "fill",
          type: "code",
          caption: "the callback writes silence unless the stems are live",
          excerpt: "prism/fill-output",
          lang: "cpp",
          highlight: [66],
        },
        {
          id: "overlap",
          type: "decision",
          title: "Overlap the windows, and cut on a bar line",
          status: "accepted",
          date: "2026-07-02",
          context: "Separate 10-second windows gave clicks and hard cuts at their edges.",
          decision: "Each window overlaps the one before it, and an equal-power crossfade joins the two. When the BPM is known, the step between windows is a whole number of bars near 7.5 seconds. At 128 BPM, the step is 4 bars.",
          cost: ["The model processes 10 seconds of audio for each 7.5 seconds of track. That is one third more work."],
        },
        {
          id: "hop",
          type: "code",
          caption: "the step between windows, in whole bars",
          excerpt: "prism/bar-hop",
          lang: "cpp",
          highlight: [56, 57, 58],
        },
        {
          id: "cpu",
          type: "decision",
          title: "Run the model on the CPU, not on the Hailo accelerator",
          status: "accepted",
          date: "2026-07-02",
          context: "The HTDemucs STFT branch uses complex numbers, and the ONNX exporters could not export it. Without ONNX, the Hailo compiler cannot take the model.",
          decision: "Prism runs a TorchScript trace of HTDemucs with INT8 quantization on the CPU. On 2026-07-14, a FLOP count showed attention and matrix multiplies at 63.3% of the compute, and I dropped the Hailo-10H from the plan.",
          cost: ["The speed on a Raspberry Pi 5 is not measured. Estimates from the Mac figure fall below the 1.3× gate."],
        },
      ],
    },
    {
      heading: "results",
      blocks: [
        {
          id: "figures",
          type: "table",
          columns: ["figure", "kind", "value"],
          rows: [
            ["separation speed, M4 Pro, INT8, 4 threads", "measured", "5.79× real time"],
            ["time for one 10 s window, same run", "measured", "1.73 s"],
            ["attention and matrix-multiply share of the compute", "measured", "63.3% of 334.9 GFLOPs"],
            ["sustained speed the Pi 5 must hold", "target", "1.3× real time"],
            ["audio round trip, 64 frames at 192 kHz", "target", "1.9 ms, calculated"],
          ],
          method: "speed: the RTF harness on an M4 Pro Mac with the INT8 model and 4 threads, the core count of a Pi 5. Compute: torch 2.8 FlopCounterMode over one 7.8 s segment, with formulas added for two attention ops that it does not count.",
          asOf: "2026-07-14",
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
            "No hardware exists. No test ran against a real CDJ or a real mixer.",
            "The lookup from a track ID to its audio file is not built for real CDJ media yet.",
            "The ring holds 90 s, and the worker does not wait for the playhead. On a longer track, it can overwrite stems before they play.",
            "The speed figure comes from a Mac. The Pi 5 speed is not measured.",
                        "No blind A/B test or SDR figure compares the INT8 stems with full precision.",
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
            "Done: the firmware with 54 unit tests, the FLOP count and the Mac speed run (2026-07-14).",
            "Blocked: the sustained speed test needs a Raspberry Pi 5 build. Paused since 2026-07-15.",
            "Next: run that test under heat. Its result picks the board.",
          ],
        },
      ],
    },
  ],
};

export default doc;
