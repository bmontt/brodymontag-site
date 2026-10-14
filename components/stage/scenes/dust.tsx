"use client";

// ── scene: dust ───────────────────────────────────────────────────────────────
// Scroll-parallax glyph dust (docs/design-inspiration.md #4, after lenis.dev's
// starfield): sparse specks on a few depth layers that ride the scroll — each
// displaced by scroll × depth and wrapped, so speed reads as depth. They live in
// screen space (one point = one ASCII cell; the scene target is cols × rows) and
// draw at the field's quietest glyph levels (1–2), in front of everything. Nearly
// invisible at rest; they surface with scroll speed and camera turns, and stay
// off on the flat hero station (gated by the rig's relief).

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, ShaderMaterial } from "three";
import { journey } from "@/lib/journey-store";

const COUNT = 420;
const DEG = Math.PI / 180;

const vertex = /* glsl */ `
attribute vec3 seed;        // xy: screen position, z: depth layer (0 far … 1 near)
uniform vec2  uOffset;      // accumulated scroll (y) and camera-turn (x) drift, in screens
varying float vDepth;
void main() {
  float depth = 0.25 + 0.75 * seed.z;
  vec2 p = fract(seed.xy + uOffset * depth * vec2(0.5, 0.9)) * 2.0 - 1.0;
  vDepth = depth;
  gl_PointSize = 1.0;                        // one cell
  gl_Position = vec4(p, -0.999, 1.0);        // in front of the sheet and objects
}
`;

const fragment = /* glsl */ `
uniform float uVis;
varying float vDepth;
void main() {
  // far specks at level 1 (·), near ones a level up and lit; presence carries visibility
  float amp = vDepth > 0.7 ? 0.2 : 0.1;
  gl_FragColor = vec4(amp, 0.6 * vDepth, uVis * (0.5 + 0.5 * vDepth), 1.0);
}
`;

export interface DustRig {
  relief: number;
  az: number;
}

export default function DustScene({ rig }: { rig: { current: DustRig } }) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    const seed = new Float32Array(COUNT * 3);
    for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
    g.setAttribute("seed", new BufferAttribute(seed, 3));
    g.setAttribute("position", new BufferAttribute(new Float32Array(COUNT * 3), 3));
    return g;
  }, []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: { uOffset: { value: [0, 0] }, uVis: { value: 0 } },
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );
  const last = useMemo(() => ({ az: NaN, vis: 0 }), []);

  useFrame(({ size }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const st = journey.state;
    const R = rig.current;
    const off = material.uniforms.uOffset.value as number[];
    // scroll velocity (px/s) → screens; camera yaw → sideways drift
    off[1] += (st.velocity * delta) / size.height;
    if (!Number.isNaN(last.az)) off[0] -= ((R.az - last.az) * DEG) / 0.8;
    last.az = R.az;
    off[0] %= 1000;
    off[1] %= 1000;
    const speed = Math.min(1, Math.abs(st.velocity) / 2400);
    const want = st.reducedMotion || st.focus.route.kind !== "home" ? 0 : R.relief * (0.12 + 0.88 * speed);
    // rise fast, settle slowly — specks linger a moment after the scroll stops
    last.vis += (want - last.vis) * Math.min(1, delta * (want > last.vis ? 10 : 2.5));
    // tests/A-B: window.__dustVis pins the visibility
    const pin = (window as unknown as { __dustVis?: number }).__dustVis;
    material.uniforms.uVis.value = typeof pin === "number" ? pin : last.vis;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={10} />;
}
