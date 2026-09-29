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
  // the field you know — held flat while the hero reads
  { at: { chapter: "hero", t: 0 }, pose: {} },
  { at: { chapter: "hero", t: 0.35 }, pose: {} },
  // leaving the hero: dolly-zoom + tilt reveals the sheet was 3D all along
  { at: { chapter: "code", t: 0 }, pose: { fov: 46, elev: 38, dist: "frame", relief: 1, look: 1 } },
  // the build — drift toward the cool body
  { at: { chapter: "code", t: 0.55 }, pose: { tx: -260, ty: 40, elev: 30, az: -22, dist: 720 } },
  // rise across the gap between the bodies
  { at: { chapter: "music", t: 0 }, pose: { tx: 0, ty: 0, elev: 44, az: 0, dist: 900 } },
  // monty — settle over the warm body
  { at: { chapter: "music", t: 0.55 }, pose: { tx: 260, ty: -20, elev: 32, az: 24, dist: 760 } },
  // the timeline — pull back to an overview while the eras assemble
  { at: { chapter: "timeline", t: 0 }, pose: { tx: 0, ty: 0, elev: 56, az: 0, dist: 1150, look: 0.5 } },
  { at: { chapter: "timeline", t: 1 }, pose: { elev: 48, dist: 1000 } },
  // epilogue — inspiral → merger → ringdown ("technology in service of sound")
  { at: { chapter: "epilogue", t: 0.05 }, pose: { elev: 42, dist: 900, look: 1 } },
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

