// 점검용: 자동 스타일링(소품)을 얹은 가구를 한 장에 찍는다.  node tools/styled-sheet.mjs <outdir> [id,id…] [yaw] [cols]
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { CATALOG } from '../src/data/catalog.js';
import { buildModel } from '../src/core/kit.js';
import { modelSVG } from '../src/core/project.js';
import { materialOf, MATERIALS } from '../src/data/materials.js';
import { styleModel, styleKind } from '../src/core/styling.js';

const require = createRequire(import.meta.url);
const out = process.argv[2] || '/tmp/styled';
const only = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3].split(',') : null;
const yaw = Number(process.argv[4] || 30), cols = Number(process.argv[5] || 5);
fs.mkdirSync(out, { recursive: true });
let cells = '', n = 0, props = 0;
const t0 = Date.now();
for (const it of CATALOG) {
  if (only ? !only.includes(it.id) : styleKind(it) === 'none') continue;
  const m = buildModel(it, { N: 12 }), fin = it.finishes[0];
  const pp = styleModel(it, m, { finish: fin });
  props += pp.length; n++;
  const svg = modelSVG({ parts: [...m.parts.filter((p) => !p.inner), ...pp] }, { yaw, pitch: 24, style: (p) => {
    const mat = p.mat ? { ...(MATERIALS[p.mat] || MATERIALS.white) } : materialOf(p.role, fin);
    if (mat.t === 'glass') return { fill: mat.c, fo: 0.25, stroke: '#35504a', shade: true };
    return { fill: mat.c, stroke: p.mat ? '#3a4440' : '#1b2420', shade: true, sw: p.mat ? 0.6 : undefined };
  } });
  cells += `<figure><div class="pic">${svg}</div><figcaption>${it.no} ${it.id} · ${styleKind(it)} · +${pp.length}</figcaption></figure>`;
}
const html = `<!doctype html><meta charset="utf8"><style>body{margin:0;background:#e9ecea;font:12px monospace}main{display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px}figure{margin:0;background:#f7f8f6;padding:6px}.pic{height:${Math.round(1500 / cols)}px;display:flex;align-items:center;justify-content:center}.pic svg{max-width:100%;max-height:100%}figcaption{text-align:center;color:#333}</style><main>${cells}</main>`;
fs.writeFileSync(`${out}/styled.html`, html);
const { chromium } = require('playwright');
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1700, height: 900 } });
await pg.goto(`file://${out}/styled.html`);
await pg.screenshot({ path: `${out}/styled-${only ? only[0] : 'all'}.png`, fullPage: true });
await b.close();
console.log('ok', n, 'items', props, 'props', Date.now() - t0, 'ms', `${out}/styled-${only ? only[0] : 'all'}.png`);
