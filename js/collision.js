'use strict';
// =============================================================
//  collision.js — kolizní mřížka 0,5 m. Každá buňka má výšku
//  překážky (0 = volno). Navíc seznam dynamických bariér.
// =============================================================
const Col = (() => {
  const CELL = 0.5, X0 = -110, Z0 = -110, W = 540, H = 440; // x -110..160, z -110..110
  const hgt = new Uint8Array(W * H);  // výška v decimetrech
  const extra = []; // dynamické AABB {x0,z0,x1,z1,h,id}

  function ix(x) { return Math.floor((x - X0) / CELL); }
  function iz(z) { return Math.floor((z - Z0) / CELL); }
  function addBox(x0, z0, x1, z1, h = 3) {
    if (x0 > x1) [x0, x1] = [x1, x0]; if (z0 > z1) [z0, z1] = [z1, z0];
    // buňka je pevná, když její střed leží v kvádru (přesnější průchody mezi lavicemi);
    // tenké věci (sklo, sloupy) dostanou aspoň jednu buňku
    let a = Math.ceil((x0 - X0) / CELL - 0.5), b = Math.floor((x1 - X0) / CELL - 0.5);
    let c = Math.ceil((z0 - Z0) / CELL - 0.5), d = Math.floor((z1 - Z0) / CELL - 0.5);
    if (a > b) a = b = ix((x0 + x1) / 2);
    if (c > d) c = d = iz((z0 + z1) / 2);
    a = Math.max(0, a); b = Math.min(W - 1, b); c = Math.max(0, c); d = Math.min(H - 1, d);
    const hv = Math.min(255, Math.round(h * 10));
    for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) if (hgt[j * W + i] < hv) hgt[j * W + i] = hv;
  }
  function clearBox(x0, z0, x1, z1) {
    const a = Math.max(0, ix(x0 + 0.01)), b = Math.min(W - 1, ix(x1 - 0.01));
    const c = Math.max(0, iz(z0 + 0.01)), d = Math.min(H - 1, iz(z1 - 0.01));
    for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) hgt[j * W + i] = 0;
  }
  function heightAt(x, z) {
    const i = ix(x), j = iz(z);
    if (i < 0 || j < 0 || i >= W || j >= H) return 0; // mimo mřížku (zvláštní světy) — řeší bounds
    let h = hgt[j * W + i] / 10;
    for (const e of extra) if (x > e.x0 && x < e.x1 && z > e.z0 && z < e.z1) h = Math.max(h, e.h);
    return h;
  }
  // kruh (x,z,r) koliduje?
  function hitCircle(x, z, r, minH = 0.05) {
    const a = ix(x - r), b = ix(x + r), c = iz(z - r), d = iz(z + r);
    for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) {
      if (i < 0 || j < 0 || i >= W || j >= H) continue;
      if (hgt[j * W + i] / 10 > minH) {
        // přesnější test kruh vs. buňka
        const cx0 = X0 + i * CELL, cz0 = Z0 + j * CELL;
        const nx = Math.max(cx0, Math.min(x, cx0 + CELL)), nz = Math.max(cz0, Math.min(z, cz0 + CELL));
        if ((nx - x) * (nx - x) + (nz - z) * (nz - z) < r * r) return true;
      }
    }
    for (const e of extra) {
      if (e.h <= minH) continue;
      const nx = Math.max(e.x0, Math.min(x, e.x1)), nz = Math.max(e.z0, Math.min(z, e.z1));
      if ((nx - x) * (nx - x) + (nz - z) * (nz - z) < r * r) return true;
    }
    return false;
  }
  // pohyb s klouzáním po stěnách; vrací {x,z,hit}
  function move(x, z, dx, dz, r, bounds) {
    let hit = false;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.2));
    const sx = dx / steps, sz = dz / steps;
    for (let s = 0; s < steps; s++) {
      let nx = x + sx;
      if (bounds) nx = U.clamp(nx, bounds.x0 + r, bounds.x1 - r);
      if (!hitCircle(nx, z, r)) x = nx; else hit = true;
      let nz = z + sz;
      if (bounds) nz = U.clamp(nz, bounds.z0 + r, bounds.z1 - r);
      if (!hitCircle(x, nz, r)) z = nz; else hit = true;
    }
    return { x, z, hit };
  }
  // vystrčí kruh ven, pokud se zasekl (např. po teleportu)
  function unstick(x, z, r) {
    if (!hitCircle(x, z, r)) return [x, z];
    for (let rad = 0.25; rad < 6; rad += 0.25) for (let a = 0; a < 16; a++) {
      const nx = x + Math.cos(a / 16 * Math.PI * 2) * rad, nz = z + Math.sin(a / 16 * Math.PI * 2) * rad;
      if (!hitCircle(nx, nz, r)) return [nx, nz];
    }
    return [x, z];
  }
  // paprsek pro kameru: vrací vzdálenost k první překážce vyšší než y paprsku
  function ray(x, y, z, dx, dy, dz, maxD) {
    const st = 0.1;
    for (let d = 0; d < maxD; d += st) {
      const px = x + dx * d, py = y + dy * d, pz = z + dz * d;
      const h = heightAt(px, pz);
      if (h > 0 && py < h + 0.15) return Math.max(0, d - 0.3);
    }
    return maxD;
  }
  function addExtra(e) { extra.push(e); return e; }
  function removeExtra(id) { for (let k = extra.length - 1; k >= 0; k--) if (extra[k].id === id) extra.splice(k, 1); }
  return { addBox, clearBox, heightAt, hitCircle, move, unstick, ray, addExtra, removeExtra, extra };
})();
