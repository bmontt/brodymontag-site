// ── figure: brodymontag.com · from a scene to glyphs ──────────────────────────
// The stage's three GPU passes (lib/ascii-engine/gl/ascii-renderer.ts render()),
// played as a loop: (1) a scene — here a small network, the software page's
// figure — (2) sampled into cells of 8×22 px, one level per cell, (3) each cell
// drawn as a glyph. The glyphs are the stage's own: the laser strokes ─ │ ╲ ╱ ·
// (lib/ascii-engine/gl/atlas.ts LASER_GLYPHS) for a line by its angle, and
// the skins' ┼ ◆ (lib/ascii-engine/skins.ts) for the bright nodes.
// The cells are computed here, at build, from the same network the scene
// draws, so the three layers agree. Drawn at 1.5× (a 12×33 unit cell).

import { relPath, type Seg } from "./svg";

const W = 720;
const H = 300;
const CW = 12; // 8 px × 1.5
const CH = 33; // 22 px × 1.5
const COLS = 56;
const ROWS = 8;
const GX = (W - COLS * CW) / 2;
const GY = (H - ROWS * CH) / 2;

const NODES: [number, number][] = [
  [86, 66], [214, 214], [338, 70], [462, 182], [598, 74], [652, 236], [128, 262], [300, 260],
];
const EDGES: [number, number][] = [
  [0, 2], [0, 1], [1, 3], [2, 3], [3, 4], [3, 5], [2, 4], [1, 6], [1, 7], [7, 3],
];

