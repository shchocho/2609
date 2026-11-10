// cutlist.js — 재단표, 판재 배치(네스팅), 봉재 1D 절단 계획.

import { STOCK_INFO } from './kit.js';
import { fmt, r1 } from './scale.js';

const FLAT = new Set(['sheet', 'profile', 'film', 'disc', 'band', 'cone']);
const LINEAR = new Set(['stick', 'rod', 'wire']);

const label = (i) => { let s = ''; i += 1; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };

/** 재료 추천: 미니어처 치수 기준. */
export function suggest(stock, m) {
  switch (stock) {
    case 'sheet': case 'profile': case 'disc': {
      const t = m.t;
      if (t < 0.45) return '켄트지·얇은 프라판';
      if (t <= 1.2) return '하드보드지·1mm 발사';
      if (t <= 3.2) return '발사·바스우드 판재';
      if (t <= 6.5) return '바스우드·MDF·폼보드';
      return '폼보드 적층·발사 블록';
    }
    case 'film': return m.t <= 0.6 ? '투명 PET 필름' : '투명 아크릴·PET판';
    case 'band': return m.t < 0.5 ? '켄트지 띠' : '0.5mm 프라판·무늬목 띠';
    case 'cone': return '켄트지·트레이싱지';
    case 'stick': return m.a <= 1.2 ? '프라봉·대나무 살' : '발사·히노끼 각재';
    case 'rod': return m.d <= 1.2 ? '철사·시침핀' : m.d <= 3.2 ? '이쑤시개·황동봉' : '다월·환봉';
    case 'wire': return m.d <= 1 ? '0.5~1mm 철사' : '알루미늄 선·황동봉';
    case 'turn': return '환봉 가공·에폭시 퍼티';
    case 'block': return '발사 블록·폼보드 적층';
    case 'foam': return '스펀지 + 원단';
    case 'bead': return '비즈·시침핀 머리';
    default: return '';
  }
}

export function dimText(stock, c, digits = 1) {
  const f = (x) => fmt(x, digits);
  switch (stock) {
    case 'stick': return `${f(c.l)} × ${f(c.a)} × ${f(c.b)}`;
    case 'rod': case 'turn': return c.d2 && Math.abs(c.d2 - c.d) > 0.05 ? `Ø${f(c.d)}→${f(c.d2)} × ${f(c.l)}` : `Ø${f(c.d)} × ${f(c.l)}`;
    case 'wire': return `Ø${f(c.d)} × ${f(c.l)}`;
    case 'disc': return `Ø${f(c.d)} × ${f(c.t)}`;
    case 'bead': return `Ø${f(c.d)}`;
    case 'cone': return `Ø${f(c.d)} × ${f(c.l)}`;
    default: return `${f(c.l)} × ${f(c.w)} × ${f(c.t)}`;
  }
}

const scaleCut = (c, n) => {
  const o = {};
  for (const k of ['l', 'w', 't', 'a', 'b', 'd', 'd2', 'r', 'bw', 'bh']) if (c[k] != null) o[k] = c[k] / n;
  if (c.shaped) o.shaped = true;
  return o;
};

/**
 * 같은 부품을 묶어 재단표를 만든다.
 * rows[].mini 는 미니어처 mm, rows[].real 은 실물 mm.
 */
export function cutList(model) {
  const N = model.N, map = new Map(), rows = [];
  for (const p of model.parts) {
    if (p.inner) continue;
    const c = p.cut, q = (x) => (x == null ? '' : Math.round(x * 2) / 2);
    const key = [p.stock, p.name, p.role, q(c.l), q(c.w), q(c.t), q(c.a), q(c.b), q(c.d), p.opt ? 1 : 0].join('|');
    let row = map.get(key);
    if (!row) {
      row = { key, name: p.name, stock: p.stock, role: p.role, group: p.group, step: p.step, opt: p.opt, qty: 0, real: c, mini: scaleCut(c, N), parts: [], note: p.note || '', sample: p };
      map.set(key, row);
      rows.push(row);
    }
    row.qty++;
    row.parts.push(p.id);
  }
  rows.sort((a, b) => (a.opt - b.opt) || (a.step - b.step) || (vol(b) - vol(a)));
  rows.forEach((r, i) => {
    r.label = label(i);
    r.info = STOCK_INFO[r.stock] || STOCK_INFO.block;
    r.dim = dimText(r.stock, r.mini);
    r.dimReal = dimText(r.stock, r.real, 0);
    r.material = suggest(r.stock, r.mini);
    const thin = r.stock === 'sheet' || r.stock === 'profile' ? r.mini.t : r.stock === 'stick' ? r.mini.b : r.stock === 'rod' || r.stock === 'wire' ? r.mini.d : null;
    r.warn = thin != null && thin < 0.45 ? '너무 얇아요. 종이·필름이나 철사로 바꾸세요.' : '';
  });
  const byId = new Map();
  for (const r of rows) for (const id of r.parts) byId.set(id, r);
  const count = rows.reduce((a, r) => a + r.qty, 0);
  return { rows, byId, count, N };
}
function vol(r) { const c = r.real; return (c.l || c.d || 0) * (c.w || c.a || c.d || 1) * (c.t || c.b || 1); }

