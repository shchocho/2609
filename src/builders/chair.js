// chair.js — 의자·스툴.

import { roundedRect, circlePts, stripProfile, arcPts } from '../core/geom.js';
import { strut, spread } from './util.js';

const R2D = 180 / Math.PI, D2R = Math.PI / 180;

export const CHAIR_FLOW = [
  ['legs', '다리 만들기', '뒷다리(등받이 기둥)와 앞다리를 자릅니다.', '좌우 한 쌍을 겹쳐 놓고 같이 다듬으면 모양이 같아집니다.'],
  ['frame', '옆 프레임 조립', '앞다리와 뒷다리를 가로대로 이어 좌우 옆 프레임을 만든 뒤, 앞뒤 가로대로 연결합니다.', '평평한 판 위에서 네 다리가 모두 닿는지 확인하세요.'],
  ['back', '등받이 붙이기', '기둥 사이에 등받이 부재를 붙입니다.', '기울기가 좌우 같도록 종이 지그를 대세요.'],
  ['seat', '좌판 올리기', '좌판을 뼈대 위에 붙입니다.', '앞쪽 모서리를 사포로 둥글리면 실물 느낌이 납니다.', [0, 1, 0]],
  ['soft', '쿠션 씌우기', '스펀지에 원단을 씌워 붙입니다.', '원단은 안쪽으로 접어 양면테이프로 고정합니다.', [0, 1, 0]],
  ['hw', '마무리 부품', '발·바퀴 같은 작은 부품을 붙입니다.', '', [0, -1, 0]],
];

