// ── (site) layout ─────────────────────────────────────────────────────────────
// Hosts the persistent background stage for the journey and the detail pages,
// so the canvas survives navigation (click-to-fly lands the camera beside an
// object, then the route changes underneath it). The route group adds no URL
// segment; /lab stays outside it and brings its own stage.

import StageRoot from "@/components/stage/stage-root";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StageRoot />
      {children}
    </>
  );
}
