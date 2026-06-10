export interface ReleaseLink {
  platform: string;
  href: string;
}

export interface Release {
  id: string;
  title: string;
  date: string;
  type: "single" | "ep" | "album" | "mix";
  tags: string[];
  links: ReleaseLink[];
  description?: string;
}

export const releases: Release[] = [
  {
    id: "fire",
    title: "when a fire starts to burn",
    date: "oct 2025",
    type: "single",
    tags: ["tech house", "minimal"],
    links: [
      { platform: "spotify",       href: "https://spotify.link/vVmdengZJXb"        },
      { platform: "soundcloud",    href: "https://soundcloud.com/brodymontag"       },
      { platform: "all platforms", href: "https://ffm.to/whenafirestartstoburn"     },
    ],
    description: "debut single. inspired by the disclosure original — restructured for the modern tech house floor.",
  },
];
