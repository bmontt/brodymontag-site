"use client";

// ── scene: the build (code chapter) ───────────────────────────────────────────
// One glyph monolith per project, standing on the cool side of the sheet,
// flanking the camera's path in the screen margins (lib/director/layouts.ts).
// They rise from the sheet in a stagger as the chapter arrives (angular's
// "scale in from depth", made physical). Hovering/focusing a project card — or
// being on that project's page — lights its monolith.

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BoxGeometry, MathUtils, type Group, type Mesh } from "three";
import { chapters } from "@/lib/chapters";
import { journey } from "@/lib/journey-store";
import { PILLARS } from "@/lib/director/layouts";
import { layoutScale, sceneWeight } from "@/lib/director/weights";
import { solidMaterial, type SolidUniforms } from "@/lib/ascii-engine/gl/solid-shader";

const IDS = chapters.map((c) => c.id);
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export default function BuildScene({ shared }: { shared: SolidUniforms }) {
  const { size } = useThree();
  const group = useRef<Group>(null);
  const meshes = useRef<(Mesh | null)[]>([]);
  const glow = useRef(PILLARS.map(() => 0));

  const materials = useMemo(() => PILLARS.map(() => solidMaterial(shared, 0.72, 0.2)), [shared]);
  const geometry = useMemo(() => {
    const g = new BoxGeometry(1, 1, 1);
    g.translate(0, 0, 0.5); // base on the sheet, so scaling z rises from it
    return g;
  }, []);

  useFrame((_, delta) => {
    const st = journey.state;
    const w = sceneWeight("code", st, IDS);
    const g = group.current;
    if (!g) return;
    g.visible = w > 0.01;
    if (!g.visible) return;
    const ls = layoutScale(size.width);
    g.scale.set(ls, ls, 1);
    const { route, hover } = st.focus;
    PILLARS.forEach((pl, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const lit = hover === pl.id || (route.kind === "project" && route.index === i) ? 1 : 0;
      glow.current[i] = MathUtils.damp(glow.current[i], lit, 8, Math.min(delta, 0.1));
      const k = glow.current[i];
      const u = materials[i].uniforms;
      u.uWeight.value = w;
      u.uTone.value = 0.72 + 0.06 * k;
      // full boost for a hover on the journey; gentler when parked on its own page
      u.uEmphasis.value = 2.2 + (route.kind === "home" ? 1.8 : 0.8) * k;
      const rise = smooth(clamp01(w * 1.6 - i * 0.12)); // staggered
      m.scale.set(96, 70, Math.max(pl.h * rise * (1 + 0.1 * k), 0.001));
    });
  });

  return (
    <group ref={group} visible={false}>
      {PILLARS.map((pl, i) => (
        <mesh
          key={pl.id}
          ref={(el) => { meshes.current[i] = el; }}
          geometry={geometry}
          material={materials[i]}
          position={[pl.x, pl.y, 0]}
          rotation={[0, 0, pl.rot]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
