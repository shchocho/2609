// rooms.js — 3D 쇼룸의 룸 세트. 방 16개의 크기·마감·가구 100개의 자리·소품을 정한다.
// three.js 를 쓰지 않는 순수 데이터·기하라서 Node 에서 배치(겹침·벽 밖)를 검사할 수 있다.
// 방 좌표: x = 0…w(왼쪽→오른쪽), z = 0(뒷벽)…d(열린 앞쪽), 단위 mm.

import { Kit, buildModel } from '../core/kit.js';
import { getItem } from './catalog.js';
import { materialOf } from './materials.js';
import * as PR from '../builders/props.js';

export const WALL_T = 60, WALL_H = 2400, FLOOR_T = 40;
const GAP = 12, D2R = Math.PI / 180;
const { pick } = PR;

const models = new Map();
/** 기본 사양 모델(캐시). 배치와 쇼룸 메시가 같은 모델을 쓴다. */
export function modelOf(it) { let m = models.get(it.id); if (!m) { m = buildModel(it, { N: 12 }); models.set(it.id, m); } return m; }

const rot = (x, z, yaw) => { const c = Math.cos(yaw * D2R), s = Math.sin(yaw * D2R); return [x * c + z * s, -x * s + z * c]; };
const corners = (bb, yaw) => [[bb.min[0], bb.min[2]], [bb.max[0], bb.min[2]], [bb.max[0], bb.max[2]], [bb.min[0], bb.max[2]]].map(([x, z]) => rot(x, z, yaw));
const P = (mat, o) => ({ role: 'prop', mat, phase: 'prop', group: '소품', lo: true, ...o });

class Room {
  constructor(def) {
    Object.assign(this, { H: WALL_H, walls: { back: 'wall-white', left: 'wall-white', right: 'wall-white' }, floor: 'floor-oak' }, def);
    this.places = []; this.byId = new Map();
    this.k = { base: new Kit(), back: new Kit(), left: new Kit(), right: new Kit() };
    this.R = PR.rng(PR.hashStr(def.id));
  }

  // ── 가구 놓기
  _add(id, x, z, yaw, o = {}) {
    const it = getItem(id);
    if (!it) throw new Error(`rooms: 없는 품목 ${id}`);
    if (this.byId.has(id)) throw new Error(`rooms: ${id} 중복`);
    const m = modelOf(it), fp = corners(m.bbox, yaw).map(([fx, fz]) => [fx + x, fz + z]);
    const p = { it, id, x, y: o.y || 0, z, yaw, fin: o.fin || 0, on: o.on || null, under: o.under || null, hung: !!o.hung, fp, h: m.bbox.max[1], avoid: null, throws: o.throws || null, seed: o.seed || 0 };
    this.places.push(p); this.byId.set(id, p);
    return p;
  }
  /** 발자국 중심을 (cx, cz)에 둔다. */
  put(id, cx, cz, yaw = 0, o) {
    const b = modelOf(getItem(id)).bbox, [dx, dz] = rot((b.min[0] + b.max[0]) / 2, (b.min[2] + b.max[2]) / 2, yaw);
    return this._add(id, cx - dx, cz - dz, yaw, o);
  }
  /** yaw 만큼 돌린 뒤 발자국이 벽에 닿게 놓는다. c = 벽을 따라 잰 발자국 중심. */
  snap(wall, id, c, yaw, o = {}) {
    const fp = corners(modelOf(getItem(id)).bbox, yaw), xs = fp.map((q) => q[0]), zs = fp.map((q) => q[1]), g = o.gap ?? GAP;
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    if (wall === 'back') return this._add(id, c - (x0 + x1) / 2, g - z0, yaw, o);
    if (wall === 'left') return this._add(id, g - x0, c - (z0 + z1) / 2, yaw, o);
    return this._add(id, this.w - g - x1, c - (z0 + z1) / 2, yaw, o);
  }
  back(id, cx, o) { return this.snap('back', id, cx, 0, o); }
  left(id, cz, o) { return this.snap('left', id, cz, 90, o); }
  right(id, cz, o) { return this.snap('right', id, cz, -90, o); }
  /** 벽에 건다(벽선반·페그보드·벽 큐브). y = 아랫면 높이. */
  hang(wall, id, c, y, o = {}) { return this.snap(wall, id, c, wall === 'back' ? 0 : wall === 'left' ? 90 : -90, { ...o, y, gap: 0, hung: true }); }
  /** 다른 가구 위에 올린다. dx, dz = 받침 가구 중심에서의 위치(받침 가구 기준 방향). */
  on(id, baseId, o = {}) {
    const a = this.byId.get(baseId);
    if (!a) throw new Error(`rooms: ${id} 를 올릴 ${baseId} 가 없음`);
    const ab = modelOf(a.it).bbox, b = modelOf(getItem(id)).bbox, lx = (ab.min[0] + ab.max[0]) / 2 + (o.dx || 0), lz = (ab.min[2] + ab.max[2]) / 2 + (o.dz || 0);
    const [wx, wz] = rot(lx, lz, a.yaw), yaw = a.yaw + (o.yaw || 0), [cx, cz] = rot((b.min[0] + b.max[0]) / 2, (b.min[2] + b.max[2]) / 2, yaw);
    const hw = (b.max[0] - b.min[0]) / 2 + 40;
    a.avoid = [lx - hw, lx + hw]; // 받침 가구의 상판 소품은 이 구간을 비운다
    return this._add(id, a.x + wx - cx, a.z + wz - cz, yaw, { ...o, y: a.y + (o.top ?? ab.max[1]), on: baseId });
  }

