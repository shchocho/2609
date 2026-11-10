// 점검용: 전 품목 등각 투영을 한 장의 HTML로 만들고 PNG로 찍는다.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { CATALOG } from '../src/data/catalog.js';
import { buildModel } from '../src/core/kit.js';
import { modelSVG } from '../src/core/project.js';
import { materialOf } from '../src/data/materials.js';

const require = createRequire(import.meta.url);
const out = process.argv[2] || '/tmp/sheet';
const from = Number(process.argv[3] || 1), to = Number(process.argv[4] || 100);
const yaw = Number(process.argv[5] || 35);
const only = process.argv[6] ? process.argv[6].split(',') : null;
fs.mkdirSync(out, { recursive: true });
let cells = '';
for (const it of CATALOG) {
  if (only ? !only.includes(it.id) : (it.no < from || it.no > to)) continue;
  const m = buildModel(it, { N: 12 });
  const fin = it.finishes[0];
  const svg = modelSVG(m, { yaw, pitch: 22, style: (p) => {
    const mat = materialOf(p.role, fin);
    if (mat.t === 'glass') return { fill: mat.c, fo: 0.3, stroke: '#35504a', shade: true };
    return { fill: mat.c, stroke: '#1b2420', shade: true };
  } });
  cells += `<figure><div class="pic">${svg}</div><figcaption>${it.no} ${it.id} · ${m.parts.length}p</figcaption></figure>`;
}
const cols = only ? Math.min(4, only.length) : 5;
const html = `<!doctype html><meta charset="utf8"><style>body{margin:0;background:#e9ecea;font:12px monospace}main{display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px}figure{margin:0;background:#f7f8f6;padding:6px}.pic{height:${only ? 420 : 250}px;display:flex;align-items:center;justify-content:center}.pic svg{max-width:100%;max-height:100%}figcaption{text-align:center;color:#333}</style><main>${cells}</main>`;
fs.writeFileSync(`${out}/sheet.html`, html);
const { chromium } = require('playwright');
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: only ? 440 * cols : 1500, height: 900 } });
await pg.goto(`file://${out}/sheet.html`);
await pg.screenshot({ path: `${out}/sheet-${only ? only[0] : from}.png`, fullPage: true });
await b.close();
console.log('ok', `${out}/sheet-${only ? only[0] : from}.png`);
