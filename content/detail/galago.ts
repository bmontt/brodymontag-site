// Galago / BloomOptix (Ramboll): the detail part of the experience page. STE
// (docs/portfolio-style-plan.md §4). Employer work: public facts only, no
// code and no diagram of internal systems (plan §9, §11.5). Every fact below
// is in the galago entry of lib/content.json (code.experience, lines
// 1332-1352 at 7ff325c), which the fact audit of 2026-10-19 checked against
// the resume and the LinkedIn text.

import type { DetailDoc } from "./types";

// the entry at a pinned commit (rule 7: link source at a commit, not a branch)
const ENTRY = "https://github.com/bmontt/brodymontag-site/blob/7ff325c55270ade6b887be00204a41b58cdae50b/lib/content.json#L1332-L1352";

const doc: DetailDoc = {
  key: "galago",
  kind: "experience",
  updated: "2026-10-20",
  sections: [
    {
      heading: "results",
      blocks: [
        {
          id: "model",
          type: "table",
          caption: "the algae-bloom detection model",
          columns: ["figure", "kind", "value"],
          rows: [["accuracy of the R-CNN model after I retrained it", "measured", "94%"]],
          method: "not on this page",
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
            "The 94% accuracy is the only figure on this page.",
            "This page does not give the test set, the metric or the date for that figure.",
            "The AI adoption work and the dashboard have no figures on this page.",
          ],
        },
      ],
    },
    {
      heading: "not public",
      blocks: [
        {
          id: "not-public",
          type: "callout",
          kind: "note",
          items: [
            "The code is not public. This page shows no Ramboll code.",
            "This page shows no diagram of internal systems.",
            "This page shows no model data and no dashboard data.",
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
          text: "Each fact on this page is in the Galago entry of the site's content file. A fact audit on 2026-10-19 checked that entry against my resume and my LinkedIn profile.",
        },
        {
          id: "sources",
          type: "links",
          items: [
            { label: "the Galago entry in lib/content.json at 7ff325c", href: ENTRY },
            { label: "my LinkedIn profile", href: "https://www.linkedin.com/in/brody-montag" },
            { label: "Galago at Ramboll", href: "https://www.ramboll.com/en-us/galago" },
          ],
        },
      ],
    },
  ],
};

export default doc;
