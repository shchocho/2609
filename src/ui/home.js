// home.js — 홈: 스크롤에 맞춰 같은 미니어처가 도면 → 재단 → 조립 → 완성으로 변하는 3D 연출 + 컬렉션.

import { h, icon, tilt, store, thumb, no3, pips, tick, esc } from './dom.js';
import { CATALOG, CATS, getItem, searchText } from '../data/catalog.js';
import { buildModel } from '../core/kit.js';
import { fmt } from '../core/scale.js';
import { cutList } from '../core/cutlist.js';

const FEATURED = ['billy', 'poang', 'strandmon', 'raskog', 'hemnes-dresser', 'kallax'];
// 장면별 연출값: 도면선 비율(split), 분해(explode), 카메라 방위·고도
const KEYS = [
  { split: 0, explode: 0, theta: -30, phi: 71 },
  { split: 1, explode: 0, theta: 22, phi: 73 },
  { split: 0, explode: 1, theta: 48, phi: 66 },
  { split: 0, explode: 0.28, theta: 92, phi: 69 },
  { split: 0, explode: 0, theta: 138, phi: 72 },
];
const CHAPTERS = [
  { n: '01', k: '도면', t: '삼면도부터 뽑습니다', d: '정면·평면·측면도와 분해도, 부품도가 고른 축척에 맞춰 자동으로 그려집니다. 치수는 미니어처 기준 mm로 바로 읽습니다.' },
  { n: '02', k: '재단', t: '부품을 잘라 냅니다', d: '재단표가 필요한 판재·각재·철사를 두께별로 묶어 줍니다. 1:1 템플릿을 인쇄해 재료에 붙이고 선을 따라 자르면 됩니다.' },
  { n: '03', k: '조립', t: '순서대로 붙입니다', d: '단계마다 새로 붙일 부품이 3D로 날아와 제자리를 찾습니다. 요령과 함께 한 단계씩 체크하며 진행합니다.' },
  { n: '04', k: '완성', t: '손바닥 위에 올립니다', d: '완성 모습은 커팅 매트와 15cm 자, 500원 동전 옆에서 실제 크기로 확인합니다. STL로 내보내 3D 프린트할 수도 있습니다.' },
];

const lerp = (a, b, t) => a + (b - a) * t;
const sm = (t) => t * t * (3 - 2 * t);

