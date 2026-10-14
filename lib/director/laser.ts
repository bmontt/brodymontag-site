// ── director / laser ──────────────────────────────────────────────────────────
// Drives the laser layer (lib/ascii-engine/gl/laser-shader.ts) — the site's
// background is a story told by two signals:
//
//   TECH  — the white-grey-black scale (software: systems, structure, clarity)
//   SOUND — the pearlescent shimmer, dark → luminous → white-hot (music: rooms,
//           heat, release) — the same sweep as the site's pills
//
// Each page has its own composition, in the same language:
//
//   home      the split  the rule under the name carries both signals — white
//                        on the left half, pearl on the right — flattening to
//                        meet in the middle. Each choice has its figure asleep
//                        behind it (the knot behind software, fans rising
//                        under music, two rings flanking "about me"); hovering
//                        a choice wakes it, picking one bursts it.
//   software  clarity    a white trace under the heading; a white knot held in
//                        the gutter beside the projects, shaded by depth,
//                        tilting as you read down. Clean — almost no glitch.
//   music     heat       a pearl trace pulsing on a 124 bpm kick under the
//                        heading; shimmering fans rising in the gutter, and the
//                        glitch hits on the kick.
//   about     union      the two signals orbit as rings inside the circle the
//                        about text wraps, spiral in as you read, fuse white-hot
//                        (a one-shot flash), ring down over a couple of seconds,
//                        and lie down as one calm trace — the horizon of the timeline
//                        floor, where a white and a pearl rail converge.
//   detail    an echo    a project page keeps a faint knot, a show page faint fans.
//
// Every figure parameter is damped toward its page's target, so moving between
// pages morphs the background (the knot behind "software" glides into the
// software page's gutter) instead of cutting it. Figures sit in layout anchors
// (lib/laser-anchors.ts) — the text wraps around them — with free fallbacks on
// phones. Everything is a function of scroll, anchors and a slow clock.

import type { LaserUniforms } from "@/lib/ascii-engine/gl/laser-shader";
import type { AnchorRect } from "@/lib/laser-anchors";
import type { StageRouteKind } from "@/lib/journey-store";
import { buildRoom } from "./room";
import { drag, knot, pointer, stepDrag } from "@/lib/stage-input";
import { flag } from "@/lib/flags";
import { ROOM_SEGS } from "@/lib/ascii-engine/gl/laser-shader";

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

/** the exit beat: how long a picked figure bursts before the page changes */
export const TRANSITION_MS = 280;

/** palette coordinates on the two scales (t: 0 dark → 1 brightest) */
export const TECH = (t: number) => clamp01(t) * 0.499;
export const SOUND = (t: number) => 0.5 + clamp01(t) * 0.499;

export interface LaserInput {
  page: StageRouteKind;
  /** scroll progress through the page, 0–1 */
  p: number;
  timelineProgress: number; // -1 when the year track isn't pinned
  velocity: number; // px/s
  time: number; // s
  delta: number; // s (0 = reduced motion: no glide, a still frame)
  viewW: number;
  viewH: number;
  anchor: (id: string) => AnchorRect | null;
  /** hovered entry ("nav:software", "project:<id>", "show:<id>"), if any */
  hover?: string | null;
  /** a page transition in flight: where to, how far along (0–1), where it was clicked */
  fly?: { kind: StageRouteKind; t: number; origin?: { x: number; y: number } } | null;
  /** cursor, −1…1 (room parallax, title tilt) */
  pointer?: { x: number; y: number };
  /** the knot, grabbed and spun (radians added to its own spin/tilt) */
  drag?: { spin: number; tilt: number };
  /** runtime feature flags (lib/flags.ts) */
  features?: { room: boolean; wipe: boolean; titles: boolean };
}

export interface LaserOutput {
  /** where the knot is on screen (for grabbing it) */
  knot: { x: number; y: number; r: number; w: number };
  /** whether a 3D title is showing (the caller supplies its mask) */
  title: boolean;
  glitch: number; // 0–1
  burst: number; // 0–1 white flash at the merger
  brightness: number;
  hot: number; // white-hot core amount
}

