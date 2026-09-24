// ── journey-root ──────────────────────────────────────────────────────────────
// "use client" shell that mounts the three client singletons (Vessel, TimelineNav,
// JourneyController) and passes server-rendered chapter children through untouched.
// Uses the Next 16 client-shell-with-server-children slot pattern: children arrive
// as React.ReactNode from the server; this component never serialises them.

"use client";

import Vessel from "@/components/vessel";
import TimelineNav from "@/components/journey/timeline-nav";
import JourneyController from "@/components/journey/journey-controller";

interface JourneyRootProps {
  children: React.ReactNode;
}

export default function JourneyRoot({ children }: JourneyRootProps) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* fixed canvas layer — z-10 after vessel.tsx task-6 edit */}
      <Vessel />
      {/* fixed right-edge timeline nav — z-50 */}
      <TimelineNav />
      {/* mounts all ScrollTriggers — renders null */}
      <JourneyController />
      {/* server-rendered chapters flow here */}
      {children}
    </div>
  );
}