/** 네 다리 의자. 뒷다리가 등받이 기둥으로 이어지는 전형적인 구조. */
export function chair(k, s) {
  const { w, d, h } = s;
  const sh = s.seatH ?? 450, st = k.T(s.seatT ?? 18), top = sh - st;
  const L = s.leg || {}, la = k.D(L.a ?? 32), lb = k.D(L.b ?? 32);
  const rake = s.rake ?? 9, tanR = Math.tan(rake * D2R), dz = (h - sh) * tanR, sp = L.rearSplay ?? 30;
  const zr = -d / 2 + lb / 2 + Math.max(dz, sp), zf = d / 2 - lb / 2 - (L.frontInset ?? 8), lx = w / 2 - la / 2 - (L.insetX ?? 0);
  const zAt = (y) => zr - (y - sh) * tanR;
  const lr = L.role || 'leg', b2 = lb * (L.topTaper ?? 0.8);
  k.ph('legs', '다리');
  k.ext('뒷다리', [[zr + lb / 2 - sp, 0], [zr + lb / 2, sh], [zr - dz + b2 / 2, h], [zr - dz - b2 / 2, h], [zr - lb / 2, sh], [zr - lb / 2 - sp, 0]], la, 'zy', [lx, 0, 0], { role: lr, mx: true, ex: [1, 0, -0.4] });
  const fs = L.frontSplay ?? 0;
  if (L.round) strut(k, '앞다리', [lx + fs, 0, zf + fs], [lx, top, zf], [la, la], { round: true, role: lr, mx: true, ex: [1, 0, 0.4] });
  else k.box('앞다리', [la, top, lb], [lx, top / 2, zf], { role: lr, mx: true, ex: [1, 0, 0.4] });
  k.ph('frame', '뼈대');
  const A = s.apron === false ? null : { h: 45, t: 18, ...(s.apron || {}) };
  if (A) {
    const ah = k.D(A.h), at = k.T(A.t);
    k.box('앞 가로대', [2 * lx - la, ah, at], [0, top - ah / 2, zf], { role: lr });
    k.box('뒤 가로대', [2 * lx - la, ah, at], [0, top - ah / 2, zr], { role: lr });
    k.box('옆 가로대', [at, ah, zf - zr - lb], [lx, top - ah / 2, (zf + zr) / 2], { role: lr, mx: true });
  }
  const sy = s.stretchY ?? 150, ss = k.D(s.stretchSec ?? 22);
  const zrs = zr - sp * (1 - sy / sh);
  if (s.stretch === 'h' || s.stretch === 'box' || s.stretch === 'sides') k.box('옆 발걸이', [ss * 0.8, ss, zf - zrs - lb], [lx, sy, (zf + zrs) / 2], { role: lr, mx: true });
  if (s.stretch === 'h') k.box('가운데 발걸이', [2 * lx - ss * 0.8, ss, ss * 0.8], [0, sy, (zf + zrs) / 2], { role: lr });
  if (s.stretch === 'box' || s.stretch === 'front') {
    k.box('앞 발걸이', [2 * lx - la, ss, ss * 0.8], [0, s.stretchFrontY ?? sy, zf], { role: lr });
    if (s.stretch === 'box') k.box('뒤 발걸이', [2 * lx - la, ss, ss * 0.8], [0, sy, zrs], { role: lr });
  }
  // 등받이
  k.ph('back', '등받이');
  const B = s.back || { type: 'slats-h', n: 2 }, bw = 2 * lx - la, br = B.role || lr;
  const rail = (name, y, rh, rt = 16, extra = {}) => k.box(name, [bw, rh, k.T(rt)], [0, y, zAt(y)], { role: br, rot: [-rake, 0, 0], ex: [0, 0.4, -1], ...extra });
  const bh = h - sh;
  if (B.type === 'slats-h') {
    const n = B.n ?? 2, topH = B.topH ?? 60;
    rail('등받이 윗대', h - topH / 2 - 6, topH, B.t);
    for (let i = 1; i < n; i++) rail('등받이 가로살', h - topH - 6 - (i * (bh * (B.span ?? 0.5))) / (n - 0.5), B.h ?? 38, B.t);
  } else if (B.type === 'slats-v' || B.type === 'spindles' || B.type === 'x') {
    const topH = B.topH ?? 50, y1 = h - topH - 6, y0 = sh + (B.low ?? 70), lowH = B.lowH ?? 34;
    rail('등받이 윗대', h - topH / 2 - 6, topH, B.t ?? 18);
    const yb = B.type === 'spindles' && !B.low ? sh - st / 2 : y0;
    if (!(B.type === 'spindles' && !B.low)) rail('등받이 아랫대', y0, lowH, B.t ?? 18);
    const ya = B.type === 'spindles' && !B.low ? yb : y0 + lowH / 2, len = (y1 - ya) / Math.cos(rake * D2R), ym = (y1 + ya) / 2;
    if (B.type === 'x') {
      const ang = Math.atan2(y1 - ya, bw) * R2D, xl = Math.hypot(bw, y1 - ya);
      k.box('X 살', [xl, 26, 10], [0, ym, zAt(ym)], { role: br, rot: [-rake, 0, ang], ex: [0, 0.4, -1] });
      k.box('X 살', [xl, 26, 10], [0, ym, zAt(ym) + 0.5], { role: br, rot: [-rake, 0, -ang], ex: [0, 0.4, -1] });
    } else {
      const n = B.n ?? 3;
      for (const x of spread(n, -bw / 2 + bw / (n + 1), bw / 2 - bw / (n + 1))) {
        if (B.type === 'spindles') k.cyl('등받이 살', k.D(B.r ?? 14) / 2, len, [x, ym, zAt(ym)], { role: br, rot: [-rake, 0, 0], ex: [0, 0.4, -1] });
        else k.box('등받이 세로살', [k.D(B.slatW ?? 40), len, k.T(10)], [x, ym, zAt(ym)], { role: br, rot: [-rake, 0, 0], ex: [0, 0.4, -1] });
      }
    }
  } else if (B.type === 'panel') {
    const ph = B.h ?? bh * 0.45, y = h - ph / 2 - (B.drop ?? 10);
    k.box('등판', [bw, ph, k.T(B.t ?? 10)], [0, y, zAt(y)], { role: B.panelRole || br, rot: [-rake, 0, 0], ex: [0, 0.4, -1] });
  } else if (B.type === 'pad') {
    const ph = B.h ?? bh * 0.6, y = h - ph / 2 - 10;
    k.rbox('등받이 쿠션', [bw + la, ph, 46], [0, y, zAt(y) + 12], 16, { role: 'seat', rot: [-rake, 0, 0], crown: [0, 0, 0, 0, 0, 8], phase: 'soft', ex: [0, 0.4, 1] });
  }
  // 좌판
  k.ph('seat', '좌판');
  const S = s.seat || {}, so = S.over ?? 12, z1 = zf + lb / 2 + so, z0 = zr + lb / 2 - (S.back ?? 2), sd = z1 - z0, zc = (z0 + z1) / 2;
  const sw = w - 2 * (L.insetX ?? 0) + (S.side ?? 0);
  if (S.type === 'pad') {
    k.box('좌판', [sw, st, sd], [0, top + st / 2, zc], { role: S.role || 'top', ex: [0, 1, 0], bevel: 2 });
    k.rbox('방석', [sw - 16, S.padT ?? 28, sd - 16], [0, sh + (S.padT ?? 28) / 2, zc], 10, { role: 'seat', crown: [0, 0, 0, 6, 0, 0], phase: 'soft', ex: [0, 1.6, 0] });
  } else if (S.type === 'soft') {
    k.rbox('좌판 쿠션', [sw, st + 40, sd], [0, top + (st + 40) / 2 - 20, zc], 18, { role: 'seat', crown: [0, 0, 0, 10, 0, 0], phase: 'soft', ex: [0, 1, 0] });
  } else if (S.type === 'slats') {
    for (const z of spread(S.n ?? 5, z0 + 30, z1 - 30)) k.box('좌판 살', [sw, st, (sd / (S.n ?? 5)) * 0.82], [0, top + st / 2, z], { role: S.role || 'top', ex: [0, 1, 0] });
  } else {
    k.ext('좌판', roundedRect(sw, sd, S.r ?? 14, 4), st, 'xz', [0, top + st / 2, zc], { role: S.role || 'top', ex: [0, 1, 0], bevel: 3 });
  }
  if (s.extra) s.extra(k, { lx, zf, zr, zAt, top, sh, la, lb, bw });
  k.flow(CHAIR_FLOW);
}

