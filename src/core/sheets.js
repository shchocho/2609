// sheets.js — 제도 시트(A4 가로, 1 단위 = 1mm) SVG 생성.
// 삼면도 · 분해도+부품표 · 부품도 · 1:1 재단 템플릿 · 조립도.

import { projectParts, projectionSVG, VIEWS, isoView } from './project.js';
import { cutList, nest, flatPiece } from './cutlist.js';
import { fmt } from './scale.js';

export const PAGE = { w: 297, h: 210 };
export const SHEET_STYLES = {
  paper: { name: '종이', bg: '#ffffff', ink: '#15201c', thin: '#56635e', dim: '#1f5c4d', soft: '#eef1ee', hi: '#f4c430' },
  blueprint: { name: '청사진', bg: '#143d68', ink: '#f2f7fc', thin: '#a9c6e2', dim: '#ffd24a', soft: '#1b4a7c', hi: '#ffd24a' },
  night: { name: '야간', bg: '#0f1a16', ink: '#deefe7', thin: '#8fa89d', dim: '#f4c430', soft: '#16261f', hi: '#f4c430' },
};
const MONO = "'IBM Plex Mono','SF Mono',Menlo,Consolas,monospace";
const SANS = "'IBM Plex Sans KR','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif";
const r = (x) => Math.round(x * 100) / 100;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function txt(x, y, s, o = {}) {
  const { size = 2.6, anchor = 'start', weight = 400, fill, rot, mono = false, op } = o;
  return `<text x="${r(x)}" y="${r(y)}" font-size="${size}" font-family="${mono ? MONO : SANS}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}"${rot ? ` transform="rotate(${rot} ${r(x)} ${r(y)})"` : ''}${op ? ` opacity="${op}"` : ''}>${esc(s)}</text>`;
}
const ln = (x1, y1, x2, y2, stroke, sw = 0.18, dash) => `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

function arrow(x, y, dx, dy, c) {
  const l = 1.9, w = 0.55, nx = -dy, ny = dx;
  return `<path d="M${r(x)} ${r(y)}L${r(x + dx * l + nx * w)} ${r(y + dy * l + ny * w)}L${r(x + dx * l - nx * w)} ${r(y + dy * l - ny * w)}Z" fill="${c}"/>`;
}
/** 수평 치수선. y = 치수선 위치, ey = 물체 쪽 끝(치수 보조선 시작). */
function dimH(x0, x1, y, ey, label, S, sub) {
  const c = S.dim, up = y < ey ? -1 : 1;
  let s = ln(x0, ey + up * 0.8, x0, y + up * 1.2, c, 0.13) + ln(x1, ey + up * 0.8, x1, y + up * 1.2, c, 0.13) + ln(x0, y, x1, y, c, 0.16);
  if (x1 - x0 > 5) s += arrow(x0, y, 1, 0, c) + arrow(x1, y, -1, 0, c);
  s += txt((x0 + x1) / 2, y - 0.9, label, { size: 2.5, anchor: 'middle', fill: S.ink, mono: true, weight: 500 });
  if (sub) s += txt((x0 + x1) / 2, y + 2.7, sub, { size: 1.9, anchor: 'middle', fill: S.thin, mono: true });
  return s;
}
function dimV(y0, y1, x, ex, label, S, sub) {
  const c = S.dim, lf = x < ex ? -1 : 1;
  let s = ln(ex + lf * 0.8, y0, x + lf * 1.2, y0, c, 0.13) + ln(ex + lf * 0.8, y1, x + lf * 1.2, y1, c, 0.13) + ln(x, y0, x, y1, c, 0.16);
  if (y1 - y0 > 5) s += arrow(x, y0, 0, 1, c) + arrow(x, y1, 0, -1, c);
  const cy = (y0 + y1) / 2;
  s += txt(x - 0.9, cy, label, { size: 2.5, anchor: 'middle', fill: S.ink, mono: true, weight: 500, rot: -90 });
  if (sub) s += txt(x + 2.7, cy, sub, { size: 1.9, anchor: 'middle', fill: S.thin, mono: true, rot: -90 });
  return s;
}

const SCALES = [['5:1', 5], ['3:1', 3], ['2:1', 2], ['1.5:1', 1.5], ['1:1', 1], ['1:1.5', 1 / 1.5], ['1:2', 0.5], ['1:3', 1 / 3], ['1:4', 0.25], ['1:5', 0.2], ['1:10', 0.1], ['1:20', 0.05]];
const pickScale = (max) => SCALES.find((s) => s[1] <= max + 1e-9) || SCALES[SCALES.length - 1];

function place(proj, k, x, y, styleFn, sw) {
  const [x0, y0] = proj.bbox;
  return `<g transform="translate(${r(x - x0 * k)} ${r(y - y0 * k)}) scale(${r(k * 1000) / 1000})" stroke-linejoin="round" stroke-linecap="round">${projectionSVG(proj, styleFn, { sw: sw / k })}</g>`;
}
const lineStyle = (S, sw) => (p) => (p.role === 'glass' ? { fill: S.bg, fo: 0.35, stroke: S.thin, sw: sw * 0.7 } : { fill: S.bg, stroke: S.ink });

/** 시트 테두리·구역 표시·표제란. */
function frame(S, meta) {
  const { w, h } = PAGE, m = 8;
  let s = `<rect x="0" y="0" width="${w}" height="${h}" fill="${S.bg}"/>`;
  s += `<rect x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}" fill="none" stroke="${S.ink}" stroke-width="0.5"/>`;
  for (let i = 0; i < 8; i++) {
    const x = m + ((w - 2 * m) / 8) * (i + 0.5);
    s += txt(x, m - 1.6, String(i + 1), { size: 2.1, anchor: 'middle', fill: S.thin, mono: true }) + txt(x, h - m + 3.6, String(i + 1), { size: 2.1, anchor: 'middle', fill: S.thin, mono: true });
    if (i) { const xx = m + ((w - 2 * m) / 8) * i; s += ln(xx, m - 2.4, xx, m, S.thin, 0.13) + ln(xx, h - m, xx, h - m + 2.4, S.thin, 0.13); }
  }
  for (let i = 0; i < 6; i++) {
    const y = m + ((h - 2 * m) / 6) * (i + 0.5), c = 'ABCDEF'[i];
    s += txt(m - 3.4, y + 0.8, c, { size: 2.1, anchor: 'middle', fill: S.thin, mono: true }) + txt(w - m + 3.4, y + 0.8, c, { size: 2.1, anchor: 'middle', fill: S.thin, mono: true });
    if (i) { const yy = m + ((h - 2 * m) / 6) * i; s += ln(m - 2.4, yy, m, yy, S.thin, 0.13) + ln(w - m, yy, w - m + 2.4, yy, S.thin, 0.13); }
  }
  // 표제란
  const bx = m, bw = w - 2 * m, by = h - m - 20, cols = [0, 78, 128, 160, 196, 236, bw];
  s += ln(bx, by, bx + bw, by, S.ink, 0.5) + ln(bx + cols[1], by + 10, bx + bw, by + 10, S.ink, 0.18);
  for (const c of cols.slice(1, -1)) s += ln(bx + c, by, bx + c, by + 20, S.ink, 0.18);
  const cell = (ci, row, label, value, o = {}) => {
    const x = bx + cols[ci] + 2, y = by + row * 10;
    return txt(x, y + 3.2, label, { size: 1.8, fill: S.thin }) + txt(x, y + 8, value, { size: o.size || 3.2, fill: S.ink, weight: o.weight || 500, mono: o.mono });
  };
  s += txt(bx + 2, by + 3.2, '품명', { size: 1.8, fill: S.thin });
  s += txt(bx + 2, by + 11, meta.name, { size: 6.4, fill: S.ink, weight: 700 });
  s += txt(bx + 2, by + 17.2, meta.sub, { size: 3, fill: S.thin, weight: 500 });
  s += cell(1, 0, '도면', meta.title) + cell(1, 1, '도번', meta.code, { mono: true });
  s += cell(2, 0, '축척', meta.scale, { mono: true }) + cell(2, 1, '단위', 'mm', { mono: true });
  s += cell(3, 0, '미니어처 축척', `1:${meta.N}`, { mono: true }) + cell(3, 1, '투상법', '제3각법');
  s += cell(4, 0, '미니어처 크기 (폭×깊이×높이)', meta.mini, { mono: true, size: 2.9 }) + cell(4, 1, '실물 크기', meta.real, { mono: true, size: 2.9 });
  s += cell(5, 0, '시트', meta.page, { mono: true }) + cell(5, 1, '작성', meta.date, { mono: true, size: 2.9 });
  // 제3각법 기호
  const px = bx + cols[4] - 12, py = by + 15.5;
  s += `<circle cx="${px}" cy="${py}" r="2.2" fill="none" stroke="${S.ink}" stroke-width="0.2"/><circle cx="${px}" cy="${py}" r="1.1" fill="none" stroke="${S.ink}" stroke-width="0.2"/>`;
  s += `<path d="M${px + 4} ${py - 1.1}L${px + 9} ${py - 2.2}L${px + 9} ${py + 2.2}L${px + 4} ${py + 1.1}Z" fill="none" stroke="${S.ink}" stroke-width="0.2"/>`;
  s += txt(w - m - 2, m + 4.2, 'MINIATYR', { size: 2.4, anchor: 'end', fill: S.thin, weight: 700 });
  return s;
}

