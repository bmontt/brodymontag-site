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
import { HOME_TRACK, LAB_TRACK } from "@/lib/director/stations";
import { chapterWeight, layoutScale } from "@/lib/director/weights";
import type { SolidUniforms } from "@/lib/ascii-engine/gl/solid-shader";
import BuildScene from "@/components/stage/scenes/build";
import MontyScene from "@/components/stage/scenes/monty";
import WorldlineScene, { WORLDLINE_X } from "@/components/stage/scenes/worldline";

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
const debugOn = typeof window !== "undefined" && /[?&]debug\b/.test(window.location.search);

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
  onLost?: () => void;
}

function Stage({ cell, mode = "journey", parity = false, onStats, onFirstFrame, onLost }: StageProps) {
  const { gl, scene, camera, size, viewport } = useThree();
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
    const lost = (e: Event) => { e.preventDefault(); onLost(); };
    el.addEventListener("webglcontextlost", lost);
    return () => el.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);

  // ── pointer trail (same ring buffer semantics as the 2D vessel) ──────────
  const trail = useRef<{ x: number; y: number; t: number }[]>([]);
  const pointer = useRef(new Vector2());
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
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
  const target = useRef<Pose>({ ...FLAT });
  const track = useRef<{ bounds: number[] | null; t: ResolvedTrack | null }>({ bounds: null, t: null });
  const firstFrame = useRef(false);
  const stats = useRef({ frames: 0, since: performance.now() });
  const tmp = useMemo(
    () => ({ f: new Vector3(), up: new Vector3(), pos: new Vector3(), tgt: new Vector3(), at: new Vector3() }),
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
    // compositions are authored at 1440px wide: scale targets with the layout,
    // and pull back on narrow aspects (phones) so the scene still fits
    if (mode === "journey" && !parity) {
      const ls = layoutScale(size.width);
      T.tx *= ls;
      T.ty *= ls;
      // worldline: truck in lockstep with the DOM year track while it's pinned
      const tp = st.timelineProgress;
      if (tp >= 0) T.tx = MathUtils.lerp(WORLDLINE_X[0], WORLDLINE_X[1], tp) * ls;
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
    uniforms.uPresence.value = 1 - 0.15 * onStage;

    // skins: the same blend the 2D vessel shows; tilted views get +70% intensity
    const blend = currentSkinBlend(st);
    applySkinBlend(ascii.skin, blend.a, blend.b, blend.t, size.width, 1 + 0.7 * relief);

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
      if (pt) slots[i].set(pt.x, pt.y, 1 - (now - pt.t) / asciiConfig.trailMs);
      else slots[i].z = 0;
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
      <mesh material={sheetMat} frustumCulled={false}>
        <planeGeometry args={[SHEET, SHEET, 320, 320]} />
      </mesh>
      {mode === "journey" && (
        <>
          <BuildScene shared={solidShared} />
          <MontyScene shared={solidShared} />
          <WorldlineScene shared={solidShared} />
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
