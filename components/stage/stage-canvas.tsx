"use client";

// ── stage-canvas ──────────────────────────────────────────────────────────────
// The ASCII field as a real 3D scene: a GPU wave sheet (the two-body field from
// bake.ts, in pixel units) + the two bodies, rendered through AsciiRenderer
// (lib/ascii-engine/gl). Everything reads journey.state per frame — the same
// single-writer store the 2D vessel uses — so React never re-renders on scroll.
// Loaded client-only via next/dynamic.
//
// Camera stations (globalProgress) — lab choreography until the director lands:
//   A 0.00–0.10  flat top-down — cell-for-cell identical to the 2D field
//   B 0.10–0.45  dolly-zoom (fov 4°→48°, framing held) + tilt 90°→32°
//   C 0.45–0.78  dive toward the binary, 360° roll (angular's shield move)
//   D 0.78–1.00  punch through the sheet (┼ lattice flash) and swing under it

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

const ease = (t: number) => t * t * (3 - 2 * t);
const seg = (p: number, a: number, b: number) => ease(MathUtils.clamp((p - a) / (b - a), 0, 1));

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
  };
}

interface StageProps {
  cell: Cell;
  parity?: boolean;
  onStats?: (s: StageStats) => void;
}

function Stage({ cell, parity = false, onStats }: StageProps) {
  const { gl, scene, camera, size, viewport } = useThree();
  const cam = camera as PerspectiveCamera;
  const dpr = viewport.dpr;

  const uniforms = useMemo(makeFieldUniforms, []);
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
  const rig = useRef({ fov: 4, elev: 90, dist: 0, roll: 0, look: new Vector2() });
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
    const { merge, ring } = st.stage;

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

    // ── camera stations ────────────────────────────────────────────────────
    const b = seg(p, 0.10, 0.45);
    const c = seg(p, 0.45, 0.78);
    const d = ease(seg(p, 0.78, 1.0)); // double-eased: the edge-on crossing is brief
    const fov = MathUtils.lerp(4, 48, b);
    const framing = (H / 2) / Math.tan((fov * DEG) / 2); // dolly-zoom: hold the framing
    const elev = MathUtils.lerp(MathUtils.lerp(MathUtils.lerp(90, 32, b), 22, c), -26, d);
    const dist = MathUtils.lerp(MathUtils.lerp(framing, 380, c), 820, d);
    const roll = TWO_PI * c;

    const R = rig.current;
    const k = 6; // damping: glides even when wheel scroll is steppy
    const snap = R.dist === 0 || parity;
    R.fov = snap ? fov : MathUtils.damp(R.fov, fov, k, delta);
    R.elev = snap ? elev : MathUtils.damp(R.elev, elev, k, delta);
    R.dist = snap ? dist : MathUtils.damp(R.dist, dist, k, delta);
    R.roll = snap ? roll : MathUtils.damp(R.roll, roll, k, delta);
    R.look.x = MathUtils.damp(R.look.x, pointer.current.x, 3, delta);
    R.look.y = MathUtils.damp(R.look.y, pointer.current.y, 3, delta);

    const e = R.elev * DEG;
    tmp.f.set(0, Math.cos(e), -Math.sin(e));
    tmp.up.set(0, Math.sin(e), Math.cos(e)).applyAxisAngle(tmp.f, R.roll);
    const lookAmt = 40 * b; // mouse-look fades out on the flat station
    tmp.tgt.set(R.look.x * lookAmt, -R.look.y * lookAmt, 0);
    tmp.pos.copy(tmp.tgt).addScaledVector(tmp.f, -R.dist);
    cam.position.copy(tmp.pos);
    cam.up.copy(tmp.up);
    cam.lookAt(tmp.at.copy(tmp.pos).add(tmp.f));
    if (Math.abs(cam.fov - R.fov) > 1e-4) {
      cam.fov = R.fov;
      cam.updateProjectionMatrix();
    }

    // relief + real lighting fade in with the tilt; far field fades to empty
    uniforms.uHeight.value = 130 * b;
    uniforms.uRealNormals.value = b;
    const near = Math.max(Math.abs(R.dist) * 1.25, 1400);
    uniforms.uFade.value.set(near, near + 2800);

    // skins: the same blend the 2D vessel shows; tilted views get +70% intensity
    const blend = currentSkinBlend(st);
    applySkinBlend(ascii.skin, blend.a, blend.b, blend.t, size.width, 1 + 0.7 * b);

    // flashes: ┼ lattice on the punch-through, ◆ burst at the merger
    const punch = d > 0 && d < 1 ? 1 - MathUtils.smoothstep(Math.abs(cam.position.z), 0, 70) : 0;
    const burst = MathUtils.smoothstep(merge, 0.9, 1) * (1 - MathUtils.smoothstep(ring, 0, 0.35));
    ascii.frame.uFlash.value = Math.max(punch, burst);
    ascii.frame.uFlashSlot.value = burst > punch ? MERGER_SLOT : LATTICE_SLOT;

    // bodies follow the shader's orbit (decaying with the inspiral)
    const tau = phase.current;
    const s = (1 - Math.cos(TWO_PI * KOSC * tau)) / 2;
    const orbitR =
      Math.min(size.width, H) * MathUtils.lerp(asciiConfig.orbitFracLo, asciiConfig.orbitFracHi, s) * (1 - merge);
    const bx = orbitR * Math.cos(TWO_PI * tau);
    const by = orbitR * Math.sin(TWO_PI * tau);
    const lift = 18 * b;
    if (bodyA.current && bodyB.current) {
      bodyA.current.position.set(bx, -by, lift);
      bodyB.current.position.set(-bx, by, lift);
      bodyA.current.visible = b > 0.02;
      bodyB.current.visible = b > 0.02 && ring < 0.05; // one remnant after the merger
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

    // stats (DOM callback, throttled — no React state)
    const sa = stats.current;
    sa.frames++;
    if (onStats && now - sa.since > 500) {
      onStats({
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
      <mesh ref={bodyA} material={bodyMat} visible={false}>
        <sphereGeometry args={[38, 24, 16]} />
      </mesh>
      <mesh ref={bodyB} material={bodyMat} visible={false}>
        <sphereGeometry args={[38, 24, 16]} />
      </mesh>
    </>
  );
}

export default function StageCanvas({
  cell,
  parity,
  onStats,
  onReady,
}: StageProps & { onReady?: () => void }) {
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
        onReady?.();
      }}
    >
      <Stage cell={cell} parity={parity} onStats={onStats} />
    </Canvas>
  );
}