function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}" width="${PAGE.w}mm" height="${PAGE.h}mm">${body}</svg>`;
}

const d1 = (v, N) => fmt(v / N, 1);

// ---------------------------------------------------------------- 1. 삼면도
function sheetGA(model, ctx) {
  const { S, N } = ctx, parts = model.parts.filter((p) => !p.opt);
  const [W, H, D] = model.bbox.size;
  const kMax = Math.min((172 - 36) / (W + D), (150 - 34) / (H + D));
  const sc = pickScale(kMax * N), k = sc[1] / N, sw = 0.3;
  const gx = 20, gy = 15;
  const bw = (W + D) * k + gx, bh = (H + D) * k + gy;
  const ox = 22 + Math.max(0, (166 - bw) / 2), oy = 16 + Math.max(0, (150 - bh) / 2);
  const st = lineStyle(S, sw);
  const front = projectParts(parts, { view: VIEWS.front }), top = projectParts(parts, { view: VIEWS.top }), right = projectParts(parts, { view: VIEWS.right });
  const fx = ox, fy = oy + D * k + gy, rx = ox + W * k + gx;
  let s = '';
  s += place(top, k, ox, oy, st, sw) + place(front, k, fx, fy, st, sw) + place(right, k, rx, fy, st, sw);
  // 치수
  s += dimH(fx, fx + W * k, fy + H * k + 8, fy + H * k, d1(W, N), S, `(${fmt(W, 0)})`);
  s += dimV(fy, fy + H * k, fx - 8, fx, d1(H, N), S, `(${fmt(H, 0)})`);
  s += dimH(rx, rx + D * k, fy + H * k + 8, fy + H * k, d1(D, N), S, `(${fmt(D, 0)})`);
  s += dimV(oy, oy + D * k, ox - 8, ox, d1(D, N), S);
  const cap = (x, y, t) => txt(x, y, t, { size: 2.3, fill: S.thin, weight: 600 });
  s += cap(ox, oy - 2.4, '평면도') + cap(fx, fy - 2.4, '정면도') + cap(rx, fy - 2.4, '우측면도');
  // 등각도
  const iso = projectParts(parts, { view: isoView(35, 24) }), [a0, b0, a1, b1] = iso.bbox;
  const ik = Math.min(86 / (a1 - a0), 112 / (b1 - b0));
  const ix = 196 + (88 - (a1 - a0) * ik) / 2, iy = 20 + (116 - (b1 - b0) * ik) / 2;
  s += place(iso, ik, ix, iy, (p) => (p.role === 'glass' ? { fill: S.bg, fo: 0.35, stroke: S.thin } : { fill: S.bg, stroke: S.ink }), 0.26);
  s += cap(196, 17, '등각 투상도');
  s += ln(190, 12, 190, 176, S.thin, 0.13, '1 1.4');
  const notes = ['치수는 미니어처 기준 mm, 괄호 안은 실물 mm.', `그림 축척 ${sc[0]} — ${sc[1] === 1 ? '인쇄물에서 바로 재어 쓸 수 있습니다.' : '치수 숫자를 기준으로 작업하세요.'}`, '치수는 참고용 근사치입니다.'];
  notes.forEach((t, i) => { s += txt(196, 146 + i * 4.6, `· ${t}`, { size: 2.2, fill: S.thin }); });
  return { id: 'ga', code: '01', title: '삼면도', scale: sc[0], body: s };
}

