// styling.js — 가구를 카탈로그 사진처럼 꾸미는 자동 스타일링.
// 모델의 부품 경계 상자에서 "물건을 올릴 수 있는 면"과 그 위 빈 칸을 찾아, 가구 종류에 맞는 소품을 놓는다.
// 결과는 소품 부품 목록(모델 좌표계)이며 도면·재단표와는 무관하다.

import { Kit } from './kit.js';
import * as PR from '../builders/props.js';

const { rng, hashStr, pick } = PR;
const SOFT = new Set(['fabric', 'cushion', 'mattress', 'pillow', 'seat', 'duvet']);
const D2R = Math.PI / 180;

/** 품목별 스타일링 종류. 없으면 분류(cat) 기본값을 쓴다. */
const STYLE = {
  besta: 'tv', 'lack-tv': 'tv', 'hemnes-tv': 'tv', detolf: 'vitrine', fabrikor: 'vitrine', mulig: 'rack', raskog: 'cart', 'bekvam-cart': 'cart',
  'lack-shelf': 'ledge', skadis: 'none', moppe: 'none', pax: 'none', 'brimnes-wardrobe': 'none', kleppstad: 'none',
  poang: 'armchair', strandmon: 'armchair', ekero: 'armchair', ekenaset: 'armchair',
  'lack-coffee': 'coffee', 'hemnes-coffee': 'coffee', lovbacken: 'coffee', tarno: 'bistro',
  lisabo: 'dining', norden: 'dining', docksta: 'dining', ingatorp: 'dining', melltorp: 'dining',
  duktig: 'none', trofast: 'kidschest', 'mammut-table': 'kidstable', flisat: 'kidstable', latt: 'kidstable',
  kura: 'kidsbed', sniglar: 'kidsbed', mydal: 'kidsbed', svarta: 'kidsbed', 'hemnes-daybed': 'daybed', 'bekvam-step': 'none',
};
const CAT_STYLE = { shelf: 'shelf', storage: 'chest', sofa: 'sofa', table: 'side', desk: 'desk', bed: 'bed' };
export const styleKind = (item) => STYLE[item.id] || CAT_STYLE[item.cat] || 'none';

/** 소파 원단 색에 어울리는 쿠션 색. */
const THROW = {
  'fab-gray': ['fab-ochre', 'fab-cream', 'fab-navy'], 'fab-green': ['fab-cream', 'fab-ochre', 'fab-blush'], 'fab-beige': ['fab-terracotta', 'fab-sage', 'fab-cream'],
  'fab-dark': ['fab-ochre', 'fab-natural', 'fab-teal'], 'fab-blue': ['fab-cream', 'fab-ochre', 'fab-blush'], 'fab-white': ['fab-navy', 'fab-sage', 'fab-ochre'],
  'fab-yellow': ['fab-cream', 'fab-charcoal', 'fab-teal'], 'fab-rust': ['fab-cream', 'fab-natural', 'fab-charcoal'], 'fab-turq': ['fab-cream', 'fab-ochre', 'fab-navy'],
  'fab-black': ['fab-ochre', 'fab-cream', 'fab-terracotta'], 'fab-natural': ['fab-sage', 'fab-terracotta', 'fab-navy'], 'fab-pink': ['fab-cream', 'fab-charcoal', 'fab-sage'],
  'leather-black': ['fab-ochre', 'fab-cream', 'fab-natural'], 'leather-brown': ['fab-cream', 'fab-sage', 'fab-navy'],
};

