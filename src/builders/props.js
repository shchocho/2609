// props.js — 룸 세트 소품(식물·책·액자·러그·쿠션…). 가구와 같은 Kit 부품으로 만들지만
// 도면·재단표·내보내기에는 들어가지 않는다. 모든 소품은 원점(바닥 가운데)에 +Z 정면으로 만든다.
// 재질은 마감표를 거치지 않고 mat 키로 직접 지정한다.

import { roundedRect, circlePts, stripProfile } from '../core/geom.js';

const D2R = Math.PI / 180;

/** 시드 고정 난수(mulberry32). 같은 가구는 언제나 같은 소품 배치가 나온다. */
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

const P = (mat, o) => ({ role: 'prop', mat, phase: 'prop', group: '소품', lo: true, ...o });
export const pick = (R, list) => list[Math.min(list.length - 1, Math.floor(R() * list.length))];
const rect = (w, h) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];

const BOOKS = ['cream', 'white', 'cream', 'beige', 'kraft', 'white', 'red', 'navy', 'yellow', 'green', 'anthracite', 'grayblue', 'pink', 'turq', 'blue', 'sage', 'black', 'ochre', 'rust', 'teal', 'plum', 'ink', 'gray', 'orange'];
export const ACCENTS = ['fab-ochre', 'fab-sage', 'fab-terracotta', 'fab-navy', 'fab-cream', 'fab-blush', 'fab-teal', 'fab-charcoal', 'fab-natural', 'fab-rust'];

// ───────────────────────────────────────────── 책
/** 꽂힌 책 한 줄. 원점 = 칸 가운데 바닥. 폭 w, 칸 깊이 d, 칸 높이 h. fill = 채울 비율, from = 시작하는 쪽(-1 왼쪽). 채운 끝 x를 돌려준다. */
export function books(k, { w, h, d, R, fill = 1, from = -1, lean = true }) {
  const hmax = Math.min(h - 14, 305), front = d / 2 - 12 - R() * 16, lim = w * fill - 2;
  let u = 2, run = 0, rc = 'cream', rh = 0, rt = 0, rd = 0, last = null;
  const X = (a) => from * (w / 2 - a);
  while (u < lim) {
    if (run <= 0 && R() < 0.16) { run = 2 + Math.floor(R() * 4); rc = pick(R, BOOKS); rh = hmax * (0.7 + R() * 0.28); rt = 20 + R() * 22; rd = Math.min(d - 30, 150 + R() * 70); }
    const t = run > 0 ? rt : 14 + R() * 30, hh = Math.max(110, run > 0 ? rh : hmax * (0.62 + R() * 0.38)), dd = Math.max(80, run > 0 ? rd : Math.min(d - 30, 135 + R() * 95));
    if (u + t > lim) break;
    k.box('책', [t - 0.9, hh, dd], [X(u + t / 2), hh / 2, front - dd / 2], P(run > 0 ? rc : pick(R, BOOKS)));
    last = { u: u + t, hh, dd };
    u += t; run--;
  }
  if (lean && last && fill < 0.97 && w - last.u > 90) {
    // 마지막 한 권은 기대어 놓는다
    const a = 11 + R() * 8, t = 20 + R() * 10, hh = Math.min(last.hh * 0.96, hmax * 0.9), s = Math.sin(a * D2R), c = Math.cos(a * D2R);
    k.box('책', [t, hh, last.dd], [X(last.u + (t / 2) * c + (hh / 2) * s + 1), (hh / 2) * c + (t / 2) * s, front - last.dd / 2], P(pick(R, BOOKS), { rot: [0, 0, -from * a] }));
    return last.u + hh * s + t;
  }
  return last ? last.u : 0;
}

/** 눕혀 쌓은 책 더미. 높이를 돌려준다. */
export function bookStack(k, { R, n = 3, s = 1 }) {
  let y = 0;
  for (let i = 0; i < n; i++) {
    const t = (16 + R() * 22) * s, w = (190 + R() * 70) * s * (1 - i * 0.04), d = (140 + R() * 50) * s * (1 - i * 0.04);
    k.at([(R() - 0.5) * 14, y, (R() - 0.5) * 10], (R() - 0.5) * 14, () => k.box('책', [w, t, d], [0, t / 2, 0], P(pick(R, BOOKS))));
    y += t;
  }
  return y;
}

// ───────────────────────────────────────────── 화분·식물
/** 화분. 윗면이 살짝 파여 흙이 보인다. 높이를 돌려준다. */
export function pot(k, { r = 90, h = 150, mat = 'terracotta', taper = 0.74 }) {
  const t = Math.max(5, r * 0.09);
  if (mat === 'basket') {
    k.lathe('바구니 화분', [[0, 0], [r * 0.86, 0], [r, h * 0.5], [r * 0.95, h], [r * 0.95 - t, h], [r - t, h - 14], [0, h - 14]], [0, 0, 0], P('basket'));
  } else {
    k.lathe('화분', [[0, 0], [r * taper, 0], [r, h - t * 1.6], [r + t * 0.6, h - t * 1.6], [r + t * 0.6, h], [r - t, h], [r - t - 2, h - 14], [0, h - 14]], [0, 0, 0], P(mat));
  }
  k.cyl('흙', r - t - 3, 4, [0, h - 13, 0], P('soil'));
  return h;
}

