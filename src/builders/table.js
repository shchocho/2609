// table.js — 테이블·책상·카트.

import { roundedRect, circlePts } from '../core/geom.js';
import { strut, caster, spread, knob } from './util.js';
import { addDrawer } from './case.js';

export const TABLE_FLOW = [
  ['legs', '다리 준비', '다리를 같은 길이로 잘라 준비합니다.', '네 개를 테이프로 묶어 한 번에 사포질하면 길이가 같아집니다.', [0, -1, 0]],
  ['apron', '뼈대 짜기', '다리 사이에 가로대(에이프런)를 붙여 뼈대를 만듭니다.', '뒤집어 놓고 상판 쪽 면이 평평한지 확인하세요.'],
  ['shelf', '아래 선반 붙이기', '다리 사이 선반을 수평으로 붙입니다.', '같은 높이의 받침 블록을 깔고 붙이면 수평이 맞습니다.'],
  ['top', '상판 올리기', '상판을 뼈대 위에 올려 붙입니다.', '상판을 엎어 놓고 뼈대를 올려 붙이면 정렬이 쉽습니다.', [0, 1, 0]],
  ['drawer', '서랍 넣기', '서랍을 만들어 끼웁니다.', '', [0, 0, 1]],
  ['hw', '마무리 부품', '바퀴·손잡이 같은 작은 부품을 붙입니다.', '', [0, -1, 0]],
  ['set', '의자 만들기', '세트의 의자를 같은 방법으로 만듭니다.', '', [0, 0, 0]],
];

export function turnedLeg(h, r) {
  return [[0, 0], [r * 0.5, 0], [r * 0.58, h * 0.04], [r * 0.46, h * 0.09], [r * 0.6, h * 0.3], [r * 0.82, h * 0.55], [r * 0.95, h * 0.7],
    [r * 0.7, h * 0.74], [r * 1.02, h * 0.78], [r * 1.02, h * 0.82], [r * 0.8, h * 0.84], [r, h * 0.87], [r, h], [0, h]];
}

export function tableTop(k, s, y, o = {}) {
  const { w, d } = s, top = s.top || {}, tt = o.tt, role = top.role || 'top';
  const shape = top.shape || 'rect', opt = { role, ex: [0, 1, 0], phase: 'top', group: '상판', bevel: top.bevel ?? 1.5, grain: 'x' };
  if (shape === 'round') k.cyl('상판', w / 2, tt, [0, y + tt / 2, 0], { ...opt, bevel: top.bevel ?? 2 });
  else if (shape === 'rrect') k.ext('상판', roundedRect(w, d, top.r ?? 30, 8), tt, 'xz', [0, y + tt / 2, 0], opt);
  else if (shape === 'pts') k.ext('상판', top.pts, tt, 'xz', [0, y + tt / 2, 0], opt);
  else k.box('상판', [w, tt, d], [0, y + tt / 2, 0], opt);
}