/** 원뿔대 전개도 윤곽(미니어처 mm). */
export function coneDevelopment(part, N) {
  const pr = part.profile;
  let y0 = Infinity, y1 = -Infinity;
  for (const [, y] of pr) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  let ra = 0, rb = 0;
  for (const [r, y] of pr) { if (Math.abs(y - y0) < 1e-6) ra = Math.max(ra, r); if (Math.abs(y - y1) < 1e-6) rb = Math.max(rb, r); }
  ra /= N; rb /= N;
  const h = (y1 - y0) / N;
  if (Math.abs(ra - rb) < 0.05) return { pts: [[0, 0], [2 * Math.PI * ra, 0], [2 * Math.PI * ra, h], [0, h]], w: 2 * Math.PI * ra, h, tab: true };
  const big = Math.max(ra, rb), small = Math.min(ra, rb), s = Math.hypot(h, big - small);
  const Ro = (s * big) / (big - small), Ri = Ro - s, ang = (2 * Math.PI * big) / Ro, seg = 40, pts = [];
  for (let i = 0; i <= seg; i++) { const a = -ang / 2 + (ang * i) / seg; pts.push([Ro * Math.sin(a), -Ro * Math.cos(a)]); }
  for (let i = seg; i >= 0; i--) { const a = -ang / 2 + (ang * i) / seg; pts.push([Ri * Math.sin(a), -Ri * Math.cos(a)]); }
  let x0 = Infinity, x1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]); }
  return { pts: pts.map((p) => [p[0] - x0, p[1] - v0]), w: x1 - x0, h: v1 - v0, tab: true };
}

/** 재단표 한 줄을 평면 조각(사각형 + 윤곽)으로. 평면 재료가 아니면 null. */
export function flatPiece(row, N) {
  const m = row.mini, p = row.sample;
  // 윤곽이 있는 덩어리(쿠션·블록)도 도안은 평면이므로 템플릿에 싣는다.
  if (!FLAT.has(row.stock) && !(p.kind === 'ext' && !p.wall)) return null;
  if (row.stock === 'disc') return { w: m.d, h: m.d, circle: true, t: m.t };
  if (row.stock === 'cone') { if (p.kind !== 'lathe') return null; const d = coneDevelopment(p, N); return { w: d.w, h: d.h, pts: d.pts, t: 0.2 }; }
  if (row.stock === 'band') return { w: m.l, h: m.w, t: m.t };
  if (p.kind === 'ext' && !p.wall) {
    let u0 = Infinity, v0 = Infinity, u1 = -Infinity, v1 = -Infinity;
    for (const q of p.pts) { u0 = Math.min(u0, q[0]); v0 = Math.min(v0, q[1]); u1 = Math.max(u1, q[0]); v1 = Math.max(v1, q[1]); }
    return { w: (u1 - u0) / N, h: (v1 - v0) / N, pts: p.pts.map((q) => [(q[0] - u0) / N, (v1 - q[1]) / N]), t: m.t };
  }
  if (p.kind === 'rbox') return { w: m.l, h: m.w, t: m.t, r: Math.min(m.r || 0, m.w / 2) };
  return { w: m.l, h: m.w, t: m.t };
}

const rotPts = (pts, w) => pts.map(([x, y]) => [y, w - x]);

/**
 * 평면 부품을 인쇄 용지(또는 판재)에 배치한다. 선반(shelf) 방식 FFDH.
 * @returns groups: [{ key, title, t, kind, sheets: [{ placed:[{x,y,w,h,label,pts?,circle?,r?}], used }] }]
 */