/** 패브릭 식탁 의자(HENRIKSDAL). */
export function upholsteredChair(k, s) {
  const { w, d, h } = s, sh = s.seatH ?? 480, la = k.D(38), rake = s.rake ?? 10, tanR = Math.tan(rake * D2R);
  const lx = w / 2 - la / 2 - 20, zf = d / 2 - la / 2 - 40, bt = 85, dz = (h - sh) * tanR, zr = -d / 2 + la / 2 + 60;
  k.ph('legs', '다리');
  k.cyl('앞다리', la * 0.36, sh - 110, [lx, (sh - 110) / 2, zf], { r2: la / 2, role: 'leg', mx: true, ex: [0, -1, 0] });
  strut(k, '뒷다리', [lx, 0, zr - 50], [lx, sh - 110, zr], [la * 0.8, la], { role: 'leg', mx: true, ex: [0, -1, 0] });
  k.ph('frame', '뼈대');
  k.box('좌판 틀', [w - 30, 60, d - 110], [0, sh - 110 - 30 + 60, 20], { role: 'seat', stock: 'block', note: '판재로 낮은 상자를 짜서 뼈대로 씀' });
  k.ph('soft', '쿠션');
  k.rbox('좌판 쿠션', [w, 90, d - 80], [0, sh - 45, 35], 26, { role: 'seat', crown: [0, 0, 0, 12, 0, 6] });
  const bh = h - sh + 70, y = sh - 70 + bh / 2;
  k.rbox('등받이', [w - 24, bh, bt], [0, y, -d / 2 + bt / 2 + dz / 2 + 4], 30, { role: 'seat', rot: [-rake, 0, 0], crown: [0, 0, 0, 0, 0, 10], ex: [0, 0.5, -1] });
  k.flow(CHAIR_FLOW);
}

/** 철제 파이프 의자(ADDE). */
export function tubeChair(k, s) {
  const { w, d, h } = s, sh = s.seatH ?? 450, r = k.D(20) / 2, lx = w / 2 - r - 13, zf = d / 2 - r - 6, rake = 10;
  const dz = (h - sh) * Math.tan(rake * D2R), zr = -d / 2 + r + dz;
  k.ph('legs', '파이프 프레임');
  k.tube('앞다리 프레임', [[lx + 12, 0, zf + 10], [lx, sh - 14, zf - 14], [-lx, sh - 14, zf - 14], [-lx - 12, 0, zf + 10]], r, { corner: 50, role: 'leg' });
  k.tube('뒷다리 프레임', [[lx + 8, 0, zr - 34], [lx, sh - 10, zr], [lx - 6, h - 12, zr - dz], [-lx + 6, h - 12, zr - dz], [-lx, sh - 10, zr], [-lx - 8, 0, zr - 34]], r, { corner: 46, role: 'leg' });
  k.tube('옆 연결대', [[lx, sh - 16, zf - 14], [lx, sh - 12, zr]], r * 0.9, { role: 'leg', mx: true });
  k.ph('seat', '좌판');
  k.ext('좌판', roundedRect(w - 6, d - 74, 46, 6), k.T(10), 'xz', [0, sh - 5, 26], { role: 'plastic', ex: [0, 1, 0], bevel: 3 });
  k.ph('back', '등받이');
  const by = h - 105;
  k.ext('등판', roundedRect(w - 30, 150, 34, 6), k.T(8), 'xy', [0, by, zr - (by - sh) * Math.tan(rake * D2R) + 12], { role: 'plastic', rot: [-rake, 0, 0], ex: [0, 0.4, 1], bevel: 2.5 });
  k.flow([
    ['legs', '파이프 구부리기', '철사를 도면대로 구부려 앞다리·뒷다리 프레임을 만들고 옆 연결대로 잇습니다.', '2mm 알루미늄 선이 구부리기 쉽습니다. 도면에 대고 각도를 맞추세요.'],
    ['seat', '좌판 붙이기', '모서리가 둥근 좌판을 프레임 위에 붙입니다.', '플라스틱판(프라판)이나 두꺼운 종이를 씁니다.', [0, 1, 0]],
    ['back', '등판 붙이기', '등판을 뒷다리 프레임 위쪽에 붙입니다.', '', [0, 0.4, 1]],
  ]);
}

