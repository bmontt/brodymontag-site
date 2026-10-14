// ── title mask ────────────────────────────────────────────────────────────────
// The section title as a white-on-black mask for the 3D laser titles (flag:
// titles) — drawn once per page in the display face, read by the GPU as a
// texture and by the CPU tier as pixels.

import type { StageRouteKind } from "@/lib/journey-store";

export const TITLE_TEXT: Partial<Record<StageRouteKind, string>> = {
  software: "software",
  music: "music",
  about: "about me",
};

const W = 1024, H = 256;

export function titleCanvas(text: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-neue").trim() || "sans-serif";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 210;
  ctx.font = `500 ${size}px ${family}`;
  const w = ctx.measureText(text).width;
  if (w > W * 0.94) size = Math.floor((size * W * 0.94) / w);
  ctx.font = `500 ${size}px ${family}`;
  ctx.fillText(text, W / 2, H / 2 + size * 0.04);
  return c;
}

/** mask height / width — the shader's uTitleB.y */
export const TITLE_ASPECT = H / W;
