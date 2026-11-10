// 점검용: 앱 화면을 스크린샷. node tools/ui-shot.mjs out.png "#hash" [w] [h] [waitMs] [dark] [scrollY] [clickSelector]
import { createRequire } from 'node:module';
import { start } from './serve.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [out, hash = '#home', w = '1440', h = '900', wait = '2500', dark = '', scrollY = '0', click = ''] = process.argv.slice(2);
const server = await start(5196);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: Number(w), height: Number(h) }, colorScheme: dark === 'dark' ? 'dark' : 'light', deviceScaleFactor: 1 });
const logs = [];
pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
pg.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
pg.on('requestfailed', (r) => logs.push(`[failed] ${r.url().slice(0, 120)}`));
await pg.goto(`http://localhost:5196/index.html${hash}`, { waitUntil: 'load' });
await pg.waitForTimeout(Number(wait));
if (click) { for (const sel of click.split('|')) { await pg.click(sel).catch((e) => logs.push('click fail ' + sel + ' ' + e.message.slice(0, 80))); await pg.waitForTimeout(900); } }
if (Number(scrollY)) { await pg.evaluate((y) => window.scrollTo(0, y), Number(scrollY)); await pg.waitForTimeout(1800); }
await pg.evaluate(() => { for (const c of document.querySelectorAll('canvas')) c.dataset.seen = '1'; });
await pg.screenshot({ path: out, timeout: 90000 });
const over = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
console.log('ui', out, JSON.stringify(over), [...new Set(logs)].slice(0, 10).join('\n'));
await b.close(); server.close();