/** 다리 넷 + 상판 테이블. */
export function table(k, s) {
  const { w, d, h } = s;
  const top = s.top || {}, tt = k.T(top.t ?? 20), lh = h - tt;
  const L = s.legs || {}, type = L.type || 'sq';
  const sec = k.D(L.sec ?? 45), [ix, iz] = L.inset || [0, 0], [sx, sz] = L.splay || [0, 0];
  const lx = w / 2 - ix - sec / 2, lz = d / 2 - iz - sec / 2;
  const foot = L.foot ?? 0;
  k.ph('legs', '다리');
  const lr = L.role || 'leg';
  if (type === 'turned') {
    k.lathe('다리', turnedLeg(lh, sec / 2), [lx, 0, lz], { role: lr, mx: true, mz: true, ex: [0, -1, 0] });
  } else {
    const bx = lx + lh * Math.tan((sx * Math.PI) / 180), bz = lz + lh * Math.tan((sz * Math.PI) / 180);
    const a = [bx, foot, bz], b = [lx, lh, lz];
    if (type === 'sq') strut(k, '다리', a, b, [sec, k.D(L.sec2 ?? sec)], { role: lr, mx: true, mz: true, ex: [0, -1, 0] });
    else {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const rx = (Math.atan2(b[2] - a[2], b[1] - a[1]) * 180) / Math.PI, rz = (-Math.atan2(b[0] - a[0], Math.hypot(b[1] - a[1], b[2] - a[2])) * 180) / Math.PI;
      k.cyl('다리', type === 'taper' ? k.D(L.sec2 ?? sec * 0.6) / 2 : sec / 2, len, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
        { r2: sec / 2, rot: [rx, 0, rz], role: lr, mx: true, mz: true, ex: [0, -1, 0] });
    }
    if (foot) k.cyl('발', sec * 0.42, foot, [bx, foot / 2, bz], { role: L.footRole || 'wheel', mx: true, mz: true, ex: [0, -1, 0], phase: 'hw' });
    if (L.plate) k.cyl('다리 고정판', sec * 1.1, 4, [lx, lh - 2, lz], { role: lr, mx: true, mz: true, ex: [0, -1, 0], phase: 'hw' });
  }
  if (s.apron) {
    const A = s.apron, ah = k.D(A.h ?? 70), at = k.T(A.t ?? 18), set = A.set ?? 3, ar = A.role || lr;
    const ins = A.inset ?? 0; // 다리와 무관하게 상판 가장자리에서 들여 놓을 때
    k.ph('apron', '뼈대');
    const ax = ins ? w / 2 - ins - at / 2 : lx + sec / 2 - set - at / 2, az = ins ? d / 2 - ins - at / 2 : lz + sec / 2 - set - at / 2;
    const lenX = ins ? w - 2 * ins : 2 * lx - sec, lenZ = ins ? d - 2 * ins - 2 * at : 2 * lz - sec;
    k.box('긴 가로대', [lenX, ah, at], [0, lh - ah / 2, az], { role: ar, mz: true, ex: [0, 0, 1] });
    if (!A.frontBackOnly) k.box('짧은 가로대', [at, ah, lenZ], [ax, lh - ah / 2, 0], { role: ar, mx: true, ex: [1, 0, 0] });
  }
  for (const y of s.stretchers || []) {
    k.ph('apron', '뼈대');
    k.box('발걸이', [k.T(18), k.D(28), 2 * lz - sec], [lx, y, 0], { role: lr, mx: true });
  }
  if (s.shelf) {
    const S = s.shelf, st = k.T(S.t ?? 16);
    k.ph('shelf', '선반');
    k.box('아래 선반', [S.w ?? 2 * lx - sec, st, S.d ?? d - 2 * iz - (S.inset ?? 0)], [0, S.y - st / 2, 0], { role: S.role || top.role || 'top', ex: [0, 0, 1] });
  }
  tableTop(k, s, lh, { tt });
  if (s.extra) s.extra(k, { tt, lh, lx, lz, sec });
  k.flow(TABLE_FLOW);
}

/** 가운데 기둥 하나로 서는 원형 테이블(DOCKSTA). */
export function pedestalTable(k, s) {
  const { w, h } = s, tt = k.T(s.top?.t ?? 22), ph = h - tt;
  k.ph('base', '받침');
  const R = s.baseR ?? w * 0.29, st = s.stemR ?? 55;
  k.lathe('기둥 받침', [[0, 0], [R, 0], [R, 8], [R * 0.84, 20], [R * 0.52, 55], [R * 0.3, 130], [st * 1.12, 260], [st, ph * 0.55], [st * 1.08, ph * 0.72],
    [st * 1.5, ph * 0.87], [st * 2.3, ph * 0.955], [st * 2.9, ph], [0, ph]], [0, 0, 0], { role: 'leg', note: '환봉에 퍼티·점토를 붙여 나팔 모양으로 다듬음' });
  k.ph('top', '상판');
  k.cyl('상판', w / 2, tt, [0, ph + tt / 2, 0], { role: 'top', bevel: 4, ex: [0, 1, 0] });
  k.flow([
    ['base', '기둥 만들기', '가운데 기둥과 넓은 받침을 한 덩어리로 만듭니다.', '환봉을 심으로 세우고 에폭시 퍼티로 곡선을 붙여 사포로 다듬습니다.'],
    ['top', '상판 올리기', '원형 상판을 기둥 중심에 맞춰 붙입니다.', '상판 뒷면에 중심 십자선을 그어 두면 맞추기 쉽습니다.', [0, 1, 0]],
  ]);
}

