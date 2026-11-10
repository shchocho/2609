// shelf.js — 선반류: 기둥+선반 구조, 큐브 선반, 벽선반.

import { roundedRect } from '../core/geom.js';
import { spread } from './util.js';

const FRAME_FLOW = [
  ['sides', '옆 프레임 만들기', '기둥 두 개 사이에 가로대를 붙여 사다리 모양 옆 프레임을 두 개 만듭니다.', '두 프레임을 겹쳐 놓고 가로대 높이가 같은지 확인하세요.'],
  ['rails', '프레임 연결', '앞뒤 가로대로 두 옆 프레임을 연결합니다.', '평평한 바닥에 세워 네 기둥이 모두 닿는지 봅니다.'],
  ['shelf', '선반 올리기', '선반을 아래부터 차례로 올려 붙입니다.', '같은 높이의 스페이서 블록을 끼우면 선반 간격이 일정해집니다.', [0, 0, 1]],
  ['brace', '보강대 달기', '뒤쪽에 X자 보강대를 붙여 좌우 흔들림을 잡습니다.', '얇은 철사나 0.5mm 판을 띠로 잘라 씁니다.', [0, 0, -1]],
  ['hw', '마무리 부품', '발과 작은 부품을 붙입니다.', '', [0, -1, 0]],
];

/** 기둥 4개 + 선반 구조(IVAR, HEJNE, BROR, HYLLIS, VITTSJÖ, FJÄLLBO). */
export function frameShelf(k, s) {
  const { w, d, h } = s;
  const pa = k.D(s.post.a), pb = k.D(s.post.b ?? s.post.a), prole = s.post.role || 'frame';
  const px = w / 2 - pa / 2, pz = d / 2 - pb / 2;
  k.ph('sides', '프레임');
  for (const z of [pz, -pz]) k.box('기둥', [pa, h, pb], [px, h / 2, z], { role: prole, mx: true, ex: [1, 0, 0] });
  const rs = s.rung || {};
  for (const y of s.rungs || []) {
    k.box('옆 가로대', [k.D(rs.t ?? pa * 0.6), k.D(rs.h ?? 40), d - 2 * pb], [px, y, 0], { role: prole, mx: true, ex: [1, 0, 0] });
  }
  if (s.sidePanel) {
    const sp = s.sidePanel;
    k.box('옆 그물판', [3, sp.y1 - sp.y0, d - 2 * pb], [px, (sp.y0 + sp.y1) / 2, 0], { role: sp.role || 'mesh', mx: true, ex: [1, 0, 0] });
  }
  k.ph('rails', '프레임');
  const rl = s.rail || {};
  for (const y of s.rails || []) {
    for (const z of rl.frontOnly ? [pz] : rl.backOnly ? [-pz] : [pz, -pz]) {
      k.box('가로대', [w - 2 * pa, k.D(rl.h ?? pb), k.D(rl.t ?? pb)], [0, y, z], { role: prole, ex: [0, 0, Math.sign(z)] });
    }
  }
  k.ph('shelf', '선반');
  for (const sh of s.shelves) {
    const t = sh.type === 'glass' ? (sh.t ?? 5) : k.T(sh.t ?? 18);
    const sw = sh.w ?? w - 2 * pa - (sh.gap ?? 2), sd = sh.d ?? d - (sh.inset ?? 0);
    const y = sh.y + t / 2;
    if (sh.type === 'slat') {
      const n = sh.n || 3, slw = sh.slatW ?? (sd / n) * 0.8;
      for (const z of spread(n, -sd / 2 + slw / 2, sd / 2 - slw / 2)) k.box('선반 살', [w - 2, t, slw], [0, y, z], { role: sh.role || 'body' });
    } else if (sh.type === 'tray') {
      k.box('선반', [sh.full ? w : sw, t, sd], [0, y, 0], { role: sh.role || 'frame', bevel: 2 });
    } else {
      k.box(sh.type === 'glass' ? '유리 선반' : '선반', [sh.full ? w : sw, t, sd], [0, y, 0], { role: sh.type === 'glass' ? 'glass' : sh.role || 'body' });
    }
  }
  if (s.brace) {
    k.ph('brace', '보강');
    const b = s.brace, y0 = b.y0 ?? h * 0.25, y1 = b.y1 ?? h * 0.8, z = -pz - (b.wire ? 0 : pb / 2 + 4), x = px - pa / 2;
    if (b.wire) {
      k.tube('X 보강대', [[-x, y0, z - pb / 2 - 3], [x, y1, z - pb / 2 - 3]], b.r ?? 3, { role: 'metal' });
      k.tube('X 보강대', [[x, y0, z - pb / 2 - 6], [-x, y1, z - pb / 2 - 6]], b.r ?? 3, { role: 'metal' });
    } else {
      const len = Math.hypot(2 * x, y1 - y0), ang = Math.atan2(y1 - y0, 2 * x) * 180 / Math.PI;
      k.box('X 보강대', [len, k.D(b.h ?? 30), k.T(b.t ?? 8)], [0, (y0 + y1) / 2, z], { role: b.role || prole, rot: [0, 0, ang] });
      k.box('X 보강대', [len, k.D(b.h ?? 30), k.T(b.t ?? 8)], [0, (y0 + y1) / 2, z - (b.t ?? 8) - 1], { role: b.role || prole, rot: [0, 0, -ang] });
    }
  }
  if (s.feet) {
    k.ph('hw', '프레임');
    for (const z of [pz, -pz]) k.box('발', [pa + 4, s.feet, pb + 4], [px, s.feet / 2 - 0.01, z], { role: 'wheel', mx: true, ex: [0, -1, 0], bevel: 2 });
  }
  k.flow(FRAME_FLOW);
}