// ───────────────────────────────────────────── 면·칸 찾기
function slabs(parts) {
  const cand = [];
  for (const p of parts) {
    if (p.opt || p.inner) continue;
    const tray = p.kind === 'lathe' && p.name === '트레이';
    if (!(p.kind === 'box' || p.kind === 'rbox' || (p.kind === 'ext' && p.plane === 'xz' && !p.wall) || (p.kind === 'cyl' && (p.axis || 'y') === 'y') || tray)) continue;
    if (p.rot && (p.rot[0] || p.rot[1] || p.rot[2])) continue;
    if (Math.abs((p.yaw || 0) % 90) > 0.01) continue;
    if (SOFT.has(p.role) || p.role === 'mirror') continue;
    const b = p.bb, sx = b.max[0] - b.min[0], sy = b.max[1] - b.min[1], sz = b.max[2] - b.min[2];
    if (sy > 62 || sx < 170 || sz < 36) continue;
    // 둥근 판인지: 윤곽 넓이가 경계 사각형보다 뚜렷이 작으면 가운데만 쓴다
    let round = p.kind === 'cyl' || tray;
    if (p.kind === 'ext') { let a = 0; p.pts.forEach((q, i) => { const n = p.pts[(i + 1) % p.pts.length]; a += q[0] * n[1] - n[0] * q[1]; }); round = Math.abs(a) / 2 < sx * sz * 0.9; }
    cand.push({ x0: b.min[0], x1: b.max[0], z0: b.min[2], z1: b.max[2], y: tray ? b.min[1] + 7 : b.max[1], parts: [p], round, role: p.role });
  }
  cand.sort((a, b) => a.y - b.y || a.z0 - b.z0);
  const out = [];
  for (const c of cand) {
    // 같은 높이에 나란한 살(slat)은 한 면으로 합친다
    const m = out.find((s) => Math.abs(s.y - c.y) < 2.5 && c.z0 - s.z1 < 75 && c.z0 - s.z1 > -5 && Math.min(s.x1, c.x1) - Math.max(s.x0, c.x0) > 0.8 * Math.min(s.x1 - s.x0, c.x1 - c.x0));
    if (m) { m.z1 = Math.max(m.z1, c.z1); m.x0 = Math.min(m.x0, c.x0); m.x1 = Math.max(m.x1, c.x1); m.parts.push(c.parts[0]); m.slat = true; } else out.push(c);
  }
  return out.filter((s) => s.z1 - s.z0 >= 130);
}

/**
 * 물건을 올릴 수 있는 칸. { x0, x1, z0, z1, y, clear } — clear = 위쪽 여유(없으면 Infinity).
 * 문·서랍으로 막힌 칸은 빼고, 유리문 안쪽은 포함한다.
 */
export function findBays(model) {
  const parts = model.parts, bays = [], H = 600;
  for (const s of slabs(parts)) {
    const above = [], occ = [], depth = s.z1 - s.z0;
    let zb = s.z0, zf = s.z1, rim = 0;
    for (const q of parts) {
      if (q.inner || s.parts.includes(q)) continue;
      const c = q.bb;
      // 서랍 앞판·문은 선반보다 앞에 붙으므로 앞쪽으로 45mm 더 본다
      if (Math.min(c.max[0], s.x1) - Math.max(c.min[0], s.x0) <= 3 || Math.min(c.max[2], s.z1 + 45) - Math.max(c.min[2], s.z0) <= 3) continue;
      if (c.max[1] <= s.y + 5 || c.min[1] >= s.y + H) continue;
      const qx = c.max[0] - c.min[0], qz = c.max[2] - c.min[2], rise = c.max[1] - s.y;
      if (c.min[2] >= s.z1 - 3) { // 선반 앞에 덧댄 판: 넓고 높으면 막힌 칸(유리는 안이 보인다)
        if (qz <= 46 && qx > 72 && rise > 60 && c.min[1] < s.y + 110 && q.role !== 'glass' && q.role !== 'smoke' && !(q.kind === 'ext' && q.wall)) occ.push([c.min[0], c.max[0]]); // 속 빈 문틀(유리문 테)은 막지 않는다
        continue;
      }
      if (c.min[1] >= s.y + 110) { above.push(c); continue; }
      if (q.kind === 'ext' && q.wall && q.plane === 'xz') { rim = Math.max(rim, q.wall + 4); continue; } // 트레이 테두리(속 빈 띠)
      if (rise <= 46) { if (qx > 60 && qz > 60) occ.push([c.min[0], c.max[0]]); continue; } // 낮은 턱은 무시
      const thinZ = qz <= 46, thinX = qx <= 72;
      if (thinZ && !thinX && c.max[2] <= s.z0 + depth * 0.4) { zb = Math.max(zb, c.max[2]); continue; } // 뒤판·보강대
      if (thinZ && !thinX && c.min[2] >= s.z0 + depth * 0.6) { // 앞을 막는 판
        if (q.role === 'glass' || q.role === 'smoke') { zf = Math.min(zf, c.min[2]); continue; }
        occ.push([c.min[0], c.max[0]]); continue;
      }
      occ.push([c.min[0], c.max[0]]); // 칸막이·기둥·서랍
    }
    occ.sort((a, b) => a[0] - b[0]);
    const free = [];
    let cur = s.x0 + 4;
    for (const [a, b] of occ) { if (a - cur >= 150) free.push([cur, a]); cur = Math.max(cur, b); }
    if (s.x1 - 4 - cur >= 150) free.push([cur, s.x1 - 4]);
    for (const [a, b] of free) {
      let clear = Infinity;
      for (const c of above) if (Math.min(c.max[0], b) - Math.max(c.min[0], a) > 12 && Math.min(c.max[2], zf) - Math.max(c.min[2], zb) > 12) clear = Math.min(clear, c.min[1] - s.y);
      if (zf - zb < 120) continue;
      bays.push({ x0: a + 4 + rim, x1: b - 4 - rim, z0: zb + 4 + rim, z1: zf - 4 - rim, y: s.y, clear, round: s.round, slat: !!s.slat, glass: s.role === 'glass' });
    }
  }
  return bays;
}

