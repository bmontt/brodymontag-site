"use client";

// ── lab-3d ────────────────────────────────────────────────────────────────────
// Dev lab for the 3D stage (/lab/3d). Mirrors the production wiring: one
// ScrollTrigger is the single writer to journey-store, the stage reads the
// store per frame. The 3D chunk is client-only and loads after first paint.
//
// Query params:  ?cell=8x22 (default) | 7x14 | 6x12   cell-size test
//                ?parity   freeze τ=0 on the flat station; window.__parityCheck()
//                          compares the GPU cell levels against bake.ts
// Keys:          1–5 blend to a chapter skin · t era evolution · m merger · r reset

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { journey } from "@/lib/journey-store";
import { chapters } from "@/lib/chapters";
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

type StageHook = { readLevels: () => { cols: number; rows: number; levels: number[] }; ready: () => boolean };

/** Compare the GPU per-cell levels (τ=0) with the 2D bake's frame 0. */
async function parityCheck(cell: Cell) {
  const stage = (window as unknown as { __stage?: StageHook }).__stage;
  if (!stage?.ready()) return { error: "stage not ready" };
  const gpu = stage.readLevels();
  const [{ precompute }, { asciiConfig }] = await Promise.all([
    import("@/lib/ascii-engine/bake"),
    import("@/lib/ascii-config"),
  ]);
  const buf = precompute(asciiConfig, window.innerWidth, window.innerHeight, cell.w, cell.h);
  if (buf.cols !== gpu.cols || buf.rows !== gpu.rows) {
    return { error: `grid mismatch: 2D ${buf.cols}×${buf.rows} vs GPU ${gpu.cols}×${gpu.rows}` };
  }
  const cells = buf.cols * buf.rows;
  let match = 0, offByOne = 0, nonEmpty2D = 0;
  const sample: string[] = [];
  for (let i = 0; i < cells; i++) {
    const a = buf.data[i], b = gpu.levels[i];
    if (a > 0) nonEmpty2D++;
    if (a === b) match++;
    else {
      if (Math.abs(a - b) === 1) offByOne++;
      if (sample.length < 8) sample.push(`(${i % buf.cols},${Math.floor(i / buf.cols)}) 2D=${a} GPU=${b}`);
    }
  }
  return {
    grid: `${buf.cols}×${buf.rows}`,
    cells,
    nonEmpty2D,
    matchPct: +((match / cells) * 100).toFixed(3),
    mismatches: cells - match,
    offByOne,
    sample,
  };
}

export default function Lab3D() {
  const [cell, setCell] = useState<Cell | null>(null);
  const [parity, setParity] = useState(false);
  const [ready, setReady] = useState(false);
  const hud = useRef<HTMLPreElement>(null);
  const status = useRef("skin hero");

  useEffect(() => {
    const c = parseCell();
    const isParity = /[?&]parity\b/.test(window.location.search);
    setCell(c);
    setParity(isParity);
    if (isParity) {
      (window as unknown as { __parityCheck?: () => Promise<unknown> }).__parityCheck = () => parityCheck(c);
    }
  }, []);

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

  // keyboard: exercise the engine's skin blends, era evolution and merger
  useEffect(() => {
    let current = 0;
    const proxy = { t: 0, tp: 0, merge: 0, ring: 0 };
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= chapters.length) {
        const to = n - 1;
        if (to === current) return;
        const from = current;
        current = to;
        gsap.killTweensOf(proxy, "t");
        proxy.t = 0;
        status.current = `skin ${chapters[from].id} → ${chapters[to].id}`;
        gsap.to(proxy, {
          t: 1,
          duration: 1.4,
          ease: "power1.inOut",
          onUpdate: () => journey.setBlend(from, to, proxy.t),
          onComplete: () => {
            journey.setBlend(to, to, 0);
            status.current = `skin ${chapters[to].id}`;
          },
        });
      } else if (e.key === "t") {
        gsap.killTweensOf(proxy, "tp");
        proxy.tp = 0;
        status.current = "era evolution 2021 → now";
        gsap.to(proxy, {
          tp: 1,
          duration: 5,
          ease: "none",
          onUpdate: () => journey.setTimelineProgress(proxy.tp),
          onComplete: () => {
            gsap.delayedCall(1.2, () => journey.setTimelineProgress(-1));
            status.current = `skin ${chapters[current].id}`;
          },
        });
      } else if (e.key === "m") {
        gsap.killTweensOf(proxy);
        status.current = "inspiral → merger → ringdown";
        gsap
          .timeline({ onUpdate: () => journey.setStage(proxy.merge, proxy.ring) })
          .to(proxy, { merge: 1, duration: 3.2, ease: "power2.in" })
          .to(proxy, { ring: 1, duration: 2.4, ease: "power1.out" });
      } else if (e.key === "r") {
        gsap.killTweensOf(proxy);
        proxy.merge = proxy.ring = 0;
        journey.setStage(0, 0);
        status.current = `skin ${chapters[current].id}`;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onStats = (s: StageStats) => {
    if (!hud.current || !cell) return;
    const p = journey.state.globalProgress;
    hud.current.textContent =
      `fps ${s.fps}  calls ${s.calls}  tris ${s.tris}\n` +
      `cell ${cell.w}×${cell.h}  progress ${p.toFixed(3)}${parity ? "  PARITY" : ""}\n` +
      `${status.current}\n` +
      `keys: 1–5 skin · t eras · m merger · r reset`;
  };

  return (
    <div className="relative bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 0.8s ease",
          // same vignette as the 2D vessel (off in parity mode: the check reads raw cells)
          ...(parity
            ? {}
            : {
                maskImage: "radial-gradient(ellipse 85% 75% at 50% 40%, black 35%, transparent 88%)",
                WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 40%, black 35%, transparent 88%)",
              }),
        }}
      >
        {cell && (
          <StageCanvas cell={cell} parity={parity} onStats={onStats} onReady={() => setReady(true)} />
        )}
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