/** 잎 윤곽(끝이 +v 방향). L 길이, W 폭, shape: oval | lance | round */
function leafPts(L, W, shape = 'oval') {
  const n = 8, R = [], Lf = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const hw = shape === 'lance' ? (W / 2) * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.62)), 0.85) : shape === 'round' ? (W / 2) * Math.pow(Math.sin(Math.PI * t), 0.55) : (W / 2) * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.8);
    R.push([hw, L * t]); Lf.push([-hw, L * t]);
  }
  return [[0, 0], ...R, [0, L], ...Lf.reverse()];
}
/** 몬스테라 잎: 하트 모양에 깊은 홈. 잎자루가 붙는 점이 원점. */
function monsteraPts(L, W) {
  const pts = [], n = 44;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2, da = Math.abs(((a + Math.PI / 2 + Math.PI) % (Math.PI * 2)) - Math.PI);
    const side = Math.abs(Math.cos(a));
    const notch = Math.pow(Math.abs(Math.sin(a * 3.5 + 0.4)), 10) * 0.42 * Math.pow(side, 0.6);
    const cleft = 0.3 * Math.exp(-(da * da) / 0.1);
    const r = 1 - notch - cleft;
    pts.push([(W / 2) * r * Math.cos(a), L * 0.44 + (L / 2) * r * Math.sin(a) * (Math.sin(a) > 0 ? 1.12 : 0.88)]);
  }
  return pts;
}

/**
 * 화분 식물. kind: snake(산세베리아) | rubber(고무나무) | monstera | bush(둥근 잎 덤불) | cactus | ivy(늘어지는 덩굴)
 * s = 크기 배율(1 = 바닥에 두는 큰 화분). 전체 높이를 돌려준다.
 */
export function plant(k, { kind = 'rubber', s = 1, potMat = 'terracotta', R }) {
  if (kind === 'snake') {
    const pr = 105 * s, ph = pot(k, { r: pr, h: 190 * s, mat: potMat, taper: 0.8 }), n = 8 + Math.floor(R() * 4);
    let top = 0;
    for (let i = 0; i < n; i++) {
      const a = R() * 360, rr = pr * 0.5 * Math.sqrt(R()), L = (380 + R() * 420) * s, W = (48 + R() * 26) * s;
      k.at([rr * Math.cos(a * D2R), ph - 16, rr * Math.sin(a * D2R)], R() * 180, () => k.ext('잎', leafPts(L, W, 'lance'), 3.2 * s, 'xy', [0, 0, 0], P(i % 3 === 0 ? 'leaf' : 'leafdark', { rot: [(R() - 0.5) * 20, 0, (R() - 0.5) * 18], bevel: 0.6 })));
      top = Math.max(top, ph + L * 0.97);
    }
    return top;
  }
  if (kind === 'monstera') {
    const pr = 130 * s, ph = pot(k, { r: pr, h: 230 * s, mat: potMat }), n = 8 + Math.floor(R() * 3);
    let top = 0;
    for (let i = 0; i < n; i++) {
      const a = i * 137.5 + R() * 30, out = (150 + R() * 230) * s, up = (260 + R() * 420) * s * (1 - (out / (380 * s)) * 0.25), L = (190 + R() * 90) * s;
      k.at([0, ph - 16, 0], a, () => {
        k.tube('잎자루', [[0, 0, pr * 0.2], [0, up * 0.62, out * 0.3], [0, up, out]], 3.4 * s, { corner: up * 0.3, ...P('leafdark') });
        k.ext('잎', monsteraPts(L, L * 0.92), 2.6 * s, 'xz', [0, up, out - L * 0.06], P(i % 2 ? 'leaf' : 'leafdark', { rot: [-(22 + R() * 30), 0, (R() - 0.5) * 24], bevel: 0.5 }));
      });
      top = Math.max(top, ph + up + L * 0.5);
    }
    return top;
  }
  if (kind === 'bush') {
    const pr = 78 * s, ph = pot(k, { r: pr, h: 120 * s, mat: potMat }), n = 11 + Math.floor(R() * 5);
    for (let i = 0; i < n; i++) {
      const a = i * 137.5, t = (i + 0.5) / n, rr = pr * 1.25 * Math.sqrt(t), r = (30 + R() * 22) * s;
      k.sph('잎', r, [rr * Math.cos(a * D2R), ph + r * 0.55 + (1 - t) * 95 * s + R() * 14 * s, rr * Math.sin(a * D2R)], P(pick(R, ['leaf', 'leaf', 'leaflight', 'leafdark']), { sy: 0.82 }));
    }
    return ph + 190 * s;
  }
  if (kind === 'cactus') {
    const pr = 52 * s, ph = pot(k, { r: pr, h: 80 * s, mat: potMat, taper: 0.82 });
    k.sph('선인장', 34 * s, [0, ph + 52 * s, 0], P('leafgray', { sy: 1.9 }));
    k.sph('선인장 가지', 15 * s, [30 * s, ph + 66 * s, 0], P('leafgray', { sy: 1.7 }));
    if (R() < 0.6) k.sph('선인장 가지', 13 * s, [-28 * s, ph + 44 * s, 6 * s], P('leafgray', { sy: 1.6 }));
    return ph + 120 * s;
  }
  if (kind === 'ivy') {
    // 선반 위에서 앞으로 흘러내리는 덩굴. 원점이 선반 앞 모서리 근처라고 가정한다.
    const pr = 70 * s, ph = pot(k, { r: pr, h: 105 * s, mat: potMat }), n = 4 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) {
      const a = -55 + (110 * (i + 0.5)) / n + (R() - 0.5) * 16, len = (230 + R() * 330) * s, out = pr + 45 * s;
      k.at([0, 0, 0], a, () => {
        k.tube('덩굴', [[0, ph - 14, pr * 0.3], [0, ph + 34 * s, out * 0.75], [0, ph - 30 * s, out + 16 * s], [0, ph - len, out + 8 * s]], 2.1 * s, { corner: 40 * s, ...P('leafdark') });
        const m = Math.max(4, Math.round(len / (62 * s)));
        for (let j = 0; j < m; j++) {
          const y = ph - 10 * s - ((len - 20 * s) * (j + 0.4)) / m, sd = j % 2 ? 1 : -1;
          k.ext('잎', leafPts(46 * s, 38 * s, 'round'), 1.8 * s, 'xy', [sd * 4 * s, y, out + 12 * s], P(j % 3 ? 'leaf' : 'leaflight', { rot: [150 + R() * 30, 0, sd * (25 + R() * 30)], bevel: 0.4 }));
        }
      });
    }
    for (let i = 0; i < 6; i++) { const a = i * 60 + R() * 30; k.sph('잎', (26 + R() * 12) * s, [pr * 0.55 * Math.cos(a * D2R), ph + 24 * s, pr * 0.55 * Math.sin(a * D2R)], P(i % 2 ? 'leaf' : 'leaflight', { sy: 0.7 })); }
    return ph + 60 * s;
  }
  // rubber: 곧은 줄기에 타원 잎이 돌려나는 고무나무
  const pr = 125 * s, ph = pot(k, { r: pr, h: 220 * s, mat: potMat }), H = (620 + R() * 380) * s, n = 11 + Math.floor(R() * 5);
  k.cyl('줄기', 7 * s, H, [0, ph - 14 + H / 2, 0], P('lightbrown', { r2: 4.5 * s }));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.6) / n, y = ph + H * (0.22 + 0.8 * t), a = i * 137.5 + R() * 20, L = (150 + R() * 70) * s * (1 - t * 0.25), pitch = 18 + t * 42 + R() * 10;
    k.at([0, y, 0], a, () => k.ext('잎', leafPts(L, L * 0.52), 2.8 * s, 'xz', [0, 0, 5 * s], P(i % 3 === 1 ? 'leaf' : 'leafdark', { rot: [-pitch, 0, (R() - 0.5) * 20], bevel: 0.6 })));
  }
  return ph + H + 120 * s;
}

