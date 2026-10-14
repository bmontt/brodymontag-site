// ── vec ───────────────────────────────────────────────────────────────────────
// Three-free vectors for the laser uniforms. The 2D tier evaluates the laser
// layer on the CPU and must not pull three.js (~400 KB) onto every page's
// critical path just for uniform holders; the 3D tier hands these to three
// as-is — its uniform upload is duck-typed (it reads x/y/z/w, and toArray()
// for uniform arrays).

export class Vec2 {
  constructor(public x = 0, public y = 0) {}
  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }
  fromArray(a: ArrayLike<number>, o = 0) {
    this.x = a[o];
    this.y = a[o + 1];
    return this;
  }
  toArray(a: number[] | Float32Array | Float64Array = [], o = 0) {
    a[o] = this.x;
    a[o + 1] = this.y;
    return a;
  }
}

export class Vec4 {
  constructor(public x = 0, public y = 0, public z = 0, public w = 0) {}
  set(x: number, y: number, z: number, w: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }
  fromArray(a: ArrayLike<number>, o = 0) {
    this.x = a[o];
    this.y = a[o + 1];
    this.z = a[o + 2];
    this.w = a[o + 3];
    return this;
  }
  toArray(a: number[] | Float32Array | Float64Array = [], o = 0) {
    a[o] = this.x;
    a[o + 1] = this.y;
    a[o + 2] = this.z;
    a[o + 3] = this.w;
    return a;
  }
}
