import type { ComponentType, CSSProperties, SVGProps } from "react";
import { FaGithub, FaSoundcloud, FaSpotify, FaInstagram, FaLinkedinIn } from "react-icons/fa";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string; style?: CSSProperties }>;

export interface PlatformDetail {
  label: string;
  value: string;
  href?: string;
}

export interface PlatformData {
  id: string;
  name: string;
  handle: string;
  href: string;
  icon: IconComponent;
  glowRgb: string;           // "r, g, b" — used in rgba()
  stat?: { label: string; value: string };
  details: PlatformDetail[];
}

export const platforms: PlatformData[] = [
  {
    id: "github",
    name: "github",
    handle: "bmontt",
    href: "https://github.com/bmontt",
    icon: FaGithub as IconComponent,
    glowRgb: "210, 210, 210",
    details: [
      { label: "superset",             value: "python · audio ml · dsp",       href: "https://github.com/bmontt/superset"              },
      { label: "roblox_bot",           value: "python · claude api · cv",      href: "https://github.com/bmontt/roblox_bot"            },
      { label: "Peak_Finding_Toolbox", value: "python · eeg · hrtf",           href: "https://github.com/bmontt/Peak_Finding_Toolbox"  },
      { label: "Anvil",                value: "typescript · llm agents · wip"                                                          },
    ],
  },
  {
    id: "soundcloud",
    name: "soundcloud",
    handle: "brodymontag",
    href: "https://soundcloud.com/brodymontag",
    icon: FaSoundcloud as IconComponent,
    glowRgb: "255, 85, 0",
    stat: { label: "tracks", value: "34" },
    details: [
      { label: "tracks",        value: "34"                                                              },
      { label: "followers",     value: "134"                                                             },
      { label: "likes",         value: "3,292"                                                           },
      { label: "latest",        value: "when a fire starts to burn", href: "https://soundcloud.com/brodymontag" },
    ],
  },
  {
    id: "spotify",
    name: "spotify",
    handle: "MONTY US",
    href: "https://open.spotify.com/artist/3uIzwP6Ab6TgP61naHtDMO",
    icon: FaSpotify as IconComponent,
    glowRgb: "29, 185, 84",
    details: [
      { label: "artist",  value: "MONTY US"                                                                       },
      { label: "single",  value: "when a fire starts to burn (oct 2025)", href: "https://spotify.link/vVmdengZJXb" },
      { label: "release", value: "ffm.to/whenafirestartstoburn",           href: "https://ffm.to/whenafirestartstoburn" },
    ],
  },
  {
    id: "instagram",
    name: "instagram",
    handle: "@brodymontag",
    href: "https://www.instagram.com/brodymontag",
    icon: FaInstagram as IconComponent,
    glowRgb: "193, 53, 132",
    stat: { label: "followers", value: "2.4k" },
    details: [
      { label: "followers",  value: "2,442"                                                                      },
      { label: "base",       value: "ny / dc"                                                                    },
      { label: "residency",  value: "@beatprint__",  href: "https://www.instagram.com/beatprint__"              },
      { label: "collective", value: "@pbandjsounds", href: "https://www.instagram.com/pbandjsounds"             },
    ],
  },
  {
    id: "linkedin",
    name: "linkedin",
    handle: "brody-montag",
    href: "https://www.linkedin.com/in/brody-montag",
    icon: FaLinkedinIn as IconComponent,
    glowRgb: "0, 119, 181",
    details: [
      { label: "role",      value: "full stack developer"       },
      { label: "company",   value: "fiserv · ml/ai team"        },
      { label: "education", value: "umd cs + ml, 2025"          },
    ],
  },
];
