// ── director / software space ─────────────────────────────────────────────────
// The software page past its opener: not a figure to look at but a network to
// be inside. Its layers stand one behind another down the view — each a slab
// of nodes (diamonds, ╱╲ over ╲╱) facing you, the near ones wider than the
// screen, the far ones small and sinking into fog — wired layer to layer, the
// wires running off toward the vanishing point with packets travelling them
// into the distance. Scrolling dollies the camera through it (the layers
// stream past, the nearest swelling and slipping off the edges as the next
// comes up out of the fog), and the whole space rolls slowly about the view.
//
// It re-wires as you read, like the figure in the opener did: with each project
// in the middle of the screen the layers take that project's pattern (Prism's
// four stem lanes splitting and merging, venture's funnel through an allocator
// to a gate, a branching decision, the kickball diamond…), the nodes gliding,
// splitting and merging into the next; and it breathes — the layers draw in
// between two projects and open out as the next settles. Behind the cards the
// strokes sink low (quietAt), so the text reads over a calm, deep field.
//
// It keeps its own slow time. Scroll moves the camera only through a heavily
// damped follower with a capped speed: what you scroll is owed to the camera
// and paid out gently, and anything past a few layers' worth is forgiven
// rather than raced through — so a flick or a jump of a few screens glides a
// few layers in a second or so instead of rushing the whole way;
// the roll and the packets run on a calm clock of their own that scrolling
// doesn't touch (only a hover stirs it, eased); a project has to hold the
// middle of the screen for a moment before the space re-wires to it, and the
// breathing is eased too — so a fast scroll never churns it.
//
// Now and then it catches a little of the music's light: on the beat (124
// bpm, the music page's tempo) a wire here and there carries a pearl spark
// along it, a node catches a pearl glint as it turns, and the nodes a re-wire
// brings in bloom pearl as they arrive — the SOUND shimmer, rare, low and
// brief, brighter on the near layers and lost in the fog on the far ones, and
// never under the card you're reading. The space stays white; the glints are
// a second look's worth. (Every stroke, glints included, still steps back with
// the stage's brightness past the opener.)
//
// Built like the room and the road (room.ts, car.ts): world space, a camera,
// projection and near-plane clipping on the CPU each frame, depth fog carried
// in each stroke's end weights, into the shared segment slots (ROOM_SEGS) —
// nearest layers first, so a tight budget trims the far fog, not the view.
// Phones get fewer, sparser layers.

import { ROOM_SEGS } from "@/lib/ascii-engine/gl/laser-shader";
import { quietAt, type Widgets } from "./software-figure";

export interface SpaceInput {
  W: number;
  H: number;
  /** presence 0–1 */
  w: number;
  /** TECH palette coordinate of the brightest stroke */
  pal: number;
  /** scroll progress through the page, 0–1 (the camera follows it, damped) */
  scroll: number;
  /** 0–1: stirred (a hovered project) — the clock runs a little faster, eased */
  stir: number;
  dt: number; // s (0 = reduced motion: no glides)
  time: number;
  /** whose network: a widget id ("project-prism"…), "" for the page's own */
  key: string;
  /** 0 drawn in (between two projects) → 1 open (one settled in the middle) */
  open: number;
  /** the camera: roll added to its own slow roll (a grab), and a little yaw / pitch (radians) */
  roll: number;
  yaw: number;
  pitch: number;
  /** a narrow screen: fewer, sparser layers */
  compact: boolean;
  /** where the widgets are: glints keep out from under the one being read, and
   *  (sink) the strokes sink behind them — wide screens; on phones the cards
   *  span the screen and the stage's own dim does that */
  quiet?: Widgets;
  sink: boolean;
  /** the SOUND palette (laser.ts): the glints' pearl */
  sound: (t: number) => number;
}

type P2 = [number, number];
/** one layer, facing you: its nodes (−1…1 across the layer), wires within it,
 *  and wires on to the next layer back ([node here, node there]) */
interface Slab { nodes: P2[]; within: P2[]; next: P2[] }
/** a pattern of layers, repeating down the view */
type Space = Slab[];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const keyHash = (s: string) => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h;
};

