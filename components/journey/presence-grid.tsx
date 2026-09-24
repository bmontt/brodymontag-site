// ── presence-grid ─────────────────────────────────────────────────────────────
// Client wrapper for the platform cards. `platforms` resolves each icon to a
// react-icons *component*, which cannot be serialised across the server→client
// boundary — so the grid must live in a client module that imports the data
// directly (icon refs stay client-side). Lifted from the old page Presence grid.
"use client";

import PlatformCard from "@/components/platform-card";
import { platforms } from "@/lib/platform-data";

export default function PresenceGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {platforms.map((p) => (
        <PlatformCard
          key={p.id}
          name={p.name}
          handle={p.handle}
          href={p.href}
          icon={p.icon}
          glowRgb={p.glowRgb}
          stat={p.stat}
          details={p.details}
        />
      ))}
    </div>
  );
}