  // ── 소품
  deco(x, z, yaw, fn) { this.k.base.at([x, 0, z], yaw, () => fn(this.k.base, this.R)); return this; }
  onWall(wall, c, y, fn) {
    const k = this.k[wall], fr = wall === 'back' ? [[c, y, 0], 0] : wall === 'left' ? [[0, y, c], 90] : [[this.w, y, c], -90];
    k.at(fr[0], fr[1], () => fn(k, this.R));
    return this;
  }
  rug(x, z, w, d, kind = 'border', a = 'fab-natural', b = 'fab-cream', yaw = 0) { return this.deco(x, z, yaw, (k) => PR.rug(k, { w, d, kind, a, b })); }
  plant(x, z, kind = 'rubber', s = 1, potMat = 'terracotta') { return this.deco(x, z, this.R() * 360, (k, R) => PR.plant(k, { kind, s, potMat, R })); }
  /** 액자 모음. list = [[dx, dy, w, h, kind?], …] */
  art(wall, c, cy, list, frameMat = 'black') {
    for (const [dx, dy, w, h, kind] of list) this.onWall(wall, c + (wall === 'left' ? -dx : dx), cy + dy, (k, R) => PR.frame(k, { w, h, kind, R, frameMat: Array.isArray(frameMat) ? pick(R, frameMat) : frameMat }));
    return this;
  }
  window(wall, c, { w = 1200, h = 1300, sill = 880, curtain = 'linen' } = {}) {
    this.onWall(wall, c, 0, (k) => PR.windowUnit(k, { w, h, sill }));
    if (curtain) {
      const ch = Math.min(this.H - 150, sill + h + 130);
      this.onWall(wall, c - w / 2 - 250, 0, (k) => PR.curtain(k, { w: 520, h: ch, mat: curtain, rod: 0 }));
      this.onWall(wall, c + w / 2 + 250, 0, (k) => PR.curtain(k, { w: 520, h: ch, mat: curtain, rod: 0 }));
      this.onWall(wall, c, 30 + ch + 28, (k) => k.cyl('커튼 봉', 11, w + 1160, [0, 0, 62], P('blackmetal', { axis: 'x' })));
    }
    return this;
  }
  lamp(x, z, o = {}) { return this.deco(x, z, 0, (k) => PR.lampFloor(k, o)); }
  pouf(x, z, mat = 'fab-ochre', r = 240, h = 340) { return this.deco(x, z, 0, (k) => PR.pouf(k, { r, h, mat })); }
  basket(x, z, fill = 'fab-cream', r = 190) { return this.deco(x, z, 0, (k) => PR.basket(k, { r, h: r * 1.4, fill })); }

  /** 벽·바닥·걸레받이 부품. */
  shell() {
    const k = new Kit(), { w, d, H } = this, T = WALL_T;
    const floor = k.box('바닥', [w + 2 * T, FLOOR_T, d + T], [w / 2, -FLOOR_T / 2, (d - T) / 2], P(this.floor, { grain: 'x', bevel: 0, lo: false }))[0];
    const walls = {
      back: k.box('뒷벽', [w + 2 * T, H, T], [w / 2, H / 2, -T / 2], P(this.walls.back, { bevel: 0, lo: false }))[0],
      left: k.box('왼쪽 벽', [T, H, d], [-T / 2, H / 2, d / 2], P(this.walls.left, { bevel: 0, lo: false }))[0],
      right: k.box('오른쪽 벽', [T, H, d], [w + T / 2, H / 2, d / 2], P(this.walls.right, { bevel: 0, lo: false }))[0],
    };
    this.onWall('back', w / 2, 0, (kk) => PR.baseboard(kk, { w }));
    this.onWall('left', d / 2, 0, (kk) => PR.baseboard(kk, { w: d }));
    this.onWall('right', d / 2, 0, (kk) => PR.baseboard(kk, { w: d }));
    return { floor, walls };
  }
}

