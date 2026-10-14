"use client";

// ── stage-canvas ──────────────────────────────────────────────────────────────
// The ASCII field as a real 3D scene: a GPU wave sheet (the two-body field from
// bake.ts, in pixel units) + the two bodies, rendered through AsciiRenderer
// (lib/ascii-engine/gl). Everything reads journey.state per frame — the same
// single-writer store the 2D vessel uses — so React never re-renders on scroll.
// The camera follows a director track (lib/director): HOME_TRACK anchored to the
// real chapters, or LAB_TRACK on /lab/3d. Loaded client-only via next/dynamic.

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  DoubleSide,
  MathUtils,
  Plane,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3,
  type Mesh,
  type PerspectiveCamera,
} from "three";
import { asciiConfig } from "@/lib/ascii-config";
import { STYLES } from "@/lib/ascii-engine/skins";
import { currentSkinBlend } from "@/lib/ascii-engine/skin-blend";
import { waveFragment, waveVertex } from "@/lib/ascii-engine/gl/wave-shader";
import { AsciiRenderer, TRAIL_MAX } from "@/lib/ascii-engine/gl/ascii-renderer";
import { applySkinBlend } from "@/lib/ascii-engine/gl/skin-uniforms";
import { resolveCssColor, slotOf } from "@/lib/ascii-engine/gl/atlas";
import { journey } from "@/lib/journey-store";
import { chapters } from "@/lib/chapters";
import { FLAT, poseAt, resolveTrack, type Pose, type ResolvedTrack } from "@/lib/director/rig";
import { FLY_MS, presetPose } from "@/lib/director/layouts";
import { HOME_TRACK, LAB_TRACK } from "@/lib/director/stations";
import { chapterWeight, layoutScale } from "@/lib/director/weights";
import type { SolidUniforms } from "@/lib/ascii-engine/gl/solid-shader";
import BuildScene from "@/components/stage/scenes/build";
import MontyScene from "@/components/stage/scenes/monty";
import WorldlineScene, { WORLDLINE_X } from "@/components/stage/scenes/worldline";
import TitlesScene from "@/components/stage/scenes/titles";
import DustScene from "@/components/stage/scenes/dust";
import { createLaserDirector } from "@/lib/director/laser";
import { readAnchor } from "@/lib/laser-anchors";

const TWO_PI = Math.PI * 2;
const N_FRAMES = MathUtils.clamp(Math.round(TWO_PI / asciiConfig.dt), 180, 480);
const KWAVE = Math.max(1, Math.round(asciiConfig.waveSpeed * 6));
const KOSC = Math.max(1, Math.round(asciiConfig.oscCycles));
const BASE_FPS = asciiConfig.fpsCap; // the 2D loop's "one frame" unit
const GAIN = 0.004;                  // matches vessel.tsx phase velocity
const SHEET = 9000;                  // px units — covers the horizon when tilted
const DEG = Math.PI / 180;
const LATTICE_SLOT = slotOf("┼");
const MERGER_SLOT = slotOf("◆");

export interface StageStats { fps: number; calls: number; tris: number; }
export interface Cell { w: number; h: number; }

const CHAPTER_IDS = chapters.map((c) => c.id);
const easeInOut = (t: number) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
const POSE_KEYS = ["tx", "ty", "elev", "az", "roll", "fov", "relief", "look", "merge", "ring"] as const;
function blendPose(T: Pose, D: Partial<Pose>, e: number) {
  for (const k of POSE_KEYS) {
    const to = D[k];
    if (typeof to === "number") T[k] = T[k] + (to - T[k]) * e;
  }
  if (typeof D.dist === "number") T.dist = (T.dist as number) + (D.dist - (T.dist as number)) * e;
}
const debugOn = typeof window !== "undefined" && /[?&]debug\b/.test(window.location.search);
// the journey's background is the laser layer; ?bg=wave brings back the wave field (A/B)
const waveBg = typeof window !== "undefined" && /[?&]bg=wave\b/.test(window.location.search);

