"use client";

// ── stage-root ────────────────────────────────────────────────────────────────
// The persistent background stage, mounted once in app/(site)/layout.tsx so it
// survives navigation between the journey and the detail pages.
//
// Capability gate: the 2D canvas always renders first (instant, SSR-safe, and
// the reduced-motion / low-end path) — the laser piece drawn on the CPU
// (Laser2D), dimmer on detail pages. When the device qualifies for the 3D tier, the stage
// chunk loads lazily and crossfades in on its first real frame; the 2D canvas
// then unmounts so its rAF loop stops. A lost WebGL context drops straight back
// to 2D — never a blank background — and so does a context that fails to
// create at all (StageBoundary).
//
// Tier decision (first match wins):
//   ?tier=2d|3d override → reduced motion → Save-Data → low memory/cores →
//   no WebGL2 (or only with a major performance caveat) → otherwise 3D.
// The chosen tier and why are mirrored to <html data-stage-tier/-reason> and
// logged once to the console.
//
// Pages: the landing (/), the sections (/software, /music, /about) and the
// detail pages. Following an internal link to another page bursts the picked
// figure for TRANSITION_MS, then navigates; the persistent stage morphs into
// the new page's composition (lib/director/laser.ts). Hovering or focusing a
// [data-stage-id] entry stirs its figure.

import { Component, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import Laser2D from "@/components/stage/laser-2d";
import { journey, type StageRouteKind } from "@/lib/journey-store";
import { panelIndexBySlug, pillarIndexBySlug } from "@/lib/director/layouts";
import { TRANSITION_MS } from "@/lib/director/laser";

const StageCanvas = dynamic(() => import("@/components/stage/stage-canvas"), { ssr: false });

type Tier = "2d" | "3d";
type LostReason = "context-lost" | "slow" | "context-failed";

/**
 * The capability probe can pass while the real context still fails (GPU
 * process disabled or crashed, context limit reached) — three.js then throws
 * during <Canvas> creation. Catch it and hand back to the 2D tier instead of
 * leaving a crashed stage.
 */
class StageBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[stage] 3D stage failed, falling back to 2D:", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// a gentle vignette — figures live in the gutters and rise from the floor now
const MASK = "radial-gradient(ellipse 125% 115% at 50% 45%, black 58%, transparent 100%)";
const CROSSFADE_MS = 800;
const CELL = { w: 8, h: 22 };

function detectTier(): [Tier, string] {
  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "2d" || forced === "3d") return [forced, "forced"];
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return ["2d", "reduced-motion"];
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return ["2d", "save-data"];
  if ((nav.deviceMemory ?? 8) < 4 || (navigator.hardwareConcurrency ?? 8) < 4) return ["2d", "low-end"];
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!gl) return ["2d", "no-webgl2"];
    gl.getExtension("WEBGL_lose_context")?.loseContext(); // free the probe context
  } catch {
    return ["2d", "no-webgl2"];
  }
  return ["3d", "capable"];
}

const SECTIONS: Record<string, StageRouteKind> = { "/": "home", "/software": "software", "/music": "music", "/about": "about" };

/** pathname → which page the stage is on ("/projects/<slug>" → project + index, …) */
function routeOf(pathname: string): { kind: StageRouteKind; index: number } | null {
  const section = SECTIONS[pathname.replace(/\/$/, "") || "/"];
  if (section) return { kind: section, index: -1 };
  const m = /^\/(projects|shows)\/([^/?#]+)/.exec(pathname);
  if (!m) return null;
  const slug = decodeURIComponent(m[2]);
  return m[1] === "projects"
    ? { kind: "project", index: pillarIndexBySlug(slug) }
    : { kind: "show", index: panelIndexBySlug(slug) };
}

export default function StageRoot() {
  const pathname = usePathname();
  const router = useRouter();
  const [tier, setTier] = useState<Tier | null>(null);
  const [reason, setReason] = useState("pending");
  const [stageReady, setStageReady] = useState(false);
  const [canvas2dGone, setCanvas2dGone] = useState(false);
  const flying = useRef(false);

  useEffect(() => {
    const [t, why] = detectTier();
    setTier(t);
    setReason(why);
  }, []);

  // mirrored for tests and for "why am I seeing 2D?" (devtools: <html data-stage-reason>)
  useEffect(() => {
    document.documentElement.dataset.stageTier = tier ?? "pending";
    document.documentElement.dataset.stageReason = reason;
    if (tier) console.info(`[stage] ${tier} tier (${reason})`);
  }, [tier, reason]);

  // the stage follows the route. A layout effect, and it sits before the page
  // in the tree: the reset lands before the new page's controller (useGSAP is
  // a layout effect too) reports its chapters
  useLayoutEffect(() => {
    const r = routeOf(pathname) ?? { kind: "home" as const, index: -1 };
    journey.setRoute(r.kind, r.index);
    journey.setHover(null);
    flying.current = false;
  }, [pathname]);

  // after the stage's first frame, let the crossfade finish, then drop the 2D canvas
  useEffect(() => {
    if (!stageReady) return;
    const t = setTimeout(() => setCanvas2dGone(true), CROSSFADE_MS + 100);
    return () => clearTimeout(t);
  }, [stageReady]);

  // hover/focus an entry → stir its figure (delegated; no React state) — both
  // tiers draw the laser layer, so both listen
  useEffect(() => {
    if (!tier) return;
    const idOf = (t: EventTarget | null) =>
      (t instanceof Element ? t.closest<HTMLElement>("[data-stage-id]")?.dataset.stageId : undefined) ?? null;
    const enter = (e: Event) => journey.setHover(idOf(e.target));
    const leave = (e: Event) => {
      const next = (e as PointerEvent | FocusEvent).relatedTarget;
      if (idOf(next) !== journey.state.focus.hover) journey.setHover(idOf(next));
    };
    document.addEventListener("pointerover", enter);
    document.addEventListener("pointerout", leave);
    document.addEventListener("focusin", enter);
    document.addEventListener("focusout", leave);
    return () => {
      document.removeEventListener("pointerover", enter);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("focusin", enter);
      document.removeEventListener("focusout", leave);
    };
  }, [tier]);

  // follow an internal link to another page → the picked figure bursts for a
  // beat, then the route changes (the stage persists and morphs into the new
  // page). Skipped under reduced motion and until a stage is drawing.
  useEffect(() => {
    if (!tier) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      const r = routeOf(url.pathname);
      if (!r || flying.current) return;
      e.preventDefault();
      e.stopPropagation(); // keep the Link from navigating before the beat lands
      flying.current = true;
      journey.setFly(r.kind, r.index);
      window.setTimeout(() => router.push(url.pathname + url.search + url.hash), TRANSITION_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [tier, router]);

  const onFirstFrame = useCallback(() => setStageReady(true), []);
  const onLost = useCallback((why: LostReason) => {
    setTier("2d");
    setReason(why);
    setStageReady(false);
    setCanvas2dGone(false);
  }, []);

  return (
    <>
      {!canvas2dGone && (
        <div style={{ opacity: stageReady ? 0 : 1, transition: `opacity ${CROSSFADE_MS}ms ease`, viewTransitionName: "stage-2d" }}>
          <Laser2D />
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
            // one continuous piece across pages: kept live, outside the page crossfade
            viewTransitionName: "stage-3d",
          }}
        >
          <StageBoundary onError={() => onLost("context-failed")}>
            <StageCanvas cell={CELL} mode="journey" onFirstFrame={onFirstFrame} onLost={onLost} />
          </StageBoundary>
        </div>
      )}
    </>
  );
}
