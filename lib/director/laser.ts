// ── director / laser ──────────────────────────────────────────────────────────
// Drives the laser layer (lib/ascii-engine/gl/laser-shader.ts) as one
// continuous piece across the whole scroll — a story told by two signals:
//
//   TECH  — the white-grey-black scale (code, systems, structure)
//   SOUND — the iridescent shimmer, dark → luminous → white-hot (music, heat,
//           release) — the same pearlescent sweep as the site's pills
//
//   hero      apart     two faint traces share the rule under the name — a grey
//                       one and a dim shimmering one, out of phase, barely alive. They
//                       quicken as you read, then twist into the knot on the dive.
//   code      clarity   TECH builds structure: a white Lissajous knot, shaded by
//                       depth, held in the gutter beside the projects. SOUND
//                       persists as a low shimmering murmur along the floor.
//   music     heat      SOUND takes the room: shimmering club fans, kicking on
//                       a 124 bpm pulse (the glitch hits on the kick). TECH is a
//                       thin grey line on the floor.
//   timeline  memory    a dim grey floor runs with the year track; one white and
//                       one shimmering rail converge on the vanishing point as the
//                       years pass. Tape-worn glitch.
//   epilogue  union     beside the about text the two signals orbit as rings,
//                       white and shimmer, spiralling in as you read — they merge
//                       white-hot, ring down as a fading shimmer, and resolve
//                       into one calm trace at the end. No glitch left.
//
// Figures sit inside layout anchors (lib/laser-anchors.ts) when they exist —
// the text wraps around them — and fall back to free positions on phones.
// Everything is a function of scroll plus a slow clock, so it never freezes.

import type { LaserUniforms } from "@/lib/ascii-engine/gl/laser-shader";
import type { AnchorRect } from "@/lib/laser-anchors";
import { chapterWeight } from "./weights";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** palette coordinates on the two scales (t: 0 dark → 1 brightest) */
export const TECH = (t: number) => clamp01(t) * 0.499;
export const SOUND = (t: number) => 0.5 + clamp01(t) * 0.499;

export interface LaserInput {
  g: number;
  ids: readonly string[];
  bounds: readonly number[];
  timelineProgress: number; // -1 when the year track isn't pinned
  merge: number; // fallback merger drive (the camera track) when no anchor
  ring: number;
  velocity: number; // px/s
  time: number; // s
  delta: number; // s
  viewW: number;
  viewH: number;
  anchor: (id: string) => AnchorRect | null;
  /** hovered entry ("project:<id>" / "show:<id>"), if any */
  hover?: string | null;
  /** click-to-fly in progress: what was clicked and how far along (0–1) */
  fly?: { kind: "project" | "show"; t: number } | null;
}

export interface LaserOutput {
  glitch: number; // 0–1
  burst: number; // 0–1 white flash at the merger
  brightness: number;
  hot: number; // white-hot core amount
}

// per-chapter mood: [brightness, white-hot, base glitch]
const MOOD: Record<string, [number, number, number]> = {
  hero: [0.72, 0.05, 0.015],
  code: [1.0, 0.18, 0.02],
  music: [1.05, 0.22, 0.05],
  timeline: [0.82, 0.08, 0.06],
  epilogue: [0.95, 0.2, 0.015],
};

interface ScopeReq {
  w: number; // first trace weight
  wb: number; // second trace weight
  base: number;
  amp: number;
  cyc: number;
  harm: number;
  a: number; // palette coordinate, first trace
  b: number; // palette coordinate, second trace
  ratio: number; // second trace frequency ratio
}

