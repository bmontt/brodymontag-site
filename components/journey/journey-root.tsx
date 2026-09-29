// ── journey-root ──────────────────────────────────────────────────────────────
// "use client" shell that mounts the three client singletons (StageRoot,
// TimelineNav, JourneyController) and passes server-rendered chapter children
// through untouched. Uses the Next 16 client-shell-with-server-children slot
// pattern: children arrive as React.ReactNode from the server; this component
// never serialises them.
//
// ?debug counts React commits in window.__journeyCommits (dev builds only —
// <Profiler> is a no-op in production) so tests can assert that scrolling
// never re-renders the tree.

"use client";

import { Profiler, useEffect } from "react";
import StageRoot from "@/components/stage/stage-root";
import TimelineNav from "@/components/journey/timeline-nav";
import JourneyController from "@/components/journey/journey-controller";

interface JourneyRootProps {
  children: React.ReactNode;
}

let countCommits = false;
function onCommit() {
  if (!countCommits) return;
  const w = window as unknown as { __journeyCommits?: number };
  w.__journeyCommits = (w.__journeyCommits ?? 0) + 1;
}

export default function JourneyRoot({ children }: JourneyRootProps) {
  useEffect(() => {
    countCommits = /[?&]debug\b/.test(window.location.search);
  }, []);

  return (
    <Profiler id="journey" onRender={onCommit}>
      <div className="relative min-h-screen bg-background">
        {/* fixed background stage (2D vessel or 3D) — z-10 */}
        <StageRoot />
        {/* fixed right-edge timeline nav — z-50 */}
        <TimelineNav />
        {/* mounts all ScrollTriggers — renders null */}
        <JourneyController />
        {/* server-rendered chapters flow here */}
        {children}
      </div>
    </Profiler>
  );
}
