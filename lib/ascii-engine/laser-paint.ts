// ── laser-paint ───────────────────────────────────────────────────────────────
// Paints the laser layer's glyphs into a 2D context (laser-cpu.ts evaluates the
// cells). Shared by the 2D tier's worker (OffscreenCanvas, off the main thread)
// and its main-thread fallback, so both draw the same pixels.

import { laserFrame, laserRgb, shimmerHue } from "./laser-cpu";
import type { LaserUniforms } from "./gl/laser-shader";

export const CELL_W = 8;
export const CELL_H = 22;

export type TitleMask = { data: Uint8ClampedArray; w: number; h: number };
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** textRendering: an OffscreenCanvas can't inherit the page's
 *  -webkit-font-smoothing, but "geometricPrecision" renders the same grayscale
 *  antialiasing (laser-2d.tsx decides; "auto" leaves the default) */
export function createLaserPainter(ctx: Ctx, opts: { textRendering?: CanvasTextRendering } = {}) {
  let W = 0, H = 0, cols = 0, rows = 0, family = "monospace", brightness = 1;
  // palette coordinate × hue × brightness → css color (quantized + cached;
  // the hue only varies on the sound scale — the shimmer)
  const styles = new Map<number, string>();
  const palStyle = (v: number, hue: number) => {
    const pq = Math.round(v * 128);
    const hq = v < 0.5 ? 0 : Math.round(hue / 5) % 72;
    const k = (pq * 72 + hq) * 8 + Math.round(brightness * 6);
    let s = styles.get(k);
    if (!s) {
      const [r, g, b] = laserRgb(pq / 128, hq * 5).map((c) => Math.min(255, Math.round(c * brightness)));
      styles.set(k, (s = `rgb(${r} ${g} ${b})`));
    }
    return s;
  };
  // the reading column stays calm, like the 3D carve
  const calm = (x: number) => {
    const half = Math.min(512, W * 0.4);
    const inside = Math.min(1, Math.max(0, (half - Math.abs(x - W / 2)) / 120));
    return 1 - 0.55 * inside * inside * (3 - 2 * inside);
  };

  return {
    resize(w: number, h: number, dpr: number, fontFamily: string) {
      W = w;
      H = h;
      ctx.canvas.width = Math.round(w * dpr);
      ctx.canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL_W);
      rows = Math.ceil(h / CELL_H);
      family = fontFamily;
    },
    paint(u: LaserUniforms, time: number, bright: number, title: TitleMask | null) {
      brightness = Math.round(bright * 6) / 6;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.font = `${Math.round(CELL_H * (16 / 22))}px ${family}`;
      ctx.textBaseline = "top";
      if (opts.textRendering) ctx.textRendering = opts.textRendering;
      laserFrame(u, cols, rows, CELL_W, CELL_H, (col, row, c) => {
        ctx.globalAlpha = Math.min(1, c.alpha);
        ctx.fillStyle = palStyle(c.pal, shimmerHue(time, col, row));
        ctx.fillText(c.ch, col * CELL_W, row * CELL_H);
      }, calm, title);
      ctx.globalAlpha = 1;
    },
    /** lit pixels (tests) */
    lit() {
      const d = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
      return n;
    },
  };
}