// ── patterns ──────────────────────────────────────────────────────────────────

const ring = (m: number, rot = 0, r = 0.85): P2[] =>
  m === 1 ? [[0, 0]] : Array.from({ length: m }, (_, i) => {
    const a = (i / m) * Math.PI * 2 + rot;
    return [Math.cos(a) * r, Math.sin(a) * r] as P2;
  });
const all = (a: number, b: number): P2[] => Array.from({ length: a * b }, (_, k) => [Math.floor(k / b), k % b] as P2);
const same = (m: number): P2[] => Array.from({ length: m }, (_, i) => [i, i] as P2);
/** each node to its two nearest round the next ring */
const near2 = (a: number, b: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < a; i++) {
    const j = Math.round((i / a) * b) % b;
    out.push([i, j]);
    if (b > 1) out.push([i, (j + 1) % b]);
  }
  return out;
};
const around = (m: number): P2[] => (m < 3 ? [] : Array.from({ length: m }, (_, i) => [i, (i + 1) % m] as P2));

/** layers of a model, each a ring, every node wired to its nearest two behind */
function layers(counts: number[], rot = 0.6): Space {
  return counts.map((m, k) => {
    const nx = counts[(k + 1) % counts.length];
    return { nodes: ring(m, k * rot), within: [], next: m === 1 || nx === 1 ? all(m, nx) : near2(m, nx) };
  });
}

// the page's own: a model, three in, two out
const MODEL = layers([3, 4, 4, 2]);
const PROJECT: Record<string, Space> = {
  // one track → split into four stems, each down its own lane → merged at the mixer
  prism: [
    { nodes: [[0, 0]], within: [], next: all(1, 4) },
    { nodes: ring(4, Math.PI / 4, 0.8), within: [], next: same(4) },
    { nodes: ring(4, Math.PI / 4, 0.8), within: [], next: all(4, 1) },
  ],
  // one way in → the allocator → three strategies → the gate; the review beside the gate
  venture: [
    { nodes: [[0, 0]], within: [], next: [[0, 0]] },
    { nodes: [[0, 0.15]], within: [], next: all(1, 3) },
    { nodes: ring(3, Math.PI / 2, 0.8), within: [], next: all(3, 1) },
    { nodes: [[0, -0.1], [0.85, 0.55]], within: [[0, 1]], next: [[0, 0]] },
  ],
  // tracks → two moods → a set, in order
  superset: [
    { nodes: [[-0.8, 0.6], [-0.3, 0.75], [0.35, 0.7], [0.8, 0.45], [-0.6, -0.2]], within: [], next: [[0, 0], [1, 0], [4, 0], [2, 1], [3, 1]] },
    { nodes: [[-0.45, 0.1], [0.5, -0.05]], within: [], next: [[0, 0], [1, 1]] },
    { nodes: [[-0.6, -0.55], [0, -0.75], [0.6, -0.5]], within: [[0, 1], [1, 2]], next: [[2, 3], [0, 4]] },
  ],
  // a decision, branching
  realmbot: [
    { nodes: [[0, 0]], within: [], next: all(1, 2) },
    { nodes: [[-0.55, 0], [0.55, 0]], within: [], next: [[0, 0], [0, 1], [1, 2], [1, 3]] },
    { nodes: [[-0.85, 0.45], [-0.3, -0.5], [0.3, 0.5], [0.85, -0.45]], within: [], next: all(4, 1) },
  ],
  // the stage, its pages round it
  "brodymontag-com": [
    { nodes: ring(4, 0, 0.85), within: around(4), next: all(4, 1) },
    { nodes: [[0, 0]], within: [], next: all(1, 4) },
  ],
  // the diamond — home, the bases, the mound — one field after another
  "here-comes-the-kicker": [
    { nodes: [[0, -0.8], [0.8, 0], [0, 0.8], [-0.8, 0]], within: around(4), next: [[0, 0]] },
    { nodes: [[0, -0.1]], within: [], next: [[0, 0]] },
  ],
  // shared blocks → one library → two builds → their agents
  "agent-forge": [
    { nodes: ring(4, Math.PI / 4, 0.85), within: [], next: all(4, 1) },
    { nodes: [[0, 0]], within: [], next: all(1, 2) },
    { nodes: [[-0.5, 0.1], [0.5, -0.1]], within: [], next: [[0, 0], [0, 1], [1, 2], [1, 3]] },
    { nodes: ring(4, Math.PI / 4, 0.85), within: [], next: same(4) },
  ],
  // three channels of a signal, waves I–V riding down them
  "peak-finding-toolbox": Array.from({ length: 9 }, (_, k) => {
    const y = [-0.1, 0.35, -0.25, 0.55, -0.3, 0.4, -0.2, 0.75, -0.35][k];
    return { nodes: [[-0.75, y - 0.35], [0, y], [0.75, y - 0.2]] as P2[], within: [], next: same(3) };
  }),
};
const GENERIC: Space[] = [
  layers([2, 3, 3, 2], 0.9),
  [{ nodes: ring(5, 0, 0.85), within: around(5), next: all(5, 1) }, { nodes: [[0, 0]], within: [], next: all(1, 5) }],
  layers([3, 1, 3], 0.4),
  [
    { nodes: [[0, 0]], within: [], next: all(1, 3) },
    { nodes: ring(3, Math.PI / 2, 0.75), within: [], next: same(3) },
  ],
  layers([1, 3, 4], 1.1),
  Array.from({ length: 4 }, (_, k) => ({ nodes: [[-0.7, k % 2 ? 0.4 : -0.4], [0.7, k % 2 ? -0.4 : 0.4]] as P2[], within: [[0, 1]] as P2[], next: same(2) })),
];

