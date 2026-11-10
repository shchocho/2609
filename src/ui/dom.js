// dom.js — DOM 헬퍼, 아이콘, 토스트, 3D 틸트, 저장소, 파일 저장.

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const P = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  ruler: '<path d="m3.5 16.5 13-13 4 4-13 13Z"/><path d="m7 13 1.6 1.6M10 10l1.6 1.6M13 7l1.6 1.6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 12.5 9 5 9-5M3 17l9 5 9-5"/>',
  cut: '<circle cx="6" cy="6.5" r="2.6"/><circle cx="6" cy="17.5" r="2.6"/><path d="m8.2 8 12.3 9.5M8.2 16 20.5 6.5"/>',
  play: '<path d="M7 4.5v15l12-7.5Z"/>',
  pause: '<path d="M7 5v14M17 5v14"/>',
  prev: '<path d="m14 6-6 6 6 6"/>',
  next: '<path d="m10 6 6 6-6 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  down: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  grid: '<path d="M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z"/>',
  bars: '<path d="M4 20V10M9.3 20V4M14.6 20v-7M20 20V8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  warn: '<path d="m12 3.5 9.5 16.5h-19Z"/><path d="M12 10v4.5M12 17v.5"/>',
  bulb: '<path d="M9 18h6M10 21h4M8.5 15a6 6 0 1 1 7 0c-.6.5-1 1.2-1 2h-5c0-.8-.4-1.5-1-2Z"/>',
  split: '<path d="M12 3v18M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
  dims: '<path d="M4 6v12M20 6v12M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  spin: '<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21Z"/><path d="M4 21V5.5M8 7.5h8"/>',
  bench: '<path d="M3 9h18v3H3ZM5.5 12v8M18.5 12v8M9 9V5.5h6V9"/>',
  home: '<path d="m3.5 11 8.5-7 8.5 7M6 9.5V20h12V9.5"/>',
  pillow: '<path d="M4 8.5c2.5-2 13.500-2 16 0 1 2.300 1 4.700 0 7-2.500 2-13.500 2-16 0-1-2.300-1-4.700 0-7Z"/>',
  camera: '<path d="M4 8h3l1.500-2.500h7L17 8h3v11H4Z"/><circle cx="12" cy="13.300" r="3.300"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
};
export function icon(name, cls) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${cls ? ` class="${cls}"` : ''}>${P[name] || ''}</svg>`;
}
export const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="7" fill="var(--mat)"/><path d="M6 11h20M6 16h20M6 21h20M11 6v20M16 6v20M21 6v20" stroke="rgba(236,246,241,.28)" stroke-width="1"/><path d="m16 8 7 4v8l-7 4-7-4v-8Z" fill="var(--tape)" stroke="var(--on-tape)" stroke-width="1.3" stroke-linejoin="round"/><path d="m9 12 7 4 7-4M16 16v8" fill="none" stroke="var(--on-tape)" stroke-width="1.3" stroke-linejoin="round"/></svg>';

// ---------------------------------------------------------------- 토스트
let toastBox = null;
export function toast(msg, ms = 2600) {
  if (!toastBox) { toastBox = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.append(toastBox); }
  const t = h('div', { class: 'toast' }, msg);
  toastBox.append(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, ms);
}

// ---------------------------------------------------------------- 3D 틸트 (포인터를 따라 기울고 빛 반사가 움직인다)
export function tilt(container, selector, max = 7) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || calm) return () => {};
  let cur = null;
  const move = (e) => {
    const el = e.target.closest(selector);
    if (cur && cur !== el) reset(cur);
    cur = el;
    if (!el) return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
  };
  const reset = (el) => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
  const leave = () => { if (cur) reset(cur); cur = null; };
  container.addEventListener('pointermove', move);
  container.addEventListener('pointerleave', leave);
  return () => { container.removeEventListener('pointermove', move); container.removeEventListener('pointerleave', leave); };
}

// ---------------------------------------------------------------- 저장소 (브라우저에만 남는 개인 설정·진행 기록)
const KEY = 'miniatyr.v1';
const DEF = { N: 12, fit: false, theme: 'system', sheetStyle: 'paper', mmpx: 96 / 25.4, items: {} };
/** 저장된 값·가져온 백업은 믿지 않는다: 아는 필드만, 아는 형태로만 받아들인다. */
function sanitize(raw) {
  const o = raw && typeof raw === 'object' ? raw : {}, out = { ...DEF, items: {} };
  if ([6, 12, 18, 24, 48].includes(o.N)) out.N = o.N;
  out.fit = o.fit === true;
  if (['system', 'light', 'dark'].includes(o.theme)) out.theme = o.theme;
  if (['paper', 'blueprint', 'night'].includes(o.sheetStyle)) out.sheetStyle = o.sheetStyle;
  if (Number.isFinite(o.mmpx) && o.mmpx >= 2.4 && o.mmpx <= 6.5) out.mmpx = o.mmpx;
  if (o.items && typeof o.items === 'object') {
    for (const [id, v] of Object.entries(o.items).slice(0, 400)) {
      if (!/^[a-z0-9-]{1,40}$/.test(id) || !v || typeof v !== 'object') continue;
      const it = {};
      if (typeof v.variant === 'string' && /^[a-z0-9]{1,16}$/.test(v.variant)) it.variant = v.variant;
      if (Number.isInteger(v.fin) && v.fin >= 0 && v.fin < 20) it.fin = v.fin;
      if (Array.isArray(v.done)) it.done = [...new Set(v.done.filter((n) => Number.isInteger(n) && n > 0 && n < 100))];
      if (Number.isFinite(v.started)) it.started = v.started;
      out.items[id] = it;
    }
  }
  return out;
}
let state = { ...DEF, items: {} };
try { const raw = localStorage.getItem(KEY); if (raw) state = sanitize(JSON.parse(raw)); } catch { /* 저장소를 쓸 수 없으면 기본값으로 동작 */ }
const subs = new Set();
export const store = {
  get: (k) => state[k],
  set(k, v) { state[k] = v; this.save(); subs.forEach((f) => f(k, v)); },
  item(id) { return state.items[id] || {}; },
  setItem(id, patch) { state.items[id] = { ...(state.items[id] || {}), ...patch }; this.save(); },
  dropItem(id) { delete state.items[id]; this.save(); },
  all: () => state,
  replace(next) { state = sanitize(next); this.save(); },
  save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 무시 */ } },
  on(f) { subs.add(f); return () => subs.delete(f); },
};

// ---------------------------------------------------------------- 파일 저장
// 독립 실행 시에는 일반 다운로드, Claude 아티팩트 안에서는 downloads 기능을 쓴다(허용 확장자가 아니면 zip으로 감싼다).
const ALLOWED = new Set(['gif', 'png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'txt', 'json', 'md', 'csv', 'html', 'svg', 'pdf', 'zip']);
const framed = (() => { try { return window.self !== window.top || !!(window.claude && window.claude.use); } catch { return true; } })();
let dlReady = null;
function downloads() {
  if (!dlReady) dlReady = window.claude && window.claude.use ? Promise.race([window.claude.use('downloads'), new Promise((r) => setTimeout(() => r(null), 4000))]).catch(() => null) : Promise.resolve(null);
  return dlReady;
}
export const inArtifact = () => !!(window.claude && window.claude.use);

export async function saveFile(filename, data, mime = 'application/octet-stream') {
  const dl = await downloads();
  if (dl) {
    let name = filename, body = data;
    const ext = filename.split('.').pop().toLowerCase();
    if (!ALLOWED.has(ext)) {
      const { zip } = await import('../core/export.js');
      const raw = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
      body = zip([{ name: filename, data: raw }]);
      name = `${filename}.zip`;
    }
    try { await dl.save({ filename: name, data: body instanceof Uint8Array ? new Blob([body]) : body }); toast(`저장했습니다: ${name}`); return true; }
    catch (e) { toast(e && e.code === 'declined' ? '저장을 취소했습니다.' : '이 화면에서는 파일을 저장할 수 없습니다.'); return false; }
  }
  if (framed && inArtifact()) { toast('이 화면에서는 파일을 저장할 수 없습니다.'); return false; }
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const a = h('a', { href: URL.createObjectURL(blob), download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast(`내려받았습니다: ${filename}`);
  return true;
}

/** SVG 문자열 → 캔버스(인쇄용 래스터). */
export function svgToCanvas(svg, w, hgt, bg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = w; c.height = hgt;
      const x = c.getContext('2d');
      if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, hgt); }
      x.drawImage(img, 0, 0, w, hgt);
      resolve(c);
    };
    img.onerror = () => reject(new Error('도면을 그림으로 바꾸지 못했습니다.'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}
export const canvasBlob = (c, type = 'image/png', q) => new Promise((r) => c.toBlob(r, type, q));

/** 숫자가 바뀔 때 계기판처럼 굴러가며 바뀐다. */
export function tick(el, text) {
  if (el.textContent === text) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return; }
  const from = el.textContent, n = Math.max(from.length, text.length), t0 = performance.now(), dur = 380;
  cancelAnimationFrame(el._tick);
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur), cut = Math.floor(k * n);
    let s = text.slice(0, cut);
    for (let i = cut; i < text.length; i++) s += /[0-9]/.test(text[i]) ? String(Math.floor(Math.random() * 10)) : text[i];
    el.textContent = s;
    if (k < 1) el._tick = requestAnimationFrame(step); else el.textContent = text;
  };
  el._tick = requestAnimationFrame(step);
}

export const thumb = (id) => `assets/thumbs/${id}.webp`;
export const no3 = (n) => String(n).padStart(3, '0');
export function pips(n, max = 5) { return `<span class="pips" role="img" aria-label="난이도 ${n}/${max}">${Array.from({ length: max }, (_, i) => `<i${i < n ? ' class="on"' : ''}></i>`).join('')}</span>`; }
