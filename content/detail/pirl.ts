// PIRL (UMIACS, University of Maryland): the detail part of the experience
// page. STE (docs/portfolio-style-plan.md §4). Public facts only. Every fact
// below is in lib/content.json at 7ff325c: the pirl entry (code.experience,
// lines 1310-1331) and the Peak_Finding_Toolbox entry (code.projects, lines
// 1105-1132), which the fact audit of 2026-10-19 checked. The benchmark rows
// are the ones on the Peak_Finding_Toolbox page (content/detail/
// peak-finding-toolbox.ts), dated by its last commit.

import type { DetailDoc } from "./types";

const AT = "https://github.com/bmontt/brodymontag-site/blob/7ff325c55270ade6b887be00204a41b58cdae50b/lib/content.json";

const doc: DetailDoc = {
  key: "pirl",
  kind: "experience",
  updated: "2026-10-20",
  sections: [
    {
      heading: "results",
      blocks: [
        {
          id: "bench",
          type: "table",
          caption: "Peak_Finding_Toolbox · the Wave V benchmark",
          columns: ["figure", "kind", "value"],
          rows: [
            ["Wave V pairs, automatic against manual", "measured", "54, from 8 subjects"],
            ["median error", "measured", "1.15 ms"],
            ["picks within 0.5 ms", "measured", "41%"],
          ],
          method: "the toolbox's Wave V picks against manual picks. The Peak_Finding_Toolbox page gives the full method.",
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
            "Only Peak_Finding_Toolbox has figures on this page.",
            "The benchmark covers Wave V only. Waves I to IV have none.",
            "The toolbox is a research prototype, not a clinical tool.",
          ],
        },
      ],
    },
    {
      heading: "sources",
      blocks: [
        {
          id: "sources-note",
          type: "prose",
          text: "Each fact on this page is in the site's content file, in the PIRL entry and the Peak_Finding_Toolbox entry. A fact audit on 2026-10-19 checked both entries.",
        },
        {
          id: "sources",
          type: "links",
          items: [
            { label: "the senior research paper: a CRNN that detects hearing loss", href: "https://docs.google.com/document/d/1YATXYDqKSsFRUAdsngWYRoW_lLQKZk4tKbO5e55yaMw/edit?usp=sharing" },
            { label: "Peak_Finding_Toolbox source", href: "https://github.com/bmontt/Peak_Finding_Toolbox" },
            { label: "the PIRL entry in lib/content.json at 7ff325c", href: `${AT}#L1105-L1132` },
            { label: "the Peak_Finding_Toolbox entry in lib/content.json at 7ff325c", href: `${AT}#L1310-L1331` },
            { label: "the lab site", href: "https://www.umiacs.umd.edu/labs/pirl/" },
          ],
        },
      ],
    },
  ],
};

export default doc;
