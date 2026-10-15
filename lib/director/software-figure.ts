// ── director / software figure ────────────────────────────────────────────────
// The software page's figure: a network. Nodes (small diamonds, ╱╲ over ╲╱)
// wired by thin strokes into a graph that turns in 3D, packets — bright pulses
// — running along its edges in waves, like a forward pass, each node lighting
// as one arrives. It reads as what the page is about (systems, models), in the
// same strokes, white scale, depth shading and fog as every other figure.
//
// It holds one place behind the page's widgets, sticky on screen, turning in
// depth, and re-wires as you read: with each project in the middle of the
// screen the graph takes that project's shape (Prism splits one signal into
// four stems, venture routes money through an allocator to a gate, the
// decision tree, the kickball diamond…), contracting between two projects as
// its nodes split and merge into the next, expanding as the next one settles.
// Behind a card its strokes sink low, so the text reads over it and the
// network shows bright in the open lane beside each card — depth, not
// clutter. Small (the landing, phones) it folds down to a simpler graph;
// growing into the page it unfolds.
//
// Built in unit space (y up, z away from you), turned and projected on the CPU
// each frame into the laser layer's segment slots (laser-shader.ts roomL — a
// node is one slot, drawn as a diamond in px), so both tiers draw it. The
// director (laser.ts) places and sizes it exactly where the knot used to be.

import { ROOM_SEGS } from "@/lib/ascii-engine/gl/laser-shader";

export interface FigureInput {
  /** center px, radius px, weight 0–1 */
  x: number; y: number; r: number; w: number;
  /** facing (about the vertical axis) and tilt toward you, radians */
  yaw: number; tilt: number;
  /** TECH palette coordinate of the brightest stroke */
  pal: number;
  /** a phase that runs faster when stirred (hover, scroll, a picked transition): the packets' clock */
  phase: number;
  dt: number; // s (0 = reduced motion: fully formed, no glides)
  /** which graph: a layout key (readWidgets' focus, pageKey), "" for the page's own */
  key: string;
  /** a narrow screen: always the folded-down graph */
  compact: boolean;
  /** screen rects (x0, y0, x1, y1) the figure sinks behind — the widgets */
  quiet?: Widgets;
}

/** facing (yaw): inputs on the left, flowing right, seen three-quarters */
export const FLOWS_RIGHT = -0.45;

type V3 = [number, number, number];
/** a node: where it sits, its rank (input 0 → output) — or, turning in a ring
 *  about the x axis, its ring (radius, angle, depth squash) and turn rate */
interface Node { p: V3; rank: number; ring?: [number, number, number]; drum: number }
/** a graph in unit space; an edge is [from, to, step] — step is when its packet
 *  runs in a wave; tilt leans the view (a field is seen from above) */
interface Graph { nodes: Node[]; edges: [number, number, number][]; steps: number; tilt: number }

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const keyHash = (s: string) => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h;
};

// ── graphs ────────────────────────────────────────────────────────────────────
// Nodes run roughly input → output along x, so a morph pairs like with like.

const graph = (nodes: Node[], edges: [number, number, number][], tilt = 0): Graph => ({
  nodes, edges, steps: edges.reduce((m, e) => Math.max(m, e[2] + 1), 1), tilt,
});
const N = (x: number, y: number, z: number, rank: number): Node => ({ p: [x, y, z], rank, drum: 0 });

/** layers of nodes left → right, each layer a ring around the x axis (turning
 *  like a drum, alternate ways), every node wired to the next layer */
