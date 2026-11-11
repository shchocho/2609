// textures.js — 절차적 텍스처(나뭇결·직물·미세 요철·커팅 매트). 외부 이미지 없이 캔버스로 만든다.

import * as THREE from '../../vendor/three.module.min.js';

// ---------------------------------------------------------------- noise
function makeNoise(seed = 1) {
  const p = new Uint8Array(512);
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 233280 + 12345) % 2147483647; return (s & 0xffff) / 0xffff; };
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t) => t * t * (3 - 2 * t);
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
    const a = p[p[X] + Y] / 255, b = p[p[X + 1] + Y] / 255, c = p[p[X] + Y + 1] / 255, d = p[p[X + 1] + Y + 1] / 255;
    const u = fade(xf), v = fade(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, oct = 3) => {
    let v = 0, amp = 0.5, f = 1, tot = 0;
    for (let i = 0; i < oct; i++) { v += amp * n2(x * f, y * f); tot += amp; amp *= 0.5; f *= 2.03; }
    return v / tot;
  };
  return { n2, fbm, rnd };
}

const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function tex(cv, { srgb = false, repeat = true, mirror = false, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = mirror ? THREE.MirroredRepeatWrapping : repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.anisotropy = aniso;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/** 높이맵 → 노멀맵 캔버스. */
function normalFromHeight(h, w, hgt, strength = 2, wrap = true) {
  const cv = canvas(w, hgt), ctx = cv.getContext('2d'), img = ctx.createImageData(w, hgt), d = img.data;
  const at = (x, y) => (wrap ? h[((y + hgt) % hgt) * w + ((x + w) % w)] : h[clamp(y, 0, hgt - 1) * w + clamp(x, 0, w - 1)]);
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ---------------------------------------------------------------- wood
export const WOOD_MM = [1500, 440]; // 텍스처 한 장이 덮는 실물 크기(결 방향 × 폭)

const SPECIES = {
  birch: { lines: 26, warp: 7, sharp: 2.4, ring: 0.2, fiber: 0.3, streak: 0.55, knots: 0, pores: 0 },
  beech: { lines: 34, warp: 4, sharp: 1.8, ring: 0.28, fiber: 0.3, streak: 0.4, knots: 0, pores: 0.25 },
  pine: { lines: 20, warp: 7, sharp: 3.2, ring: 0.62, fiber: 0.22, streak: 0.45, knots: 4, pores: 0 },
  oak: { lines: 30, warp: 6, sharp: 2.6, ring: 0.5, fiber: 0.3, streak: 0.5, knots: 0, pores: 0.6 },
  walnut: { lines: 22, warp: 9, sharp: 2, ring: 0.6, fiber: 0.32, streak: 0.7, knots: 0, pores: 0.3 },
};
const grainCache = new Map();

/** 수종별 결 세기 맵(0=밝은 부분, 1=어두운 결)과 높이맵. */
function woodGrain(sp) {
  if (grainCache.has(sp)) return grainCache.get(sp);
  const S = SPECIES[sp] || SPECIES.birch, W = 1024, H = 512;
  const { fbm, rnd } = makeNoise(sp.length * 17 + sp.charCodeAt(0));
  const k = new Float32Array(W * H), hmap = new Float32Array(W * H);
  const knots = Array.from({ length: S.knots }, () => ({ x: rnd() * W, y: rnd() * H, r: 16 + rnd() * 22 }));
  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const warp = fbm(u * 2.2, v * 3.1, 3);
      let t = v * S.lines + warp * S.warp + Math.sin(u * 5.3 + warp * 6) * 0.5;
      let kd = 0;
      for (const kn of knots) {
        const dx = (x - kn.x) / 2.6, dy = y - kn.y, r = Math.hypot(dx, dy), inf = Math.exp(-(r * r) / (kn.r * kn.r * 5));
        t += inf * (r / 5.5 - t) * 0.92;
        kd = Math.max(kd, Math.exp(-(r * r) / (kn.r * kn.r * 0.28)));
      }
      const fr = t - Math.floor(t);
      const g = Math.pow(fr, S.sharp) * (1 - smooth(0.93, 1, fr));
      const fib = fbm(u * 26, v * 190, 2);
      const streak = fbm(u * 1.2 + 9.1, v * 14 + 3.3, 2);
      let pore = 0;
      if (S.pores) { const pn = fbm(u * 60 + 31, v * 420 + 7, 1); pore = smooth(0.72, 0.9, pn) * S.pores * (0.4 + g); }
      const val = clamp(S.ring * g + S.fiber * (fib - 0.5) + S.streak * (streak - 0.5) * 0.6 + 0.3 + pore * 0.5 + kd * 0.9);
      k[y * W + x] = val;
      hmap[y * W + x] = 1 - (g * 0.5 + fib * 0.35 + pore * 0.8 + kd * 0.3);
    }
  }
  const out = { k, hmap, W, H };
  grainCache.set(sp, out);
  return out;
}

const woodCache = new Map();
export function woodTextures(def) {
  const key = `${def.sp}|${def.c}|${def.c2}`;
  if (woodCache.has(key)) return woodCache.get(key);
  const { k, hmap, W, H } = woodGrain(def.sp);
  const a = hex(def.c), b = hex(def.c2);
  const cv = canvas(W, H), ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
  const rc = canvas(W, H), rctx = rc.getContext('2d'), rimg = rctx.createImageData(W, H), rd = rimg.data;
  for (let i = 0; i < W * H; i++) {
    const t = k[i], j = i * 4;
    d[j] = a[0] + (b[0] - a[0]) * t; d[j + 1] = a[1] + (b[1] - a[1]) * t; d[j + 2] = a[2] + (b[2] - a[2]) * t; d[j + 3] = 255;
    const r = 150 + (1 - t) * 60 + (hmap[i] - 0.5) * 50; // 거칠기: 결이 살짝 더 매끈
    rd[j] = rd[j + 1] = rd[j + 2] = clamp(r, 0, 255); rd[j + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  rctx.putImageData(rimg, 0, 0);
  const out = {
    map: tex(cv, { srgb: true, mirror: true }),
    roughnessMap: tex(rc, { mirror: true }),
    normalMap: tex(normalFromHeight(hmap, W, H, 1.6, false), { mirror: true }),
  };
  woodCache.set(key, out);
  return out;
}

// ---------------------------------------------------------------- floors (룸 세트 바닥재)
export const FLOOR_MM = { plank: [2400, 1200], parquet: [1200, 1200], tile: [1200, 1200], check: [600, 600], concrete: [2000, 2000] };
const floorCache = new Map();
/** 마루·타일·콘크리트 바닥. 색 맵과 줄눈 요철 노멀맵을 캔버스 드로잉으로 만든다. */
export function floorTextures(def) {
  const key = `${def.style}|${def.c}|${def.c2}`;
  if (floorCache.has(key)) return floorCache.get(key);
  const style = FLOOR_MM[def.style] ? def.style : 'plank', mm = FLOOR_MM[style];
  const W = 1024, H = Math.round((W * mm[1]) / mm[0]), px = W / mm[0];
  const a = hex(def.c), b = hex(def.c2), { rnd, fbm } = makeNoise(def.c.charCodeAt(1) * 7 + def.c2.charCodeAt(2) + style.length);
  const cv = canvas(W, H), g = cv.getContext('2d'), hv = canvas(W, H), hg = hv.getContext('2d');
  const mix = (t, k = 1) => `rgb(${a.map((v, i) => Math.round(clamp((v + (b[i] - v) * t) * k, 0, 255))).join(',')})`;
  hg.fillStyle = '#fff'; hg.fillRect(0, 0, W, H);
  const groove = (x, y, w, h, lw = 1.4, tone = 0.42) => {
    g.strokeStyle = `rgba(${b.map((v) => Math.round(v * tone)).join(',')},0.55)`; g.lineWidth = lw; g.strokeRect(x, y, w, h);
    hg.strokeStyle = '#000'; hg.lineWidth = lw + 0.6; hg.strokeRect(x, y, w, h);
  };
  // 널 한 장: 바탕색 + 결 방향 줄무늬
  const board = (x, y, w, h, along) => {
    const tone = rnd(), k = 0.93 + rnd() * 0.12;
    g.fillStyle = mix(0.12 + tone * 0.5, k); g.fillRect(x, y, w, h);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    const n = Math.round(((along ? h : w) * 0.9)), len = along ? w : h;
    for (let i = 0; i < n; i++) {
      const o = rnd() * (along ? h : w), s0 = rnd() * len, l = len * (0.25 + rnd() * 0.75), wob = (rnd() - 0.5) * 3;
      g.strokeStyle = `rgba(${b.map((v) => Math.round(v * (0.75 + rnd() * 0.3))).join(',')},${0.05 + rnd() * 0.13})`; g.lineWidth = 0.6 + rnd() * 1.1;
      g.beginPath();
      if (along) { g.moveTo(x + s0, y + o); g.quadraticCurveTo(x + s0 + l / 2, y + o + wob, x + s0 + l, y + o); } else { g.moveTo(x + o, y + s0); g.quadraticCurveTo(x + o + wob, y + s0 + l / 2, x + o, y + s0 + l); }
      g.stroke();
    }
    g.restore();
    groove(x, y, w, h);
  };
  if (style === 'plank') {
    const rows = 8, rh = H / rows;
    for (let j = 0; j < rows; j++) {
      // 거울 반복(MirroredRepeat)으로 이어 붙이므로 양 끝에서 널이 잘려도 이음매가 맞는다.
      let x = -rnd() * W * 0.45;
      while (x < W) { const l = W * (0.42 + rnd() * 0.3); board(x, j * rh, l, rh, true); x += l; }
    }
  } else if (style === 'parquet') {
    const cells = 4, cs = W / cells, strips = 4, sw = cs / strips;
    for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) for (let k = 0; k < strips; k++) {
      if ((i + j) % 2 === 0) board(i * cs, j * cs + k * sw, cs, sw, true); else board(i * cs + k * sw, j * cs, sw, cs, false);
    }
  } else if (style === 'tile' || style === 'check') {
    const n = 2, ts = W / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const dark = style === 'check' && (i + j) % 2 === 1, k = 0.96 + rnd() * 0.06;
      g.fillStyle = dark ? `rgb(${b.map((v) => Math.round(v * k)).join(',')})` : mix(rnd() * 0.12, k); g.fillRect(i * ts, j * ts, ts, ts);
      // 은은한 얼룩
      for (let q = 0; q < 26; q++) { g.fillStyle = `rgba(${(dark ? a : b).join(',')},${0.015 + rnd() * 0.03})`; g.beginPath(); g.ellipse(i * ts + rnd() * ts, j * ts + rnd() * ts, 20 + rnd() * 90, 14 + rnd() * 50, rnd() * 3.14, 0, 6.3); g.fill(); }
      g.strokeStyle = style === 'check' ? 'rgba(60,60,60,0.5)' : 'rgba(150,146,138,0.9)'; g.lineWidth = Math.max(2, 4 * px); g.strokeRect(i * ts, j * ts, ts, ts);
      hg.strokeStyle = '#000'; hg.lineWidth = Math.max(2.5, 5 * px); hg.strokeRect(i * ts, j * ts, ts, ts);
    }
  } else {
    const img = g.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = clamp(fbm(x * 0.006, y * 0.006, 4) * 0.8 + fbm(x * 0.05, y * 0.05, 2) * 0.35 - 0.1), q = (y * W + x) * 4;
      d[q] = a[0] + (b[0] - a[0]) * t; d[q + 1] = a[1] + (b[1] - a[1]) * t; d[q + 2] = a[2] + (b[2] - a[2]) * t; d[q + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  const hd = hg.getImageData(0, 0, W, H).data, h = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) h[i] = hd[i * 4] / 255;
  const out = { map: tex(cv, { srgb: true, mirror: true, aniso: 16 }), normalMap: tex(normalFromHeight(h, W, H, 1.1, false), { mirror: true, aniso: 16 }), mm };
  floorCache.set(key, out);
  return out;
}

// ---------------------------------------------------------------- fabric
export const FABRIC_MM = 58;
let fabricCache = null, fineFabricCache = null;
export function fabricTextures(fine = false) {
  if (fine && fineFabricCache) return fineFabricCache;
  if (!fine && fabricCache) return fabricCache;
  const N = 256, cell = fine ? 4 : 8, { n2, rnd } = makeNoise(fine ? 77 : 41);
  const warp = Array.from({ length: N / cell }, () => 0.95 + rnd() * 0.05), weft = Array.from({ length: N / cell }, () => 0.95 + rnd() * 0.05);
  const h = new Float32Array(N * N), cv = canvas(N, N), ctx = cv.getContext('2d'), img = ctx.createImageData(N, N), d = img.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const cx = x / cell, cy = y / cell, i = Math.floor(cx), j = Math.floor(cy), fx = cx - i - 0.5, fy = cy - j - 0.5;
    const over = (i + j) % 2 === 0;
    const hh = over ? Math.cos(fx * Math.PI) * (0.55 + 0.45 * Math.cos(fy * Math.PI)) : Math.cos(fy * Math.PI) * (0.55 + 0.45 * Math.cos(fx * Math.PI));
    const tone = (over ? warp[i % warp.length] : weft[j % weft.length]) * (0.93 + 0.07 * n2(x * 0.35, y * 0.35));
    h[y * N + x] = hh;
    const v = clamp(tone * (0.9 + 0.1 * hh)) * 255, q = (y * N + x) * 4;
    d[q] = d[q + 1] = d[q + 2] = v; d[q + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const out = { map: tex(cv, { srgb: true }), normalMap: tex(normalFromHeight(h, N, N, fine ? 1.2 : 2.4)) };
  if (fine) fineFabricCache = out; else fabricCache = out;
  return out;
}

// ---------------------------------------------------------------- micro noise (도장·플라스틱·금속)
export const NOISE_MM = 260;
let noiseCache = null;
export function noiseTextures() {
  if (noiseCache) return noiseCache;
  const N = 256, { fbm } = makeNoise(5), h = new Float32Array(N * N);
  const cv = canvas(N, N), ctx = cv.getContext('2d'), img = ctx.createImageData(N, N), d = img.data;
  // 타일링되는 노이즈: 네 귀퉁이 블렌딩
  const f = (x, y) => fbm(x * 0.09, y * 0.09, 3) * 0.6 + fbm(x * 0.4, y * 0.4, 2) * 0.4;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const val = f(x, y) * (1 - u) * (1 - v) + f(x - N, y) * u * (1 - v) + f(x, y - N) * (1 - u) * v + f(x - N, y - N) * u * v;
    h[y * N + x] = val;
    const g = clamp(0.78 + (val - 0.5) * 0.5) * 255, q = (y * N + x) * 4;
    d[q] = d[q + 1] = d[q + 2] = g; d[q + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  noiseCache = { roughnessMap: tex(cv), normalMap: tex(normalFromHeight(h, N, N, 0.9)) };
  return noiseCache;
}

// ---------------------------------------------------------------- galvanized
let galvCache = null;
export function galvTextures() {
  if (galvCache) return galvCache;
  const N = 256, { rnd } = makeNoise(13), pts = Array.from({ length: 70 }, () => [rnd() * N, rnd() * N, 0.72 + rnd() * 0.28]);
  const cv = canvas(N, N), ctx = cv.getContext('2d'), img = ctx.createImageData(N, N), d = img.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let best = 1e9, val = 1;
    for (const p of pts) {
      let dx = Math.abs(x - p[0]), dy = Math.abs(y - p[1]);
      dx = Math.min(dx, N - dx); dy = Math.min(dy, N - dy);
      const dd = dx * dx + dy * dy;
      if (dd < best) { best = dd; val = p[2]; }
    }
    const q = (y * N + x) * 4;
    d[q] = d[q + 1] = d[q + 2] = val * 255; d[q + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  galvCache = { map: tex(cv, { srgb: true }), roughnessMap: tex(cv) };
  return galvCache;
}

// ---------------------------------------------------------------- pegboard (40mm 타일, 엇갈린 슬롯 2개)
export const PEG_MM = 40;
const pegCache = new Map();
export function pegboardTexture(color) {
  if (pegCache.has(color)) return pegCache.get(color);
  const N = 128, cv = canvas(N, N), ctx = cv.getContext('2d');
  ctx.fillStyle = color; ctx.fillRect(0, 0, N, N);
  ctx.fillStyle = 'rgba(20,22,22,0.92)';
  const slot = (cx, cy) => { ctx.beginPath(); ctx.roundRect(cx - 8, cy - 24, 16, 48, 8); ctx.fill(); };
  slot(32, 32); slot(96, 96); slot(96, -32); slot(96, 160);
  const t = tex(cv, { srgb: true });
  pegCache.set(color, t);
  return t;
}

// ---------------------------------------------------------------- cutting mat (A3 450×300mm)
export const MAT_MM = [450, 300];
let matCache = null;
export function cuttingMatTexture() {
  if (matCache) return matCache;
  const S = 4, W = Math.round(MAT_MM[0] * S), H = Math.round(MAT_MM[1] * S), cv = canvas(W, H), ctx = cv.getContext('2d');
  const { fbm } = makeNoise(3);
  ctx.fillStyle = '#2c6b58'; ctx.fillRect(0, 0, W, H);
  // 얼룩은 작은 캔버스에 그려 확대해 얹는다(전체 픽셀 순회보다 훨씬 빠르다).
  const nz = canvas(160, 108), nx = nz.getContext('2d'), ni = nx.createImageData(160, 108);
  for (let i = 0; i < 160 * 108; i++) {
    const v = 128 + (fbm((i % 160) * 0.09, Math.floor(i / 160) * 0.09, 2) - 0.5) * 70 + (Math.random() - 0.5) * 22;
    ni.data[i * 4] = ni.data[i * 4 + 1] = ni.data[i * 4 + 2] = v; ni.data[i * 4 + 3] = 255;
  }
  nx.putImageData(ni, 0, 0);
  ctx.globalAlpha = 0.16; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(nz, 0, 0, W, H);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const m = 15 * S; // 여백
  ctx.strokeStyle = 'rgba(224,240,230,0.9)'; ctx.fillStyle = 'rgba(224,240,230,0.92)';
  ctx.lineWidth = 1.6; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
  ctx.font = `${Math.round(3.1 * S)}px ui-monospace, Menlo, Consolas, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let mm = 0; mm <= MAT_MM[0] - 30; mm += 5) {
    const x = m + mm * S, major = mm % 50 === 0, mid = mm % 10 === 0;
    ctx.globalAlpha = major ? 0.85 : mid ? 0.42 : 0.16; ctx.lineWidth = major ? 1.5 : 1;
    ctx.beginPath(); ctx.moveTo(x, m); ctx.lineTo(x, H - m); ctx.stroke();
    if (mid) { ctx.globalAlpha = 0.9; ctx.fillText(String(mm / 10), x, m - 6 * S * 0.9); }
  }
  for (let mm = 0; mm <= MAT_MM[1] - 30; mm += 5) {
    const y = H - m - mm * S, major = mm % 50 === 0, mid = mm % 10 === 0;
    ctx.globalAlpha = major ? 0.85 : mid ? 0.42 : 0.16; ctx.lineWidth = major ? 1.5 : 1;
    ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(W - m, y); ctx.stroke();
    if (mid) { ctx.globalAlpha = 0.9; ctx.fillText(String(mm / 10), m - 7 * S * 0.9, y); }
  }
  // 각도 안내선
  ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2;
  for (const ang of [30, 45, 60]) {
    const a = (ang * Math.PI) / 180, L = (H - 2 * m) / Math.sin(a);
    ctx.beginPath(); ctx.moveTo(m, H - m); ctx.lineTo(m + L * Math.cos(a), H - m - L * Math.sin(a)); ctx.stroke();
  }
  ctx.globalAlpha = 0.8; ctx.font = `600 ${Math.round(4.2 * S)}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'right';
  ctx.fillText('MINIATYR  A3  CUTTING MAT  ·  cm', W - m, H - m * 0.42);
  ctx.globalAlpha = 1;
  matCache = tex(cv, { srgb: true, repeat: false, aniso: 16 });
  return matCache;
}

// ---------------------------------------------------------------- 자(ruler) 텍스처 150mm
let rulerCache = null;
export function rulerTexture() {
  if (rulerCache) return rulerCache;
  const S = 8, W = 160 * S, H = 20 * S, cv = canvas(W, H), ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#c9ccce'); g.addColorStop(0.5, '#b4b8bb'); g.addColorStop(1, '#c2c5c8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#1c1e1f'; ctx.fillStyle = '#1c1e1f'; ctx.font = `${3 * S}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center';
  for (let mm = 0; mm <= 150; mm++) {
    const x = (5 + mm) * S, len = mm % 10 === 0 ? 7 : mm % 5 === 0 ? 5 : 3;
    ctx.lineWidth = mm % 10 === 0 ? 1.6 : 1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len * S); ctx.stroke();
    if (mm % 10 === 0) ctx.fillText(String(mm / 10), x, 11.5 * S);
  }
  rulerCache = tex(cv, { srgb: true, repeat: false, aniso: 16 });
  return rulerCache;
}

/** 원형 그라데이션 알파(바닥 가장자리 페이드, 그림자 받이). */
export function radialAlpha() {
  const N = 256, cv = canvas(N, N), ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(N / 2, N / 2, N * 0.18, N / 2, N / 2, N / 2);
  g.addColorStop(0, '#fff'); g.addColorStop(1, '#000');
  ctx.fillStyle = g; ctx.fillRect(0, 0, N, N);
  return tex(cv, { repeat: false });
}
