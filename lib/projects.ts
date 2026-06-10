export interface ProjectHighlight {
  text: string;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  status: "live" | "wip";
  // detail-page fields
  longDescription: string;
  highlights: string[];
}

export const projects: Project[] = [
  {
    id: "superset",
    slug: "superset",
    name: "superset",
    description:
      "Rekordbox-compatible DJ setlist optimizer. A librosa/Essentia pipeline extracts 40+ spectral, timbral, and rhythmic features per track, then KMeans/DBSCAN clustering generates flow-optimized sets with a CustomTkinter GUI.",
    tags: ["Python", "audio ML", "DSP", "CLI + GUI"],
    githubUrl: "https://github.com/bmontt/superset",
    status: "live",
    longDescription:
      "Superset started as a frustration — spending hours manually curating sets from a library of thousands of tracks. The idea: apply the same audio feature extraction that powers music recommendation systems to DJ curation, and automate the part of the workflow that doesn't require taste.\n\nThe pipeline runs locally on Apple Silicon. Rekordbox XML is parsed to extract a track catalog, then librosa and Essentia compute 40+ features per track — BPM, key, spectral centroid, timbral texture, energy envelope, and more. KMeans and DBSCAN cluster the library into vibe and energy groups, and a greedy graph traversal generates a setlist that respects harmonic mixing rules and energy arc.\n\nThe output is a rekordbox-compatible XML playlist — it drops directly into the existing DJ workflow, no intermediate steps. A CustomTkinter GUI allows interactive library exploration and manual override at any point in the process.",
    highlights: [
      "40+ spectral, timbral, and rhythmic features per track via librosa + Essentia",
      "Runs entirely on-device — no API calls, no cloud dependency",
      "KMeans + DBSCAN dual-clustering for energy and vibe segmentation",
      "Exports rekordbox-compatible XML playlists",
      "CustomTkinter GUI with real-time library exploration",
      "Genre-specific parameter modes (house, dubstep)",
      "Optimized for Apple Silicon via MLX",
    ],
  },
  {
    id: "roblox_bot",
    slug: "roblox-bot",
    name: "roblox_bot",
    description:
      "3-tier hierarchical async LLM agent for Roblox FPS. YOLO/OpenCV runs at 60fps for frame-level reactions, Claude Haiku handles tactical intent, Claude Sonnet drives strategic goals — each tier operating at its own cadence.",
    tags: ["Python", "Claude API", "YOLO", "OpenCV"],
    githubUrl: "https://github.com/bmontt/roblox_bot",
    status: "live",
    longDescription:
      "Roblox Bot is an exploration of hierarchical agency — the question of how you split a real-time task across agents with radically different latency requirements.\n\nThe answer: three independent async tiers, each operating at its own cadence. Tier 1 is YOLOv8/OpenCV running at ~60fps — pure reaction, frame-level detection for movement and targeting. Tier 2 is Claude Haiku receiving state summaries every 1-2 seconds, producing tactical intent (engagement choices, positioning). Tier 3 is Claude Sonnet processing high-level game state on a longer loop, setting strategic objectives and adjusting macro-level goals.\n\nThe tiers don't wait for each other. Lower tiers proceed with the last available signal from higher tiers, which prevents cascading latency from becoming a blocking problem. The architecture is general — the same pattern applies to any real-time task that benefits from layered reasoning.",
    highlights: [
      "YOLOv8/OpenCV reactive layer at ~60fps",
      "Claude Haiku for tactical decisions at ~1-2 second intervals",
      "Claude Sonnet for strategic goals at ~5-10 second intervals",
      "Fully async multi-process architecture — tiers don't block each other",
      "Custom game state extraction from screen capture",
      "Prompt engineering optimized for spatial and tactical reasoning",
    ],
  },
  {
    id: "peak_finding",
    slug: "peak-finding-toolbox",
    name: "Peak_Finding_Toolbox",
    description:
      "Research-grade peak detector for auditory signals. Handles ABR clinical wave I–V annotation, HRTF/SOFA-format spatial audio files, and general audio onset detection with configurable thresholding.",
    tags: ["Python", "EEG", "HRTF", "signal processing"],
    githubUrl: "https://github.com/bmontt/Peak_Finding_Toolbox",
    status: "live",
    longDescription:
      "The Peak Finding Toolbox was developed during auditory signal processing research at the University of Maryland. Auditory Brainstem Response (ABR) measurements — short electrical signals recorded from the scalp in response to sound — require precise peak annotation across five clinical waves (I-V) to be clinically useful. Existing tools were either proprietary, inflexible, or required significant manual annotation.\n\nThe toolbox provides configurable adaptive thresholding algorithms for automated ABR wave detection, with support for the SOFA (Spatially Oriented Format for Acoustics) standard used in HRTF spatial audio research. The design philosophy: accurate enough for clinical research use, accessible enough for researchers who are not Python experts — clear interfaces, documented parameters, and sensible defaults.\n\nThe toolbox is also used for general audio onset detection, where the same thresholding and peak-picking algorithms apply beyond the neurological signal domain.",
    highlights: [
      "ABR wave I–V annotation with adaptive thresholding algorithms",
      "HRTF/SOFA-format spatial audio file parsing and processing",
      "Configurable onset detection with multiple threshold strategies",
      "MNE and BIDS-compatible data format support",
      "Designed for clinical and academic research environments",
      "Accessible API — no signal processing expertise required",
    ],
  },
  {
    id: "anvil",
    slug: "anvil",
    name: "Anvil",
    description:
      "Autonomous self-improvement loop for an LLM agent fleet. Runs daily audits of agent code quality, builds a prioritized work queue, and dispatches specialist subagents to iteratively refine the codebase without human intervention.",
    tags: ["TypeScript", "LLM agents", "Claude API"],
    githubUrl: undefined,
    status: "wip",
    longDescription:
      "Anvil is a bet that the most valuable thing an AI coding agent can do is improve the system it runs on.\n\nThe design: a daily audit loop that reads the codebase, identifies technical debt and code quality issues, scores them by estimated impact and effort, and dispatches specialist subagents to fix them — without a human in the loop. Not a CI/CD pipeline, but a reasoning agent that makes editorial decisions about what to improve next and how.\n\nPhase 0 is the audit loop: a single agent that reads, evaluates, and produces a prioritized work queue. Subsequent phases add the dispatcher (load-balancing work across parallel workers) and the specialist fleet (debugger, refiner, test-writer, documentation-architect). The long-term goal is a system that gets measurably better at its own job over time, using Claude Code's agent architecture as the runtime.",
    highlights: [
      "Daily automated codebase audits using reasoning models",
      "Impact/effort scoring and priority queue generation",
      "Specialist subagent dispatch — debugger, refiner, test-writer",
      "Designed for Claude Code's multi-agent architecture",
      "Self-referential: the agent improves the fleet it belongs to",
      "Phase 0 in active development",
    ],
  },
  {
    id: "subagent_dashboard",
    slug: "subagent-dashboard",
    name: "Subagent Dashboard",
    description:
      "Next.js dashboard for live-monitoring parallel Claude Code agent sessions. Streams chain-of-thought and output from concurrent subagents into a unified interface — the control plane for multi-agent dev workflows.",
    tags: ["TypeScript", "Next.js", "Claude API", "real-time"],
    githubUrl: undefined,
    status: "live",
    longDescription:
      "When you're running 5-10 parallel Claude Code agents on different clusters of the same codebase, you need to see what's happening across all of them simultaneously. The Subagent Dashboard was built to solve that problem.\n\nThe dashboard streams chain-of-thought (CoT) and output from concurrent agent sessions into a unified interface. Each agent gets a panel showing its current task, recent tool calls, and running output in real time. Cross-agent dependencies and conflicts surface immediately, rather than being discovered after the fact during a coherence review.\n\nBuilt on Next.js with a real-time streaming architecture — this is the interface that runs the multi-agent development workflow on a daily basis.",
    highlights: [
      "Real-time CoT and output streaming from concurrent Claude Code sessions",
      "Per-agent panels with task, tool calls, and live output",
      "Cross-agent dependency and conflict visibility",
      "Next.js with server-sent events streaming architecture",
      "Active daily use — core tooling for multi-agent dev workflow",
    ],
  },
];
