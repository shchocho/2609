// 점검용: 쇼룸 평면도(가구 발자국)를 그리고 겹침·벽 밖 배치를 검사한다.  node tools/room-plan.mjs <outdir>
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { layoutShowroom, checkLayout, WALL_T } from '../src/data/rooms.js';
import { CATALOG } from '../src/data/catalog.js';

const require = createRequire(import.meta.url);
const out = process.argv[2] || '/tmp/plan';
fs.mkdirSync(out, { recursive: true });
const t0 = Date.now(), L = layoutShowroom(), chk = checkLayout();
console.log('layout', Date.now() - t0, 'ms', 'rooms', L.rooms.length, 'items', chk.count, 'mat', Math.round(L.W), 'x', Math.round(L.D));
const missing = CATALOG.filter((it) => !L.places.some((p) => p.id === it.id)).map((it) => it.id);
if (missing.length) console.log('MISSING', missing.join(', '));
console.log(chk.issues.length ? 'ISSUES\n  ' + chk.issues.join('\n  ') : 'no layout issues');
const decor = L.rooms.reduce((a, r) => a + r.decor.base.length + r.decor.back.length + r.decor.left.length + r.decor.right.length, 0);
console.log('decor parts', decor);
if (process.argv.includes('--no-png')) process.exit(0);
const s = 0.05, X = (x) => (x + L.W / 2) * s, Z = (z) => (z + L.D / 2) * s;
let g = `<rect width="${L.W * s}" height="${L.D * s}" fill="#2c6b58"/>`;
for (const r of L.rooms) {
  g += `<rect x="${X(r.x - WALL_T)}" y="${Z(r.z - WALL_T)}" width="${(r.w + 2 * WALL_T) * s}" height="${(r.d + WALL_T) * s}" fill="#444"/><rect x="${X(r.x)}" y="${Z(r.z)}" width="${r.w * s}" height="${r.d * s}" fill="#e8dcc4"/>`;
  g += `<text x="${X(r.x + r.w / 2)}" y="${Z(r.z + r.d) + 14}" text-anchor="middle" font-size="11" fill="#fff">${r.name}</text>`;
  for (const p of r.places) {
    const pts = p.fp.map(([x, z]) => `${X(r.x + x).toFixed(1)},${Z(r.z + z).toFixed(1)}`).join(' ');
    const cx = p.fp.reduce((a, q) => a + q[0], 0) / 4, cz = p.fp.reduce((a, q) => a + q[1], 0) / 4, fx = (p.fp[2][0] + p.fp[3][0]) / 2, fz = (p.fp[2][1] + p.fp[3][1]) / 2;
    g += `<polygon points="${pts}" fill="${p.on ? '#f4c430' : p.hung ? '#8ab' : '#fff'}" fill-opacity="0.85" stroke="#222" stroke-width="0.6"/>`;
    g += `<line x1="${X(r.x + cx)}" y1="${Z(r.z + cz)}" x2="${X(r.x + fx)}" y2="${Z(r.z + fz)}" stroke="#c33" stroke-width="0.8"/>`;
    g += `<text x="${X(r.x + cx)}" y="${Z(r.z + cz) + 2}" text-anchor="middle" font-size="5.2" fill="#000">${p.id}</text>`;
  }
}
const html = `<!doctype html><meta charset="utf8"><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="${L.W * s}" height="${L.D * s}" font-family="monospace">${g}</svg>`;
fs.writeFileSync(`${out}/plan.html`, html);
const { chromium } = require('playwright');
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: Math.ceil(L.W * s), height: Math.ceil(L.D * s) } });
await pg.goto(`file://${out}/plan.html`);
await pg.screenshot({ path: `${out}/plan.png` });
await b.close();
console.log('ok', `${out}/plan.png`);
