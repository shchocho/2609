// 룸 세트·소품·자동 스타일링 테스트. three.js 없이 순수 데이터만 검사한다. `npm test`
import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../src/data/catalog.js';
import { MATERIALS } from '../src/data/materials.js';
import { buildModel, Kit } from '../src/core/kit.js';
import { orientedMesh } from '../src/core/geom.js';
import { cutList } from '../src/core/cutlist.js';
import { styleModel, styleKind, findBays } from '../src/core/styling.js';
import { layoutShowroom, checkLayout, modelOf } from '../src/data/rooms.js';
import * as PR from '../src/builders/props.js';

const finite = (p) => { for (const d of [0, 1]) { const m = orientedMesh(p, d); for (const v of m.v) if (!v.every(Number.isFinite)) return false; if (!m.f.length) return false; } return true; };

test('쇼룸 배치: 100개가 한 번씩, 겹치지 않고 방 안에 놓인다', () => {
  const L = layoutShowroom(), chk = checkLayout();
  assert.equal(L.rooms.length, 16);
  assert.equal(chk.count, 100);
  assert.deepEqual(chk.issues, []);
  assert.deepEqual([...new Set(L.places.map((p) => p.id))].sort(), CATALOG.map((it) => it.id).sort());
  for (const p of L.places) {
    assert.ok(p.it.finishes[p.fin], `${p.id} 마감 번호 ${p.fin}`);
    assert.ok(Number.isFinite(p.wx) && Number.isFinite(p.wz) && p.y >= 0, `${p.id} 좌표`);
    if (p.on) { const base = L.places.find((q) => q.id === p.on); assert.ok(base && Math.abs(p.y - (base.y + modelOf(base.it).bbox.max[1])) < 1, `${p.id} 는 ${p.on} 위에 놓인다`); assert.ok(base.avoid, `${p.on} 상판에 자리 비움`); }
  }
  // 방끼리 겹치지 않고 매트 안에 있다
  for (const a of L.rooms) {
    assert.ok(a.x - 60 >= -L.W / 2 && a.x + a.w + 60 <= L.W / 2 && a.z - 60 >= -L.D / 2 && a.z + a.d <= L.D / 2, `${a.id} 매트 밖`);
    for (const b of L.rooms) if (a !== b) assert.ok(a.x + a.w + 60 <= b.x - 60 || b.x + b.w + 60 <= a.x - 60 || a.z + a.d <= b.z - 60 || b.z + b.d <= a.z - 60, `${a.id} ↔ ${b.id}`);
  }
});

test('방 구조·소품: 재질 키가 모두 있고 메시가 유효하다', () => {
  const L = layoutShowroom();
  let n = 0;
  for (const r of L.rooms) {
    const parts = [r.shell.floor, ...Object.values(r.shell.walls), ...r.decor.base, ...r.decor.back, ...r.decor.left, ...r.decor.right];
    for (const p of parts) { n++; assert.ok(MATERIALS[p.mat], `${r.id} ${p.name}: 재질 ${p.mat}`); assert.ok(finite(p), `${r.id} ${p.name}: 메시`); }
    assert.ok(parts.length > 20, `${r.id} 소품이 너무 적다 (${parts.length})`);
  }
  assert.ok(n > 800, `소품 부품 ${n}`);
});

test('자동 스타일링: 결정적이고, 모델·재단표를 건드리지 않는다', () => {
  let styled = 0, total = 0;
  for (const it of CATALOG) {
    const m = buildModel(it, { N: 12 }), before = m.parts.length, rows = cutList(m).count;
    const a = styleModel(it, m, { finish: it.finishes[0] }), b = styleModel(it, m, { finish: it.finishes[0] });
    assert.equal(m.parts.length, before, `${it.id} 모델 부품 수가 바뀜`);
    assert.equal(cutList(m).count, rows, `${it.id} 재단표가 바뀜`);
    assert.equal(a.length, b.length, `${it.id} 실행마다 결과가 다름`);
    a.forEach((p, i) => { assert.deepEqual(p.pos, b[i].pos, `${it.id} ${p.name}`); assert.equal(p.role, 'prop'); assert.ok(MATERIALS[p.mat], `${it.id} ${p.name}: 재질 ${p.mat}`); assert.ok(p.pos.every(Number.isFinite), `${it.id} ${p.name} 위치`); });
    if (styleKind(it) === 'none') assert.equal(a.length, 0, it.id);
    if (a.length) styled++;
    total += a.length;
    // 소품은 가구 주변을 크게 벗어나지 않는다(옆으로 0.5m, 위로 1.2m 안)
    const bb = m.bbox;
    for (const p of a) assert.ok(p.pos[0] > bb.min[0] - 500 && p.pos[0] < bb.max[0] + 500 && p.pos[2] > bb.min[2] - 500 && p.pos[2] < bb.max[2] + 500 && p.pos[1] > -400 && p.pos[1] < bb.max[1] + 1200, `${it.id} ${p.name} 이 멀리 떨어짐 (${p.pos.map(Math.round)})`);
  }
  assert.ok(styled >= 60, `스타일링된 가구 ${styled}`);
  assert.ok(total > 1200 && total < 4000, `소품 수 ${total}`);
});

