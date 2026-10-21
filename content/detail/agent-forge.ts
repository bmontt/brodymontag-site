// agent-forge: the detail page below the card copy. STE (docs/portfolio-style-plan.md §4).
// Facts checked 2026-10-20 against agent-forge@9db1c77 (README, build.py,
// factory.config.yaml, scripts/agent_eval.py, commits 3ab0472, 06f4294,
// 8c727ed) and the token count of 2026-10-19 (count_tokens on a build of each
// commit). The repo is private: excerpts show text only.

import type { DetailDoc } from "./types";

const doc: DetailDoc = {
  key: "agent-forge",
  kind: "project",
  updated: "2026-10-20",
  sections: [
    {
      heading: "how it works",
      blocks: [
        {
          id: "figure",
          type: "figure",
          name: "agent-forge",
          caption: "figure 1 · one source, two builds · schematic",
          alt: "One agent source with a tier, verbs and an include goes through the build. The build writes a Claude Code file and a VS Code file, then 12 checks run on the result.",
        },
        {
          id: "how",
          type: "prose",
          text: "Each agent has one source file: YAML frontmatter and a body that names no platform. The frontmatter gives a tier (fast, standard or deep), the tools as plain verbs, the skills, and the agents that it may call. The build maps the tier to a model, and each verb to the tool name on each platform.",
        },
        {
          id: "how-2",
          type: "prose",
          text: "The build writes the Claude Code agents and the VS Code prompts. It backs up each file before it writes it, and it records a sha256 for each output in a manifest. Then it runs the eval script as a gate, and the build exits with an error when a check fails.",
        },
        {
          id: "flow",
          type: "diagram",
          caption: "figure 2 · from the sources to two platforms",
          alt: "Agent sources, partials and the config go into build.py. It writes Claude Code agents, VS Code prompts and a manifest, and the eval script checks the result.",
          mermaid: `flowchart TD
  A[agents source files] --> B[build.py]
  P[partials and skills] --> B
  C[factory.config.yaml] --> B
  B --> D[Claude Code agents]
  B --> E[VS Code prompts]
  B --> F[manifest.json]
  F --> G[agent_eval.py 12 checks]`,
        },
        {
          id: "includes",
          type: "code",
          caption: "a placeholder that does not resolve stops the build",
          excerpt: "agent-forge/resolve-includes",
          lang: "python",
          highlight: [100, 101, 102],
        },
      ],
    },
    {
      heading: "decisions",
      blocks: [
        {
          id: "one-source",
          type: "decision",
          title: "One source, built for two platforms",
          status: "accepted",
          date: "2026-06-09",
          context: "The agents lived as copies in several repositories and in the VS Code prompts folder. The copies drifted apart, and project paths leaked into agents that were meant to be generic.",
          decision: "agent-forge holds one source for each agent. A build makes the Claude Code and VS Code files, and nobody edits the output by hand.",
          cost: ["An edit to an installed copy is lost at the next build. On 2026-10-20, a commit moved two such edits back into the sources."],
        },
        {
          id: "lazy",
          type: "decision",
          title: "Shared blocks load on demand, as skills",
          status: "accepted",
          date: "2026-06-30",
          context: "Each agent file held full copies of the shared blocks. The dashboard block alone, about 1,476 characters, sat in 12 agents.",
          decision: "Each shared block became a skill. The agent file holds a one-line pointer, and the agent reads the skill only when the task needs it. The same commit cut each description to 145 characters or fewer.",
          cost: ["An agent that needs a block reads one more file at run time."],
        },
        {
          id: "eval",
          type: "decision",
          title: "Code checks the built agents",
          status: "accepted",
          date: "2026-06-30",
          context: "A prompt library has no compiler. A call to an agent that does not exist fails only when an agent tries it.",
          decision: "agent_eval.py runs after each build. It started with 9 checks, and 3 more came on 2026-07-13. Some read the built files, for example model routing and delegations to agents that do not exist. Others read the telemetry log and the vault.",
          cost: ["The check runs after the build writes its files. A failed check reports the problem, but it does not undo the write."],
        },
        {
          id: "delegates",
          type: "code",
          caption: "check 4: every delegate is a real agent",
          excerpt: "agent-forge/check-delegates",
          lang: "python",
          highlight: [141, 142],
        },
      ],
    },
    {
      heading: "results",
      blocks: [
        {
          id: "tokens",
          type: "table",
          columns: ["figure", "kind", "value"],
          rows: [
            ["16 agents, before the skill pointers", "measured", "31,538 tokens"],
            ["the same 16, at commit 06f4294", "measured", "20,564 tokens"],
            ["cut from skill pointers and shorter descriptions", "measured", "−35%"],
            ["the same 16 agents at commit b930aba", "measured", "25,683 tokens"],
          ],
          method: "the count_tokens API with claude-opus-5-5, on a build of each commit with a separate HOME. Commit 06f4294 is from 2026-06-30, and b930aba from 2026-10-15.",
          asOf: "2026-10-19",
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
            "The token counts cover the agent files only, not the skills that an agent reads later.",
            "The eval checks files, references and logs. It does not grade the work that an agent does.",
            "Copilot ignores the model tiers. Its delegations run at the model of the parent session.",
          ],
        },
      ],
    },
  ],
};

export default doc;
