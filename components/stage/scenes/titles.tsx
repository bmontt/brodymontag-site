"use client";

// ── scene: titles ─────────────────────────────────────────────────────────────
// Field-native kinetic type (docs/design-inspiration.md #2): as the camera
// arrives at a chapter, its word (content.json journey.<id>.word) assembles out
// of scattered glyph cells on a plane standing on the sheet, holds, then
// dissolves back as reading begins — angular.dev's headline reveal, written in
// the ASCII field's own language. The DOM headings stay the accessible text.
// Each word stands at its chapter's *destination*: on the line of sight of the
// camera pose the director (HOME_TRACK) reaches at that chapter's first
// station, a little in front of its look target, facing it — so the camera
// flies into a view with the word centered, however fast it was sweeping when
// the reveal began.

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, PlaneGeometry, type Group, type Mesh } from "three";
import { content } from "@/lib/content";
import { chapters } from "@/lib/chapters";
import { journey } from "@/lib/journey-store";
import { layoutScale } from "@/lib/director/weights";
import { FLAT, poseAt, resolveTrack, type Pose } from "@/lib/director/rig";
import { HOME_TRACK } from "@/lib/director/stations";
import { faceRotation } from "@/lib/director/layouts";
import { titleMaterial, type SolidUniforms } from "@/lib/ascii-engine/gl/solid-shader";

const IDS = chapters.map((c) => c.id);
const WIDTH = 680; // world px
const DEG = Math.PI / 180;
const MASK_W = 1024, MASK_H = 256;

const words = content.journey as Record<string, { word?: string }>;
// each chapter's first camera station (lib/director/stations.ts HOME_TRACK) and
// how far past (+) or short of (−) its look target the word stands — tuned so
// the word fills the middle of the frame at that station's elevation
const PLACES = [
  { id: "code", station: 0.15, beyond: -220 },
  { id: "music", station: 0.2, beyond: -220 },
  // timeline: no title — its pinned DOM track already carries giant year numerals
  { id: "epilogue", station: 0.05, beyond: -220 },
].filter((p) => words[p.id]?.word);

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function wordMask(word: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = MASK_W;
  canvas.height = MASK_H;
  const tex = new CanvasTexture(canvas);
  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const family =
      getComputedStyle(document.documentElement).getPropertyValue("--font-neue").trim() || "sans-serif";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, MASK_W, MASK_H);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = 200;
    ctx.font = `500 ${size}px ${family}`;
    const w = ctx.measureText(word.toUpperCase()).width;
    if (w > MASK_W * 0.94) size = Math.floor((size * MASK_W * 0.94) / w);
    ctx.font = `500 ${size}px ${family}`;
    ctx.fillText(word.toUpperCase(), MASK_W / 2, MASK_H / 2 + size * 0.04);
    tex.needsUpdate = true;
  };
  draw();
  document.fonts.ready.then(draw); // redraw once Neue Haas is in
  return tex;
}

export default function TitlesScene({ shared }: { shared: SolidUniforms }) {
  const { size } = useThree();
  const group = useRef<Group>(null);
  const meshes = useRef<(Mesh | null)[]>([]);
  const placedFor = useRef<number[] | null>(null);
  const pose = useMemo<Pose>(() => ({ ...FLAT }), []);

  const geometry = useMemo(() => {
    const g = new PlaneGeometry(1, 1);
    g.translate(0, 0.5, 0);
    g.rotateX(Math.PI / 2); // stand up: width on x, height on z, facing -y
    return g;
  }, []);
  const masks = useMemo(() => PLACES.map((p) => wordMask(words[p.id].word!)), []);
  useEffect(() => () => masks.forEach((m) => m.dispose()), [masks]);
  const materials = useMemo(
    () => masks.map((m) => titleMaterial(shared, m, [96, 24])),
    [shared, masks],
  );

  useFrame(() => {
    const st = journey.state;
    const g = group.current;
    if (!g) return;
    // titles belong to the journey; detail pages park elsewhere
    if (st.focus.route.kind !== "home" || st.bounds.length !== IDS.length) {
      g.visible = false;
      return;
    }
    const ls = layoutScale(size.width);
    g.scale.setScalar(ls);
    const p = st.globalProgress;

    // (re)place the words whenever the layout's chapter bounds change
    if (placedFor.current !== st.bounds) {
      placedFor.current = st.bounds;
      const track = resolveTrack(HOME_TRACK, IDS, st.bounds);
      PLACES.forEach((pl, k) => {
        const m = meshes.current[k];
        if (!m) return;
        const i = IDS.indexOf(pl.id);
        const s = st.bounds[i];
        const e = i + 1 < st.bounds.length ? st.bounds[i + 1] : 1;
        poseAt(track, s + (e - s) * pl.station, size.height, pose);
        const hx = Math.sin(pose.az * DEG), hy = Math.cos(pose.az * DEG);
        m.position.set(pose.tx + hx * pl.beyond, pose.ty + hy * pl.beyond, 20);
        m.rotation.set(0, 0, faceRotation(-hx, -hy)); // face back along the heading
      });
    }
    let any = false;
    PLACES.forEach((pl, k) => {
      const m = meshes.current[k];
      if (!m) return;
      const i = IDS.indexOf(pl.id);
      const s = st.bounds[i];
      const prev = i > 0 ? st.bounds[i - 1] : 0;
      const next = i + 1 < st.bounds.length ? st.bounds[i + 1] : 1;
      const before = Math.max(s - prev, 1e-4);
      const len = Math.max(next - s, 1e-4);
      // assemble while arriving, peak as the camera settles, dissolve as reading begins
      const reveal = smooth(s - 0.25 * before, s + 0.08 * len, p) * (1 - smooth(s + 0.2 * len, s + 0.36 * len, p));
      const u = materials[k].uniforms;
      u.uReveal.value = reveal;
      u.uWeight.value = Math.min(1, reveal * 1.5);
      m.visible = reveal > 0.01;
      any ||= m.visible;
    });
    g.visible = any;
  });

  return (
    <group ref={group} visible={false}>
      {PLACES.map((pl, k) => (
        <mesh
          key={pl.id}
          ref={(el) => { meshes.current[k] = el; }}
          geometry={geometry}
          material={materials[k]}
          scale={[WIDTH, 1, (WIDTH * MASK_H) / MASK_W]}
          frustumCulled={false}
          visible={false}
        />
      ))}
    </group>
  );
}