/** 접이식 나무 의자(TERJE). */
export function foldingChair(k, s) {
  const { w, d, h } = s, sh = s.seatH ?? 460, a = k.D(22), b = k.D(34), lx = w / 2 - a / 2;
  k.ph('legs', 'X 프레임');
  strut(k, '긴 다리(등받이)', [lx, 0, d / 2 - b / 2 - 4], [lx, h - 12, -d / 2 + b / 2 + 8], [a, b], { role: 'body', mx: true, ex: [1, 0, 0] });
  strut(k, '짧은 다리', [lx - a - 2, 0, -d / 2 + b / 2 + 40], [lx - a - 2, sh - 20, d / 2 - 130], [a, b], { role: 'body', mx: true, ex: [0.5, 0, 0] });
  k.ph('frame', '가로대');
  k.cyl('회전축', 6, 2 * lx - a, [0, sh * 0.47, d * 0.05], { axis: 'x', role: 'metal' });
  k.box('뒤 발걸이', [2 * (lx - a - 2) - a, 26, 14], [0, 90, -d / 2 + 98], { role: 'body' });
  k.ph('seat', '좌판');
  const sw = 2 * (lx - a - 2) - a - 2;
  for (const z of spread(4, -d * 0.2, d * 0.2 + 6)) k.box('좌판 살', [sw, k.T(14), 64], [0, sh - 7, z + 10], { role: 'body', ex: [0, 1, 0] });
  k.box('좌판 틀', [k.T(16), 30, d * 0.62], [sw / 2 - 8, sh - 26, 16], { role: 'body', mx: true });
  k.ph('back', '등받이');
  const zb = (y) => d / 2 - b / 2 + ((-d + b + 20) * y) / h, rk = Math.atan2(d - b - 20, h) * R2D;
  for (const y of [h - 50, h - 150]) k.box('등받이 살', [2 * lx - a, 56, k.T(12)], [0, y, zb(y) + 14], { role: 'body', rot: [-rk, 0, 0], ex: [0, 0.4, 1] });
  k.flow([
    ['legs', 'X 프레임 만들기', '긴 다리와 짧은 다리를 X자로 겹쳐 좌우 한 쌍씩 만듭니다.', '교차점에 핀을 꽂으면 실제로 접힙니다.'],
    ['frame', '가로대 연결', '회전축과 발걸이로 좌우 프레임을 연결합니다.', ''],
    ['seat', '좌판 살 붙이기', '좌판 틀 위에 살 네 장을 일정한 간격으로 붙입니다.', '1mm 스페이서를 끼워 간격을 맞춥니다.', [0, 1, 0]],
    ['back', '등받이 살 붙이기', '긴 다리 위쪽에 등받이 살 두 장을 붙입니다.', '', [0, 0.4, 1]],
  ]);
}

/** 쉘 의자(ODGER, LEIFARNE). */
export function shellChair(k, s) {
  const { w, d, h } = s, sh = s.seatH ?? 450, lt = s.legType || 'dowel', rake = 14;
  const sw = w - 8, sd = d - 90, st = 16, lh = sh - st - (lt === 'dowel' ? 50 : 0);
  k.ph('legs', '다리');
  const lx0 = sw * 0.3, lz0 = sd * 0.28, spl = lt === 'dowel' ? 55 : 30;
  if (lt === 'dowel') {
    strut(k, '다리', [lx0 + spl, 0, lz0 + spl + 20], [lx0, lh, lz0 + 20], k.D(26), { round: true, role: 'leg', mx: true, ex: [0, -1, 0] });
    strut(k, '다리', [lx0 + spl, 0, -lz0 - spl], [lx0, lh, -lz0], k.D(26), { round: true, role: 'leg', mx: true, ex: [0, -1, 0] });
    k.ph('frame', '받침대');
    k.tube('받침 프레임', [[lx0, lh + 4, lz0 + 20], [lx0 - 20, lh + 40, lz0], [-lx0 + 20, lh + 40, -lz0 + 20], [-lx0, lh + 4, -lz0]], 5, { corner: 14, role: 'metal' });
    k.tube('받침 프레임', [[-lx0, lh + 4, lz0 + 20], [-lx0 + 20, lh + 40, lz0], [lx0 - 20, lh + 40, -lz0 + 20], [lx0, lh + 4, -lz0]], 5, { corner: 14, role: 'metal' });
  } else {
    for (const sz of [1, -1]) {
      const z = sz * lz0 + (sz > 0 ? 30 : -10);
      strut(k, '다리', [lx0 + spl + 16, 0, z + sz * spl * 0.8], [lx0 + 16, lh, z], [k.D(34), k.D(40)], { role: 'plastic', mx: true, ex: [0, -1, 0] });
    }
  }
  k.ph('seat', '쉘');
  k.rbox('좌판 쉘', [sw, st + 26, sd], [0, sh - (st + 26) / 2 + 6, 26], 22, { role: 'plastic', crown: [0, 0, 0, -8, 0, 0], ex: [0, 1, 0], stock: 'block', note: '판재를 겹쳐 붙이고 가운데를 오목하게 사포질' });
  k.ph('back', '쉘');
  const bh = h - sh + 20, br = sw * 0.72, yb = sh - 10 + bh / 2;
  const arc = stripProfile(arcPts(0, br * 0.62, br, 232, 308, 12), 13);
  k.ext('등받이 쉘', arc, bh, 'xz', [0, yb, -sd / 2 + 26 + br * 0.38 - (bh / 2) * Math.tan(rake * D2R) - 2], { role: 'plastic', rot: [-rake, 0, 0], ex: [0, 0.4, -1], stock: 'band', note: '얇은 판을 물에 적셔 곡면으로 휨' });
  k.flow([
    ['legs', '다리 만들기', '다리 네 개를 바깥으로 살짝 벌어지게 준비합니다.', '각도 지그를 종이로 접어 쓰면 네 다리 각도가 같아집니다.', [0, -1, 0]],
    ['frame', '받침대 구부리기', '좌판 아래 철사 받침대를 X자로 구부려 다리 위에 붙입니다.', ''],
    ['seat', '좌판 쉘', '좌판을 깎아 다리 위에 붙입니다.', '가운데를 살짝 오목하게 갈아 주세요.', [0, 1, 0]],
    ['back', '등받이 쉘', '곡면 등받이를 좌판 뒤쪽에 세워 붙입니다.', '얇은 판은 뜨거운 물에 적시면 잘 휩니다.', [0, 0.4, -1]],
  ]);
}