// ───────────────────────────────────────────── 방 정의
const DEFS = [
  // 1열(앞): 거실
  { id: 'living-green', name: '거실 · 초록 소파', w: 5600, d: 3900, floor: 'floor-oak', walls: { back: 'wall-white', left: 'wall-white', right: 'wall-sage' }, build(r) {
    r.back('billy', 620, { fin: 1 });
    r.back('vimle', 2750, { fin: 2 });
    r.hang('back', 'eket', 2080, 1340, { fin: 3 });
    r.back('hektar', 4350, { fin: 1 });
    r.put('lack-coffee', 2750, 1830, 0, { fin: 2 });
    r.put('poang', 4560, 2200, -42, { fin: 2 });
    r.put('lack-side', 5060, 1060);
    r.on('fado', 'lack-side');
    r.rug(2750, 1850, 3300, 2300, 'stripe', 'fab-cream', 'fab-ochre');
    r.plant(1290, 420, 'rubber', 1, 'ceramic').plant(470, 3350, 'monstera', 1, 'basket');
    r.window('left', 2350, { w: 1300 });
    r.art('back', 3270, 1640, [[-330, 20, 420, 560, 'leaf'], [150, 150, 300, 300, 'sun'], [150, -190, 300, 300, 'dots']], ['oak', 'black']);
    r.art('right', 2500, 1550, [[0, 0, 700, 950, 'arch']], 'oak');
    r.pouf(1380, 2550, 'fab-terracotta');
  } },
  { id: 'living-media', name: '거실 · TV 월', w: 5600, d: 4200, floor: 'floor-light', walls: { back: 'wall-white', left: 'wall-greige', right: 'wall-white' }, build(r) {
    r.back('hemnes-bookcase', 700, { fin: 1 });
    r.back('lersta', 1620);
    r.back('hemnes-tv', 2800, { fin: 1 });
    r.right('soderhamn', 2800, { fin: 1 });
    r.put('lovbacken', 4050, 2800, 90);
    r.put('ekenaset', 1250, 2550, 50);
    r.rug(2800, 2500, 2800, 2000, 'check', 'fab-cream', 'fab-charcoal');
    r.pouf(2350, 2350, 'jute', 300, 320);
    r.plant(4250, 520, 'monstera', 1.05, 'basket').plant(5250, 800, 'snake', 0.9, 'ceramic-black');
    r.art('back', 4500, 1560, [[-250, 0, 420, 580, 'leaf'], [250, 0, 420, 580, 'leaf']], 'black');
    r.window('left', 2500, { w: 1200, curtain: 'fab-blush' });
    r.basket(620, 3600, 'fab-ochre');
  } },
  { id: 'living-classic', name: '거실 · 클래식', w: 6000, d: 3900, floor: 'floor-parquet', walls: { back: 'wall-greige', left: 'wall-greige', right: 'wall-greige' }, build(r) {
    r.back('detolf', 520, { fin: 1 });
    r.back('holmo', 1110);
    r.back('ektorp', 2750);
    r.right('besta', 2300, { fin: 1 });
    r.put('hemnes-coffee', 2750, 1850, 0, { fin: 1 });
    r.put('strandmon', 1150, 2400, 42);
    r.rug(2750, 1900, 3400, 2400, 'border', 'fab-natural', 'fab-cream');
    r.window('left', 2500, { w: 1300, curtain: 'fab-blush' });
    r.plant(4350, 450, 'rubber', 1.05, 'ceramic-black').plant(5480, 520, 'snake', 1, 'basket');
    r.art('back', 2750, 1680, [[-620, 0, 480, 660, 'sun'], [0, 0, 480, 660, 'arch'], [620, 0, 480, 660, 'mount']], 'black');
    r.onWall('right', 2300, 1700, (k) => PR.roundMirror(k, { r: 330, frameMat: 'brass' }));
    r.basket(4700, 3300, 'fab-terracotta');
  } },
  { id: 'living-pop', name: '거실 · 컬러 팝', w: 5200, d: 3700, floor: 'floor-light', walls: { back: 'wall-white', left: 'wall-white', right: 'wall-white' }, build(r) {
    r.back('klippan', 1900, { fin: 2, throws: ['fab-blush', 'fab-pink', 'fab-teal'] });
    r.back('fabrikor', 4250);
    r.put('ekero', 3720, 2380, -38, { fin: 2 });
    r.put('gladom', 1900, 1780, 0, { fin: 2 });
    r.onWall('back', 4250, 0, (k) => PR.colorPanel(k, { w: 1400, h: 2400, mat: 'wall-mustard' }));
    r.art('back', 1900, 1520, [[-640, 40, 400, 520, 'blocks'], [-170, 190, 300, 300, 'dots'], [-170, -170, 300, 300, 'sun'], [300, 60, 420, 580, 'arch'], [760, 0, 300, 400, 'mount']], 'white');
    r.rug(1900, 1900, 2300, 2300, 'round', 'fab-charcoal', 'fab-ochre');
    r.plant(480, 480, 'snake', 1.05, 'ceramic').plant(3050, 420, 'bush', 1.3, 'ceramic-blue');
    r.window('left', 2400, { w: 1200, curtain: 'fab-ochre' });
    r.pouf(2950, 2850, 'fab-blush');
    r.art('right', 2300, 1550, [[0, 0, 640, 860, 'blocks']], 'black');
  } },
  // 2열: 라운지·원룸·다이닝
  { id: 'lounge', name: '라운지 · 가죽 소파', w: 6200, d: 4400, floor: 'floor-walnut', walls: { back: 'wall-charcoal', left: 'wall-charcoal', right: 'wall-greige' }, build(r) {
    r.back('vittsjo', 620);
    r.back('landskrona', 2900, { fin: 2 });
    r.left('kivik', 2900, { fin: 1 });
    r.back('kallax', 4950, { fin: 1 });
    r.right('fjallbo', 1500);
    r.right('lack-tv', 3200, { fin: 1 });
    r.onWall('back', 2900, 0, (k) => PR.slatPanel(k, { w: 2500, h: 2400, mat: 'walnut' }));
    r.rug(2900, 2450, 3200, 2300, 'border', 'jute', 'fab-natural');
    r.pouf(2500, 2300, 'fab-terracotta', 260, 310).pouf(3250, 2700, 'fab-charcoal', 250, 300);
    r.plant(4250, 450, 'rubber', 1.1, 'ceramic-black').plant(1500, 470, 'monstera', 1, 'basket');
    r.deco(520, 1080, 58, (k) => PR.arcLamp(k, { h: 2000, reach: 1500, shadeMat: 'shadewhite', poleMat: 'brass' }));
    r.art('left', 2900, 1620, [[-420, 0, 600, 800, 'mount'], [420, 0, 600, 800, 'sun']], 'brass');
  } },
  { id: 'studio', name: '원룸', w: 5800, d: 4000, floor: 'floor-light', walls: { back: 'wall-blush', left: 'wall-white', right: 'wall-white' }, build(r) {
    r.back('friheten', 1500, { fin: 2 });
    r.hang('back', 'lack-shelf', 1500, 1480, { fin: 2 });
    r.back('hyllis', 3300);
    r.put('ingatorp', 4350, 2800);
    r.put('terje', 4350, 1920, 0, { fin: 3 });
    r.put('kyrre', 5260, 2800, 0, { fin: 2 });
    r.put('tarno', 4720, 770, 90);
    r.rug(1650, 1750, 2800, 1900, 'stripe', 'fab-cream', 'fab-navy');
    r.lamp(2860, 420, { h: 1550 });
    r.window('right', 800, { w: 1100, curtain: 'linen' });
    r.plant(5400, 3550, 'monstera', 1, 'terracotta').plant(350, 2500, 'snake', 0.95, 'ceramic');
    r.onWall('back', 2560, 1800, (k, R) => PR.wallClock(k, { r: 150, R }));
    r.basket(2900, 2000, 'fab-navy');
  } },
  { id: 'dining-wood', name: '다이닝 · 우드', w: 6000, d: 4100, floor: 'floor-parquet', walls: { back: 'wall-white', left: 'wall-white', right: 'wall-sage' }, build(r) {
    r.put('norden', 2800, 2550, 0, { fin: 1 });
    r.put('ingolf', 2400, 1840);
    r.put('stefan', 3200, 1840);
    r.put('kaustby', 1700, 2550, 90);
    r.back('bekvam-cart', 5300);
    r.rug(2800, 2550, 3200, 2400, 'border', 'jute', 'fab-cream');
    r.deco(2800, 620, 0, (k) => PR.arcLamp(k, { h: 2050, reach: 1850, shadeMat: 'basket' }));
    r.plant(650, 560, 'monstera', 1.1, 'basket').plant(4450, 480, 'rubber', 1, 'ceramic');
    r.onWall('back', 1900, 1380, (k, R) => {
      PR.ledge(k, { w: 1400, d: 180, mat: 'oak' });
      k.at([-430, 0, 90], 0, () => PR.plant(k, { kind: 'ivy', s: 0.8, potMat: 'ceramic', R }));
      k.at([-40, 0, 80], 0, () => PR.standFrame(k, { w: 200, h: 270, R, frameMat: 'black' }));
      k.at([250, 0, 90], 0, () => PR.vase(k, { kind: 'dried', s: 0.6, mat: 'terracotta', R }));
      k.at([520, 0, 90], 0, () => PR.plant(k, { kind: 'bush', s: 0.5, potMat: 'ceramic-sage', R }));
    });
    r.onWall('back', 3800, 1800, (k, R) => PR.wallClock(k, { r: 170, R }));
    r.window('right', 2300, { w: 1400, curtain: 'linen' });
  } },
  { id: 'dining-modern', name: '다이닝 · 모던', w: 6600, d: 4300, floor: 'floor-oak', walls: { back: 'wall-green', left: 'wall-green', right: 'wall-white' }, build(r) {
    r.put('lisabo', 1950, 2450);
    r.put('henriksdal', 1600, 1700, 0, { fin: 2 });
    r.put('odger', 2300, 1730, 0, { fin: 1 });
    r.put('docksta', 4450, 2900);
    r.put('adde', 4450, 2080, 0, { fin: 1 });
    r.put('norraryd', 3600, 2900, 90);
    r.put('franklin', 5880, 900, 90);
    r.put('ingolf-bar', 5900, 1750, 90, { fin: 1 });
    r.onWall('right', 1320, 0, (k, R) => {
      PR.barShelf(k, { w: 1800, d: 420, h: 1050, mat: 'oak' });
      k.at([-600, 1050, 230], 0, () => PR.bottle(k, { mat: 'ceramic-sage' }));
      k.at([-470, 1050, 260], 0, () => PR.bottle(k, { mat: 'smoke', s: 0.9 }));
      k.at([80, 1050, 230], 0, () => PR.bowl(k, { r: 110, h: 66, fruit: 4, R }));
      k.at([620, 1050, 240], 0, () => PR.plant(k, { kind: 'bush', s: 0.5, potMat: 'terracotta', R }));
    });
    r.art('back', 1950, 1560, [[-560, 0, 420, 580, 'arch'], [-60, 130, 300, 300, 'dots'], [-60, -210, 300, 300, 'mount'], [450, 0, 420, 580, 'sun']], 'brass');
    r.deco(1950, 620, 0, (k) => PR.arcLamp(k, { h: 2050, reach: 1800, shadeMat: 'shadewhite', poleMat: 'blackmetal' }));
    r.rug(4450, 2900, 2300, 2300, 'round', 'fab-natural', 'fab-cream');
    r.plant(3350, 480, 'rubber', 1.1, 'ceramic').plant(600, 520, 'snake', 1.05, 'ceramic-black').plant(4900, 520, 'monstera', 1, 'basket');
    r.window('left', 2500, { w: 1300, curtain: 'fab-cream' });
  } },
  // 3열: 침실
  { id: 'bed-natural', name: '침실 · 내추럴', w: 5400, d: 3800, floor: 'floor-light', walls: { back: 'wall-white', left: 'wall-white', right: 'wall-greige' }, build(r) {
    r.back('pax', 620);
    r.back('malm-bed', 2700, { fin: 2 });
    r.back('frosta', 3900);
    r.on('lampan', 'frosta');
    r.back('malm-dresser', 4750, { fin: 2 });
    r.put('isfjorden', 4850, 2750, -28, { fin: 2 });
    r.onWall('back', 1470, 2180, (k) => PR.pendantArm(k, { reach: 620, drop: 380, r: 230 }));
    r.rug(2700, 2550, 2700, 1700, 'border', 'fab-natural', 'fab-cream');
    r.window('left', 2700, { w: 1300 });
    r.plant(450, 3350, 'snake', 1.05, 'basket');
    r.basket(3950, 2450, 'fab-ochre');
    r.art('back', 2700, 1680, [[-330, 0, 480, 660, 'leaf'], [330, 0, 480, 660, 'arch']], 'oak');
  } },
  { id: 'bed-classic', name: '침실 · 클래식', w: 5800, d: 3900, floor: 'floor-walnut', walls: { back: 'wall-blue', left: 'wall-white', right: 'wall-white' }, build(r) {
    r.back('hemnes-nightstand', 1450);
    r.on('arstid', 'hemnes-nightstand', { dx: -40 });
    r.back('hemnes-bed', 2700);
    r.back('brimnes-wardrobe', 4800);
    r.right('hemnes-dresser', 2650);
    r.rug(2700, 2600, 2700, 1700, 'border', 'fab-cream', 'fab-blue');
    r.window('left', 2400, { w: 1300, curtain: 'fab-cream' });
    r.plant(520, 520, 'rubber', 1.05, 'ceramic');
    r.art('back', 2700, 1820, [[-420, 0, 320, 420, 'sun'], [0, 0, 320, 420, 'leaf'], [420, 0, 320, 420, 'mount']], 'white');
    r.onWall('right', 2650, 1750, (k) => PR.roundMirror(k, { r: 320, frameMat: 'brass' }));
    r.lamp(3880, 400, { h: 1500 });
    r.basket(900, 3400, 'fab-blue');
  } },
  { id: 'bed-storage', name: '침실 · 수납', w: 5800, d: 4100, floor: 'floor-oak', walls: { back: 'wall-sage', left: 'wall-white', right: 'wall-white' }, build(r) {
    r.back('kleppstad', 560);
    r.back('rast', 1500, { fin: 2 });
    r.back('brimnes-bed', 2800);
    r.back('kullen', 4350, { fin: 2 });
    r.right('mulig', 2750, { fin: 1 });
    r.onWall('back', 3830, 2180, (k) => PR.pendantArm(k, { reach: 600, drop: 400, r: 220 }));
    r.rug(2800, 3050, 1900, 1900, 'round', 'jute', 'fab-cream');
    r.plant(5300, 560, 'monstera', 1, 'basket');
    r.window('left', 2800, { w: 1300 });
    r.art('back', 4350, 1760, [[0, 0, 420, 560, 'arch']], 'oak');
    r.basket(4500, 3100, 'fab-sage');
  } },
  { id: 'guest', name: '게스트룸', w: 7000, d: 4500, floor: 'floor-parquet', walls: { back: 'wall-terracotta', left: 'wall-white', right: 'wall-white' }, build(r) {
    r.back('sagstua', 1550);
    r.back('slattum', 4050, { fin: 2 });
    r.right('hemnes-daybed', 1750, { fin: 2 });
    r.left('tarva', 3500);
    r.lamp(2810, 420, { h: 1450 });
    r.rug(1550, 2850, 1900, 1300, 'stripe', 'fab-cream', 'fab-terracotta').rug(4050, 2850, 1900, 1300, 'stripe', 'fab-cream', 'fab-terracotta');
    r.art('back', 1550, 1930, [[0, 0, 760, 420, 'mount']], 'black').art('back', 4050, 1520, [[-300, 0, 400, 540, 'sun'], [300, 0, 400, 540, 'dots']], 'black');
    r.plant(5450, 470, 'snake', 1.05, 'ceramic');
    r.window('left', 1400, { w: 1200, curtain: 'fab-cream' });
    r.onWall('left', 3500, 1600, (k) => PR.roundMirror(k, { r: 300, frameMat: 'black' }));
  } },
  // 4열(뒤): 아이 방·작업 공간
  { id: 'play', name: '놀이방', w: 6000, d: 4100, floor: 'floor-light', walls: { back: 'wall-sky', left: 'wall-yellow', right: 'wall-white' }, build(r) {
    r.back('trofast', 720);
    r.back('duktig', 1850);
    r.snap('back', 'sniglar', 3250, 90);
    r.put('antilop', 4550, 520, -15);
    r.put('mammut-table', 1600, 2500, 0, { fin: 2 });
    r.put('mammut-chair', 950, 2500, 90);
    r.put('flisat', 3250, 2700);
    r.put('sundvik-chair', 3950, 2700, -90, { fin: 2 });
    r.put('latt', 5050, 2600);
    r.rug(2700, 2650, 3700, 2500, 'check', 'fab-cream', 'fab-sage');
    r.deco(2350, 3600, -20, (k) => PR.teddy(k, { s: 1.5, mat: 'fab-ochre' }));
    r.deco(4250, 3650, 0, (k) => PR.ball(k, { r: 110, mat: 'pl-blue' }));
    r.deco(2500, 1650, 0, (k, R) => PR.blocks(k, { R, n: 7, s: 60 }));
    r.deco(4350, 1750, 0, (k) => PR.stacker(k, { s: 1.4 }));
    r.onWall('back', 4550, 1800, (k, R) => PR.wallClock(k, { r: 160, R }));
    r.art('back', 1850, 1700, [[-250, 0, 380, 380, 'dots'], [230, 0, 380, 380, 'sun']], 'white').art('left', 2200, 1500, [[0, 0, 600, 800, 'blocks']], 'white');
    r.pouf(5350, 780, 'fab-teal', 330, 400);
    r.deco(520, 1500, 0, (k) => { PR.basket(k, { r: 210, h: 280 }); k.sph('공', 85, [40, 300, 20], P('pl-red')); k.sph('공', 70, [-70, 290, -50], P('pl-yellow')); });
  } },
  { id: 'kids-bed', name: '아이 침실', w: 6600, d: 4100, floor: 'floor-oak', walls: { back: 'wall-mint', left: 'wall-white', right: 'wall-white' }, build(r) {
    r.snap('left', 'kura', 1070, 0, { fin: 1 });
    r.snap('back', 'mydal', 2550, -90);
    r.snap('back', 'svarta', 5150, -90, { fin: 1 });
    r.put('micke', 5150, 430, 0, { under: 'svarta' });
    r.rug(3300, 2850, 3000, 1900, 'stripe', 'fab-cream', 'fab-teal');
    r.deco(2600, 2500, 0, (k) => PR.ball(k, { r: 100, mat: 'pl-yellow' }));
    r.deco(3900, 2700, 0, (k, R) => PR.blocks(k, { R, n: 6, s: 56 }));
    r.pouf(1750, 3400, 'fab-ochre', 340, 400);
    r.basket(4300, 3600, 'fab-teal');
    r.window('left', 3350, { w: 1200, curtain: 'fab-cream' });
    r.art('right', 2700, 1500, [[0, 0, 600, 800, 'mount']], 'white');
    r.plant(6200, 2000, 'snake', 0.95, 'ceramic');
  } },
  { id: 'office', name: '홈 오피스', w: 6400, d: 3900, floor: 'floor-gray', walls: { back: 'wall-white', left: 'wall-white', right: 'wall-greige' }, build(r) {
    r.back('bekant', 1500, { fin: 1 });
    r.hang('back', 'skadis', 1100, 1080);
    r.put('markus', 1500, 1480, 160);
    r.back('alex', 2560);
    r.back('linnmon', 3340);
    r.on('moppe', 'linnmon', { dx: -270, dz: -180 });
    r.back('helmer', 4040, { fin: 1 });
    r.back('ivar', 4900);
    r.right('malm-desk', 2700);
    r.put('leifarne', 5330, 2700, 90, { fin: 1 });
    r.rug(1500, 1550, 2500, 1800, 'border', 'fab-gray', 'fab-cream');
    r.window('left', 2400, { w: 1300 });
    r.plant(340, 460, 'rubber', 0.95, 'ceramic').plant(5850, 620, 'monstera', 1, 'basket');
    r.onWall('back', 1900, 1420, (k, R) => {
      PR.ledge(k, { w: 760, d: 180, mat: 'oakw' });
      k.at([-230, 0, 90], 0, () => PR.books(k, { w: 260, h: 260, d: 170, R, fill: 1, lean: false }));
      k.at([120, 0, 90], 0, () => PR.plant(k, { kind: 'cactus', s: 0.9, potMat: 'ceramic', R }));
      k.at([290, 0, 80], 0, () => PR.standFrame(k, { w: 130, h: 170, R, frameMat: 'black' }));
    });
    r.art('back', 3340, 1560, [[-260, 0, 400, 540, 'blocks'], [260, 0, 400, 540, 'mount']], 'black');
    r.onWall('right', 2700, 1850, (k, R) => PR.wallClock(k, { r: 160, R }));
  } },
  { id: 'utility', name: '현관 · 다용도실', w: 5800, d: 3700, floor: 'floor-tile', walls: { back: 'wall-blue', left: 'wall-white', right: 'wall-white' }, build(r) {
    r.back('hejne', 620);
    r.back('bror', 1650, { fin: 2 });
    r.back('hemnes-shoe', 2900);
    r.back('marius', 3700, { fin: 2 });
    r.back('raskog', 4350, { fin: 3 });
    r.put('melltorp', 4300, 2450);
    r.put('bekvam-step', 1250, 1550, 25);
    r.onWall('back', 2900, 1880, (k) => PR.roundMirror(k, { r: 270, frameMat: 'black' }));
    r.onWall('right', 1500, 1720, (k, R) => PR.coatRail(k, { w: 1300, R }));
    r.rug(2900, 1300, 1300, 800, 'solid', 'jute');
    r.plant(5300, 520, 'snake', 1.1, 'terracotta');
    r.deco(5350, 3300, 12, (k) => { PR.storageBox(k, { w: 420, h: 280, d: 330, mat: 'kraft' }); k.at([10, 280, 0], -9, () => PR.storageBox(k, { w: 360, h: 220, d: 300, mat: 'cream' })); });
    r.window('left', 2000, { w: 1100, curtain: null });
  } },
];
const ROWS = [['living-green', 'living-media', 'living-classic', 'living-pop'], ['lounge', 'studio', 'dining-wood', 'dining-modern'], ['bed-natural', 'bed-classic', 'bed-storage', 'guest'], ['play', 'kids-bed', 'office', 'utility']];