function spaceFor(key: string): Space {
  if (!key) return MODEL;
  const slug = key.startsWith("project-") ? key.slice(8) : "";
  if (slug && PROJECT[slug]) return PROJECT[slug];
  return GENERIC[keyHash(key) % GENERIC.length];
}

// ── the space ─────────────────────────────────────────────────────────────────

const SPACING = 2.6; // world units between layers
const DOLLY_PAGE = 50; // world units flown over the whole page (~2 layers a screen)
const DRIFT = 0.12; // world units / s it drifts on its own
const FOLLOW_S = 0.5; // the camera's lag behind scroll (time constant, s)
const FOLLOW_MAX = 6; // …its top speed (world units / s)
const LAG_MAX = 7; // …and the most it can owe (scroll beyond that is forgiven, not raced through)
const SETTLE_S = 0.4; // a project holds the middle this long before the space re-wires to it
const BPM = 124; // the glints keep the music page's time
const GLINT_WIRE = 0.022; // chance a wire sparks, on every other beat
const GLINT_NODE = 0.035; // chance a node catches the light, on the beats between
const DEG = Math.PI / 180;

/** stateful: the pattern shown, the one it's becoming */
export function createSoftwareSpace() {
  let from: Space = MODEL, to: Space = MODEL;
  let morph = 1;
  let keyNow = "\u0000";
  let keyNext = "", keySince = 0; // a key waiting to settle
  let dolly = 0, owed = 0, lastScroll = 0, clock = 0, stir = 0, open = 1, live = false;

  // projected nodes of the layers in view (px, depth, size, weight), by layer and slot
  const MAXN = 6;
  const nx = new Float32Array(10 * MAXN), ny = new Float32Array(10 * MAXN), nz = new Float32Array(10 * MAXN);
  const nhh = new Float32Array(10 * MAXN), nw = new Float32Array(10 * MAXN);
  const wx = new Float32Array(10 * MAXN), wy = new Float32Array(10 * MAXN), wz = new Float32Array(10 * MAXN);
  const np = new Float32Array(10 * MAXN); // the node's layer's presence (wires fade with it)

  return function buildSpace(s: SpaceInput, segs: Float32Array, segsB: Float32Array, n0: number): number {
    const still = s.dt <= 0, dt = Math.min(s.dt, 0.1);
    // ── its own pace ───────────────────────────────────────────────────
    const fresh = !live || still || s.w < 0.03; // first sight, reduced motion, or unseen: no glide
    const scrolled = s.scroll * DOLLY_PAGE;
    if (fresh) { dolly = scrolled; owed = 0; }
    else {
      owed = Math.min(Math.max(owed + scrolled - lastScroll, -LAG_MAX), LAG_MAX);
      const step = Math.min(Math.max(owed * (1 - Math.exp(-dt / FOLLOW_S)), -FOLLOW_MAX * dt), FOLLOW_MAX * dt);
      dolly += step + dt * DRIFT;
      owed -= step;
    }
    lastScroll = scrolled;
    stir += (s.stir - stir) * (1 - Math.exp(-dt / 0.8));
    clock += dt * (0.22 + 0.25 * stir);
    open = fresh ? s.open : open + (s.open - open) * (1 - Math.exp(-dt / 0.7));
    live = s.w >= 0.03;
    // re-wire only to a project that has settled in the middle
    if (s.key !== keyNext) { keyNext = s.key; keySince = s.time; }
    if (keyNext !== keyNow && (fresh || keyNow === "\u0000" || s.time - keySince >= SETTLE_S)) {
      // from whatever is showing now
      from = morph < 0.5 ? from : to;
      to = spaceFor(keyNext);
      morph = keyNow === "\u0000" || fresh ? 1 : 0;
      keyNow = keyNext;
    }
    morph = still ? 1 : Math.min(1, morph + dt * 0.5);
    if (s.w < 0.002) return n0;
    const e = morph * morph * (3 - 2 * morph);

    const { W, H } = s;
    const f = H / 2 / Math.tan(30 * DEG); // 60° vertical fov, like the room
    const slabs = s.compact ? 5 : 8;
    const cap = s.compact ? 3 : MAXN; // nodes per layer
    // a layer spans a little more than the screen at the nearest layer's depth
    const SX = 2.3 * Math.min(Math.max(W / H, 0.55), 1.8) * (0.72 + 0.4 * open + 0.03 * Math.sin(s.time * 0.4));
    const SY = 2.1 * (0.72 + 0.4 * open + 0.03 * Math.sin(s.time * 0.4 + 1));
    const roll = clock * 0.08 + s.roll, pitch = s.pitch + 0.04 * Math.sin(clock * 0.3);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const cy = Math.cos(s.yaw), sy = Math.sin(s.yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    // world → camera: roll the space about the view, then turn and pitch; looking down −z
    let cx = 0, cyy = 0, cz = 0;
    const cam = (x: number, y: number, z: number) => {
      const xr = cr * x - sr * y, yr = sr * x + cr * y;
      const x1 = cy * xr + sy * z, z1 = -sy * xr + cy * z;
      cx = x1; cyy = cp * yr - sp * z1; cz = sp * yr + cp * z1;
    };
    const fog = (z: number) => Math.exp(-Math.max(-z - 3, 0) * 0.075);
    // the nearest layer swells and fades as it slips past; the farthest comes up out of the fog
    const base = Math.floor(dolly / SPACING), frac = dolly / SPACING - base;
    const depthOf = (d: number) => -(SPACING * (d + 1 - frac) + 0.2);
    const presence = (d: number, z: number) => smooth(-0.5, -1.8, z) * (d === slabs - 1 ? frac : 1);

    // the beat, for the glints (none in reduced motion: no time passes there)
    const beat = (s.time * BPM) / 60, bi = Math.floor(beat), bf = beat - bi;
    const glints = !still && s.w > 0.05;
    const rare = s.compact ? 0.7 : 1;
    let n = n0;
    const put = (ax: number, ay: number, bx: number, by: number, pal: number, wa: number, wb: number, pk: number) => {
      if (n >= ROOM_SEGS) return;
      segs.set([ax, ay, bx, by], n * 4);
      segsB.set([pal, wa, wb, pk], n * 4);
      n++;
    };

    // ── place every node of the layers in view ──────────────────────────
    const layerOf = (sp: Space, k: number) => sp[((k % sp.length) + sp.length) % sp.length];
    const count = (k: number) => Math.min(cap, Math.max(layerOf(from, k).nodes.length, layerOf(to, k).nodes.length));
    for (let d = 0; d < slabs; d++) {
      const k = base + d, A = layerOf(from, k), B = layerOf(to, k);
      const nA = Math.min(cap, A.nodes.length), nB = Math.min(cap, B.nodes.length), m = count(k);
      const z = depthOf(d), pres = presence(d, z);
      for (let i = 0; i < m; i++) {
        const a = A.nodes[i < nA ? i : i % nA], b = B.nodes[i < nB ? i : i % nB];
        // each layer a touch different: the pattern snaking off the axis as it
        // goes back (so a lone node swings out beside the cards), its nodes jittered
        const jx = 0.45 * Math.sin(k * 1.27) + (hash(k * 7.3 + i * 1.7) - 0.5) * 0.22;
        const jy = 0.3 * Math.cos(k * 0.83) + (hash(k * 3.1 + i * 5.3) - 0.5) * 0.18;
        // layers widen with depth, so the far ones still reach out beside the
        // cards rather than all converging behind them
        const spread = 0.6 + 0.085 * -z;
        const x = (a[0] + (b[0] - a[0]) * e + jx) * SX * spread, y = (a[1] + (b[1] - a[1]) * e + jy) * SY * spread;
        const slot = d * MAXN + i;
        wx[slot] = x; wy[slot] = y; wz[slot] = z;
        cam(x, y, z);
        nz[slot] = cz;
        np[slot] = pres;
        const vis = (i < nA && i < nB ? 1 : i < nB ? e : 1 - e) * pres;
        nw[slot] = cz < -0.35 ? vis * fog(cz) : 0;
        if (nw[slot] > 0) {
          nx[slot] = W / 2 + (cx / -cz) * f;
          ny[slot] = H / 2 - (cyy / -cz) * f;
          nhh[slot] = Math.min(28, Math.max(6, 66 / -cz));
        }
      }
    }

    // a wire between two placed nodes, clipped to the near plane, short of both diamonds
    const NEAR = -0.4;
    /** pearl ≥ 0: a glint's copy of the wire, in the SOUND palette (pearl = how
     *  luminous, before fog), skipped under the card being read */
    const wire = (sa: number, sb: number, weight: number, packet: number, pearl = -1) => {
      if (n >= ROOM_SEGS || weight < 0.02) return;
      let za = nz[sa], zb = nz[sb];
      if (za > NEAR && zb > NEAR) return;
      // camera-space ends (recomputed: cheap, and keeps the clip exact)
      cam(wx[sa], wy[sa], wz[sa]); let ax = cx, ay = cyy;
      cam(wx[sb], wy[sb], wz[sb]); let bx = cx, by = cyy;
      if (za > NEAR || zb > NEAR) {
        const t = (NEAR - za) / (zb - za);
        const qx = ax + (bx - ax) * t, qy = ay + (by - ay) * t;
        if (za > NEAR) { ax = qx; ay = qy; za = NEAR; } else { bx = qx; by = qy; zb = NEAR; }
      }
      let pax = W / 2 + (ax / -za) * f, pay = H / 2 - (ay / -za) * f;
      let pbx = W / 2 + (bx / -zb) * f, pby = H / 2 - (by / -zb) * f;
      const dx = pbx - pax, dy = pby - pay, L = Math.hypot(dx, dy);
      const ga = nw[sa] > 0 && nz[sa] <= NEAR ? nhh[sa] * 0.6 : 0, gb = nw[sb] > 0 && nz[sb] <= NEAR ? nhh[sb] * 0.6 : 0;
      if (L < ga + gb + 6) return;
      const ux = dx / L, uy = dy / L;
      pax += ux * ga; pay += uy * ga; pbx -= ux * gb; pby -= uy * gb;
      const fa = fog(za), fb = fog(zb);
      const qm = quietAt(s.quiet, (pax + pbx) / 2, (pay + pby) / 2);
      if (pearl >= 0 && qm < 0.85) return;
      const qs = (q: number) => (s.sink ? q : 1);
      const w = s.w * 0.52 * weight * Math.min(np[sa], np[sb]);
      put(pax, pay, pbx, pby, pearl >= 0 ? s.sound(pearl * (0.7 + 0.3 * (fa + fb) * 0.5)) : s.pal * 0.8 * (0.45 + 0.55 * (fa + fb) * 0.5),
        w * fa * qs(Math.min(quietAt(s.quiet, pax, pay), qm)), w * fb * qs(Math.min(quietAt(s.quiet, pbx, pby), qm)), packet >= 0 ? 1 + packet : 0);
    };
    // packets: down the wires into the distance, each on its own beat
    const packetOn = (k: number, i: number, j: number) => {
      const pt = (clock * 0.9 + hash(k * 13.1 + i * 7.7 + j * 3.3) * 1.7) % 1.7;
      return pt <= 1 ? pt : -1;
    };

    // ── nearest first: a layer's nodes, its own wires, then the wires back ──
    for (let d = 0; d < slabs && n < ROOM_SEGS; d++) {
      const k = base + d, m = count(k);
      for (let i = 0; i < m && n < ROOM_SEGS; i++) {
        const slot = d * MAXN + i;
        if (nw[slot] < 0.02 || nz[slot] > NEAR) continue;
        const px = nx[slot], py = ny[slot], hh = nhh[slot];
        if (px < -hh || px > W + hh || py < -hh || py > H + hh) continue;
        const q = quietAt(s.quiet, px, py), fz = fog(nz[slot]);
        const w = s.w * 0.95 * nw[slot] * (s.sink ? q : 1);
        put(px, py, hh * 0.38, hh, Math.min(0.499, s.pal * (0.5 + 0.5 * fz)), w, w, -1);
        if (!glints || q < 0.85) continue;
        // a glint: a pearl halo just outside the node — catching the light on
        // a beat, or blooming as a re-wire brings the node in
        const A = layerOf(from, k), B = layerOf(to, k);
        const arriving = i >= Math.min(cap, A.nodes.length) && i < Math.min(cap, B.nodes.length) ? Math.sin(Math.PI * e) : 0;
        const caught = bi & 1 && hash(k * 13.7 + i * 5.1 + bi * 2.9) < GLINT_NODE * rare ? Math.exp(-bf * 3.5) * (1 - Math.exp(-bf * 25)) : 0;
        const g = Math.max(arriving * 0.8, caught);
        const gw = Math.min(0.6, w * 0.9 * g);
        if (g > 0.04) put(px, py, hh * 0.58, hh * 1.5, s.sound(0.82 + 0.16 * fz), gw, gw, -1);
      }
      // a wire, and now and then (every other beat) a pearl spark running along
      // a copy of it for that beat — a dim body, the spark carrying the light
      const link = (sa: number, sb: number, weight: number, live: boolean, i: number, j: number) => {
        wire(sa, sb, weight, live ? packetOn(k, i, j) : -1);
        if (!live || !glints || bi & 1 || hash(i * 0.731 + j * 2.39 + k * 3.17 + bi * 1.618) >= GLINT_WIRE * rare) return;
        wire(sa, sb, weight * 0.5 * Math.sin(Math.PI * bf), bf, 0.92);
      };
      const edges = (sp: Space, weight: number, live: boolean) => {
        const L = layerOf(sp, k), nm = Math.min(cap, L.nodes.length);
        for (const [i, j] of L.within) if (i < nm && j < nm) link(d * MAXN + i, d * MAXN + j, weight, live, i, j + 9);
        if (d + 1 >= slabs) return;
        const nn = Math.min(cap, layerOf(sp, k + 1).nodes.length);
        for (const [i, j] of L.next) if (i < nm && j < nn) link(d * MAXN + i, (d + 1) * MAXN + j, weight, live, i, j);
      };
      edges(to, from === to ? 1 : e, true);
      if (from !== to) edges(from, 1 - e, false);
    }
    return n;
  };
}
