// bed.js — 침대·데이베드·2층 침대·아기 침대.

import { spread, strut } from './util.js';
import { addDrawer } from './case.js';

export const BED_FLOW = [
  ['head', '헤드보드 만들기', '헤드보드를 조립합니다.', '헤드보드가 침대 폭보다 살짝 넓어야 프레임이 사이에 끼워집니다.'],
  ['foot', '풋보드 만들기', '발치 쪽 판(풋보드)을 조립합니다.', ''],
  ['rails', '옆 프레임 연결', '헤드보드와 풋보드를 좌우 옆 프레임으로 연결합니다.', '평평한 바닥에서 조립하고 대각선 길이를 재서 직각을 확인하세요.'],
  ['slats', '갈빗살 깔기', '가운데 보를 걸고 갈빗살을 일정한 간격으로 깝니다.', '갈빗살을 마스킹 테이프 두 줄에 붙여 사다리처럼 만든 뒤 통째로 얹으면 빠릅니다.', [0, 1, 0]],
  ['drawer', '수납 서랍', '침대 아래 서랍을 만들어 넣습니다.', '', [1, 0, 0]],
  ['guard', '난간·사다리', '난간과 사다리를 붙입니다.', '사다리 발판 간격은 스페이서로 맞춥니다.'],
  ['bedding', '매트리스와 침구', '스펀지에 흰 원단을 씌워 매트리스를 만들고 베개를 올립니다.', '베개는 원단 주머니에 솜을 넣고 가운데를 살짝 눌러 줍니다.', [0, 1, 0]],
];

export function bedding(k, mw, ml, y, o = {}) {
  const mt = o.t ?? 200, z = o.z ?? 0, n = o.pillows ?? (mw > 1200 ? 2 : 1);
  k.ph('bedding', '침구');
  k.rbox('매트리스', [mw - 10, mt, ml - 10], [o.x ?? 0, y + mt / 2, z], 44, { role: 'mattress', opt: true, crown: [0, 0, 0, 8, 0, 0], ex: [0, 1, 0] });
  if (o.duvet !== false) {
    k.rbox('이불', [mw + 30, 46, ml * 0.62], [o.x ?? 0, y + mt + 14, z + ml * 0.17], 22, { role: 'duvet', opt: true, crown: [0, 0, 0, 16, 0, 0], ex: [0, 1.4, 0] });
  }
  const pw = Math.min(620, mw / n - 60);
  for (const x of n === 1 ? [0] : [-(mw / 4), mw / 4]) {
    k.rbox('베개', [pw, 110, 380], [(o.x ?? 0) + x, y + mt + 46, z - ml / 2 + 250], 50, { role: 'pillow', opt: true, crown: [0, 0, 0, 26, 0, 0], rot: [8, 0, 0], ex: [0, 1.8, 0] });
  }
}

/**
 * 범용 침대. 머리맡이 −Z, 발치가 +Z.
 * head.type: slab | frame | spindle | pad | storage, foot.type: slab | frame | spindle | none
 */