// ---------------------------------------------------------------- 2. 분해도 + 부품표
function sheetEX(model, ctx) {
  const { S, list } = ctx, parts = model.parts.filter((p) => !p.opt);
  const span = Math.max(...model.bbox.size), E = span * 0.42, steps = model.steps.length || 1;
  const view = isoView(35, 24);
  const proj = projectParts(parts, { view, offset: (p) => { const f = E * (0.5 + 0.5 * (p.step / steps)); return [p.ex[0] * f, p.ex[1] * f, p.ex[2] * f]; } });
  const [a0, b0, a1, b1] = proj.bbox, pw = a1 - a0, ph = b1 - b0;
  const k = Math.min(128 / pw, 142 / ph), ox = 38 + (128 - pw * k) / 2, oy = 16 + (148 - ph * k) / 2;
  let s = place(proj, k, ox, oy, lineStyle(S, 0.26), 0.26);
  const pos = new Map(proj.items.map((it) => [it.part.id, [ox + (it.cx - a0) * k, oy + (it.cy - b0) * k]]));
  const rows = list.rows.filter((rw) => !rw.opt);
  const marks = rows.slice(0, 26).map((rw) => { const id = rw.parts.find((x) => pos.has(x)); return id ? { rw, p: pos.get(id) } : null; }).filter(Boolean);
  const mid = ox + (pw * k) / 2;
  const sides = [marks.filter((m) => m.p[0] < mid), marks.filter((m) => m.p[0] >= mid)];
  sides.forEach((arr, si) => {
    arr.sort((a, b) => a.p[1] - b.p[1]);
    const bx = si === 0 ? 20 : 180, n = arr.length, y0 = 22, y1 = 166;
    arr.forEach((m, i) => {
      const by = n === 1 ? (y0 + y1) / 2 : Math.max(y0, Math.min(y1, m.p[1] * 0.5 + (y0 + ((y1 - y0) * (i + 0.5)) / n) * 0.5));
      m.by = i > 0 ? Math.max(by, arr[i - 1].by + 7.4) : by;
      s += ln(m.p[0], m.p[1], bx + (si === 0 ? 3.2 : -3.2), m.by, S.dim, 0.14);
      s += `<circle cx="${r(m.p[0])}" cy="${r(m.p[1])}" r="0.55" fill="${S.dim}"/>`;
      s += `<circle cx="${bx}" cy="${r(m.by)}" r="3.2" fill="${S.bg}" stroke="${S.ink}" stroke-width="0.25"/>`;
      s += txt(bx, m.by + 1, m.rw.label, { size: 2.9, anchor: 'middle', fill: S.ink, mono: true, weight: 600 });
    });
  });
  // 부품표
  const tx = 192, tw = 92, ty = 14, rh = 5.1, max = Math.min(rows.length, 29);
  s += ln(tx - 4, 12, tx - 4, 176, S.thin, 0.13, '1 1.4');
  s += txt(tx, ty + 2, '부품표', { size: 2.6, fill: S.ink, weight: 700 });
  const hy = ty + 7;
  s += txt(tx, hy, '부호', { size: 1.9, fill: S.thin }) + txt(tx + 9, hy, '부품', { size: 1.9, fill: S.thin }) + txt(tx + 46, hy, '수량', { size: 1.9, fill: S.thin, anchor: 'end' }) + txt(tx + tw, hy, '미니어처 치수 (mm)', { size: 1.9, fill: S.thin, anchor: 'end' });
  s += ln(tx, hy + 1.4, tx + tw, hy + 1.4, S.ink, 0.25);
  for (let i = 0; i < max; i++) {
    const rw = rows[i], y = hy + 5 + i * rh;
    s += txt(tx, y, rw.label, { size: 2.4, fill: S.ink, mono: true, weight: 600 }) + txt(tx + 9, y, rw.name.slice(0, 12), { size: 2.4, fill: S.ink }) + txt(tx + 46, y, String(rw.qty), { size: 2.4, fill: S.ink, mono: true, anchor: 'end' }) + txt(tx + tw, y, rw.dim, { size: 2.2, fill: S.ink, mono: true, anchor: 'end' });
    s += ln(tx, y + 1.5, tx + tw, y + 1.5, S.thin, 0.08);
  }
  if (rows.length > max) s += txt(tx, hy + 5 + max * rh + 1, `외 ${rows.length - max}종 — 부품도 참조`, { size: 2.1, fill: S.thin });
  return { id: 'ex', code: '02', title: '분해도 · 부품표', scale: 'NTS', body: s };
}

