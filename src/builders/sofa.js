// sofa.js — 소파·암체어.

import { stripProfile, fillet2D } from '../core/geom.js';
import { strut, spread } from './util.js';

const D2R = Math.PI / 180;

export const SOFA_FLOW = [
  ['frame', '프레임 짜기', '좌판 받침 상자, 등받이, 팔걸이 뼈대를 만들어 붙입니다.', '폼보드나 발사 블록으로 덩어리를 만들면 가볍고 다루기 쉽습니다.'],
  ['legs', '다리 달기', '프레임 아래에 다리를 붙입니다.', '다리를 프레임에 살짝 묻히면 튼튼합니다.', [0, -1, 0]],
  ['cover', '프레임에 원단 씌우기', '프레임 겉면에 원단을 팽팽하게 붙입니다.', '모서리는 원단에 가위집을 넣어 접어 넘깁니다.'],
  ['seat', '좌판 쿠션', '스펀지를 재단해 원단으로 감싼 좌판 쿠션을 올립니다.', '스펀지 윗면 모서리를 가위로 다듬으면 볼록한 쿠션이 됩니다.', [0, 1, 0]],
  ['back', '등받이 쿠션', '등받이 쿠션을 비스듬히 기대어 놓습니다.', '쿠션 안에 솜을 조금 넣으면 폭신한 느낌이 납니다.', [0, 1, 0.6]],
  ['hw', '마무리', '단추·파이핑 같은 디테일을 더합니다.', '', [0, 0, 1]],
];

/**
 * 범용 소파. 좌판 받침 + 등받이 + 팔걸이 + 쿠션.
 * arm.type: box | roll | slim | pad | none, legs.type: block | round | cone | metal | rail | skirt | none
 */
