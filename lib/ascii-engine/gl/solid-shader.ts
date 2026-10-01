/* ─── ASCII engine (GL) — scene object materials ────────────────────────────── */

import { DoubleSide, ShaderMaterial, Vector2, type Texture } from "three";

/**
 * Materials for everything that stands on the sheet. Like the sheet they
 * write (amplitude, light facing, presence) into r/g/b, so the ASCII passes
 * render objects in the same glyph language:
 *   amplitude → glyph level (lit faces rise toward ◆, turned-away faces fall
 *               toward ∘/╌ — keep ≤ 0.8: above 0.82 a cell reads as empty)
 *   facing    → the tinted specular/glow
 *   presence  → distance fade × the scene's visibility weight × emphasis (>1
 *               marks an object: brighter, and only partly calmed by the
 *               reading-column carve — solid blocks are less noisy than the field)
 * The light is the field's stochastic light (uLightDir, y-down field
 * convention), converted to world space so objects and sheet agree.
 */

export interface SolidUniforms {
  uLightDir: { value: Vector2 };
  uFade: { value: Vector2 };
}

const vertex = /* glsl */ `
varying vec3 vN;
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const instancedVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const LIGHT = /* glsl */ `
uniform vec2  uLightDir;
uniform vec2  uFade;
uniform float uWeight;
uniform float uEmphasis;   // presence > 1 marks a scene object (brighter; half-exempt from the carve)
varying vec3 vN;
varying vec3 vWorld;
varying vec2 vUv;
float lambert() {
  vec3 L = normalize(vec3(uLightDir.x, -uLightDir.y, 0.55));   // field y-down → world y-up
  vec3 n = normalize(vN);
  return max(dot(gl_FrontFacing ? n : -n, L), 0.0);
}
float presence() {
  return (1.0 - smoothstep(uFade.x, uFade.y, distance(cameraPosition, vWorld))) * uWeight * uEmphasis;
}
`;

const solidFragment = /* glsl */ `
uniform float uTone;   // amplitude on fully lit faces
uniform float uShade;  // amplitude on faces turned from the light
${LIGHT}
void main() {
  float lam = lambert();
  // sqrt: a broader highlight than the sheet's, so more faces catch the light
  gl_FragColor = vec4(mix(uShade, uTone, lam), sqrt(lam), presence(), 1.0);
}
`;

const photoFragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uTone;
${LIGHT}
void main() {
  float lam = lambert();
  vec3 c = texture2D(uMap, vUv).rgb;
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  // photo luminance → glyph level. Club photos are mostly dark, so stretch the
  // contrast over the whole glyph range instead of mapping linearly.
  float amp = 0.12 + smoothstep(0.04, 0.55, lum) * (uTone - 0.12) * (0.85 + 0.15 * lam);
  // bright parts of the photo catch the light, so the picture reads as light
  // and dark glyphs rather than one uniform tone
  float facing = 0.55 + 0.45 * smoothstep(0.04, 0.55, lum);
  // a ◆ frame (≥ one cell thick at gallery distance) so the panel reads as a picture
  vec2 edge = min(vUv, 1.0 - vUv);
  if (min(edge.x, edge.y) < 0.11) { amp = 0.72; facing = 0.9; }
  gl_FragColor = vec4(amp, facing, presence(), 1.0);
}
`;

/** A solid that renders as glyph slabs: lit faces bright, shadowed faces sparse. */
export function solidMaterial(shared: SolidUniforms, tone = 0.72, shade = 0.3, instanced = false) {
  return new ShaderMaterial({
    vertexShader: instanced ? instancedVertex : vertex,
    fragmentShader: solidFragment,
    side: DoubleSide,
    uniforms: {
      uLightDir: shared.uLightDir,
      uFade: shared.uFade,
      uWeight: { value: 0 },
      uEmphasis: { value: 2.2 },
      uTone: { value: tone },
      uShade: { value: shade },
    },
  });
}

/** A panel whose glyph levels follow a photo's luminance — ASCII photography. */
export function photoMaterial(shared: SolidUniforms, map: Texture, tone = 0.72) {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: photoFragment,
    side: DoubleSide,
    uniforms: {
      uLightDir: shared.uLightDir,
      uFade: shared.uFade,
      uWeight: { value: 0 },
      uEmphasis: { value: 2.0 },
      uTone: { value: tone },
      uMap: { value: map },
    },
  });
}