function layered(counts: number[], { radius = 0.66, sparse = 0, seed = 0, xs = 1.8 } = {}): Graph {
  const nodes: Node[] = [], edges: [number, number, number][] = [];
  const start: number[] = [];
  counts.forEach((m, li) => {
    start.push(nodes.length);
    const x = counts.length > 1 ? -xs / 2 + (li * xs) / (counts.length - 1) : 0;
    const rr = m === 1 ? 0 : radius * Math.min(1, 0.45 + 0.18 * m);
    for (let i = 0; i < m; i++) {
      const a = (i / m) * Math.PI * 2 + li * 0.7 + seed;
      const zf = 0.5;
      nodes.push({ p: [x, Math.cos(a) * rr, Math.sin(a) * rr * zf], rank: li, ring: m > 1 ? [rr, a, zf] : undefined, drum: (li % 2 ? -1 : 1) * 0.35 });
    }
  });
  for (let li = 0; li < counts.length - 1; li++) {
    for (let i = 0; i < counts[li]; i++) {
      for (let j = 0; j < counts[li + 1]; j++) {
        // sparse wiring keeps at least the straight-across edge
        if (sparse && j !== i % counts[li + 1] && hash(seed * 17 + li * 31 + i * 7 + j) < sparse) continue;
        edges.push([start[li] + i, start[li + 1] + j, li]);
      }
    }
  }
  return graph(nodes, edges);
}

/** parallel lanes: one in, split into `lanes` stages of `depth`, merged back out */
function lanes(n: number, depth: number): Graph {
  const nodes = [N(-0.95, 0, 0, 0), N(-0.5, 0, 0, 1)];
  const edges: [number, number, number][] = [[0, 1, 0]];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + 0.4;
    for (let d = 0; d < depth; d++) {
      nodes.push({ p: [-0.12 + d * 0.42, Math.cos(a) * 0.62, Math.sin(a) * 0.5], rank: 2 + d, ring: [0.62, a, 0.8], drum: 0.3 });
      const me = nodes.length - 1;
      edges.push([d === 0 ? 1 : me - 1, me, 1 + d]);
    }
  }
  nodes.push(N(0.95, 0, 0, 2 + depth));
  for (let k = 0; k < n; k++) edges.push([2 + k * depth + depth - 1, nodes.length - 1, 1 + depth]);
  return graph(nodes, edges);
}

/** a chain of nodes along a signal; peaks are the nodes */
function chain(ys: number[], zAmp = 0.3): Graph {
  const nodes = ys.map((y, i) => N(-0.95 + (1.9 * i) / (ys.length - 1), y, Math.sin(i * 1.3) * zAmp, i));
  return graph(nodes, ys.slice(1).map((_, i) => [i, i + 1, i] as [number, number, number]));
}

/** a hub, a ring of spokes around it (in the floor plane), the ring wired round */
function wheel(n: number, { hub = true, round = true, axis = false } = {}): Graph {
  const nodes: Node[] = [];
  const edges: [number, number, number][] = [];
  if (hub) nodes.push(N(0, 0, 0, 0));
  const o = nodes.length;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    nodes.push(N(Math.cos(a) * 0.85, Math.sin(a * 2) * 0.12, Math.sin(a) * 0.62, 1));
    if (hub) edges.push([0, o + i, 0]);
    if (round) edges.push([o + i, o + ((i + 1) % n), 1 + (i % 2)]);
  }
  if (axis) {
    nodes.push(N(0, 0.72, 0, 1), N(0, -0.72, 0, 1));
    edges.push([0, nodes.length - 2, 0], [0, nodes.length - 1, 0]);
  }
  return graph(nodes, edges, 0.35);
}

/** a tree, root at the left, branching `fan` ways per level */
function tree(levels: number, fan: number): Graph {
  const nodes: Node[] = [N(-0.9, 0, 0, 0)];
  const edges: [number, number, number][] = [];
  let prev = [0];
  for (let l = 1; l < levels; l++) {
    const next: number[] = [];
    const total = prev.length * fan;
    prev.forEach((pi, a) => {
      for (let k = 0; k < fan; k++) {
        const idx = a * fan + k;
        const y = (idx - (total - 1) / 2) * (1.5 / Math.max(total, 2)) * (total > 2 ? 1 : 0.9);
        nodes.push(N(-0.9 + (1.8 * l) / (levels - 1), y, ((idx % 2) - 0.5) * 0.35 * l, l));
        edges.push([pi, nodes.length - 1, l - 1]);
        next.push(nodes.length - 1);
      }
    });
    prev = next;
  }
  return graph(nodes, edges);
}

