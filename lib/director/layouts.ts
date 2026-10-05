// ── director / layouts ────────────────────────────────────────────────────────
// Where scene objects stand on the sheet (world px, y up), shared by the scenes
// that draw them and the stage that flies to them (click-to-fly, detail-page
// presets). Compositions are authored against HOME_TRACK's stations: objects
// flank the camera path with a lateral offset proportional to depth, which
// keeps them in the screen margin beside the text column at every distance
// (view half-width ≈ 0.68·d at fov 46°, 16:10).

import { projects } from "../projects";
import { events } from "../brody-events";
import type { Pose } from "./rig";

const DEG = Math.PI / 180;
const MARGIN_RATIO = 0.54;

/** Click-to-fly duration: the stage blends to the destination, then the route changes. */
export const FLY_MS = 650;

interface Frame { az: number; origin: [number, number]; back: number; h: [number, number]; right: [number, number]; }
function frame(azDeg: number, origin: [number, number], back: number): Frame {
  const a = azDeg * DEG;
  return { az: azDeg, origin, back, h: [Math.sin(a), Math.cos(a)], right: [Math.cos(a), -Math.sin(a)] };
}

export const BUILD = frame(-22, [-260, 40], 660);
export const MONTY = frame(24, [260, -20], 645);

function flank(f: Frame, depth: number, side: number) {
  const lateral = MARGIN_RATIO * (f.back + depth);
  return {
    x: f.origin[0] + f.h[0] * depth + f.right[0] * side * lateral,
    y: f.origin[1] + f.h[1] * depth + f.right[1] * side * lateral,
  };
}

/** One monolith per project: alternating sides, receding. */
export const PILLARS = projects.map((p, i) => {
  const side = i % 2 === 0 ? -1 : 1;
  return {
    id: `project:${p.id}`,
    slug: p.slug,
    side,
    ...flank(BUILD, 60 + i * 170, side),
    h: (p.status === "live" ? 360 : 250) + ((i * 53) % 70),
    rot: BUILD.az * DEG + side * 0.12,
  };
});

/** Event photos (deduped, first six) and which shows each belongs to. */
export const PHOTOS: { src: string; ids: string[]; slugs: string[] }[] = (() => {
  const bySrc = new Map<string, { ids: string[]; slugs: string[] }>();
  for (const e of events) {
    for (const m of e.media) {
      if (m.type !== "image") continue;
      const entry = bySrc.get(m.src) ?? { ids: [], slugs: [] };
      entry.ids.push(`show:${e.id}`);
      entry.slugs.push(e.slug);
      bySrc.set(m.src, entry);
    }
  }
  return [...bySrc].slice(0, 6).map(([src, v]) => ({ src, ...v }));
})();

export const PANELS = PHOTOS.map((photo, i) => {
  const side = i % 2 === 0 ? -1 : 1;
  return { ...photo, side, ...flank(MONTY, 80 + i * 150, side), rot: MONTY.az * DEG - side * 0.35 };
});

/** Camera parked beside an object (detail pages, end of a click-to-fly). */
export function presetPose(kind: "project" | "show", index: number): Partial<Pose> {
  const base: Partial<Pose> = { fov: 46, relief: 1, look: 0.5, roll: Math.PI * 2, merge: 0, ring: 0 };
  if (kind === "project" && PILLARS[index]) {
    const p = PILLARS[index];
    return { ...base, tx: p.x, ty: p.y, elev: 16, az: BUILD.az - p.side * 30, dist: 440 };
  }
  if (kind === "show" && PANELS[index]) {
    const p = PANELS[index];
    return { ...base, tx: p.x, ty: p.y, elev: 14, az: MONTY.az - p.side * 30, dist: 400 };
  }
  // a show without a photo: the warm side, overview
  return { ...base, tx: MONTY.origin[0], ty: MONTY.origin[1], elev: 32, az: MONTY.az, dist: 760 };
}

/** Route → preset index (slug lookups). -1 when the object doesn't exist. */
export const pillarIndexBySlug = (slug: string) => PILLARS.findIndex((p) => p.slug === slug);
export const panelIndexBySlug = (slug: string) => PANELS.findIndex((p) => p.slugs.includes(slug));
