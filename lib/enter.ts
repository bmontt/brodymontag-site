// ── enter ─────────────────────────────────────────────────────────────────────
// Mount entrances in CSS (globals.css .enter): the same values and easing the
// framer-motion versions ran — framer's default tween is easeInOut, CSS
// ease-in-out — without shipping an animation runtime. Server-safe.
//
//   <div className="enter" style={enterStyle({ y: 10, dur: 0.5, delay: 0.25 })}>
//
// Add "enter-blur" to the class for a blur entrance. Inside [data-gate] they
// hold their start until the gate is opened ([data-ready]).

import type { CSSProperties } from "react";

export function enterStyle(o: { x?: number; y?: number; blur?: number; dur: number; delay?: number; ease?: string }): CSSProperties {
  const s: Record<string, string> = {
    "--ex": `${o.x ?? 0}px`,
    "--ey": `${o.y ?? 0}px`,
    "--ed": `${o.dur}s`,
    "--edl": `${o.delay ?? 0}s`,
  };
  if (o.blur) s["--eb"] = `${o.blur}px`;
  if (o.ease) s["--ee"] = o.ease;
  return s as CSSProperties;
}