// the page's own: a small model, three in, two out
const MODEL = layered([3, 4, 4, 2], { sparse: 0.45, seed: 0.3, xs: 1.6 });
// folded down for small places (the landing, phones)
const MINI = layered([2, 3, 1], { radius: 0.7 });

const VENTURE = (() => {
  // one way in → the allocator → three strategies → the approval gate; the
  // review sits above, reading the strategies, tuning the allocator
  const g = layered([1, 1, 3, 1], { radius: 0.6 });
  g.nodes.push(N(0.3, 0.85, -0.2, 2));
  const rv = g.nodes.length - 1;
  g.edges.push([2, rv, 2], [3, rv, 2], [4, rv, 2], [rv, 1, 3]);
  return graph(g.nodes, g.edges);
})();

const SUPERSET = (() => {
  // tracks → their features cluster into two moods → a set, in order
  const nodes: Node[] = [];
  const edges: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) nodes.push(N(-0.95, 0.7 - i * 0.35, (i % 2 ? 0.25 : -0.25), 0));
  nodes.push(N(-0.25, 0.35, 0.2, 1), N(-0.25, -0.35, -0.2, 1));
  for (let i = 0; i < 5; i++) edges.push([i, i < 3 ? 5 : 6, 0]);
  for (let i = 0; i < 4; i++) nodes.push(N(0.25 + i * 0.24, 0.3 - i * 0.2 + (i % 2) * 0.25, 0.3 - i * 0.2, 2 + i));
  edges.push([5, 7, 1], [6, 8, 1], [7, 8, 2], [8, 9, 3], [9, 10, 4], [6, 10, 3]);
  return graph(nodes, edges);
})();

const KICKER = (() => {
  // the diamond: home, first, second, third, the mound; the outfield behind
  const nodes = [N(-0.85, -0.2, 0, 0), N(0, -0.2, -0.75, 1), N(0.85, -0.2, 0, 2), N(0, -0.2, 0.75, 3), N(0, -0.1, 0, 0)];
  nodes.push(N(1.0, 0.25, -0.55, 3), N(1.15, 0.3, 0, 3), N(1.0, 0.25, 0.55, 3));
  const edges: [number, number, number][] = [[4, 0, 0], [0, 1, 1], [1, 2, 2], [2, 3, 3], [3, 0, 4], [5, 6, 3], [6, 7, 3]];
  return graph(nodes.map((n) => ({ ...n, p: [n.p[0] - 0.12, n.p[1], n.p[2]] as V3 })), edges, 0.6);
})();

const FORGE = (() => {
  // shared blocks → one canonical library → two builds → their agents
  const nodes: Node[] = [];
  const edges: [number, number, number][] = [];
  for (let i = 0; i < 4; i++) nodes.push(N(-0.95, 0.6 - i * 0.4, (i % 2 ? 0.3 : -0.3), 0));
  nodes.push(N(-0.3, 0, 0, 1));
  for (let i = 0; i < 4; i++) edges.push([i, 4, 0]);
  nodes.push(N(0.3, 0.4, 0.25, 2), N(0.3, -0.4, -0.25, 2));
  edges.push([4, 5, 1], [4, 6, 1]);
  for (let i = 0; i < 4; i++) {
    nodes.push(N(0.95, 0.66 - i * 0.44, (i % 2 ? -0.3 : 0.3), 3));
    edges.push([i < 2 ? 5 : 6, nodes.length - 1, 2]);
  }
  return graph(nodes, edges);
})();