/** 접이식 날개 테이블(NORDEN). 가운데 서랍 몸통 + 양쪽 날개 + 받침 다리. */
export function gateleg(k, s) {
  const { d, h } = s, cw = s.center ?? 260, leaf = s.leaf ?? 630;
  const tt = k.T(20), t = k.T(18), ps = k.D(40), lh = h - tt;
  k.ph('body', '몸통');
  for (const z of [d / 2 - ps / 2 - 20, -d / 2 + ps / 2 + 20]) {
    k.box('몸통 기둥', [ps, lh, ps], [cw / 2 - ps / 2, lh / 2, z], { role: 'body', mx: true });
    k.box('몸통 가로대', [cw - 2 * ps, 50, t], [0, lh - 25, z], { role: 'body' });
    k.box('몸통 가로대', [cw - 2 * ps, 50, t], [0, 90, z], { role: 'body' });
  }
  k.box('몸통 옆판', [t, lh - 240, d - 40 - 2 * ps], [cw / 2 - t / 2 - 4, lh - (lh - 240) / 2, 0], { role: 'body', mx: true, ex: [1, 0, 0] });
  k.box('몸통 바닥', [cw - 2 * t - 8, t, d - 40 - 2 * ps], [0, 240 + t / 2, 0], { role: 'body' });
  k.ph('drawer', '서랍');
  const dh = (lh - 240 - t - 12) / 3, dw = (d - 40 - 2 * ps) / 2 - 6;
  for (const sx of [1, -1]) for (let i = 0; i < 3; i++) for (const zc of [dw / 2 + 3, -dw / 2 - 3]) {
    const y0 = 240 + t + 4 + i * (dh + 2);
    k.box('서랍 앞판', [t, dh - 2, dw], [sx * (cw / 2 - t / 2 + 6), y0 + dh / 2, zc], { role: 'front', ex: [sx, 0, 0] });
    k.sph('손잡이', 10, [sx * (cw / 2 + 14), y0 + dh / 2, zc], { role: 'knob', phase: 'hw', group: '철물', stock: 'bead', ex: [sx, 0, 0] });
  }
  k.ph('gate', '받침 다리');
  for (const sx of [1, -1]) {
    const gx = sx * (cw / 2 + leaf * 0.72);
    k.box('받침 다리', [ps * 0.8, lh, ps * 0.8], [gx, lh / 2, 0], { role: 'body', ex: [sx, 0, 0] });
    k.box('받침 가로대', [gx * sx - cw / 2 - ps * 0.4, 40, t], [sx * (cw / 2 + (gx * sx - cw / 2 - ps * 0.4) / 2), lh - 20, 0], { role: 'body', ex: [sx, 0, 0] });
    k.box('받침 가로대', [gx * sx - cw / 2 - ps * 0.4, 40, t], [sx * (cw / 2 + (gx * sx - cw / 2 - ps * 0.4) / 2), 140, 0], { role: 'body', ex: [sx, 0, 0] });
  }
  k.ph('top', '상판');
  k.box('가운데 상판', [cw, tt, d], [0, lh + tt / 2, 0], { role: 'top', ex: [0, 1, 0] });
  k.box('날개 상판', [leaf, tt, d], [cw / 2 + leaf / 2 + 1.5, lh + tt / 2, 0], { role: 'top', mx: true, ex: [0, 1, 0] });
  k.flow([
    ['body', '가운데 몸통 짜기', '기둥 네 개와 가로대로 좁은 몸통을 만들고 옆판·바닥을 붙입니다.', '몸통이 직각이어야 날개가 수평으로 펴집니다.'],
    ['drawer', '서랍 앞판 붙이기', '양쪽에 서랍 앞판을 세 단씩 붙입니다.', '실제로 여는 서랍으로 만들려면 얇은 종이 상자를 뒤에 붙이세요.'],
    ['gate', '받침 다리 만들기', '날개를 받칠 ㄷ자 받침 다리를 양쪽에 만듭니다.', '핀으로 축을 만들면 실물처럼 접을 수 있습니다.'],
    ['top', '상판과 날개 달기', '가운데 상판을 붙이고 양쪽 날개를 천 테이프 경첩으로 잇습니다.', '날개 사이 틈은 종이 한 장 두께로 남깁니다.', [0, 1, 0]],
    ['hw', '손잡이 달기', '서랍마다 작은 손잡이를 붙입니다.', ''],
  ]);
}