/** every figure parameter the pages compose — damped as a whole */
interface Frame {
  // scope: up to two traces on one baseline; split ≥ 0 puts A left of it, B right
  sW: number; sWB: number; sBase: number; sAmp: number; sCyc: number; sHarm: number; sA: number; sB: number; sSplit: number;
  // knot
  kW: number; kX: number; kY: number; kR: number; kPal: number; kTilt: number;
  // fans
  fW: number; fX: number; fY: number; fSpread: number; fLen: number; fPal: number; fCount: number;
  // orbit + ring
  oW: number; oX: number; oY: number; oSep: number; oR: number; oA: number; oB: number;
  rW: number; rR: number; rPal: number;
  // floor
  gW: number; gRails: number; gGap: number;
  // mood
  bright: number; hot: number; glitch: number;
}

const ZERO: Frame = {
  sW: 0, sWB: 0, sBase: 0, sAmp: 0, sCyc: 3, sHarm: 0, sA: 0, sB: 0.5, sSplit: -1,
  kW: 0, kX: 0, kY: 0, kR: 1, kPal: 0.45, kTilt: 0.35,
  fW: 0, fX: 0, fY: 0, fSpread: 0.8, fLen: 1, fPal: 0.8, fCount: 6,
  oW: 0, oX: 0, oY: 0, oSep: 0, oR: 1, oA: 0.47, oB: 0.8,
  rW: 0, rR: 0, rPal: 0.9,
  gW: 0, gRails: 0, gGap: 0,
  bright: 1, hot: 0.15, glitch: 0.02,
};
const KEYS = Object.keys(ZERO) as (keyof Frame)[];
// weights and moods ease; geometry follows anchors closely (but glides on arrival)
const SLOW = new Set<keyof Frame>(["sW", "sWB", "kW", "fW", "oW", "rW", "gW", "gRails", "bright", "hot", "glitch"]);
const WEIGHT_OF: Partial<Record<keyof Frame, keyof Frame>> = {};
for (const k of KEYS) if (!SLOW.has(k)) WEIGHT_OF[k] = k[0] === "k" ? "kW" : k[0] === "f" ? "fW" : k[0] === "o" ? "oW" : undefined;