// ---------------------------------------------------------------- 3. 부품도
function partShape(rw, N, S, cx, cy, mw, mh) {
  const m = rw.mini, pc = flatPiece(rw, N);
  let w, h, kind = 'rect', pts = null, rad = 0;
  if (pc) { w = pc.w; h = pc.h; pts = pc.pts || null; if (pc.circle) kind = 'circle'; rad = pc.r || 0; }
  else if (rw.stock === 'stick') { w = m.l; h = m.a; }
  else if (rw.stock === 'rod' || rw.stock === 'turn' || rw.stock === 'wire') { w = m.l; h = Math.max(m.d, 0.3); kind = 'rod'; }
  else if (rw.stock === 'bead') { w = h = m.d; kind = 'circle'; }
  else { w = m.l; h = m.w; rad = rw.stock === 'foam' ? Math.min(m.r || h * 0.2, h / 2) : 0; }
  const k = Math.min(1, mw / w, mh / h), dw = w * k, dh = Math.max(h * k, 0.3), x = cx - dw / 2, y = cy - dh / 2;
  let s = '';
  if (pts) s += `<path d="${pts.map((q, i) => `${i ? 'L' : 'M'}${r(x + q[0] * k)} ${r(y + q[1] * k)}`).join('')}Z" fill="${S.soft}" stroke="${S.ink}" stroke-width="0.3" stroke-linejoin="round"/>`;
  else if (kind === 'circle') s += `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(dw / 2)}" fill="${S.soft}" stroke="${S.ink}" stroke-width="0.3"/>` + ln(cx - dw / 2 - 1.5, cy, cx + dw / 2 + 1.5, cy, S.thin, 0.1, '3 0.8 0.6 0.8') + ln(cx, cy - dw / 2 - 1.5, cx, cy + dw / 2 + 1.5, S.thin, 0.1, '3 0.8 0.6 0.8');
  else s += `<rect x="${r(x)}" y="${r(y)}" width="${r(dw)}" height="${r(dh)}" rx="${r(rad * k)}" fill="${S.soft}" stroke="${S.ink}" stroke-width="0.3"/>`;
  if (kind === 'rod') s += ln(x - 1.5, cy, x + dw + 1.5, cy, S.thin, 0.1, '3 0.8 0.6 0.8');
  if (kind !== 'circle') {
    s += dimH(x, x + dw, y + dh + 5, y + dh, fmt(w, 1), S);
    if (h * k > 3 && kind !== 'rod') s += dimV(y, y + dh, x - 5, x, fmt(h, 1), S);
  } else s += txt(cx, y + dh + 5, `Ø${fmt(w, 1)}`, { size: 2.5, anchor: 'middle', fill: S.ink, mono: true, weight: 500 });
  return { s, k };
}