/** 큐브 선반(KALLAX). 두꺼운 외곽 + 얇은 내부 칸막이. */
export function cubeShelf(k, s) {
  const { w, d, h, cols, rows } = s;
  const to = k.T(s.to ?? 39), ti = k.T(s.ti ?? 16);
  const iw = w - 2 * to, ih = h - 2 * to;
  const cw = (iw - (cols - 1) * ti) / cols, ch = (ih - (rows - 1) * ti) / rows;
  k.ph('frame', '외곽');
  k.box('상·하판', [w, to, d], [0, h - to / 2, 0], { role: 'body', ex: [0, 1, 0], bevel: 1.5 });
  k.box('상·하판', [w, to, d], [0, to / 2, 0], { role: 'body', ex: [0, -1, 0], bevel: 1.5 });
  k.box('측판', [to, ih, d], [w / 2 - to / 2, h / 2, 0], { role: 'body', mx: true, ex: [1, 0, 0], bevel: 1.5 });
  k.ph('grid', '칸막이');
  for (let r = 1; r < rows; r++) k.box('가로 선반', [iw, ti, d - 2], [0, to + r * (ch + ti) - ti / 2, 0], { role: 'body', ex: [0, 0, 1] });
  for (let r = 0; r < rows; r++) for (let c = 1; c < cols; c++) {
    k.box('세로 칸막이', [ti, ch, d - 2], [-iw / 2 + c * (cw + ti) - ti / 2, to + r * (ch + ti) + ch / 2, 0], { role: 'body', ex: [0, 0, 1] });
  }
  const cell = (c, r) => [-iw / 2 + c * (cw + ti) + cw / 2, to + (rows - 1 - r) * (ch + ti) + ch / 2];
  for (const ins of s.inserts || []) {
    const [cx, cy] = cell(ins.c, ins.r);
    k.ph('insert', '인서트');
    if (ins.type === 'door') {
      k.box('인서트 문', [cw - 4, ch - 4, k.T(16)], [cx, cy, d / 2 - 12], { role: 'front', ex: [0, 0, 1] });
      k.cyl('손잡이', 9, 14, [cx + cw / 2 - 40, cy, d / 2 + 3], { axis: 'z', role: 'knob', stock: 'bead', ex: [0, 0, 1] });
    } else if (ins.type === 'drawers') {
      for (const dy of [ch / 4, -ch / 4]) {
        k.box('인서트 서랍', [cw - 4, ch / 2 - 4, k.T(16)], [cx, cy + dy, d / 2 - 12], { role: 'front', ex: [0, 0, 1] });
        k.cyl('손잡이', 9, 14, [cx, cy + dy, d / 2 + 3], { axis: 'z', role: 'knob', stock: 'bead', ex: [0, 0, 1] });
      }
    } else {
      k.rbox('패브릭 박스', [cw - 8, ch - 12, d - 20], [cx, cy - 4, 4], 14, { role: 'fabric', ex: [0, 0, 1], opt: true, stock: 'block', note: '두꺼운 종이로 상자를 접고 원단을 붙임' });
    }
  }
  k.flow([
    ['frame', '외곽 틀 짜기', '두꺼운 상·하판과 측판으로 사각 틀을 만듭니다.', '두꺼운 판은 얇은 판 두 장을 겹쳐 붙여도 됩니다.'],
    ['grid', '칸 나누기', '가로 선반을 먼저 끼우고 세로 칸막이를 칸마다 붙입니다.', '칸 크기와 같은 정사각 블록을 지그로 쓰면 간격이 정확합니다.', [0, 0, 1]],
    ['insert', '인서트 넣기', '문·서랍 인서트나 수납 박스를 원하는 칸에 넣습니다.', '', [0, 0, 1.4]],
  ]);
}

