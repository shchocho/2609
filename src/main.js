// main.js — 앱 셸: 라우터, 헤더, 테마, 검색 팔레트.

import { h, icon, LOGO, store, thumb, no3 } from './ui/dom.js';
import { CATALOG, searchText } from './data/catalog.js';

const app = document.getElementById('app');
const ROUTES = [['home', '컬렉션', 'grid'], ['guide', '만드는 법', 'book'], ['lab', '스케일 랩', 'ruler'], ['workshop', '내 공방', 'bench']];
const ctx = {
  lowPower: (navigator.hardwareConcurrency || 4) <= 4 || window.matchMedia('(max-width: 760px)').matches,
  onTheme: null,
  isDark() { const t = store.get('theme'); return t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches); },
};

// ───── 테마
function applyTheme() {
  const t = store.get('theme');
  if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('theme-btn');
  if (btn) { btn.innerHTML = icon(ctx.isDark() ? 'sun' : 'moon'); btn.setAttribute('aria-label', ctx.isDark() ? '밝은 화면으로' : '어두운 화면으로'); }
  if (ctx.onTheme) ctx.onTheme();
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

// ───── 헤더 · 하단 탭
const nav = h('nav', { class: 'nav', 'aria-label': '주 메뉴' }, ROUTES.map(([id, label]) => h('a', { href: `#${id}`, dataset: { r: id } }, label)));
const tabbar = h('nav', { class: 'tabbar', 'aria-label': '주 메뉴' }, ROUTES.map(([id, label, ic]) => h('a', { href: `#${id}`, dataset: { r: id }, html: `${icon(ic)}<span>${label}</span>` })));
document.getElementById('head').append(h('div', { class: 'head__bar' },
  h('a', { class: 'brand', href: '#home', 'aria-label': 'MINIATYR 홈', html: `${LOGO}<span>MINIATYR<small>미니어처 가구 공방</small></span>` }),
  nav,
  h('div', { class: 'head__tools' },
    h('button', { type: 'button', class: 'btn btn--sm btn--ghost', id: 'search-btn', 'aria-label': '가구 찾기', onclick: () => openPalette(), html: `${icon('search')}<span class="kbd">Ctrl K</span>` }),
    h('button', { type: 'button', class: 'btn btn--sm btn--ghost btn--icon', id: 'theme-btn', onclick: () => { store.set('theme', ctx.isDark() ? 'light' : 'dark'); applyTheme(); } }))));
document.body.append(tabbar);

// ───── 검색 팔레트
let pal = null;
function openPalette() {
  if (pal) return;
  let sel = 0, results = [];
  const input = h('input', { type: 'search', id: 'pal-q', placeholder: '가구 이름 · 종류 (예: 포엥, 책상, sofa)', 'aria-label': '가구 찾기', autocomplete: 'off' });
  const ul = h('ul', { role: 'listbox', id: 'pal-list' });
  const box = h('div', { class: 'panel pal', role: 'dialog', 'aria-modal': 'true', 'aria-label': '가구 찾기' }, h('label', { class: 'field' }, h('span', { html: icon('search') }), input), ul);
  const scrim = h('div', { class: 'scrim', onclick: (e) => { if (e.target === scrim) close(); } }, box);
  const last = document.activeElement;
  const close = () => { scrim.remove(); pal = null; document.removeEventListener('keydown', key, true); if (last && last.focus) last.focus(); };
  const go = (it) => { close(); location.hash = `#item-${it.id}`; };
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    results = (q ? CATALOG.filter((it) => searchText(it).includes(q)) : CATALOG).slice(0, 40);
    sel = Math.min(sel, Math.max(0, results.length - 1));
    ul.replaceChildren(...(results.length ? results.map((it, i) => h('li', { role: 'option', 'aria-selected': String(i === sel) },
      h('button', { type: 'button', tabindex: '-1', 'aria-selected': String(i === sel), onclick: () => go(it) }, h('img', { src: thumb(it.id), alt: '', loading: 'lazy' }), h('span', {}, h('b', {}, it.name), h('span', {}, `${it.ko} ${it.type}`)), h('span', { class: 'mono', style: { fontSize: 'var(--t-xs)', color: 'var(--ink-3)' } }, `No.${no3(it.no)}`))))
      : [h('li', { style: { padding: '18px', color: 'var(--ink-3)' } }, '찾는 가구가 없습니다. 다른 이름으로 찾아보세요.')]));
    const cur = ul.querySelector('button[aria-selected="true"]');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  };
  const key = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); go(results[sel]); }
    else if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
  };
  input.addEventListener('input', () => { sel = 0; draw(); });
  document.addEventListener('keydown', key, true);
  document.body.append(scrim);
  pal = scrim;
  draw();
  input.focus();
}
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
  else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openPalette(); }
});

// ───── 라우터
let cleanup = null, current = null;
async function route() {
  const hash = (location.hash || '#home').slice(1);
  const name = hash.startsWith('item-') ? 'item' : hash === 'collection' ? 'home' : ROUTES.some((r) => r[0] === hash) ? hash : 'home';
  const key = name === 'item' ? hash : name;
  if (key === current) { if (hash === 'collection') document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }); return; }
  current = key;
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  app.replaceChildren();
  window.scrollTo(0, 0);
  for (const a of document.querySelectorAll('[data-r]')) { if (a.dataset.r === name || (name === 'item' && a.dataset.r === 'home')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
  document.title = 'MINIATYR 가구 공방';
  try {
    if (name === 'item') cleanup = (await import('./ui/item.js')).itemPage(app, hash.slice(5), ctx);
    else if (name === 'home') { cleanup = (await import('./ui/home.js')).homePage(app, ctx); if (hash === 'collection') requestAnimationFrame(() => document.getElementById('collection')?.scrollIntoView()); }
    else { const P = await import('./ui/pages.js'); cleanup = ({ guide: P.guidePage, lab: P.labPage, workshop: P.workshopPage }[name])(app, ctx); }
  } catch (e) {
    console.error(e);
    app.replaceChildren(h('div', { class: 'wrap loading' }, h('p', {}, '화면을 불러오지 못했습니다. 새로 고침해 주세요.')));
  }
  app.focus({ preventScroll: true });
}
window.addEventListener('hashchange', route);
applyTheme();
route();
