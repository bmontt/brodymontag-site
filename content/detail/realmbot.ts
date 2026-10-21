// realmbot: the detail page below the card copy. STE (docs/portfolio-style-plan.md §4).
// Facts checked 2026-10-20 against realmbot@5ad9543 (docs/adr 0002 and 0006,
// decisions/*.yaml, packages/rb-brain arbiter, governor and gate,
// docs/research/threshold-tuning.md, docs/plan §M1) and the vault note
// Coding/Projects/realmbot.md (the soak, the test count). The repo is
// private: excerpts show text only.

import type { DetailDoc } from "./types";

const doc: DetailDoc = {
  key: "realmbot",
  kind: "project",
  updated: "2026-10-20",
  sections: [
    {
      heading: "how it works",
      blocks: [
        {
          id: "figure",
          type: "figure",
          name: "realmbot",
          caption: "figure 1 · a tick, and who owns it · schematic",
          alt: "Server ticks pass along a track. Deterministic code answers every tick. About once a second, the model picks a mode, and the heuristic answers when the model is late, unsure or down.",
        },
        {
          id: "how",
          type: "prose",
          text: "The bot splits control into layers. The reflex layer runs on every server tick in deterministic code: safety checks, dodges, paths and the mode executors. The protocol layer sends every required reply. The tactical layer asks the decision model, about once a second, which of seven modes to run.",
        },
        {
          id: "how-2",
          type: "prose",
          text: "Each question comes from a versioned YAML spec, with its options and its thresholds. The arbiter takes the model's mode only if the answer is fresh and sure enough. Otherwise the heuristic answers. A token-bucket governor paces the calls under Jev's limit of 1,200 requests a minute for each key.",
        },
        {
          id: "flow",
          type: "diagram",
          caption: "figure 2 · the layers and the arbiter",
          alt: "Packets go to the protocol layer. It feeds the reflex layer on every tick and the decision loop about once a second. The model and the heuristic both answer, and the arbiter picks the mode that the reflex layer runs.",
          mermaid: `flowchart TD
  A[game server] -->|packets| B[protocol layer]
  B -->|every tick| C[reflex layer]
  B -->|about 1 Hz| D[decision loop]
  D -->|governor| E[decision model]
  D --> F[heuristic]
  E --> G[arbiter]
  F --> G
  G -->|mode| C`,
        },
        {
          id: "arbiter",
          type: "code",
          caption: "the arbiter: safety first, then the model only if it is fresh and sure",
          excerpt: "realmbot/arbiter-select",
          lang: "python",
          highlight: [215, 216],
        },
      ],
    },
    {
      heading: "decisions",
      blocks: [
        {
          id: "layers",
          type: "decision",
          title: "The model picks only the mode",
          status: "accepted",
          date: "2026-09-23",
          context: "Jev answers in 70 to 500 ms. That is longer than a server tick, and some packets need a reply on time.",
          decision: "Jev answers only in the tactical layer and picks one of seven modes. Deterministic reflex code carries the mode out, and a safety check always overrides it.",
          cost: ["The arbiter needs TTL and hysteresis rules, so that a stale or weak answer does not reach the reflex layer."],
        },
        {
          id: "mode-spec",
          type: "code",
          caption: "the mode question: seven options and their harness",
          excerpt: "realmbot/mode-spec",
          lang: "yaml",
        },
        {
          id: "heuristic",
          type: "decision",
          title: "A heuristic first, and as the fallback for every call",
          status: "accepted",
          date: "2026-09-23",
          context: "Jev was in early access, with self-reported benchmarks. Without a control group, no test can show that the model helps.",
          decision: "A rule-based heuristic answers each question behind the same interface as the model. It answers when the model times out, is unsure, returns a 429 or has an open circuit breaker. It is also the control group.",
          cost: ["Each question needs a heuristic rule and a model spec, which is about twice the work."],
        },
        {
          id: "tuning",
          type: "decision",
          title: "The danger threshold comes from a reliability curve, not a guess",
          status: "accepted",
          date: "2026-10-01",
          context: "The first thresholds in the specs were placeholders.",
          decision: "A sweep over out-of-fold predictions picked the danger threshold and its hysteresis margin: 0.30 and 0.24. The mode question still uses placeholders.",
          cost: ["0.30 is the lowest point of the sweep, and any threshold from 0.30 to 0.45 scores about the same. The sweep used the stand-in tabular model."],
        },
        {
          id: "danger-spec",
          type: "code",
          caption: "the danger spec after the sweep",
          excerpt: "realmbot/danger-harness",
          lang: "yaml",
          highlight: [21, 22],
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
            ["soak against the local server", "measured", "60 min, 0 disconnects"],
            ["server ticks answered, NEWTICK → MOVE", "measured", "17,997"],
            ["PING → PONG replies", "measured", "1,200"],
            ["decode errors", "measured", "0"],
            ["danger accuracy with fallback, threshold 0.55 → 0.30", "measured", "0.527 → 0.591"],
            ["danger coverage, same change", "measured", "0.48 → 1.00"],
          ],
          method: "soak: 3,600 s against a local zig server on 2026-09-24. Danger: 4,455 out-of-fold rows from 57 episodes, scored with the stand-in tabular model.",
          asOf: "2026-10-01",
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
            "Every test used stand-ins. Jev itself never answered a question.",
            "The data for the sweep holds only Wizard rows from the Nexus and the Vault.",
            "The soak tested the protocol and the replies for one hour. It did not test play.",
            "No live A/B test compares the model with the heuristic yet.",
            "The danger gain is 6.4 points, with a 95% interval of 1.2 to 11.0. One of five folds shows a loss.",
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
            "Done: the protocol, the reflex layer, the arbiter, the action gate, the governor and the evals, with 2,025 tests (2026-10-01).",
            "Blocked: no access to Jev. Paused since 2026-10-01.",
            "Next: the live A/B test against the heuristic, then runs with more than one bot.",
          ],
        },
      ],
    },
  ],
};

export default doc;