/** 곡목 다리 원형 스툴(FROSTA). */
export function bentStool(k, s) {
  const { w, h } = s, st = k.T(20), r = s.seatR ?? w * 0.42, lt = k.T(18), lw = k.D(42), top = h - st;
  k.ph('legs', '곡목 다리');
  const c = [[r * 0.22, top - lt / 2], [w / 2 - lt / 2 - 14, top - lt / 2], [w / 2 - lt / 2, 0]];
  for (let i = 0; i < 4; i++) k.at([0, 0, 0], i * 90, () => k.ext('곡목 다리', stripProfile(c, lt, 62, 8), lw, 'xy', [0, 0, 0], { role: 'body', ex: [1, -0.3, 0], note: '얇은 무늬목 3~4겹을 지그에 대고 겹쳐 붙여 휨' }));
  k.ph('seat', '좌판');
  k.cyl('좌판', r, st, [0, top + st / 2, 0], { role: 'body', ex: [0, 1, 0], bevel: 4 });
  k.flow([
    ['legs', '다리 휘기', 'ㄱ자 곡목 다리 네 개를 만듭니다. 얇은 판을 겹쳐 지그에 대고 붙이거나 판재에서 윤곽대로 오려 냅니다.', '1:12 이하에서는 2mm 판재에서 통째로 오려 내는 쪽이 쉽습니다.'],
    ['seat', '좌판 붙이기', '원형 좌판 아래에 다리 네 개를 90° 간격으로 붙입니다.', '좌판 뒷면에 십자선을 그어 다리 위치를 맞춥니다.', [0, 1, 0]],
  ]);
}

/** 세 다리 스툴(KYRRE). */
export function triStool(k, s) {
  const { w, h } = s, st = k.T(18), top = h - st, pts = [];
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, rr = w * 0.49 * (1 + 0.1 * Math.cos(3 * a)); pts.push([rr * Math.sin(a), rr * Math.cos(a)]); }
  k.ph('legs', '다리');
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2, x = Math.sin(a), z = Math.cos(a);
    strut(k, '다리', [x * w * 0.5, 0, z * w * 0.5], [x * w * 0.32, top, z * w * 0.32], [k.D(26), k.D(26)], { role: 'body', ex: [x, -0.6, z] });
  }
  k.ph('seat', '좌판');
  k.ext('좌판', pts, st, 'xz', [0, top + st / 2, 0], { role: 'body', ex: [0, 1, 0], bevel: 3 });
  k.flow([
    ['legs', '다리 세 개', '각재 다리 세 개의 위쪽을 비스듬히 잘라 벌어지게 준비합니다.', ''],
    ['seat', '좌판 붙이기', '둥근 삼각형 좌판 아래에 다리를 120° 간격으로 붙입니다.', '', [0, 1, 0]],
  ]);
}

/** 파이프 다리 스툴(MARIUS). */
export function tubeStool(k, s) {
  const { w, h } = s, r = k.D(18) / 2, top = h - 22, a = w * 0.47, b = w * 0.3;
  k.ph('legs', '파이프 다리');
  k.tube('다리 프레임', [[-a, 0, -a], [-b, top, -b], [b, top, b], [a, 0, a]], r, { corner: 40, role: 'leg' });
  k.tube('다리 프레임', [[-a, 0, a], [-b, top - 2 * r, b], [b, top - 2 * r, -b], [a, 0, -a]], r, { corner: 40, role: 'leg' });
  k.ph('seat', '좌판');
  k.cyl('좌판', w * 0.5, 22, [0, top + 11, 0], { role: 'plastic', ex: [0, 1, 0], bevel: 6 });
  k.flow([
    ['legs', '다리 구부리기', '철사 두 가닥을 ㄷ자로 구부려 십자로 겹칩니다.', '교차점은 순간접착제 한 방울로 고정합니다.'],
    ['seat', '좌판 붙이기', '원형 좌판을 올려 붙입니다.', '', [0, 1, 0]],
  ]);
}