test('칸 찾기: 책장은 선반 칸을, 서랍장은 상판만 찾는다', () => {
  const by = (id) => findBays(buildModel(CATALOG.find((it) => it.id === id), { N: 12 }));
  const billy = by('billy'), inner = billy.filter((b) => b.clear <= 560);
  assert.ok(inner.length >= 5, `BILLY 선반 칸 ${inner.length}`);
  for (const b of inner) assert.ok(b.x1 - b.x0 > 600 && b.clear > 150, 'BILLY 칸 크기');
  const malm = by('malm-dresser');
  assert.equal(malm.filter((b) => b.clear <= 560).length, 0, 'MALM 서랍 속은 칸이 아니다');
  assert.ok(malm.some((b) => b.clear === Infinity && b.y > 900), 'MALM 상판');
  assert.ok(by('kallax').filter((b) => b.clear <= 560).length >= 6, 'KALLAX 큐브 칸');
  assert.ok(by('docksta').some((b) => b.round && b.clear === Infinity), 'DOCKSTA 둥근 상판');
});

test('소품 부품: 모든 소품이 유효한 메시를 만든다', () => {
  const R = () => PR.rng(11), k = new Kit({ N: 12 });
  PR.books(k, { w: 700, h: 320, d: 250, R: R(), fill: 0.7 }); PR.bookStack(k, { R: R() });
  for (const kind of ['snake', 'rubber', 'monstera', 'bush', 'cactus', 'ivy']) PR.plant(k, { kind, R: R() });
  for (const kind of ['branch', 'tulip', 'dried', 'empty']) PR.vase(k, { kind, R: R() });
  for (const kind of PR.ART_KINDS) PR.frame(k, { kind, R: R() });
  PR.standFrame(k, { R: R() }); PR.roundMirror(k, {}); PR.wallClock(k, { R: R() });
  for (const kind of ['solid', 'border', 'stripe', 'round', 'check']) PR.rug(k, { kind });
  PR.cushion(k, {}); PR.blanket(k, {}); PR.bedRunner(k, {}); PR.pouf(k, {}); PR.curtain(k, { rod: 900 }); PR.windowUnit(k, {});
  PR.lampTable(k, {}); PR.lampFloor(k, {}); PR.arcLamp(k, {}); PR.pendantArm(k, {}); PR.tv(k, {}); PR.laptop(k); PR.mug(k, {}); PR.penCup(k, { R: R() }); PR.notebook(k, { R: R() });
  PR.bowl(k, { fruit: 5, R: R() }); PR.candle(k, {}); PR.plateSet(k, {}); PR.bottle(k, {}); PR.jar(k, {}); PR.board(k, {});
  PR.basket(k, { fill: 'fab-ochre' }); PR.storageBox(k, {}); PR.binBox(k, { w: 320, h: 300, d: 350 });
  PR.garment(k, {}); PR.garment(k, { kind: 'dress', flat: true }); PR.coatRail(k, { R: R() });
  PR.blocks(k, { R: R() }); PR.ball(k, {}); PR.teddy(k, {}); PR.stacker(k, {});
  PR.baseboard(k, { w: 3000 }); PR.ledge(k, {}); PR.barShelf(k, {}); PR.slatPanel(k, {}); PR.colorPanel(k, {});
  assert.ok(k.parts.length > 300);
  for (const p of k.parts) { assert.ok(MATERIALS[p.mat], `${p.name}: 재질 ${p.mat}`); assert.ok(finite(p), `${p.name}: 메시`); }
  // 같은 시드는 같은 결과
  const a = PR.rng(5), b = PR.rng(5);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
});
