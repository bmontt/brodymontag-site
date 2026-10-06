/**
 * Journey store — the single channel between GSAP's scroll measurements and
 * the vessel canvas.
 *
 * GSAP ScrollTriggers mutate this module-level object on scroll; the canvas
 * rAF loop reads it directly. React never re-renders per scroll frame — the
 * only React consumers (e.g. the timeline nav's active tick) subscribe via
 * `useSyncExternalStore` and are notified solely on *discrete* chapter
 * changes.
 */

export interface ChapterBlend {
  /** chapter index the blend departs from */
  from: number;
  /** chapter index the blend arrives at */
  to: number;
  /** 0 → fully `from`, 1 → fully `to` */
  t: number;
}

export type StageRouteKind = "home" | "project" | "show";

interface JourneyState {
  /** 0–1 progress through the whole #journey scroll range */
  globalProgress: number;
  /** index of the chapter currently considered active */
  chapterIndex: number;
  /** 0–1 progress through the active chapter's own scroll range */
  chapterProgress: number;
  /** cross-chapter skin/field blend inside a boundary band */
  blend: ChapterBlend;
  /** scroll velocity in px/s (signed; negative = scrolling up) */
  velocity: number;
  /**
   * 0–1 progress through the horizontal timeline section's pinned scroll, or
   * -1 when not inside it. Drives both the year-track translation and the
   * vessel's era evolution within that section.
   */
  timelineProgress: number;
  /** set once by the controller's reduced-motion matchMedia branch */
  reducedMotion: boolean;
  /**
   * Normalized scroll-start of each chapter over the #journey range (same
   * order as lib/chapters.ts). Measured by the controller on every refresh;
   * the 3D director resolves chapter-anchored camera stations against it.
   */
  bounds: number[];
  /** Interaction + routing context for the persistent 3D stage. Never notifies. */
  focus: {
    /** which page the stage is serving: home runs the journey, details park the camera */
    route: { kind: StageRouteKind; index: number };
    /** data-stage-id of the hovered/focused entry ("project:<id>", "show:<id>") */
    hover: string | null;
    /** click-to-fly in flight: destination + start time (performance.now) */
    fly: { kind: Exclude<StageRouteKind, "home">; index: number; start: number } | null;
  };
  /** 3D stage scene parameters — lab overrides; the home director derives its own */
  stage: {
    /** lab A/B: true = the 2D vessel's per-cell hue cycle instead of the gradient light */
    flatLight: boolean;
    /** inspiral 0→1 (orbit decays, frequency chirps) */
    merge: number;
    /** ringdown 0→1 after the merger */
    ring: number;
  };
}

const state: JourneyState = {
  globalProgress: 0,
  chapterIndex: 0,
  chapterProgress: 0,
  blend: { from: 0, to: 0, t: 0 },
  velocity: 0,
  timelineProgress: -1,
  reducedMotion: false,
  bounds: [],
  focus: { route: { kind: "home", index: -1 }, hover: null, fly: null },
  stage: { flatLight: false, merge: 0, ring: 0 },
};

const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export const journey = {
  /** Direct read access for the canvas rAF loop — cheap, no copies. */
  state,

  /** Per-frame scroll report from a chapter's ScrollTrigger. No notify. */
  report(chapterProgress: number, velocity: number, globalProgress?: number) {
    state.chapterProgress = chapterProgress;
    state.velocity = velocity;
    if (globalProgress !== undefined) state.globalProgress = globalProgress;
  },

  /** Per-frame blend update inside a chapter boundary band. No notify. */
  setBlend(from: number, to: number, t: number) {
    state.blend.from = from;
    state.blend.to = to;
    state.blend.t = t;
  },

  /** Per-frame horizontal-timeline progress (-1 when outside). No notify. */
  setTimelineProgress(p: number) {
    state.timelineProgress = p;
  },

  /** Discrete chapter change — the only mutation that notifies React. */
  setChapter(i: number) {
    if (state.chapterIndex === i) return;
    state.chapterIndex = i;
    notify();
  },

  setReducedMotion(v: boolean) {
    state.reducedMotion = v;
  },

  /** Chapter start offsets, re-measured on every ScrollTrigger refresh. No notify. */
  setBounds(b: number[]) {
    state.bounds = b;
  },

  setRoute(kind: StageRouteKind, index = -1) {
    state.focus.route = { kind, index };
    if (kind === "home") state.focus.fly = null;
  },

  setHover(id: string | null) {
    state.focus.hover = id;
  },

  setFly(kind: Exclude<StageRouteKind, "home">, index: number) {
    state.focus.fly = { kind, index, start: performance.now() };
  },

  /** Per-frame 3D stage parameters. No notify. */
  setStage(merge: number, ring: number) {
    state.stage.merge = merge;
    state.stage.ring = ring;
  },

  // ── useSyncExternalStore contract ──────────────────────────────────
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): number {
    return state.chapterIndex;
  },
  getServerSnapshot(): number {
    return 0;
  },
};
