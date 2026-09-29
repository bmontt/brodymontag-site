/* ─── ASCII engine (GL) — three-pass renderer ───────────────────────────────── */

import {
  DataUtils,
  HalfFloatType,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type CanvasTexture,
  type PerspectiveCamera,
  type WebGLRenderer,
} from "three";
import { cellFragment, composeFragment, quadVertex, TRAIL_MAX } from "./ascii-shaders";
import { GLYPHS, buildGlyphAtlas, parseStyle, slotWidth } from "./atlas";
import { makeSkinUniforms, type SkinUniforms } from "./skin-uniforms";

export { TRAIL_MAX };

export interface AsciiRendererOptions {
  styles: readonly string[];
  bg: Vector3;
  repelR: number;
  repelCore: number;
  shimmerMin: number;
  lightSharpness: number;
  glowThresholdFrac: number;
}

function quad(material: ShaderMaterial): Scene {
  const scene = new Scene();
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  return scene;
}

function cellTarget(): WebGLRenderTarget {
  return new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: false,
    generateMipmaps: false,
  });
}

/**
 * Renders any three.js scene as the site's ASCII field. The scene's materials
 * write (amplitude, facing, presence) into r/g/b; see ascii-shaders.ts.
 */
export class AsciiRenderer {
  readonly skin: SkinUniforms;
  /** per-frame inputs (trail, hue phase, flash) — mutate in place */
  readonly frame = {
    uTrail: { value: Array.from({ length: TRAIL_MAX }, () => new Vector3()) },
    uHuePhase: 0,
    uFlash: { value: 0 },
    uFlashSlot: { value: 0 },
  };

  private readonly sceneRT = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: true,
    generateMipmaps: false,
  });
  private readonly cellRT = cellTarget();
  private readonly cellMat: ShaderMaterial;
  private readonly composeMat: ShaderMaterial;
  private readonly cellScene: Scene;
  private readonly composeScene: Scene;
  private readonly quadCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  private viewW = 1;
  private viewH = 1;
  cols = 1;
  rows = 1;
  private cellW = 8;
  private cellH = 22;
  private atlasKey = "";

  constructor(private readonly gl: WebGLRenderer, o: AsciiRendererOptions) {
    this.skin = makeSkinUniforms(o.lightSharpness, o.glowThresholdFrac);
    const grid = { value: new Vector2(1, 1) };
    const cell = { value: new Vector2(8, 22) };

    this.cellMat = new ShaderMaterial({
      vertexShader: quadVertex,
      fragmentShader: cellFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        ...this.skin,
        uScene: { value: this.sceneRT.texture },
        uGrid: grid,
        uCell: cell,
        uShimmerMin: { value: o.shimmerMin },
        uTrail: this.frame.uTrail,
        uRepel: { value: new Vector2(o.repelR, o.repelCore) },
      },
    });

    this.composeMat = new ShaderMaterial({
      vertexShader: quadVertex,
      fragmentShader: composeFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uCells: { value: this.cellRT.texture },
        uAtlas: { value: null },
        uViewport: { value: new Vector2(1, 1) },
        uDpr: { value: 1 },
        uCell: cell,
        uGrid: grid,
        uSlotW: { value: 16 },
        uSlotCount: { value: GLYPHS.length },
        uBg: { value: o.bg },
        uStyles: { value: o.styles.map((s) => new Vector4(...parseStyle(s))) },
        uLight: this.skin.uLight,
        uHue: { value: new Vector3(0, 0, 0.58) },
        uFlash: this.frame.uFlash,
        uFlashSlot: this.frame.uFlashSlot,
      },
    });

    this.cellScene = quad(this.cellMat);
    this.composeScene = quad(this.composeMat);
  }

  /** Resize targets + grid. Rebuilds the glyph atlas when cell/dpr change. */
  setSize(viewW: number, viewH: number, dpr: number, cellW: number, cellH: number): void {
    this.viewW = viewW;
    this.viewH = viewH;
    this.cellW = cellW;
    this.cellH = cellH;
    this.cols = Math.ceil(viewW / cellW);
    this.rows = Math.ceil(viewH / cellH);
    this.sceneRT.setSize(this.cols, this.rows);
    this.cellRT.setSize(this.cols, this.rows);

    const u = this.composeMat.uniforms;
    (u.uGrid.value as Vector2).set(this.cols, this.rows);
    (u.uCell.value as Vector2).set(cellW, cellH);
    (u.uViewport.value as Vector2).set(viewW, viewH);
    u.uDpr.value = dpr;
    u.uSlotW.value = slotWidth(cellW);

    const key = `${cellW}x${cellH}@${dpr}`;
    if (key !== this.atlasKey) {
      this.atlasKey = key;
      document.fonts.ready.then(() => {
        if (this.atlasKey !== key) return; // superseded by a later resize
        const prev = u.uAtlas.value as CanvasTexture | null;
        u.uAtlas.value = buildGlyphAtlas(cellW, cellH, dpr);
        prev?.dispose();
      });
    }
  }

  get ready(): boolean {
    return this.composeMat.uniforms.uAtlas.value !== null;
  }

  render(scene: Scene, camera: PerspectiveCamera): void {
    const gl = this.gl;
    const prevTarget = gl.getRenderTarget();

    // pass 1 — one fragment per cell, exactly at the cell center: widen the
    // frustum (top-left anchored) to cols·cellW × rows·cellH css px
    camera.setViewOffset(this.viewW, this.viewH, 0, 0, this.cols * this.cellW, this.rows * this.cellH);
    gl.setRenderTarget(this.sceneRT);
    gl.clear();
    gl.render(scene, camera);
    camera.clearViewOffset();

    // pass 2 — per-cell logic
    (this.composeMat.uniforms.uHue.value as Vector3).set(
      this.frame.uHuePhase,
      this.skin.uHueBias.value,
      this.skin.uSat.value,
    );
    gl.setRenderTarget(this.cellRT);
    gl.render(this.cellScene, this.quadCam);

    // pass 3 — glyphs to screen
    gl.setRenderTarget(prevTarget);
    gl.render(this.composeScene, this.quadCam);
  }

  /** Debug/parity: the per-cell level grid (y-down rows) of the last frame. */
  readLevels(): Uint8Array {
    const { cols, rows } = this;
    const raw = new Uint16Array(cols * rows * 4);
    this.gl.readRenderTargetPixels(this.cellRT, 0, 0, cols, rows, raw);
    const out = new Uint8Array(cols * rows);
    for (let ty = 0; ty < rows; ty++) {
      const row = rows - 1 - ty;
      for (let col = 0; col < cols; col++) {
        const i = (ty * cols + col) * 4;
        const slot = DataUtils.fromHalfFloat(raw[i]);
        out[row * cols + col] = slot > 0.5 ? Math.round(DataUtils.fromHalfFloat(raw[i + 1])) : 0;
      }
    }
    return out;
  }

  dispose(): void {
    this.sceneRT.dispose();
    this.cellRT.dispose();
    this.cellMat.dispose();
    this.composeMat.dispose();
    (this.composeMat.uniforms.uAtlas.value as CanvasTexture | null)?.dispose();
  }
}
