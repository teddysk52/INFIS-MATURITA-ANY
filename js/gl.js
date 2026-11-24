'use strict';
// =============================================================
//  gl.js — vlastní 3D renderer nad čistým WebGL2.
//  Žádná knihovna (Three.js apod.), všechno je napsané ručně:
//   - stínová mapa (slunce), mlha, obloha s mraky
//   - vnitřní osvětlení školy (zářivky), bodová světla pro efekty
//   - billboardy (sprity) a podlahové "decaly"
//   - post-processing: pixelizace, vinětace, glitch, záblesky
// =============================================================
const GFX = (() => {
  let gl, canvas;
  const STRIDE = 13; // pos3 nrm3 uv2 layer1 col4

  // ---------------------------------------------------------
  //  SHADERY
  // ---------------------------------------------------------
  const VS_MAIN = `#version 300 es
  layout(location=0) in vec3 a_pos; layout(location=1) in vec3 a_nrm; layout(location=2) in vec2 a_uv;
  layout(location=3) in float a_layer; layout(location=4) in vec4 a_col;
  uniform mat4 u_vp, u_model, u_lightVP; uniform float u_time, u_wobble;
  out vec3 v_wp; out vec3 v_n; out vec2 v_uv; flat out float v_layer; out vec4 v_col; out vec4 v_ls;
  void main(){
    vec4 wp = u_model * vec4(a_pos, 1.0);
    if (u_wobble > 0.0) { wp.x += sin(wp.y*3.0 + u_time*9.0 + wp.z) * 0.08 * u_wobble; wp.y += sin(wp.x*2.0 + u_time*7.0) * 0.05 * u_wobble; }
    v_wp = wp.xyz; v_n = mat3(u_model) * a_nrm; v_uv = a_uv; v_layer = a_layer; v_col = a_col;
    v_ls = u_lightVP * wp;
    gl_Position = u_vp * wp;
  }`;

  const FS_MAIN = `#version 300 es
  precision highp float; precision highp sampler2DArray; precision highp sampler2DShadow;
  in vec3 v_wp; in vec3 v_n; in vec2 v_uv; flat in float v_layer; in vec4 v_col; in vec4 v_ls;
  uniform sampler2DArray u_tex; uniform sampler2DShadow u_shadow;
  uniform vec3 u_sunDir, u_sunCol, u_skyCol, u_gndCol, u_fogCol, u_camPos, u_inAmb, u_inTop;
  uniform float u_fogDen, u_ceil, u_time, u_night, u_winLayer, u_shadowOn, u_indoorForce;
  uniform vec4 u_bld, u_tint;
  uniform vec4 u_pl[8]; uniform vec4 u_plc[8]; uniform int u_npl;
  out vec4 o;
  float shadowAt(vec3 n){
    vec3 p = v_ls.xyz / v_ls.w * 0.5 + 0.5;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
    float bias = 0.0012 + 0.002 * (1.0 - max(dot(n, u_sunDir), 0.0));
    float s = 0.0; vec2 ts = vec2(1.0/2048.0);
    for (int x=-1; x<=1; x++) for (int y=-1; y<=1; y++) s += texture(u_shadow, vec3(p.xy + vec2(x,y)*ts, p.z - bias));
    return s / 9.0;
  }
  void main(){
    vec4 tex = texture(u_tex, vec3(v_uv, v_layer));
    if (tex.a < 0.5) discard;
    vec3 n = normalize(v_n); if (!gl_FrontFacing) n = -n;
    vec3 base = tex.rgb * v_col.rgb * u_tint.rgb;
    bool inside = (v_wp.x > u_bld.x && v_wp.x < u_bld.z && v_wp.z > u_bld.y && v_wp.z < u_bld.w && v_wp.y < u_ceil + 0.05) || u_indoorForce > 0.5;
    vec3 L;
    if (inside) {
      // zářivky: mřížka světel každé 4 m + jemné "AO" u podlahy
      vec2 g = fract((v_wp.xz - vec2(0.0, 0.5)) / 4.0) - 0.5;
      float lp = 1.0 - 0.22 * smoothstep(0.1, 0.7, length(g));
      float ao = abs(n.y) < 0.5 ? mix(0.72, 1.0, smoothstep(0.0, 0.7, v_wp.y)) * mix(1.0, 0.9, smoothstep(2.2, 3.2, v_wp.y)) : 1.0;
      L = (u_inAmb + u_inTop * (0.55 + 0.45 * max(n.y, 0.0)) * lp) * ao;
      L *= 0.9 + 0.1 * abs(n.x);
    } else {
      float sh = u_shadowOn > 0.5 ? shadowAt(n) : 1.0;
      float ndl = max(dot(n, u_sunDir), 0.0);
      vec3 hemi = mix(u_gndCol, u_skyCol, n.y * 0.5 + 0.5);
      L = hemi + u_sunCol * ndl * sh;
    }
    for (int i = 0; i < 8; i++) {
      if (i >= u_npl) break;
      vec3 d = u_pl[i].xyz - v_wp; float dist = length(d);
      float att = max(0.0, 1.0 - dist / u_pl[i].w); att *= att;
      L += u_plc[i].rgb * u_plc[i].a * att * (0.35 + 0.65 * max(dot(n, d / max(dist, 0.001)), 0.0));
    }
    vec3 c = base * L;
    float em = v_col.a;
    if (abs(v_layer - u_winLayer) < 0.5) em = max(em, u_night * 0.85 * step(0.35, tex.b - tex.r));
    c = mix(c, base * (1.0 + em * 0.25), clamp(em, 0.0, 1.0));
    c = mix(c, vec3(1.0), u_tint.a);
    float fd = length(v_wp - u_camPos);
    float f = 1.0 - exp(-pow(fd * u_fogDen, 1.6));
    c = mix(c, u_fogCol, clamp(f, 0.0, 1.0));
    o = vec4(c, 1.0);
  }`;

  const VS_DEPTH = `#version 300 es
  layout(location=0) in vec3 a_pos; layout(location=2) in vec2 a_uv; layout(location=3) in float a_layer;
  uniform mat4 u_lightVP, u_model;
  out vec2 v_uv; flat out float v_layer;
  void main(){ v_uv = a_uv; v_layer = a_layer; gl_Position = u_lightVP * u_model * vec4(a_pos, 1.0); }`;
  const FS_DEPTH = `#version 300 es
  precision highp float; precision highp sampler2DArray;
  in vec2 v_uv; flat in float v_layer; uniform sampler2DArray u_tex; out vec4 o;
  void main(){ if (texture(u_tex, vec3(v_uv, v_layer)).a < 0.5) discard; o = vec4(1.0); }`;

  const VS_SKY = `#version 300 es
  layout(location=0) in vec2 a_pos; uniform mat4 u_invVP; out vec3 v_dir;
  void main(){
    vec4 p = u_invVP * vec4(a_pos, 1.0, 1.0); v_dir = p.xyz / p.w;
    gl_Position = vec4(a_pos, 0.9999, 1.0);
  }`;
  const FS_SKY = `#version 300 es
  precision highp float;
  in vec3 v_dir; uniform vec3 u_camPos, u_zenith, u_horizon, u_sunDir, u_sunCol, u_fogCol; uniform float u_time, u_night, u_cyber;
  out vec4 o;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  void main(){
    vec3 d = normalize(v_dir - u_camPos);
    float t = clamp(d.y, -0.2, 1.0);
    vec3 c = mix(u_horizon, u_zenith, pow(max(t, 0.0), 0.55));
    if (d.y < 0.0) c = mix(u_horizon, u_fogCol, clamp(-d.y * 6.0, 0.0, 1.0));
    float sd = max(dot(d, u_sunDir), 0.0);
    c += u_sunCol * (pow(sd, 900.0) * 3.0 + pow(sd, 12.0) * 0.25) * (1.0 - u_cyber);
    if (d.y > 0.0) {
      vec2 uv = d.xz / (d.y + 0.15) * 2.0 + vec2(u_time * 0.01, 0.0);
      uv = floor(uv * 24.0) / 24.0; // pixelové mraky
      float cl = n2(uv) * 0.6 + n2(uv * 2.1) * 0.3 + n2(uv * 4.3) * 0.1;
      cl = smoothstep(0.55, 0.75, cl) * smoothstep(0.0, 0.25, d.y) * (1.0 - u_cyber);
      vec3 ccol = mix(vec3(1.0), u_horizon * 1.1, 0.35) * (1.0 - u_night * 0.75);
      c = mix(c, ccol, cl * 0.8);
      // hvězdy v noci
      vec2 sp = floor(d.xz / (d.y + 0.3) * 160.0);
      float st = step(0.997, h(sp)) * u_night * smoothstep(0.05, 0.3, d.y);
      c += vec3(st);
    }
    if (u_cyber > 0.0) {
      vec2 g = abs(fract(d.xz / max(abs(d.y), 0.05) * 1.5) - 0.5);
      float line = step(0.47, max(g.x, g.y)) * smoothstep(0.0, 0.4, abs(d.y));
      c += vec3(0.1, 0.9, 0.5) * line * 0.25 * u_cyber;
    }
    o = vec4(c, 1.0);
  }`;

  const VS_SPR = `#version 300 es
  layout(location=0) in vec3 a_pos; layout(location=1) in vec2 a_uv; layout(location=2) in vec4 a_col;
  uniform mat4 u_vp; out vec2 v_uv; out vec4 v_col; out vec3 v_wp;
  void main(){ v_uv = a_uv; v_col = a_col; v_wp = a_pos; gl_Position = u_vp * vec4(a_pos, 1.0); }`;
  const FS_SPR = `#version 300 es
  precision highp float;
  in vec2 v_uv; in vec4 v_col; in vec3 v_wp; uniform sampler2D u_atlas; uniform float u_cut, u_fogDen, u_bright; uniform vec3 u_fogCol, u_camPos;
  out vec4 o;
  void main(){
    vec4 t = texture(u_atlas, v_uv) * v_col;
    if (u_cut > 0.5) { if (t.a < 0.5) discard; t.a = 1.0; }
    else if (t.a < 0.01) discard;
    float fd = length(v_wp - u_camPos);
    float f = 1.0 - exp(-pow(fd * u_fogDen, 1.6));
    t.rgb = mix(t.rgb * u_bright, u_fogCol, clamp(f, 0.0, 1.0) * 0.8);
    o = t;
  }`;

  const VS_POST = `#version 300 es
  layout(location=0) in vec2 a_pos; out vec2 v_uv;
  void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;
  const FS_POST = `#version 300 es
  precision highp float;
  in vec2 v_uv; uniform sampler2D u_scene; uniform float u_time, u_glitch, u_red, u_flash, u_vig, u_sat, u_gray;
  uniform vec3 u_grade, u_flashCol; uniform vec2 u_res;
  out vec4 o;
  float h(float n){ return fract(sin(n) * 43758.5453); }
  void main(){
    vec2 uv = v_uv;
    if (u_glitch > 0.0) {
      float row = floor(uv.y * 40.0);
      float k = step(1.0 - u_glitch * 0.35, h(row + floor(u_time * 18.0)));
      uv.x += (h(row * 3.1 + floor(u_time * 24.0)) - 0.5) * 0.12 * k * u_glitch;
    }
    vec3 c;
    if (u_glitch > 0.0) {
      float s = 0.006 * u_glitch;
      c = vec3(texture(u_scene, uv + vec2(s, 0.0)).r, texture(u_scene, uv).g, texture(u_scene, uv - vec2(s, 0.0)).b);
    } else c = texture(u_scene, uv).rgb;
    c *= u_grade;
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(l), c, u_sat);
    c = mix(c, vec3(l), u_gray);
    vec2 q = v_uv - 0.5;
    float vg = 1.0 - dot(q, q) * u_vig;
    c *= vg;
    c = mix(c, vec3(1.0, 0.05, 0.08) * (0.5 + l), u_red * (0.35 + 0.65 * smoothstep(0.15, 0.5, length(q))));
    c = mix(c, u_flashCol, u_flash);
    o = vec4(c, 1.0);
  }`;

  // ---------------------------------------------------------
  function compile(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src);
    return s;
  }
  function program(vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const name = info.name.replace('[0]', ''); u[name] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  }

  let P = {}, quadVAO, shadowFB, shadowTex, sceneFB, sceneTex, sceneDepth, sceneW = 0, sceneH = 0;
  const SHADOW = 2048;
  let texArray = null, atlasTex = null;

  // Sprite batches (dynamické buffery)
  const SPR_MAX = 6000; // quadů
  const sprBuf = { cut: null, blend: null };

  function makeSprBatch() {
    const data = new Float32Array(SPR_MAX * 4 * 9);
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
    const idx = new Uint32Array(SPR_MAX * 6);
    for (let i = 0; i < SPR_MAX; i++) { idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
    const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { data, vao, vbo, n: 0 };
  }

  function init(cv) {
    canvas = cv;
    gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    if (!gl) return false;
    P.main = program(VS_MAIN, FS_MAIN);
    P.depth = program(VS_DEPTH, FS_DEPTH);
    P.sky = program(VS_SKY, FS_SKY);
    P.spr = program(VS_SPR, FS_SPR);
    P.post = program(VS_POST, FS_POST);

    quadVAO = gl.createVertexArray(); gl.bindVertexArray(quadVAO);
    const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // stínová mapa
    shadowTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shadowTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, SHADOW, SHADOW);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    shadowFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowTex, 0);
    // WebGL2 vyžaduje barevný attachment? Ne — stačí drawBuffers NONE.
    gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    sprBuf.cut = makeSprBatch(); sprBuf.blend = makeSprBatch();
    return true;
  }

  function ensureScene(w, h) {
    if (w === sceneW && h === sceneH) return;
    sceneW = w; sceneH = h;
    if (sceneTex) { gl.deleteTexture(sceneTex); gl.deleteRenderbuffer(sceneDepth); gl.deleteFramebuffer(sceneFB); }
    sceneTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    sceneDepth = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, sceneDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    sceneFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sceneDepth);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // ---------------------------------------------------------
  //  Meshe
  // ---------------------------------------------------------
  function createMesh(verts, idx, dynamic) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    const B = STRIDE * 4;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, B, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, B, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, B, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, B, 32);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 4, gl.FLOAT, false, B, 36);
    const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, vbo, ibo, count: idx.length };
  }
  function deleteMesh(m) { if (!m) return; gl.deleteVertexArray(m.vao); gl.deleteBuffer(m.vbo); gl.deleteBuffer(m.ibo); }

  // ---------------------------------------------------------
  //  Textury
  // ---------------------------------------------------------
  function createTexArray(size, layers) {
    // layers: pole canvasů (size×size)
    texArray = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texArray);
    const levels = Math.log2(size) + 1;
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, size, size, layers.length);
    for (let i = 0; i < layers.length; i++) gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, size, size, 1, gl.RGBA, gl.UNSIGNED_BYTE, layers[i]);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
    const ext = gl.getExtension('EXT_texture_filter_anisotropic');
    if (ext) gl.texParameterf(gl.TEXTURE_2D_ARRAY, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  }
  // přepíše jednu vrstvu (včetně mipmap, aby byla vidět i z dálky)
  const _mipCv = [];
  function updateLayer(i, cv) {
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texArray);
    let s = cv.width, src = cv, lvl = 0;
    while (s >= 1) {
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, lvl, 0, 0, i, s, s, 1, gl.RGBA, gl.UNSIGNED_BYTE, src);
      if (s === 1) break;
      s >>= 1; lvl++;
      const c = _mipCv[lvl] || (_mipCv[lvl] = Object.assign(document.createElement('canvas'), { width: s, height: s }));
      const x = c.getContext('2d'); x.clearRect(0, 0, s, s); x.imageSmoothingEnabled = true; x.drawImage(src, 0, 0, s, s);
      src = c;
    }
  }
  function createAtlas(cv) {
    atlasTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  function updateAtlas(cv, x, y, w, h) {
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    if (w === undefined) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    else {
      const d = cv.getContext('2d').getImageData(x, y, w, h);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, d);
    }
  }

  // ---------------------------------------------------------
  //  Kreslení snímku
  // ---------------------------------------------------------
  const draws = [];
  function submit(mesh, model, start = 0, count = -1, opt = null) {
    draws.push({ mesh, model, start, count: count < 0 ? mesh.count : count, shadow: !opt || opt.shadow !== false, cull: !opt || opt.cull !== false, tint: opt && opt.tint, wobble: opt && opt.wobble || 0, main: !(opt && opt.hideMain) });
  }
  // pool matic pro jeden snímek (draw list si drží reference)
  const pool = []; let poolI = 0;
  function mat() { if (poolI >= pool.length) pool.push(M4.create()); return M4.identity(pool[poolI++]); }
  const IDENT = M4.create();

  // sprity: billboard (kolmý na kameru) nebo libovolný quad
  let camRight = [1, 0, 0], camUp = [0, 1, 0];
  function pushQuad(batch, p0, p1, p2, p3, uv, col) {
    if (batch.n >= SPR_MAX) return;
    const d = batch.data, o = batch.n * 36;
    const u0 = uv[0], v0 = uv[1], u1 = uv[2], v1 = uv[3];
    const P4 = [p0, p1, p2, p3], UVs = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];
    for (let k = 0; k < 4; k++) {
      const q = o + k * 9;
      d[q] = P4[k][0]; d[q + 1] = P4[k][1]; d[q + 2] = P4[k][2];
      d[q + 3] = UVs[k][0]; d[q + 4] = UVs[k][1];
      d[q + 5] = col[0]; d[q + 6] = col[1]; d[q + 7] = col[2]; d[q + 8] = col[3];
    }
    batch.n++;
  }
  const WHITE = [1, 1, 1, 1];
  // billboard se středem (x,y,z), šířka w, výška h; spr = {u0,v0,u1,v1}
  function sprite(spr, x, y, z, w, h, col = WHITE, rot = 0, blend = false, upright = false) {
    const b = blend ? sprBuf.blend : sprBuf.cut;
    let rx = camRight[0], ry = camRight[1], rz = camRight[2];
    let ux = camUp[0], uy = camUp[1], uz = camUp[2];
    if (upright) { ux = 0; uy = 1; uz = 0; const l = Math.hypot(rx, rz) || 1; rx /= l; ry = 0; rz /= l; }
    if (rot) {
      const c = Math.cos(rot), s = Math.sin(rot);
      const nrx = rx * c + ux * s, nry = ry * c + uy * s, nrz = rz * c + uz * s;
      const nux = -rx * s + ux * c, nuy = -ry * s + uy * c, nuz = -rz * s + uz * c;
      rx = nrx; ry = nry; rz = nrz; ux = nux; uy = nuy; uz = nuz;
    }
    const hw = w / 2, hh = h / 2;
    pushQuad(b,
      [x - rx * hw - ux * hh, y - ry * hw - uy * hh, z - rz * hw - uz * hh],
      [x + rx * hw - ux * hh, y + ry * hw - uy * hh, z + rz * hw - uz * hh],
      [x + rx * hw + ux * hh, y + ry * hw + uy * hh, z + rz * hw + uz * hh],
      [x - rx * hw + ux * hh, y - ry * hw + uy * hh, z - rz * hw + uz * hh],
      [spr.u0, spr.v0, spr.u1, spr.v1], col);
  }
  // plochý quad na zemi (stín, značka dopadu)
  function decal(spr, x, y, z, w, d, col = WHITE, rot = 0) {
    const c = Math.cos(rot), s = Math.sin(rot), hw = w / 2, hd = d / 2;
    const P = (a, b) => [x + a * c - b * s, y, z + a * s + b * c];
    pushQuad(sprBuf.blend, P(-hw, hd), P(hw, hd), P(hw, -hd), P(-hw, -hd), [spr.u0, spr.v0, spr.u1, spr.v1], col);
  }

  const lightVP = M4.create(), lv = M4.create(), lp = M4.create(), invVP = M4.create();

  function setMainUniforms(u, cam, env) {
    gl.uniformMatrix4fv(u.u_vp, false, cam.vp);
    gl.uniformMatrix4fv(u.u_lightVP, false, lightVP);
    gl.uniform1f(u.u_time, env.time);
    gl.uniform3fv(u.u_sunDir, env.sunDir); gl.uniform3fv(u.u_sunCol, env.sunCol);
    gl.uniform3fv(u.u_skyCol, env.skyAmb); gl.uniform3fv(u.u_gndCol, env.gndAmb);
    gl.uniform3fv(u.u_fogCol, env.fogCol); gl.uniform1f(u.u_fogDen, env.fogDen);
    gl.uniform3fv(u.u_camPos, cam.pos);
    gl.uniform3fv(u.u_inAmb, env.inAmb); gl.uniform3fv(u.u_inTop, env.inTop);
    gl.uniform4fv(u.u_bld, env.bld); gl.uniform1f(u.u_ceil, env.ceil);
    gl.uniform1f(u.u_night, env.night); gl.uniform1f(u.u_winLayer, env.winLayer);
    gl.uniform1f(u.u_shadowOn, env.shadows ? 1 : 0);
    gl.uniform1f(u.u_indoorForce, env.indoorForce ? 1 : 0);
    const pl = new Float32Array(32), plc = new Float32Array(32);
    const n = Math.min(8, env.lights.length);
    for (let i = 0; i < n; i++) { const L = env.lights[i]; pl.set([L.x, L.y, L.z, L.r], i * 4); plc.set([L.c[0], L.c[1], L.c[2], L.i], i * 4); }
    gl.uniform4fv(u.u_pl, pl); gl.uniform4fv(u.u_plc, plc); gl.uniform1i(u.u_npl, n);
  }

  // cam: {pos:[3], vp, view, proj, right, up}; env: viz Game.env; post: efekty
  function render(cam, env, post, scale) {
    const W = canvas.width, H = canvas.height;
    const sw = Math.max(1, Math.round(W * scale)), sh = Math.max(1, Math.round(H * scale));
    ensureScene(sw, sh);
    camRight = cam.right; camUp = cam.up;

    // --- matice světla: ortho kolem ohniska, přichycené na texely (bez blikání stínů)
    const R = env.shadowRadius || 38;
    const fx = env.focus[0], fy = env.focus[1], fz = env.focus[2];
    const sd = env.sunDir;
    M4.lookAt(lv, fx + sd[0] * 80, fy + sd[1] * 80, fz + sd[2] * 80, fx, fy, fz, 0, 1, 0);
    // snap
    const tex = (2 * R) / SHADOW;
    const ox = lv[12], oy = lv[13];
    lv[12] = Math.round(ox / tex) * tex; lv[13] = Math.round(oy / tex) * tex;
    M4.ortho(lp, -R, R, -R, R, 1, 200);
    M4.mul(lightVP, lp, lv);

    gl.enable(gl.DEPTH_TEST);
    // --- 1) stíny
    if (env.shadows) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
      gl.viewport(0, 0, SHADOW, SHADOW);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(P.depth.p);
      gl.uniformMatrix4fv(P.depth.u.u_lightVP, false, lightVP);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, texArray); gl.uniform1i(P.depth.u.u_tex, 0);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 3);
      for (const d of draws) {
        if (!d.shadow) continue;
        gl.uniformMatrix4fv(P.depth.u.u_model, false, d.model || IDENT);
        gl.bindVertexArray(d.mesh.vao);
        gl.drawElements(gl.TRIANGLES, d.count, gl.UNSIGNED_INT, d.start * 4);
      }
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }

    // --- 2) scéna
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFB);
    gl.viewport(0, 0, sw, sh);
    gl.clearColor(env.fogCol[0], env.fogCol[1], env.fogCol[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // obloha
    gl.depthMask(false);
    gl.useProgram(P.sky.p);
    M4.invert(invVP, cam.vp);
    gl.uniformMatrix4fv(P.sky.u.u_invVP, false, invVP);
    gl.uniform3fv(P.sky.u.u_camPos, cam.pos);
    gl.uniform3fv(P.sky.u.u_zenith, env.zenith); gl.uniform3fv(P.sky.u.u_horizon, env.horizon);
    gl.uniform3fv(P.sky.u.u_sunDir, env.sunDir); gl.uniform3fv(P.sky.u.u_sunCol, env.sunCol);
    gl.uniform3fv(P.sky.u.u_fogCol, env.fogCol);
    gl.uniform1f(P.sky.u.u_time, env.time); gl.uniform1f(P.sky.u.u_night, env.night); gl.uniform1f(P.sky.u.u_cyber, env.cyber || 0);
    gl.bindVertexArray(quadVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthMask(true);

    gl.useProgram(P.main.p);
    const u = P.main.u;
    setMainUniforms(u, cam, env);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, texArray); gl.uniform1i(u.u_tex, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, shadowTex); gl.uniform1i(u.u_shadow, 1);
    let cullOn = null;
    for (const d of draws) {
      if (!d.main) continue;
      if (cullOn !== d.cull) { cullOn = d.cull; if (cullOn) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE); }
      gl.uniformMatrix4fv(u.u_model, false, d.model || IDENT);
      gl.uniform4fv(u.u_tint, d.tint || [1, 1, 1, 0]);
      gl.uniform1f(u.u_wobble, d.wobble + (env.wobble || 0));
      gl.bindVertexArray(d.mesh.vao);
      gl.drawElements(gl.TRIANGLES, d.count, gl.UNSIGNED_INT, d.start * 4);
    }
    gl.disable(gl.CULL_FACE);
    draws.length = 0; poolI = 0;

    // sprity
    gl.useProgram(P.spr.p);
    gl.uniformMatrix4fv(P.spr.u.u_vp, false, cam.vp);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlasTex); gl.uniform1i(P.spr.u.u_atlas, 0);
    gl.uniform1f(P.spr.u.u_fogDen, env.fogDen); gl.uniform3fv(P.spr.u.u_fogCol, env.fogCol); gl.uniform3fv(P.spr.u.u_camPos, cam.pos);
    gl.uniform1f(P.spr.u.u_bright, env.sprBright || 1);
    for (const kind of ['cut', 'blend']) {
      const b = sprBuf[kind];
      if (!b.n) continue;
      gl.uniform1f(P.spr.u.u_cut, kind === 'cut' ? 1 : 0);
      if (kind === 'blend') { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4); }
      gl.bindVertexArray(b.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.vbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, b.data, 0, b.n * 36);
      gl.drawElements(gl.TRIANGLES, b.n * 6, gl.UNSIGNED_INT, 0);
      if (kind === 'blend') { gl.disable(gl.BLEND); gl.depthMask(true); gl.disable(gl.POLYGON_OFFSET_FILL); }
      b.n = 0;
    }

    // --- 3) post-processing na obrazovku
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(P.post.p);
    const pu = P.post.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sceneTex); gl.uniform1i(pu.u_scene, 0);
    gl.uniform1f(pu.u_time, env.time); gl.uniform1f(pu.u_glitch, post.glitch); gl.uniform1f(pu.u_red, post.red);
    gl.uniform1f(pu.u_flash, post.flash); gl.uniform3fv(pu.u_flashCol, post.flashCol);
    gl.uniform1f(pu.u_vig, post.vig); gl.uniform1f(pu.u_sat, post.sat); gl.uniform1f(pu.u_gray, post.gray || 0);
    gl.uniform3fv(pu.u_grade, post.grade); gl.uniform2f(pu.u_res, W, H);
    gl.bindVertexArray(quadVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  return {
    init, mat, createMesh, deleteMesh, createTexArray, updateLayer, createAtlas, updateAtlas, submit, sprite, decal, render,
    get gl() { return gl; }, STRIDE,
  };
})();
