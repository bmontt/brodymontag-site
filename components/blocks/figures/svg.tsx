// ── figure helpers: the same drawing in fewer bytes ──────────────────────────
// A direct visit gets each figure twice, as HTML and again in the RSC payload,
// so the generated parts are written compactly. Nothing here changes what is
// drawn: coordinates round to 0.01 of a unit (or keep the 0.1 the paths
// always had), and the CSS loses only what a browser ignores.

import type { ReactNode } from "react";

/** a coordinate rounded to 0.01 of a unit, far below a device pixel */
export const r2 = (v: number) => Math.round(v * 100) / 100;

/** generated CSS without whitespace, last semicolons or trailing zeros */
export const minCss = (css: string) =>
  css
    .replace(/\s*([{};,])\s*/g, "$1")
    .replace(/:\s+/g, ":")
    .replace(/;}/g, "}")
    .replace(/(\d)\.(\d*?)0+(?!\d)/g, (_, a: string, b: string) => (b ? `${a}.${b}` : a))
    .trim();

export type Seg = ["M" | "L", number, number] | ["V" | "H", number];

/**
 * A path from absolute points, written with relative commands (m l h v, the
 * letter left out where it repeats). Points snap to `dp` decimals first and
 * each step is taken between snapped points, so the drawing is the one the
 * absolute path would give. With `scaled`, the numbers are whole tenths (dp
 * 1): draw that path inside <Tenths>, with its stroke width × 10.
 */
export function relPath(segs: Seg[], dp = 1, scaled = false) {
  const k = 10 ** dp;
  const q = (v: number) => Math.round(Number(v.toFixed(dp)) * k);
  const f = (n: number) => String(scaled ? n : n / k);
  let d = "";
  let prev = "";
  let px = 0;
  let py = 0;
  for (const s of segs) {
    let cmd: string;
    let args: number[];
    if (s[0] === "M" || s[0] === "L") {
      const x = q(s[1]);
      const y = q(s[2]);
      cmd = d ? s[0].toLowerCase() : "M";
      args = d ? [x - px, y - py] : [x, y];
      px = x;
      py = y;
    } else if (s[0] === "V") {
      const y = q(s[1]);
      cmd = "v";
      args = [y - py];
      py = y;
    } else {
      const x = q(s[1]);
      cmd = "h";
      args = [x - px];
      px = x;
    }
    // after a number, a minus sign is enough of a separator
    const nums = args.map((n, i) => (i && n >= 0 ? " " : "") + f(n)).join("");
    const repeat = cmd === prev && cmd !== "m" && cmd !== "M";
    d += repeat ? (args[0] >= 0 ? " " : "") + nums : cmd + nums;
    prev = cmd;
  }
  return d;
}

/**
 * A layer whose units are tenths of the figure's (w × h), for paths written
 * by relPath(…, 1, true). A nested viewBox, not a transform attribute: the
 * print rule in detail.css sets `transform: none` on everything in a block.
 */
export function Tenths({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w * 10} ${h * 10}`} overflow="visible">
      {children}
    </svg>
  );
}