function sheetsPT(model, ctx) {
  const { S, list, N } = ctx, rows = list.rows.filter((rw) => !rw.opt), per = 12, out = [];
  const cw = 69.5, chh = 54, x0 = 10, y0 = 11;
  for (let pg = 0; pg * per < rows.length; pg++) {
    let s = '';
    rows.slice(pg * per, pg * per + per).forEach((rw, i) => {
      const cx0 = x0 + (i % 4) * cw, cy0 = y0 + Math.floor(i / 4) * chh;
      s += `<rect x="${r(cx0 + 1)}" y="${r(cy0 + 1)}" width="${cw - 2}" height="${chh - 2}" fill="none" stroke="${S.thin}" stroke-width="0.1"/>`;
      s += `<circle cx="${r(cx0 + 6.5)}" cy="${r(cy0 + 6.8)}" r="3.4" fill="${S.hi}"/>` + txt(cx0 + 6.5, cy0 + 7.9, rw.label, { size: 3, anchor: 'middle', fill: '#15201c', mono: true, weight: 700 });
      s += txt(cx0 + 12, cy0 + 6.4, rw.name, { size: 2.8, fill: S.ink, weight: 700 }) + txt(cx0 + 12, cy0 + 10, `${rw.info.ko} · ${rw.material}`.slice(0, 26), { size: 1.9, fill: S.thin });
      s += txt(cx0 + cw - 3, cy0 + 7.2, `×${rw.qty}`, { size: 3.6, anchor: 'end', fill: S.ink, mono: true, weight: 600 });
      const { s: shape, k } = partShape(rw, N, S, cx0 + cw / 2 + 2, cy0 + 28, cw - 22, 20);
      s += shape;
      const m = rw.mini, extra = rw.stock === 'sheet' || rw.stock === 'profile' || rw.stock === 'film' || rw.stock === 'foam' || rw.stock === 'block' ? `두께 ${fmt(m.t, 1)}` : rw.stock === 'stick' ? `단면 ${fmt(m.a, 1)}×${fmt(m.b, 1)}` : rw.stock === 'rod' || rw.stock === 'wire' || rw.stock === 'turn' ? `지름 ${fmt(m.d, 1)}` : rw.stock === 'disc' ? `두께 ${fmt(m.t, 1)}` : rw.stock === 'band' ? `두께 ${fmt(m.t, 1)}` : '';
      s += txt(cx0 + 3, cy0 + chh - 3.4, extra, { size: 2.2, fill: S.ink, mono: true }) + txt(cx0 + cw - 3, cy0 + chh - 3.4, k < 0.999 ? `그림 ${fmt(k * 100, 0)}%` : '그림 1:1', { size: 1.9, anchor: 'end', fill: S.thin, mono: true });
    });
    out.push({ id: `pt${pg + 1}`, code: `03-${pg + 1}`, title: `부품도 ${pg + 1}`, scale: '표기', body: s });
  }
  return out;
}