export function bed(k, s) {
  const mw = s.mw, ml = s.ml ?? 2000;
  const H = s.head, F = s.foot || { type: 'none' };
  const ht = k.T(H.t ?? 40), ftT = F.type === 'none' ? 0 : k.T(F.t ?? H.t ?? 40);
  const rt = k.T(s.rail?.t ?? 25), rh = s.rail?.h ?? 200, ry = s.rail?.y ?? 320; // 레일 윗면 높이
  const w = mw + 2 * rt + (s.gap ?? 20), L = ml + ht + ftT + (s.lenGap ?? 20);
  const z0 = -L / 2, z1 = L / 2, role = s.role || 'body';
  const post = (name, x, y0, y1, z, sec, o = {}) => k.box(name, [sec, y1 - y0, sec], [x, (y0 + y1) / 2, z], { role, ...o });
  const panelEnd = (E, z, phase, name) => {
    const hh = E.h, t = k.T(E.t ?? 40), type = E.type || 'slab';
    k.ph(phase, name);
    if (type === 'slab') {
      k.box(name, [E.w ?? w, hh - (E.lift ?? 0), t], [0, (hh + (E.lift ?? 0)) / 2, z], { role: E.role || role, bevel: 1.5, ex: [0, 0, Math.sign(z)] });
    } else if (type === 'pad') {
      k.rbox(name, [E.w ?? w, hh - (E.lift ?? 0), t], [0, (hh + (E.lift ?? 0)) / 2, z], Math.min(t * 0.4, 40), { role: 'fabric', rot: [E.rake ? -E.rake * Math.sign(-z) : 0, 0, 0], crown: [0, 0, 0, 0, z < 0 ? 0 : 10, z < 0 ? 10 : 0], stock: 'block', ex: [0, 0, Math.sign(z)] });
    } else if (type === 'frame' || type === 'spindle') {
      const ps = k.D(E.post ?? 60), px = w / 2 - ps / 2, metal = type === 'spindle';
      const pr = metal ? 'frame' : role;
      if (metal) {
        k.cyl(`${name} 기둥`, ps / 2, hh, [px, hh / 2, z], { role: pr, mx: true, ex: [0, 0, Math.sign(z)] });
        k.sph('기둥 장식', ps * 0.72, [px, hh + ps * 0.5, z], { role: E.finial || 'knob', mx: true, phase: 'hw', ex: [0, 1, 0] });
        k.cyl(`${name} 윗대`, ps * 0.4, w - ps, [0, hh - ps * 0.6, z], { axis: 'x', role: pr, ex: [0, 0, Math.sign(z)] });
        k.cyl(`${name} 아랫대`, ps * 0.4, w - ps, [0, ry + 60, z], { axis: 'x', role: pr, ex: [0, 0, Math.sign(z)] });
        const y0 = ry + 60, y1 = hh - ps * 0.6;
        for (const x of spread(E.n ?? 9, -w / 2 + ps * 2.2, w / 2 - ps * 2.2)) k.cyl(`${name} 살`, ps * 0.22, y1 - y0, [x, (y0 + y1) / 2, z], { role: pr, ex: [0, 0, Math.sign(z)] });
      } else {
        post(`${name} 기둥`, px, 0, hh, z, ps, { mx: true, ex: [0, 0, Math.sign(z)] });
        const th = E.topH ?? 90, y1 = hh - (E.drop ?? 20), y0 = ry - rh + 20, pt = k.T(E.panelT ?? 18);
        k.box(`${name} 윗대`, [w - 2 * ps, th, k.T(E.railT ?? 26)], [0, y1 - th / 2, z], { role, ex: [0, 0, Math.sign(z)] });
        k.box(`${name} 아랫대`, [w - 2 * ps, 70, k.T(E.railT ?? 26)], [0, y0 + 35, z], { role, ex: [0, 0, Math.sign(z)] });
        if (E.fill === 'slats') {
          const n = E.n ?? 9, sw = ((w - 2 * ps) / n) * 0.72;
          for (const x of spread(n, -w / 2 + ps + sw / 2 + 12, w / 2 - ps - sw / 2 - 12)) k.box(`${name} 세로살`, [sw, y1 - th - y0 - 70, pt * 0.7], [x, (y1 - th + y0 + 70) / 2, z], { role, ex: [0, 0, Math.sign(z)] });
        } else {
          k.box(`${name} 패널`, [w - 2 * ps, y1 - th - y0 - 70, pt], [0, (y1 - th + y0 + 70) / 2, z], { role: E.panelRole || role, ex: [0, 0, Math.sign(z)] });
        }
      }
    }
  };
  panelEnd(H, z0 + ht / 2, 'head', '헤드보드');
  if (H.type === 'storage') {
    // 수납형 헤드보드(BRIMNES): 상자 + 선반
    const sd = H.d ?? 280, t = k.T(16);
    k.ph('head', '헤드보드');
    k.box('헤드보드 뒤판', [w, H.h, t], [0, H.h / 2, z0 - sd + ht + t / 2], { role, ex: [0, 0, -1] });
    k.box('헤드보드 측판', [t, H.h, sd - t], [w / 2 - t / 2, H.h / 2, z0 + ht - sd / 2 + t / 2], { role, mx: true, ex: [0, 0, -1] });
    k.box('헤드보드 상판', [w - 2 * t, t, sd - t], [0, H.h - t / 2, z0 + ht - sd / 2 + t / 2], { role, ex: [0, 0, -1] });
    k.box('헤드보드 선반', [w - 2 * t, t, sd - t - 20], [0, H.h - 300, z0 + ht - sd / 2 + t / 2 - 10], { role, ex: [0, 0, -1] });
    k.box('헤드보드 앞판', [w - 2 * t, H.h - 330, t], [0, (H.h - 330) / 2, z0 + ht - t / 2], { role, ex: [0, 0, -1] });
    k.box('헤드보드 칸막이', [t, 300 - t, sd - t - 20], [0, H.h - 150 - t / 2, z0 + ht - sd / 2 + t / 2 - 10], { role, ex: [0, 0, -1] });
  }
  if (F.type !== 'none') panelEnd(F, z1 - ftT / 2, 'foot', '풋보드');
  k.ph('rails', '옆 프레임');
  const rl = ml + (s.lenGap ?? 20), rz = z0 + ht + rl / 2;
  const railRole = s.rail?.role || (H.type === 'pad' ? 'fabric' : H.type === 'spindle' ? 'frame' : role);
  if (H.type === 'pad') k.rbox('옆 프레임', [rt, rh, rl + (F.type === 'none' ? rt : 0)], [w / 2 - rt / 2, ry - rh / 2, rz], Math.min(rt * 0.4, 20), { role: railRole, mx: true, stock: 'block', ex: [1, 0, 0] });
  else k.box('옆 프레임', [rt, rh, rl], [w / 2 - rt / 2, ry - rh / 2, rz], { role: railRole, mx: true, ex: [1, 0, 0], bevel: 1.5 });
  if (F.type === 'none') {
    if (H.type === 'pad') k.rbox('발치 프레임', [w - 2 * rt, rh, rt], [0, ry - rh / 2, z1 - rt / 2], Math.min(rt * 0.4, 20), { role: railRole, stock: 'block', ex: [0, 0, 1] });
    else k.box('발치 프레임', [w - 2 * rt, rh, rt], [0, ry - rh / 2, z1 - rt / 2], { role: railRole, ex: [0, 0, 1] });
  }
  if (s.legs) {
    const lg = s.legs, lh = ry - rh;
    for (const z of F.type === 'none' ? [z0 + ht + 60, z1 - 60] : [z1 - ftT - 60].slice(0, lg.footOnly ? 1 : 0)) {
      if (lg.round) k.cyl('다리', (lg.sec ?? 50) * 0.36, lh, [w / 2 - 50, lh / 2, z], { r2: (lg.sec ?? 50) / 2, role: lg.role || 'leg', mx: true, ex: [0, -1, 0] });
      else k.box('다리', [lg.sec ?? 50, lh, lg.sec ?? 50], [w / 2 - (lg.sec ?? 50) / 2 - 4, lh / 2, z], { role: lg.role || 'leg', mx: true, ex: [0, -1, 0] });
    }
  }
  // 갈빗살
  k.ph('slats', '갈빗살');
  const sy = ry - (s.slatDrop ?? 70);
  if (mw > 1100) k.box('가운데 보', [k.D(40), 50, rl - 10], [0, sy - 35, rz], { role: 'frame', ex: [0, 0.6, 0] });
  k.box('살 받침대', [k.D(22), 22, rl - 20], [w / 2 - rt - 11, sy - 21, rz], { role: 'slat', mx: true, ex: [0, 0.6, 0] });
  if (!k.simple) for (const z of spread(s.slats ?? 14, rz - rl / 2 + 60, rz + rl / 2 - 60)) k.box('갈빗살', [mw - 6, k.T(10), 62], [0, sy - 5, z], { role: 'slat', ex: [0, 1, 0] });
  else k.box('바닥판', [mw - 6, k.T(10), rl - 30], [0, sy - 5, rz], { role: 'slat', ex: [0, 1, 0] });
  // 서랍
  if (s.drawers) {
    const n = s.drawers, dh = ry - rh - 30 > 120 ? Math.min(ry - 40, 260) : 0;
    const dl = (rl - 40) / n, dy0 = 22, dy1 = s.drawerH ?? ry - rh - 6;
    for (const sx of [1, -1]) for (let i = 0; i < n; i++) {
      const zc = rz - rl / 2 + 20 + dl * (i + 0.5);
      k.at([sx * (w / 2), 0, zc], sx * 90, () => addDrawer(k, { cx: 0, y0: dy0, y1: dy1, w: dl - 8, zFront: 0, ft: k.T(16), depth: Math.min(mw / 2 - 40, 600), boxW: dl - 30, roleFront: s.drawerRole || 'front', roleBox: 'drawer' }));
    }
    void dh;
  }
  if (s.bedding !== false) bedding(k, mw, ml, sy, { t: s.mattressT ?? 200, z: rz });
  if (s.extra) s.extra(k, { w, L, z0, z1, ht, rz, rl, sy, ry, rh, rt });
  k.flow(BED_FLOW);
}

