/* ─── ASCII engine — current skin blend from the journey store ──────────────── */

import { chapters } from "../chapters";
import type { journey } from "../journey-store";
import { DEFAULT_SKIN, SECTION_SKINS, evolveEra, type EraSkin } from "./skins";

/**
 * Which two skins are on screen and how far between them — the same rules the
 * 2D vessel applies (vessel.tsx resolveSkin), minus its canvas palettes:
 *   reduced motion → the visible chapter's skin, no blend
 *   inside the timeline pin → evolve through ERA_SEQUENCE by its progress
 *   otherwise → the controller's chapter-boundary blend
 */
export interface SkinBlend { a: EraSkin; b: EraSkin; t: number; }

const SKIN_LIST: EraSkin[] = chapters.map((c) => SECTION_SKINS[c.id] ?? DEFAULT_SKIN);
const clampIdx = (i: number) => Math.max(0, Math.min(SKIN_LIST.length - 1, i));

export function currentSkinBlend(state: typeof journey.state): SkinBlend {
  if (state.reducedMotion) {
    const s = SKIN_LIST[clampIdx(state.chapterIndex)];
    return { a: s, b: s, t: 0 };
  }
  if (state.timelineProgress >= 0) {
    const { from, to, f } = evolveEra(state.timelineProgress);
    return { a: from, b: to, t: f };
  }
  const { from, to, t } = state.blend;
  return { a: SKIN_LIST[clampIdx(from)], b: SKIN_LIST[clampIdx(to)], t: from === to ? 0 : t };
}
