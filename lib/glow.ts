// ── glow ──────────────────────────────────────────────────────────────────────
// Platform glow colors follow the site's two scales: tech platforms glow on
// the white-grey scale (an "r, g, b" triple), sound platforms glow
// "iridescent" — the site's shimmer, a pastel whose hue circles. The
// iridescent value reads --iri-h, so an ancestor needs the `iri-cycle` class
// (globals.css) to animate it.

export const IRIDESCENT = "iridescent";

export function glow(rgb: string, alpha: number): string {
  return rgb === IRIDESCENT ? `oklch(0.82 0.085 var(--iri-h) / ${alpha})` : `rgba(${rgb}, ${alpha})`;
}
