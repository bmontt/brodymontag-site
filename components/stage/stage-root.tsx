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
// to 2D — never a blank background.
//
// Tier decision (first match wins):
//   ?tier=2d|3d override → reduced motion → Save-Data → low memory/cores →
//   no WebGL2 (or only with a major performance caveat) → otherwise 3D.
// The chosen tier and why are mirrored to <html data-stage-tier/-reason> and
// logged once to the console.
//
// Interaction (3D tier): hovering/focusing a [data-stage-id] entry lights its
// object; clicking a project/show link on the journey flies the camera to that
// object (FLY_MS) before navigating — the stage then stays parked beside it.

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import Laser2D from "@/components/stage/laser-2d";
import { journey, type StageRouteKind } from "@/lib/journey-store";
import { FLY_MS, panelIndexBySlug, pillarIndexBySlug } from "@/lib/director/layouts";

const StageCanvas = dynamic(() => import("@/components/stage/stage-canvas"), { ssr: false });

type Tier = "2d" | "3d";

const MASK = "radial-gradient(ellipse 85% 75% at 50% 40%, black 35%, transparent 88%)";
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

/** "/projects/<slug>" → { kind: "project", index } etc. */
function routeOf(pathname: string): { kind: StageRouteKind; index: number } {
  const m = /^\/(projects|shows)\/([^/?#]+)/.exec(pathname);
  if (!m) return { kind: "home", index: -1 };
  const slug = decodeURIComponent(m[2]);
  return m[1] === "projects"
    ? { kind: "project", index: pillarIndexBySlug(slug) }
    : { kind: "show", index: panelIndexBySlug(slug) };
}

export default function StageRoot() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = routeOf(pathname).kind === "home";
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

  // the stage follows the route: journey on home, parked beside the object on details
  useEffect(() => {
    const r = routeOf(pathname);
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

  // hover/focus an entry → light its 3D object (delegated; no React state)
  useEffect(() => {
    if (tier !== "3d") return;
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

  // click a project/show on the journey → fly to its object, then navigate
  useEffect(() => {
    if (tier !== "3d" || !stageReady || !isHome) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const r = routeOf(url.pathname);
      if (r.kind === "home" || flying.current) return;
      e.preventDefault();
      e.stopPropagation(); // keep the Link from navigating before the flight lands
      flying.current = true;
      journey.setFly(r.kind, r.index);
      window.setTimeout(() => router.push(url.pathname + url.search + url.hash), FLY_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [tier, stageReady, isHome, router]);

  const onFirstFrame = useCallback(() => setStageReady(true), []);
  const onLost = useCallback((why: "context-lost" | "slow") => {
    setTier("2d");
    setReason(why);
    setStageReady(false);
    setCanvas2dGone(false);
  }, []);

  return (
    <>
      {!canvas2dGone && (
        <div style={{ opacity: stageReady ? 0 : 1, transition: `opacity ${CROSSFADE_MS}ms ease` }}>
          <Laser2D dim={isHome ? 1 : 0.45} />
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