export const ROOM_GAP = 900, AISLE = 3600, MARGIN = 2400;

let cache = null;
/**
 * 쇼룸 전체 배치. rooms[i] = { id, name, x, z(실내 뒤-왼쪽 모서리의 세계 좌표), w, d, H, shell, decor, places }.
 * 세계 좌표: 매트 중심이 원점, 1열(거실)이 +Z(앞)쪽.
 */
export function layoutShowroom() {
  if (cache) return cache;
  const byId = new Map(DEFS.map((d) => [d.id, d])), rooms = [];
  const rowW = ROWS.map((ids) => ids.reduce((a, id) => a + byId.get(id).w, 0) + ROOM_GAP * (ids.length - 1) + 2 * WALL_T * ids.length);
  const rowD = ROWS.map((ids) => Math.max(...ids.map((id) => byId.get(id).d)));
  const W = Math.max(...rowW) + 2 * MARGIN, D = rowD.reduce((a, b) => a + b, 0) + AISLE * (ROWS.length - 1) + 2 * MARGIN;
  let zBack = D / 2 - MARGIN; // 1열의 앞쪽 끝
  ROWS.forEach((ids, ri) => {
    let x = -rowW[ri] / 2;
    const z0 = zBack - rowD[ri]; // 이 열의 뒷벽 안쪽 면
    for (const id of ids) {
      const def = byId.get(id), r = new Room(def);
      def.build(r);
      const shell = r.shell();
      x += WALL_T;
      const room = { id, name: def.name, row: ri, x, z: z0, w: def.w, d: def.d, H: r.H, floorMat: r.floor, wallMat: r.walls, shell, decor: { base: r.k.base.parts, back: r.k.back.parts, left: r.k.left.parts, right: r.k.right.parts }, places: r.places };
      for (const p of r.places) { p.room = room; p.wx = x + p.x; p.wz = z0 + p.z; }
      rooms.push(room);
      x += def.w + WALL_T + ROOM_GAP;
    }
    zBack = z0 - AISLE;
  });
  const places = rooms.flatMap((r) => r.places);
  cache = { rooms, places, W, D };
  return cache;
}

