"use client";

// ── scene: worldline (timeline chapter) ───────────────────────────────────────
// Six year gates (2021 → 2026) standing on the sheet in a line. While the
// timeline section is pinned, the camera trucks along them in lockstep with the
// horizontal DOM year track (journey.timelineProgress, see stage-canvas), so the
// gates slide past as parallax behind the year panels; the gate nearest the
// camera — the year being read — lights up.

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { TorusGeometry, type Group, type Mesh } from "three";
import { chapters } from "@/lib/chapters";
import { journey } from "@/lib/journey-store";
import { chapterWeight, layoutScale } from "@/lib/director/weights";
import { solidMaterial, type SolidUniforms } from "@/lib/ascii-engine/gl/solid-shader";

const IDS = chapters.map((c) => c.id);
export const WORLDLINE_X: [number, number] = [-1000, 1500]; // camera sweep = gate span
const YEARS = 6;
const GATE_Y = 260;
const RADIUS = 150;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export default function WorldlineScene({ shared }: { shared: SolidUniforms }) {
  const { size, camera } = useThree();
  const group = useRef<Group>(null);
  const gates = useRef<(Mesh | null)[]>([]);

  const geometry = useMemo(() => {
    const g = new TorusGeometry(1, 0.09, 10, 56);
    g.rotateX(Math.PI / 2); // stand the ring up, facing the camera line (-y)
    return g;
  }, []);
  const materials = useMemo(
    () => Array.from({ length: YEARS }, () => solidMaterial(shared, 0.5, 0.18)),
    [shared],
  );
  const xs = useMemo(
    () => Array.from({ length: YEARS }, (_, k) => WORLDLINE_X[0] + ((WORLDLINE_X[1] - WORLDLINE_X[0]) * k) / (YEARS - 1)),
    [],
  );

  useFrame(() => {
    const st = journey.state;
    const w = chapterWeight("timeline", st.globalProgress, IDS, st.bounds, 0.5, 0.5);
    const g = group.current;
    if (!g) return;
    g.visible = w > 0.01;
    if (!g.visible) return;
    const ls = layoutScale(size.width);
    g.scale.set(ls, ls, 1);
    const camX = camera.position.x / ls;
    xs.forEach((x, k) => {
      const m = gates.current[k];
      if (!m) return;
      const rise = smooth(clamp01(w * 1.5 - k * 0.06));
      const r = RADIUS * Math.max(rise, 0.001);
      m.scale.set(r, r, r);
      m.position.z = r + 20;
      // the year in view lights up
      const near = Math.exp(-(((x - camX) / 380) ** 2));
      materials[k].uniforms.uTone.value = 0.48 + 0.3 * near;
      materials[k].uniforms.uWeight.value = w * (0.55 + 0.45 * near);
    });
  });

  return (
    <group ref={group} visible={false}>
      {xs.map((x, k) => (
        <mesh
          key={k}
          ref={(el) => { gates.current[k] = el; }}
          geometry={geometry}
          material={materials[k]}
          position={[x, GATE_Y, 0]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