/** 데이베드(HEMNES): 세 면 프레임 + 큰 서랍. 긴 변이 X, 정면이 +Z. */
export function daybed(k, s) {
  const { w, d, h } = s, ps = k.D(60), t = k.T(20), ry = s.seatY ?? 400, role = 'body';
  const px = w / 2 - ps / 2, pzB = -d / 2 + ps / 2, pzF = d / 2 - ps / 2;
  k.ph('head', '프레임');
  for (const z of [pzB, pzF]) k.box('기둥', [ps, z === pzB ? h : s.armH ?? h * 0.74, ps], [px, (z === pzB ? h : s.armH ?? h * 0.74) / 2, z], { role, mx: true, ex: [1, 0, 0] });
  const ah = s.armH ?? h * 0.74;
  k.box('뒤 윗대', [w - 2 * ps, 80, t + 6], [0, h - 60, pzB], { role, ex: [0, 0, -1] });
  k.box('뒤 패널', [w - 2 * ps, h - 100 - ry + 120, t], [0, (h - 100 + ry - 120) / 2, pzB], { role, ex: [0, 0, -1] });
  k.box('옆 윗대', [t + 6, 70, d - 2 * ps], [px, ah - 50, 0], { role, mx: true, ex: [1, 0, 0] });
  k.box('옆 패널', [t, ah - 85 - ry + 120, d - 2 * ps], [px, (ah - 85 + ry - 120) / 2, 0], { role, mx: true, ex: [1, 0, 0] });
  k.ph('rails', '프레임');
  k.box('앞 가로대', [w - 2 * ps, 60, t + 6], [0, ry - 30, pzF], { role });
  k.box('바닥 가로대', [w - 2 * ps, 40, t + 6], [0, 30, pzF - 4], { role });
  k.ph('slats', '갈빗살');
  k.box('살 받침대', [w - 2 * ps, 22, 22], [0, ry - 70, pzB + ps / 2 + 11], { role: 'slat' });
  if (!k.simple) for (const x of spread(13, -w / 2 + ps + 60, w / 2 - ps - 60)) k.box('갈빗살', [62, k.T(10), d - ps - 30], [x, ry - 54, 10], { role: 'slat', ex: [0, 1, 0] });
  else k.box('바닥판', [w - 2 * ps - 20, k.T(10), d - ps - 30], [0, ry - 54, 10], { role: 'slat', ex: [0, 1, 0] });
  k.ph('drawer', '서랍');
  const n = s.drawers ?? 3, dw = (w - 2 * ps) / n;
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + ps + dw * (i + 0.5);
    addDrawer(k, { cx, y0: 64, y1: ry - 64, w: dw - 6, zFront: d / 2 - 6, ft: t, depth: d - ps - 80, boxW: dw - 26 });
    for (const dx of [-dw * 0.22, dw * 0.22]) k.sph('손잡이', 13, [cx + dx, (ry) / 2, d / 2 + 6], { role: 'knob', phase: 'hw', group: '철물', stock: 'bead', ex: [0, 0, 1] });
  }
  k.ph('bedding', '침구');
  const mt = 110, mw = w - 2 * ps - 20, md = d - ps - 40;
  for (let i = 0; i < (s.mattresses ?? 2); i++) k.rbox('매트리스', [mw, mt, md], [0, ry - 48 + mt / 2 + i * mt, 14], 30, { role: 'mattress', opt: true, ex: [0, 1 + i * 0.5, 0] });
  for (const x of [-mw / 2 + 240, mw / 2 - 240, 0]) k.rbox('쿠션', [420, 380, 130], [x, ry - 48 + (s.mattresses ?? 2) * mt + 180, pzB + ps / 2 + 90], 50, { role: 'pillow', opt: true, rot: [-14, 0, 0], crown: [0, 0, 0, 0, 0, 30], ex: [0, 1.6, 0.4] });
  k.flow([
    ['head', '세 면 프레임', '뒤와 양옆에 기둥을 세우고 윗대와 패널을 붙여 ㄷ자 프레임을 만듭니다.', '패널은 기둥 중심선에 맞춰 붙이면 실물처럼 보입니다.'],
    ['rails', '앞 가로대', '앞쪽 기둥 사이에 가로대를 붙여 서랍 틀을 만듭니다.', ''],
    ['slats', '갈빗살 깔기', '살 받침대 위에 갈빗살을 깝니다.', '', [0, 1, 0]],
    ['drawer', '큰 서랍', '서랍 세 개를 만들어 넣습니다.', '실물처럼 서랍을 끝까지 빼면 침대가 두 배로 넓어집니다.', [0, 0, 1]],
    ['hw', '손잡이', '서랍마다 손잡이 두 개를 붙입니다.', '', [0, 0, 1]],
    ['bedding', '매트리스와 쿠션', '얇은 매트리스 두 장을 겹치고 쿠션을 세웁니다.', '', [0, 1, 0]],
  ]);
}