/** 꽃병. kind: branch(유칼립투스 가지) | tulip | dried(팜파스) | empty */
export function vase(k, { kind = 'branch', s = 1, mat = 'ceramic', R }) {
  const h = (170 + R() * 80) * s, r = (38 + R() * 16) * s, nk = r * (0.42 + R() * 0.2);
  k.lathe('꽃병', [[0, 0], [r * 0.7, 0], [r, h * 0.34], [r * 0.92, h * 0.58], [nk, h * 0.86], [nk * 1.12, h], [nk * 0.8, h], [nk * 0.72, h - 10], [0, h - 10]], [0, 0, 0], P(mat));
  if (kind === 'empty') return h;
  const n = kind === 'tulip' ? 5 + Math.floor(R() * 3) : 3 + Math.floor(R() * 2);
  for (let i = 0; i < n; i++) {
    const a = (360 * i) / n + R() * 40, out = (30 + R() * 90) * s * (kind === 'tulip' ? 0.7 : 1), up = (kind === 'tulip' ? 150 + R() * 70 : 230 + R() * 190) * s;
    k.at([0, 0, 0], a, () => {
      k.tube('줄기', [[0, h - 30, 0], [0, h + up * 0.55, out * 0.35], [0, h + up, out]], (kind === 'dried' ? 1.6 : 2) * s, { corner: up * 0.3, ...P(kind === 'dried' ? 'kraft' : 'leafdark') });
      if (kind === 'tulip') k.sph('꽃', 17 * s, [0, h + up + 12 * s, out], P(pick(R, ['pink', 'yellow', 'red', 'white', 'orange']), { sy: 1.35 }));
      else if (kind === 'dried') k.sph('이삭', 15 * s, [0, h + up + 50 * s, out + 6 * s], P('cream', { sy: 4.2, rot: [10 + R() * 12, 0, 0] }));
      else for (let j = 0; j < 6; j++) { const t = 0.35 + 0.65 * (j / 5); k.cyl('잎', (15 - j) * s, 1.6, [(j % 2 ? 1 : -1) * 15 * s, h + up * t, out * t * t + 3], P(j % 2 ? 'leafgray' : 'leaf', { axis: 'z', rot: [(R() - 0.5) * 50, (j % 2 ? 1 : -1) * 35, 0] })); }
    });
  }
  return h + 300 * s;
}

