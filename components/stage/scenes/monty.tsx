"use client";

// ── scene: monty (music chapter) ──────────────────────────────────────────────
// The warm side of the sheet. Event photos stand as panels whose glyph levels
// follow the photo's luminance (ASCII photography), flanking the camera's path
// like a gallery. Overhead, angular.dev's meteor shower: glyph streaks fly in
// over four waves (5% / 15% / 25% / the rest), settle into a hovering
// constellation, and all fly out together as the chapter ends.
// Photos load through the Next image optimizer at 128px (q=75: Next 16 allows only 75 by default) — a panel only needs a
// few dozen cells of detail, not a 4000px decode.

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BoxGeometry,
  Object3D,
  PlaneGeometry,
  TextureLoader,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
  type Texture,
} from "three";
import { events } from "@/lib/brody-events";
import { chapters } from "@/lib/chapters";
import { journey } from "@/lib/journey-store";
import { chapterWeight, layoutScale } from "@/lib/director/weights";
import { photoMaterial, solidMaterial, type SolidUniforms } from "@/lib/ascii-engine/gl/solid-shader";

const IDS = chapters.map((c) => c.id);
const AZ = (24 * Math.PI) / 180;
const H: [number, number] = [Math.sin(AZ), Math.cos(AZ)];
const RIGHT: [number, number] = [H[1], -H[0]];
const ORIGIN: [number, number] = [260, -20]; // the music station's look target
// lateral offset ∝ depth keeps panels in the screen margin (see build.tsx)
const CAMERA_BACK = 645;
const MARGIN_RATIO = 0.54;

const PHOTOS = [
  ...new Set(events.flatMap((e) => e.media.filter((m) => m.type === "image").map((m) => m.src))),
].slice(0, 6);