// ───────────────────────────────────────────── 소품 고르기
/** 칸 높이에 맞는 작은 장식 하나. 차지한 폭을 돌려준다. */
function trinket(k, R, x, y, z, clear, pal, o = {}) {
  const C = Math.min(clear, 900), opts = [];
  if (C >= 250) opts.push(['bush', 170], ['bush', 170], ['vase', 110], ['frame', 170]);
  if (C >= 430 && !o.low) opts.push(['branch', 150], ['dried', 150]);
  if (C >= 175) opts.push(['cactus', 110], ['jar', 100], ['frameS', 130]);
  if (C >= 240) opts.push(['candle', 70]);
  if (C >= 110) opts.push(['bowl', 150], ['stack', 240]);
  if (!opts.length) return 0;
  // 같은 가구 안에서 같은 소품이 연달아 나오지 않게 한다
  const fresh = opts.filter((q) => !pal.recent.includes(q[0]));
  const [kind, w] = pick(R, fresh.length ? fresh : opts), cer = pick(R, pal.ceramics);
  pal.recent.push(kind); if (pal.recent.length > 3) pal.recent.shift();
  k.at([x, y, z], (R() - 0.5) * 30, () => {
    if (kind === 'bush') PR.plant(k, { kind: 'bush', s: Math.min(0.62, (C - 20) / 330), potMat: cer, R });
    else if (kind === 'cactus') PR.plant(k, { kind: 'cactus', s: Math.min(1, (C - 16) / 135), potMat: pick(R, ['terracotta', cer]), R });
    else if (kind === 'vase') PR.vase(k, { kind: 'empty', s: Math.min(1, (C - 14) / 260), mat: cer, R });
    else if (kind === 'branch') PR.vase(k, { kind: 'branch', s: Math.min(0.9, (C - 20) / 520), mat: cer, R });
    else if (kind === 'dried') PR.vase(k, { kind: 'dried', s: Math.min(0.9, (C - 20) / 560), mat: pick(R, ['terracotta', cer]), R });
    else if (kind === 'frame') PR.standFrame(k, { w: 150, h: Math.min(205, C - 28), R, frameMat: pick(R, ['oak', 'black', 'white', 'brass']) });
    else if (kind === 'frameS') PR.standFrame(k, { w: 120, h: Math.min(150, C - 22), R, frameMat: pick(R, ['oak', 'black', 'white']) });
    else if (kind === 'jar') PR.jar(k, { s: Math.min(1, (C - 12) / 140), fill: pick(R, ['kraft', 'cream', 'ochre', 'soil']) });
    else if (kind === 'candle') PR.candle(k, { h: Math.min(190, C - 50) });
    else if (kind === 'bowl') PR.bowl(k, { r: 70, h: 52, mat: cer, R });
    else PR.bookStack(k, { R, n: Math.max(1, Math.min(3, Math.floor((C - 10) / 34))) });
  });
  return w;
}