// ───────────────────────────────────────────── 액자·그림
const ART_INKS = ['ochre', 'rust', 'sage', 'teal', 'ink', 'pink', 'terracotta', 'navy', 'green', 'plum', 'grayblue', 'yellow'];
/** 판화풍 그림. 원점 = 그림 가운데, 앞면이 +Z. 얇은 색판을 겹쳐 만든다. */
function art(k, { w, h, kind, R, z }) {
  const c = () => pick(R, ART_INKS);
  let layer = 0;
  const disc = (r, x, y, mat) => k.cyl('그림', r, 0.5, [x, y, z + 0.3 + 0.35 * layer++], P(mat, { axis: 'z', bevel: 0 }));
  const shape = (pts, x, y, mat) => k.ext('그림', pts, 0.5, 'xy', [x, y, z + 0.3 + 0.35 * layer++], P(mat, { bevel: 0 }));
  const m = Math.min(w, h);
  if (kind === 'sun') {
    shape(rect(w, h * 0.42), 0, -h * 0.29, c());
    disc(m * 0.2, w * (R() - 0.5) * 0.3, h * 0.12, pick(R, ['ochre', 'rust', 'terracotta', 'yellow']));
    const hill = [[-w / 2, -h / 2]]; for (let i = 0; i <= 10; i++) hill.push([-w / 2 + (w * i) / 10, -h * 0.5 + h * (0.22 + 0.13 * Math.sin(i * 0.7 + R()))]); hill.push([w / 2, -h / 2]);
    shape(hill, 0, 0, c());
  } else if (kind === 'arch') {
    const n = 3, cols = [c(), c(), c()];
    for (let i = 0; i < n; i++) {
      const r = m * (0.42 - i * 0.11), t = m * 0.07, pts = [[-r, -h * 0.34]];
      for (let j = 0; j <= 14; j++) { const a = Math.PI - (Math.PI * j) / 14; pts.push([r * Math.cos(a), h * 0.02 + r * Math.sin(a)]); }
      pts.push([r, -h * 0.34], [r - t, -h * 0.34]);
      for (let j = 14; j >= 0; j--) { const a = Math.PI - (Math.PI * j) / 14; pts.push([(r - t) * Math.cos(a), h * 0.02 + (r - t) * Math.sin(a)]); }
      pts.push([-r + t, -h * 0.34]);
      shape(pts, 0, 0, cols[i]);
    }
  } else if (kind === 'blocks') {
    shape(rect(w * 0.46, h * 0.56), -w * 0.2, h * 0.14, c());
    shape(rect(w * 0.36, h * 0.3), w * 0.24, -h * 0.26, c());
    disc(m * 0.15, w * 0.2, h * 0.2, c());
    shape(rect(w * 0.9, h * 0.035), 0, -h * 0.02, 'ink');
  } else if (kind === 'leaf') {
    k.ext('그림', monsteraPts(h * 0.72, w * 0.78), 0.5, 'xy', [0, -h * 0.34, z + 0.3], P(pick(R, ['green', 'sage', 'teal', 'leafdark']), { bevel: 0, rot: [0, 0, (R() - 0.5) * 24] }));
  } else if (kind === 'dots') {
    const nx = 3, ny = Math.max(3, Math.round((3 * h) / w));
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) disc(m * 0.11, (-w / 2) + (w * (i + 0.5)) / nx, (-h / 2) + (h * (j + 0.5)) / ny, (i + j) % 2 ? c() : 'ink');
    layer = 0;
  } else {
    // mount: 겹친 산
    const tri = (x0, x1, top, mat) => shape([[x0, -h / 2], [x1, -h / 2], [(x0 + x1) / 2 + (R() - 0.5) * w * 0.1, top]], 0, 0, mat);
    disc(m * 0.13, w * 0.2, h * 0.24, pick(R, ['ochre', 'rust', 'pink']));
    tri(-w * 0.5, w * 0.25, h * 0.2, c()); tri(-w * 0.1, w * 0.5, h * 0.02, c()); tri(-w * 0.42, w * 0.08, -h * 0.12, 'ink');
  }
}
export const ART_KINDS = ['sun', 'arch', 'blocks', 'leaf', 'mount', 'dots'];

/** 벽에 거는 액자. 원점 = 벽면 위 액자 가운데(뒷면), +Z로 튀어나온다. */
export function frame(k, { w = 500, h = 700, kind, R, frameMat = 'black', mount = 0.12 }) {
  const fw = Math.max(12, Math.min(w, h) * 0.035), dp = 24;
  k.ext('액자 틀', rect(w, h), dp, 'xy', [0, 0, dp / 2], P(frameMat, { wall: fw, bevel: 1.2 }));
  k.box('액자 속지', [w - fw * 1.6, h - fw * 1.6, 4], [0, 0, dp - 9], P('cream', { bevel: 0 }));
  const mw = Math.min(w, h) * mount;
  art(k, { w: w - 2 * fw - 2 * mw, h: h - 2 * fw - 2 * mw, kind: kind || pick(R, ART_KINDS), R, z: dp - 7 });
}

/** 가구 위에 세워 두는 작은 액자(뒤로 살짝 기댐). 원점 = 바닥 가운데. */
export function standFrame(k, { w = 150, h = 200, R, frameMat = 'oak' }) {
  const a = 11, c = Math.cos(a * D2R), s = Math.sin(a * D2R), fw = 11;
  k.ext('액자 틀', rect(w, h), 14, 'xy', [0, (h / 2) * c, -(h / 2) * s], P(frameMat, { wall: fw, rot: [-a, 0, 0] }));
  k.box('사진', [w - fw * 1.5, h - fw * 1.5, 3], [0, (h / 2) * c, -(h / 2) * s], P(pick(R, ['cream', 'grayblue', 'sage', 'pink', 'ochre']), { rot: [-a, 0, 0], bevel: 0 }));
  k.box('받침', [w * 0.3, h * 0.6, 3], [0, h * 0.29, -h * 0.2 - 8], P(frameMat, { rot: [22, 0, 0] }));
}

/** 둥근 벽 거울. 원점 = 벽면 위 가운데. */
export function roundMirror(k, { r = 320, frameMat = 'brass' }) {
  k.cyl('거울 틀', r + 12, 16, [0, 0, 8], P(frameMat, { axis: 'z' }));
  k.cyl('거울', r, 3, [0, 0, 17.2], P('mirror', { axis: 'z', bevel: 0 }));
}

/** 벽시계. 원점 = 벽면 위 가운데. */
export function wallClock(k, { r = 150, R }) {
  k.cyl('시계 테', r, 32, [0, 0, 16], P('black', { axis: 'z' }));
  k.cyl('시계판', r - 9, 3, [0, 0, 32.5], P('white', { axis: 'z', bevel: 0 }));
  const a1 = R() * 360, a2 = R() * 360;
  k.box('시침', [7, r * 0.5, 2], [-Math.sin(a1 * D2R) * r * 0.22, Math.cos(a1 * D2R) * r * 0.22, 35.4], P('black', { rot: [0, 0, a1], bevel: 0 }));
  k.box('분침', [5, r * 0.74, 2], [-Math.sin(a2 * D2R) * r * 0.33, Math.cos(a2 * D2R) * r * 0.33, 37.6], P('black', { rot: [0, 0, a2], bevel: 0 }));
  k.cyl('축', 8, 6, [0, 0, 38], P('brass', { axis: 'z' }));
}