/** 2단 스텝 스툴(BEKVÄM). */
export function stepStool(k, s) {
  const { w, d, h } = s, t = k.T(20), tr = k.T(18), sx = w / 2 - t / 2 - 22, hd = d / 2, low = h * 0.5;
  const side = [[-hd, 0], [-hd + 48, h - tr], [hd * 0.3, h - tr], [hd * 0.36, low - tr], [hd - 22, low - tr], [hd, 0], [hd - 46, 0], [hd - 62, low * 0.52], [-hd + 86, low * 0.52], [-hd + 58, 0]];
  k.ph('sides', '옆판');
  k.ext('옆판', side, t, 'zy', [sx, 0, 0], { role: 'body', mx: true, ex: [1, 0, 0] });
  k.ph('rails', '가로대');
  k.box('윗 가로대', [2 * sx - t, 46, k.T(16)], [0, h - tr - 23, -hd + 60], { role: 'body' });
  k.box('아랫 가로대', [2 * sx - t, 46, k.T(16)], [0, low - tr - 23, hd - 44], { role: 'body' });
  k.ph('treads', '발판');
  k.ext('윗 발판', roundedRect(w, d * 0.62, 12, 4), tr, 'xz', [0, h - tr / 2, -hd + d * 0.31 + 4], { role: 'body', ex: [0, 1, 0], bevel: 2.5, note: '가운데 손잡이 구멍은 핀바이스로 뚫어 다듬음' });
  k.ext('아랫 발판', roundedRect(w, d * 0.46, 12, 4), tr, 'xz', [0, low - tr / 2, hd - d * 0.23 + 6], { role: 'body', ex: [0, 1, 0.6], bevel: 2.5 });
  k.flow([
    ['sides', '옆판 오리기', '계단 모양 옆판 두 장을 도안대로 오려 냅니다.', '두 장을 양면테이프로 겹쳐 붙여 한 번에 다듬으세요.'],
    ['rails', '가로대 연결', '두 옆판을 가로대 두 개로 연결합니다.', ''],
    ['treads', '발판 올리기', '아랫 발판과 윗 발판을 차례로 붙입니다.', '발판 앞 모서리를 둥글리면 실물과 닮습니다.', [0, 1, 0]],
  ]);
}

/** 사무용 의자(MARKUS). */
export function officeChair(k, s) {
  const { w, d, h } = s, sh = s.seatH ?? 480, br = w * 0.455, rake = 10;
  k.ph('base', '5발 받침');
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 2, x = Math.cos(a), z = Math.sin(a);
    strut(k, '받침 다리', [x * 46, 92, z * 46], [x * (br - 18), 62, z * (br - 18)], [26, 40], { role: 'frame', ex: [x, -0.5, z], rot: undefined });
    k.cyl('바퀴', 26, 44, [x * (br - 14), 26, z * (br - 14)], { axis: 'x', role: 'wheel', phase: 'hw', ex: [x, -1, z] });
  }
  k.cyl('허브', 44, 50, [0, 86, 0], { role: 'frame' });
  k.ph('column', '가스 기둥');
  k.cyl('기둥 외통', 26, sh * 0.34, [0, 110 + sh * 0.17, 0], { role: 'frame' });
  k.cyl('기둥 내통', 15, sh * 0.3, [0, 110 + sh * 0.34 + sh * 0.12, 0], { role: 'metal' });
  k.box('좌판 받침판', [220, 26, 240], [0, sh - 108, -10], { role: 'frame', bevel: 6 });
  k.ph('seat', '좌판');
  k.rbox('좌판 쿠션', [w * 0.84, 92, d * 0.8], [0, sh - 46, 24], 34, { role: 'seat', crown: [0, 0, 0, 10, 0, 0], ex: [0, 1, 0] });
  k.ph('back', '등받이');
  const bh = h - sh - 40, by = sh + 40 + bh / 2, bz = -d * 0.3 + 24 - (bh / 2) * Math.tan(rake * D2R);
  k.ext('등받이 프레임', roundedRect(w * 0.76, bh, 70, 8), 34, 'xy', [0, by, bz], { wall: 26, role: 'frame', rot: [-rake, 0, 0], ex: [0, 0.3, -1] });
  k.ext('등받이 그물', roundedRect(w * 0.76 - 30, bh - 30, 56, 8), 6, 'xy', [0, by, bz + 6], { role: 'mesh', rot: [-rake, 0, 0], ex: [0, 0.3, -0.6] });
  k.rbox('머리 받침', [w * 0.5, 150, 56], [0, h - 100, bz - (bh / 2 - 100) * Math.tan(rake * D2R) + 34], 24, { role: 'seat', rot: [-rake, 0, 0], ex: [0, 0.6, 1] });
  k.box('등받이 연결대', [70, 150, 22], [0, sh - 40, -d * 0.3 + 12], { role: 'frame', rot: [-rake, 0, 0], bevel: 5 });
  k.ph('arms', '팔걸이');
  const ax = w / 2 - 22;
  k.tube('팔걸이 지지대', [[ax - 30, sh - 96, 10], [ax, sh - 60, 10], [ax, sh + 150, -10]], 13, { corner: 40, role: 'frame', mx: true });
  k.rbox('팔걸이 패드', [50, 26, 250], [ax, sh + 162, 10], 11, { role: 'frame', mx: true, ex: [1, 0.5, 0] });
  k.flow([
    ['base', '5발 받침', '허브에서 다섯 방향으로 뻗는 받침 다리를 72° 간격으로 붙입니다.', '종이에 72° 간격 방사선을 그려 놓고 그 위에서 조립하세요.'],
    ['column', '기둥 세우기', '굵은 외통과 가는 내통을 겹쳐 가스 기둥을 세우고 좌판 받침판을 올립니다.', '빨대와 이쑤시개로 표현하면 간단합니다.'],
    ['seat', '좌판 쿠션', '스펀지에 원단을 씌운 좌판을 붙입니다.', '', [0, 1, 0]],
    ['back', '등받이', '테두리 프레임 안쪽에 그물 원단(스타킹·망사)을 붙이고 머리 받침을 답니다.', '프레임은 판재에서 고리 모양으로 오려 냅니다.', [0, 0.3, -1]],
    ['arms', '팔걸이', '지지대를 구부려 세우고 패드를 올립니다.', '', [1, 0, 0]],
    ['hw', '바퀴', '받침 다리 끝마다 바퀴를 붙입니다.', '검은 비즈가 잘 어울립니다.', [0, -1, 0]],
  ]);
}

