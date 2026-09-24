"use client";

// ── lab-3d ────────────────────────────────────────────────────────────────────
// Phase 1 spike shell (/lab/3d). Mirrors the production wiring on purpose:
// one ScrollTrigger is the single writer to journey-store, and the stage reads
// the store per frame. The 3D chunk is client-only (next/dynamic, ssr:false)
// and loads after first paint.
//
// Query params: ?cell=8x22 (default) | 7x14 | 6x12 — the cell-size legibility test.

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { journey } from "@/lib/journey-store";
import type { Cell, StageStats } from "@/components/stage/stage-canvas";

gsap.registerPlugin(ScrollTrigger);

const StageCanvas = dynamic(() => import("@/components/stage/stage-canvas"), { ssr: false });

const STATIONS = [
  { at: 0, label: "A · flat — the field you know" },
  { at: 0.1, label: "B · dolly-zoom + tilt — it was 3D all along" },
  { at: 0.45, label: "C · dive between the bodies, 360° roll" },
  { at: 0.78, label: "D · punch through, swing under" },
];

function parseCell(): Cell {
  const m = /cell=(\d+)x(\d+)/.exec(window.location.search);
  return m ? { w: +m[1], h: +m[2] } : { w: 8, h: 22 };
}

export default function Lab3D() {
  const [cell, setCell] = useState<Cell | null>(null);
  const [ready, setReady] = useState(false);
  const hud = useRef<HTMLPreElement>(null);

  useEffect(() => setCell(parseCell()), []);

  useGSAP(() => {
    const st = ScrollTrigger.create({
      trigger: "#lab-track",
      start: "top top",
      end: "bottom bottom",
      onUpdate(self) {
        journey.report(0, self.getVelocity(), self.progress);
      },
    });
    return () => st.kill();
  });

  const onStats = (s: StageStats) => {
    if (!hud.current || !cell) return;
    const p = journey.state.globalProgress;
    hud.current.textContent =
      `fps ${s.fps}  calls ${s.calls}  tris ${s.tris}\n` +
      `cell ${cell.w}×${cell.h}  progress ${p.toFixed(3)}`;
  };

  return (
    <div className="relative bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 0.8s ease",
          // same vignette as the 2D vessel
          maskImage: "radial-gradient(ellipse 85% 75% at 50% 40%, black 35%, transparent 88%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 40%, black 35%, transparent 88%)",
        }}
      >
        {cell && <StageCanvas cell={cell} onStats={onStats} onReady={() => setReady(true)} />}
      </div>

      <pre
        ref={hud}
        className="fixed left-4 top-4 z-50 font-mono text-[0.65rem] leading-relaxed text-foreground/60"
      />
      <nav className="fixed right-4 top-4 z-50 flex gap-3 font-mono text-[0.65rem] text-foreground/45">
        {["8x22", "7x14", "6x12"].map((c) => (
          <a key={c} href={`?cell=${c}`} className="hover:text-foreground/90">
            {c}
          </a>
        ))}
      </nav>

      <main id="lab-track" className="relative z-20" style={{ height: "700dvh" }}>
        {STATIONS.map((s) => (
          <p
            key={s.label}
            className="absolute left-6 font-mono text-xs text-iridescent-dim md:left-12"
            style={{ top: `calc(${s.at} * (700dvh - 100dvh) + 40dvh)` }}
          >
            {`// ${s.label}`}
          </p>
        ))}
        <h1
          className="sticky top-[38dvh] mx-auto max-w-5xl px-6 font-sans font-light text-foreground md:px-12"
          style={{ fontSize: "clamp(2.6rem, 7vw, 6.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
        >
          brody montag.
        </h1>
      </main>
    </div>
  );
}