// ───────────────────────────────────────────── 러그·패브릭
/** 러그. kind: solid | border | stripe | round | check. 원점 = 가운데 바닥. */
export function rug(k, { w = 2000, d = 1400, kind = 'border', a = 'fab-natural', b = 'fab-cream' }) {
  if (kind === 'round') {
    k.cyl('러그', w / 2, 10, [0, 5, 0], P(a, { bevel: 3 }));
    k.cyl('러그 무늬', w / 2 - 120, 2, [0, 10.6, 0], P(b, { bevel: 0 }));
    k.cyl('러그 무늬', w / 2 - 260, 2, [0, 11.4, 0], P(a, { bevel: 0 }));
    return;
  }
  k.rbox('러그', [w, 10, d], [0, 5, 0], 26, P(a));
  if (kind === 'border') k.rbox('러그 무늬', [w - 220, 2.4, d - 220], [0, 10.6, 0], 14, P(b));
  else if (kind === 'stripe') {
    const n = Math.max(3, Math.round(d / 260)), sw = d / (2 * n + 1);
    for (let i = 0; i < n; i++) k.box('러그 무늬', [w - 30, 2, sw], [0, 10.6, -d / 2 + sw * (2 * i + 1.5)], P(b, { bevel: 0 }));
  } else if (kind === 'check') {
    const nx = Math.max(3, Math.round(w / 320)), nz = Math.max(3, Math.round(d / 320)), cw = (w - 60) / nx, cd = (d - 60) / nz;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if ((i + j) % 2) k.box('러그 무늬', [cw, 2, cd], [-w / 2 + 30 + cw * (i + 0.5), 10.6, -d / 2 + 30 + cd * (j + 0.5)], P(b, { bevel: 0 }));
  }
}

/** 장식 쿠션(뒤로 기대어 세움). 원점 = 좌판 위, 쿠션 바닥 가운데. */
export function cushion(k, { s = 420, t = 130, mat = 'fab-ochre', lean = 20, w }) {
  const c = Math.cos(lean * D2R), sn = Math.sin(lean * D2R), ww = w || s;
  k.rbox('장식 쿠션', [ww, s, t], [0, (s / 2) * c + (t / 2) * sn * 0.55, -(s / 2) * sn], t * 0.42, P(mat, { rot: [-lean, 0, 0], crown: [0, 0, 0, 0, t * 0.16, t * 0.24] }));
}

/** 접어 둔 담요. 원점 = 바닥 가운데. */
export function blanket(k, { w = 340, d = 460, mat = 'fab-ochre' }) {
  k.rbox('담요', [w, 34, d], [0, 17, 0], 15, P(mat, { crown: [0, 0, 0, 5, 0, 0] }));
  k.rbox('담요', [w - 14, 30, d * 0.56], [3, 48, -d * 0.2], 14, P(mat, { crown: [0, 0, 0, 5, 0, 0] }));
}

/** 침대 발치에 걸친 러너. 원점 = 이불 위 가운데. */
export function bedRunner(k, { w = 1700, d = 520, mat = 'fab-ochre' }) {
  k.rbox('침대 러너', [w, 20, d], [0, 10, 0], 9, P(mat, { crown: [0, 0, 0, 8, 0, 0] }));
}

/** 푸프(둥근 스툴). */
export function pouf(k, { r = 240, h = 340, mat = 'fab-ochre' }) {
  k.lathe('푸프', [[0, 0], [r * 0.62, 0], [r * 0.93, h * 0.14], [r, h * 0.5], [r * 0.93, h * 0.86], [r * 0.62, h], [0, h]], [0, 0, 0], P(mat));
}

/** 커튼 한 폭 + 봉. 원점 = 벽면, 바닥. */
export function curtain(k, { w = 650, h = 2200, mat = 'linen', rod = 0 }) {
  const wave = [], n = Math.max(8, Math.round(w / 34));
  for (let i = 0; i <= n; i++) wave.push([-w / 2 + (w * i) / n, 34 * Math.sin((i / n) * Math.PI * 2 * (w / 190))]);
  k.ext('커튼', stripProfile(wave, 7), h, 'xz', [0, 30 + h / 2, 62], P(mat, { bevel: 0 }));
  if (rod) k.cyl('커튼 봉', 11, rod, [0, 30 + h + 28, 62], P('blackmetal', { axis: 'x' }));
}

/** 창문(밝은 하늘이 보이는 창). 원점 = 벽면, 바닥. */
export function windowUnit(k, { w = 1100, h = 1300, sill = 880 }) {
  const y = sill + h / 2;
  k.box('창 밖', [w - 70, h - 70, 5], [0, y, 4], P('sky', { bevel: 0 }));
  k.ext('창틀', rect(w, h), 64, 'xy', [0, y, 32], P('white', { wall: 46 }));
  k.box('창살', [30, h - 80, 36], [0, y, 22], P('white'));
  k.box('창살', [w - 80, 30, 36], [0, sill + h * 0.64, 22], P('white'));
  k.box('창대', [w + 110, 28, 120], [0, sill - 14, 60], P('white'));
}

// ───────────────────────────────────────────── 조명
/** 탁상 스탠드(소품). 높이를 돌려준다. */
export function lampTable(k, { s = 1, baseMat = 'ceramic', shadeMat = 'shadewhite' }) {
  const bh = 190 * s, br = 62 * s, sr = 125 * s, shh = 165 * s;
  k.lathe('스탠드 몸통', [[0, 0], [br * 0.62, 0], [br, bh * 0.36], [br * 0.72, bh * 0.82], [br * 0.2, bh], [0, bh]], [0, 0, 0], P(baseMat));
  k.cyl('스탠드 목', 5 * s, 70 * s, [0, bh + 30 * s, 0], P('brass'));
  k.lathe('갓', [[sr, 0], [sr * 0.78, shh], [sr * 0.78 - 2.2, shh], [sr - 2.2, 0]], [0, bh + 40 * s, 0], P(shadeMat, { closed: true, glow: 0.8 }));
  return bh + 40 * s + shh;
}

