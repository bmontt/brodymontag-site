// here comes the kicker: the detail page below the card copy. STE (docs/portfolio-style-plan.md §4).
// Facts checked 2026-10-20 against here-comes-the-kicker@110edb6 (the
// browser build), here-comes-the-kicker-unity@4e5017f (PORTING.md,
// Assets/Scripts/Sim: GameSim, Pitching, Tuning, SimMath; docs/progression)
// and the vault note Coding/Projects/Here Comes the Kicker.md (the compile
// check, the callout count). Both repos are private: excerpts show text only.

import type { DetailDoc } from "./types";

const doc: DetailDoc = {
  key: "here-comes-the-kicker",
  kind: "project",
  updated: "2026-10-20",
  sections: [
    {
      heading: "how it works",
      blocks: [
        {
          id: "figure",
          type: "figure",
          name: "here-comes-the-kicker",
          caption: "figure 1 · four pitches, in fixed steps · real constants, side view",
          alt: "Four pitch types travel from the mound to the plate. Each dot is one simulation step of 1/120 s. A roller stays down, a skipper skips three times, and a big hop takes one long hop.",
        },
        {
          id: "how",
          type: "prose",
          text: "The game state is one object, and a fixed-step loop advances it at 120 steps a second. The loop adds the real frame time to an accumulator and runs only whole steps. Slow motion and hit-stop change the time that goes in, never the step. The random generator is mulberry32 with a stored seed, so a seed and the same inputs replay a game.",
        },
        {
          id: "how-2",
          type: "prose",
          text: "The ball physics are integrated by hand, with no Unity physics. At release, the game solves each pitch so that it crosses the aimed point. The pitch rolls or skips on the ground, and one airborne leg carries it up to the aimed height. The view reads the state and reacts to the events that the simulation sends.",
        },
        {
          id: "flow",
          type: "diagram",
          caption: "figure 2 · one simulation, stepped by one call",
          alt: "Input writes intent into GameSim. Frame time fills an accumulator, which steps GameSim in steps of 1/120 s. GameSim sends its state and its events to the view and the UI.",
          mermaid: `flowchart TD
  A[keyboard and mouse] -->|intent| B[GameSim]
  C[frame time] --> D[accumulator]
  D -->|steps of 1/120 s| B
  B -->|state and events| E[view]
  B -->|state| F[UI]
  F -->|calls| B`,
        },
        {
          id: "advance",
          type: "code",
          caption: "the accumulator: slow motion changes the time in, never the step",
          excerpt: "kicker/advance",
          lang: "csharp",
          highlight: [284, 285, 286, 287, 288],
        },
      ],
    },
    {
      heading: "decisions",
      blocks: [
        {
          id: "plain-sim",
          type: "decision",
          title: "The simulation is plain C#, not MonoBehaviours",
          status: "accepted",
          date: "2026-08-17",
          context: "The browser game stepped one state object with a fixed-step loop. Rules spread across Update methods would run in an order that the inspector sets.",
          decision: "The simulation is plain classes, stepped by one call. A fielder has a position, not a Transform, and the view finds its mesh by the fielder's index. A test can run the game with no view.",
          cost: ["Unity components and physics do not apply to the simulation. The view needs a bridge for each part."],
        },
        {
          id: "solve",
          type: "decision",
          title: "Solve each pitch at release, and integrate the ball by hand",
          status: "accepted",
          date: "2026-08-16",
          context: "A pitch must cross the plate at the point that the pitcher aims at. A solver and a physics engine cannot both own the same path.",
          decision: "The ball has no Rigidbody. The solve uses the same discrete steps as the game, and it snaps the last bounce to a step boundary. Three gravities, one each for pitches, batted balls and jumps, are tuned for play.",
          cost: ["The constants mean nothing outside this game. A Rigidbody on the ball breaks the strike-zone calls."],
        },
        {
          id: "launch",
          type: "code",
          caption: "the solve, against the discrete integrator",
          excerpt: "kicker/pitch-solve",
          lang: "csharp",
          highlight: [63, 64, 66],
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
            ["Unity port, compile check", "measured", "0 errors"],
            ["size of the port at that check", "measured", "31 files, 5,640 lines"],
            ["time for the port", "measured", "3 days"],
            ["callout lines in the browser build", "measured", "114 in 26 pools"],
            ["CPU difficulty levels", "measured", "4"],
          ],
          method: "compile: Unity 6000.5.8f1 in batch mode at commit 6530942, on 2026-08-17. Port time: commits from 2026-08-17 to 2026-08-19. Counts: the browser build at 110edb6, on 2026-08-17.",
          asOf: "2026-08-19",
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
            "No automated test suite exists. Claude sessions drove the browser build and read its pixels, and I ran the port in the editor.",
            "No compile check or play test of the work after commit fce6a4b is on record.",
            "The Unity scene has no color pass yet.",
            "All the art is procedural primitives.",
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
            "Done: the browser game (2026-08-17) and the Unity 6 port (2026-08-19).",
            "Paused since 2026-08-19. Avatar progression exists only as design documents.",
            "Next: a compile check and a play test of the last cycles, then the item data types from the roadmap.",
          ],
        },
      ],
    },
  ],
};

export default doc;
