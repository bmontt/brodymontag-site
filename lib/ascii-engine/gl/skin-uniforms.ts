/* ─── ASCII engine (GL) — skin → uniforms ───────────────────────────────────── */

import { Vector4 } from "three";
import { lerpSkin, type EraSkin } from "../skins";
import { skinSlots } from "./atlas";

/**
 * The same blend contract as the 2D vessel: numeric skin fields lerp
 * continuously (lerpSkin), while the discrete ones — glyph vocabulary and level
 * LUT — dither per cell between skin A and skin B by a stable hash vs `t`, so
 * the vocabulary dissolves instead of popping.
 */
export interface SkinUniforms {
  uLutA: { value: number[] };
  uLutB: { value: number[] };
  uSlotsA: { value: number[] };
  uSlotsB: { value: number[] };
  uBlendT: { value: number };
  uDim: { value: number };
  uDensity: { value: number };
  /** centerX px (<0 = no carve), half-width px, calm, edge px */
  uCarve: { value: Vector4 };
  /** sharpness, strength, glowThresholdFrac, glowStrength */
  uLight: { value: Vector4 };
  uHueBias: { value: number };
  uSat: { value: number };
}

export function makeSkinUniforms(lightSharpness: number, glowThresholdFrac: number): SkinUniforms {
  return {
    uLutA: { value: [0, 1, 2, 3, 4, 5] },
    uLutB: { value: [0, 1, 2, 3, 4, 5] },
    uSlotsA: { value: [0, 0, 0, 0, 0, 0] },
    uSlotsB: { value: [0, 0, 0, 0, 0, 0] },
    uBlendT: { value: 0 },
    uDim: { value: 1 },
    uDensity: { value: 1 },
    uCarve: { value: new Vector4(-1, 0, 0, 1) },
    uLight: { value: new Vector4(lightSharpness, 0.26, glowThresholdFrac, 0.55) },
    uHueBias: { value: 0 },
    uSat: { value: 0.58 },
  };
}

function carveCenter(mode: EraSkin["carve"]["mode"], viewW: number): number {
  switch (mode) {
    case "none":  return -1;
    case "left":  return viewW * 0.28;
    case "right": return viewW * 0.72;
    default:      return viewW / 2;
  }
}

/**
 * Write the blend of skins A→B at t into the uniforms. `intensity` scales the
 * field (the 3D stations lift it so tilted views keep presence).
 */
export function applySkinBlend(
  u: SkinUniforms,
  a: EraSkin,
  b: EraSkin,
  t: number,
  viewW: number,
  intensity = 1,
): void {
  const s = lerpSkin(a, b, t);
  const differs = a.chars !== b.chars || a.levelLut !== b.levelLut;
  const bSkin = differs ? b : a;

  u.uLutA.value.splice(0, 6, ...a.levelLut);
  u.uLutB.value.splice(0, 6, ...bSkin.levelLut);
  u.uSlotsA.value.splice(0, 6, ...skinSlots(a));
  u.uSlotsB.value.splice(0, 6, ...skinSlots(bSkin));
  u.uBlendT.value = differs && t > 0 && t < 1 ? t : t >= 1 && differs ? 1 : 0;

  u.uDim.value = s.styleAlphaMul * intensity;
  u.uDensity.value = s.density;
  const half = s.carve.width * viewW;
  const cx = s.carve.calm > 0 ? carveCenter(s.carve.mode, viewW) : -1;
  u.uCarve.value.set(cx, half, s.carve.calm, Math.max(half * 0.5, 1));
  u.uLight.value.y = s.lightStrength;
  u.uLight.value.w = s.glowStrength;
  u.uHueBias.value = s.lightHueBias;
  u.uSat.value = s.lightSat;
}
