// 코어 단위 테스트: 순수 함수만 다루므로 Node에서 바로 돈다. `npm test`
import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../src/data/catalog.js';
import { buildModel } from '../src/core/kit.js';
import { orientedMesh, triangulate, V, meshRBox, meshExtrude, roundedRect } from '../src/core/geom.js';
import { cutList, nest, linearPlan, flatPiece } from '../src/core/cutlist.js';
import { buildSheets } from '../src/core/sheets.js';
import { projectParts, isoView, VIEWS } from '../src/core/project.js';
import * as EX from '../src/core/export.js';
import { snapSheet, fmt } from '../src/core/scale.js';
import { materialOf, MATERIALS } from '../src/data/materials.js';

const closed = (m) => {
  const E = new Map();
  for (const f of m.f) for (let i = 0; i < f.length; i++) { const k = `${f[i]}>${f[(i + 1) % f.length]}`; E.set(k, (E.get(k) || 0) + 1); }
  for (const [k, c] of E) { const [a, b] = k.split('>'); if (c !== 1 || E.get(`${b}>${a}`) !== 1) return false; }
  return true;
};
const volume = (m) => { let v = 0; for (const f of m.f) for (const t of triangulate(m.v, f)) v += V.dot(m.v[t[0]], V.cross(m.v[t[1]], m.v[t[2]])) / 6; return v; };

test('카탈로그: 100개, id·순번이 겹치지 않는다', () => {
  assert.equal(CATALOG.length, 100);
  assert.equal(new Set(CATALOG.map((i) => i.id)).size, 100);
  assert.deepEqual(CATALOG.map((i) => i.no), Array.from({ length: 100 }, (_, i) => i + 1));
  for (const it of CATALOG) { assert.ok(it.finishes.length >= 1, it.id); assert.ok(it.blurb.length > 10, it.id); assert.ok(it.diff >= 1 && it.diff <= 5, it.id); }
});

test('모든 모델(변형 포함)이 만들어지고 카탈로그 치수와 6% 안에서 맞는다', () => {
  let n = 0;
  for (const it of CATALOG) for (const v of [null, ...it.variants.map((x) => x.id)]) {
    const m = buildModel(it, { variant: v, N: 12 }); n++;
    assert.ok(m.parts.length > 0 && m.steps.length > 0, `${it.id} 부품/단계`);
    const core = m.parts.filter((p) => !p.opt && p.group !== '철물' && !(it.set && p.phase === 'set'));
    const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
    for (const p of core) for (let a = 0; a < 3; a++) { assert.ok(Number.isFinite(p.bb.min[a]) && Number.isFinite(p.bb.max[a]), `${it.id} NaN`); min[a] = Math.min(min[a], p.bb.min[a]); max[a] = Math.max(max[a], p.bb.max[a]); }
    const got = [max[0] - min[0], max[2] - min[2], max[1] - min[1]], want = v ? it.variants.find((x) => x.id === v).dims : it.dims;
    got.forEach((g, i) => assert.ok(Math.abs(g - want[i]) / want[i] <= 0.06, `${it.id}${v ? ':' + v : ''} 축 ${i}: ${Math.round(g)} vs ${want[i]}`));
    assert.ok(min[1] > -12, `${it.id} 바닥 아래로 내려감`);
    for (const p of m.parts) assert.ok(p.step >= 1 && p.step <= m.steps.length && p.stock && p.cut, `${it.id} ${p.name}`);
  }
  assert.equal(n, 138);
});

test('기하 커널: 기본 형상은 닫힌 솔리드이고 부피가 양수다', () => {
  const samples = [meshRBox(100, 50, 30, 5, 2, 1), meshRBox(100, 50, 30, 10, 3, 4, [0, 0, 0, 8, 0, 0]), meshExtrude(roundedRect(100, 60, 10), 20, { wall: 2 }), meshExtrude([[0, 0], [10, 0], [10, 10], [0, 10]], 2, { bevel: 0.5 })];
  for (const m of samples) { assert.ok(closed(m)); assert.ok(volume(m) > 0); }
  assert.ok(Math.abs(volume(meshRBox(10, 10, 10, 0)) - 1000) < 1e-6);
});

test('모든 부품 메시(도면용·렌더용)가 닫혀 있고 뒤집히지 않았다', () => {
  for (const id of ['billy', 'poang', 'raskog', 'strandmon', 'markus', 'lampan', 'sagstua', 'duktig', 'tarno']) {
    const m = buildModel(CATALOG.find((i) => i.id === id), { N: 12 });
    for (const p of m.parts) for (const d of [0, 1]) { const mesh = orientedMesh(p, d); assert.ok(closed(mesh), `${id} ${p.name} d${d} 열린 메시`); assert.ok(volume(mesh) > 0, `${id} ${p.name} d${d} 음의 부피`); }
  }
});

test('재료 두께 맞추기: 판재 두께가 시판 규격으로 떨어진다', () => {
  assert.equal(snapSheet(1.33), 1.5); assert.equal(snapSheet(0.25), 0.5); assert.equal(fmt(66.666, 1), '66.7'); assert.equal(fmt(80, 1), '80');
  const list = cutList(buildModel(CATALOG[0], { N: 12, fit: true }));
  for (const r of list.rows) if (r.stock === 'sheet') assert.ok([0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10].some((t) => Math.abs(t - r.mini.t) < 1e-6), `${r.name} ${r.mini.t}`);
});

