// ── director / stations ───────────────────────────────────────────────────────
// Authored camera tracks. HOME anchors to chapter ids (lib/chapters.ts) so the
// camera follows the real layout through resizes; LAB anchors to raw progress.
// Phase 3 choreography is provisional — Phase 4 scenes (prologue fly-through,
// lattice, room, worldline, merger) refine these.

import { smoother, type Station } from "./rig";

const TAU = Math.PI * 2;
const accel = (t: number) => t * t; // inspiral speeds up into the merger

/** The real journey: hero → code → music → timeline → epilogue. */
export const HOME_TRACK: Station[] = [
  // prologue (the hero is pinned for the fly-through): the field you know…
  { at: { chapter: "hero", t: 0 }, pose: {} },
  { at: { chapter: "hero", t: 0.12 }, pose: {} },
  // …dolly-zoom + tilt reveals the sheet was 3D all along…
  { at: { chapter: "hero", t: 0.5 }, pose: { fov: 46, elev: 34, dist: "frame", relief: 1, look: 0.6 } },
  // …then dive between the bodies with a full roll (angular's shield move)
  { at: { chapter: "hero", t: 0.86 }, pose: { elev: 20, dist: 430, roll: TAU } },
  // the build — settle over the cool side, then truck along the monoliths
  { at: { chapter: "code", t: 0.15 }, pose: { tx: -260, ty: 40, elev: 30, az: -22, dist: 760, look: 1 } },
  { at: { chapter: "code", t: 0.85 }, pose: { tx: -330, ty: 560, elev: 28, dist: 700 } },
  // rise across the gap between the bodies
  { at: { chapter: "music", t: 0.05 }, pose: { tx: 0, ty: 200, elev: 42, az: 0, dist: 900 } },
  // monty — the warm side: through the gallery, under the meteor shower
  { at: { chapter: "music", t: 0.2 }, pose: { tx: 260, ty: -20, elev: 32, az: 24, dist: 760 } },
  { at: { chapter: "music", t: 0.85 }, pose: { tx: 330, ty: 470, elev: 30, dist: 700 } },
  // the worldline — low along the year gates (the stage locks x to the DOM track)
  { at: { chapter: "timeline", t: 0 }, pose: { tx: -1000, ty: 0, elev: 14, az: 0, dist: 560, look: 0.4 } },
  { at: { chapter: "timeline", t: 1 }, pose: { tx: 1500 } },
  // epilogue — back to center: inspiral → merger → ringdown
  { at: { chapter: "epilogue", t: 0.05 }, pose: { tx: 0, ty: 0, elev: 42, dist: 900, look: 1 } },
  { at: { chapter: "epilogue", t: 0.55 }, pose: { elev: 36, dist: 760, merge: 1 }, ease: accel },
  { at: { chapter: "epilogue", t: 0.85 }, pose: { elev: 40, dist: 820, ring: 1 } },
];

/** /lab/3d showcase run (Phase 1 stations, now expressed as a track). */
export const LAB_TRACK: Station[] = [
  { at: { g: 0 }, pose: {} },
  { at: { g: 0.1 }, pose: {} },
  { at: { g: 0.45 }, pose: { fov: 48, elev: 32, dist: "frame", relief: 1, look: 1 } },
  { at: { g: 0.78 }, pose: { elev: 22, dist: 380, roll: TAU } },
  // double-eased so the edge-on crossing of the sheet is brief
  { at: { g: 1 }, pose: { elev: -26, dist: 820 }, ease: smoother },
];