/** 플로어 스탠드(소품). */
export function lampFloor(k, { h = 1500, shadeMat = 'shadewhite', poleMat = 'blackmetal' }) {
  k.cyl('스탠드 받침', 140, 16, [0, 8, 0], P(poleMat));
  k.cyl('스탠드 기둥', 9, h - 230, [0, 16 + (h - 230) / 2, 0], P(poleMat));
  k.lathe('갓', [[190, 0], [150, 250], [147.5, 250], [187.5, 0]], [0, h - 250, 0], P(shadeMat, { closed: true, glow: 0.8 }));
}

// ───────────────────────────────────────────── 전자제품·책상 소품
export function tv(k, { w = 1100 }) {
  const h = w * 0.565;
  for (const x of [-w * 0.3, w * 0.3]) { k.box('TV 발', [34, 14, 230], [x, 7, 0], P('black')); k.box('TV 발', [26, 34, 26], [x, 28, 0], P('black')); }
  k.box('TV', [w, h, 30], [0, 42 + h / 2, 0], P('black', { bevel: 3 }));
  k.box('TV 화면', [w - 22, h - 22, 2], [0, 42 + h / 2, 15.6], P('screen', { bevel: 0 }));
  return 42 + h;
}

export function laptop(k) {
  const a = 16, c = Math.cos(a * D2R), s = Math.sin(a * D2R), sh = 212;
  k.rbox('노트북', [318, 13, 222], [0, 6.5, 0], 9, P('alu'));
  k.box('자판', [270, 1, 110], [0, 13.2, -24], P('anthracite', { bevel: 0 }));
  k.rbox('노트북 화면', [318, sh, 7], [0, 13 + (sh / 2) * c, -111 - (sh / 2) * s], 3, P('alu', { rot: [-a, 0, 0] }));
  k.box('화면', [300, sh - 20, 1], [0, 13 + (sh / 2) * c + 3.8 * s, -111 - (sh / 2) * s + 3.8 * c], P('screen', { rot: [-a, 0, 0], bevel: 0 }));
}

export function mug(k, { mat = 'ceramic', s = 1 }) {
  const r = 39 * s, h = 88 * s;
  k.lathe('머그', [[0, 0], [r * 0.86, 0], [r, h * 0.2], [r, h], [r - 4, h], [r - 4.5, 7], [0, 7]], [0, 0, 0], P(mat));
  k.tube('머그 손잡이', [[r - 3, h * 0.78, 0], [r + 26 * s, h * 0.72, 0], [r + 26 * s, h * 0.3, 0], [r - 3, h * 0.24, 0]], 4.6 * s, { corner: 14 * s, ...P(mat) });
  k.cyl('커피', r - 5, 2, [0, h - 12, 0], P('blackbrown', { bevel: 0 }));
}

export function penCup(k, { R, mat = 'ceramic-black' }) {
  k.lathe('연필꽂이', [[0, 0], [36, 0], [38, 96], [34, 96], [33, 7], [0, 7]], [0, 0, 0], P(mat));
  for (let i = 0; i < 5; i++) { const a = R() * 360, t = 6 + R() * 12; k.cyl('연필', 3.6, 175, [14 * Math.cos(a * D2R), 96, 14 * Math.sin(a * D2R)], P(pick(R, ['yellow', 'red', 'blue', 'green', 'black', 'orange']), { rot: [t * Math.cos(a * D2R), 0, -t * Math.sin(a * D2R)] })); }
}

export function notebook(k, { R }) {
  k.at([0, 0, 0], (R() - 0.5) * 30, () => {
    k.rbox('공책', [150, 13, 212], [0, 6.5, 0], 4, P(pick(R, ['ink', 'rust', 'sage', 'ochre', 'cream'])));
    k.cyl('펜', 4, 140, [96, 4, 10], P('black', { axis: 'z', rot: [0, 14, 0] }));
  });
}

// ───────────────────────────────────────────── 식탁·주방
export function bowl(k, { r = 135, h = 78, mat = 'ceramic', fruit = 0, R }) {
  k.lathe('볼', [[0, 0], [r * 0.42, 0], [r * 0.86, h * 0.55], [r, h], [r - 6, h], [r * 0.8, h * 0.56], [r * 0.38, 9], [0, 9]], [0, 0, 0], P(mat));
  for (let i = 0; i < fruit; i++) {
    const a = i * 137.5, rr = i === 0 ? 0 : r * 0.42, fr = 31 + R() * 6;
    k.sph('과일', fr, [rr * Math.cos(a * D2R), 14 + fr + (i === 0 && fruit > 3 ? 26 : 0), rr * Math.sin(a * D2R)], P(pick(R, ['orange', 'orange', 'red', 'yellow', 'pl-green'])));
  }
}

export function candle(k, { h = 190, mat = 'cream' }) {
  k.lathe('촛대', [[0, 0], [34, 0], [34, 6], [10, 12], [14, 30], [0, 30]], [0, 0, 0], P('brass'));
  k.cyl('초', 10.5, h, [0, 26 + h / 2, 0], P(mat));
}

export function plateSet(k, { mat = 'ceramic' }) {
  k.lathe('접시', [[0, 0], [86, 0], [132, 13], [130, 17], [84, 5], [0, 5]], [0, 0, 0], P(mat));
  k.lathe('작은 볼', [[0, 0], [34, 0], [70, 42], [66, 44], [32, 7], [0, 7]], [0, 6, 0], P(mat));
  k.cyl('컵', 31, 92, [150, 46, -95], P('glass', { r2: 35 }));
}