export function sofa(k, s) {
  const { w, d, h } = s;
  const lg = s.legs || { type: 'block', h: 60 }, lh = lg.type === 'none' || lg.type === 'skirt' ? (lg.h ?? 0) : lg.h ?? 60;
  const floor = lg.type === 'skirt' ? 0 : lh;
  const A = s.arm || { type: 'none' }, aw = A.type === 'none' ? 0 : A.w ?? 150, ah = A.h ?? 600;
  const sh = s.seatH ?? 430, ct = s.seatT ?? 140, bt = s.backT ?? 170, rake = s.rake ?? 6;
  const baseTop = sh - ct, iw = w - 2 * aw, fr = s.frameR ?? 26;
  const fz0 = -d / 2 + bt, sd = d / 2 - fz0;
  const fab = 'fabric', cu = s.cushionRole || 'cushion';
  const ch = s.chaise || null;
  k.ph('frame', '프레임');
  k.rbox('좌판 받침', [iw + (aw ? 8 : 0), baseTop - floor, sd - (s.baseInset ?? 0)], [0, (baseTop + floor) / 2, fz0 + (sd - (s.baseInset ?? 0)) / 2], fr * 0.6, { role: fab, stock: 'block', ex: [0, 0, 0.5] });
  const bh = h - floor - (s.backDrop ?? 0);
  k.rbox('등받이', [s.backFull === false ? iw : w - (A.type === 'roll' ? 2 * aw * 0.25 : 0), bh, bt], [0, floor + bh / 2, -d / 2 + bt / 2 + 2], fr, { role: fab, stock: 'block', rot: [-(s.frameRake ?? 0), 0, 0], ex: [0, 0, -1] });
  if (aw) {
    const ad = d - (s.backFull === false ? 0 : bt * 0.5), az = d / 2 - ad / 2;
    if (A.type === 'roll') {
      const rr = aw * 0.56;
      k.rbox('팔걸이 몸통', [aw * 0.8, ah - rr - floor, ad - 10], [w / 2 - aw * 0.5, floor + (ah - rr - floor) / 2, az], 20, { role: fab, mx: true, stock: 'block', ex: [1, 0, 0] });
      k.cyl('팔걸이 롤', rr, ad - 6, [w / 2 - rr, ah - rr, az + 2], { axis: 'z', role: fab, mx: true, bevel: rr * 0.3, stock: 'foam', ex: [1, 0.4, 0] });
    } else {
      const r = A.type === 'slim' ? Math.min(aw * 0.45, 38) : A.r ?? 30;
      k.rbox('팔걸이', [aw, ah - floor, ad], [w / 2 - aw / 2, floor + (ah - floor) / 2, az], r, { role: fab, mx: true, stock: 'block', crown: A.type === 'pad' ? [0, 0, 0, 8, 0, 0] : null, ex: [1, 0, 0] });
    }
  }
  if (ch) {
    const cw = ch.w ?? iw / (s.seats || 3), cx = (ch.side === 'l' ? -1 : 1) * (iw / 2 - cw / 2), len = ch.len - d;
    k.rbox('카우치 받침', [cw + (aw ? 4 : 0), baseTop - floor, len], [cx, (baseTop + floor) / 2, d / 2 + len / 2 - 2], fr * 0.6, { role: fab, stock: 'block', ex: [0, 0, 1] });
  }
  // 다리
  k.ph('legs', '다리');
  if (lg.type === 'skirt') {
    // 커버가 바닥까지 내려오므로 다리가 보이지 않는다.
  } else if (lg.type !== 'none' && lh > 0) {
    const ix = lg.inset ?? 60, lxs = [w / 2 - ix], lzs = [d / 2 - ix - (s.baseInset ?? 0), -d / 2 + ix];
    if (w > 1500 && lg.mid !== false) lxs.push(0);
    const one = (x, z, mx) => {
      const o = { role: lg.role || 'leg', mx, ex: [0, -1, 0] };
      if (lg.type === 'round') k.cyl('다리', (lg.sec ?? 44) / 2, lh, [x, lh / 2, z], o);
      else if (lg.type === 'cone') k.cyl('다리', (lg.sec ?? 44) * 0.3, lh, [x, lh / 2, z], { ...o, r2: (lg.sec ?? 44) / 2 });
      else if (lg.type === 'metal') strut(k, '다리', [x + (mx ? 14 : 0), 0, z + Math.sign(z) * 14], [x, lh, z], [lg.sec ?? 22, lg.sec ?? 22], { ...o, round: true });
      else k.box('다리', [lg.sec ?? 60, lh, lg.sec ?? 60], [x, lh / 2, z], o);
    };
    if (lg.type === 'rail') {
      for (const z of lzs) k.tube('다리 레일', [[w / 2 - ix, floor, z], [w / 2 - ix - 30, 0, z], [-w / 2 + ix + 30, 0, z], [-w / 2 + ix, floor, z]], (lg.sec ?? 18) / 2, { corner: 26, role: lg.role || 'leg', ex: [0, -1, 0] });
    } else {
      for (const z of lzs) for (const x of lxs) one(x, z, x !== 0);
      if (ch) { const cx = (ch.side === 'l' ? -1 : 1) * (iw / 2 - 60); one(cx, ch.len - d / 2 - ix, false); one(cx - (ch.side === 'l' ? -1 : 1) * ((ch.w ?? iw / 3) - 120), ch.len - d / 2 - ix, false); }
    }
  }
  // 쿠션
  const n = s.seats || 2, bn = s.backCushions ?? n, cg = 6;
  const bct = s.backCushT ?? 170, seatD = sd - (s.backCushions === 0 ? 0 : bct * 0.35) + (s.seatOver ?? 14);
  k.ph('seat', '좌판 쿠션');
  if (s.seatCushions !== 0) {
    const sn = s.seatCushions ?? n, cw = (iw - (sn - 1) * cg) / sn;
    for (let i = 0; i < sn; i++) {
      const x = -iw / 2 + cw / 2 + i * (cw + cg);
      const onCh = ch && ((ch.side === 'l' && i === 0) || (ch.side !== 'l' && i === sn - 1));
      const cd = onCh ? ch.len - bt - (bct * 0.35) + 10 : seatD;
      k.rbox(onCh ? '카우치 쿠션' : '좌판 쿠션', [cw, ct, cd], [x, baseTop + ct / 2, d / 2 + (s.seatOver ?? 14) - seatD + (onCh ? cd - seatD : 0) + seatD - cd / 2], s.cushR ?? 34, { role: cu, crown: [0, 0, 0, s.crown ?? 14, 0, 4], ex: [0, 1, 0] });
    }
  }
  k.ph('back', '등받이 쿠션');
  if (bn > 0) {
    const cw = (iw - (bn - 1) * cg) / bn, bch = s.backCushH ?? Math.min(h - sh + 20, 460), lean = s.cushRake ?? 13;
    for (let i = 0; i < bn; i++) {
      const x = -iw / 2 + cw / 2 + i * (cw + cg), y = sh + bch / 2 - 14;
      k.rbox('등받이 쿠션', [cw, bch, bct], [x, y, fz0 + bct / 2 - (bch / 2) * Math.tan(lean * D2R) * 0.2 + 6], s.backR ?? 46, { role: cu, rot: [-lean, 0, 0], crown: [0, 0, 0, 10, 0, s.backCrown ?? 26], ex: [0, 1, 0.6] });
    }
  }
  if (s.extra) s.extra(k, { baseTop, floor, iw, aw, sh, fz0, sd });
  k.flow(SOFA_FLOW);
}

