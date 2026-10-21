// venture: the detail page below the card copy. STE (docs/portfolio-style-plan.md §4).
// Facts checked 2026-10-20 against venture@33dd9e3 (README, the launchd plists,
// venture/allocator.py, config.py, agent.py, docs/hosting.md, commits 1b8291d,
// 4cf8c6a, 88e0d02). Brody's rule: no amounts and no results on the site. The
// one figure in dollars is the gas cap that the card already shows. The repo
// is private: excerpts show text only.

import type { DetailDoc } from "./types";

const doc: DetailDoc = {
  key: "venture",
  kind: "project",
  updated: "2026-10-20",
  sections: [
    {
      heading: "how it works",
      blocks: [
        {
          id: "figure",
          type: "figure",
          name: "venture",
          caption: "figure 1 · the clock and the gates · schematic, no amounts",
          alt: "A 24-hour dial marks four cycles and a tick every 15 minutes. When the wallet needs gas, a top-up moves at once. A move to Kalshi or the wallet waits at a gate for approval.",
        },
        {
          id: "how",
          type: "prose",
          text: "A full cycle runs at 00:15, 06:15, 12:15 and 18:15, and a short tick runs every 15 minutes. If the Mac sleeps through a slot, launchd runs the cycle on wake. Each avenue runs its own logic and reports its own health. After the audit of each account, the allocator moves money in a fixed order.",
        },
        {
          id: "how-2",
          type: "prose",
          text: "Coinbase is the main way in. The allocator converts USD to USDC, keeps gas in the on-chain wallet, and tops Kalshi up when bets go unfunded, or toward a target. In the default mode, a move that leaves Coinbase waits for one keypress in the terminal app or a tap in Telegram. A process lock stops a second cycle while one runs.",
        },
        {
          id: "flow",
          type: "diagram",
          caption: "figure 2 · one way in, three ways out",
          alt: "Money enters Coinbase. The allocator sends gas to the wallet on its own. A move to Kalshi or to the wallet and Aave passes an approval gate first. The proof book caps the Kalshi target.",
          mermaid: `flowchart TD
  A[bank or USDC] --> B[Coinbase]
  B --> C[allocator]
  C -->|housekeeping| D[gas for the wallet]
  C -->|move| E{approval}
  E -->|TUI or Telegram| F[Kalshi]
  E -->|TUI or Telegram| G[wallet and Aave, optional]
  H[proof book] -->|caps the target| C`,
        },
        {
          id: "policy",
          type: "code",
          caption: "the allocator's order, in its own words",
          excerpt: "venture/allocator-policy",
          lang: "python",
          highlight: [17, 18, 19],
        },
      ],
    },
    {
      heading: "decisions",
      blocks: [
        {
          id: "bounds",
          type: "decision",
          title: "The code holds the limits, not the prompt",
          status: "accepted",
          date: "2026-10-13",
          context: "In the first version, the agent prompt held the bounds and the locked limits. A prompt asks the model to obey. It does not stop a bad value.",
          decision: "Automation may change only a whitelisted setting, inside its range. A change to any of the 11 locked limits blocks the real-money avenues until a person restores it.",
          cost: ["A new setting needs a code change before automation can tune it."],
        },
        {
          id: "validate",
          type: "code",
          caption: "every change from automation passes this check",
          excerpt: "venture/validate-change",
          lang: "python",
          highlight: [122, 123],
        },
        {
          id: "review",
          type: "decision",
          title: "The weekly review may tune the paper strategy only",
          status: "accepted",
          date: "2026-10-14",
          context: "The first version ran Claude with full tool access after every cycle. When its login expired, it failed for months, and only a log line said so.",
          decision: "Claude runs once a week, or sooner when enough paper trades close, with no tools. It answers in JSON, and the code keeps only changes to the crypto paper strategy. I set the Kalshi sizes myself.",
          cost: ["The review cannot change Kalshi or the allocator. The crypto strategy that it can tune runs as paper trades by default."],
        },
        {
          id: "filter",
          type: "code",
          caption: "the reply goes through a filter, then through the bounds",
          excerpt: "venture/review-filter",
          lang: "python",
          highlight: [268, 269],
        },
        {
          id: "proof",
          type: "decision",
          title: "Real money follows evidence",
          status: "accepted",
          date: "2026-10-19",
          context: "A strategy that wins a few bets can be lucky. More capital on luck makes the loss larger.",
          decision: "Each market that the research looks at goes into a shadow book as a hypothetical bet. The Kalshi target grows in steps, and only after a pre-registered sequential test shows edge.",
          cost: ["Capital waits while the test collects independent settles."],
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
            "This page shows no amounts and no results, by choice.",
            "Kalshi has no crypto withdrawals. Money out of Kalshi is a manual step.",
            "On 2026-10-15, Mac sleep and hotspot outages stopped or broke cycles. A runbook describes a move to a wired home server, which is not done yet.",
            "The edge test needs many independent settles. Until then, the Kalshi target stays at its start cap.",
          ],
        },
      ],
    },
  ],
};

export default doc;