export function bottle(k, { mat = 'ceramic-sage', s = 1 }) {
  const r = 34 * s, h = 250 * s;
  k.lathe('병', [[0, 0], [r, 0], [r, h * 0.56], [r * 0.4, h * 0.76], [r * 0.4, h], [0, h]], [0, 0, 0], P(mat));
  k.cyl('마개', r * 0.44, 16 * s, [0, h + 6 * s, 0], P('kraft'));
}

export function jar(k, { mat = 'glass', s = 1, fill = 'kraft' }) {
  const r = 48 * s, h = 120 * s;
  k.cyl('유리병 내용물', r - 5, h * 0.62, [0, 5 + h * 0.31, 0], P(fill, { bevel: 0 }));
  k.cyl('유리병', r, h, [0, h / 2, 0], P(mat));
  k.cyl('뚜껑', r + 2, 14 * s, [0, h + 7 * s, 0], P('kraft'));
}

/** 도마(벽에 기대어 세움). */
export function board(k, { w = 220, h = 340 }) {
  const a = 12;
  k.rbox('도마', [w, h, 18], [0, (h / 2) * Math.cos(a * D2R), -(h / 2) * Math.sin(a * D2R)], 22, P('acacia', { rot: [-a, 0, 0] }));
}

// ───────────────────────────────────────────── 수납
/** 바구니(담요가 삐져나오게 할 수 있다). */
export function basket(k, { r = 190, h = 270, mat = 'basket', fill }) {
  k.lathe('바구니', [[0, 0], [r * 0.84, 0], [r, h * 0.55], [r * 0.96, h], [r * 0.96 - 11, h], [r - 11, h * 0.55], [r * 0.84 - 9, 11], [0, 11]], [0, 0, 0], P(mat));
  if (fill) k.rbox('담요', [r * 1.36, 90, r * 1.36], [0, h - 34, 0], 40, P(fill, { crown: [0, 0, 0, 34, 0, 0] }));
}

/** 수납 상자(뚜껑·라벨). 원점 = 바닥 가운데. */
export function storageBox(k, { w = 320, h = 240, d = 330, mat = 'kraft', lid = true }) {
  k.rbox('수납 상자', [w, h - (lid ? h * 0.2 : 0), d], [0, (h - (lid ? h * 0.2 : 0)) / 2, 0], 6, P(mat));
  if (lid) k.rbox('상자 뚜껑', [w + 7, h * 0.2 + 3, d + 7], [0, h - h * 0.1 - 1.5, 0], 7, P(mat));
  k.box('라벨', [Math.min(90, w * 0.34), 34, 2.4], [0, h * 0.42, d / 2 + 1.2], P('cream', { bevel: 0 }));
}

/** 칸에 딱 맞는 패브릭 박스(앞에 손잡이 구멍 대신 띠). */
export function binBox(k, { w, h, d, mat = 'fab-natural' }) {
  k.rbox('패브릭 박스', [w, h, d], [0, h / 2, 0], 12, P(mat));
  k.box('손잡이 띠', [Math.min(110, w * 0.36), 22, 3], [0, h * 0.7, d / 2 + 1.5], P('leather-brown', { bevel: 0 }));
}

// ───────────────────────────────────────────── 옷
/** 옷걸이에 걸린 옷 한 벌(봉이 X 방향일 때). 원점 = 봉 중심. kind: shirt | dress | coat */
export function garment(k, { kind = 'shirt', mat = 'fab-cream', s = 1, flat = false }) {
  const L = (kind === 'dress' ? 980 : kind === 'coat' ? 860 : 640) * s, sw = 210 * s, bw = (kind === 'dress' ? 230 : 190) * s;
  // 옆에서 본 윤곽(u = 앞뒤, v = 위아래). 어깨에서 밑단까지.
  const pts = [[-28 * s, -30], [-sw, -95 * s], [-sw + 14 * s, -330 * s], [-sw * 0.62, -330 * s], [-sw * 0.62, -L * 0.5], [-bw, -L], [bw, -L], [sw * 0.62, -L * 0.5], [sw * 0.62, -330 * s], [sw - 14 * s, -330 * s], [sw, -95 * s], [28 * s, -30]];
  k.ext('옷', pts, 34 * s, flat ? 'xy' : 'zy', [0, 0, flat ? 30 : 0], P(mat, { bevel: 4 }));
  if (!flat) k.tube('옷걸이', [[0, -34, 0], [0, 4, 0], [0, 26, 14], [0, 30, 0]], 2.2, { corner: 8, ...P('steel') });
}

// ───────────────────────────────────────────── 장난감
const TOY = ['pl-red', 'pl-blue', 'pl-yellow', 'pl-green', 'pl-pink', 'pl-turq'];
export function blocks(k, { R, n = 6, s = 46 }) {
  const cols = TOY;
  let y = 0;
  for (let i = 0; i < n; i++) {
    if (i < 3) { k.at([(R() - 0.5) * 10, y, (R() - 0.5) * 10], R() * 50, () => k.box('블록', [s, s, s], [0, s / 2, 0], P(pick(R, cols), { bevel: 3 }))); y += s; }
    else { const a = R() * 360, rr = 80 + R() * 110; k.at([rr * Math.cos(a * D2R), 0, rr * Math.sin(a * D2R)], R() * 90, () => k.box('블록', [s, s, i % 2 ? s : s * 2], [0, s / 2, 0], P(pick(R, cols), { bevel: 3 }))); }
  }
}
export function ball(k, { r = 95, mat = 'pl-red' }) { k.sph('공', r, [0, r, 0], P(mat)); }
export function teddy(k, { s = 1, mat = 'fab-natural' }) {
  k.sph('곰 몸통', 62 * s, [0, 66 * s, 0], P(mat, { sy: 1.12 }));
  k.sph('곰 머리', 47 * s, [0, 162 * s, 6 * s], P(mat));
  for (const x of [-1, 1]) {
    k.sph('곰 귀', 17 * s, [x * 36 * s, 200 * s, 0], P(mat));
    k.sph('곰 팔', 21 * s, [x * 64 * s, 96 * s, 22 * s], P(mat, { sy: 1.5, rot: [0, 0, x * 34] }));
    k.sph('곰 다리', 25 * s, [x * 40 * s, 24 * s, 56 * s], P(mat, { sy: 0.9 }));
  }
  k.sph('곰 주둥이', 18 * s, [0, 152 * s, 44 * s], P('cream'));
  k.sph('곰 코', 6 * s, [0, 158 * s, 61 * s], P('black'));
}
export function stacker(k, { s = 1 }) {
  k.cyl('링 받침', 58 * s, 12 * s, [0, 6 * s, 0], P('birch'));
  k.cyl('링 기둥', 7 * s, 190 * s, [0, 100 * s, 0], P('birch'));
  const cols = ['pl-red', 'orange', 'pl-yellow', 'pl-green', 'pl-blue'];
  cols.forEach((c, i) => { const R0 = (48 - i * 6.5) * s, r = 15 * s; k.lathe('링', circlePts(r, 12).map(([x, y]) => [R0 + x, y]), [0, (12 + 15 + i * 29) * s, 0], P(c, { closed: true })); });
}

