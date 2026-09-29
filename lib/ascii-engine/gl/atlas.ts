/* ─── ASCII engine (GL) — glyph atlas ───────────────────────────────────────── */

import { CanvasTexture, NearestFilter, Vector3 } from "three";
import { DEFAULT_SKIN, ERA_SEQUENCE, SECTION_SKINS, type EraSkin } from "../skins";

/**
 * Every glyph any skin can show, deduped into one atlas so skins can dither
 * between vocabularies without swapping textures. Slot 0 is always the blank.
 */
export const GLYPHS: readonly string[] = (() => {
  const set = new Set<string>([" "]);
  for (const s of [DEFAULT_SKIN, ...Object.values(SECTION_SKINS), ...ERA_SEQUENCE]) {
    for (const c of s.chars) set.add(c);
  }
  return [...set];
})();

const SLOT = new Map(GLYPHS.map((c, i) => [c, i]));
const slotCache = new WeakMap<readonly string[], number[]>();

/** Atlas slot per level for a skin's glyph vocabulary (cached per chars array). */
export function skinSlots(skin: EraSkin): number[] {
  let slots = slotCache.get(skin.chars);
  if (!slots) {
    slots = skin.chars.map((c) => SLOT.get(c) ?? 0);
    slotCache.set(skin.chars, slots);
  }
  return slots;
}

export const slotOf = (c: string) => SLOT.get(c) ?? 0;

/**
 * Atlas slot width: two cells. Geist Mono's advance (0.6em ≈ 9.6px at 16px)
 * is wider than an 8px cell, and on the 2D canvas each glyph spills into its
 * right-hand neighbour — that spill is what chains ◆◆◆ and joins ┼ crossbars.
 * The compose pass reproduces it by also drawing the left neighbour's overflow.
 */
export const slotWidth = (cellW: number) => cellW * 2;

/**
 * One row of GLYPHS.length slots (slotWidth × cellH, × dpr) — 1:1 texel
 * mapping so nearest filtering stays crisp. Uses the real next/font family name
 * (next/font renames it; a literal 'Geist Mono' silently falls back).
 */
export function buildGlyphAtlas(cellW: number, cellH: number, dpr: number): CanvasTexture {
  const family =
    getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() ||
    "monospace";
  const w = Math.round(slotWidth(cellW) * dpr);
  const h = Math.round(cellH * dpr);
  const canvas = document.createElement("canvas");
  canvas.width = w * GLYPHS.length;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "top";
  // 16px in a 22px cell on the 2D canvas → keep the same ratio for other cells
  ctx.font = `${Math.round(cellH * (16 / 22) * dpr)}px ${family}`;
  GLYPHS.forEach((c, i) => ctx.fillText(c, i * w, 0));
  const tex = new CanvasTexture(canvas);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

/** Resolve any CSS color (e.g. the oklch() background token) to sRGB 0–1. */
export function resolveCssColor(css: string): Vector3 {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new Vector3(r / 255, g / 255, b / 255);
}

/** Parse the rgba() strings in skins.ts STYLES into sRGB rgb + alpha. */
export function parseStyle(css: string): [number, number, number, number] {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return [0, 0, 0, 0];
  const [r, g, b, a = "1"] = m[1].split(",").map((s) => s.trim());
  return [+r / 255, +g / 255, +b / 255, +a];
}
