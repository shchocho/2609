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
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
const files = [...walk('src'), 'vendor/three.module.min.js', ...walk('assets/thumbs')].map((p) => ({ path: p }));
fs.writeFileSync(path.join(root, 'dist/files.json'), JSON.stringify(files));
console.log('artifact page', fs.statSync(path.join(root, 'dist/miniatyr.html')).size, 'bytes;', files.length, 'files');
