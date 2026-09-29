"use client";

// ── stage-root ────────────────────────────────────────────────────────────────
// Capability gate for the background stage. The 2D vessel always renders first
// (instant, SSR-safe, and the reduced-motion / low-end path). When the device
// qualifies for the 3D tier, the stage chunk loads lazily and crossfades in on
// its first real frame; the vessel then unmounts so its rAF loop stops. A lost
// WebGL context drops straight back to the vessel — never a blank background.
//
// Tier decision (first match wins):
//   ?tier=2d|3d override → reduced motion → Save-Data → low memory/cores →
//   no WebGL2 (or only with a major performance caveat) → otherwise 3D.
// The chosen tier is mirrored to <html data-stage-tier> for tests/CSS.

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Vessel from "@/components/vessel";

const StageCanvas = dynamic(() => import("@/components/stage/stage-canvas"), { ssr: false });

type Tier = "2d" | "3d";

const MASK = "radial-gradient(ellipse 85% 75% at 50% 40%, black 35%, transparent 88%)";
const CROSSFADE_MS = 800;
const CELL = { w: 8, h: 22 };

function detectTier(): Tier {
  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "2d" || forced === "3d") return forced;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "2d";
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return "2d";
  if ((nav.deviceMemory ?? 8) < 4 || (navigator.hardwareConcurrency ?? 8) < 4) return "2d";
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!gl) return "2d";
    gl.getExtension("WEBGL_lose_context")?.loseContext(); // free the probe context
  } catch {
    return "2d";
  }
  return "3d";
}

export default function StageRoot() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [stageReady, setStageReady] = useState(false);
  const [vesselGone, setVesselGone] = useState(false);

  useEffect(() => setTier(detectTier()), []);

  useEffect(() => {
    document.documentElement.dataset.stageTier = tier ?? "pending";
  }, [tier]);

  // after the stage's first frame, let the crossfade finish, then drop the vessel
  useEffect(() => {
    if (!stageReady) return;
    const t = setTimeout(() => setVesselGone(true), CROSSFADE_MS + 100);
    return () => clearTimeout(t);
  }, [stageReady]);

  const onFirstFrame = useCallback(() => setStageReady(true), []);
  const onLost = useCallback(() => {
    setTier("2d");
    setStageReady(false);
    setVesselGone(false);
  }, []);

  return (
    <>
      {!vesselGone && (
        <div style={{ opacity: stageReady ? 0 : 1, transition: `opacity ${CROSSFADE_MS}ms ease` }}>
          <Vessel />
        </div>
      )}
      {tier === "3d" && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-10"
          style={{
            opacity: stageReady ? 1 : 0,
            transition: `opacity ${CROSSFADE_MS}ms ease`,
            maskImage: MASK,
            WebkitMaskImage: MASK,
          }}
        >
          <StageCanvas cell={CELL} mode="journey" onFirstFrame={onFirstFrame} onLost={onLost} />
        </div>
      )}
    </>
  );
}