/** Shared uniforms for everything that evaluates the field. */
function makeFieldUniforms() {
  return {
    uTau: { value: 0 },
    uMinWH: { value: 800 },
    uOrbitFrac: { value: new Vector2(asciiConfig.orbitFracLo, asciiConfig.orbitFracHi) },
    uWaveFreq: { value: new Vector2(asciiConfig.waveFreqLo, asciiConfig.waveFreqHi) },
    uKwave: { value: KWAVE },
    uKosc: { value: KOSC },
    uLens: { value: new Vector2(asciiConfig.lensR, asciiConfig.lensG) },
    uMerge: { value: 0 },
    uRing: { value: 0 },
    uHeight: { value: 0 },
    uLightDir: { value: new Vector2(1, 0) },
    uRealNormals: { value: 0 },
    uDent: { value: new Vector3() },
    uFade: { value: new Vector2(1e5, 1e5 + 1) },
    uPresence: { value: 1 },
  };
}

export type StageMode = "journey" | "lab";

interface StageProps {
  cell: Cell;
  mode?: StageMode;
  parity?: boolean;
  onStats?: (s: StageStats) => void;
  /** first frame rendered with the glyph atlas in place (safe to crossfade) */
  onFirstFrame?: () => void;
  /** WebGL context lost — the caller should fall back to the 2D vessel */
  onLost?: (reason: "context-lost" | "slow") => void;
}