/** stateful: damped figure state + accumulated phases (speed changes never jump) */
export function createLaserDirector() {
  let cur: Frame | null = null;
  const tgt: Frame = { ...ZERO };
  let orbitPhase = 0;
  let lissSpin = 0;
  let lastMerge = 0;
  let fuseAt = -1e9;
  let page: StageRouteKind | null = null;
  let pageAt = 0;
  const out: LaserOutput = { knot: { x: 0, y: 0, r: 0, w: 0 }, title: false, glitch: 0, burst: 0, brightness: 1, hot: 0.2 };
  const segs = new Float32Array(ROOM_SEGS * 4);
  const segsB = new Float32Array(ROOM_SEGS * 4);

  return function update(u: LaserUniforms, x: LaserInput): LaserOutput {
    const { time, viewW: W, viewH: H, p } = x;
    const M = Math.min(W, H);
    if (x.page !== page) {
      page = x.page;
      pageAt = time;
      lastMerge = 0; // a fresh visit to about plays the fusion again
    }
    const still = x.delta <= 0; // reduced motion: still frames, fully formed
    const since = still ? 10 : time - pageAt;
    const arrive = Math.exp(-since * 3.5); // a little glitch as a page lands
    const beat = Math.pow(1 - ((time * 124) / 60) % 1, 3); // 124 bpm kick, decaying
    const breathe = 0.75 + 0.25 * Math.sin(time * 0.8);
    const hov = (k: string) => (x.hover === k ? 1 : 0);
    const flyT = x.fly ? smooth(0, 1, x.fly.t) : 0;
    const flyTo = (...k: StageRouteKind[]) => (x.fly && k.includes(x.fly.kind) ? flyT : 0);
    const flyKnot = flyTo("software", "project");
    const flyFan = flyTo("music", "show");
    const flyOrbit = flyTo("about");
    const flyHome = flyTo("home");

    Object.assign(tgt, ZERO);
    let merge = 0, ring = 0, resolve = 0;
    // section openers: the figure starts large in the opening screen, then is
    // carried into its gutter as the opener scrolls away
    const op = x.anchor("opener");
    const inOpener = op ? 1 - smooth(H * 0.3, H * 0.95, -op.y) : 0;
    const opCy = op ? op.y + op.h * 0.5 : H * 0.5;
    // the next section's word, near the bottom: its figure starts to appear
    const nextVis = (id: string) => {
      const r = x.anchor(id);
      return r ? { r, v: smooth(H * 1.05, H * 0.45, r.y) } : null;
    };

    // ── compositions ───────────────────────────────────────────────────
    if (x.page === "home") {
      const life = smooth(0.6, 2.6, since);
      const hS = hov("nav:software"), hM = hov("nav:music"), hA = hov("nav:about");
      const rule = x.anchor("rule");
      Object.assign(tgt, {
        sW: 1, sWB: 1, sBase: rule ? rule.y + rule.h / 2 : H * 0.45, sSplit: rule ? rule.x + rule.w / 2 : W / 2,
        sAmp: H * 0.02 * life * breathe * (1 + 0.8 * Math.max(hS, hM)), sCyc: 4, sHarm: 0.5,
        sA: TECH(0.55 + 0.35 * hS), sB: SOUND(0.5 + 0.35 * hM),
        bright: 0.92, hot: 0.12 + 0.3 * flyT, glitch: 0.012,
      });
      const os = x.anchor("opt-software");
      if (os) Object.assign(tgt, { kW: 0.2 + 0.8 * hS, kX: os.x + os.w / 2, kY: os.y + os.h * 0.36, kR: Math.max(os.h * 0.8, 70), kPal: TECH(0.8 + 0.15 * hS) });
      const om = x.anchor("opt-music");
      if (om) Object.assign(tgt, { fW: 0.2 + 0.8 * hM, fX: om.x + om.w / 2, fY: om.y + om.h + H * 0.14, fSpread: 0.75, fLen: H * 0.55, fCount: 5, fPal: SOUND(0.62) });
      const oa = x.anchor("opt-about");
      if (oa) {
        const ur = oa.h * 0.55;
        Object.assign(tgt, { oW: 0.25 + 0.75 * hA, oX: oa.x + oa.w / 2, oY: oa.y + oa.h * 0.36, oSep: Math.max(oa.w * 0.62, ur * 2) * (1 - 0.35 * hA), oR: ur * 0.55, oA: TECH(0.9), oB: SOUND(0.75) });
      }
    } else if (x.page === "software" || x.page === "project") {
      const detail = x.page === "project";
      const rule = detail ? null : x.anchor("code-rule");
      if (rule) Object.assign(tgt, { sW: 1, sBase: rule.y + rule.h / 2, sAmp: H * 0.014, sCyc: 6, sHarm: 0.7, sA: TECH(0.75) });
      const ca = detail ? null : x.anchor("code");
      if (ca) {
        const r = Math.min(ca.w * 0.42, H * 0.28);
        // sticky inside its gutter: centered on screen while the gutter spans it
        Object.assign(tgt, { kW: 1, kX: ca.x + ca.w / 2, kY: Math.min(Math.max(H * 0.5, ca.y + r * 1.15), ca.y + ca.h - r * 1.15), kR: r });
      } else {
        Object.assign(tgt, { kW: detail ? 0.4 : 0.6, kX: W * 0.8, kY: H * 0.45, kR: M * (detail ? 0.22 : 0.3) });
      }
      if (inOpener > 0) {
        // the opener: a big knot to the right of the title
        tgt.kW = 1;
        tgt.kX = lerp(tgt.kX, W * 0.72, inOpener);
        tgt.kY = lerp(tgt.kY, opCy, inOpener);
        tgt.kR = lerp(tgt.kR, Math.min(M * 0.36, W * 0.22), inOpener);
      }
      const nx = nextVis("next-music");
      if (nx && nx.v > 0) Object.assign(tgt, { fW: 0.7 * nx.v, fX: nx.r.x + nx.r.w * 0.3, fY: nx.r.y + nx.r.h + H * 0.12, fSpread: 0.8, fLen: H * 0.6, fCount: 5, fPal: SOUND(0.62) });
      const hoverProject = x.hover?.startsWith("project:") ? 1 : 0;
      Object.assign(tgt, { kPal: TECH(0.95), kTilt: 0.35 + 0.6 * p, bright: detail ? 0.9 : 1, hot: 0.18 + 0.25 * hoverProject, glitch: 0.015 });
    } else if (x.page === "music" || x.page === "show") {
      const detail = x.page === "show";
      const rule = detail ? null : x.anchor("music-rule");
      if (rule) Object.assign(tgt, { sWB: 1, sBase: rule.y + rule.h / 2, sAmp: H * (0.008 + 0.022 * beat), sCyc: 5, sHarm: 0.5, sB: SOUND(0.7) });
      const ma = detail ? null : x.anchor("music");
      const hoverShow = x.hover?.startsWith("show:") ? 1 : 0;
      Object.assign(tgt, {
        fW: (detail ? 0.4 : 1) * (0.62 + (0.38 + 0.3 * hoverShow) * beat),
        fX: ma ? ma.x + ma.w / 2 : W * (detail ? 0.8 : 0.5),
        fY: ma ? Math.min(Math.max(ma.y + ma.h, H * 0.55), H * 1.04) : H * 1.04,
        fSpread: ma ? lerp(0.6, 0.9, p) : 0.75, fLen: H * 1.3, fCount: 6,
        fPal: SOUND(lerp(0.55, 0.75, p) + 0.15 * beat),
        bright: 1.05, hot: 0.22 + 0.25 * beat, glitch: 0.04 + (detail ? 0 : 0.3 * Math.pow(beat, 6)),
      });
      if (inOpener > 0) {
        // the opener: a wide fan rising behind the title from the floor
        tgt.fX = lerp(tgt.fX, W * 0.7, inOpener);
        tgt.fY = lerp(tgt.fY, op!.y + op!.h * 1.02, inOpener);
        tgt.fSpread = lerp(tgt.fSpread, 1.15, inOpener);
        tgt.fCount = inOpener > 0.5 ? 7 : 6;
      }
      const nx = nextVis("next-epilogue");
      if (nx && nx.v > 0) {
        const ur = nx.r.h * 0.5;
        Object.assign(tgt, { oW: 0.7 * nx.v, oX: nx.r.x + nx.r.w * 0.45, oY: nx.r.y + nx.r.h * 0.4, oSep: Math.max(nx.r.w * 0.5, ur * 2), oR: ur * 0.5, oA: TECH(0.9), oB: SOUND(0.75) });
      }
    } else if (x.page === "about") {
      const ua = x.anchor("union");
      let ucx = W * 0.5, ucy = H * 0.5, ur = M * 0.22;
      if (ua) {
        const cy = ua.y + ua.h / 2;
        // spiral in while the about text crosses the screen, merge as it
        // reaches the upper third, ring down as you read on past it
        const read = clamp01((H * 0.95 - cy) / (H * 0.7));
        merge = smooth(0.05, 0.92, read);
        ucx = ua.x + ua.w / 2;
        ucy = Math.max(cy, H * 0.25); // rides the text, then holds near the top
        ur = Math.min(ua.w, ua.h) / 2;
      }
      // the ringdown is an event, not a place: once the signals fuse it spreads
      // on its own clock (scrolling back up before the fusion resets it)
      if (merge >= 0.97 && lastMerge < 0.97) fuseAt = time;
      lastMerge = merge;
      ring = merge >= 0.97 ? (still ? 1 : clamp01((time - fuseAt) / 2.4)) : 0;
      if (inOpener > 0) {
        // the opener: the two rings orbit wide to the right of the title
        ucx = lerp(ucx, W * 0.72, inOpener);
        ucy = lerp(ucy, opCy, inOpener);
        ur = lerp(ur, M * 0.3, inOpener);
      }
      const fused = smooth(0.88, 1, merge);
      const floor = x.timelineProgress >= 0 ? 1 : 0;
      resolve = smooth(0.55, 1, ring) * (1 - floor);
      Object.assign(tgt, {
        oW: 1 - fused * smooth(0, 0.12, ring), oX: ucx, oY: ucy,
        oSep: lerp(ur * 0.56, 0, Math.pow(merge, 1.3)), oR: ur * lerp(0.36, 0.5, merge),
        oA: TECH(0.95), oB: SOUND(lerp(0.62, 0.9, merge)),
        rW: smooth(0, 0.05, ring) * (1 - ring) * (1 - floor), rR: ring * Math.hypot(W, H) * 0.75, rPal: SOUND(lerp(0.98, 0.3, ring)),
        // the one calm trace — the timeline floor's horizon when it arrives
        sW: Math.max(resolve, 0.6 * floor), sBase: H * 0.56, sAmp: H * 0.02 * (1 - floor), sCyc: 1.2, sA: SOUND(0.97),
        gW: floor * 0.7, gRails: floor, gGap: W * 0.34 * (1 - 0.88 * smooth(0, 1, Math.max(x.timelineProgress, 0))),
        bright: lerp(0.95, 0.82, floor), hot: lerp(0.2, 0.08, floor) + 0.5 * fused * (1 - ring),
        glitch: lerp(0.015, 0.05, floor) * (1 - 0.95 * resolve),
      });
    }

    // ── transitions: the figure you picked bursts on the way out ───────
    tgt.kR *= 1 + 2.6 * flyKnot * flyKnot;
    tgt.kW *= 1 - 0.75 * flyKnot;
    tgt.fW = Math.min(1.2, tgt.fW + flyFan);
    tgt.fSpread *= 1 + 1.2 * flyFan;
    tgt.oW = Math.min(1.2, tgt.oW + flyOrbit);
    tgt.oSep *= 1 - 0.8 * flyOrbit;
    tgt.sAmp *= 1 + 2 * flyHome;

    // ── damp toward the page's targets ─────────────────────────────────
    const dt = Math.min(x.delta, 0.1);
    if (!cur || dt <= 0) cur = { ...tgt }; // first frame / reduced motion: no glide
    else {
      const glide = since < 1.1 ? 4 : 14; // arrive slowly, then track anchors closely
      for (const k of KEYS) {
        const wk = WEIGHT_OF[k];
        // a figure that was invisible takes its place instead of sliding in
        if (wk && cur[wk] < 0.02) cur[k] = tgt[k];
        else cur[k] += (tgt[k] - cur[k]) * (1 - Math.exp(-(SLOW.has(k) ? 5 : glide) * dt));
      }
    }

    // ── write the uniforms ──────────────────────────────────────────────
    const c = cur;
    u.uScope.value.set(c.sW, c.sAmp, c.sCyc, time * 0.9 + p * 12);
    u.uScopeB.value.set(c.sBase, c.sA, c.sHarm, c.sB);
    u.uScopeC.value.set(c.sWB, Math.PI, 1.5, 0.8);
    u.uScopeD.value.set(tgt.sSplit >= 0 ? c.sSplit : -1, W * 0.14, 0, 0);

    const spinUp = x.hover?.startsWith("project:") || x.hover === "nav:software" ? 1 : 0;
    lissSpin += dt * (0.3 + 0.9 * spinUp + 4 * flyKnot + Math.min(Math.abs(x.velocity) / 2500, 1.5));
    u.uLiss.value.set(c.kW * 0.95, 3, 2, time * 0.22 + p * 6);
    u.uLissB.value.set(lissSpin + (x.drag?.spin ?? 0), c.kR, c.kPal, c.kTilt + 0.2 * Math.sin(time * 0.2) + (x.drag?.tilt ?? 0));
    out.knot.x = c.kX; out.knot.y = c.kY; out.knot.r = c.kR; out.knot.w = c.kW;
    u.uLissC.value.set(c.kX, c.kY);

    u.uFan.value.set(c.fW, Math.round(c.fCount), c.fSpread, 0.36 * Math.sin(time * 0.55 + p * 7));
    u.uFanB.value.set(c.fX, c.fY, c.fPal, c.fLen);
    u.uFanC.value.set(0.42, 0, 0, 0); // beams span the sound scale, edge to edge

    orbitPhase += dt * (0.6 + 7 * merge * merge);
    u.uOrbit.value.set(c.oW, c.oSep, orbitPhase, c.oR);
    u.uOrbitB.value.set(c.oX, c.oY, c.oA, c.oB);
    u.uRingL.value.set(c.rW, c.rR, c.rPal, 0);

    const tp = Math.max(x.timelineProgress, 0);
    u.uGridL.value.set(c.gW, H * 0.56, tp * 14 + time * 0.12, TECH(0.32));
    u.uGridB.value.set(W * (0.5 + 0.18 * (0.5 - tp)), W * 0.085, 1.1, 0);
    u.uRails.value.set(c.gRails, c.gGap, TECH(0.95), SOUND(0.8));

    const feat = x.features ?? { room: false, wipe: false, titles: false };
    const ptr = x.pointer ?? { x: 0, y: 0 };
    const tone = (k: StageRouteKind, t: number) =>
      k === "music" || k === "show" || k === "about" ? SOUND(t) : TECH(t);

    // ── the 3D room: beams converge on the page's figure ───────────────
    const focus =
      c.kW > 0.3 ? { x: c.kX, y: c.kY }
      : c.fW > 0.3 ? { x: c.fX, y: c.fY - H * 0.45 }
      : c.oW > 0.3 ? { x: c.oX, y: c.oY }
      : { x: W / 2, y: H * 0.45 };
    const roomW = !feat.room ? 0
      : (x.page === "home" ? 0.45 : x.page === "project" || x.page === "show" ? 0.25 : 0.4) * (1 - c.gW) * (still ? 0.8 : smooth(0, 0.8, since));
    const nSeg = buildRoom({ page: x.page, W, H, p, time, pointer: ptr, focus, tech: TECH, sound: SOUND, weight: roomW }, segs, segsB);
    for (let i = 0; i < nSeg; i++) {
      u.uSegs.value[i].fromArray(segs, i * 4);
      u.uSegsB.value[i].fromArray(segsB, i * 4);
    }
    u.uSegN.value = nSeg;

    // ── shader transitions: a glyph shockwave out of the click, and another
    //    out of the new page's title as it lands ───────────────────────────
    const maxR = Math.hypot(W, H);
    const op2 = x.anchor("opener");
    if (feat.wipe && !still && x.fly && flyT > 0) {
      const o = x.fly.origin ?? { x: W / 2, y: H / 2 };
      u.uWipe.value.set(o.x, o.y, maxR * 0.75 * smooth(0, 1, flyT), H * 0.08);
      u.uWipeB.value.set(0.9, tone(x.fly.kind, 0.85), 0, 0);
    } else if (feat.wipe && !still && since < 0.95) {
      const a = smooth(0, 0.95, since);
      const o = op2 ? { x: op2.x + Math.min(op2.w * 0.25, 360), y: op2.y + op2.h * 0.45 } : { x: W / 2, y: H * 0.45 };
      u.uWipe.value.set(o.x, o.y, maxR * (0.1 + 0.9 * (1 - (1 - a) * (1 - a))), H * 0.12);
      u.uWipeB.value.set(0.75 * (1 - a), tone(x.page, 0.8), 0, 0);
    } else u.uWipeB.value.x = 0;

    // ── 3D titles: the page's word, huge and faint behind the opener, flying
    //    at the camera as you scroll out of it ─────────────────────────────
    const titled = feat.titles && !!op2 && (x.page === "software" || x.page === "music" || x.page === "about");
    out.title = titled;
    if (titled) {
      const s = 1 - inOpener;
      const fade = still ? 1 : smooth(0.25, 1.2, since);
      u.uTitle.value.set(W * 0.5 + ptr.x * 24, H * 0.44 + ptr.y * 14 - s * H * 0.1, W * (0.92 + 3.6 * Math.pow(s, 1.6)), 0.34 * fade * (1 - smooth(0.5, 0.95, s)));
      u.uTitleB.value.x = tone(x.page, 0.7);
      u.uTitleB.value.z = ptr.x * 0.05 + s * 0.08;
    } else u.uTitle.value.w = 0;

    // ── mood + glitch ───────────────────────────────────────────────────
    const speed = Math.min(Math.abs(x.velocity) / 3000, 1);
    const rare = hash(Math.floor(time * 4)) > 0.975 ? 0.4 : 0;
    out.brightness = c.bright;
    out.hot = c.hot;
    out.glitch = clamp01((c.glitch + 0.45 * speed + 0.45 * arrive + rare + 0.8 * flyT) * (1 - 0.95 * resolve));
    out.burst = x.page === "about" ? 0.5 * Math.exp(-Math.max(0, time - fuseAt) * 3.5) : 0;
    u.uJitter.value.set(Math.sin(time * 37) * 0.35 + (hash(time * 60) - 0.5) * 6 * out.glitch, Math.cos(time * 23) * 0.25);
    u.uLaserTime.value = time;
    return out;
  };
}

/** The director's inputs from the journey store, pointer and flags (shared by the 3D and 2D tiers). */
export function laserInputFrom(
  st: {
    globalProgress: number;
    timelineProgress: number;
    velocity: number;
    focus: {
      route: { kind: StageRouteKind };
      hover: string | null;
      fly: { kind: StageRouteKind; start: number; origin?: { x: number; y: number } } | null;
    };
  },
  now: number,
  delta: number,
  viewW: number,
  viewH: number,
  anchor: (id: string) => AnchorRect | null,
  flyMs: number,
): LaserInput {
  const { route, hover, fly } = st.focus;
  stepDrag(delta);
  return {
    page: route.kind,
    p: st.globalProgress,
    timelineProgress: st.timelineProgress,
    velocity: st.velocity,
    time: now / 1000,
    delta,
    viewW,
    viewH,
    anchor,
    hover,
    fly: fly ? { kind: fly.kind, t: (now - fly.start) / flyMs, origin: fly.origin } : null,
    pointer,
    drag,
    features: { room: flag("room"), wipe: flag("wipe"), titles: flag("titles") },
  };
}

/** After a frame: remember where the knot is, so the mouse can grab it. */
export function noteKnot(o: LaserOutput) {
  Object.assign(knot, o.knot);
}