/** 선반 한 칸을 채운다. */
function fillBay(k, R, b, pal) {
  const W = b.x1 - b.x0, D = b.z1 - b.z0, C = b.clear, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  if (W < 170 || D < 140 || C < 150) return;
  const zObj = b.z0 + D * 0.56, roll = R(), cube = W <= 430 && C <= 430 && W / C > 0.75 && W / C < 1.4;
  const row = (fill, from) => k.at([cx, b.y, cz], 0, () => PR.books(k, { w: W - 6, h: C, d: D, R, fill, from }));
  if (cube && roll < 0.24) { k.at([cx, b.y, cz + 6], 0, () => PR.binBox(k, { w: W - 14, h: C - 34, d: Math.min(D - 16, 360), mat: pick(R, pal.bins) })); return; }
  if (roll < 0.36) { row(0.86 + R() * 0.14, R() < 0.5 ? -1 : 1); return; }
  if (roll < 0.66) {
    const from = R() < 0.5 ? -1 : 1, fill = W < 330 ? 0.55 : 0.5 + R() * 0.18, used = row(fill, from) + 6, rest = W - 6 - used;
    if (rest > 110) trinket(k, R, cx - from * ((W - 6) / 2 - used - rest / 2), b.y, zObj, C, pal);
    return;
  }
  if (roll < 0.8 || C < 200) {
    const n = W < 430 ? 1 : W < 760 ? 2 : 3;
    for (let i = 0; i < n; i++) trinket(k, R, b.x0 + (W * (i + 0.5)) / n + (R() - 0.5) * 30, b.y, zObj, C, pal);
    return;
  }
  if (roll < 0.9 && W >= 300) {
    const n = Math.max(1, Math.floor(W / 350)), bw = Math.min(340, (W - 20 - (n - 1) * 14) / n), bh = Math.min(C - 26, 250), mat = pick(R, pal.boxes);
    for (let i = 0; i < n; i++) k.at([b.x0 + 10 + bw / 2 + i * (bw + 14), b.y, cz + 4], 0, () => PR.storageBox(k, { w: bw, h: bh, d: Math.min(D - 20, 340), mat }));
    return;
  }
  const from = R() < 0.5 ? -1 : 1, sw = Math.min(250, W * 0.5);
  k.at([cx + from * (W / 2 - sw / 2 - 8), b.y, zObj], 0, () => PR.bookStack(k, { R, n: Math.max(2, Math.min(4, Math.floor((C - 20) / 36))) }));
  if (W - sw > 150) trinket(k, R, cx - from * (W / 2 - (W - sw) / 2), b.y, zObj, C, pal);
}

