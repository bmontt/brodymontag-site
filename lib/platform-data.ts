import type { ComponentType, CSSProperties, SVGProps } from "react";
import { FaGithub, FaSoundcloud, FaSpotify, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { content } from "./content";

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

// JSON can't hold React components, so it stores an icon key; map it back here.
export const ICONS: Record<string, IconComponent> = {
  github: FaGithub as IconComponent,
  soundcloud: FaSoundcloud as IconComponent,
  spotify: FaSpotify as IconComponent,
  instagram: FaInstagram as IconComponent,
  linkedin: FaLinkedinIn as IconComponent,
};

// Copy lives in content.json (presence.platforms); the icon key is resolved to
// its component at module load.
export const platforms: PlatformData[] = content.presence.platforms.map((p) => ({
  ...p,
  icon: ICONS[p.icon],
})) as unknown as PlatformData[];
