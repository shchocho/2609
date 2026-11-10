// 점검용: 도면 시트를 PNG로. node tools/sheet-shot.mjs outdir id [style] [N] [indices...]
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { getItem } from '../src/data/catalog.js';
import { buildModel } from '../src/core/kit.js';
import { buildSheets } from '../src/core/sheets.js';
const require = createRequire(import.meta.url);
const [out, id, style = 'paper', N = '12', ...idx] = process.argv.slice(2);
const model = buildModel(getItem(id), { N: Number(N) });
const t0 = Date.now();
const sheets = buildSheets(model, { style, date: '2026-11-10' });
console.log(id, sheets.length, 'sheets', Date.now() - t0, 'ms', sheets.map((s) => `${s.id}:${(s.svg.length / 1024).toFixed(0)}k`).join(' '));
const { chromium } = require('playwright');
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1485, height: 1050 } });
for (const i of (idx.length ? idx.map(Number) : [0])) {
  if (!sheets[i]) continue;
  await pg.setContent(`<style>body{margin:0}svg{width:1485px;height:1050px;display:block}</style>${sheets[i].svg}`);
  await pg.screenshot({ path: `${out}/${id}-${sheets[i].id}.png` });
}
await b.close();