// meteor field: an 8 × 6 wall of lights standing behind the gallery on the
// right (vertical, facing the camera — like angular's screen-filling field)
const COLS = 8, ROWS = 6, COUNT = COLS * ROWS, SPACING = 64;
const WAVES = [
  { at: 0.04, share: 0.05 },
  { at: 0.14, share: 0.15 },
  { at: 0.26, share: 0.25 },
  { at: 0.4, share: 1 }, // the rest
];
const FLIGHT = 0.1;         // share of the chapter a meteor spends flying in
const EXIT = [0.86, 0.97];  // everyone flies out together
const SPAWN = new Vector3(360, 360, 520);

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** deterministic shuffle so waves pick the same meteors every visit */
function seededOrder(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  let s = 1234567;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function MontyScene({ shared }: { shared: SolidUniforms }) {
  const { size } = useThree();
  const group = useRef<Group>(null);
  const panels = useRef<(Mesh | null)[]>([]);
  const meteors = useRef<InstancedMesh>(null);

  // ── photo panels ─────────────────────────────────────────────────────────
  const panelGeo = useMemo(() => {
    const g = new PlaneGeometry(1, 1);
    g.translate(0, 0.5, 0);
    g.rotateX(Math.PI / 2); // stand up: width on x, height on z, facing -y
    return g;
  }, []);
  const textures = useMemo<Texture[]>(() => {
    const loader = new TextureLoader();
    return PHOTOS.map((src) => loader.load(`/_next/image?url=${encodeURIComponent(src)}&w=128&q=75`));
  }, []);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  const panelMats = useMemo(() => textures.map((t) => photoMaterial(shared, t)), [shared, textures]);

  const layout = useMemo(
    () =>
      PHOTOS.map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const depth = 80 + i * 150;
        const lateral = MARGIN_RATIO * (CAMERA_BACK + depth);
        return {
          x: ORIGIN[0] + H[0] * depth + RIGHT[0] * side * lateral,
          y: ORIGIN[1] + H[1] * depth + RIGHT[1] * side * lateral,
          rot: AZ - side * 0.35, // turned in toward the path
        };
      }),
    [],
  );

  // ── meteors ──────────────────────────────────────────────────────────────
  const meteorMat = useMemo(() => solidMaterial(shared, 0.76, 0.5, true), [shared]);
  const meteorGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const plan = useMemo(() => {
    const order = seededOrder(COUNT);
    const start = new Float32Array(COUNT);
    let k = 0;
    for (const w of WAVES) {
      const n = w.share >= 1 ? COUNT - k : Math.max(1, Math.round(COUNT * w.share));
      for (let j = 0; j < n && k < COUNT; j++, k++) {
        start[order[k]] = w.at + ((order[k] * 0.618) % 1) * 0.06;
      }
    }
    // over the right margin, clear of the reading column
    const center = new Vector3(
      ORIGIN[0] + H[0] * 700 + RIGHT[0] * 760,
      ORIGIN[1] + H[1] * 700 + RIGHT[1] * 760,
      250,
    );
    const slots = Array.from({ length: COUNT }, (_, i) => {
      const c = i % COLS, r = Math.floor(i / COLS);
      const jitter = ((c * 7 + r * 13) % 5) * 9; // break the grid a little
      return new Vector3(
        center.x + RIGHT[0] * (c - (COLS - 1) / 2) * SPACING + H[0] * jitter,
        center.y + RIGHT[1] * (c - (COLS - 1) / 2) * SPACING + H[1] * jitter,
        center.z + (r - (ROWS - 1) / 2) * 56,
      );
    });
    return { start, slots };
  }, []);
  const tmp = useMemo(() => ({ o: new Object3D(), p: new Vector3(), dir: new Vector3() }), []);

  useFrame(() => {
    const st = journey.state;
    const w = chapterWeight("music", st.globalProgress, IDS, st.bounds);
    const g = group.current;
    if (!g) return;
    g.visible = w > 0.01;
    if (!g.visible) return;
    const ls = layoutScale(size.width);
    g.scale.set(ls, ls, 1);

    for (const m of panelMats) m.uniforms.uWeight.value = w;
    meteorMat.uniforms.uWeight.value = w;

    // panels rise in a stagger; aspect follows the loaded photo
    layout.forEach((_, i) => {
      const mesh = panels.current[i];
      if (!mesh) return;
      const img = textures[i].image as { width?: number; height?: number } | undefined;
      const aspect = img?.width && img?.height ? img.width / img.height : 4 / 3;
      const long = 230;
      const pw = aspect >= 1 ? long : long * aspect;
      const ph = aspect >= 1 ? long / aspect : long;
      const rise = smooth(clamp01(w * 1.6 - i * 0.1));
      mesh.scale.set(pw, 1, Math.max(ph * rise, 0.001));
      mesh.position.z = 24 * rise;
    });

    // meteors: progress through the music chapter drives the waves
    const im = meteors.current;
    if (!im) return;
    const i0 = IDS.indexOf("music");
    const s = st.bounds[i0] ?? 0;
    const e = st.bounds[i0 + 1] ?? 1;
    const u = (st.globalProgress - s) / Math.max(e - s, 1e-4);
    const out = clamp01((u - EXIT[0]) / (EXIT[1] - EXIT[0]));
    const { o, p, dir } = tmp;
    for (let i = 0; i < COUNT; i++) {
      const slot = plan.slots[i];
      const q = clamp01((u - plan.start[i]) / FLIGHT);
      if (q <= 0 || out >= 1) {
        o.scale.setScalar(0);
      } else {
        let stretch = 10;
        if (out > 0) {
          const x = easeOut(out);
          p.copy(slot).addScaledVector(SPAWN, -x);
          dir.copy(SPAWN).negate();
          stretch = 10 + 70 * Math.sin(Math.PI * out);
        } else {
          const qe = easeOut(q);
          p.copy(slot).addScaledVector(SPAWN, 1 - qe);
          dir.copy(SPAWN).negate();
          stretch = 10 + 70 * (1 - qe);
        }
        o.position.copy(p);
        o.lookAt(p.x + dir.x, p.y + dir.y, p.z + dir.z);
        o.scale.set(26, 26, stretch + 16); // ≥ a cell at wall distance, or it samples in and out
      }
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group} visible={false}>
      {layout.map((pl, i) => (
        <mesh
          key={PHOTOS[i]}
          ref={(el) => { panels.current[i] = el; }}
          geometry={panelGeo}
          material={panelMats[i]}
          position={[pl.x, pl.y, 0]}
          rotation={[0, 0, pl.rot]}
          frustumCulled={false}
        />
      ))}
      <instancedMesh
        ref={meteors}
        args={[meteorGeo, meteorMat, COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}
