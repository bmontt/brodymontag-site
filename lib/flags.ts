// ── flags ─────────────────────────────────────────────────────────────────────
// Feature flags for the newer layers of the site, so each can be turned off on
// its own (A/B, rollback, debugging) without a revert.
//
// Two kinds, by where they take effect:
//   build   — change server-rendered markup (openers, the title morph, the
//             next-section handoff, the now lines). Set per deploy with
//             NEXT_PUBLIC_FLAGS — read at build time on server and client
//             alike, so the markup can never mismatch on hydration.
//   runtime — only touch the stage after it mounts (the laser room, dragging
//             the knot, shader transitions, 3D titles). Also overridable live
//             with ?ff=… (remembered in localStorage until ?ff=reset).
//
// Spec syntax (both places): comma-separated names; "-name" turns one off,
// "name" turns one on, e.g. NEXT_PUBLIC_FLAGS="-morph" or ?ff=-room,titles.

export const FLAGS = {
  // build (markup)
  openers: true, // section pages open on a full screen
  morph: true, // the picked word morphs into the page title (view transitions)
  next: true, // each section page hands off to the next
  now: true, // live "now" lines on the landing and openers
  // runtime (stage)
  room: true, // the 3D laser room: perspective beams, floor and ceiling, parallax
  drag: true, // grab and spin the knot
  wipe: true, // shader page transitions: a glyph wave from the click
  titles: true, // 3D laser titles the camera passes through in the openers
} as const;

export type Flag = keyof typeof FLAGS;
const RUNTIME: readonly Flag[] = ["room", "drag", "wipe", "titles"];
const STORE = "brodymontag.flags";

function apply(spec: string, into: Record<Flag, boolean>) {
  for (const raw of spec.split(",")) {
    const t = raw.trim();
    if (!t) continue;
    const off = t.startsWith("-");
    const name = (off ? t.slice(1) : t) as Flag;
    if (name in FLAGS) into[name] = !off;
  }
  return into;
}

const build = apply(process.env.NEXT_PUBLIC_FLAGS ?? "", { ...FLAGS });

let runtime: Record<Flag, boolean> | null = null;

/** Runtime flags — client only (after mount): build flags + localStorage + ?ff= */
function resolveRuntime(): Record<Flag, boolean> {
  if (runtime) return runtime;
  const r = { ...build };
  if (typeof window === "undefined") return r;
  let stored = "";
  try {
    stored = window.localStorage.getItem(STORE) ?? "";
  } catch {
    /* storage blocked: URL-only */
  }
  const url = new URLSearchParams(window.location.search).get("ff");
  if (url === "reset") {
    stored = "";
    try {
      window.localStorage.removeItem(STORE);
    } catch {}
  } else if (url) {
    stored = [stored, url].filter(Boolean).join(",");
    try {
      window.localStorage.setItem(STORE, stored);
    } catch {}
  }
  // only runtime flags may change after the build
  const over = apply(stored, { ...r });
  for (const f of RUNTIME) r[f] = over[f];
  runtime = r;
  (window as unknown as { __flags?: unknown }).__flags = r;
  return r;
}

/** Is a flag on? Build flags anywhere; runtime flags only in the browser. */
export function flag(name: Flag): boolean {
  return RUNTIME.includes(name) ? resolveRuntime()[name] : build[name];
}