/** 2층 침대·로프트 침대. metal = 파이프 구조. */
export function bunk(k, s) {
  const { mw, h } = s, ml = s.ml ?? 2000, metal = !!s.metal, ps = k.D(s.post ?? (metal ? 38 : 60)), pb = metal ? ps : k.D(s.postB ?? 44);
  const w = mw + 2 * (metal ? ps : 28) + 14, L = ml + 2 * pb + 16, px = w / 2 - ps / 2, pz = L / 2 - pb / 2, role = metal ? 'frame' : 'body';
  const levels = s.levels; // 침대 바닥 높이들
  k.ph('head', '끝 프레임');
  for (const z of [pz, -pz]) {
    if (metal) k.cyl('기둥', ps / 2, h, [px, h / 2, z], { role, mx: true, ex: [0, 0, Math.sign(z)] });
    else k.box('기둥', [ps, h, pb], [px, h / 2, z], { role, mx: true, ex: [0, 0, Math.sign(z)] });
    for (const y of levels) {
      const ys = metal ? [y + 110, y + 330] : [y + 60, y + 260];
      for (const yy of [y - 40, ...ys].filter((v) => v < h - 10)) {
        if (metal) k.cyl('끝 가로대', ps * 0.36, w - ps, [0, yy, z], { axis: 'x', role, ex: [0, 0, Math.sign(z)] });
        else k.box('끝 가로판', [w - 2 * ps, yy === y - 40 ? 150 : 90, k.T(20)], [0, yy, z], { role, ex: [0, 0, Math.sign(z)] });
      }
    }
  }
  k.ph('rails', '옆 프레임');
  for (const y of levels) {
    if (metal) k.cyl('옆 프레임', ps * 0.42, L - pb, [px, y - 30, 0], { axis: 'z', role, mx: true, ex: [1, 0, 0] });
    else k.box('옆 프레임', [k.T(24), 150, L - 2 * pb], [px, y - 40, 0], { role, mx: true, ex: [1, 0, 0] });
  }
  k.ph('slats', '갈빗살');
  for (const y of levels) {
    if (!k.simple) for (const z of spread(12, -L / 2 + pb + 70, L / 2 - pb - 70)) k.box('갈빗살', [mw, k.T(10), 62], [0, y - 10, z], { role: metal ? 'frame' : 'slat', ex: [0, 1, 0] });
    else k.box('바닥판', [mw, k.T(10), ml], [0, y - 10, 0], { role: 'slat', ex: [0, 1, 0] });
  }
  k.ph('guard', '난간·사다리');
  const top = levels[levels.length - 1], lz = s.ladderZ ?? L / 2 - pb - 240, lw = 380;
  for (const sx of [1, -1]) {
    const open = sx === 1; // 사다리 쪽은 난간을 짧게
    const z0 = -L / 2 + pb, z1 = open ? lz - lw / 2 - 20 : L / 2 - pb, len = z1 - z0;
    for (const yy of metal ? [top + 110, top + 330] : [top + 150, top + 300]) {
      if (yy > h - 5) continue;
      if (metal) k.cyl('난간', ps * 0.36, len, [sx * px, yy, (z0 + z1) / 2], { axis: 'z', role, ex: [sx, 0, 0] });
      else k.box('난간', [k.T(20), 90, len], [sx * px, yy, (z0 + z1) / 2], { role, ex: [sx, 0, 0] });
    }
  }
  // 사다리(+X 쪽 옆면)
  const lx = px + (metal ? ps * 0.9 : ps / 2 + 14), ly1 = Math.min(h, top + 330);
  for (const z of [lz - lw / 2, lz + lw / 2]) {
    if (metal) k.cyl('사다리 기둥', ps * 0.4, ly1, [lx, ly1 / 2, z], { role, ex: [1, 0, 0] });
    else k.box('사다리 기둥', [k.T(28), ly1, 60], [lx, ly1 / 2, z], { role, ex: [1, 0, 0] });
  }
  for (const y of spread(Math.max(3, Math.round(top / 290)), 240, top - 30)) {
    if (metal) k.cyl('사다리 발판', ps * 0.34, lw, [lx, y, lz], { axis: 'z', role, ex: [1, 0, 0] });
    else k.box('사다리 발판', [70, k.T(24), lw - 60], [lx, y, lz], { role, ex: [1, 0, 0] });
  }
  if (s.brace) {
    k.ph('brace', '보강대');
    k.tube('X 보강대', [[-px, 80, -pz - ps * 0.6], [px, top - 120, -pz - ps * 0.6]], 5, { role: 'frame', ex: [0, 0, -1] });
    k.tube('X 보강대', [[px, 80, -pz - ps * 0.9], [-px, top - 120, -pz - ps * 0.9]], 5, { role: 'frame', ex: [0, 0, -1] });
  }
  if (s.bedding !== false) for (const y of levels) {
    k.ph('bedding', '침구');
    k.rbox('매트리스', [mw - 10, 130, ml - 10], [0, y + 60, 0], 34, { role: 'mattress', opt: true, ex: [0, 1, 0] });
    k.rbox('베개', [520, 100, 340], [0, y + 150, -ml / 2 + 220], 46, { role: 'pillow', opt: true, crown: [0, 0, 0, 22, 0, 0], ex: [0, 1.6, 0] });
  }
  k.flow([
    ['head', '끝 프레임 두 개', '기둥 두 개 사이에 가로대를 붙여 머리맡·발치 프레임을 만듭니다.', '두 프레임을 겹쳐 가로대 높이가 같은지 확인하세요.'],
    ['rails', '옆 프레임 연결', '층마다 긴 옆 프레임으로 두 끝 프레임을 연결합니다.', '세워 놓고 흔들리지 않는지 확인합니다.'],
    ['slats', '갈빗살 깔기', '층마다 갈빗살을 깝니다.', '', [0, 1, 0]],
    ['guard', '난간과 사다리', '위층 난간을 붙이고 옆면에 사다리를 세웁니다.', '사다리 쪽 난간은 드나드는 폭만큼 비워 둡니다.', [1, 0, 0]],
    ['brace', '보강대', '뒷면에 X자 보강대를 붙입니다.', '', [0, 0, -1]],
    ['bedding', '매트리스', '층마다 얇은 매트리스와 베개를 올립니다.', '', [0, 1, 0]],
  ]);
}

