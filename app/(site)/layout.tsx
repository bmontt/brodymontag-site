// ── (site) layout ─────────────────────────────────────────────────────────────
// Hosts the persistent background stage for the journey and the detail pages,
// so the canvas survives navigation (click-to-fly lands the camera beside an
// object, then the route changes underneath it). The route group adds no URL
// segment; /lab stays outside it and brings its own stage.

import StageRoot from "@/components/stage/stage-root";
import SmoothScroll from "@/components/smooth-scroll";
import ShimmerClock from "@/components/shimmer-clock";

// The pages are prerendered, and "next up", the gigs list and the now lines
// depend on today's date (lib/timeline.ts isFuture): re-render hourly so a
// show moves from upcoming to played without a redeploy.
export const revalidate = 3600;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <ShimmerClock />
      <StageRoot />
      {children}
    </>
  );
}