// ---------------------------------------------------------------- 4. 재단 템플릿(1:1)
export const TEMPLATE_AREA = { x: 12, y: 20, w: 273, h: 150 };
function sheetsCT(model, ctx) {
  const { S, list } = ctx, A = TEMPLATE_AREA, out = [];
  const nested = nest(list, { sheetW: A.w, sheetH: A.h, gap: 2.5 });
  let n = 0;
  for (const g of nested.groups) {
    const pages = g.sheets.length ? g.sheets : [{ placed: [] }];
    pages.forEach((sh, si) => {
      n++;
      let s = txt(A.x, 15.5, `${g.title} — ${si + 1}/${pages.length}`, { size: 3.4, fill: S.ink, weight: 700 });
      s += txt(A.x + 92, 15.5, '실제 크기(100%)로 인쇄 → 재료에 붙여 선을 따라 자릅니다.', { size: 2.2, fill: S.thin });
      // 검증 눈금 50mm
      const rx = A.x + A.w - 86;
      s += ln(rx, 14, rx + 50, 14, S.ink, 0.3);
      for (let i = 0; i <= 50; i += 5) s += ln(rx + i, 14, rx + i, i % 10 === 0 ? 11.4 : 12.6, S.ink, 0.2);
      s += txt(rx + 25, 17.6, '50mm 확인 눈금', { size: 1.9, anchor: 'middle', fill: S.thin, mono: true });
      for (const p of sh.placed) {
        const x = A.x + p.x, y = A.y + p.y;
        if (p.pts) s += `<path d="${p.pts.map((q, i) => `${i ? 'L' : 'M'}${r(x + q[0])} ${r(y + q[1])}`).join('')}Z" fill="${S.soft}" stroke="${S.ink}" stroke-width="0.2" stroke-linejoin="round"/>`;
        else if (p.circle) s += `<circle cx="${r(x + p.w / 2)}" cy="${r(y + p.h / 2)}" r="${r(p.w / 2)}" fill="${S.soft}" stroke="${S.ink}" stroke-width="0.2"/><path d="M${r(x + p.w / 2 - 1)} ${r(y + p.h / 2)}h2M${r(x + p.w / 2)} ${r(y + p.h / 2 - 1)}v2" stroke="${S.ink}" stroke-width="0.12"/>`;
        else s += `<rect x="${r(x)}" y="${r(y)}" width="${r(p.w)}" height="${r(p.h)}" rx="${r(p.r || 0)}" fill="${S.soft}" stroke="${S.ink}" stroke-width="0.2"/>`;
        const fs = Math.max(1.6, Math.min(3.4, Math.min(p.w, p.h) * 0.55));
        if (Math.min(p.w, p.h) >= 2.2) s += txt(x + p.w / 2, y + p.h / 2 + fs * 0.36, p.label, { size: fs, anchor: 'middle', fill: S.ink, mono: true, weight: 600 });
        if (p.w > 26 && p.h > 9) s += txt(x + p.w - 1.2, y + p.h - 1.2, `${fmt(p.rot ? p.h : p.w, 1)}×${fmt(p.rot ? p.w : p.h, 1)}`, { size: 1.7, anchor: 'end', fill: S.thin, mono: true });
      }
      if (si === 0 && g.over.length) s += txt(A.x, A.y + A.h + 3.4, `용지보다 큰 부품: ${[...new Set(g.over.map((o) => `${o.label} ${fmt(o.w, 1)}×${fmt(o.h, 1)}`))].join(', ')} — 치수대로 재료에 직접 그리세요.`, { size: 2.1, fill: S.dim, weight: 600 });
      out.push({ id: `ct${n}`, code: `04-${n}`, title: `재단 템플릿 ${n}`, scale: '1:1', body: s, template: true, group: g.title });
    });
  }
  return out;
}