/** 곡목 캔틸레버 암체어(POÄNG). */
export function poang(k, s) {
  const { w, d, h } = s, ft = k.T(30), fw = k.D(62), fx = w / 2 - fw / 2;
  const sh = 400; // 좌판 앞 높이
  // 옆 프레임 중심선 (z, y): 팔걸이 뒤 → 앞 → 아래로 휘어 바닥 → 뒤로
  const c = [[-d * 0.22, 560], [d * 0.36, 590], [d * 0.5 - 16, 330], [d * 0.38, ft / 2], [-d / 2 + 16, ft / 2 + 6]];
  k.ph('sides', '곡목 프레임');
  k.ext('옆 프레임', stripProfile(c, ft, 150, 10), fw, 'zy', [fx, 0, 0], { role: 'frame', mx: true, ex: [1, 0, 0], note: '얇은 무늬목 여러 겹을 휨 지그에 붙이거나 3mm 합판에서 윤곽대로 오려 냄' });
  // 좌판·등받이 레일 (한 줄로 이어진 S 곡선)
  const sc = [[d * 0.38, sh - 30], [d * 0.3, sh - 60], [-d * 0.16, sh - 150], [-d * 0.2, sh + 10], [-d / 2 + 60, h - 30]];
  const rx = w / 2 - fw - 26;
  k.ph('seatframe', '좌판 프레임');
  k.ext('좌판·등받이 레일', stripProfile(sc, k.T(24), 110, 10), k.D(34), 'zy', [rx, 0, 0], { role: 'frame', mx: true, ex: [0.5, 0.6, 0] });
  const seg = fillet2D(sc, 110, 10);
  const at = (t) => { const i = Math.min(seg.length - 2, Math.floor(t * (seg.length - 1))), f = t * (seg.length - 1) - i; return [seg[i][0] + (seg[i + 1][0] - seg[i][0]) * f, seg[i][1] + (seg[i + 1][1] - seg[i][1]) * f, Math.atan2(seg[i + 1][1] - seg[i][1], seg[i + 1][0] - seg[i][0])]; };
  for (const t of [0.04, 0.2, 0.36, 0.6, 0.72, 0.84, 0.96]) {
    const [z, y, a] = at(t);
    k.box('가로 살', [2 * rx - 34, k.T(12), 56], [0, y, z], { role: 'frame', rot: [-(a / D2R), 0, 0], ex: [0, 0.6, 0], phase: 'seatframe' });
  }
  k.ph('cross', '가로대');
  k.box('앞 가로대', [2 * fx - fw + 4, 50, k.T(22)], [0, 330, d * 0.4], { role: 'frame', rot: [-18, 0, 0] });
  k.box('뒤 가로대', [2 * fx - fw + 4, 50, k.T(22)], [0, 548, -d * 0.19], { role: 'frame' });
  k.box('바닥 가로대', [2 * fx - fw + 4, k.T(22), 50], [0, ft + 4, -d / 2 + 90], { role: 'frame' });
  // 쿠션: 좌판 → 등 → 머리
  k.ph('seat', '쿠션');
  const pad = (name, t0, t1, th) => {
    // 레일 진행 방향의 오른쪽 법선(앉는 사람 쪽)으로 쿠션을 띄운다.
    const [z0, y0] = at(t0), [z1, y1] = at(t1), dz = z1 - z0, dy = y1 - y0, len = Math.hypot(dz, dy), a = Math.atan2(dy, dz);
    const off = 12 + th / 2 + 4, nz = dy / len, ny = -dz / len;
    k.rbox(name, [2 * rx + 30, th, len], [0, (y0 + y1) / 2 + ny * off, (z0 + z1) / 2 + nz * off], 30, { role: 'cushion', rot: [180 - a / D2R, 0, 0], crown: [0, 0, 0, 10, 0, 0], ex: [0, 1, 0.5] });
  };
  pad('좌판 쿠션', 0.02, 0.4, 78);
  pad('등 쿠션', 0.56, 0.86, 78);
  pad('머리 쿠션', 0.86, 1, 96);
  k.flow([
    ['sides', '곡목 옆 프레임', 'C자 옆 프레임 두 개를 만듭니다. 실물처럼 얇은 판을 겹쳐 휘거나, 합판에서 윤곽대로 오려 냅니다.', '휨 지그는 폼보드를 도면 곡선대로 잘라 만듭니다.'],
    ['seatframe', '좌판 프레임', 'S자 레일 두 개 사이에 가로 살을 사다리처럼 붙입니다.', '레일을 도면 위에 고정해 놓고 살을 붙이세요.'],
    ['cross', '가로대로 연결', '옆 프레임 사이에 가로대 세 개를 붙이고, 그 위에 좌판 프레임을 얹습니다.', '앞 가로대와 뒤 가로대가 좌판 프레임을 받칩니다.'],
    ['seat', '쿠션 얹기', '긴 쿠션 하나를 좌판·등·머리 세 구획으로 누벼 얹습니다.', '원단 안에 얇은 솜을 넣고 구획마다 한 줄씩 박음질하세요.', [0, 1, 0.5]],
  ]);
}

