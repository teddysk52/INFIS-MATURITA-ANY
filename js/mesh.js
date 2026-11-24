'use strict';
// =============================================================
//  mesh.js — MeshBuilder: skládá geometrii z kvádrů a čtverců
//  do jednoho velkého bufferu (rychlé vykreslení jedním voláním).
//  Formát vrcholu: pozice(3) normála(3) uv(2) vrstva(1) barva(4)
//  Barva.a = "emise" (svítí bez osvětlení: obrazovky, lampy).
// =============================================================
class MeshBuilder {
  constructor() { this.v = []; this.i = []; this.n = 0; }

  // čtyři rohy v pořadí: dole-vlevo, dole-vpravo, nahoře-vpravo, nahoře-vlevo (při pohledu zepředu)
  quad(a, b, c, d, layer, uv, col) {
    // normála z (b-a)×(d-a)
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const C = col || MeshBuilder.W;
    const P = [a, b, c, d];
    for (let k = 0; k < 4; k++) {
      const p = P[k];
      this.v.push(p[0], p[1], p[2], nx, ny, nz, uv[k * 2], uv[k * 2 + 1], layer, C[0], C[1], C[2], C[3] === undefined ? 0 : C[3]);
    }
    const n = this.n;
    this.i.push(n, n + 1, n + 2, n, n + 2, n + 3);
    this.n += 4;
  }

  // Kvádr. o = { tex: vrstva | {top,bottom,side,px,nx,pz,nz}, col, uv:'world'|'fit'|číslo(měřítko), skip:'tb..', uvr: [u0,v0,u1,v1] pro fit }
  box(x0, y0, z0, x1, y1, z1, o = {}) {
    const T = o.tex !== undefined ? o.tex : Tex.L('white');
    const tex = (f) => typeof T === 'number' ? T : (T[f] !== undefined ? T[f] : (f === 'py' && T.top !== undefined ? T.top : f === 'ny' && T.bottom !== undefined ? T.bottom : T.side !== undefined ? T.side : T.top));
    const col = o.col, skip = o.skip || '';
    const mode = o.uv === undefined ? 'world' : o.uv;
    const s = typeof mode === 'number' ? mode : 1;
    const fit = mode === 'fit';
    const r = o.uvr || [0, 0, 1, 1];
    const UV = (u0, v0, u1, v1) => fit ? [r[0], r[3], r[2], r[3], r[2], r[1], r[0], r[1]] : [u0 * s, v1 * s, u1 * s, v1 * s, u1 * s, v0 * s, u0 * s, v0 * s];
    // +X
    if (!skip.includes('px')) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], tex('px'), UV(-z1, -y1, -z0, -y0), col);
    if (!skip.includes('nx')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], tex('nx'), UV(z0, -y1, z1, -y0), col);
    if (!skip.includes('pz')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], tex('pz'), UV(x0, -y1, x1, -y0), col);
    if (!skip.includes('nz')) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], tex('nz'), UV(-x1, -y1, -x0, -y0), col);
    if (!skip.includes('py')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], tex('py'), fit ? UV() : [x0 * s, z1 * s, x1 * s, z1 * s, x1 * s, z0 * s, x0 * s, z0 * s], col);
    if (!skip.includes('ny')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], tex('ny'), fit ? UV() : [x0 * s, z0 * s, x1 * s, z0 * s, x1 * s, z1 * s, x0 * s, z1 * s], col);
  }

  // svislá stěna (obdélník) mezi body (ax,az)-(bx,bz), výška y0..y1, normála doleva od směru a->b
  wall(ax, az, bx, bz, y0, y1, layer, o = {}) {
    const len = Math.hypot(bx - ax, bz - az);
    const fit = o.uv === 'fit', s = typeof o.uv === 'number' ? o.uv : 1;
    const u0 = o.u0 !== undefined ? o.u0 : 0;
    const r = o.uvr || [0, 0, 1, 1];
    const uv = fit ? [r[0], r[3], r[2], r[3], r[2], r[1], r[0], r[1]] : [u0 * s, -y0 * s, (u0 + len) * s, -y0 * s, (u0 + len) * s, -y1 * s, u0 * s, -y1 * s];
    this.quad([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], layer, uv, o.col);
    if (o.double) this.quad([bx, y0, bz], [ax, y0, az], [ax, y1, az], [bx, y1, bz], layer, uv, o.col);
  }

  // vodorovná plocha (podlaha / strop)
  floor(x0, z0, x1, z1, y, layer, o = {}) {
    const s = typeof o.uv === 'number' ? o.uv : 1, fit = o.uv === 'fit';
    const uv = fit ? [0, 1, 1, 1, 1, 0, 0, 0] : [x0 * s, z1 * s, x1 * s, z1 * s, x1 * s, z0 * s, x0 * s, z0 * s];
    if (o.down) this.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], layer, [x0 * s, z0 * s, x1 * s, z0 * s, x1 * s, z1 * s, x0 * s, z1 * s], o.col);
    else this.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], layer, uv, o.col);
  }

  // válec (n-stěnný) pro sloupy, kmeny, lampy
  cyl(cx, cz, r, y0, y1, layer, o = {}) {
    const n = o.n || 8, col = o.col;
    for (let k = 0; k < n; k++) {
      const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2;
      const p0 = [cx + Math.cos(a0) * r, cz + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, cz + Math.sin(a1) * r];
      // normála ven: pořadí p1 -> p0
      this.quad([p1[0], y0, p1[1]], [p0[0], y0, p0[1]], [p0[0], y1, p0[1]], [p1[0], y1, p1[1]], layer, [k / n, 1, (k + 1) / n, 1, (k + 1) / n, 0, k / n, 0].map((v, i) => i % 2 === 0 ? v * (o.uScale || 1) : v * (o.vScale || 1)), col);
      if (o.cap) this.tri([cx, y1, cz], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]], o.capLayer !== undefined ? o.capLayer : layer, col);
    }
  }
  tri(a, b, c, layer, col, uv) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const C = col || MeshBuilder.W;
    const U = uv || [a[0], a[2], b[0], b[2], c[0], c[2]];
    [a, b, c].forEach((p, k) => this.v.push(p[0], p[1], p[2], nx, ny, nz, U[k * 2], U[k * 2 + 1], layer, C[0], C[1], C[2], C[3] || 0));
    this.i.push(this.n, this.n + 1, this.n + 2); this.n += 3;
  }

  get indexCount() { return this.i.length; }
  build(dynamic) { return GFX.createMesh(new Float32Array(this.v), new Uint32Array(this.i), dynamic); }
}
MeshBuilder.W = [1, 1, 1, 0];