/** 상판 위 장식. kind 에 따라 다른 세트를 놓는다. avoid = [x0, x1] 는 비워 둘 구간(위에 다른 가구가 올라감). */
function topDecor(k, R, b, kind, pal, avoid) {
  const W = b.x1 - b.x0, D = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, y = b.y;
  const free = (x, r) => !avoid || x + r < avoid[0] || x - r > avoid[1];
  const put = (x, z, r, fn, yaw = 0) => { if (free(x, r) && x - r >= b.x0 - 6 && x + r <= b.x1 + 6) { k.at([x, y, z], yaw, fn); return true; } return false; };
  const cer = () => pick(R, pal.ceramics), ins = b.round ? 0.2 : 0.06, L = b.x0 + W * ins, Rt = b.x1 - W * ins, zb = b.z0 + D * (b.round ? 0.5 : 0.36), zf = b.z0 + D * (b.round ? 0.5 : 0.66);
  if (kind === 'tv') {
    const tw = Math.max(700, Math.min(1250, W * 0.62));
    put(cx, cz - D * 0.08, tw / 2, () => PR.tv(k, { w: tw }));
    if (W - tw > 520) { put(L + 90, cz, 90, () => PR.plant(k, { kind: pick(R, ['bush', 'cactus']), s: 0.6, potMat: cer(), R })); put(Rt - 110, cz, 110, () => PR.bookStack(k, { R, n: 3 }), 12); }
    else if (W - tw > 260) put(Rt - 70, cz, 70, () => PR.plant(k, { kind: 'cactus', s: 0.9, potMat: cer(), R }));
    return;
  }
  if (kind === 'dining') {
    const big = W >= 1150 && !b.round;
    if (big) k.box('테이블 러너', [W * 0.9, 2.2, Math.min(380, D * 0.46)], [cx, y + 1.1, cz], { role: 'prop', mat: pal.runner, phase: 'prop', group: '소품', bevel: 0 });
    put(cx + (big ? -W * 0.06 : 0), cz, 70, () => PR.vase(k, { kind: pick(R, ['tulip', 'branch', 'tulip']), s: 0.95, mat: cer(), R }));
    if (big) { put(cx + W * 0.2, cz, 140, () => PR.bowl(k, { fruit: 5, mat: cer(), R })); put(cx - W * 0.25, cz - 20, 40, () => PR.candle(k, {})); put(cx - W * 0.31, cz + 30, 40, () => PR.candle(k, { h: 150 })); }
    else put(cx + (b.round ? W * 0.16 : W * 0.24), cz + D * 0.1, 80, () => PR.bowl(k, { r: 95, h: 60, fruit: 3, mat: cer(), R }));
    return;
  }
  if (kind === 'desk') {
    put(cx - W * 0.04, zf - 20, 170, () => PR.laptop(k), (R() - 0.5) * 8);
    put(cx + Math.min(W * 0.3, 330), zf, 60, () => PR.mug(k, { mat: cer() }), 40);
    put(L + 60, zb - 20, 50, () => PR.penCup(k, { R }));
    if (W > 900) put(Rt - 110, zb + 20, 100, () => PR.plant(k, { kind: pick(R, ['bush', 'cactus']), s: 0.55, potMat: cer(), R }));
    if (W > 1100) put(cx - W * 0.3, zf + 10, 110, () => PR.notebook(k, { R }));
    return;
  }
  if (kind === 'coffee') {
    put(cx - W * 0.2, cz, 130, () => PR.bookStack(k, { R, n: 2 + Math.floor(R() * 2) }), (R() - 0.5) * 20);
    put(cx + W * 0.16, cz - D * 0.12, 70, () => (R() < 0.5 ? PR.plant(k, { kind: 'bush', s: 0.5, potMat: cer(), R }) : PR.vase(k, { kind: 'tulip', s: 0.7, mat: cer(), R })));
    put(cx + W * 0.24, cz + D * 0.2, 55, () => PR.mug(k, { mat: cer() }), 200);
    if (W > 1000) put(cx - W * 0.02, cz + D * 0.2, 80, () => PR.candle(k, { h: 90 }));
    return;
  }
  if (kind === 'kidstable') {
    put(cx - W * 0.18, cz, 120, () => PR.blocks(k, { R, n: 5, s: 40 }));
    put(cx + W * 0.22, cz - D * 0.1, 60, () => PR.stacker(k, { s: 0.8 }));
    k.at([cx + W * 0.1, y, cz + D * 0.22], 18, () => { k.box('도화지', [200, 1.6, 150], [0, 0.8, 0], { role: 'prop', mat: 'cream', phase: 'prop', group: '소품', bevel: 0 }); for (let i = 0; i < 4; i++) k.cyl('크레용', 5, 80, [-60 + i * 22, 5, 100], { role: 'prop', mat: pick(R, ['pl-red', 'pl-blue', 'pl-yellow', 'pl-green']), axis: 'x', rot: [0, 60 + R() * 60, 0], phase: 'prop', group: '소품' }); });
    return;
  }
  if (kind === 'cart') {
    const n = Math.max(2, Math.min(4, Math.floor(W / 150)));
    for (let i = 0; i < n; i++) {
      const x = b.x0 + (W * (i + 0.5)) / n, z = cz + (R() - 0.5) * D * 0.3, r = R(), lim = Math.min(b.clear, 900);
      put(x, z, 50, () => (r < 0.34 && lim > 280 ? PR.bottle(k, { mat: pick(R, ['ceramic-sage', 'smoke', 'ceramic-blue', 'ceramic']), s: 0.92 }) : r < 0.68 || lim < 230 ? PR.jar(k, { s: Math.min(1, (lim - 20) / 140), fill: pick(R, ['kraft', 'cream', 'ochre', 'soil', 'rust']) }) : PR.plant(k, { kind: 'bush', s: Math.min(0.5, (lim - 20) / 330), potMat: 'terracotta', R })));
    }
    return;
  }
  if (kind === 'ledge') {
    put(cx - W * 0.26, cz - D * 0.12, 90, () => PR.standFrame(k, { w: 170, h: 230, R, frameMat: 'black' }), 4);
    put(cx - W * 0.1, cz, 70, () => PR.standFrame(k, { w: 120, h: 160, R, frameMat: 'oak' }), -8);
    put(cx + W * 0.14, cz, 70, () => PR.plant(k, { kind: 'bush', s: 0.5, potMat: cer(), R }));
    put(cx + W * 0.34, cz, 90, () => PR.bookStack(k, { R, n: 2, s: 0.8 }), 10);
    return;
  }
  if (kind === 'bistro') { put(cx, cz, 60, () => PR.vase(k, { kind: 'tulip', s: 0.6, mat: cer(), R })); return; }
  if (kind === 'side' || W < 620) {
    const r = R();
    if (r < 0.4 && !avoid) put(cx, cz, 110, () => PR.lampTable(k, { s: W < 420 ? 0.7 : 0.85, baseMat: cer() }));
    else if (r < 0.75) put(cx - W * 0.1, cz - D * 0.05, 90, () => PR.plant(k, { kind: 'bush', s: 0.55, potMat: cer(), R }));
    else { put(cx - W * 0.08, cz, 120, () => PR.bookStack(k, { R, n: 2, s: 0.85 }), 14); }
    if (W >= 430) put(cx + W * 0.27, cz + D * 0.2, 50, () => PR.mug(k, { mat: cer() }), 130);
    return;
  }
  // chest · shelfTop: 스탠드/꽃병 + 액자 + 작은 식물
  const a = R() < 0.5 ? 1 : -1;
  if (!put(cx - a * W * 0.3, cz, 120, () => (kind === 'chest' && R() < 0.6 ? PR.lampTable(k, { s: 0.9, baseMat: cer() }) : PR.vase(k, { kind: pick(R, ['branch', 'dried']), s: 0.9, mat: cer(), R })))) put(cx - a * W * 0.3, cz, 60, () => PR.candle(k, {}));
  put(cx + a * W * 0.05, zb - 10, 95, () => PR.standFrame(k, { w: 170, h: 225, R, frameMat: pick(R, ['oak', 'black', 'brass']) }), a * 6);
  put(cx + a * W * 0.28, cz + 10, 90, () => (R() < 0.6 ? PR.plant(k, { kind: pick(R, ['bush', 'cactus']), s: 0.55, potMat: cer(), R }) : PR.bookStack(k, { R, n: 2 })), 10);
  if (W > 1300) put(cx + a * W * 0.42, cz, 60, () => PR.candle(k, { h: 120 }));
}