/** 트레이 테이블(GLADOM). */
export function trayTable(k, s) {
  const { w, h } = s, r = w / 2, rim = 42, H = h - rim;
  k.ph('stand', '스탠드');
  const a = r * 0.78, b = r * 0.62, z = r * 0.74;
  k.tube('다리 프레임', [[-a, 0, -z], [-b, H, z * 0.72], [b, H, z * 0.72], [a, 0, -z]], k.D(8) / 2, { corner: 30, role: 'leg' });
  k.tube('다리 프레임', [[-a + 14, 0, z], [-b + 14, H - 9, -z * 0.72], [b - 14, H - 9, -z * 0.72], [a - 14, 0, z]], k.D(8) / 2, { corner: 30, role: 'leg' });
  k.ph('tray', '트레이');
  k.lathe('트레이', [[0, 0], [r - 6, 0], [r, 6], [r, rim], [r - 3, rim], [r - 3, 7], [r - 7, 3], [0, 3]], [0, H, 0], { role: 'top', ex: [0, 1, 0], stock: 'cone', note: '원판 바닥 + 띠를 둘러 붙임' });
  k.flow([
    ['stand', '스탠드 구부리기', '철사 두 가닥을 ㄷ자로 구부려 X자로 교차시킵니다.', '도면 위에 철사를 대고 구부리면 좌우가 같아집니다.'],
    ['tray', '트레이 만들기', '원판 바닥에 얇은 띠를 둘러 테두리를 세웁니다.', '띠는 물에 적셔 원통에 감아 말리면 잘 휩니다.', [0, 1, 0]],
  ]);
}

