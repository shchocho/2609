// 전 품목 빌드 점검: 오류, NaN, 카탈로그 치수 대비 오차를 출력한다.
import { CATALOG } from '../src/data/catalog.js';
import { buildModel } from '../src/core/kit.js';

let bad = 0, total = 0, parts = 0;
for (const it of CATALOG) {
  const vs = [null, ...(it.variants || []).map((v) => v.id)];
  for (const v of vs) {
    total++;
    try {
      const m = buildModel(it, { variant: v, N: 12 });
      parts += m.parts.length;
      const core = m.parts.filter((p) => !p.opt && p.group !== '철물');
      let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
      for (const p of (it.set ? core.filter((p) => p.phase !== 'set') : core)) for (let a = 0; a < 3; a++) { min[a] = Math.min(min[a], p.bb.min[a]); max[a] = Math.max(max[a], p.bb.max[a]); }
      const got = [max[0] - min[0], max[2] - min[2], max[1] - min[1]];
      const want = v ? it.variants.find((x) => x.id === v).dims : it.dims;
      const err = got.map((g, i) => (g - want[i]) / want[i]);
      const nan = m.parts.some((p) => [...p.pos, ...p.bb.min, ...p.bb.max].some((x) => !Number.isFinite(x)));
      const flag = nan || err.some((e) => Math.abs(e) > 0.06) || Math.abs(min[1]) > 12 || Math.abs((min[0] + max[0]) / 2) > Math.max(20, want[0] * 0.03);
      if (flag) { bad++; console.log(`${String(it.no).padStart(3)} ${it.id}${v ? ':' + v : ''}`.padEnd(30), 'got', got.map((x) => Math.round(x)).join('×'), 'want', want.join('×'), nan ? 'NaN!' : '', 'minY', min[1].toFixed(1), 'cx', ((min[0] + max[0]) / 2).toFixed(0), 'cz', ((min[2] + max[2]) / 2).toFixed(0), 'steps', m.steps.length, 'parts', m.parts.length); }
    } catch (e) { bad++; console.log(`${it.no} ${it.id}${v ? ':' + v : ''} ERROR`, e.stack.split('\n').slice(0, 3).join(' | ')); }
  }
}
console.log(`\n${total} models, ${parts} parts, ${bad} flagged`);