/** stateful only for accumulated phases (so speed changes never jump) */
export function createLaserDirector() {
  let orbitPhase = 0;
  let lissSpin = 0;
  let lastMerge = 0;
  let fuseAt = -1e9; // when the two signals last fused (the flash is a moment, not a place)
  const out: LaserOutput = { glitch: 0, burst: 0, brightness: 1, hot: 0.2 };

  return function update(u: LaserUniforms, x: LaserInput): LaserOutput {
    const { g, ids, bounds, time, viewW: W, viewH: H } = x;
    const M = Math.min(W, H);
    const w = (id: string, lead = 0.35, tail = 0.35) => chapterWeight(id, g, ids, bounds, lead, tail);
    const local = (id: string) => {
      const i = ids.indexOf(id);
      if (i < 0 || bounds.length !== ids.length) return 0;
      const s = bounds[i];
      const e = i + 1 < bounds.length ? bounds[i + 1] : 1;
      return clamp01((g - s) / Math.max(e - s, 1e-4));
    };
    const hi = ids.indexOf("hero");
    const heroEnd = hi >= 0 && hi + 1 < bounds.length ? bounds[hi + 1] : 0.1;

    const wh = 1 - smooth(heroEnd - 0.02, heroEnd + 0.06, g); // on stage from the very top
    const wc = w("code", 0.5, 0.4);
    const wm = w("music", 0.45, 0.35);
    const wt = w("timeline", 0.15, 0.08);
    const we = w("epilogue", 0.45, 0);
    const lh = local("hero"), lc = local("code"), lm = local("music");
    const beat = Math.pow(1 - ((time * 124) / 60) % 1, 3); // 124 bpm kick, decaying
    // interaction: hovering an entry stirs its signal; clicking one sends it
    // through the figure (a burst while the page changes)
    const hoverTech = x.hover?.startsWith("project:") ? 1 : 0;
    const hoverSound = x.hover?.startsWith("show:") ? 1 : 0;
    const flyT = x.fly ? smooth(0, 1, x.fly.t) : 0;
    const flyTech = x.fly?.kind === "project" ? flyT : 0;
    const flySound = x.fly?.kind === "show" ? flyT : 0;

    // ── epilogue: union (computed first — the end trace shares the scope) ──
    const ua = x.anchor("union");
    let merge: number, ring: number, ucx: number, ucy: number, ur: number;
    if (ua) {
      const cy = ua.y + ua.h / 2;
      // spiral in while the about text crosses the screen, merge as it reaches
      // the upper third, ring down as you read on past it
      const read = clamp01((H * 0.95 - cy) / (H * 0.7));
      merge = smooth(0.05, 0.92, read);
      ring = clamp01((H * 0.25 - cy) / H);
      ucx = ua.x + ua.w / 2;
      ucy = lerp(Math.max(cy, H * 0.25), H * 0.45, smooth(0, 0.5, ring));
      ur = Math.min(ua.w, ua.h) / 2;
    } else {
      merge = clamp01(x.merge);
      ring = clamp01(x.ring);
      ucx = W * 0.5;
      ucy = H * 0.5;
      ur = M * 0.22;
    }
    orbitPhase += x.delta * (0.6 + 7 * merge * merge);
    const fused = smooth(0.88, 1, merge);
    u.uOrbit.value.set(
      we * (1 - fused * smooth(0, 0.12, ring)),
      lerp(ur * 0.56, 0, Math.pow(merge, 1.3)), // stays inside the circle the text wraps
      orbitPhase,
      ur * lerp(0.36, 0.5, merge),
    );
    u.uOrbitB.value.set(ucx, ucy, TECH(0.95), SOUND(lerp(0.62, 0.9, merge)));
    // ringdown: white-hot → a fading shimmer as it spreads
    u.uRingL.value.set(we * smooth(0, 0.05, ring) * (1 - ring), ring * Math.hypot(W, H) * 0.75, SOUND(lerp(0.98, 0.3, ring)), 0);
    const resolve = we * smooth(0.55, 1, ring); // the one calm trace at the very end

    // ── scope: hero traces · the other signal's floor murmur · the resolution ──
    const ha = x.anchor("hero");
    const fold = smooth(0.5, 0.88, lh);
    const heroBase = ha ? ha.y + ha.h / 2 : H * 0.74;
    const life = smooth(0, 0.45, lh); // the traces quicken as you read
    const breathe = 0.75 + 0.25 * Math.sin(time * 0.8);
    const heroW = wh * (1 - fold);
    const reqs: ScopeReq[] = [
      // hero: grey + a dim shimmer, apart, out of phase
      { w: heroW, wb: heroW * 0.85, base: heroBase, amp: H * lerp(0.006, 0.05, life) * breathe, cyc: lerp(1.5, 4, lh),
        harm: life, a: TECH(lerp(0.45, 0.7, life)), b: SOUND(lerp(0.35, 0.55, life)), ratio: 1.5 },
      // code: SOUND murmurs low along the floor
      { w: 0, wb: 0.35 * wc, base: H * 0.93, amp: H * 0.012, cyc: 6, harm: 0.4, a: 0, b: SOUND(0.3), ratio: 1 },
      // music: TECH is a thin grey line on the floor
      { w: 0.3 * wm, wb: 0, base: H * 0.95, amp: H * 0.006, cyc: 9, harm: 0.2, a: TECH(0.35), b: 0, ratio: 1 },
      // the end: one signal, white-hot shimmer, slow and calm
      { w: resolve, wb: 0, base: H * 0.62, amp: H * 0.03, cyc: 1.2, harm: 0, a: SOUND(0.97), b: 0, ratio: 1 },
    ];
    const sc = reqs.reduce((best, r) => (Math.max(r.w, r.wb) > Math.max(best.w, best.wb) ? r : best));
    u.uScope.value.set(sc.w, sc.amp, sc.cyc, time * 0.9 + g * 30);
    u.uScopeB.value.set(sc.base, sc.a, sc.harm, sc.b);
    u.uScopeC.value.set(sc.wb, Math.PI, sc.ratio, 0.8);

    // ── code: the white knot in its gutter ──────────────────────────────
    const ca = x.anchor("code");
    lissSpin += x.delta * (0.3 + 0.9 * hoverTech + 4 * flyTech + Math.min(Math.abs(x.velocity) / 2500, 1.5));
    const knotW = Math.max(wc * (ca ? 1 : 0.6), wh * fold);
    // born at the center from the hero traces, then carried into its gutter
    const born = { r: M * 0.3 * Math.max(fold, 0.2), x: W * 0.5, y: H * 0.5 };
    const held = ca
      ? (() => {
          const r = Math.min(ca.w * 0.42, H * 0.28);
          // sticky inside its column: centered on screen while the column spans it
          return { r, x: ca.x + ca.w / 2, y: Math.min(Math.max(H * 0.5, ca.y + r * 1.15), ca.y + ca.h - r * 1.15) };
        })()
      : { r: M * 0.3, x: W * 0.72, y: H * 0.5 };
    const toGutter = smooth(0, 1, wc / Math.max(wc + wh * fold, 1e-4));
    const kr = lerp(born.r, held.r, toGutter) * (1 + 2.6 * flyTech * flyTech);
    const kx = lerp(born.x, held.x, toGutter);
    const ky = lerp(born.y, held.y, toGutter);
    u.uLiss.value.set(knotW * 0.95 * (1 - 0.8 * flyTech), 3, 2, time * 0.22 + g * 9);
    u.uLissB.value.set(lissSpin, kr, TECH(lerp(0.75, 0.98, smooth(0, 0.3, lc))), 0.35 + 0.25 * Math.sin(time * 0.2));
    u.uLissC.value.set(kx, ky);

    // ── music: shimmering fans from the gutter's floor ──────────────────
    const ma = x.anchor("music");
    const fx = ma ? ma.x + ma.w / 2 : W * 0.5;
    const fy = ma ? Math.min(Math.max(ma.y + ma.h, H * 0.55), H * 1.04) : H * 1.04;
    const drive = 0.38 + 0.3 * hoverSound + 0.6 * flySound;
    u.uFan.value.set(
      Math.min(1.2, wm * (0.62 + drive * beat) + flySound),
      ma ? 6 : 7,
      (ma ? lerp(0.6, 0.9, lm) : lerp(0.9, 1.35, lm)) * (1 + 1.2 * flySound),
      0.36 * Math.sin(time * (0.55 + 0.6 * hoverSound) + lm * 7),
    );
    u.uFanB.value.set(fx, fy, SOUND(lerp(0.55, 0.75, lm) + 0.15 * beat), H * 1.3);
    u.uFanC.value.set(0.42, 0, 0, 0); // beams span the sound scale, edge to edge

    // ── timeline: grey floor, a white and a shimmering rail converging ──
    const tp = x.timelineProgress >= 0 ? x.timelineProgress : local("timeline");
    const vx = W * (0.5 + 0.18 * (0.5 - tp));
    u.uGridL.value.set(wt * 0.7, H * 0.56, tp * 14 + time * 0.12, TECH(0.32));
    u.uGridB.value.set(vx, W * 0.085, 1.1, 0);
    u.uRails.value.set(wt, W * 0.34 * (1 - 0.88 * smooth(0, 1, tp)), TECH(0.95), SOUND(0.8));

    // ── mood: brightness, white-hot core, glitch ────────────────────────
    const ws: [string, number][] = [["hero", wh], ["code", wc], ["music", wm], ["timeline", wt], ["epilogue", we]];
    let sw = 0, br = 0, hot = 0, gb = 0;
    for (const [id, wi] of ws) {
      const [b0, h0, g0] = MOOD[id];
      sw += wi; br += b0 * wi; hot += h0 * wi; gb += g0 * wi;
    }
    sw = Math.max(sw, 1e-4);
    out.brightness = br / sw;
    out.hot = hot / sw + 0.5 * fused * (1 - ring) + 0.25 * beat * wm + 0.25 * hoverTech * wc + 0.6 * flyT;
    const speed = Math.min(Math.abs(x.velocity) / 3000, 1);
    let edge = 0;
    for (let i = 1; i < bounds.length; i++) edge = Math.max(edge, Math.exp(-(((g - bounds[i]) / 0.007) ** 2)));
    const burstG = hash(Math.floor(time * 4)) > 0.975 ? 0.45 : 0;
    const kick = wm * Math.pow(beat, 6) * 0.35;
    out.glitch = clamp01((gb / sw + 0.45 * speed + 0.5 * edge + burstG + kick + 0.8 * flyT) * (1 - 0.95 * resolve));
    if (merge >= 0.97 && lastMerge < 0.97) fuseAt = time;
    lastMerge = merge;
    out.burst = we * 0.5 * Math.exp(-Math.max(0, time - fuseAt) * 3.5);
    u.uJitter.value.set(Math.sin(time * 37) * 0.35 + (hash(time * 60) - 0.5) * 6 * out.glitch, Math.cos(time * 23) * 0.25);
    u.uLaserTime.value = time;
    return out;
  };
}