// ───────────────────────────────────────────── 배치 검사(테스트·점검 도구용)
function sat(a, b) {
  for (const poly of [a, b]) for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], nx = q[1] - p[1], nz = p[0] - q[0];
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const v of a) { const t = v[0] * nx + v[1] * nz; a0 = Math.min(a0, t); a1 = Math.max(a1, t); }
    for (const v of b) { const t = v[0] * nx + v[1] * nz; b0 = Math.min(b0, t); b1 = Math.max(b1, t); }
    const len = Math.hypot(nx, nz) || 1;
    if (a1 - b0 < 10 * len || b1 - a0 < 10 * len) return false; // 10mm 이내로 닿는 것은 허용
  }
  return true;
}
/** 겹치거나 방 밖으로 나간 가구를 찾아 문제 목록을 돌려준다. */
export function checkLayout() {
  const { rooms } = layoutShowroom(), issues = [], seen = new Set();
  for (const r of rooms) {
    for (const p of r.places) {
      if (seen.has(p.id)) issues.push(`${p.id}: 두 번 배치됨`);
      seen.add(p.id);
      for (const [x, z] of p.fp) if (x < -1 || x > r.w + 1 || z < -1 || z > r.d + 1) { issues.push(`${r.id}/${p.id}: 방 밖 (${Math.round(x)}, ${Math.round(z)})`); break; }
    }
    for (let i = 0; i < r.places.length; i++) for (let j = i + 1; j < r.places.length; j++) {
      const a = r.places[i], b = r.places[j];
      if (a.on === b.id || b.on === a.id || a.under === b.id || b.under === a.id) continue;
      if (a.y >= b.y + b.h - 5 || b.y >= a.y + a.h - 5) continue; // 위아래로 떨어져 있음(벽에 건 것 등)
      if (sat(a.fp, b.fp)) issues.push(`${r.id}: ${a.id} ↔ ${b.id} 겹침`);
    }
  }
  return { issues, count: seen.size };
}