test('재단표: 수량 합이 부품 수와 같고, 배치가 겹치거나 용지를 벗어나지 않는다', () => {
  for (const id of ['billy', 'hemnes-dresser', 'poang', 'lampan', 'detolf', 'raskog']) {
    const m = buildModel(CATALOG.find((i) => i.id === id), { N: 12, fit: true }), list = cutList(m);
    assert.equal(list.count, m.parts.filter((p) => !p.inner).length);
    assert.equal(new Set(list.rows.map((r) => r.label)).size, list.rows.length);
    const nested = nest(list, { sheetW: 273, sheetH: 150, gap: 2.5 });
    let placed = 0;
    for (const g of nested.groups) for (const sh of g.sheets) {
      placed += sh.placed.length;
      sh.placed.forEach((a, i) => {
        assert.ok(a.x >= -1e-6 && a.y >= -1e-6 && a.x + a.w <= 273 + 1e-6 && a.y + a.h <= 150 + 1e-6, `${id} 용지 밖`);
        for (const b of sh.placed.slice(i + 1)) assert.ok(a.x + a.w <= b.x + 1e-6 || b.x + b.w <= a.x + 1e-6 || a.y + a.h <= b.y + 1e-6 || b.y + b.h <= a.y + 1e-6, `${id} 겹침`);
      });
    }
    const flat = list.rows.filter((r) => flatPiece(r, 12)).reduce((a, r) => a + r.qty, 0), over = nested.groups.reduce((a, g) => a + g.over.length, 0);
    assert.equal(placed + over, flat);
    for (const g of linearPlan(list, 300)) for (const b of g.bars) assert.ok(b.left >= -1e-6);
  }
});

test('투영: 정면도 폭·높이가 모델 치수와 같다', () => {
  const m = buildModel(CATALOG[0], { N: 12 }), p = projectParts(m.parts, { view: VIEWS.front });
  assert.ok(Math.abs(p.bbox[2] - p.bbox[0] - 800) < 1e-6 && Math.abs(p.bbox[3] - p.bbox[1] - 2020) < 1e-6);
  assert.equal(projectParts(m.parts, { view: isoView() }).items.length, m.parts.length);
});

test('도면: 시트가 올바른 SVG이고 삼면도·분해도·부품도·템플릿·조립도를 모두 포함한다', () => {
  for (const id of ['billy', 'strandmon', 'mydal']) {
    const sheets = buildSheets(buildModel(CATALOG.find((i) => i.id === id), { N: 12 }), { date: '2026-01-01' });
    for (const pre of ['ga', 'ex', 'pt', 'ct', 'as']) assert.ok(sheets.some((s) => s.id.startsWith(pre)), `${id} ${pre}`);
    for (const s of sheets) { assert.ok(s.svg.startsWith('<svg xmlns') && s.svg.endsWith('</svg>') && s.svg.includes('viewBox="0 0 297 210"')); assert.ok(!s.svg.includes('NaN') && !s.svg.includes('undefined'), `${id} ${s.id}`); }
  }
});

test('내보내기: STL·ZIP·PDF·DXF·CSV 형식이 맞다', () => {
  const m = buildModel(CATALOG[0], { N: 12 }), list = cutList(m), groups = EX.modelTriangles(m);
  const stl = EX.toSTL(groups), n = groups.reduce((a, g) => a + g.tris.length, 0);
  assert.equal(stl.byteLength, 84 + n * 50); assert.equal(new DataView(stl).getUint32(80, true), n);
  const bb = [Infinity, -Infinity];
  for (const g of groups) for (const p of g.pts) { bb[0] = Math.min(bb[0], p[2]); bb[1] = Math.max(bb[1], p[2]); }
  assert.ok(Math.abs(bb[1] - bb[0] - 2020 / 12) < 0.01, 'STL은 미니어처 mm, Z가 위');
  const z = EX.zip([{ name: 'a.txt', data: 'hello' }, { name: '한글.csv', data: EX.toCSV(list, m.item) }]);
  assert.equal(new DataView(z.buffer).getUint32(0, true), 0x04034b50); assert.equal(new DataView(z.buffer).getUint32(z.length - 22, true), 0x06054b50);
  const pdf = new TextDecoder('latin1').decode(EX.pdfFromJpegs([{ jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), wPx: 2, hPx: 2 }]));
  assert.ok(pdf.startsWith('%PDF-1.4') && pdf.trimEnd().endsWith('%%EOF') && pdf.includes('/Count 1'));
  assert.ok(EX.toDXF(list).includes('LWPOLYLINE') && EX.toCSV(list, m.item).includes('측판'));
  assert.ok(EX.kitTriangles(m).length >= 1); assert.equal(typeof EX.printability(list).ok, 'boolean');
  const { obj, mtl } = EX.toOBJ(groups, (p) => materialOf(p.role, m.item.finishes[0]));
  assert.ok(obj.includes('usemtl') && mtl.includes('newmtl'));
});

test('마감: 모든 마감의 재질 키가 재질 표에 있다', () => {
  for (const it of CATALOG) for (const f of it.finishes) for (const k of Object.values(f.map)) assert.ok(MATERIALS[k], `${it.id} ${f.name}: ${k}`);
});