// ───────────────────────────────────────────── 방 구조
/** 걸레받이. 벽면을 따라 길이 w. 원점 = 벽면 가운데 바닥. */
export function baseboard(k, { w }) { k.box('걸레받이', [w, 78, 13], [0, 39, 6.5], P('white', { bevel: 2 })); }

/** 벽 선반(소품용 간단한 선반). 원점 = 벽면 가운데, 선반 윗면 높이. */
export function ledge(k, { w = 900, d = 190, mat = 'oak' }) { k.box('벽 선반', [w, 32, d], [0, -16, d / 2], P(mat)); }

/** 바 선반 테이블(벽에 붙인 높은 선반 + 받침대). 원점 = 벽면 가운데 바닥. */
export function barShelf(k, { w = 1800, d = 420, h = 1050, mat = 'oak' }) {
  k.box('바 상판', [w, 42, d], [0, h - 21, d / 2], P(mat));
  for (const x of [-w / 2 + 160, w / 2 - 160]) k.ext('바 받침', [[0, 0], [0, -d * 0.82], [d * 0.82, 0]], 26, 'zy', [x, h - 42, 0], P('blackmetal', { wall: 22 }));
}

/** 식탁 위로 넘어오는 아치 스탠드. 원점 = 받침, +Z 쪽으로 reach 만큼 뻗는다. */
export function arcLamp(k, { h = 1950, reach = 1500, shadeMat = 'basket', poleMat = 'brass' }) {
  k.cyl('스탠드 받침', 175, 46, [0, 23, 0], P('stone'));
  k.tube('스탠드 아치', [[0, 46, 0], [0, h * 0.7, 0], [0, h, reach * 0.45], [0, h - 170, reach]], 13, { corner: h * 0.34, ...P(poleMat) });
  k.lathe('갓', [[235, 0], [165, 190], [46, 245], [44, 242], [162, 187], [232, 0]], [0, h - 170 - 250, reach], P(shadeMat, { closed: true, glow: 0.7 }));
  k.sph('전구', 42, [0, h - 170 - 150, reach], P('lampglow'));
}

/** 벽에서 뻗은 암에 매단 종이 펜던트. 원점 = 벽면 위 받침. */
export function pendantArm(k, { reach = 640, drop = 420, r = 235 }) {
  k.cyl('펜던트 받침', 46, 16, [0, 0, 8], P('black', { axis: 'z' }));
  k.tube('펜던트 암', [[0, 0, 10], [0, 26, reach * 0.55], [0, 0, reach]], 7, { corner: 70, ...P('blackmetal') });
  k.cyl('펜던트 줄', 2.4, drop, [0, -drop / 2, reach], P('black'));
  k.sph('종이 갓', r, [0, -drop - r * 0.8, reach], P('paper', { sy: 0.84, glow: 0.8 }));
}

/** 세로 루버 벽 패널. 원점 = 벽면 가운데 바닥. */
export function slatPanel(k, { w = 2000, h = 2400, mat = 'walnut', back = 'ink' }) {
  const n = Math.max(3, Math.floor(w / 64)), step = w / n;
  k.box('루버 바탕', [w, h - 82, 5], [0, 82 + (h - 82) / 2, 2.5], P(back, { bevel: 0 }));
  for (let i = 0; i < n; i++) k.box('루버', [step * 0.55, h - 82, 24], [-w / 2 + step * (i + 0.5), 82 + (h - 82) / 2, 12], P(mat, { grain: 'y', bevel: 0 }));
}

/** 포인트 컬러 벽(벽면에 얇게 덧댄 색면). */
export function colorPanel(k, { w = 1200, h = 2400, mat = 'wall-mustard' }) {
  k.box('포인트 벽', [w, h - 80, 5], [0, 80 + (h - 80) / 2, 2.5], P(mat, { bevel: 0 }));
}

/** 벽 옷걸이(나무 판 + 고리)에 건 옷. 원점 = 벽면 위 판 가운데. */
export function coatRail(k, { w = 1200, R, mats = ['fab-navy', 'fab-terracotta', 'fab-cream', 'fab-sage', 'fab-ochre'] }) {
  k.box('옷걸이 판', [w, 96, 20], [0, 0, 10], P('oak'));
  const n = Math.max(3, Math.floor(w / 230));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (w * (i + 0.5)) / n;
    k.cyl('고리', 9, 62, [x, 0, 46], P('black', { axis: 'z' }));
    if (R() < 0.75) k.at([x, -6, 34], 0, () => garment(k, { kind: pick(R, ['shirt', 'coat', 'coat']), mat: pick(R, mats), s: 0.95, flat: true }));
  }
}

export { roundedRect, rect };