// ---------------------------------------------------------------- 5. 조립도
function sheetsAS(model, ctx) {
  const { S } = ctx, steps = model.steps, out = [], per = 6, view = isoView(35, 24);
  const all = model.parts.filter((p) => !p.opt);
  const full = projectParts(all, { view }), [a0, b0, a1, b1] = full.bbox;
  const pw = 92, ph = 80, k = Math.min((pw - 14) / (a1 - a0), (ph - 26) / (b1 - b0));
  for (let pg = 0; pg * per < steps.length; pg++) {
    let s = '';
    steps.slice(pg * per, pg * per + per).forEach((st, i) => {
      const x0 = 10 + (i % 3) * pw, y0 = 11 + Math.floor(i / 3) * ph;
      s += `<rect x="${r(x0 + 1)}" y="${r(y0 + 1)}" width="${pw - 2}" height="${ph - 2}" fill="none" stroke="${S.thin}" stroke-width="0.1"/>`;
      const proj = projectParts(all, { view, filter: (p) => p.step <= st.n });
      const gx = x0 + (pw - (a1 - a0) * k) / 2 - a0 * k, gy = y0 + 20 + (ph - 26 - (b1 - b0) * k) / 2 - b0 * k;
      const body = projectionSVG(proj, (p) => (p.step === st.n ? { fill: S.bg, stroke: S.ink, sw: 0.34 / k } : { fill: S.soft, stroke: S.thin, sw: 0.16 / k }), { sw: 0.2 / k });
      s += `<g transform="translate(${r(gx)} ${r(gy)}) scale(${r(k * 1000) / 1000})" stroke-linejoin="round" stroke-linecap="round">${body}</g>`;
      s += `<rect x="${r(x0 + 4)}" y="${r(y0 + 4)}" width="8.4" height="8.4" fill="${S.ink}"/>` + txt(x0 + 8.2, y0 + 10.4, String(st.n), { size: 5.4, anchor: 'middle', fill: S.bg, mono: true, weight: 700 });
      s += txt(x0 + 15, y0 + 8, st.title, { size: 3.3, fill: S.ink, weight: 700 });
      const d = st.desc.length > 44 ? [st.desc.slice(0, 44), st.desc.slice(44, 88) + (st.desc.length > 88 ? '…' : '')] : [st.desc];
      d.forEach((t, j) => { s += txt(x0 + 15, y0 + 12.2 + j * 3.2, t, { size: 2, fill: S.thin }); });
    });
    out.push({ id: `as${pg + 1}`, code: `05-${pg + 1}`, title: `조립도 ${pg + 1}`, scale: 'NTS', body: s });
  }
  return out;
}

