// Peak_Finding_Toolbox: the detail page below the card copy. STE (docs/portfolio-style-plan.md §4).
// Facts checked 2026-10-20 against Peak_Finding_Toolbox@f82d762 (public:
// toolbox/peak_finder.py, toolbox/data_loader.py, bench/, bench_scripts/,
// commit 6abd671). The benchmark figures were computed again on 2026-10-20
// from the two CSVs at that commit, with the logic of
// bench_scripts/generate_evaluation_metrics.py.

import type { DetailDoc } from "./types";

const REPO = "https://github.com/bmontt/Peak_Finding_Toolbox";
const AT = "f82d7626f50b6421446aaa5892a441f342415daa";

const doc: DetailDoc = {
  key: "peak-finding-toolbox",
  kind: "project",
  updated: "2026-10-20",
  sections: [
    {
      heading: "how it works",
      blocks: [
        {
          id: "figure",
          type: "figure",
          name: "peak-finding-toolbox",
          caption: "figure 1 · the picks for waves I to V · schematic trace, real windows",
          alt: "A schematic ABR trace draws in and is smoothed. Candidate peaks appear, and triplets are tried against the normal interval ranges. The best I, III and V lock in, then II and IV.",
        },
        {
          id: "how",
          type: "prose",
          text: "For an ABR, the toolbox first measures a signal-to-noise ratio (SNR). It compares the RMS from 0 to 10 ms after the click with the RMS in the 5 ms before it. A low SNR gives a wider Gaussian smoothing, up to 4 times the base width. Then the toolbox finds peaks between 0 and 15 ms, and drops those after 9.6 ms when at least three are left.",
        },
        {
          id: "how-2",
          type: "prose",
          text: "Each set of three candidates is a possible I–III–V triplet. A triplet counts only if its intervals fall in normal ranges. These are 1.80 to 2.30 ms for I–III, 1.40 to 2.30 ms for III–V, and 3.76 to 4.70 ms for I–V. The best triplet is closest to 2, 2 and 4 ms, with double weight on I–V. Waves II and IV are the strongest peaks between their neighbors.",
        },
        {
          id: "flow",
          type: "diagram",
          caption: "figure 2 · from an average to five waves",
          alt: "An averaged ABR gets an SNR and a smoothing width. Peaks from 0 to 15 ms go to the triplet test. A fit gives I, III and V. No fit gives a new pass, and after three passes the three most prominent peaks. II and IV come last.",
          mermaid: `flowchart TD
  A[averaged ABR] --> B[SNR from signal and noise windows]
  B --> C[Gaussian smoothing, wider at low SNR]
  C --> D[peaks from 0 to 15 ms]
  D --> E{a triplet fits the windows?}
  E -->|yes| F[best I-III-V triplet]
  E -->|no, next pass| C
  E -->|no, after 3 passes| G[3 most prominent peaks]
  F --> H[II and IV between the anchors]
  G --> H`,
        },
        {
          id: "triplets",
          type: "code",
          caption: "the triplet test and its score",
          excerpt: "peak-finding/triplet-score",
          lang: "python",
          highlight: [138, 139, 140, 144],
        },
      ],
    },
    {
      heading: "decisions",
      blocks: [
        {
          id: "anchor",
          type: "decision",
          title: "Anchor on the I–III–V triplet, not on single peaks",
          status: "accepted",
          date: "2025-05-04",
          context: "One ABR has many small peaks, and noise adds more. One peak alone can look like any of the five waves.",
          decision: "The finder tests every I–III–V triplet against the normal interval ranges and takes the best one. Waves II and IV come last, between their anchors.",
          cost: ["For a recording with abnormal intervals, no triplet fits, and the finder falls back to the three most prominent peaks. It computes a QC flag for this, but the public function does not return the flag."],
        },
        {
          id: "passes",
          type: "decision",
          title: "Smooth by the SNR, and try again",
          status: "accepted",
          date: "2025-05-04",
          context: "One fixed smoothing width blurs clean waves or leaves noise in poor recordings.",
          decision: "The smoothing width follows the SNR. When no triplet fits, the next pass smooths 20% more and lowers the prominence by 20%, for up to three passes.",
          cost: ["A noisy recording can still give a triplet that fits by chance. Nothing checks the picks against the noise."],
        },
        {
          id: "pass-code",
          type: "code",
          caption: "each pass: a wider smoothing and a lower prominence",
          excerpt: "peak-finding/passes",
          lang: "python",
          highlight: [105, 106, 110],
        },
      ],
    },
    {
      heading: "results",
      blocks: [
        {
          id: "bench",
          type: "table",
          columns: ["figure", "kind", "value"],
          rows: [
            ["Wave V pairs, automatic against manual", "measured", "54, from 8 subjects"],
            ["median error", "measured", "1.15 ms"],
            ["mean error", "measured", "1.56 ms"],
            ["picks within 0.5 ms", "measured", "41%"],
            ["picks within 1.0 ms", "measured", "48%"],
            ["picks within 2.0 ms", "measured", "74%"],
            ["mean signed difference, automatic minus manual", "measured", "+0.93 ms"],
          ],
          method: "the two CSVs in bench/ at f82d762, compared row by row as generate_evaluation_metrics.py does. Rows with no manual pick are left out. The manual picks come from the repo's peak_annotator app.",
          asOf: "2025-05-07",
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
            "Only Wave V has a benchmark. Waves I to IV have none.",
            "The benchmark has 8 subjects, all with normal hearing.",
            "The picks come late: on average 0.93 ms after the manual pick.",
            "The SOFA and audio modes have no benchmark.",
            "It is a research prototype, not a clinical tool.",
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
            "Done: the ABR, SOFA and audio modes, the tests, and the Wave V benchmark (2025-05-07).",
            "Archived since 2025-05-07. No more work is planned.",
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
            { label: `the triplet scoring, peak_finder.py:131-149 at f82d762`, href: `${REPO}/blob/${AT}/toolbox/peak_finder.py#L131-L149` },
            { label: "the automatic and manual Wave V picks (CSV) at f82d762", href: `${REPO}/tree/${AT}/bench` },
            { label: "the metrics script at f82d762", href: `${REPO}/blob/${AT}/bench_scripts/generate_evaluation_metrics.py` },
            { label: "source", href: REPO },
          ],
        },
      ],
    },
  ],
};

export default doc;
