// 점검용: 소품을 한 장에 늘어놓고 PNG로 찍는다.  node tools/props-sheet.mjs <outdir>
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { Kit } from '../src/core/kit.js';
import { modelSVG } from '../src/core/project.js';
import { MATERIALS } from '../src/data/materials.js';
import * as PR from '../src/builders/props.js';

const require = createRequire(import.meta.url);
const out = process.argv[2] || '/tmp/props';
fs.mkdirSync(out, { recursive: true });
const R = () => PR.rng(7);
const LIST = {
  books: (k) => PR.books(k, { w: 760, h: 330, d: 260, R: R(), fill: 0.7 }),
  bookStack: (k) => PR.bookStack(k, { R: R(), n: 4 }),
  snake: (k) => PR.plant(k, { kind: 'snake', R: R() }),
  rubber: (k) => PR.plant(k, { kind: 'rubber', R: R(), potMat: 'ceramic' }),
  monstera: (k) => PR.plant(k, { kind: 'monstera', R: R(), potMat: 'basket' }),
  bush: (k) => PR.plant(k, { kind: 'bush', R: R(), potMat: 'ceramic-blue' }),
  cactus: (k) => PR.plant(k, { kind: 'cactus', R: R() }),
  ivy: (k) => PR.plant(k, { kind: 'ivy', R: R(), potMat: 'ceramic' }),
  vaseBranch: (k) => PR.vase(k, { kind: 'branch', R: R() }),
  vaseTulip: (k) => PR.vase(k, { kind: 'tulip', R: R(), mat: 'ceramic-blue' }),
  vaseDried: (k) => PR.vase(k, { kind: 'dried', R: R(), mat: 'terracotta' }),
  ...Object.fromEntries(PR.ART_KINDS.map((a, i) => [`frame-${a}`, (k) => PR.frame(k, { w: 500, h: 700, kind: a, R: PR.rng(i + 3), frameMat: i % 2 ? 'oak' : 'black' })])),
  standFrame: (k) => PR.standFrame(k, { R: R() }),
  roundMirror: (k) => PR.roundMirror(k, {}),
  wallClock: (k) => PR.wallClock(k, { R: R() }),
  rugBorder: (k) => PR.rug(k, { kind: 'border' }), rugStripe: (k) => PR.rug(k, { kind: 'stripe', a: 'fab-cream', b: 'fab-navy' }),
  rugRound: (k) => PR.rug(k, { kind: 'round', w: 1600, a: 'jute', b: 'fab-cream' }), rugCheck: (k) => PR.rug(k, { kind: 'check', a: 'fab-cream', b: 'fab-sage' }),
  cushion: (k) => PR.cushion(k, {}), blanket: (k) => PR.blanket(k, {}), pouf: (k) => PR.pouf(k, {}),
  curtain: (k) => PR.curtain(k, { rod: 900 }), window: (k) => PR.windowUnit(k, {}),
  lampTable: (k) => PR.lampTable(k, {}), lampFloor: (k) => PR.lampFloor(k, {}),
  tv: (k) => PR.tv(k, {}), laptop: (k) => PR.laptop(k), mug: (k) => PR.mug(k, {}), penCup: (k) => PR.penCup(k, { R: R() }), notebook: (k) => PR.notebook(k, { R: R() }),
  bowl: (k) => PR.bowl(k, { fruit: 5, R: R() }), candle: (k) => PR.candle(k, {}), plateSet: (k) => PR.plateSet(k, {}), bottle: (k) => PR.bottle(k, {}), jar: (k) => PR.jar(k, {}), board: (k) => PR.board(k, {}),
  basket: (k) => PR.basket(k, { fill: 'fab-ochre' }), storageBox: (k) => PR.storageBox(k, {}), binBox: (k) => PR.binBox(k, { w: 320, h: 300, d: 360 }),
  shirt: (k) => PR.garment(k, {}), dress: (k) => PR.garment(k, { kind: 'dress', mat: 'fab-terracotta' }),
  blocks: (k) => PR.blocks(k, { R: R() }), ball: (k) => PR.ball(k, {}), teddy: (k) => PR.teddy(k, {}), stacker: (k) => PR.stacker(k, {}),
  barShelf: (k) => PR.barShelf(k, {}), ledge: (k) => PR.ledge(k, {}),
};
const only = process.argv[3] ? process.argv[3].split(',') : null;
let cells = '', total = 0;
for (const [name, fn] of Object.entries(LIST)) {
  if (only && !only.includes(name)) continue;
  const k = new Kit({ N: 12 });
  fn(k);
  total += k.parts.length;
  const svg = modelSVG({ parts: k.parts }, { yaw: 28, pitch: 20, detail: 1, style: (p) => {
    const m = MATERIALS[p.mat] || MATERIALS.white;
    return { fill: m.c, stroke: '#1b2420', shade: true, fo: m.t === 'glass' ? 0.35 : undefined };
  } });
  cells += `<figure><div class="pic">${svg}</div><figcaption>${name} · ${k.parts.length}p</figcaption></figure>`;
}
const html = `<!doctype html><meta charset="utf8"><style>body{margin:0;background:#e9ecea;font:12px monospace}main{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;padding:6px}figure{margin:0;background:#f7f8f6;padding:6px}.pic{height:${only ? 520 : 210}px;display:flex;align-items:center;justify-content:center}.pic svg{max-width:100%;max-height:100%}figcaption{text-align:center;color:#333}</style><main>${cells}</main>`;
fs.writeFileSync(`${out}/props.html`, html);
const { chromium } = require('playwright');
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1800, height: 900 } });
await pg.goto(`file://${out}/props.html`);
await pg.screenshot({ path: `${out}/props.png`, fullPage: true });
await b.close();
console.log('ok', total, 'parts', `${out}/props.png`);