/** 양면 침대(KURA) — 높은 침대 방향. */
export function kura(k, s) {
  const { w, d, h } = s, ps = k.D(45), t = k.T(8), by = s.bedY ?? 830, L = d, px = w / 2 - ps / 2, pz = L / 2 - ps / 2;
  k.ph('head', '프레임');
  k.box('기둥', [ps, h, ps], [px, h / 2, pz], { role: 'body', mx: true, mz: true, ex: [1, 0, 0] });
  for (const y of [h - 22, by - 22, 60]) {
    k.box('긴 가로대', [ps * 0.7, 44, L - 2 * ps], [px, y, 0], { role: 'body', mx: true, ex: [1, 0, 0] });
    k.box('짧은 가로대', [w - 2 * ps, 44, ps * 0.7], [0, y, pz], { role: 'body', mz: true });
  }
  k.ph('panels', '패널');
  const ph = h - by - 44;
  k.box('긴 패널', [t, ph, L - 2 * ps - 520], [px, by + ph / 2, -260], { role: 'front', ex: [1, 0, 0] });
  k.box('긴 패널', [t, ph, L - 2 * ps], [-px, by + ph / 2, 0], { role: 'front', ex: [-1, 0, 0] });
  k.box('끝 패널', [w - 2 * ps, ph, t], [0, by + ph / 2, -pz], { role: 'front', ex: [0, 0, -1] });
  k.box('끝 패널', [w - 2 * ps, ph, t], [0, by + ph / 2, pz], { role: 'accent', ex: [0, 0, 1] });
  k.ph('slats', '갈빗살');
  if (!k.simple) for (const z of spread(11, -L / 2 + ps + 80, L / 2 - ps - 80)) k.box('갈빗살', [w - 2 * ps + 20, k.T(10), 70], [0, by - 6, z], { role: 'slat', ex: [0, 1, 0] });
  else k.box('바닥판', [w - 2 * ps + 20, k.T(10), L - 2 * ps], [0, by - 6, 0], { role: 'slat', ex: [0, 1, 0] });
  k.ph('guard', '사다리');
  const lz = pz - 270;
  for (const z of [lz - 200, lz + 200]) k.box('사다리 기둥', [k.T(26), by + 10, 50], [px + ps / 2 + 13, (by + 10) / 2, z], { role: 'body', ex: [1, 0, 0] });
  for (const y of spread(3, 230, by - 60)) k.box('사다리 발판', [60, k.T(22), 350], [px + ps / 2 + 13, y, lz], { role: 'body', ex: [1, 0, 0] });
  k.ph('bedding', '침구');
  k.rbox('매트리스', [w - 2 * ps - 10, 120, L - 2 * ps - 20], [0, by + 60, 0], 30, { role: 'mattress', opt: true, ex: [0, 1, 0] });
  k.rbox('베개', [480, 100, 330], [0, by + 150, -L / 2 + 290], 44, { role: 'pillow', opt: true, crown: [0, 0, 0, 22, 0, 0], ex: [0, 1.6, 0] });
  k.flow([
    ['head', '각재 프레임', '기둥 네 개를 세 층의 가로대로 연결해 직육면체 틀을 만듭니다.', '아래층 가로대부터 붙이면 틀이 흔들리지 않습니다.'],
    ['panels', '패널 붙이기', '위쪽 테두리에 얇은 패널을 붙입니다. 사다리 자리는 비워 둡니다.', '패널 한 장만 다른 색으로 칠하면 포인트가 됩니다.'],
    ['slats', '갈빗살 깔기', '가운데 가로대 위에 갈빗살을 깝니다.', '', [0, 1, 0]],
    ['guard', '사다리', '옆면에 사다리를 붙입니다.', '', [1, 0, 0]],
    ['bedding', '매트리스', '매트리스와 베개를 올립니다.', '', [0, 1, 0]],
  ]);
}

