export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  status: "live" | "wip";
}

export const projects: Project[] = [
  {
    id: "superset",
    name: "superset",
    description:
      "Rekordbox-compatible DJ setlist optimizer. A librosa/Essentia pipeline extracts 40+ spectral, timbral, and rhythmic features per track, then KMeans/DBSCAN clustering generates flow-optimized sets with a CustomTkinter GUI.",
    tags: ["Python", "audio ML", "DSP", "CLI + GUI"],
    githubUrl: "https://github.com/bmontt/superset",
    status: "live",
  },
  {
    id: "roblox_bot",
    name: "roblox_bot",
    description:
      "3-tier hierarchical async LLM agent for Roblox FPS. YOLO/OpenCV runs at 60fps for frame-level reactions, Claude Haiku handles tactical intent, Claude Sonnet drives strategic goals — each tier operating at its own cadence.",
    tags: ["Python", "Claude API", "YOLO", "OpenCV"],
    githubUrl: "https://github.com/bmontt/roblox_bot",
    status: "live",
  },
  {
    id: "peak_finding",
    name: "Peak_Finding_Toolbox",
    description:
      "Research-grade peak detector for auditory signals. Handles ABR clinical wave I–V annotation, HRTF/SOFA-format spatial audio files, and general audio onset detection with configurable thresholding.",
    tags: ["Python", "EEG", "HRTF", "signal processing"],
    githubUrl: "https://github.com/bmontt/Peak_Finding_Toolbox",
    status: "live",
  },
  {
    id: "anvil",
    name: "Anvil",
    description:
      "Autonomous self-improvement loop for an LLM agent fleet. Runs daily audits of agent code quality, builds a prioritized work queue, and dispatches specialist subagents to iteratively refine the codebase without human intervention.",
    tags: ["TypeScript", "LLM agents", "Claude API"],
    githubUrl: undefined,
    status: "wip",
  },
];