function palette(R) {
  const sets = [
    { ceramics: ['ceramic', 'terracotta', 'ceramic-sage'], bins: ['fab-natural', 'fab-sage'], boxes: ['kraft', 'cream'], runner: 'linen', throws: null },
    { ceramics: ['ceramic', 'ceramic-blue', 'stone'], bins: ['fab-gray', 'fab-natural'], boxes: ['cream', 'grayblue'], runner: 'linen', throws: null },
    { ceramics: ['ceramic-black', 'ceramic', 'terracotta'], bins: ['fab-charcoal', 'fab-natural'], boxes: ['kraft', 'anthracite'], runner: 'fab-natural', throws: null },
  ];
  return { ...pick(R, sets), recent: [] };
}

/** 소품 부품 목록에 실물 스캔 대체 정보(reals)를 붙여 돌려준다. */
const done = (k) => { const parts = k.parts; parts.reals = k.reals || []; return parts; };

// ───────────────────────────────────────────── 종류별 규칙
function styleSeat(k, R, model, item, fin, arm, throws) {
  const soft = model.parts.filter((p) => !p.opt && SOFT.has(p.role));
  const seats = soft.filter((p) => { const b = p.bb; return b.max[1] - b.min[1] <= 250 && b.max[1] >= 330 && b.max[1] <= 580 && b.max[0] - b.min[0] >= 380 && b.max[2] - b.min[2] >= 380; });
  if (!seats.length) return;
  const sy = Math.max(...seats.map((p) => p.bb.max[1])), top = seats.filter((p) => p.bb.max[1] >= sy - 40);
  const x0 = Math.min(...top.map((p) => p.bb.min[0])), x1 = Math.max(...top.map((p) => p.bb.max[0])), z0 = Math.min(...top.map((p) => p.bb.min[2])), z1 = Math.max(...top.map((p) => p.bb.max[2]));
  // 등받이 쿠션 앞면(좌판 높이 바로 위에서)
  const backs = soft.filter((p) => { const b = p.bb; return !top.includes(p) && b.max[1] >= sy + 170 && (b.min[2] + b.max[2]) / 2 < (z0 + z1) / 2 - (z1 - z0) * 0.12 && b.max[0] - b.min[0] >= Math.min(380, (x1 - x0) * 0.25) && b.min[0] < x1 - 100 && b.max[0] > x0 + 100; });
  if (!backs.length) return;
  const zb = Math.max(...backs.map((p) => p.bb.max[2]));
  const base = (fin && fin.map && (fin.map.cushion || fin.map.fabric || fin.map.seat)) || 'fab-gray', cols = throws || THROW[base] || ['fab-ochre', 'fab-cream', 'fab-sage'];
  const W = x1 - x0;
  if (arm) { k.at([(x0 + x1) / 2 + (R() - 0.5) * 60, sy - 6, zb + 46], (R() - 0.5) * 14, () => PR.cushion(k, { s: 300, w: 440, t: 120, mat: cols[0], lean: 24 })); return; }
  const spots = W >= 2000 ? [[x0 + 250, 0, 420], [x0 + 560, 1, 380], [x1 - 260, 2, 420]] : W >= 1300 ? [[x0 + 240, 0, 420], [x1 - 250, 1, 400]] : [[x0 + W * 0.3, 0, 400]];
  for (const [x, ci, s] of spots) k.at([x, sy - 8, zb + 52], (R() - 0.5) * 24, () => PR.cushion(k, { s, t: 125, mat: cols[ci % cols.length], lean: 22 + R() * 6 }));
  if (W >= 1700) k.at([x1 - 640 - R() * 120, sy - 4, z1 - 300], 6, () => PR.blanket(k, { mat: cols[(1 + Math.floor(R() * 2)) % cols.length] }));
}