/** 정사각 수납장 조합(EKET). */
export function eket(k, s) {
  const c = s.cube ?? 350, d = s.d ?? 350, t = k.T(12), bt = k.T(3);
  const roles = s.roles || ['body', 'accent', 'accent', 'body'];
  k.ph('cube', '큐브');
  let i = 0;
  for (const cy of [c / 2, c * 1.5]) for (const cx of [-c / 2, c / 2]) {
    const role = roles[i++ % roles.length];
    k.box('측판', [t, c, d], [cx - c / 2 + t / 2, cy, 0], { role, ex: [Math.sign(cx), 0, 0] });
    k.box('측판', [t, c, d], [cx + c / 2 - t / 2, cy, 0], { role, ex: [Math.sign(cx), 0, 0] });
    k.box('상·하판', [c - 2 * t, t, d], [cx, cy + c / 2 - t / 2, 0], { role, ex: [Math.sign(cx), 0, 0] });
    k.box('상·하판', [c - 2 * t, t, d], [cx, cy - c / 2 + t / 2, 0], { role, ex: [Math.sign(cx), 0, 0] });
    k.box('뒤판', [c - t, c - t, bt], [cx, cy, -d / 2 + bt / 2 + 6], { role, phase: 'back', ex: [0, 0, -1] });
  }
  k.flow([
    ['cube', '큐브 네 개 짜기', '같은 크기의 정사각 상자를 네 개 만듭니다.', '한 개를 먼저 완성해 지그로 삼으면 나머지가 빨라집니다.'],
    ['back', '뒤판 붙이기', '각 큐브 안쪽에 뒤판을 살짝 들여 붙입니다.', '', [0, 0, -1]],
  ]);
}

/** 두꺼운 벽선반(LACK). */
export function wallShelf(k, s) {
  const { w, d, h } = s;
  k.ph('shelf', '선반');
  k.box('선반 몸체', [w, h, d], [0, h / 2, 0], { role: 'body', bevel: 1.5, note: '속이 빈 상자로 짜면 가볍다' });
  k.ph('bracket', '브래킷');
  k.box('숨은 브래킷', [w * 0.85, k.T(12), 4], [0, h / 2, -d / 2 - 2], { role: 'metal', ex: [0, 0, -1], opt: true });
  for (const x of spread(3, -w * 0.3, w * 0.3)) k.cyl('브래킷 핀', 5, d * 0.6, [x, h / 2, -d / 2 + d * 0.3 - 0.5], { axis: 'z', role: 'metal', ex: [0, 0, -1], opt: true, inner: true });
  k.flow([
    ['shelf', '선반 만들기', '두꺼운 선반 몸체를 만듭니다. 얇은 판으로 속 빈 상자를 짜도 좋습니다.', '모서리를 사포로 살짝 굴리면 실물 느낌이 납니다.'],
    ['bracket', '브래킷 달기', '벽에 붙일 때는 뒷면에 핀을 꽂아 고정합니다.', '', [0, 0, -1]],
  ]);
}

/** 페그보드(SKÅDIS). */
export function pegboard(k, s) {
  const { w, h } = s, t = k.T(5), y0 = 0;
  k.ph('board', '보드');
  k.ext('타공 보드', roundedRect(w, h, 14), t, 'xy', [0, y0 + h / 2, 0], { role: 'pegboard', note: '5mm 간격 슬롯은 송곳으로 찍거나 인쇄 도안을 붙임' });
  k.ph('mount', '고정');
  for (const x of [w / 2 - 40, -w / 2 + 40]) for (const y of [h - 40, 40]) k.cyl('스페이서', 9, 14, [x, y0 + y, -t / 2 - 7], { axis: 'z', role: 'plastic', ex: [0, 0, -1] });
  k.ph('acc', '액세서리');
  k.box('선반', [200, 6, 70], [-w / 2 + 130, y0 + h * 0.3, t / 2 + 35], { role: 'plastic', ex: [0, 0, 1] });
  k.box('선반 턱', [200, 22, 4], [-w / 2 + 130, y0 + h * 0.3 + 11, t / 2 + 68], { role: 'plastic', ex: [0, 0, 1] });
  for (const x of [w / 2 - 90, w / 2 - 170]) {
    k.lathe('수납 컵', [[0, 0], [36, 0], [40, 90], [37, 90], [33.5, 4], [0, 4]], [x, y0 + h * 0.52, t / 2 + 44], { role: 'plastic', ex: [0, 0, 1], stock: 'cone' });
  }
  for (const x of spread(4, -w / 2 + 70, -w / 2 + 250)) {
    k.tube('후크', [[x, y0 + h * 0.78, t / 2], [x, y0 + h * 0.78, t / 2 + 34], [x, y0 + h * 0.78 + 14, t / 2 + 40]], 2.5, { corner: 8, role: 'plastic', ex: [0, 0, 1] });
  }
  k.box('클립', [36, 44, 10], [w / 2 - 60, y0 + h * 0.84, t / 2 + 5], { role: 'plastic', ex: [0, 0, 1], bevel: 3 });
  k.flow([
    ['board', '보드 재단', '모서리가 둥근 정사각 보드를 자릅니다.', '타공 무늬는 도안을 인쇄해 붙이면 가장 깔끔합니다.'],
    ['mount', '스페이서 붙이기', '뒷면 네 귀퉁이에 스페이서를 붙여 벽에서 띄웁니다.', '', [0, 0, -1]],
    ['acc', '액세서리 걸기', '선반·컵·후크를 원하는 자리에 붙입니다.', '후크는 0.5mm 철사를 구부려 만듭니다.', [0, 0, 1]],
  ]);
}