function segDist(px: number, py: number, [ax, ay]: [number, number], [bx, by]: [number, number]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** the stroke glyph for a line at this on-screen angle (y down) */
function strokeGlyph(dx: number, dy: number) {
  const a = ((Math.atan2(dy, dx) * 180) / Math.PI + 180) % 180;
  if (a < 22 || a > 158) return "─";
  if (a > 68 && a < 112) return "│";
  return a < 90 ? "╲" : "╱";
}

type Cell = { c: number; r: number; level: number; glyph: string; node: number };

/** pass 1 + pass 2: each cell's level from the scene (max over a few samples
 *  inside the cell, so a thin line still lights the cells it crosses) */
const CELLS: Cell[] = (() => {
  const out: Cell[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const x0 = GX + c * CW, y0 = GY + r * CH;
      let best = 0, edge = -1, node = -1, nodeV = 0;
      for (let sy = 0; sy < 5; sy++)
        for (let sx = 0; sx < 3; sx++) {
          const px = x0 + (sx + 0.5) * (CW / 3), py = y0 + (sy + 0.5) * (CH / 5);
          EDGES.forEach(([a, b], k) => {
            const v = Math.exp(-((segDist(px, py, NODES[a], NODES[b]) / 2.6) ** 2));
            if (v > best) { best = v; edge = k; }
          });
          NODES.forEach((n, k) => {
            const d = Math.hypot(px - n[0], py - n[1]);
            const v = d < 9 ? 1 : Math.exp(-(((d - 9) / 9) ** 2));
            if (v > nodeV) { nodeV = v; node = k; }
          });
        }
      const v = Math.max(best, nodeV);
      const level = v > 0.8 ? 4 : v > 0.5 ? 3 : v > 0.22 ? 2 : v > 0.08 ? 1 : 0;
      if (!level) continue;
      let glyph = "·";
      if (nodeV >= best && nodeV > 0.5) glyph = level === 4 ? "◆" : "┼";
      else if (level >= 2) {
        const [a, b] = EDGES[edge];
        glyph = strokeGlyph(NODES[b][0] - NODES[a][0], NODES[b][1] - NODES[a][1]);
      }
      out.push({ c, r, level, glyph, node: nodeV >= best && nodeV > 0.5 ? node : -1 });
    }
  return out;
})();

/** two nodes carry the pearl glint (sky, orchid); the rest stay white */
const HOT: Record<number, number> = { 2: 0, 5: 1 };

const LEVEL_ALPHA = [0, 0.07, 0.17, 0.32, 0.6];
const LEVELS = [1, 2, 3, 4];
const isHot = (x: Cell) => x.level === 4 && HOT[x.node] !== undefined;
const glyphX = (x: Cell) => GX + x.c * CW + CW / 2;
const glyphY = (x: Cell) => GY + x.r * CH + CH / 2 + 7;
const glyphFill = (level: number) => `oklch(1 0 0 / ${Math.min(1, LEVEL_ALPHA[level] + 0.32)})`;

/** pass 2, one path per level: each cell a stroke 11 wide down its middle
 *  (butt caps: the same 11 × 32 box a rect would draw); no two cells touch */
const CELL_PATHS = LEVELS.map((level) =>
  relPath(
    CELLS.filter((x) => x.level === level).flatMap((x): Seg[] => [
      ["M", GX + x.c * CW + CW / 2, GY + x.r * CH + 0.5],
      ["V", GY + x.r * CH + CH - 0.5],
    ]),
  ),
);
/** pass 3, one <text> per level: an x and a y for each glyph, so each glyph
 *  is placed (and centred) on its own; the two hot nodes stay apart */
const GLYPH_RUNS = LEVELS.map((level) => CELLS.filter((x) => x.level === level && !isHot(x)));

const view = `0 0 ${W} ${H}`;

export default function SiteFigure() {
  return (
    <div className="sf">
      <div className="sf-stage">
        {/* the cell grid, 8×22 px at 1.5×, with one cell called out */}
        <svg className="fig-svg" viewBox={view} aria-hidden="true">
          <defs>
            <pattern id="sf-grid" width={CW} height={CH} patternUnits="userSpaceOnUse" x={GX} y={GY}>
              <path d={`M ${CW} 0 V ${CH} H 0`} fill="none" stroke="oklch(1 0 0 / 0.055)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x={GX} y={GY} width={COLS * CW} height={ROWS * CH} fill="url(#sf-grid)" />
        </svg>
        {/* pass 1 · the scene */}
        <svg className="fig-svg sf-layer sf-scene" viewBox={view} aria-hidden="true">
          {EDGES.map(([a, b], k) => (
            <g key={k} style={{ ["--k" as string]: k }}>
              <line x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke="oklch(1 0 0 / 0.07)" strokeWidth="9" strokeLinecap="round" />
              <line className="sf-beam" pathLength={1} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke="oklch(1 0 0 / 0.9)" strokeWidth="1.3" />
            </g>
          ))}
          {NODES.map(([x, y], k) => (
            <g key={k} className="sf-node" style={{ ["--k" as string]: k }}>
              <circle cx={x} cy={y} r="15" fill="oklch(1 0 0 / 0.06)" />
              <circle cx={x} cy={y} r="5.5" fill="oklch(0.97 0 0)" />
            </g>
          ))}
        </svg>
        {/* pass 2 · a level for each cell */}
        <div className="sf-wipe sf-cells">
          <div className="sf-wipe-in">
            <svg className="fig-svg" viewBox={view} aria-hidden="true">
              {CELL_PATHS.map((d, i) => (
                <path key={i} d={d} stroke={`oklch(1 0 0 / ${LEVEL_ALPHA[LEVELS[i]]})`} strokeWidth={CW - 1} />
              ))}
            </svg>
          </div>
        </div>
        {/* pass 3 · glyphs from the atlas */}
        <div className="sf-wipe sf-glyphs">
          <div className="sf-wipe-in">
            <svg className="fig-svg" viewBox={view} aria-hidden="true">
              <g fontSize="20" textAnchor="middle">
                {GLYPH_RUNS.map((run, i) => (
                  <text key={i} x={run.map(glyphX).join(" ")} y={run.map(glyphY).join(" ")} fill={glyphFill(LEVELS[i])}>
                    {run.map((x) => x.glyph).join("")}
                  </text>
                ))}
                {CELLS.filter(isHot).map((x) => (
                  <text key={`${x.c}-${x.r}`} className={`sf-hot sf-hot-${HOT[x.node]}`} x={glyphX(x)} y={glyphY(x)} fill={glyphFill(x.level)}>
                    {x.glyph}
                  </text>
                ))}
              </g>
            </svg>
          </div>
        </div>
        <div className="sf-scan" aria-hidden="true" />
        {/* one cell, outlined in the corner */}
        <svg className="fig-svg sf-layer" viewBox={view} aria-hidden="true">
          <rect x={GX + 0.5} y={GY + 0.5} width={CW - 1} height={CH - 1} fill="none" stroke="oklch(1 0 0 / 0.7)" strokeWidth="1" />
        </svg>
      </div>
      <ol className="fig-steps sf-steps border-t border-white/10 px-4 py-2.5 font-mono text-2xs text-foreground/70">
        <li className="fig-step sf-step sf-step-1"><b>1</b> scene → a target, one pixel per cell</li>
        <li className="fig-step sf-step sf-step-2"><b>2</b> a level for each cell</li>
        <li className="fig-step sf-step fig-step-on sf-step-3"><b>3</b> a glyph from the atlas</li>
        <li className="ml-auto text-foreground/55"><span aria-hidden="true" className="sf-key" /> one cell · 8 × 22 px</li>
      </ol>
    </div>
  );
}
