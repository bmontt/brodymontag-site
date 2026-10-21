// Fiserv: the detail part of the experience page. STE (docs/portfolio-style-plan.md §4).
// Employer work: public facts only, no code and no diagram of internal systems
// (plan §9, §11.5). Every fact below is in the fiserv entry of lib/content.json
// (code.experience, lines 1285-1309 at 7ff325c), which the fact audit of
// 2026-10-19 checked against the resume and the LinkedIn text. The "not public"
// list follows plan §4.2.

import type { DetailDoc } from "./types";

// the entry at a pinned commit (rule 7: link source at a commit, not a branch)
const ENTRY = "https://github.com/bmontt/brodymontag-site/blob/7ff325c55270ade6b887be00204a41b58cdae50b/lib/content.json#L1285-L1309";

const doc: DetailDoc = {
  key: "fiserv",
  kind: "experience",
  updated: "2026-10-20",
  sections: [
    {
      heading: "results",
      blocks: [
        {
          id: "scan",
          type: "table",
          caption: "the security tools, one run",
          columns: ["figure", "kind", "value"],
          rows: [
            ["scanner findings sorted", "measured", "344"],
            ["time for the run", "measured", "13 s"],
            ["findings from a manual review that the run missed", "measured", "0"],
          ],
          method: "one run of the security tools, against the findings of a manual review",
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
            "The figures come from one run of the security tools.",
            "This page does not give the date of the run.",
            "The CMS and the delivery platform have no usage figures on this page.",
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
            "The code is not public. This page shows no Fiserv code.",
            "This page shows no diagram of internal systems.",
            "The product names are not public.",
            "Figures that are not on my resume are not public.",
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
          text: "Each fact on this page is in the Fiserv entry of the site's content file. A fact audit on 2026-10-19 checked that entry against my resume and my LinkedIn profile.",
        },
        {
          id: "sources",
          type: "links",
          items: [
            { label: "the Fiserv entry in lib/content.json at 7ff325c", href: ENTRY },
            { label: "my LinkedIn profile", href: "https://www.linkedin.com/in/brody-montag" },
            { label: "fiserv.com", href: "https://www.fiserv.com" },
          ],
        },
      ],
    },
  ],
};

export default doc;
