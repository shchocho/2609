// index.html 을 Claude 아티팩트용 조각(doctype·html·head·body 없는 페이지)으로 바꾸고, 함께 올릴 파일 목록을 만든다.
// node tools/build-artifact.mjs → dist/miniatyr.html, dist/files.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/app.css'), 'utf8');
const pick = (re) => (html.match(re) || [''])[0];
const head = [pick(/<title>[\s\S]*?<\/title>/), pick(/<meta name="claude:viewport-fit-sides"[^>]*>/), ...html.match(/<link rel="(?:preconnect|stylesheet)" href="https:\/\/fonts[^>]*>/g) || []].join('\n');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).trim();
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/miniatyr.html'), `${head}\n<style>\n${css}\n</style>\n${body}\n`);
// 아티팩트에서는 three.js 를 허용된 CDN(jsDelivr, 같은 버전)에서 불러오고, 나머지 파일은 dist/ 에 복사해 함께 올린다.
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
const files = [...walk('src'), ...walk('assets/thumbs'), ...walk('assets/real')];
// 아티팩트는 .bin 을 내려 주지 않는다. 스캔 모델의 정점 데이터는 받아 주는 이진 형식 이름(.wasm)으로 올리고 로더의 경로도 맞춘다.
const served = (f) => f.replace(/\.bin$/, '.wasm');
for (const f of files) {
  const out = path.join(root, 'dist', served(f));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (f.endsWith('.js')) fs.writeFileSync(out, fs.readFileSync(path.join(root, f), 'utf8').replace(/'(?:\.\.\/)+vendor\/three\.module\.min\.js'/g, `'${CDN}'`).replace('${BASE}${id}.bin', '${BASE}${id}.wasm'));
  else fs.copyFileSync(path.join(root, f), out);
}
fs.writeFileSync(path.join(root, 'dist/files.json'), JSON.stringify(files.map((p) => ({ path: served(p) }))));
console.log('artifact page', fs.statSync(path.join(root, 'dist/miniatyr.html')).size, 'bytes;', files.length, 'files');