/** each project's shape (by its slug); anything else gets a generic one */
const PROJECT: Record<string, Graph> = {
  prism: lanes(4, 2), // one track → split into four stems → each through its own FX → the mixer
  venture: VENTURE,
  superset: SUPERSET,
  realmbot: tree(3, 2), // a decision, branching
  "brodymontag-com": wheel(4, { axis: true }), // the stage, its pages around it, two tiers drawing it
  "here-comes-the-kicker": KICKER,
  "agent-forge": FORGE,
  "peak-finding-toolbox": chain([-0.1, 0.25, -0.2, 0.45, -0.25, 0.3, -0.15, 0.6, -0.3]), // waves I–V
};
const GENERIC: Graph[] = [
  layered([2, 3, 3, 2], { seed: 0.4 }),
  wheel(6, { hub: true }),
  layered([3, 1, 3], { seed: 1.1 }),
  tree(3, 3),
  layered([1, 3, 4], { seed: 2.3 }),
  chain([0, 0.4, -0.4, 0.4, -0.4, 0.4, -0.4, 0]),
];

function graphFor(key: string, small: boolean): Graph {
  if (small) return MINI;
  if (!key) return MODEL;
  const slug = key.startsWith("project-") ? key.slice(8) : "";
  if (slug && PROJECT[slug]) return PROJECT[slug];
  const gi = key.startsWith("gap-") ? Number(key.slice(4)) : keyHash(key);
  return GENERIC[(Number.isFinite(gi) ? gi : 0) % GENERIC.length];
}

// ── which graph a place asks for ─────────────────────────────────────────────

/** the software page's alternating widgets as they stand on screen */
export interface Widgets {
  n: number;
  /** on-screen rects, x0 y0 x1 y1 (px, slide included) */
  rects: Float32Array;
  /** the id of the widget nearest the middle of the screen ("project-prism"…), "" for none */
  focus: string;
  /** 0 with a widget centered on screen → 1 halfway between two */
  between: number;
  /** where the last widget ends (px; −∞ for none): the figure leaves with it */
  last: number;
}

let widgetEls: HTMLElement[] = [];
/** read the [data-slide] widgets (cached until they leave the document) */
export function readWidgets(H: number, out: Widgets): Widgets {
  out.n = 0; out.focus = ""; out.between = 1; out.last = -Infinity;
  if (typeof document === "undefined") return out;
  if (!widgetEls.length || !widgetEls[0].isConnected) widgetEls = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
  let best = Infinity;
  for (const el of widgetEls) {
    const r = el.getBoundingClientRect();
    out.last = Math.max(out.last, r.bottom);
    if (r.bottom < 0 || r.top > H || r.height < 2) continue;
    if (out.n * 4 < out.rects.length) out.rects.set([r.left, r.top, r.right, r.bottom], out.n++ * 4);
    const d = Math.abs(r.top + r.height / 2 - H / 2);
    if (d < best) { best = d; out.focus = el.id; out.between = clamp01(d / (r.height / 2 + 12)); }
  }
  return out;
}
export const makeWidgets = (): Widgets => ({ n: 0, rects: new Float32Array(32 * 4), focus: "", between: 1, last: -Infinity });

/** a project page asks for its own project's graph */
export function pageKey(): string {
  if (typeof window === "undefined") return "";
  const m = window.location.pathname.match(/^\/projects\/([^/]+)/);
  return m ? `project-${m[1]}` : "";
}

// ── the figure ───────────────────────────────────────────────────────────────

