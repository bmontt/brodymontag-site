// ── laser-pack ────────────────────────────────────────────────────────────────
// The laser uniforms as one flat Float64Array (double, like the director —
// float32 would nudge cells at the stroke thresholds), so the 2D tier can hand a frame
// to its worker in a single small message (~3 KB). The layout is derived from
// makeLaserUniforms() on both sides, so it can't drift. The title mask texture
// travels separately (only when it changes).

import { makeLaserUniforms, type LaserUniforms } from "./gl/laser-shader";
import type { Vec2, Vec4 } from "./vec";

type Slot = { key: keyof LaserUniforms; kind: "n" | "v2" | "v4" | "a"; len: number; stride: number };

const LAYOUT: Slot[] = [];
let SIZE = 0;
{
  const u = makeLaserUniforms() as unknown as Record<string, { value: unknown }>;
  for (const key of Object.keys(u)) {
    if (key === "uTitleTex") continue;
    const v = u[key].value;
    const k = key as keyof LaserUniforms;
    const slot: Slot =
      typeof v === "number" ? { key: k, kind: "n", len: 1, stride: 1 }
      : Array.isArray(v) ? { key: k, kind: "a", len: v.length * ("w" in v[0] ? 4 : 2), stride: "w" in v[0] ? 4 : 2 }
      : "w" in (v as object) ? { key: k, kind: "v4", len: 4, stride: 4 }
      : { key: k, kind: "v2", len: 2, stride: 2 };
    LAYOUT.push(slot);
    SIZE += slot.len;
  }
}
export const LASER_PACK_SIZE = SIZE;

export function packLaser(u: LaserUniforms, out: Float64Array) {
  const r = u as unknown as Record<string, { value: unknown }>;
  let o = 0;
  for (const s of LAYOUT) {
    const v = r[s.key].value;
    if (s.kind === "n") out[o] = v as number;
    else if (s.kind === "a") (v as (Vec2 | Vec4)[]).forEach((x, i) => x.toArray(out, o + i * s.stride));
    else (v as Vec2 | Vec4).toArray(out, o);
    o += s.len;
  }
}

export function unpackLaser(buf: Float64Array, u: LaserUniforms) {
  const r = u as unknown as Record<string, { value: unknown }>;
  let o = 0;
  for (const s of LAYOUT) {
    if (s.kind === "n") r[s.key].value = buf[o];
    else if (s.kind === "a") (r[s.key].value as (Vec2 | Vec4)[]).forEach((x, i) => x.fromArray(buf, o + i * s.stride));
    else (r[s.key].value as Vec2 | Vec4).fromArray(buf, o);
    o += s.len;
  }
}
