// ── figures ───────────────────────────────────────────────────────────────────
// One animated schematic per project: server-rendered SVG whose timeline is
// CSS (each figure's file says what it shows and where its numbers come
// from). A figure plays while it is on screen (block-motion.tsx sets
// data-play) and otherwise rests on its finished frame, which is also what
// reduced motion and no-JS readers see. A schematic, not data: the caption
// says so, and every label on it names a real part of the project.

import type { ComponentType } from "react";
import AgentForgeFigure from "./agent-forge";
import KickerFigure from "./kicker";
import PeakFindingFigure from "./peak-finding";
import PrismFigure from "./prism";
import RealmbotFigure from "./realmbot";
import SiteFigure from "./site";
import SupersetFigure from "./superset";
import VentureFigure from "./venture";

const FIGURES: Record<string, ComponentType> = {
  "agent-forge": AgentForgeFigure,
  "brodymontag-com": SiteFigure,
  "here-comes-the-kicker": KickerFigure,
  "peak-finding-toolbox": PeakFindingFigure,
  prism: PrismFigure,
  realmbot: RealmbotFigure,
  superset: SupersetFigure,
  venture: VentureFigure,
};

export const hasFigure = (name: string) => name in FIGURES;

export default function FigureBlock({ name, alt, caption }: { name: string; alt: string; caption?: string }) {
  const Fig = FIGURES[name];
  if (!Fig) throw new Error(`figure "${name}": not registered in components/blocks/figures`);
  return (
    <figure data-motion="" className={`dblock fig fig-${name} my-6`}>
      {/* on a phone the drawing keeps a readable width and the frame scrolls
          sideways (detail.css); BlockMotion makes a frame that scrolls focusable */}
      <div role="img" aria-label={alt} className="block-frame fig-frame">
        <div className="fig-inner">
          <Fig />
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 font-mono text-xs text-foreground/60">
          {caption}
          <span className="fig-swipe"> · swipe the figure to see all of it</span>
        </figcaption>
      )}
    </figure>
  );
}