/** 한 모델의 전체 도면 세트. */
export function buildSheets(model, opts = {}) {
  const S = SHEET_STYLES[opts.style] || SHEET_STYLES.paper, N = model.N, list = opts.list || cutList(model);
  const ctx = { S, N, list };
  const raw = [sheetGA(model, ctx), sheetEX(model, ctx), ...sheetsPT(model, ctx), ...sheetsCT(model, ctx), ...sheetsAS(model, ctx)];
  const it = model.item, [W, H, D] = model.bbox.size;
  const date = opts.date || new Date().toISOString().slice(0, 10);
  return raw.map((sh, i) => {
    const meta = {
      name: it.name, sub: `${it.type}${model.variant ? ` · ${model.variant.label}` : ''}${opts.finish ? ` · ${opts.finish}` : ''}`,
      title: sh.title, code: `MN-${String(it.no).padStart(3, '0')}-${sh.code}`, scale: sh.scale, N,
      mini: `${fmt(W / N, 1)} × ${fmt(D / N, 1)} × ${fmt(H / N, 1)}`, real: `${fmt(W, 0)} × ${fmt(D, 0)} × ${fmt(H, 0)}`,
      page: `${i + 1} / ${raw.length}`, date,
    };
    return { id: sh.id, title: sh.title, code: meta.code, template: !!sh.template, svg: wrap(frame(S, meta) + sh.body) };
  });
}