// ───────────────────────────────────────────── 가구 하나를 위한 방(워크벤치의 '룸' 배경)
const lum = (hex) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const GAP_BY_CAT = { shelf: GAP, storage: GAP, sofa: GAP, bed: GAP, desk: GAP, table: 900, chair: 760, kids: 420, light: 320 };
const ROOM_RULE = {
  poang: { gap: 420 }, strandmon: { gap: 380 }, ekero: { gap: 360 }, ekenaset: { gap: 380 }, raskog: { gap: 240 }, 'bekvam-cart': { gap: GAP }, trofast: { gap: GAP }, duktig: { gap: GAP },
  kura: { gap: GAP }, sniglar: { gap: GAP }, 'lack-side': { gap: 480 }, gladom: { gap: 480 }, isfjorden: { gap: 90 }, mulig: { gap: 60 },
  fado: { lift: 760 }, lampan: { lift: 760 }, arstid: { lift: 760 }, moppe: { lift: 740 }, 'lack-shelf': { lift: 1350, gap: 0, hung: true }, skadis: { lift: 1090, gap: 0, hung: true },
};
const WALLS_FOR_LIGHT = ['wall-sage', 'wall-blue', 'wall-blush', 'wall-greige', 'wall-mint', 'wall-terracotta', 'wall-green'];
const WALLS_FOR_DARK = ['wall-white', 'wall-greige', 'wall-white', 'wall-sky'];
const FLOORS = ['floor-oak', 'floor-light', 'floor-parquet', 'floor-oak', 'floor-gray'];