/** stateful: the graph shown, the one it's becoming, and the assembly */
export function createSoftwareFigure() {
  let to: Graph = MODEL;
  let from: Graph = MODEL;
  let fromPos: V3[] = MODEL.nodes.map((n) => n.p);
  let morph = 1;
  let build = 0;
  let small = false;
  let keyNow = "\u0000";
  const pos: V3[] = Array.from({ length: 24 }, () => [0, 0, 0] as V3);
  const heat = new Float32Array(24);

  // a node's place in its own graph right now (the drum turns its layer)
  const place = (n: Node, phase: number, out: V3) => {
    out[0] = n.p[0];
    if (!n.ring) { out[1] = n.p[1]; out[2] = n.p[2]; return out; }
    const [rr, a, zf] = n.ring, b = a + n.drum * phase;
    out[1] = Math.cos(b) * rr; out[2] = Math.sin(b) * rr * zf;
    return out;
  };
  const tmp: V3 = [0, 0, 0];

  return function buildFigure(f: FigureInput, segs: Float32Array, segsB: Float32Array, n0: number): number {
    const still = f.dt <= 0;
    // assembly: from nothing, nodes first, then the wiring draws out of them
    build = f.w < 0.03 ? 0 : still ? 1 : Math.min(1, build + f.dt * 0.6);
    if (f.w < 0.002 || f.r < 2) return n0;

    // small places fold the graph down (with a little hysteresis)
    small = f.compact || (small ? f.r < 128 : f.r < 112);
    const key = `${small ? "s" : ""}${f.key}`;
    if (key !== keyNow) {
      // re-wire: start from wherever the nodes are now
      const shown = morph < 0.5 ? from : to;
      fromPos = shown.nodes.map((_, i) => [...pos[i]] as V3);
      from = shown;
      to = graphFor(f.key, small);
      morph = keyNow === "\u0000" || build < 0.05 ? 1 : 0;
      keyNow = key;
    }
    morph = still ? 1 : Math.min(1, morph + f.dt * 1.1);
    const e = morph * morph * (3 - 2 * morph);
    const tilt = f.tilt + from.tilt + (to.tilt - from.tilt) * e;

    // positions: node i of the old graph becomes node i of the new; extras
    // split off a neighbor or merge into one (and fade)
    const nF = from.nodes.length, nT = to.nodes.length, nM = Math.max(nF, nT);
    for (let i = 0; i < nM; i++) {
      const A = fromPos[i < nF ? i : i % nF];
      const B = place(to.nodes[i < nT ? i : i % nT], f.phase, tmp);
      pos[i][0] = A[0] + (B[0] - A[0]) * e;
      pos[i][1] = A[1] + (B[1] - A[1]) * e;
      pos[i][2] = A[2] + (B[2] - A[2]) * e;
    }

    // ── project ────────────────────────────────────────────────────────
    const cy = Math.cos(f.yaw), sy = Math.sin(f.yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    let px = 0, py = 0, pz = 0;
    const P = (q: V3) => {
      const x1 = cy * q[0] + sy * q[2], z1 = -sy * q[0] + cy * q[2];
      const y2 = ct * q[1] - st * z1, z2 = st * q[1] + ct * z1;
      const s = 2.6 / (2.6 + z2);
      px = f.x + x1 * f.r * s; py = f.y - y2 * f.r * s; pz = z2;
    };
    const fog = (z: number) => clamp01((z + 1) * 0.5);
    // behind a widget the strokes sink (a soft 28 px edge), so the text reads over them
    const qv = f.quiet;
    const quiet = (x: number, y: number) => {
      if (!qv) return 1;
      let inside = 0;
      for (let i = 0; i < qv.n; i++) {
        const r = qv.rects;
        const d = Math.min(x - r[i * 4], r[i * 4 + 2] - x, y - r[i * 4 + 1], r[i * 4 + 3] - y);
        if (d > -28) inside = Math.max(inside, clamp01((d + 28) / 56));
      }
      return 1 - 0.7 * inside;
    };

    // ── packets: waves through the graph, a step at a time ────────────────
    // each edge's packet rides it from source to target in its step's slot of
    // the wave; two waves are in flight, half a cycle apart
    const clock = f.phase * 3.5;
    const packetOn = (g: Graph, k: number, step: number) => {
      const T = g.steps + 1.5;
      const at = clock - step - hash(k * 3.7 + step) * 0.25;
      const pt = ((at % T) + T) % T;
      if (pt <= 1) return pt;
      const pt2 = (((at + T / 2) % T) + T) % T;
      return pt2 <= 1 ? pt2 : -1;
    };
    heat.fill(0);
    for (let k = 0; k < to.edges.length; k++) {
      const [, b, step] = to.edges[k];
      const pt = packetOn(to, k, step);
      if (pt > 0.7) heat[b] = Math.max(heat[b], Math.exp(-(((pt - 1) / 0.2) ** 2)));
    }
    // sources light as a wave leaves them
    for (let k = 0; k < to.edges.length; k++) {
      const [a, , step] = to.edges[k];
      if (step !== 0) continue;
      const pt = packetOn(to, k, 0);
      if (pt >= 0 && pt < 0.3) heat[a] = Math.max(heat[a], 1 - pt / 0.3);
    }

    let n = n0;
    // a node is ~2 rows tall; larger figures get larger nodes (3 rows in an opener)
    const nodeHH = Math.min(30, Math.max(13, f.r * 0.085));
    const maxRank = to.nodes.reduce((m, nd) => Math.max(m, nd.rank), 1);

    // ── nodes first: they're the figure (and the budget's first claim) ──
    for (let i = 0; i < nM && n < ROOM_SEGS; i++) {
      const inF = i < nF, inT = i < nT;
      const vis = (inF && inT ? 1 : inT ? e : 1 - e);
      const rank = inT ? to.nodes[i].rank : from.nodes[i].rank;
      const g = clamp01((build - (rank / maxRank) * 0.45) / 0.25);
      if (vis * g < 0.02) continue;
      P(pos[i]);
      const far = fog(pz), h = inT ? heat[i] * e : 0;
      const sz = nodeHH * (0.4 + 0.6 * g) * (1 + 0.12 * h);
      segs.set([px, py, sz * 0.38, sz], n * 4);
      const w = f.w * vis * g * (1 - 0.45 * far) * (0.92 + 0.7 * h) * quiet(px, py);
      segsB.set([Math.min(0.499, f.pal * (1 - 0.55 * far) + 0.1 * h), w, w, -1], n * 4);
      n++;
    }

    // ── edges: the new graph's, then the old one's fading out ─────────────
    const edge = (g: Graph, k: number, weight: number, packets: boolean) => {
      if (n >= ROOM_SEGS || weight < 0.02) return;
      const [a, b, step] = g.edges[k];
      // drawn out of its source once the nodes are up, in wave order
      const gr = clamp01((build - 0.25 - (step / g.steps) * 0.5) / 0.3);
      if (gr <= 0.001) return;
      const ge = gr * gr * (3 - 2 * gr);
      const A = pos[a], B = pos[b];
      // stop short of the diamonds, so a node reads as a node
      P(A); const ax = px, ay = py, az = pz;
      tmp[0] = A[0] + (B[0] - A[0]) * ge; tmp[1] = A[1] + (B[1] - A[1]) * ge; tmp[2] = A[2] + (B[2] - A[2]) * ge;
      P(tmp); let bx = px, by = py; const bz = pz;
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
      const gapPx = nodeHH * 0.55;
      if (L < gapPx * 2.2) return;
      const ux = dx / L, uy = dy / L;
      const sx = ax + ux * gapPx, sy2 = ay + uy * gapPx;
      if (ge > 0.98) { bx -= ux * gapPx; by -= uy * gapPx; }
      const fa = fog(az), fb = fog(bz);
      const w = f.w * 0.48 * weight;
      // an edge crossing a card sinks along its whole length, not just at its ends
      const qm = quiet((sx + bx) / 2, (sy2 + by) / 2), qa = Math.min(quiet(sx, sy2), qm), qb = Math.min(quiet(bx, by), qm);
      const pt = packets && ge > 0.98 ? packetOn(g, k, step) : -1;
      segs.set([sx, sy2, bx, by], n * 4);
      segsB.set([f.pal * 0.78 * (1 - 0.5 * (fa + fb) * 0.5), w * (1 - 0.5 * fa) * qa, w * (1 - 0.5 * fb) * qb, pt >= 0 ? 1 + pt : 0], n * 4);
      n++;
    };
    for (let k = 0; k < to.edges.length; k++) edge(to, k, from === to ? 1 : e, true);
    if (from !== to) for (let k = 0; k < from.edges.length; k++) edge(from, k, 1 - e, false);
    return n;
  };
}
