export interface StackCategory {
  label: string;
  items: string[];
}

export const stack: StackCategory[] = [
  {
    label: "languages",
    items: ["python", "typescript", "java", "c++", "sql", "ruby", "rust", "ocaml"],
  },
  {
    label: "web",
    items: ["next.js", "react", "tailwind css", "framer motion", "node.js", "supabase"],
  },
  {
    label: "ai / ml",
    items: ["claude api", "yolov8", "opencv", "pytorch", "scikit-learn", "anthropic sdk"],
  },
  {
    label: "audio / dsp",
    items: ["librosa", "essentia", "mne", "sofa / hrtf", "portaudio", "fl studio"],
  },
  {
    label: "infra",
    items: ["vercel", "git", "docker", "pytest", "ruff", "resend"],
  },
];

export interface ExperienceEntry {
  id: string;
  role: string;
  org: string;
  orgDetail: string;
  period: string;
  tags: string[];
  description: string;
}

export const experience: ExperienceEntry[] = [
  {
    id: "fiserv",
    role: "full stack developer",
    org: "fiserv",
    orgDetail: "ml/ai team",
    period: "2025 — present",
    tags: ["python", "typescript", "next.js", "ml"],
    description:
      "Building full-stack internal tooling and developer-facing systems for a fintech ML/AI team. Focus on model integration, observability, and workflow automation.",
  },
  {
    id: "umd",
    role: "bs computer science + machine learning",
    org: "university of maryland",
    orgDetail: "college park",
    period: "2021 — 2025",
    tags: ["ai", "signal processing", "data science", "research"],
    description:
      "Coursework in AI, data science, and algorithm design. Senior research: auditory signal processing — ABR peak detection and HRTF/SOFA spatial audio (Peak_Finding_Toolbox).",
  },
  {
    id: "sigma",
    role: "member",
    org: "sigma phi delta",
    orgDetail: "professional engineering fraternity",
    period: "2021 — 2025",
    tags: ["engineering", "leadership"],
    description:
      "Active member of the professional engineering fraternity at UMD. Focused on technical community building and cross-discipline collaboration.",
  },
];