/** 접이식 바 스툴(FRANKLIN). */
export function foldingBarStool(k, s) {
  const { w, d, h } = s, sh = s.seatH ?? 630, r = k.D(20) / 2, lx = w / 2 - r - 6;
  k.ph('legs', '파이프 프레임');
  k.tube('앞 프레임(등받이)', [[lx + 14, 0, d / 2 - r], [lx, sh, -d * 0.12], [lx - 10, h - r, -d / 2 + r + 10], [-lx + 10, h - r, -d / 2 + r + 10], [-lx, sh, -d * 0.12], [-lx - 14, 0, d / 2 - r]], r, { corner: 50, role: 'leg' });
  k.tube('뒤 프레임', [[lx - 2 * r - 4, 0, -d / 2 + r], [lx - 2 * r - 4, sh - 16, d * 0.2], [-lx + 2 * r + 4, sh - 16, d * 0.2], [-lx + 2 * r + 4, 0, -d / 2 + r]], r, { corner: 40, role: 'leg' });
  k.tube('발걸이', [[lx + 8, sh * 0.42, d / 2 - r - (d / 2 + d * 0.12 - r) * 0.42], [-lx - 8, sh * 0.42, d / 2 - r - (d / 2 + d * 0.12 - r) * 0.42]], r * 0.85, { role: 'leg' });
  k.ph('seat', '좌판');
  k.ext('좌판', roundedRect(w * 0.76, d * 0.7, 40, 6), k.T(20), 'xz', [0, sh + 2, 30], { role: 'top', ex: [0, 1, 0], bevel: 4 });
  k.flow([
    ['legs', '파이프 구부리기', '등받이까지 이어지는 앞 프레임과 뒤 프레임을 구부려 X자로 겹치고 발걸이를 붙입니다.', '교차점에 핀을 꽂으면 접을 수 있습니다.'],
    ['seat', '좌판 붙이기', '모서리가 둥근 좌판을 붙입니다.', '', [0, 1, 0]],
  ]);
}

/** 통통한 플라스틱 어린이 의자(MAMMUT). */
export function chunkyChair(k, s) {
  const { w, d, h } = s, sh = s.seatH ?? 300, lr = 30, lx = w / 2 - lr - 2, zf = d / 2 - lr - 2, zr = -d / 2 + lr + 2;
  k.ph('legs', '다리');
  k.cyl('앞다리', lr * 0.82, sh - 26, [lx, (sh - 26) / 2, zf], { r2: lr, role: 'plastic', mx: true, bevel: 5, ex: [0, -1, 0] });
  k.cyl('뒷다리', lr * 0.82, h - 30, [lx, (h - 30) / 2, zr], { r2: lr * 0.9, role: 'plastic', mx: true, bevel: 5, ex: [0, -0.5, -1] });
  k.ph('seat', '좌판');
  k.rbox('좌판', [w - 8, 32, d - 26], [0, sh - 16, 4], 15, { role: 'plastic', ex: [0, 1, 0], stock: 'block' });
  k.ph('back', '등받이');
  k.rbox('등판', [w - 14, 160, 34], [0, h - 86, zr], 16, { role: 'plastic', ex: [0, 0.5, -1], stock: 'block' });
  k.flow([
    ['legs', '통통한 다리', '굵은 환봉 다리 네 개를 준비합니다. 뒷다리는 등받이까지 길게 만듭니다.', '끝을 둥글게 갈아 장난감 같은 느낌을 살리세요.'],
    ['seat', '좌판', '모서리를 크게 둥글린 두꺼운 좌판을 다리 위에 붙입니다.', '', [0, 1, 0]],
    ['back', '등판', '뒷다리 사이에 둥근 등판을 붙입니다.', '', [0, 0.5, -1]],
  ]);
}

