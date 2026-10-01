"use client";

// ── scene: the build (code chapter) ───────────────────────────────────────────
// One glyph monolith per project, standing on the cool side of the sheet. The
// composition is authored against HOME_TRACK's code stations (heading -22°):
// monoliths flank the camera's path beyond the reading-column carve,
// alternating left/right and receding, so the corridor the camera trucks
// through stays open behind the text. They rise from the sheet in a stagger as
// the chapter arrives (angular's "scale in from depth", made physical).

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BoxGeometry, type Group, type Mesh } from "three";
import { projects } from "@/lib/projects";
import { chapters } from "@/lib/chapters";
import { journey } from "@/lib/journey-store";
import { chapterWeight, layoutScale } from "@/lib/director/weights";
import { solidMaterial, type SolidUniforms } from "@/lib/ascii-engine/gl/solid-shader";

const IDS = chapters.map((c) => c.id);
const AZ = (-22 * Math.PI) / 180;
const H: [number, number] = [Math.sin(AZ), Math.cos(AZ)]; // heading (world, y up)
const RIGHT: [number, number] = [H[1], -H[0]];
const ORIGIN: [number, number] = [-260, 40]; // the code station's look target
// Lateral offset grows with depth so every monolith lands in the screen margin
// beside the text column (~80% of the half-width at fov 46°, 16:10): the view's
// half-width at distance d is ≈ 0.68·d, and the camera sits ≈ 660px behind ORIGIN.
const CAMERA_BACK = 660;
const MARGIN_RATIO = 0.54;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export default function BuildScene({ shared }: { shared: SolidUniforms }) {
  const { size } = useThree();
  const group = useRef<Group>(null);
  const meshes = useRef<(Mesh | null)[]>([]);

  const material = useMemo(() => solidMaterial(shared, 0.72, 0.2), [shared]);
  const geometry = useMemo(() => {
    const g = new BoxGeometry(1, 1, 1);
    g.translate(0, 0, 0.5); // base on the sheet, so scaling z rises from it
    return g;
  }, []);

  const pillars = useMemo(
    () =>
      projects.map((p, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const depth = 60 + i * 170;
        const lateral = MARGIN_RATIO * (CAMERA_BACK + depth);
        return {
          x: ORIGIN[0] + H[0] * depth + RIGHT[0] * side * lateral,
          y: ORIGIN[1] + H[1] * depth + RIGHT[1] * side * lateral,
          h: (p.status === "live" ? 360 : 250) + ((i * 53) % 70),
          rot: AZ + side * 0.12,
        };
      }),
    [],
  );

  useFrame(() => {
    const st = journey.state;
    const w = chapterWeight("code", st.globalProgress, IDS, st.bounds);
    material.uniforms.uWeight.value = w;
    const g = group.current;
    if (!g) return;
    g.visible = w > 0.01;
    if (!g.visible) return;
    const ls = layoutScale(size.width);
    g.scale.set(ls, ls, 1);
    pillars.forEach((pl, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const rise = smooth(clamp01(w * 1.6 - i * 0.12)); // staggered
      m.scale.set(96, 70, Math.max(pl.h * rise, 0.001));
    });
  });

  return (
    <group ref={group} visible={false}>
      {pillars.map((pl, i) => (
        <mesh
          key={i}
          ref={(el) => { meshes.current[i] = el; }}
          geometry={geometry}
          material={material}
          position={[pl.x, pl.y, 0]}
          rotation={[0, 0, pl.rot]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