export function homePage(root, ctx) {
  let stage = null, model = null, feat = FEATURED[0], disposed = false, raf = 0;
  const N = store.get('N');
  const page = h('div', { class: 'page' });

  // ───── 스토리
  const hud = {
    code: h('span', { class: 'mono' }), scale: h('span', { class: 'mono' }, `1:${N}`), az: h('span', { class: 'mono' }, 'AZ 000°'),
    size: h('span', { class: 'mono' }), chap: h('b', {}, '완성 모습'),
  };
  const host = h('div', { class: 'shot__host' });
  const poster = h('img', { class: 'shot__poster', src: thumb(feat), alt: '' });
  const frame = h('div', { class: 'shot__frame hudframe' }, host, poster,
    h('div', { class: 'hud hud--tl' }, hud.code), h('div', { class: 'hud hud--tr' }, h('span', {}, '축척 '), hud.scale),
    h('div', { class: 'hud hud--bl' }, hud.az), h('div', { class: 'hud hud--br' }, hud.size),
    h('div', { class: 'hud hud--c' }, hud.chap));
  const chips = h('div', { class: 'seg', role: 'group', 'aria-label': '보여 줄 가구' }, FEATURED.map((id) => {
    const it = getItem(id);
    return h('button', { type: 'button', 'aria-pressed': String(id === feat), onclick: () => setFeat(id) }, it.name.split(' ')[0]);
  }));
  const stageCol = h('div', { class: 'story__stage' }, frame, h('div', { class: 'story__veil' }), h('div', { class: 'shot__cap' }, chips, h('a', { class: 'btn btn--sm btn--tape', href: `#item-${feat}`, id: 'hero-open' }, '이 가구 만들기')));

  const hero = h('article', { class: 'chapter chapter--hero', dataset: { ch: '0' } },
    h('span', { class: 'tape' }, `아이코닉 가구 100 · 1:6 – 1:48`),
    h('h1', { html: '백 개의 가구를<br><em>손바닥 위에.</em>' }),
    h('p', { class: 'hero__lead' }, '도면을 뽑고, 재료를 자르고, 순서대로 붙이면 미니어처가 됩니다. 책장부터 소파까지 100가지 가구의 삼면도·재단표·조립 순서·3D 모델을 한곳에 담았습니다.'),
    h('div', { class: 'hero__cta' },
      h('a', { class: 'btn btn--lg btn--mat', href: '#collection', onclick: (e) => { e.preventDefault(); document.getElementById('collection').scrollIntoView({ behavior: 'smooth' }); } }, '컬렉션 보기'),
      h('a', { class: 'btn btn--lg', href: '#guide' }, '처음이라면: 만드는 법')),
    h('dl', { class: 'hero__facts' },
      h('div', {}, h('dt', {}, '100'), h('dd', {}, '가구')),
      h('div', {}, h('dt', {}, '138'), h('dd', {}, '크기·구성 변형')),
      h('div', {}, h('dt', {}, '1,824'), h('dd', {}, '부품')),
      h('div', {}, h('dt', {}, '1:6–1:48'), h('dd', {}, '다섯 가지 축척'))),
    h('p', { class: 'scrollcue' }, h('span', { html: icon('down') }), '스크롤하면 만드는 과정이 이어집니다'));
  const chapEls = [hero, ...CHAPTERS.map((c, i) => h('article', { class: 'chapter', dataset: { ch: String(i + 1) } },
    h('span', { class: 'eyebrow' }, `${c.n} — ${c.k}`), h('h2', {}, c.t), h('p', {}, c.d),
    i === 3 ? h('a', { class: 'btn btn--tape', href: '#collection', onclick: (e) => { e.preventDefault(); document.getElementById('collection').scrollIntoView({ behavior: 'smooth' }); } }, '100가지 가구 고르기') : null))];
  const story = h('section', { class: 'story', 'aria-label': '만드는 과정' }, stageCol, h('div', { class: 'story__text wrap' }, chapEls));

  // ───── 컬렉션
  const f = { cat: 'all', q: '', sort: 'no', view: 'grid' };
  const grid = h('div', { class: 'grid', id: 'grid' });
  const count = h('p', {});
  const cats = h('div', { class: 'seg', role: 'group', 'aria-label': '분류' }, CATS.map((c) => h('button', { type: 'button', 'aria-pressed': String(c.id === f.cat), onclick: (e) => { f.cat = c.id; press(cats, e.currentTarget); draw(); } }, c.ko)));
  const q = h('input', { type: 'search', id: 'q', placeholder: '이름으로 찾기 (예: 빌리, KALLAX)', 'aria-label': '가구 이름으로 찾기', oninput: (e) => { f.q = e.target.value.trim().toLowerCase(); draw(); } });
  const sort = h('select', { id: 'sort', 'aria-label': '정렬', onchange: (e) => { f.sort = e.target.value; draw(); } },
    h('option', { value: 'no' }, '순번순'), h('option', { value: 'name' }, '이름순'), h('option', { value: 'easy' }, '쉬운 것부터'), h('option', { value: 'small' }, '작은 것부터'), h('option', { value: 'big' }, '큰 것부터'));
  const views = h('div', { class: 'seg', role: 'group', 'aria-label': '보기 방식' },
    h('button', { type: 'button', 'aria-pressed': 'true', onclick: (e) => { f.view = 'grid'; press(views, e.currentTarget); draw(); }, html: `${icon('grid')}<span class="sr">격자로 보기</span>` }),
    h('button', { type: 'button', 'aria-pressed': 'false', onclick: (e) => { f.view = 'lineup'; press(views, e.currentTarget); draw(); }, html: `${icon('bars')}<span class="sr">실물 크기로 비교</span>` }));
  const coll = h('section', { class: 'sec wrap', id: 'collection' },
    h('div', { class: 'sec__head' }, h('div', {}, h('h2', {}, '컬렉션'), count), views),
    h('div', { class: 'filters' }, cats, h('label', { class: 'field' }, h('span', { html: icon('search') }), q), h('label', { class: 'field', style: { flex: '0 0 auto', maxWidth: '170px' } }, sort)),
    grid);
  page.append(story, coll);
  root.append(page);
  const offTilt = tilt(grid, '.card', 8);
  const offTilt2 = () => {};

  function press(group, btn) { for (const b of group.children) b.setAttribute('aria-pressed', String(b === btn)); }

  let manifest = null;
  function card(it) {
    const [w, d, hh] = it.dims;
    return h('a', { class: 'card', href: `#item-${it.id}`, 'aria-label': `${it.name} ${it.type}, 난이도 ${it.diff}/5` },
      h('div', { class: 'card__face' },
        h('div', { class: 'card__pic' }, h('img', { src: thumb(it.id), alt: '', loading: 'lazy', decoding: 'async', width: 720, height: 720 }),
          h('span', { class: 'card__no' }, `No.${no3(it.no)}`), h('div', { class: 'card__glare' })),
        h('div', { class: 'card__body' },
          h('h3', { class: 'card__name' }, it.name), h('span', { class: 'card__diff', html: pips(it.diff) }),
          h('p', { class: 'card__type' }, `${it.ko} ${it.type}`),
          h('p', { class: 'card__dims' }, `${fmt(w / N, 1)} × ${fmt(d / N, 1)} × ${fmt(hh / N, 1)} mm · 1:${N}`))));
  }
  function draw() {
    let list = CATALOG.filter((it) => (f.cat === 'all' || it.cat === f.cat) && (!f.q || searchText(it).includes(f.q)));
    const vol = (it) => it.dims[0] * it.dims[1] * it.dims[2];
    if (f.sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (f.sort === 'easy') list = [...list].sort((a, b) => a.diff - b.diff || a.no - b.no);
    else if (f.sort === 'small') list = [...list].sort((a, b) => vol(a) - vol(b));
    else if (f.sort === 'big') list = [...list].sort((a, b) => vol(b) - vol(a));
    count.textContent = `${list.length}개 · 순번은 편집 큐레이션이며 판매 순위가 아닙니다`;
    grid.className = f.view === 'grid' ? 'grid' : 'lineup';
    grid.replaceChildren();
    if (!list.length) { grid.append(h('p', { class: 'empty' }, '조건에 맞는 가구가 없습니다. 분류를 "전체"로 바꾸거나 다른 이름으로 찾아보세요.')); return; }
    if (f.view === 'grid') { grid.append(...list.map(card)); return; }
    // 실물 크기 비교: 모든 가구를 같은 축척으로 한 줄에 세운다
    const ppm = 320 / 2400, row = h('div', { class: 'lineup__row' });
    const sorted = [...list].sort((a, b) => a.dims[2] - b.dims[2]);
    for (const it of sorted) {
      const m = manifest && manifest[it.id];
      const size = m ? (720 * ppm) / m.k : (it.dims[2] * ppm) / 0.8;
      const drop = m ? (1 - m.base) * size : size * 0.12;
      row.append(h('a', { class: 'lineup__item', href: `#item-${it.id}`, title: `${it.name} ${it.type}` },
        h('img', { src: thumb(it.id), alt: `${it.name} ${it.type}`, loading: 'lazy', style: { width: `${size}px`, height: `${size}px`, marginBottom: `${-drop}px` } }),
        h('span', { html: `${esc(it.name)}<br>${fmt(it.dims[2] / 10, 0)}cm` })));
    }
    grid.append(row, h('div', { class: 'lineup__pad' }));
  }
  draw();
  fetch('assets/thumbs/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => { manifest = m; if (f.view === 'lineup') draw(); }).catch(() => {});

  // ───── 3D 스테이지
  function setFeat(id) {
    feat = id;
    for (const b of chips.children) b.setAttribute('aria-pressed', String(b.textContent === getItem(id).name.split(' ')[0]));
    document.getElementById('hero-open').setAttribute('href', `#item-${id}`);
    poster.src = thumb(id);
    load();
  }
  function load() {
    const it = getItem(feat);
    model = buildModel(it, { N });
    const [w, hh, d] = model.bbox.size;
    tick(hud.code, `MN-${no3(it.no)} ${it.name}`);
    tick(hud.size, `${fmt(w / N, 1)} × ${fmt(d / N, 1)} × ${fmt(hh / N, 1)} mm`);
    if (stage) { stage.setModel(model, it.finishes[0]); stage.setMini(true, N); calls(); apply(true); }
  }
  const wide = () => window.innerWidth > 1040;
  function calls() {
    const rows = cutList(model).rows.filter((r) => !r.opt).slice(0, 7);
    stage.setCallouts(rows.map((r) => ({ id: r.parts[0], text: `${r.label} ${r.name}` })));
    stage.viewShift = wide() ? [0.19, 0] : null;
  }
  let prog = 0;
  function measure() {
    const mid = window.innerHeight * 0.5;
    const cs = chapEls.map((el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; });
    let i = 0;
    while (i < cs.length - 2 && mid > cs[i + 1]) i++;
    const t = Math.max(0, Math.min(1, (mid - cs[i]) / Math.max(1, cs[i + 1] - cs[i])));
    return i + t;
  }
  function apply(force) {
    const p = measure();
    if (!force && Math.abs(p - prog) < 0.002) return;
    prog = p;
    const i = Math.min(KEYS.length - 2, Math.floor(p)), t = sm(Math.min(1, p - i)), a = KEYS[i], b = KEYS[i + 1];
    const idx = Math.round(p);
    hud.chap.textContent = idx === 0 ? '완성 모습' : `${CHAPTERS[idx - 1].n} ${CHAPTERS[idx - 1].k}`;
    chapEls.forEach((el, k) => el.classList.toggle('is-on', k === idx));
    if (!stage) return;
    stage.setSplit(lerp(a.split, b.split, t));
    stage.setExplode(lerp(a.explode, b.explode, t), false);
    stage.goal.theta = (lerp(a.theta, b.theta, t) * Math.PI) / 180;
    stage.goal.phi = (lerp(a.phi, b.phi, t) * Math.PI) / 180;
    stage.fit(false, true);
  }
  const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (stage) stage.viewShift = wide() ? [0.19, 0] : null; apply(false); }); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  load();
  apply(true);

  import('../three/stage.js').then(({ Stage, webglSupported }) => {
    if (disposed || !webglSupported()) return;
    stage = new Stage(host, { maxDpr: ctx.lowPower ? 1.25 : 2, samples: ctx.lowPower ? 40 : 72,
      onFrame: (s) => { const az = (((s.cam.theta * 180) / Math.PI) % 360 + 360) % 360; hud.az.textContent = `AZ ${String(Math.round(az)).padStart(3, '0')}°  EL ${String(Math.round(90 - (s.cam.phi * 180) / Math.PI)).padStart(2, '0')}°`; } });
    stage.fitScale = 1.3;
    stage.canvas.setAttribute('aria-label', '미니어처 3D 미리보기. 페이지를 스크롤하면 도면, 재단, 조립, 완성 순서로 바뀝니다.');
    stage.setTheme({ dark: ctx.isDark() });
    stage.setLineTheme('blueprint');
    stage.mini = true; stage.N = N;
    const it = getItem(feat);
    stage.setModel(model, it.finishes[0]);
    stage.setMini(true, N);
    calls();
    apply(true);
    requestAnimationFrame(() => { poster.style.opacity = '0'; });
    ctx.onTheme = () => stage && stage.setTheme({ dark: ctx.isDark() });
  }).catch(() => {});

  return () => {
    disposed = true; ctx.onTheme = null;
    window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll);
    cancelAnimationFrame(raf); offTilt(); offTilt2();
    if (stage) stage.dispose();
  };
}