function styleBed(k, R, model, kids) {
  const pillows = model.parts.filter((p) => p.role === 'pillow'), duvet = model.parts.find((p) => p.role === 'duvet'), matt = model.parts.filter((p) => p.role === 'mattress');
  const cols = pick(R, [['fab-ochre', 'fab-cream'], ['fab-sage', 'fab-natural'], ['fab-terracotta', 'fab-cream'], ['fab-navy', 'fab-blush'], ['fab-teal', 'fab-cream']]);
  if (kids) {
    const m = matt.sort((a, b) => b.bb.max[1] - a.bb.max[1])[0];
    if (!m) return;
    const b = m.bb, cx = (b.min[0] + b.max[0]) / 2;
    k.at([cx + (R() - 0.5) * 200, b.max[1] - 4, b.min[2] + (b.max[2] - b.min[2]) * 0.42], (R() - 0.5) * 40, () => PR.teddy(k, { s: 0.95, mat: pick(R, ['fab-natural', 'fab-ochre', 'fab-cream']) }));
    k.at([cx, b.max[1], b.max[2] - 330], 0, () => PR.bedRunner(k, { w: b.max[0] - b.min[0] - 30, d: 520, mat: cols[0] }));
    return;
  }
  if (duvet) { const b = duvet.bb; k.at([(b.min[0] + b.max[0]) / 2, b.max[1] - 6, b.max[2] - 330], 0, () => PR.bedRunner(k, { w: b.max[0] - b.min[0] + 26, d: 500, mat: cols[0] })); }
  const front = pillows.filter((p) => p.name === '베개');
  if (front.length) {
    const py = Math.max(...front.map((p) => p.bb.max[1])), pz = Math.max(...front.map((p) => p.bb.max[2]));
    if (front.length >= 2) {
      const xs = front.map((p) => (p.bb.min[0] + p.bb.max[0]) / 2).sort((a, b) => a - b), mid = (xs[0] + xs[xs.length - 1]) / 2;
      k.at([mid - 210, py - 96, pz + 60], 8, () => PR.cushion(k, { s: 400, t: 120, mat: cols[0], lean: 30 }));
      k.at([mid + 200, py - 96, pz + 60], -6, () => PR.cushion(k, { s: 400, t: 120, mat: cols[1], lean: 30 }));
    } else { const p = front[0].bb; k.at([(p.min[0] + p.max[0]) / 2, py - 90, pz + 50], 5, () => PR.cushion(k, { s: 360, t: 110, mat: cols[0], lean: 30 })); }
  }
}

function styleRack(k, R, model) {
  // 가장 높은 가로 봉에 옷을 건다
  const rails = model.parts.filter((p) => (p.kind === 'cyl' || p.kind === 'tube') && p.bb.max[0] - p.bb.min[0] > model.bbox.size[0] * 0.55 && p.bb.max[1] - p.bb.min[1] < 80);
  const rail = rails.sort((a, b) => b.bb.max[1] - a.bb.max[1])[0];
  if (!rail) return;
  const b = rail.bb, y = (b.min[1] + b.max[1]) / 2, z = (b.min[2] + b.max[2]) / 2, x0 = b.min[0] + 110, x1 = b.max[0] - 110, n = Math.max(3, Math.floor((x1 - x0) / 105));
  const mats = ['fab-cream', 'fab-navy', 'fab-terracotta', 'fab-sage', 'fab-charcoal', 'fab-ochre', 'fab-blush', 'fab-natural', 'fab-teal'];
  for (let i = 0; i < n; i++) {
    if (R() < 0.14) continue;
    const kind = pick(R, ['shirt', 'shirt', 'coat', 'dress']);
    k.at([x0 + ((x1 - x0) * i) / (n - 1) + (R() - 0.5) * 18, y - b.max[1] + b.min[1], z], (R() - 0.5) * 12, () => PR.garment(k, { kind, mat: pick(R, mats), s: Math.min(1, (y - 120) / 1000) }));
  }
}

/**
 * 가구 하나를 꾸민다. 소품 부품 목록(모델 좌표계)을 돌려준다.
 * opts: finish(마감), avoid([x0,x1] 상판에서 비워 둘 구간), seed, throws(쿠션 색 지정)
 */
