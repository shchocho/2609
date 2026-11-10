// 점검용: 여러 쿼리의 스테이지 렌더를 차례로 찍어 한 장으로 모은다.
// node tools/montage.mjs out.png samples cols cellW cellH "q1" "q2" ...
import { createRequire } from 'node:module';
import { start } from './serve.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [out, samples, cols, cw, ch, ...qs] = process.argv.slice(2);
const server = await start(5199);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: Number(cw), height: Number(ch) } });
const logs = [], shots = [];
pg.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
pg.on('pageerror', (e) => logs.push(e.message));
const t0 = Date.now();
for (const q of qs) {
  await pg.goto(`http://localhost:5199/tools/stage-test.html?${q}`);
  await pg.waitForFunction('window.ready === true', null, { timeout: 90000 }).catch(() => logs.push('timeout ' + q));
  await pg.evaluate((n) => window.still(n), Number(samples)).catch((e) => logs.push(e.message));
  shots.push({ q, data: (await pg.screenshot()).toString('base64') });
}
const rows = Math.ceil(qs.length / cols);
await pg.setViewportSize({ width: cols * (Number(cw) + 4), height: rows * (Number(ch) + 4) });
await pg.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:4px;background:#222}div{position:relative}img{display:block}span{position:absolute;left:4px;top:4px;font:11px monospace;background:#000a;color:#fff;padding:1px 4px}</style>${shots.map((s) => `<div><span>${s.q}</span><img src="data:image/png;base64,${s.data}"></div>`).join('')}`);
await pg.screenshot({ path: out });
console.log('montage', out, `${Date.now() - t0}ms`, [...new Set(logs)].slice(0, 8).join('\n'));
await b.close(); server.close();
