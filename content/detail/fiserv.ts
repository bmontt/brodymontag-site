// Fiserv: the detail part of the experience page. STE (docs/portfolio-style-plan.md §4).
// Employer work: public facts only, no code and no diagram of internal systems
// (plan §9, §11.5). Every fact below is in the fiserv entry of lib/content.json
// (code.experience, lines 1285-1311 at 390d928), which follows the final resume
// of 2026-10-22. The resume gives the figures with no date or method, so they
// show as "reported". The "not public" list follows plan §4.2.

import type { DetailDoc } from "./types";

// the entry at a pinned commit (rule 7: link source at a commit, not a branch)
const ENTRY = "https://github.com/bmontt/brodymontag-site/blob/390d92832005699d320e7801fe2e5174506256fe/lib/content.json#L1285-L1311";

const doc: DetailDoc = {
  key: "fiserv",
  kind: "experience",
  updated: "2026-10-22",
  sections: [
    {
      heading: "results",
      blocks: [
        {
          id: "figures",
          type: "table",
          caption: "the figures on my resume",
          columns: ["figure", "kind", "value"],
          rows: [
            ["documents and OpenAPI specs that the CMS delivers", "reported", "10,000+"],
            ["change in pull request throughput with the delivery platform", "reported", "2.4×"],
            ["repositories in the security triage", "reported", "12"],
            ["time for the triage, by hand", "reported", "3+ weeks"],
            ["time for the triage, automated", "reported", "1 hour"],
            ["recall against a manual AppSec review", "reported", "100%"],
            ["internal teams on the alert platform", "reported", "5"],
          ],
          method: "my resume states these figures. It gives no date and no method.",
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
            "The figures come from my resume. This page does not show the data behind them.",
            "This page does not give the date or the method of each figure.",
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
          text: "Each fact on this page is in the Fiserv entry of the site's content file. On 2026-10-22, I changed that entry to agree with my final resume.",
        },
        {
          id: "sources",
          type: "links",
          items: [
            { label: "the Fiserv entry in lib/content.json at 390d928", href: ENTRY },
            { label: "my LinkedIn profile", href: "https://www.linkedin.com/in/brody-montag" },
            { label: "fiserv.com", href: "https://www.fiserv.com" },
          ],
        },
      ],
    },
  ],
};

export default doc;