export function nest(list, { sheetW = 277, sheetH = 170, gap = 2.5 } = {}) {
  const groups = new Map();
  for (const row of list.rows) {
    const pc = flatPiece(row, list.N);
    if (!pc) continue;
    const kind = row.stock === 'film' ? '투명판' : row.stock === 'cone' ? '종이 전개도' : row.stock === 'band' ? '띠' : row.stock === 'foam' || row.stock === 'block' ? '윤곽 도안' : '판재';
    const t = row.stock === 'cone' ? 0 : r1(pc.t);
    const key = `${kind}|${t}`;
    if (!groups.has(key)) groups.set(key, { key, kind, t, title: row.stock === 'cone' ? '종이 전개도' : `${kind} 두께 ${fmt(t, 1)}mm`, items: [], sheets: [], over: [] });
    const g = groups.get(key);
    for (let i = 0; i < row.qty; i++) {
      let { w, h, pts } = pc;
      let rot = false;
      if ((h > w && h <= sheetW && w <= sheetH) || (w > sheetW && h <= sheetW)) { [w, h] = [h, w]; rot = true; if (pts) pts = rotPts(pts, pc.w); }
      const it = { w, h, label: row.label, pts, circle: pc.circle, r: pc.r, rot, row };
      if (w > sheetW || h > sheetH) g.over.push(it); else g.items.push(it);
    }
  }
  const out = [];
  for (const g of groups.values()) {
    g.items.sort((a, b) => b.h - a.h || b.w - a.w);
    let sheet = null, shelves = [];
    const newSheet = () => { sheet = { placed: [], used: 0 }; shelves = []; g.sheets.push(sheet); };
    for (const it of g.items) {
      if (!sheet) newSheet();
      let done = false;
      for (let pass = 0; pass < 2 && !done; pass++) {
        for (const s of shelves) {
          if (s.x + it.w <= sheetW + 1e-6 && it.h <= s.h + 1e-6) { place(s); done = true; break; }
        }
        if (!done) {
          const y = shelves.length ? shelves[shelves.length - 1].y + shelves[shelves.length - 1].h + gap : 0;
          if (y + it.h <= sheetH + 1e-6) { const s = { x: 0, y, h: it.h }; shelves.push(s); place(s); done = true; }
          else if (pass === 0) newSheet();
        }
      }
      function place(s) {
        sheet.placed.push({ ...it, x: s.x, y: s.y });
        sheet.used += it.w * it.h;
        s.x += it.w + gap;
      }
    }
    for (const s of g.sheets) s.ratio = s.used / (sheetW * sheetH);
    g.area = g.items.reduce((a, it) => a + it.w * it.h, 0) + g.over.reduce((a, it) => a + it.w * it.h, 0);
    out.push(g);
  }
  out.sort((a, b) => a.kind.localeCompare(b.kind) || a.t - b.t);
  return { groups: out, sheetW, sheetH };
}

/** 각재·환봉·철사를 정해진 길이의 재료에서 잘라 내는 계획(1D FFD). */
export function linearPlan(list, stockLen = 300, kerf = 1) {
  const groups = new Map();
  for (const row of list.rows) {
    if (!LINEAR.has(row.stock)) continue;
    const m = row.mini;
    const sec = row.stock === 'stick' ? `${fmt(m.a)} × ${fmt(m.b)} 각재` : row.stock === 'rod' ? `Ø${fmt(m.d)} 환봉` : `Ø${fmt(m.d)} 철사`;
    if (!groups.has(sec)) groups.set(sec, { sec, stock: row.stock, pieces: [], total: 0 });
    const g = groups.get(sec);
    for (let i = 0; i < row.qty; i++) { g.pieces.push({ l: m.l, label: row.label }); g.total += m.l; }
  }
  const out = [];
  for (const g of groups.values()) {
    g.pieces.sort((a, b) => b.l - a.l);
    const bars = [];
    for (const p of g.pieces) {
      let bar = bars.find((b) => b.left >= p.l + kerf);
      if (!bar) { bar = { left: Math.max(stockLen, p.l + kerf), len: Math.max(stockLen, p.l + kerf), cuts: [] }; bars.push(bar); }
      bar.cuts.push(p); bar.left -= p.l + kerf;
    }
    g.bars = bars; g.count = bars.length;
    out.push(g);
  }
  return out;
}

/** 필요한 도구·재료 체크리스트. */
export function shoppingList(list, model) {
  const need = new Map();
  const add = (k, v) => need.set(k, (need.get(k) || 0) + v);
  for (const r of list.rows) {
    if (r.opt) continue;
    const m = r.mini;
    if (r.stock === 'sheet' || r.stock === 'profile' || r.stock === 'disc') add(`${fmt(r1(m.t))}mm 판재 (${r.material})`, (m.l || m.d) * (m.w || m.d) * r.qty);
    else if (r.stock === 'film') add(`${fmt(r1(m.t))}mm 투명판`, m.l * m.w * r.qty);
    else if (r.stock === 'stick') add(`${fmt(m.a)} × ${fmt(m.b)}mm 각재`, m.l * r.qty);
    else if (r.stock === 'rod') add(`Ø${fmt(m.d)}mm 환봉`, m.l * r.qty);
    else if (r.stock === 'wire') add(`Ø${fmt(m.d)}mm 철사`, m.l * r.qty);
    else if (r.stock === 'foam') add('스펀지 + 원단', m.l * m.w * r.qty);
  }
  const items = [...need.entries()].map(([name, v]) => ({ name, amount: name.includes('판') || name.includes('스펀지') ? `약 ${fmt(v / 100, 0)} cm²` : `약 ${fmt(v, 0)} mm` }));
  const roles = new Set(model.parts.map((p) => p.role));
  const tools = ['커터 칼과 쇠자', '커팅 매트', '목공 본드(또는 순간접착제)', '사포 400·800방', '마스킹 테이프', '핀셋'];
  if (model.parts.some((p) => p.kind === 'tube')) tools.push('롱노즈 플라이어(철사 구부리기)');
  if (model.parts.some((p) => p.stock === 'profile')) tools.push('실톱 또는 아트 나이프(곡선 재단)');
  if (roles.has('glass')) tools.push('UV 레진·투명 접착제');
  if (roles.has('fabric') || roles.has('cushion') || roles.has('seat')) tools.push('원단용 양면테이프·가위');
  return { items, tools };
}

export { FLAT, LINEAR };
