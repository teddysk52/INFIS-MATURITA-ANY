'use strict';
// =============================================================
//  vehicles.js — auto, které můžeš řídit (F), tramvaj linky 4
//  a provoz na Klatovské třídě.
// =============================================================
const Vehicles = (() => {
  let carMesh = null, trafficMeshes = [], tramMesh = null;

  // ---------------- řiditelné auto ----------------
  const car = { x: -36.5, z: 15.5, yaw: Math.PI, speed: 0, steer: 0, wheelRot: 0, honks: 0, crashes: 0, dist: 0 };
  const CAR_R = 0.9;
  function carHit(x, z, yaw) {
    const fx = Math.cos(yaw), fz = -Math.sin(yaw);
    for (const d of [-1.3, 0, 1.3]) if (Col.hitCircle(x + fx * d, z + fz * d, CAR_R, 0.3)) return true;
    return false;
  }
  function updateCar(dt, input, active) {
    if (!active) { car.speed *= Math.exp(-3 * dt); }
    else {
      const thr = input.up ? 1 : input.down ? -1 : 0;
      if (thr > 0) car.speed += (car.speed < 0 ? 18 : 9) * dt;
      else if (thr < 0) car.speed -= (car.speed > 0 ? 20 : 6) * dt;
      else car.speed *= Math.exp(-1.2 * dt);
      if (input.brake) car.speed *= Math.exp(-4 * dt);
      car.speed = U.clamp(car.speed, -7, input.boost ? 30 : 22);
      const st = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      car.steer = U.smooth(car.steer, st * 0.55, 10, dt);
    }
    const sp = car.speed;
    if (Math.abs(sp) < 0.01) return null;
    const nyaw = car.yaw + car.steer * sp * dt / 2.6 * (input.brake ? 1.6 : 1);
    const fx = Math.cos(nyaw), fz = -Math.sin(nyaw);
    const nx = car.x + fx * sp * dt, nz = car.z + fz * sp * dt;
    let crash = null;
    if (!carHit(nx, nz, nyaw)) { car.x = nx; car.z = nz; car.yaw = nyaw; car.dist += Math.abs(sp * dt); }
    else if (!carHit(nx, car.z, car.yaw)) { car.x = nx; car.speed *= 0.6; }
    else if (!carHit(car.x, nz, car.yaw)) { car.z = nz; car.speed *= 0.6; }
    else { if (Math.abs(sp) > 8) crash = Math.abs(sp); car.speed = -sp * 0.25; }
    car.wheelRot += sp * dt / 0.34;
    return crash;
  }

  // ---------------- tramvaje ----------------
  const TRAM_LEN = 22, TRAM_W = 2.5;
  const trams = [
    { x: 68.3, z: 60, dir: -1, speed: 11, wait: 0, bell: 0, stopped: false },
    { x: 71.7, z: -80, dir: 1, speed: 11, wait: 0, bell: 0, stopped: false },
  ];
  function tramRect(t) { return { x0: t.x - TRAM_W / 2, x1: t.x + TRAM_W / 2, z0: t.z - TRAM_LEN / 2, z1: t.z + TRAM_LEN / 2 }; }

  // ---------------- provoz ----------------
  const traffic = [
    { x: 62.5, z: -60, dir: 1, speed: 12, col: '#2a6bd1', v: 12 },
    { x: 63.5, z: 40, dir: 1, speed: 13, col: '#ffffff', v: 13 },
    { x: 77.5, z: 20, dir: -1, speed: 12, col: '#c4222b', v: 12 },
    { x: 76.5, z: -70, dir: -1, speed: 11, col: '#3d3d3d', v: 11 },
  ];

  function build() {
    const m = new MeshBuilder(); World.carMesh(m, '#ff7a1c'); carMesh = m.build();
    trafficMeshes = traffic.map(t => { const b = new MeshBuilder(); World.carMesh(b, t.col); return b.build(); });
    // tramvaj (podél Z, střed v 0)
    const T = new MeshBuilder(), SIDE = Tex.L('tram_side'), FR = Tex.L('tram_front');
    const hl = TRAM_LEN / 2, hw = TRAM_W / 2, seg = 5;
    for (let k = 0; k < seg; k++) {
      const z0 = -hl + k * TRAM_LEN / seg, z1 = z0 + TRAM_LEN / seg;
      T.wall(hw, z1, hw, z0, 0.35, 3.3, SIDE, { uv: 'fit' });
      T.wall(-hw, z0, -hw, z1, 0.35, 3.3, SIDE, { uv: 'fit' });
      T.box(-hw + 0.1, 0.1, z0 + 0.6, hw - 0.1, 0.35, z1 - 0.6, { tex: Tex.L('plastic') });
    }
    T.wall(-hw, -hl, hw, -hl, 0.35, 3.3, FR, { uv: 'fit' });
    T.wall(hw, hl, -hw, hl, 0.35, 3.3, FR, { uv: 'fit' });
    T.floor(-hw, -hl, hw, hl, 3.3, Tex.L('metal'));
    T.box(-0.6, 3.3, -1.5, 0.6, 3.6, 1.5, { tex: Tex.L('metal') });
    T.box(-0.05, 3.6, -0.6, 0.05, 4.4, 0.6, { tex: Tex.L('plastic') });
    T.box(-0.9, 4.4, -0.1, 0.9, 4.46, 0.1, { tex: Tex.L('plastic') });
    tramMesh = T.build();
  }

  function update(dt, ctx) {
    // tramvaje
    for (const t of trams) {
      t.bell = Math.max(0, t.bell - dt);
      if (t.wait > 0) { t.wait -= dt; if (t.wait <= 0) t.stopped = false; }
      else {
        const prevZ = t.z;
        // blokuje-li cestu hráč, zpomalí a zazvoní
        const px = ctx.px, pz = ctx.pz;
        const ahead = (pz - t.z) * t.dir;
        const inLane = Math.abs(px - t.x) < 2.2;
        let v = t.speed;
        if (inLane && ahead > 0 && ahead < TRAM_LEN / 2 + 14) { v = t.speed * 0.45; if (t.bell <= 0) { t.bell = 2.5; ctx.onBell && ctx.onBell(t); } }
        t.z += t.dir * v * dt;
        // zastávka Borský park (z ≈ -2)
        const stopZ = t.dir < 0 ? 0 : -4;
        if (!t.stopped && (prevZ - stopZ) * (t.z - stopZ) <= 0) { t.wait = 6; t.stopped = true; }
        if (t.z < -125) t.z = 125; if (t.z > 125) t.z = -125;
        if (t.stopped && t.wait <= 0) t.stopped = false;
      }
      // srážka s hráčem / autem
      const r = tramRect(t);
      const pr = ctx.inCar ? 1.6 : 0.35;
      if (ctx.px > r.x0 - pr && ctx.px < r.x1 + pr && ctx.pz > r.z0 - pr && ctx.pz < r.z1 + pr) ctx.onTramHit && ctx.onTramHit(t);
    }
    // provoz
    for (let k = 0; k < traffic.length; k++) {
      const c = traffic[k];
      const ahead = (ctx.pz - c.z) * c.dir, inLane = Math.abs(ctx.px - c.x) < 2.2;
      let target = c.speed;
      if (inLane && ahead > 0 && ahead < 14) target = 0;
      // nenajet do auta před sebou
      for (const o of traffic) if (o !== c && Math.abs(o.x - c.x) < 2 && (o.z - c.z) * c.dir > 0 && (o.z - c.z) * c.dir < 9) target = 0;
      c.v = U.smooth(c.v, target, target < c.v ? 6 : 1.5, dt);
      c.z += c.dir * c.v * dt;
      if (c.z < -125) c.z = 125; if (c.z > 125) c.z = -125;
      if (inLane && Math.abs(ctx.pz - c.z) < 2.4 && c.v > 3) ctx.onCarHit && ctx.onCarHit(c);
      c.honk = Math.max(0, (c.honk || 0) - dt);
      if (target === 0 && inLane && ahead < 14 && !c.honk) { c.honk = 4; ctx.onHonk && ctx.onHonk(c); }
    }
  }

  function draw(playerInCar) {
    // auto hráče
    {
      const m = GFX.mat(); M4.translate(m, m, car.x, 0, car.z); M4.rotY(m, m, car.yaw);
      if (playerInCar) M4.rotX(m, m, U.clamp(car.steer * car.speed * 0.004, -0.05, 0.05));
      GFX.submit(carMesh, m);
    }
    traffic.forEach((c, k) => { const m = GFX.mat(); M4.translate(m, m, c.x, 0, c.z); M4.rotY(m, m, c.dir > 0 ? -Math.PI / 2 : Math.PI / 2); GFX.submit(trafficMeshes[k], m); });
    for (const t of trams) { const m = GFX.mat(); M4.translate(m, m, t.x, 0, t.z); if (t.dir > 0) M4.rotY(m, m, Math.PI); GFX.submit(tramMesh, m); }
  }

  function reset() {
    Object.assign(car, { x: -36.5, z: 15.5, yaw: Math.PI, speed: 0, steer: 0, honks: 0, crashes: 0, dist: 0 });
    trams[0].z = 60; trams[1].z = -80; trams.forEach(t => { t.wait = 0; t.stopped = false; });
  }
  return { car, trams, traffic, build, update, updateCar, draw, reset, tramRect };
})();