/**
 * 가구 하나를 놓고 찍는 방 한 귀퉁이(뒷벽 + 왼쪽 벽). 모델 좌표계의 부품을 돌려준다.
 * { floor, walls: [{ name, part, decor }], base, planes: { xl, zb }, lift }
 * 탁상 조명처럼 작은 것은 콘솔 위에, 벽선반·페그보드는 벽에 걸린 높이로 방을 내려 맞춘다(lift).
 */
export function itemRoom(item, model, { finish = null, seed = 0 } = {}) {
  const bb = model.bbox, rule = ROOM_RULE[item.id] || {}, gap = rule.gap ?? GAP_BY_CAT[item.cat] ?? 300, lift = rule.lift || 0;
  const w0 = bb.max[0] - bb.min[0], d0 = bb.max[2] - bb.min[2], h0 = bb.max[1], cx0 = (bb.min[0] + bb.max[0]) / 2;
  const R = PR.rng(PR.hashStr(item.id) * 7 + seed * 131 + 5), fin = finish || item.finishes[0];
  // 벽 색: 밝은 가구는 색 있는 벽, 어두운 가구·원목은 밝은 벽
  const mainRole = item.cat === 'sofa' ? 'fabric' : 'body', main = materialOf(fin.map && fin.map[mainRole] ? mainRole : Object.keys(fin.map || { body: 1 })[0], fin);
  const light = lum(main.c || '#ffffff') > 0.6;
  const wallBack = pick(R, light ? WALLS_FOR_LIGHT : WALLS_FOR_DARK), floorMat = pick(R, FLOORS);
  const Lw = Math.max(1050, Math.min(1700, 900 + w0 * 0.25)), xl = bb.min[0] - Lw, zb = bb.min[2] - gap;
  const W = Lw + w0 + 7000, D = gap + d0 + 6000, H = Math.max(2700, Math.min(3900, h0 + lift + 1700));
  const r = new Room({ id: `item-${item.id}`, name: item.name, w: W, d: D, H, floor: floorMat, walls: { back: wallBack, left: 'wall-white', right: 'wall-white' } });
  const X = (x) => x - xl, Z = (z) => z - zb, ix0 = X(bb.min[0]), ix1 = X(bb.max[0]), iz0 = Z(bb.min[2]), iz1 = Z(bb.max[2]), icx = X(cx0);
  const kind = item.cat, tall = h0 + lift >= 1300, soft = kind === 'sofa' || kind === 'bed';
  const frames = pick(R, ['black', 'oak', 'white', 'brass']), rugA = pick(R, ['fab-natural', 'fab-cream', 'jute', 'fab-gray']), accent = pick(R, PR.ACCENTS);
  // 창과 커튼: 왼쪽 벽
  r.window('left', Math.max(1500, iz1 + 700), { w: 1300, h: 1400, sill: 850, curtain: pick(R, ['linen', 'linen', 'fab-cream', 'fab-blush']) });
  // 왼쪽 구석의 큰 화분
  r.plant(ix0 - Lw * 0.52, Math.max(380, iz0 + 300), pick(R, ['rubber', 'monstera', 'snake', 'rubber']), 1 + R() * 0.1, pick(R, ['terracotta', 'ceramic', 'basket', 'ceramic-black']));
  // 벽 그림: 낮은 가구는 위에, 키 큰 가구는 오른쪽 벽면에
  if (!rule.hung) {
    if (!tall) {
      const cy = Math.max(1480, lift + h0 + 520), n = w0 > 1500 ? 3 : w0 > 800 ? 2 : 1, fw = n === 1 ? 480 : 440, fh = fw * 1.36;
      r.art('back', icx, cy, Array.from({ length: n }, (_, i) => [(i - (n - 1) / 2) * (fw + 150), 0, fw, fh]), frames);
    } else r.art('back', ix1 + 780, 1520, [[0, 120, 440, 600], [0, -420, 440, 360]], frames);
  }
  // 종류별 바닥 소품
  if (kind === 'sofa') {
    r.rug(icx, iz1 + 420, w0 + 800, 2000, pick(R, ['border', 'stripe', 'border']), rugA, accent);
    r.lamp(ix1 + 430, iz0 + 330, { h: 1500 });
    r.pouf(ix1 - 180, iz1 + 900, accent);
  } else if (kind === 'bed') {
    r.rug(icx, iz1 - 250, w0 + 1000, 1600, 'border', rugA, 'fab-cream');
    r.lamp(ix1 + 420, iz0 + 320, { h: 1450 });
    r.basket(ix1 + 520, iz1 - 500, accent);
  } else if (kind === 'table' || kind === 'chair' || kind === 'kids') {
    if (gap > 100) r.rug(icx, (iz0 + iz1) / 2, w0 + 1300, d0 + 1200, w0 < 700 ? 'round' : 'border', rugA, 'fab-cream');
    r.plant(ix1 + 900, 420, pick(R, ['snake', 'rubber']), 0.95, 'ceramic');
    if (kind === 'kids') { r.deco(ix1 + 420, iz1 + 300, 0, (k, RR) => PR.blocks(k, { R: RR, n: 6, s: 52 })); r.deco(ix0 - 300, iz1 + 420, 0, (k) => PR.teddy(k, { s: 1.3, mat: 'fab-ochre' })); }
  } else if (kind === 'desk') {
    r.rug(icx, iz1 + 380, Math.max(1500, w0 + 300), 1200, 'border', rugA, 'fab-cream');
    r.basket(ix1 + 420, iz0 + 320, accent);
  } else if (kind === 'light') {
    if (!lift) r.rug(icx + 500, iz1 + 500, 1900, 1400, 'border', rugA, 'fab-cream');
  } else {
    // 수납·선반: 오른쪽에 바구니나 작은 화분
    if (R() < 0.5) r.basket(ix1 + 460, iz0 + 330, accent); else r.plant(ix1 + 480, iz0 + 330, 'snake', 0.9, 'ceramic');
  }
  // 콘솔(탁상 소품용)·벽걸이 아래 가구
  if (lift && !rule.hung) {
    r.onWall('back', icx, 0, (k, RR) => {
      const cw = 1500, cd = 420;
      k.box('콘솔 상판', [cw, 36, cd], [0, lift - 18, cd / 2 + GAP], P('oak', { lo: false }));
      k.box('콘솔 몸통', [cw - 60, lift - 36 - 120, cd - 40], [0, 120 + (lift - 156) / 2, cd / 2 + GAP], P('white', { lo: false }));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box('콘솔 다리', [40, 120, 40], [sx * (cw / 2 - 60), 60, cd / 2 + GAP + sz * (cd / 2 - 50)], P('oak', { lo: false }));
      k.at([-cw * 0.32, lift, cd / 2 + GAP], 12, () => PR.bookStack(k, { R: RR, n: 3 }));
      k.at([cw * 0.3, lift, cd / 2 + GAP - 30], -6, () => PR.standFrame(k, { w: 170, h: 230, R: RR, frameMat: frames }));
      k.at([cw * 0.42, lift, cd / 2 + GAP + 40], 0, () => PR.plant(k, { kind: 'cactus', s: 0.9, potMat: 'ceramic', R: RR }));
    });
  } else if (rule.hung) {
    r.onWall('back', icx, 0, (k, RR) => {
      const cw = Math.max(1300, w0 + 300), cd = 520, top = 740;
      k.box('책상 상판', [cw, 34, cd], [0, top - 17, cd / 2 + GAP], P('oak', { lo: false }));
      for (const sx of [-1, 1]) k.box('책상 옆판', [30, top - 34, cd - 30], [sx * (cw / 2 - 15), (top - 34) / 2, cd / 2 + GAP], P('white', { lo: false }));
      k.at([-cw * 0.1, top, cd / 2 + GAP + 40], 4, () => PR.laptop(k));
      k.at([cw * 0.3, top, cd / 2 + GAP], 30, () => PR.mug(k, { mat: 'ceramic' }));
      k.at([-cw * 0.36, top, cd / 2 + GAP - 60], 0, () => PR.plant(k, { kind: 'bush', s: 0.55, potMat: 'terracotta', R: RR }));
    });
  }
  const shell = r.shell();
  const move = (parts) => { for (const p of parts) { p.pos[0] += xl; p.pos[1] -= lift; p.pos[2] += zb; } return parts; };
  move([shell.floor, shell.walls.back, shell.walls.left]);
  return {
    floor: shell.floor, lift, H, planes: { xl, zb },
    walls: [{ name: 'back', part: shell.walls.back, decor: move(r.k.back.parts) }, { name: 'left', part: shell.walls.left, decor: move(r.k.left.parts) }],
    base: move(r.k.base.parts),
  };
}