/** 윙체어(STRANDMON). */
export function wingChair(k, s) {
  const { w, d, h } = s, lh = 190, sh = 450, aw = 150, bt = 170, ah = 640, iw = w - 2 * aw + 30;
  k.ph('frame', '프레임');
  k.rbox('좌판 받침', [w - 60, sh - 130 - lh, d - 150], [0, lh + (sh - 130 - lh) / 2, 20], 26, { role: 'fabric', stock: 'block' });
  k.rbox('등받이', [w - 150, h - lh - 8, bt], [0, lh + (h - lh - 8) / 2, -d / 2 + bt / 2 + 78], 60, { role: 'fabric', rot: [-9, 0, 0], stock: 'block', crown: [0, 0, 0, 0, 0, 14], ex: [0, 0.3, -1] });
  k.rbox('팔걸이', [aw, ah - lh, d - 150], [w / 2 - aw / 2 - 20, lh + (ah - lh) / 2, 62], 58, { role: 'fabric', mx: true, stock: 'block', rot: [0, 0, 5], crown: [0, 20, 0, 0, 0, 0], ex: [1, 0, 0] });
  const wing = [[-d / 2 + 70, ah - 60], [-d / 2 + 290, ah - 40], [-d / 2 + 340, ah + 130], [-d / 2 + 270, h - 130], [-d / 2 + 140, h - 46], [-d / 2 + 20, h - 70]];
  k.ext('날개', fillet2D([...wing, wing[0]], 70, 6).slice(0, -1), 96, 'zy', [w / 2 - 96, 0, 0], { role: 'fabric', mx: true, rot: [0, 0, 0], stock: 'block', bevel: 30, ex: [1, 0.4, 0] });
  k.ph('legs', '다리');
  k.cyl('앞다리', 16, lh, [w / 2 - 110, lh / 2, d / 2 - 130], { r2: 26, role: 'leg', mx: true, ex: [0, -1, 0] });
  strut(k, '뒷다리', [w / 2 - 110, 0, -d / 2 + 40], [w / 2 - 120, lh, -d / 2 + 150], [40, 40], { round: true, role: 'leg', mx: true, ex: [0, -1, 0] });
  k.ph('seat', '좌판 쿠션');
  k.rbox('좌판 쿠션', [iw, 130, d - 250], [0, sh - 65, 96], 40, { role: 'cushion', crown: [0, 0, 0, 16, 0, 8], ex: [0, 1, 0] });
  k.flow([
    ['frame', '프레임 덩어리', '좌판 받침, 높은 등받이, 팔걸이, 날개를 블록으로 깎아 붙입니다.', '날개는 도안대로 오린 뒤 가장자리를 둥글게 갈아 냅니다.'],
    ['legs', '다리', '앞다리는 아래로 가늘게, 뒷다리는 뒤로 벌어지게 붙입니다.', '', [0, -1, 0]],
    ['cover', '원단 씌우기', '덩어리마다 원단을 씌운 뒤 조립하면 이음매가 깔끔합니다.', ''],
    ['seat', '좌판 쿠션', '두툼한 좌판 쿠션을 올립니다.', '', [0, 1, 0]],
  ]);
}

