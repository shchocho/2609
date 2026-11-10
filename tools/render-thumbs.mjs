// 실사 썸네일을 미리 렌더해 assets/thumbs/*.webp 로 저장한다.
// node tools/render-thumbs.mjs [samples=48] [id,id,...]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { start } from './serve.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets/thumbs');
fs.mkdirSync(outDir, { recursive: true });
const samples = Number(process.argv[2] || 48);
const only = process.argv[3] ? process.argv[3].split(',') : null;
const server = await start(5197);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 720, height: 720 } });
pg.on('pageerror', (e) => console.log('[pageerror]', e.message));
await pg.goto('http://localhost:5197/tools/thumb.html');
await pg.waitForFunction('window.ready === true', null, { timeout: 60000 });
const ids = only || (await pg.evaluate(() => window.ids));
const manifestPath = path.join(outDir, 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const t0 = Date.now();
for (const [i, id] of ids.entries()) {
  const r = await pg.evaluate(([id, s]) => window.render(id, s), [id, samples]);
  fs.writeFileSync(path.join(outDir, `${id}.webp`), Buffer.from(r.url.split(',')[1], 'base64'));
  manifest[id] = r.meta;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  if (i % 10 === 9 || i === ids.length - 1) console.log(`${i + 1}/${ids.length}`, id, `${Math.round((Date.now() - t0) / 1000)}s`);
}
await b.close(); server.close();