/** 하이체어(ANTILOP). */
export function highChair(k, s) {
  const { w, d, h } = s, sy = h * 0.6, r = k.D(22) / 2;
  k.ph('legs', '다리');
  for (const sz of [1, -1]) strut(k, '다리', [w / 2 - r, 0, sz * (d / 2 - r)], [w * 0.2, sy - 6, sz * d * 0.15], [2 * r, 2 * r], { round: true, role: 'leg', mx: true, ex: [0.6, -1, sz * 0.6] });
  for (const sz of [1, -1]) k.cyl('발', r + 3, 14, [w / 2 - r, 7, sz * (d / 2 - r)], { role: 'plastic', mx: true, phase: 'hw', ex: [0, -1, 0] });
  k.ph('seat', '시트');
  k.rbox('시트 바닥', [w * 0.52, 44, d * 0.46], [0, sy + 22, 0], 20, { role: 'plastic', stock: 'block' });
  const prof = [[-w * 0.26, d * 0.2], [-w * 0.27, -d * 0.12], [-w * 0.2, -d * 0.235], [w * 0.2, -d * 0.235], [w * 0.27, -d * 0.12], [w * 0.26, d * 0.2]];
  k.ext('시트 등받이', stripProfile(prof, 12, 60, 8), h - sy - 44, 'xz', [0, sy + 44 + (h - sy - 44) / 2, 0], { role: 'plastic', ex: [0, 0.6, -1], stock: 'band' });
  k.ph('tray', '트레이');
  k.ext('트레이', roundedRect(w * 0.72, d * 0.4, 40, 6), 18, 'xz', [0, sy + 150, d * 0.3], { role: 'plastic', ex: [0, 0.4, 1], bevel: 4, opt: false });
  k.flow([
    ['legs', '벌어진 다리', '파이프 다리 네 개를 바깥으로 넓게 벌려 준비합니다.', '빨대나 알루미늄 파이프가 잘 어울립니다.'],
    ['seat', '시트', '시트 바닥 위에 U자 등받이 띠를 둘러 붙이고 다리를 바닥에 꽂습니다.', '등받이는 프라판 띠를 따뜻하게 데워 휘면 됩니다.'],
    ['tray', '트레이', '둥근 사각 트레이를 앞에 붙입니다.', '', [0, 0.4, 1]],
    ['hw', '발 캡', '다리 끝에 발 캡을 끼웁니다.', '', [0, -1, 0]],
  ]);
}

/** 후프 등받이 의자(NORRARYD). */
export function hoopChair(k, s) {
  const { w, d, h } = s, sh = s.seatH ?? 450, st = k.T(30), top = sh - st, lr = k.D(30), lx = w * 0.32, lz = d * 0.32;
  k.ph('legs', '다리');
  strut(k, '앞다리', [lx + 36, 0, lz + 60], [lx, top, lz + 24], lr, { round: true, role: 'body', mx: true, ex: [0.5, -1, 0.5] });
  strut(k, '뒷다리', [lx + 26, 0, -lz - 62], [lx - 14, top, -lz + 6], lr, { round: true, role: 'body', mx: true, ex: [0.5, -1, -0.5] });
  k.ph('frame', '뼈대');
  k.cyl('옆 발걸이', k.D(18) / 2, 2 * lz + 60, [lx + 14, 190, 0], { axis: 'z', role: 'body', mx: true });
  k.cyl('가운데 발걸이', k.D(18) / 2, 2 * lx + 20, [0, 190, 10], { axis: 'x', role: 'body' });
  k.ph('seat', '좌판');
  k.ext('좌판', roundedRect(w - 10, d - 90, 70, 8), st, 'xz', [0, top + st / 2, 30], { role: 'body', ex: [0, 1, 0], bevel: 6 });
  k.ph('back', '등받이');
  const a = w * 0.4, bh = h - sh, zb = -d * 0.5 + 118, lean = bh * Math.tan(13 * D2R), hr = k.D(22) / 2;
  const P = (x, f) => [x, sh - 6 + bh * f, zb - lean * f];
  k.tube('후프', [P(-a, 0), P(-a * 1.06, 0.5), P(-a * 0.74, 0.93), P(0, 1 - hr / bh), P(a * 0.74, 0.93), P(a * 1.06, 0.5), P(a, 0)], hr, { corner: 120, role: 'body', ex: [0, 0.5, -1], note: '대나무 꼬치를 뜨거운 물에 불려 휘거나 철사에 색을 칠함' });
  for (const x of spread(5, -a * 0.68, a * 0.68)) {
    const f = Math.sqrt(Math.max(0, 1 - (x / (a * 1.1)) ** 2)) * 0.97;
    strut(k, '등받이 살', [x * 0.82, sh, zb + 6], [x, sh + bh * f - 8, zb - lean * f], k.D(13), { round: true, role: 'body', ex: [0, 0.5, -1] });
  }
  k.flow(CHAIR_FLOW);
}

export { circlePts };
