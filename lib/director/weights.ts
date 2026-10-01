// ── director / weights ────────────────────────────────────────────────────────
// Scene visibility from scroll: a scene fades in over the tail of the previous
// chapter, holds through its own, and fades out into the next. Pure function of
// globalProgress + the measured chapter bounds (same inputs as the camera).

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function chapterWeight(
  id: string,
  g: number,
  chapterIds: readonly string[],
  bounds: readonly number[],
  lead = 0.35,
  tail = 0.35,
): number {
  const i = chapterIds.indexOf(id);
  if (i < 0 || bounds.length !== chapterIds.length) return 0;
  const s = bounds[i];
  const e = i + 1 < bounds.length ? bounds[i + 1] : 1;
  const len = Math.max(e - s, 1e-4);
  const fadeIn = smoothstep(s - lead * len, s + 0.08 * len, g);
  const fadeOut = i + 1 < bounds.length ? 1 - smoothstep(e - 0.08 * len, e + tail * len, g) : 1;
  return fadeIn * fadeOut;
}

/** Layout scale so compositions authored at 1440px wide still fit phones. */
export const layoutScale = (viewW: number) => Math.min(1, Math.max(0.35, viewW / 1440));
