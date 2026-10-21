// superset: the detail page below the card copy. STE (docs/portfolio-style-plan.md §4).
// Facts checked 2026-10-20 against superset@f3c76b0 (v2, not public:
// src/superset/analysis/setlist.py, llm_analyze.py, feature_extract.py,
// ml_classify.py, ingest/rekordbox.py, api/routes.py, README) and the public
// v1 at ca98d5b. The timing figures are the v2 README's own, with no date or
// method, so they show as "reported".

import type { DetailDoc } from "./types";

const doc: DetailDoc = {
  key: "superset",
  kind: "project",
  updated: "2026-10-20",
  sections: [
    {
      heading: "how it works",
      blocks: [
        {
          id: "figure",
          type: "figure",
          name: "superset",
          caption: "figure 1 · a greedy walk on the Camelot wheel · schematic tracks, real cost terms",
          alt: "Tracks sit on the Camelot wheel by key. From the slowest track, a walk compares the cost to each track not yet in the set and takes the cheapest. The energy of the set climbs as tracks join.",
        },
        {
          id: "how",
          type: "prose",
          text: "superset reads a Rekordbox library, from the version 6 or 7 database or an XML export. Each track goes through three stages. librosa measures tempo, key, spectral features and a 16-point intensity curve. Essentia models on a Discogs-EffNet embedding add genre, mood and danceability.",
        },
        {
          id: "how-2",
          type: "prose",
          text: "In the third stage, a 4-bit Qwen2.5-3B model on MLX reads those numbers as JSON. It writes a position in the set, tags for transitions and notes for the mix. Each stage has its own cache, so a new model runs only the third stage again. The order comes from a cost for each pair of tracks and a greedy walk.",
        },
        {
          id: "flow",
          type: "diagram",
          caption: "figure 2 · from a library to a set",
          alt: "A Rekordbox library goes through librosa, then Essentia, then a local Qwen model. A cost matrix and a greedy walk make the order. An optional model pass proposes its own order and compares the two.",
          mermaid: `flowchart TD
  A[Rekordbox library] --> B[librosa DSP]
  B --> C[Essentia classifiers]
  C --> D[Qwen2.5-3B on MLX]
  D --> E[cost matrix]
  E --> F[greedy walk]
  F --> H[setlist]
  F -.->|optional| G[model order and reconcile]
  G --> H`,
        },
        {
          id: "weights",
          type: "code",
          caption: "six cost terms and their default weights",
          excerpt: "superset/weights",
          lang: "python",
        },
      ],
    },
    {
      heading: "decisions",
      blocks: [
        {
          id: "camelot",
          type: "decision",
          title: "Measure key distance on the 24-key Camelot wheel",
          status: "accepted",
          date: "2026-06-30",
          context: "The first key cost used 12 notes and ignored the mode. A minor and A major got the same score.",
          decision: "The key cost is the shortest path on the Camelot wheel: the clock distance, plus 1 when the mode changes, divided by 6.",
          cost: ["An unknown key gets a neutral cost of 0.5. A bad key read does not stop the order, but it does not help it."],
        },
        {
          id: "key-cost",
          type: "code",
          caption: "the key term",
          excerpt: "superset/key-cost",
          lang: "python",
          highlight: [371, 372, 373, 374],
        },
        {
          id: "greedy",
          type: "decision",
          title: "A greedy walk, not an exact search",
          status: "accepted",
          date: "2026-04-22",
          context: "The best order over all the tracks is a travelling-salesman problem. Its exact search grows too fast for a full library.",
          decision: "The walk starts at the lowest tempo, the lowest energy or a seeded random track, by flow type. At each step it takes the cheapest next track.",
          cost: ["The walk does not look ahead. A cheap early step can force an expensive late step."],
        },
        {
          id: "walk",
          type: "code",
          caption: "the walk",
          excerpt: "superset/greedy",
          lang: "python",
          highlight: [412],
        },
      ],
    },
    {
      heading: "results",
      blocks: [
        {
          id: "speed",
          type: "table",
          columns: ["figure", "kind", "value"],
          rows: [
            ["full analysis, 41 tracks, M4 Pro, 24 GB", "reported", "4 to 8 min"],
            ["one track, same machine", "reported", "4 to 12 s"],
          ],
          method: "the v2 README states these figures. It gives no date and no method.",
          asOf: "2026-04-22",
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
            "The public repo is v1. The v2 code on this page is not public yet.",
            "The time figures come from one machine, and the README gives no method.",
            "The six weights are hand-set defaults. A request can change them, but no search tuned them.",
            "No test compares the order with an order that a DJ made.",
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
            "Done: v2 with three analysis stages and the Camelot key cost (2026-06-30). The Electron app is not in git yet.",
            "Paused since 2026-06-30.",
            "Next: publish v2 in the public repo.",
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
            { label: "v1 source, March 2026, at ca98d5b", href: "https://github.com/bmontt/superset/tree/ca98d5bade1db8c5070fcded498455902069ef0a" },
          ],
        },
      ],
    },
  ],
};

export default doc;