/** 아기 침대(SNIGLAR). */
export function crib(k, s) {
  const { w, d, h } = s, pa = k.D(30), pb = k.D(44), L = d, px = w / 2 - pa / 2, pz = L / 2 - pb / 2, by = s.baseY ?? 330;
  k.ph('head', '끝판');
  k.box('기둥', [pa, h, pb], [px, h / 2, pz], { role: 'body', mx: true, mz: true });
  k.box('끝 윗대', [w - 2 * pa, 44, k.T(22)], [0, h - 22, pz], { role: 'body', mz: true });
  k.box('끝 패널', [w - 2 * pa, h - 44 - 170, k.T(5)], [0, 170 + (h - 44 - 170) / 2, pz], { role: 'front', mz: true });
  k.box('끝 아랫대', [w - 2 * pa, 44, k.T(22)], [0, 170, pz], { role: 'body', mz: true });
  k.ph('rails', '옆 난간');
  k.box('난간 윗대', [k.T(22), 40, L - 2 * pb], [px, h - 20, 0], { role: 'body', mx: true, ex: [1, 0, 0] });
  k.box('난간 아랫대', [k.T(22), 40, L - 2 * pb], [px, 190, 0], { role: 'body', mx: true, ex: [1, 0, 0] });
  for (const z of spread(s.bars ?? 13, -L / 2 + pb + 70, L / 2 - pb - 70)) k.cyl('난간 살', k.D(14) / 2, h - 40 - 210, [px, (h - 40 + 210) / 2, z], { role: 'body', mx: true, ex: [1, 0, 0] });
  k.ph('slats', '바닥');
  k.box('바닥판', [w - 2 * pa - 6, k.T(10), L - 2 * pb - 6], [0, by, 0], { role: 'slat', ex: [0, 1, 0] });
  k.ph('bedding', '침구');
  k.rbox('매트리스', [w - 2 * pa - 14, 80, L - 2 * pb - 14], [0, by + 46, 0], 22, { role: 'mattress', opt: true, ex: [0, 1, 0] });
  k.flow([
    ['head', '끝판 두 개', '기둥 사이에 윗대·아랫대를 붙이고 얇은 패널을 끼웁니다.', ''],
    ['rails', '옆 난간', '윗대와 아랫대 사이에 둥근 살을 일정한 간격으로 꽂아 난간 두 개를 만들고 끝판과 연결합니다.', '윗대·아랫대를 겹쳐 놓고 살 구멍을 한 번에 뚫으면 간격이 맞습니다.'],
    ['slats', '바닥판', '바닥판을 원하는 높이에 붙입니다.', '', [0, 1, 0]],
    ['bedding', '매트리스', '얇은 매트리스를 깝니다.', '', [0, 1, 0]],
  ]);
}

export { strut };