export function styleModel(item, model, opts = {}) {
  const kind = opts.kind || styleKind(item);
  if (kind === 'none') return [];
  const R = rng(hashStr(item.id) + (opts.seed || 0) * 977), k = new Kit({ N: 12 }), pal = palette(R);
  const fin = opts.finish || item.finishes[0];
  if (kind === 'sofa' || kind === 'armchair') { styleSeat(k, R, model, item, fin, kind === 'armchair', opts.throws || null); return done(k); }
  if (kind === 'bed' || kind === 'kidsbed') { styleBed(k, R, model, kind === 'kidsbed'); return done(k); }
  if (kind === 'daybed') {
    const m = model.parts.filter((p) => p.role === 'mattress').sort((a, b) => b.bb.max[1] - a.bb.max[1])[0];
    if (m) k.at([m.bb.max[0] - 330, m.bb.max[1] - 4, m.bb.max[2] - 260], 8, () => PR.blanket(k, { mat: pick(R, ['fab-ochre', 'fab-sage', 'fab-terracotta']) }));
    return done(k);
  }
  if (kind === 'rack') { styleRack(k, R, model); return done(k); }
  const bays = findBays(model), H = model.bbox.max[1];
  const tops = bays.filter((b) => b.clear > 560).sort((a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0));
  const inner = bays.filter((b) => b.clear <= 560);
  if (kind === 'shelf' || kind === 'chest' || kind === 'vitrine' || kind === 'kidschest' || kind === 'tv' || kind === 'coffee' || kind === 'side' || kind === 'desk') {
    for (const b of inner) {
      if (b.y > 1950 || b.y < 40) continue;
      if (kind === 'vitrine') { const n = b.x1 - b.x0 < 420 ? 1 : 2; for (let i = 0; i < n; i++) trinket(k, R, b.x0 + ((b.x1 - b.x0) * (i + 0.5)) / n, b.y, (b.z0 + b.z1) / 2, b.clear, pal); continue; }
      if (kind === 'kidschest') continue;
      if (kind === 'desk' && b.y > 500) continue;
      fillBay(k, R, b, pal);
    }
  }
  // 상판: 가장 넓은 면 하나(선반류는 눈높이 아래의 맨 위 면)
  let top = null;
  if (kind === 'shelf' || kind === 'vitrine') top = tops.filter((b) => b.y > H - 80 && b.y <= 1620 && !b.glass)[0] || null;
  else if (kind === 'cart') { for (const b of bays) if (b.y > 120) topDecor(k, R, b, 'cart', pal, null); }
  else if (kind === 'ledge') top = tops[0] || null;
  else top = tops.filter((b) => b.y >= 250 && b.y <= 1350)[0] || null;
  if (top) {
    const tk = kind === 'shelf' || kind === 'vitrine' ? (top.y > 1300 ? 'shelfTop' : 'chest') : kind === 'kidschest' ? 'kidstable' : kind;
    if (kind === 'shelf' && top.y > 1300) {
      // 높은 선반 위: 늘어지는 덩굴이나 바구니
      const W = top.x1 - top.x0, cx = (top.x0 + top.x1) / 2;
      if (R() < 0.55) k.at([cx - W * 0.22, top.y, top.z1 - 95], 0, () => PR.plant(k, { kind: 'ivy', s: 0.9, potMat: pick(R, pal.ceramics), R }));
      else k.at([cx - W * 0.2, top.y, (top.z0 + top.z1) / 2], 0, () => PR.basket(k, { r: Math.min(150, (top.z1 - top.z0) / 2 - 10), h: 190 }));
      if (W > 600) k.at([cx + W * 0.24, top.y, (top.z0 + top.z1) / 2], 8, () => PR.storageBox(k, { w: 280, h: 170, d: Math.min(300, top.z1 - top.z0 - 20), mat: pick(R, pal.boxes) }));
    } else topDecor(k, R, top, tk, pal, opts.avoid || null);
  }
  if (kind === 'shelf' && !top) {
    // 키 큰 책장: 맨 위에 상자 하나
    const t = tops.filter((b) => b.y > H - 80 && b.y <= 2050)[0];
    if (t && R() < 0.7) k.at([(t.x0 + t.x1) / 2 + (R() - 0.5) * (t.x1 - t.x0) * 0.4, t.y, (t.z0 + t.z1) / 2], 0, () => PR.storageBox(k, { w: 300, h: 150, d: Math.min(260, t.z1 - t.z0 - 16), mat: pick(R, pal.boxes) }));
  }
  return done(k);
}