/** 목재 프레임 암체어(EKENÄSET). */
export function frameArmchair(k, s) {
  const { w, d, h } = s, sh = 400, ls = k.D(40), lx = w / 2 - ls / 2, zf = d / 2 - ls / 2 - 30, zr = -d / 2 + ls / 2 + 70, armY = 570;
  k.ph('legs', '다리');
  strut(k, '앞다리', [lx, 0, zf + 18], [lx, armY - 12, zf - 6], [ls * 0.9, ls * 0.9], { round: true, role: 'frame', mx: true, ex: [1, 0, 0.3] });
  strut(k, '뒷다리', [lx, 0, zr - 46], [lx, armY - 12, zr + 10], [ls * 0.9, ls * 0.9], { round: true, role: 'frame', mx: true, ex: [1, 0, -0.3] });
  k.ph('frame', '프레임');
  k.ext('팔걸이', stripProfile([[zr - 30, armY + 4], [zf * 0.2, armY], [zf + 34, armY - 8]], k.T(24), 40, 5), 62, 'zy', [lx - 4, 0, 0], { role: 'frame', mx: true, ex: [1, 0.5, 0] });
  k.box('옆 가로대', [k.T(22), 50, zf - zr - ls * 0.5], [lx - 6, sh - 150, (zf + zr) / 2], { role: 'frame', mx: true });
  k.box('앞 가로대', [2 * lx - ls, 50, k.T(22)], [0, sh - 150, zf - 4], { role: 'frame' });
  k.box('뒤 가로대', [2 * lx - ls, 50, k.T(22)], [0, sh - 150, zr + 4], { role: 'frame' });
  k.box('좌판 받침판', [2 * lx - ls - 8, k.T(12), zf - zr + 20], [0, sh - 120, (zf + zr) / 2], { role: 'frame' });
  k.box('등받이 받침판', [2 * lx - ls - 8, h - sh + 60, k.T(12)], [0, sh - 60 + (h - sh + 60) / 2, zr - 40], { role: 'frame', rot: [-14, 0, 0], ex: [0, 0.3, -1] });
  k.ph('seat', '쿠션');
  k.rbox('좌판 쿠션', [2 * lx - ls - 14, 120, zf - zr + 40], [0, sh - 56, (zf + zr) / 2 + 26], 36, { role: 'cushion', crown: [0, 0, 0, 14, 0, 6], ex: [0, 1, 0] });
  k.ph('back', '쿠션');
  k.rbox('등받이 쿠션', [2 * lx - ls - 14, h - sh + 10, 120], [0, sh + (h - sh + 10) / 2 - 6, zr + 36], 40, { role: 'cushion', rot: [-14, 0, 0], crown: [0, 0, 0, 8, 0, 18], ex: [0, 1, 0.6] });
  k.flow([
    ['legs', '다리 깎기', '둥근 다리 네 개를 아래로 갈수록 가늘게 깎습니다.', ''],
    ['frame', '프레임 조립', '다리 사이에 가로대를 붙이고 팔걸이를 얹은 뒤, 좌판·등받이 받침판을 붙입니다.', '팔걸이 앞 끝을 둥글게 다듬으면 미드센추리 느낌이 납니다.'],
    ['seat', '좌판 쿠션', '두툼한 좌판 쿠션을 얹습니다.', '', [0, 1, 0]],
    ['back', '등받이 쿠션', '등받이 쿠션을 비스듬히 세웁니다.', '', [0, 1, 0.6]],
  ]);
}

export { spread };