function Stage({ cell, mode = "journey", parity = false, onStats, onFirstFrame, onLost }: StageProps) {
  const { gl, scene, camera, size, viewport, setDpr } = useThree();
  const cam = camera as PerspectiveCamera;
  const dpr = viewport.dpr;

  const uniforms = useMemo(makeFieldUniforms, []);
  // scene objects share the field's light + fade so everything agrees
  const solidShared = useMemo<SolidUniforms>(
    () => ({ uLightDir: uniforms.uLightDir, uFade: uniforms.uFade }),
    [uniforms],
  );
  const sheetMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: waveVertex,
        fragmentShader: waveFragment,
        uniforms,
        side: DoubleSide, // stays visible after the camera swings under it
      }),
    [uniforms],
  );
  const bodyA = useRef<Mesh>(null);
  const bodyB = useRef<Mesh>(null);

  const ascii = useMemo(
    () =>
      new AsciiRenderer(gl, {
        styles: STYLES,
        bg: resolveCssColor(getComputedStyle(document.body).backgroundColor),
        repelR: asciiConfig.repelR,
        repelCore: asciiConfig.repelCore,
        shimmerMin: asciiConfig.shimmerMin,
        lightSharpness: asciiConfig.lightSharpness,
        glowThresholdFrac: asciiConfig.glowThresholdFrac,
      }),
    [gl],
  );
  useEffect(() => () => ascii.dispose(), [ascii]);

  useEffect(() => {
    ascii.setSize(size.width, size.height, dpr, cell.w, cell.h);
    uniforms.uMinWH.value = Math.min(size.width, size.height);
  }, [ascii, uniforms, size, cell, dpr]);

  // parity hook: the per-cell level grid, for comparison against bake.ts
  useEffect(() => {
    if (!parity) return;
    const w = window as unknown as { __stage?: unknown };
    w.__stage = {
      readLevels: () => ({ cols: ascii.cols, rows: ascii.rows, levels: Array.from(ascii.readLevels()) }),
      ready: () => ascii.ready,
    };
    return () => { delete w.__stage; };
  }, [parity, ascii]);

  useEffect(() => {
    if (!onLost) return;
    const el = gl.domElement;
    const lost = (e: Event) => { e.preventDefault(); onLost("context-lost"); };
    el.addEventListener("webglcontextlost", lost);
    return () => el.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);

  // ── adaptive quality: step the pixel ratio down when frames run long ─────
  // Measured in 2s windows, skipping the first 3s (shader compiles) and any
  // window the browser throttled rather than the GPU: a hidden tab, or any
  // frame gap over 250ms (occluded window, rAF paused, devtools, sleep).
  // Thresholds sit below 30fps on purpose — battery-saver / energy-saver caps
  // at 30 keep full sharpness. Two windows < 24fps step dpr 2 → 1.5 → 1;
  // three more < 20fps at dpr 1 (and ≥ 10s in) hand back to the 2D tier.
  // ?quality=fixed disables it; <html data-stage-quality> mirrors the dpr.
  const governor = useRef({ since: 0, last: 0, frames: 0, slow: 0, start: 0, fixed: false });
  useEffect(() => {
    governor.current.fixed = new URLSearchParams(window.location.search).get("quality") === "fixed";
    governor.current.start = performance.now();
  }, []);
  useEffect(() => {
    document.documentElement.dataset.stageQuality = String(dpr);
  }, [dpr]);
  useFrame(() => {
    const q = governor.current;
    const now = performance.now();
    const gap = now - q.last;
    q.last = now;
    if (q.fixed || parity || now - q.start < 3000) return;
    if (document.hidden || q.since === 0 || gap > 250) {
      // throttled by the browser, not slow — start a fresh window
      q.since = now;
      q.frames = 0;
      return;
    }
    q.frames++;
    if (now - q.since < 2000) return;
    const fps = (q.frames * 1000) / (now - q.since);
    q.since = now;
    q.frames = 0;
    const floor = dpr > 1 ? 24 : 20;
    q.slow = fps < floor ? q.slow + 1 : 0;
    if (q.slow < (dpr > 1 ? 2 : 3)) return;
    q.slow = 0;
    if (dpr > 1) setDpr(dpr > 1.5 ? 1.5 : 1);
    else if (now - q.start > 10_000) onLost?.("slow");
  });

  // ── pointer trail (same ring buffer semantics as the 2D vessel) ──────────
  const trail = useRef<{ x: number; y: number; t: number }[]>([]);
  const pointer = useRef(new Vector2());
  const lastMove = useRef(-1e9);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      lastMove.current = performance.now();
      trail.current.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (trail.current.length > TRAIL_MAX) trail.current.shift();
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // ── per-frame state ──────────────────────────────────────────────────────
  const phase = useRef(0);
  const light = useRef({ angle: parity ? 0 : Math.random() * TWO_PI, hue: 0 });
  const rig = useRef({ ...FLAT, dist: 0, lookX: 0, lookY: 0 });
  const sheet = useRef<Mesh>(null);
  const laserDirector = useMemo(createLaserDirector, []);
  const target = useRef<Pose>({ ...FLAT });
  const track = useRef<{ bounds: number[] | null; t: ResolvedTrack | null }>({ bounds: null, t: null });
  const firstFrame = useRef(false);
  const stats = useRef({ frames: 0, since: performance.now() });
  const tmp = useMemo(
    () => ({
      f: new Vector3(), up: new Vector3(), pos: new Vector3(), tgt: new Vector3(), at: new Vector3(),
      ray: new Raycaster(), sheet: new Plane(new Vector3(0, 0, 1), 0), hit: new Vector3(), ndc: new Vector2(),
    }),
    [],
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const now = performance.now();
    const H = size.height;
    const st = journey.state;
    const p = parity ? 0 : st.globalProgress;

    // ── director: resolve the track against the live chapter bounds ──────
    const tk = track.current;
    if (!tk.t || tk.bounds !== st.bounds) {
      tk.bounds = st.bounds;
      tk.t = resolveTrack(mode === "lab" ? LAB_TRACK : HOME_TRACK, CHAPTER_IDS, st.bounds);
    }
    const T = parity ? Object.assign(target.current, FLAT, { dist: (H / 2) / Math.tan((4 * DEG) / 2) })
      : poseAt(tk.t, p, H, target.current);
    const routeKind = st.focus.route.kind;
    if (mode === "journey" && !parity) {
      const { route, fly } = st.focus;
      if (route.kind !== "home") {
        // detail page: parked beside its object (the persistent stage keeps the
        // camera where a click-to-fly left it)
        Object.assign(T, FLAT, presetPose(route.kind, route.index));
      } else {
        // worldline: truck in lockstep with the DOM year track while it's pinned
        const tp = st.timelineProgress;
        if (tp >= 0) T.tx = MathUtils.lerp(WORLDLINE_X[0], WORLDLINE_X[1], tp);
        // click-to-fly: blend from the journey pose into the destination preset
        if (fly) blendPose(T, presetPose(fly.kind, fly.index), easeInOut((now - fly.start) / FLY_MS));
      }
      // compositions are authored at 1440px wide: scale targets with the layout,
      // and pull back on narrow aspects (phones) so the scene still fits
      const ls = layoutScale(size.width);
      T.tx *= ls;
      T.ty *= ls;
      const boost = MathUtils.clamp(Math.sqrt(1.6 / (size.width / H)), 1, 1.9);
      T.dist = (T.dist as number) * MathUtils.lerp(1, boost, T.relief);
    }
    // the lab drives the merger from the keyboard; the journey from its track
    const merge = mode === "lab" ? st.stage.merge : T.merge;
    const ring = mode === "lab" ? st.stage.ring : T.ring;

    // hybrid phase velocity — idle = the 2D loop's 18fps cadence, scroll bends
    // time, and the inspiral speeds the orbit up as it decays
    if (!parity) {
      const rate = (1 + st.velocity * GAIN) * (1 + 3 * merge);
      phase.current = (((phase.current + rate * delta * BASE_FPS / N_FRAMES) % 1) + 1) % 1;
    }
    uniforms.uTau.value = phase.current;
    uniforms.uMerge.value = merge;
    uniforms.uRing.value = ring;

    // stochastic light (advanced at the 2D cadence)
    const L = light.current;
    if (!parity) {
      L.angle += (asciiConfig.lightDrift + (Math.random() - 0.5) * asciiConfig.lightJitter) * delta * BASE_FPS;
      L.hue += asciiConfig.lightHueDrift * delta * BASE_FPS;
    }
    uniforms.uLightDir.value.set(Math.cos(L.angle), Math.sin(L.angle));
    ascii.frame.uHuePhase = L.hue;
    ascii.frame.uTime.value = parity ? 0 : now / 1000;
    ascii.frame.uGradientMix.value = st.stage.flatLight ? 0 : 1;

    // ── camera rig: damped toward the director's pose ─────────────────────
    const R = rig.current;
    const k = 6; // damping: glides even when wheel scroll is steppy
    const snap = R.dist === 0 || parity;
    const d = (cur: number, to: number) => (snap ? to : MathUtils.damp(cur, to, k, delta));
    R.tx = d(R.tx, T.tx);
    R.ty = d(R.ty, T.ty);
    R.elev = d(R.elev, T.elev);
    R.az = d(R.az, T.az);
    R.roll = d(R.roll, T.roll);
    R.fov = d(R.fov, T.fov);
    R.dist = d(R.dist as number, T.dist as number);
    R.relief = d(R.relief, T.relief);
    R.lookX = MathUtils.damp(R.lookX, pointer.current.x * T.look, 3, delta);
    R.lookY = MathUtils.damp(R.lookY, pointer.current.y * T.look, 3, delta);

    const e = R.elev * DEG;
    const az = R.az * DEG;
    const hx = Math.sin(az), hy = Math.cos(az);
    tmp.f.set(hx * Math.cos(e), hy * Math.cos(e), -Math.sin(e));
    tmp.up.set(hx * Math.sin(e), hy * Math.sin(e), Math.cos(e)).applyAxisAngle(tmp.f, R.roll);
    tmp.tgt.set(R.tx + R.lookX * 40, R.ty - R.lookY * 40, 0);
    tmp.pos.copy(tmp.tgt).addScaledVector(tmp.f, -(R.dist as number));
    cam.position.copy(tmp.pos);
    cam.up.copy(tmp.up);
    cam.lookAt(tmp.at.copy(tmp.pos).add(tmp.f));
    if (Math.abs(cam.fov - R.fov) > 1e-4) {
      cam.fov = R.fov;
      cam.updateProjectionMatrix();
    }

    // relief + real lighting fade in with the tilt; far field fades to empty
    const relief = R.relief;
    uniforms.uHeight.value = 130 * relief;
    uniforms.uRealNormals.value = relief;
    const near = Math.max(Math.abs(R.dist as number) * 1.25, 1400);
    uniforms.uFade.value.set(near, near + 2800);
    // the sheet steps back a little while scene objects are on stage
    const onStage = mode === "journey"
      ? Math.max(
          chapterWeight("code", p, CHAPTER_IDS, st.bounds),
          chapterWeight("music", p, CHAPTER_IDS, st.bounds),
          chapterWeight("timeline", p, CHAPTER_IDS, st.bounds),
        )
      : 0;
    uniforms.uPresence.value = (1 - 0.15 * onStage) * (routeKind === "home" ? 1 : 0.75);

    // cursor as negative mass: raycast onto the sheet; the crater fades in
    // while the pointer moves and relaxes ~1.5 s after it stops
    const moving = now - lastMove.current < 1500 && relief > 0.2 ? 1 : 0;
    const dent = uniforms.uDent.value;
    dent.z = MathUtils.damp(dent.z, moving, 4, delta);
    if (dent.z > 0.001) {
      tmp.ndc.set(pointer.current.x, -pointer.current.y);
      tmp.ray.setFromCamera(tmp.ndc, cam);
      if (tmp.ray.ray.intersectPlane(tmp.sheet, tmp.hit)) {
        dent.x = MathUtils.damp(dent.x, tmp.hit.x, 12, delta);
        dent.y = MathUtils.damp(dent.y, -tmp.hit.y, 12, delta); // field coords are y-down
      }
    }

    // skins: the same blend the 2D vessel shows; tilted views get +70% intensity
    const blend = currentSkinBlend(st);
    // detail pages dim the field so the page reads first
    applySkinBlend(ascii.skin, blend.a, blend.b, blend.t, size.width,
      (1 + 0.7 * relief) * (routeKind === "home" ? 1 : 0.6));

    // flashes: ┼ lattice on the punch-through, ◆ burst at the merger
    const punch = relief > 0.5 ? 1 - MathUtils.smoothstep(Math.abs(cam.position.z), 0, 70) : 0;
    // brief and faint: the epilogue text sits on top of it
    const burst = 0.45 * MathUtils.smoothstep(merge, 0.96, 1) * (1 - MathUtils.smoothstep(ring, 0, 0.12));
    ascii.frame.uFlash.value = Math.max(punch, burst);
    ascii.frame.uFlashSlot.value = burst > punch ? MERGER_SLOT : LATTICE_SLOT;

    // bodies follow the shader's orbit (decaying with the inspiral)
    const tau = phase.current;
    const s = (1 - Math.cos(TWO_PI * KOSC * tau)) / 2;
    const orbitR =
      Math.min(size.width, H) * MathUtils.lerp(asciiConfig.orbitFracLo, asciiConfig.orbitFracHi, s) * (1 - merge);
    const bx = orbitR * Math.cos(TWO_PI * tau);
    const by = orbitR * Math.sin(TWO_PI * tau);
    const lift = 18 * relief;
    if (bodyA.current && bodyB.current) {
      bodyA.current.position.set(bx, -by, lift);
      bodyB.current.position.set(-bx, by, lift);
      bodyA.current.visible = relief > 0.02;
      bodyB.current.visible = relief > 0.02 && ring < 0.05; // one remnant after the merger
      bodyA.current.scale.setScalar(1 + 0.6 * ring);
    }

    // pointer trail → cell-pass uniforms (age factor, 0 = dead slot)
    const tr = trail.current;
    while (tr.length && now - tr[0].t > asciiConfig.trailMs) tr.shift();
    const slots = ascii.frame.uTrail.value;
    for (let i = 0; i < TRAIL_MAX; i++) {
      const pt = tr[i];
      // in 3D the glyph-clearing bubble softens so the crater reads
      if (pt) slots[i].set(pt.x, pt.y, (1 - (now - pt.t) / asciiConfig.trailMs) * (1 - 0.6 * relief));
      else slots[i].z = 0;
    }

    // ── background: laser layer (journey) or the wave sheet (lab, ?bg=wave) ──
    const laserOn = mode === "journey" && !parity && !waveBg;
    if (sheet.current) sheet.current.visible = !laserOn;
    if (laserOn) {
      const L = ascii.laser;
      // detail pages keep the figure where the journey left it, quieter
      L.uLaserMix.value = MathUtils.damp(L.uLaserMix.value, routeKind === "home" ? 1 : 0.45, 4, delta);
      const lo = laserDirector(L, {
        g: p, ids: CHAPTER_IDS, bounds: st.bounds, timelineProgress: st.timelineProgress,
        merge, ring, velocity: st.velocity, time: now / 1000, delta, viewW: size.width, viewH: size.height,
        anchor: readAnchor,
        hover: st.focus.hover,
        // the burst plays on the way out of the journey only (the stage keeps
        // focus.fly while parked on the detail page)
        fly: st.focus.fly && routeKind === "home" ? { kind: st.focus.fly.kind === "show" ? "show" : "project", t: (now - st.focus.fly.start) / FLY_MS } : null,
      });
      ascii.frame.uGlitch.value = lo.glitch;
      ascii.frame.uLaserTone.value.set(lo.brightness, lo.hot);
      // the merger flash follows the laser story (anchored to the about text)
      ascii.frame.uFlash.value = routeKind === "home" ? lo.burst : 0;
      ascii.frame.uFlashSlot.value = MERGER_SLOT;
      // scene objects keep a monochrome glyph light under the two-scale palette
      ascii.skin.uSat.value = 0;
    } else {
      ascii.laser.uLaserMix.value = 0;
      ascii.frame.uGlitch.value = 0;
    }

    gl.info.reset(); // count every pass this frame, not just the last one
    ascii.render(scene, cam);
    if (!firstFrame.current && ascii.ready) {
      firstFrame.current = true;
      onFirstFrame?.();
    }

    // stats (DOM callback, throttled — no React state)
    const sa = stats.current;
    sa.frames++;
    if (debugOn && now - sa.since > 500) {
      (window as unknown as { __stageDebug?: unknown }).__stageDebug = {
        g: +p.toFixed(4),
        bounds: st.bounds.map((x) => +x.toFixed(4)),
        pose: { elev: +R.elev.toFixed(1), az: +R.az.toFixed(1), dist: Math.round(R.dist as number), fov: +R.fov.toFixed(1), relief: +relief.toFixed(2) },
        merge: +merge.toFixed(3),
        ring: +ring.toFixed(3),
        skin: { t: +blend.t.toFixed(2), density: +ascii.skin.uDensity.value.toFixed(2), dim: +ascii.skin.uDim.value.toFixed(2) },
        fps: Math.round((sa.frames * 1000) / (now - sa.since)),
        focus: { route: `${st.focus.route.kind}:${st.focus.route.index}`, hover: st.focus.hover, fly: !!st.focus.fly },
        dent: +uniforms.uDent.value.z.toFixed(2),
      };
    }
    if ((onStats || debugOn) && now - sa.since > 500) {
      onStats?.({
        fps: Math.round((sa.frames * 1000) / (now - sa.since)),
        calls: gl.info.render.calls,
        tris: gl.info.render.triangles,
      });
      sa.frames = 0;
      sa.since = now;
    }
  }, 1);

  const bodyMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: /* glsl */ `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `varying vec3 vN; void main(){ gl_FragColor = vec4(0.7, 0.6 + 0.4 * max(vN.z, 0.0), 1.0, 1.0); }`,
      }),
    [],
  );

  return (
    <>
      <mesh ref={sheet} material={sheetMat} frustumCulled={false}>
        <planeGeometry args={[SHEET, SHEET, 320, 320]} />
      </mesh>
      {mode === "journey" && (
        <>
          {/* the wave-field journey's objects; the laser story tells it alone */}
          {waveBg && (
            <>
              <BuildScene shared={solidShared} />
              <MontyScene shared={solidShared} />
              <WorldlineScene shared={solidShared} />
              <TitlesScene shared={solidShared} />
            </>
          )}
          <DustScene rig={rig} />
        </>
      )}
      <mesh ref={bodyA} material={bodyMat} visible={false}>
        <sphereGeometry args={[38, 24, 16]} />
      </mesh>
      <mesh ref={bodyB} material={bodyMat} visible={false}>
        <sphereGeometry args={[38, 24, 16]} />
      </mesh>
    </>
  );
}

export default function StageCanvas(props: StageProps) {
  return (
    <Canvas
      linear
      flat
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: 4, near: 1, far: 60000, position: [0, 0, 12000] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 1);
        gl.info.autoReset = false;
      }}
    >
      <Stage {...props} />
    </Canvas>
  );
}
