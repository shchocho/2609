// 점검용: 스테이지 테스트 페이지를 열어 수렴된 정지 화면을 PNG로 저장한다.
// node tools/shot.mjs out.png "id=billy&mini" [samples] [w] [h]
import { createRequire } from 'node:module';
import { start } from './serve.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [out, query = 'id=billy', samples = '32', w = '900', h = '700'] = process.argv.slice(2);
const server = await start(5199);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: Number(w), height: Number(h) } });
const logs = [];
pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
pg.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await pg.goto(`http://localhost:5199/tools/stage-test.html?${query}`);
await pg.waitForFunction('window.ready === true', null, { timeout: 60000 }).catch(() => logs.push('ready timeout'));
const t0 = Date.now();
await pg.evaluate((n) => window.still(n), Number(samples)).catch((e) => logs.push('still: ' + e.message));
await pg.screenshot({ path: out, timeout: 300000 });
console.log('shot', out, `${Date.now() - t0}ms`, logs.slice(0, 12).join('\n'));
await b.close(); server.close();
