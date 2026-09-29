/* ─── ASCII engine (GL) — two-body wave sheet ───────────────────────────────── */

/**
 * GPU port of bake.ts#precompute. The sheet lives in the XY plane in *pixel
 * units* (1 world unit = 1 CSS px of the reference viewport) so every constant
 * in asciiConfig keeps its meaning. Internally the math runs in the 2D engine's
 * y-down convention, so a top-down, near-orthographic view reproduces the
 * canvas field cell for cell.
 *
 * Amplitude is evaluated per FRAGMENT: the ASCII pass samples cell centers,
 * and a per-fragment value at a cell center is exact (no vertex interpolation).
 * Height is displaced per VERTEX for the 3D relief.
 *
 * Output channels (read by the ASCII effect):
 *   r = amplitude 0–1        (→ ampToLevel thresholds in the pass)
 *   g = light facing 0–1     (→ directional specular)
 *   b = presence 0–1         (distance fade; 0 = empty background)
 */

const FIELD_COMMON = /* glsl */ `
uniform float uTau;        // loop phase τ ∈ [0,1)
uniform float uMinWH;      // min(viewW, viewH) of the reference viewport
uniform vec2  uOrbitFrac;  // (lo, hi)
uniform vec2  uWaveFreq;   // (lo, hi)
uniform float uKwave;
uniform float uKosc;
uniform vec2  uLens;       // (lensR, lensG)
uniform float uMerge;      // inspiral 0→1: orbit decays to 0 while the frequency chirps up
uniform float uRing;       // ringdown 0→1: single-source waves from the merged remnant

const float TWO_PI = 6.283185307179586;

float lensR(float r) {
  if (r < uLens.x) { float k = 1.0 - r / uLens.x; return r / (1.0 + uLens.y * k * k); }
  return r;
}

// signed two-body interference at y-down point p (px, field-centered)
float fieldWave(vec2 p) {
  float s      = (1.0 - cos(TWO_PI * uKosc * uTau)) * 0.5;
  float m      = clamp(uMerge, 0.0, 1.0);
  float orbitR = uMinWH * mix(uOrbitFrac.x, uOrbitFrac.y, s) * (1.0 - m);
  float wf     = mix(uWaveFreq.x, uWaveFreq.y, s) * (1.0 + 1.4 * m * m);   // chirp
  float theta  = TWO_PI * uTau;
  float psi    = TWO_PI * uKwave * uTau;
  vec2  b1     = orbitR * vec2(cos(theta), sin(theta));
  vec2  d1     = p - b1;
  vec2  d2     = p + b1;
  float binary = sin(wf * lensR(length(d1)) - psi + atan(d1.y, d1.x))
               + sin(wf * lensR(length(d2)) - psi + atan(d2.y, d2.x));
  if (uRing <= 0.0) return binary;
  // ringdown: concentric waves from the remnant, fading with distance
  float r    = length(p);
  float ring = 2.0 * sin(wf * lensR(r) - psi) * exp(-r / (uMinWH * 1.1));
  return mix(binary, ring, clamp(uRing, 0.0, 1.0));
}
`;

export const waveVertex = /* glsl */ `
${FIELD_COMMON}
uniform float uHeight;
varying vec3 vWorld;
varying vec2 vField;   // y-down field coords

void main() {
  vec3 pos = position;
  vec2 p   = vec2(pos.x, -pos.y);
  pos.z   += fieldWave(p) * 0.5 * uHeight;
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorld = world.xyz;
  vField = p;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const waveFragment = /* glsl */ `
${FIELD_COMMON}
uniform float uHeight;
uniform vec2  uLightDir;    // unit vector, y-down screen convention (as draw.ts)
uniform float uRealNormals; // 0 = radial normals (2D parity), 1 = surface normals
uniform vec2  uFade;        // (near, far) camera distance for presence fade
varying vec3 vWorld;
varying vec2 vField;

void main() {
  float w   = fieldWave(vField);
  float amp = min(abs(w) * 0.5, 1.0);

  // radial "outward from center" normal — what the 2D engine uses
  vec2 radial = length(vField) > 0.0 ? normalize(vField) : vec2(0.0);
  float facingFlat = max(dot(radial, uLightDir), 0.0);

  // true surface normal from the height gradient (finite difference) —
  // skipped entirely on the flat station (4 extra field evaluations)
  float facing = facingFlat;
  if (uRealNormals > 0.0) {
    float e  = 1.5;
    float hx = (fieldWave(vField + vec2(e, 0.0)) - fieldWave(vField - vec2(e, 0.0))) * 0.25 * uHeight / e;
    float hy = (fieldWave(vField + vec2(0.0, e)) - fieldWave(vField - vec2(0.0, e))) * 0.25 * uHeight / e;
    vec3  n  = normalize(vec3(-hx, -hy, 1.0));
    vec3  L  = normalize(vec3(uLightDir, 0.55));
    facing = mix(facingFlat, max(dot(n, L), 0.0), uRealNormals);
  }

  float dist     = distance(cameraPosition, vWorld);
  float presence = 1.0 - smoothstep(uFade.x, uFade.y, dist);

  gl_FragColor = vec4(amp, facing, presence, 1.0);
}
`;