/** 나뭇잎 상판 사이드 테이블(LÖVBACKEN). */
export function leafTable(k, s) {
  const { w, d, h } = s, tt = k.T(16), lh = h - tt;
  const pts = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2, c = Math.cos(a), f = 1 - 0.42 * c;
    pts.push([c * 0.96 + 0.04 * Math.cos(2 * a), Math.sin(a) * f]);
  }
  { // 윤곽을 정확히 w × d 에 맞춘다
    const xs = pts.map((q) => q[0]), zs = pts.map((q) => q[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    pts.forEach((q) => { q[0] = ((q[0] - x0) / (x1 - x0) - 0.5) * w; q[1] = ((q[1] - z0) / (z1 - z0) - 0.5) * d; });
  }
  k.ph('legs', '다리');
  const legs = [[w * 0.27, 0], [-w * 0.27, d * 0.24], [-w * 0.27, -d * 0.24]];
  for (const [x, z] of legs) {
    const l = Math.hypot(x, z) || 1, ox = (x / l) * lh * 0.14, oz = (z / l) * lh * 0.14;
    strut(k, '다리', [x + ox, 22, z + oz], [x, lh, z], k.D(26), { round: true, role: 'leg', ex: [0, -1, 0] });
    k.cyl('황동 발', 9, 24, [x + ox * 1.04, 12, z + oz * 1.04], { role: 'metal', ex: [0, -1, 0], phase: 'hw' });
  }
  k.ph('top', '상판');
  k.ext('상판', pts, tt, 'xz', [0, lh + tt / 2, 0], { role: 'top', ex: [0, 1, 0], bevel: 3 });
  k.flow([
    ['legs', '다리 세 개 깎기', '환봉 끝을 사포로 갈아 아래로 갈수록 가늘게 만듭니다.', '전동 드릴에 물려 돌리며 사포를 대면 고르게 깎입니다.', [0, -1, 0]],
    ['top', '잎 모양 상판', '도안을 붙여 상판을 오려 내고 다리를 바깥으로 살짝 벌려 붙입니다.', '다리 각도는 종이 지그를 대고 맞추세요.', [0, 1, 0]],
    ['hw', '발 끝 장식', '다리 끝에 황동색 발을 끼웁니다.', '황동 파이프 조각이나 금색 페인트로 표현합니다.', [0, -1, 0]],
  ]);
}

/** 낮은 TV 유닛(LACK). */
export function slabUnit(k, s) {
  const { w, d, h } = s, t = k.T(s.t ?? 40);
  k.ph('carcass', '본체');
  k.box('상판', [w, t, d], [0, h - t / 2, 0], { role: 'body', ex: [0, 1, 0], bevel: 1.5 });
  k.box('하판', [w, t, d], [0, t / 2 + (s.lift ?? 0), 0], { role: 'body', ex: [0, -1, 0], bevel: 1.5 });
  k.box('측판', [t, h - 2 * t - (s.lift ?? 0), d], [w / 2 - t / 2 - (s.sideInset ?? 0), (h + (s.lift ?? 0)) / 2, 0], { role: 'body', mx: true, bevel: 1.5 });
  k.flow([['carcass', '상자 틀 짜기', '상판과 하판 사이에 측판 두 장을 세워 붙입니다.', '두꺼운 판은 얇은 판을 겹쳐 만들어도 됩니다.']]);
}

/** T자 다리 책상(BEKANT). */
export function tLegDesk(k, s) {
  const { w, d, h } = s, tt = k.T(22), lh = h - tt, lx = w / 2 - (s.legInset ?? 130);
  k.ph('legs', '다리');
  k.rbox('발', [70, 26, d - 80], [lx, 13, 0], 8, { role: 'leg', mx: true, ex: [0, -1, 0] });
  k.rbox('다리 기둥', [86, lh - 26 - 22, 54], [lx, 26 + (lh - 48) / 2, 0], 14, { role: 'leg', mx: true });
  k.box('상판 받침', [60, 22, d - 160], [lx, lh - 11, 0], { role: 'leg', mx: true });
  k.ph('apron', '뼈대');
  k.box('가로 보', [2 * lx - 86, 46, 60], [0, lh - 22 - 23, 0], { role: 'leg' });
  k.ext('케이블 그물', roundedRect(2 * lx - 200, 300, 10), 3, 'xz', [0, lh - 110, -40], { role: 'mesh', opt: true, ex: [0, -1, 0] });
  k.ph('top', '상판');
  k.ext('상판', roundedRect(w, d, s.r ?? 22, 6), tt, 'xz', [0, lh + tt / 2, 0], { role: 'top', ex: [0, 1, 0], bevel: 2 });
  k.flow([
    ['legs', 'T자 다리 만들기', '납작한 발 위에 기둥을 세우고 위에 상판 받침을 붙입니다.', '기둥은 판재 세 겹을 붙여 모서리를 굴리면 됩니다.'],
    ['apron', '가로 보 연결', '두 다리를 가로 보로 연결합니다.', ''],
    ['top', '상판 올리기', '모서리가 둥근 상판을 올려 붙입니다.', '', [0, 1, 0]],
  ]);
}

/** 판 다리 책상(MALM). */
export function slabDesk(k, s) {
  const { w, d, h } = s, t = k.T(s.t ?? 46);
  k.ph('carcass', '본체');
  k.box('측판', [t, h - t, d], [w / 2 - t / 2, (h - t) / 2, 0], { role: 'body', mx: true, bevel: 1.5 });
  k.box('뒤 가림판', [w - 2 * t, s.backH ?? 330, k.T(16)], [0, h - t - (s.backH ?? 330) / 2, -d / 2 + 60], { role: 'body', ex: [0, 0, -1] });
  k.ph('top', '상판');
  k.box('상판', [w, t, d], [0, h - t / 2, 0], { role: 'top', ex: [0, 1, 0], bevel: 1.5 });
  if (s.pullout) {
    k.ph('pull', '보조 상판');
    const pw = s.pullout, pt = k.T(22);
    k.box('보조 상판', [pw, pt, d - 120], [w / 2 - pw / 2 + pw * 0.55, h - t - 60 - pt / 2, 30], { role: 'top', ex: [1, 0, 0] });
    k.box('보조 다리판', [pt, h - t - 60 - pt, d - 120], [w / 2 + pw * 0.55 - pt / 2, (h - t - 60 - pt) / 2, 30], { role: 'body', ex: [1, 0, 0] });
  }
  k.flow([
    ['carcass', '다리판 세우기', '두꺼운 측판 두 장 사이에 뒤 가림판을 붙입니다.', '가림판이 직각을 잡아 줍니다.'],
    ['top', '상판 올리기', '같은 두께의 상판을 올려 붙입니다.', '', [0, 1, 0]],
    ['pull', '보조 상판 만들기', '옆으로 빼는 보조 상판과 다리판을 ㄱ자로 붙여 책상 아래에 끼웁니다.', '', [1, 0, 0]],
  ]);
}

/** 수납 책상(MICKE). */
export function storageDesk(k, s) {
  const { w, d, h } = s, t = k.T(16), tt = k.T(20), bt = k.T(3), ph = h - tt, pw = s.ped ?? 350;
  const xr = w / 2 - t, xi = xr - pw; // 오른쪽 수납부 안쪽 범위
  k.ph('carcass', '본체');
  k.box('측판', [t, ph, d], [w / 2 - t / 2, ph / 2, 0], { role: 'body', mx: true });
  k.box('수납부 칸막이', [t, ph, d - 20], [xi - t / 2, ph / 2, -10], { role: 'body' });
  k.box('수납부 바닥', [pw, t, d - 30], [(xi + xr) / 2, 60 + t / 2, -5], { role: 'body' });
  k.box('걸레받이', [pw, 60, t], [(xi + xr) / 2, 30, d / 2 - 40], { role: 'body' });
  const lw = xi - t + w / 2 - t; // 왼쪽 열린 칸 폭
  const lcx = (-w / 2 + t + xi - t) / 2;
  k.box('서랍 아래판', [lw, t, d - 40], [lcx, ph - 120 - t / 2, -10], { role: 'body' });
  k.ph('back', '본체');
  k.box('뒤 가림판', [lw, 340, k.T(12)], [lcx, ph - 170, -d / 2 + 30], { role: 'body', ex: [0, 0, -1] });
  k.box('수납부 뒤판', [pw + t, ph - 60, bt], [(xi + xr) / 2, 60 + (ph - 60) / 2, -d / 2 + 12], { role: 'back', ex: [0, 0, -1] });
  k.ph('shelf', '선반');
  k.box('이동 선반', [pw - 2, t, d - 60], [(xi + xr) / 2, ph * 0.55, -10], { role: 'body', ex: [0, 0, 1] });
  k.ph('drawer', '서랍');
  addDrawer(k, { cx: lcx, y0: ph - 118, y1: ph - 3, w: lw - 4, zFront: d / 2 - 4, ft: t, depth: d - 90, boxW: lw - 10 });
  k.ph('door', '문');
  k.box('문짝', [pw - 4, ph - 66, t], [(xi + xr) / 2, 62 + (ph - 66) / 2, d / 2 - 4 - t / 2], { role: 'front', ex: [0, 0, 1] });
  k.ph('top', '상판');
  k.box('상판', [w, tt, d], [0, ph + tt / 2, 0], { role: 'top', ex: [0, 1, 0] });
  k.flow([
    ['carcass', '본체 짜기', '측판 두 장과 수납부 칸막이를 세우고 바닥·서랍 아래판을 붙입니다.', '칸막이가 수직인지 직각자로 확인하세요.'],
    ['back', '뒤판 붙이기', '뒤 가림판과 수납부 뒤판을 붙입니다.', '', [0, 0, -1]],
    ['shelf', '선반 끼우기', '수납부 안에 선반을 끼웁니다.', '', [0, 0, 1]],
    ['drawer', '서랍 만들기', '넓은 서랍을 만들어 상판 아래에 넣습니다.', '', [0, 0, 1]],
    ['door', '문 달기', '수납부 문을 붙입니다.', '', [0, 0, 1]],
    ['top', '상판 올리기', '상판을 올려 붙입니다.', '', [0, 1, 0]],
  ]);
}

/** 주방 카트(BEKVÄM). */
export function cart(k, s) {
  const { w, d, h } = s, ch = s.caster ?? 60, tt = k.T(28), ps = k.D(38), lh = h - tt;
  const lx = w / 2 - ps / 2 - 15, lz = d / 2 - ps / 2 - 15;
  k.ph('legs', '다리');
  k.box('다리', [ps, lh - ch, ps], [lx, ch + (lh - ch) / 2, lz], { role: 'body', mx: true, mz: true });
  k.ph('apron', '뼈대');
  k.box('긴 가로대', [2 * lx - ps, 60, k.T(18)], [0, lh - 30, lz], { role: 'body', mz: true });
  k.box('짧은 가로대', [k.T(18), 60, 2 * lz - ps], [lx, lh - 30, 0], { role: 'body', mx: true });
  k.ph('shelf', '선반');
  for (const y of s.shelves || [ch + 110, ch + 400]) {
    k.box('선반 가로대', [k.T(18), 34, 2 * lz - ps], [lx, y - 17, 0], { role: 'body', mx: true });
    for (const z of spread(5, -lz + ps / 2 + 36, lz - ps / 2 - 36)) k.box('선반 살', [2 * lx + ps - 4, k.T(14), 62], [0, y + 7, z], { role: 'body' });
  }
  k.ph('top', '상판');
  k.box('상판', [w, tt, d], [0, lh + tt / 2, 0], { role: 'top', ex: [0, 1, 0], bevel: 2.5 });
  k.ph('hw', '철물');
  for (const x of [lx, -lx]) for (const z of [lz, -lz]) caster(k, x, z, ch, { phase: 'hw' });
  k.flow(TABLE_FLOW);
}

/** 수납통이 달린 어린이 테이블(FLISAT). */
export function binTable(k, s) {
  const { w, d, h } = s, tt = k.T(12), la = k.D(28), lb = k.D(44), lh = h - tt;
  const lx = w / 2 - la / 2 - 12, lz = d / 2 - lb / 2 - 10;
  k.ph('legs', '다리');
  k.box('다리', [la, lh, lb], [lx, lh / 2, lz], { role: 'body', mx: true, mz: true });
  k.ph('apron', '뼈대');
  k.box('긴 가로대', [2 * lx - la, 70, k.T(18)], [0, lh - 35, lz + lb / 2 - 9], { role: 'body', mz: true });
  k.box('짧은 가로대', [k.T(18), 70, 2 * lz - lb], [lx, lh - 35, 0], { role: 'body', mx: true });
  k.box('가운데 가로대', [k.T(18), 70, 2 * lz + lb - 36], [0, lh - 35, 0], { role: 'body' });
  k.ph('bin', '수납통');
  const bw = lx - la / 2 - 26, bd = 2 * lz + lb - 60;
  for (const sx of [1, -1]) {
    const cx = sx * (bw / 2 + 14);
    k.ext('수납통 둘레', roundedRect(bw, bd, 30, 5), 100, 'xz', [cx, lh - 62, 0], { wall: 3, role: 'plastic', ex: [0, -1, 0] });
    k.ext('수납통 바닥', roundedRect(bw - 4, bd - 4, 28, 5), 3, 'xz', [cx, lh - 111, 0], { role: 'plastic', ex: [0, -1, 0] });
  }
  k.ph('top', '상판');
  const lw = w / 2 - 3;
  k.box('뚜껑 상판', [lw, tt, d], [lw / 2 + 3, lh + tt / 2, 0], { role: 'top', mx: true, ex: [0, 1, 0] });
  k.flow([
    ['legs', '다리 준비', '납작한 각재 다리 네 개를 자릅니다.', ''],
    ['apron', '뼈대 짜기', '다리 사이에 가로대를 두르고 가운데 가로대를 붙입니다.', '가운데 가로대가 두 뚜껑을 받칩니다.'],
    ['bin', '수납통 만들기', '띠를 둥근 사각형으로 말아 바닥을 붙인 수납통 두 개를 만듭니다.', '두꺼운 켄트지가 다루기 쉽습니다.', [0, -1, 0]],
    ['top', '뚜껑 얹기', '좌우 뚜껑 상판을 얹습니다. 붙이지 않으면 실제로 열립니다.', '', [0, 1, 0]],
  ]);
}

export { roundedRect, circlePts, knob };
