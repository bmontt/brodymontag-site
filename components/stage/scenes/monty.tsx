"use client";

// ── scene: monty (music chapter) ──────────────────────────────────────────────
// The warm side of the sheet. Event photos stand as panels whose glyph levels
// follow the photo's luminance (ASCII photography), flanking the camera's path
// like a gallery (lib/director/layouts.ts). Hovering/focusing a show — or being
// on its page — lights its panel. Overhead, angular.dev's meteor shower: glyph
// streaks fly in over four waves (5% / 15% / 25% / the rest), hold as a wall
// of lights, and all fly out together as the chapter ends.
// Photos load through the Next image optimizer at 128px (q=75: Next 16 allows
// only 75 by default) — a panel needs a few dozen cells of detail, not a 4000px
// decode.

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BoxGeometry,
  MathUtils,
  Object3D,
  PlaneGeometry,
  TextureLoader,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
  type Texture,
} from "three";
import { chapters } from "@/lib/chapters";
import { journey } from "@/lib/journey-store";
import { MONTY, PANELS } from "@/lib/director/layouts";
import { layoutScale, sceneWeight } from "@/lib/director/weights";
import { photoMaterial, solidMaterial, type SolidUniforms } from "@/lib/ascii-engine/gl/solid-shader";

const IDS = chapters.map((c) => c.id);

// meteor wall: 8 × 6, standing over the right margin behind the gallery
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
const SETTLED_U = 0.6;      // detail pages hold the wall fully formed

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
  const glow = useRef(PANELS.map(() => 0));

  // ── photo panels ─────────────────────────────────────────────────────────
  const panelGeo = useMemo(() => {
    const g = new PlaneGeometry(1, 1);
    g.translate(0, 0.5, 0);
    g.rotateX(Math.PI / 2); // stand up: width on x, height on z, facing -y
    return g;
  }, []);
  const textures = useMemo<Texture[]>(() => {
    const loader = new TextureLoader();
    return PANELS.map((p) => loader.load(`/_next/image?url=${encodeURIComponent(p.src)}&w=128&q=75`));
  }, []);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  const panelMats = useMemo(() => textures.map((t) => photoMaterial(shared, t)), [shared, textures]);

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
    const { origin, h, right } = MONTY;
    const center = new Vector3(origin[0] + h[0] * 700 + right[0] * 760, origin[1] + h[1] * 700 + right[1] * 760, 250);
    const slots = Array.from({ length: COUNT }, (_, i) => {
      const c = i % COLS, r = Math.floor(i / COLS);
      const jitter = ((c * 7 + r * 13) % 5) * 9; // break the grid a little
      return new Vector3(
        center.x + right[0] * (c - (COLS - 1) / 2) * SPACING + h[0] * jitter,
        center.y + right[1] * (c - (COLS - 1) / 2) * SPACING + h[1] * jitter,
        center.z + (r - (ROWS - 1) / 2) * 56,
      );
    });
    return { start, slots };
  }, []);
  const tmp = useMemo(() => ({ o: new Object3D(), p: new Vector3(), dir: new Vector3() }), []);

  useFrame((_, delta) => {
    const st = journey.state;
    const w = sceneWeight("music", st, IDS);
    const g = group.current;
    if (!g) return;
    g.visible = w > 0.01;
    if (!g.visible) return;
    const ls = layoutScale(size.width);
    g.scale.set(ls, ls, 1);
    meteorMat.uniforms.uWeight.value = w;
    const { route, hover } = st.focus;

    // panels: rise in a stagger, aspect follows the loaded photo, lit on hover
    PANELS.forEach((pn, i) => {
      const mesh = panels.current[i];
      if (!mesh) return;
      const lit = (hover !== null && pn.ids.includes(hover)) || (route.kind === "show" && route.index === i) ? 1 : 0;
      glow.current[i] = MathUtils.damp(glow.current[i], lit, 8, Math.min(delta, 0.1));
      const u = panelMats[i].uniforms;
      u.uWeight.value = w;
      u.uEmphasis.value = 2.0 + (route.kind === "home" ? 1.8 : 0.8) * glow.current[i];
      const img = textures[i].image as { width?: number; height?: number } | undefined;
      const aspect = img?.width && img?.height ? img.width / img.height : 4 / 3;
      const long = 230 * (1 + 0.08 * glow.current[i]);
      const pw = aspect >= 1 ? long : long * aspect;
      const ph = aspect >= 1 ? long / aspect : long;
      const rise = smooth(clamp01(w * 1.6 - i * 0.1));
      mesh.scale.set(pw, 1, Math.max(ph * rise, 0.001));
      mesh.position.z = 24 * rise;
    });

    // meteors: progress through the music chapter drives the waves
    const im = meteors.current;
    if (!im) return;
    let u = SETTLED_U;
    if (route.kind === "home") {
      const i0 = IDS.indexOf("music");
      const s = st.bounds[i0] ?? 0;
      const e = st.bounds[i0 + 1] ?? 1;
      u = (st.globalProgress - s) / Math.max(e - s, 1e-4);
    }
    const out = clamp01((u - EXIT[0]) / (EXIT[1] - EXIT[0]));
    const { o, p, dir } = tmp;
    for (let i = 0; i < COUNT; i++) {
      const slot = plan.slots[i];
      const q = clamp01((u - plan.start[i]) / FLIGHT);
      if (q <= 0 || out >= 1) {
        o.scale.setScalar(0);
      } else {
        let stretch: number;
        if (out > 0) {
          p.copy(slot).addScaledVector(SPAWN, -easeOut(out));
          stretch = 10 + 70 * Math.sin(Math.PI * out);
        } else {
          const qe = easeOut(q);
          p.copy(slot).addScaledVector(SPAWN, 1 - qe);
          stretch = 10 + 70 * (1 - qe);
        }
        dir.copy(SPAWN).negate();
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
      {PANELS.map((pn, i) => (
        <mesh
          key={pn.src}
          ref={(el) => { panels.current[i] = el; }}
          geometry={panelGeo}
          material={panelMats[i]}
          position={[pn.x, pn.y, 0]}
          rotation={[0, 0, pn.rot]}
          frustumCulled={false}
        />
      ))}
      <instancedMesh ref={meteors} args={[meteorGeo, meteorMat, COUNT]} frustumCulled={false} />
    </group>
  );
}
