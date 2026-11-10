// item.js — 워크벤치: 한 가구의 3D · 도면 · 재단 · 조립 · 내보내기.

import { h, icon, toast, store, saveFile, svgToCanvas, canvasBlob, thumb, no3, pips, tick, esc, inArtifact } from './dom.js';
import { CATALOG, CATS, getItem } from '../data/catalog.js';
import { buildModel } from '../core/kit.js';
import { SCALES, fmt, scaleDifficulty } from '../core/scale.js';
import { cutList, linearPlan, shoppingList } from '../core/cutlist.js';
import { buildSheets, SHEET_STYLES } from '../core/sheets.js';
import { modelSVG } from '../core/project.js';
import { materialOf, MATERIALS } from '../data/materials.js';
import * as EX from '../core/export.js';

const TABS = [['over', '개요'], ['draw', '도면'], ['cut', '재단'], ['asm', '조립'], ['out', '내보내기']];
const VIEW_ORDER = ['iso', 'front', 'side', 'top'];
const VIEW_NAME = { iso: '등각', front: '정면', side: '측면', top: '위' };

export function itemPage(root, id, ctx) {
  const item = getItem(id);
  if (!item) { root.append(h('div', { class: 'wrap loading' }, h('p', {}, '찾는 가구가 없습니다. ', h('a', { href: '#home', class: 'btn btn--sm' }, '컬렉션으로')))); return () => {}; }
  const saved = store.item(id);
  const S = {
    N: store.get('N'), fit: store.get('fit'), variant: saved.variant || null, fin: Math.min(saved.fin || 0, item.finishes.length - 1),
    tab: 'over', mini: false, explode: 0, split: 0, dims: false, lamp: true, opt: true, step: null, view: 0,
    sheet: 0, sheetStyle: store.get('sheetStyle'), done: new Set(saved.done || []), playing: null,
  };
  let model, list, sheets = null, stage = null, disposed = false;
  const idx = CATALOG.indexOf(item), prev = CATALOG[idx - 1], next = CATALOG[idx + 1];
  const cat = CATS.find((c) => c.id === item.cat);

  // ───── 뼈대
  const page = h('div', { class: 'page wrap' });
  page.append(h('div', { class: 'crumbs' },
    h('a', { class: 'btn btn--sm btn--ghost', href: '#home', html: `${icon('prev')} 컬렉션` }),
    h('nav', { 'aria-label': '이전·다음 가구' },
      prev ? h('a', { class: 'btn btn--sm', href: `#item-${prev.id}`, title: `${prev.name} ${prev.type}`, html: `${icon('prev')} <span class="mono">${no3(prev.no)}</span>` }) : null,
      next ? h('a', { class: 'btn btn--sm', href: `#item-${next.id}`, title: `${next.name} ${next.type}`, html: `<span class="mono">${no3(next.no)}</span> ${icon('next')}` }) : null)));

  const stageHost = h('div', { class: 'viewer__host' });
  const sheetInner = h('div', { class: 'sheetview__tilt' });
  const sheetPaper = h('div', { class: 'sheetview__paper' }, sheetInner);
  const sheetView = h('div', { class: 'sheetview', hidden: true, tabindex: '0', role: 'img', 'aria-label': '도면 시트. 끌어서 이동, 휠로 확대합니다.' }, sheetPaper);
  const tip = h('div', { class: 'viewer__tip', hidden: true });
  const hud = { az: h('span', { class: 'mono' }, ''), info: h('span', { class: 'mono' }, '') };
  const hint = h('div', { class: 'viewer__hint' }, '끌어서 돌리기 · 휠로 확대 · 부품을 누르면 재단표에 표시');
  const modeSeg = h('div', { class: 'seg', role: 'group', 'aria-label': '보기 모드' },
    h('button', { type: 'button', 'aria-pressed': 'true', onclick: () => setMini(false) }, '실물'),
    h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => setMini(true) }, '미니어처'));
  const tb = (name, label, on, pressed) => h('button', { type: 'button', class: 'btn btn--sm btn--icon', title: label, 'aria-label': label, 'aria-pressed': pressed == null ? null : String(pressed), onclick: on, html: icon(name) });
  const bDims = tb('dims', '치수 표시', () => { S.dims = !S.dims; bDims.setAttribute('aria-pressed', String(S.dims)); stage && stage.setDims(S.dims); }, false);
  const bOpt = tb('pillow', '침구·소품 표시', () => { S.opt = !S.opt; bOpt.setAttribute('aria-pressed', String(S.opt)); stage && stage.setShowOptional(S.opt); }, true);
  const bLamp = tb('bulb', '조명 켜기', () => { S.lamp = !S.lamp; bLamp.setAttribute('aria-pressed', String(S.lamp)); stage && stage.setLamp(S.lamp); }, true);
  const bView = tb('eye', '시점 바꾸기', () => { S.view = (S.view + 1) % VIEW_ORDER.length; stage && stage.setView(VIEW_ORDER[S.view]); toast(`${VIEW_NAME[VIEW_ORDER[S.view]]} 시점`, 1200); });
  const bFull = tb('expand', '전체 화면', () => { const el = viewer; (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen && el.requestFullscreen())?.catch?.(() => {}); });
  const rExplode = h('input', { class: 'range', type: 'range', id: 'r-explode', min: '0', max: '100', value: '0', 'aria-label': '분해 정도', oninput: (e) => { S.explode = e.target.value / 100; e.target.style.setProperty('--p', `${e.target.value}%`); stage && stage.setExplode(S.explode); } });
  const rSplit = h('input', { class: 'range', type: 'range', id: 'r-split', min: '0', max: '100', value: '0', 'aria-label': '도면선으로 보는 영역', oninput: (e) => { S.split = e.target.value / 100; e.target.style.setProperty('--p', `${e.target.value}%`); stage && stage.setSplit(S.split); } });
  const toolsTL = h('div', { class: 'viewer__tools viewer__tools--tl' }, modeSeg);
  const toolsTR = h('div', { class: 'viewer__tools viewer__tools--tr' }, bDims, bOpt, bLamp, bView, bFull);
  const toolsB = h('div', { class: 'viewer__tools viewer__tools--b' }, h('label', {}, '분해', rExplode), h('label', {}, '도면선', rSplit));
  const viewer = h('div', { class: 'viewer hudframe' }, stageHost, sheetView, tip, hint, toolsTL, toolsTR, toolsB,
    h('div', { class: 'hud hud--bl hud--up' }, hud.az), h('div', { class: 'hud hud--br hud--up' }, hud.info));

  const miniOut = h('b', {}), realOut = h('span', {});
  const scaleSeg = h('div', { class: 'seg seg--mono', role: 'group', 'aria-label': '축척' }, SCALES.map((s) => h('button', { type: 'button', title: `${s.name} — ${s.note}`, 'aria-pressed': String(s.n === S.N), onclick: () => setN(s.n) }, s.label)));
  const variantSel = item.variants.length ? h('select', { id: 'variant', 'aria-label': '크기·구성', onchange: (e) => { S.variant = e.target.value || null; store.setItem(id, { variant: S.variant }); rebuild(true); } },
    h('option', { value: '' }, '기본'), item.variants.map((v) => h('option', { value: v.id, selected: v.id === S.variant }, v.label))) : null;
  const swatches = h('div', { class: 'swatches', role: 'group', 'aria-label': '마감' }, item.finishes.map((f, i) => {
    const key = f.map.body || f.map.fabric || f.map.plastic || f.map.frame || f.map.top || Object.values(f.map)[0], c = (MATERIALS[key] || {}).c || '#ccc';
    return h('button', { type: 'button', class: 'swatch', 'aria-pressed': String(i === S.fin), onclick: () => setFin(i) }, h('i', { style: { background: c } }), f.name);
  }));
  const fitSw = h('label', { class: 'switch' }, h('input', { type: 'checkbox', id: 'fit', checked: S.fit, onchange: (e) => { S.fit = e.target.checked; store.set('fit', S.fit); rebuild(true); toast(S.fit ? '판재 두께를 시판 규격(0.5·1·1.5·2·3mm…)에 맞췄습니다.' : '원래 비례 그대로 계산합니다.'); } }), h('i'), '시판 재료 두께에 맞추기');
  const ctl = h('div', { class: 'panel ctl' },
    h('div', { class: 'ctl__mini' }, h('div', {}, h('span', {}, '미니어처 크기 (폭 × 깊이 × 높이)'), h('br'), miniOut), realOut),
    h('div', { class: 'ctl__row' }, h('span', {}, '축척'), scaleSeg),
    variantSel ? h('div', { class: 'ctl__row' }, h('span', {}, '크기·구성'), h('label', { class: 'field' }, variantSel)) : null,
    h('div', { class: 'ctl__row' }, h('span', {}, '마감'), swatches),
    fitSw);

  const tabBar = h('div', { class: 'tabs', role: 'tablist', 'aria-label': '작업 단계' }, TABS.map(([k, label]) => h('button', { type: 'button', role: 'tab', id: `tab-${k}`, 'aria-selected': String(k === S.tab), 'aria-controls': 'tabpanel', tabindex: k === S.tab ? '0' : '-1', onclick: () => setTab(k) }, label)));
  tabBar.addEventListener('keydown', (e) => {
    const i = TABS.findIndex(([k]) => k === S.tab), d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -i : e.key === 'End' ? TABS.length - 1 - i : 0;
    if (!d) return;
    e.preventDefault(); setTab(TABS[(i + d + TABS.length) % TABS.length][0]); document.getElementById(`tab-${S.tab}`).focus();
  });
  const panel = h('div', { class: 'tabpanel', id: 'tabpanel', role: 'tabpanel' });
  const side = h('div', { class: 'bench__side' },
    h('header', { class: 'title' }, h('span', { class: 'tape', style: { justifySelf: 'start' } }, `No.${no3(item.no)} · ${cat ? cat.ko : ''}`), h('h1', {}, item.name), h('p', {}, `${item.ko} ${item.type}`)),
    ctl, h('div', { class: 'panel', style: { overflow: 'hidden' } }, tabBar, panel));
  page.append(h('div', { class: 'bench' }, h('div', { class: 'bench__stage' }, viewer), side));
  root.append(page);

  // ───── 모델
  function rebuild(keepView) {
    model = buildModel(item, { N: S.N, fit: S.fit, variant: S.variant });
    list = cutList(model); sheets = null;
    const [w, hh, d] = model.bbox.size;
    tick(miniOut, `${fmt(w / S.N, 1)} × ${fmt(d / S.N, 1)} × ${fmt(hh / S.N, 1)} mm`);
    realOut.textContent = `실물 ${fmt(w / 10, 1)} × ${fmt(d / 10, 1)} × ${fmt(hh / 10, 1)} cm`;
    hud.info.textContent = `부품 ${list.count} · ${model.steps.length}단계`;
    bOpt.hidden = !model.parts.some((p) => p.opt);
    bLamp.hidden = !model.parts.some((p) => p.glow);
    if (S.step != null && S.step > model.steps.length) S.step = null;
    if (stage) {
      stage.setModel(model, item.finishes[S.fin], { keepView });
      stage.setMini(S.mini, S.N); stage.setExplode(S.explode, false); stage.setSplit(S.split); stage.setDims(S.dims);
      stage.setShowOptional(S.opt); stage.setLamp(S.lamp); stage.setStep(S.tab === 'asm' ? S.step : null);
      stage.setCallouts(list.rows.filter((r) => !r.opt).slice(0, 12).map((r) => ({ id: r.parts[0], text: r.label })));
    } else fallback();
    renderTab();
  }
  function fallback() {
    if (stageHost.dataset.gl) return;
    const fin = item.finishes[S.fin];
    stageHost.innerHTML = `<div class="viewer__fallback">${modelSVG(model, { style: (p) => { const m = materialOf(p.role, fin); return m.t === 'glass' ? { fill: m.c, fo: 0.3, stroke: '#35504a', shade: true } : { fill: m.c, stroke: '#1b2420', shade: true }; } })}</div>`;
  }
  function setN(n) { S.N = n; store.set('N', n); for (const b of scaleSeg.children) b.setAttribute('aria-pressed', String(b.textContent === `1:${n}`)); rebuild(true); }
  function setFin(i) { S.fin = i; store.setItem(id, { fin: i }); [...swatches.children].forEach((b, k) => b.setAttribute('aria-pressed', String(k === i))); if (stage) stage.setFinish(item.finishes[i]); else fallback(); sheets = null; if (S.tab === 'draw') renderTab(); }
  function setMini(on) { S.mini = on; modeSeg.children[0].setAttribute('aria-pressed', String(!on)); modeSeg.children[1].setAttribute('aria-pressed', String(on)); if (stage) { stage.setMini(on, S.N); stage.fit(); } if (on) toast('커팅 매트 눈금은 1cm, 옆의 자는 15cm, 동전은 500원(지름 26.5mm)입니다.', 3600); }
  function setTab(k) {
    stopPlay();
    S.tab = k;
    for (const b of tabBar.children) { b.setAttribute('aria-selected', String(b.id === `tab-${k}`)); b.tabIndex = b.id === `tab-${k}` ? 0 : -1; }
    const draw = k === 'draw';
    sheetView.hidden = !draw; stageHost.hidden = draw; toolsTL.hidden = draw; toolsTR.hidden = draw; toolsB.hidden = draw; hint.hidden = draw || hint.dataset.gone === '1';
    hud.az.parentElement.hidden = draw; hud.info.parentElement.hidden = draw;
    if (stage) { stage.visible = !draw; stage.setStep(k === 'asm' ? S.step : null); stage.highlight(null); if (!draw) stage.invalidate(); }
    renderTab();
  }

  // ───── 탭 내용
  function renderTab() {
    panel.setAttribute('aria-labelledby', `tab-${S.tab}`);
    panel.replaceChildren(...({ over: tabOver, draw: tabDraw, cut: tabCut, asm: tabAsm, out: tabOut }[S.tab])());
  }
  function tabOver() {
    const shop = shoppingList(list, model), dif = scaleDifficulty(item.diff, S.N), mins = Math.round((20 + list.count * 3.5 * (0.7 + dif * 0.25)) / 10) * 10;
    const sc = SCALES.find((s) => s.n === S.N);
    return [
      h('p', {}, item.blurb),
      h('dl', { class: 'spec' },
        h('dt', {}, '이 축척의 난이도'), h('dd', { html: `${pips(dif)} <span class="mono">${dif}/5</span>` }),
        h('dt', {}, '예상 제작 시간'), h('dd', {}, `약 ${mins >= 60 ? `${Math.floor(mins / 60)}시간 ${mins % 60 ? `${mins % 60}분` : ''}` : `${mins}분`}`),
        h('dt', {}, '부품'), h('dd', {}, `${list.rows.length}종 ${list.count}개 · ${model.steps.length}단계`),
        h('dt', {}, '축척'), h('dd', {}, sc ? `${sc.label} ${sc.name}` : `1:${S.N}`)),
      sc ? h('div', { class: 'note', html: `${icon('info')}<span>${esc(sc.note)}</span>` }) : null,
      h('h3', {}, '필요한 재료'),
      h('ul', { class: 'checks' }, shop.items.map((x) => h('li', {}, x.name, h('span', {}, x.amount)))),
      h('h3', {}, '도구'),
      h('ul', { class: 'checks' }, shop.tools.map((x) => h('li', {}, x))),
      h('div', { class: 'hero__cta', style: { marginTop: '4px' } },
        h('button', { type: 'button', class: 'btn btn--mat', onclick: () => setTab('draw') }, '도면 보기'),
        h('button', { type: 'button', class: 'btn', onclick: () => setTab('asm') }, '조립 순서 보기')),
    ];
  }

  // 도면
  const pan = { x: 0, y: 0, k: 1 };
  function fitSheet() {
    const w = sheetView.clientWidth, hgt = sheetView.clientHeight;
    pan.k = Math.min((w - 28) / 297, (hgt - 28) / 210) * 0.9; pan.fit = pan.k; pan.x = -148.5 * pan.k; pan.y = -105 * pan.k;
    placeSheet();
  }
  const placeSheet = () => {
    sheetPaper.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${pan.k})`;
    // 전체가 보일 때는 책상에 놓인 종이처럼 기울이고, 확대하면 평평하게 편다.
    sheetInner.classList.toggle('is-flat', pan.k > pan.fit * 1.12);
  };
  function ensureSheets() {
    if (!sheets) sheets = buildSheets(model, { style: S.sheetStyle, list, finish: item.finishes[S.fin].name });
    S.sheet = Math.min(S.sheet, sheets.length - 1);
    return sheets;
  }
  function showSheet() { sheetInner.innerHTML = ensureSheets()[S.sheet].svg; fitSheet(); }
  function tabDraw() {
    ensureSheets();
    requestAnimationFrame(showSheet);
    const cur = () => sheets[S.sheet];
    const strip = h('div', { class: 'thumbs', role: 'group', 'aria-label': '시트 목록' }, sheets.map((sh, i) => h('button', { type: 'button', 'aria-pressed': String(i === S.sheet), onclick: () => { S.sheet = i; renderTab(); } }, h('small', {}, sh.code), h('span', {}, sh.title))));
    const styleSeg = h('div', { class: 'seg', role: 'group', 'aria-label': '도면 스타일' }, Object.entries(SHEET_STYLES).map(([k, v]) => h('button', { type: 'button', 'aria-pressed': String(k === S.sheetStyle), onclick: () => { S.sheetStyle = k; store.set('sheetStyle', k); sheets = null; renderTab(); } }, v.name)));
    const base = `${item.id}-1x${S.N}`;
    return [
      h('p', {}, `${sheets.length}장의 시트가 준비됐습니다. 왼쪽 도면은 끌어서 옮기고 휠·두 손가락으로 확대합니다.`),
      strip,
      h('div', { class: 'ctl__row' }, h('span', {}, '도면 스타일'), styleSeg),
      cur().template ? h('div', { class: 'note', html: `${icon('info')}<span>재단 템플릿은 <b>실제 크기(100%)</b>로 인쇄하세요. 위쪽 50mm 눈금을 자로 재어 배율을 확인한 뒤 재료에 붙이고 선을 따라 자릅니다.</span>` }) : null,
      h('div', { class: 'exports' },
        exp('전체 도면 PDF', `A4 가로 ${sheets.length}쪽, 300dpi. 그대로 인쇄하면 템플릿이 실제 크기로 나옵니다.`, 'PDF 저장', async () => {
          toast('PDF를 만드는 중입니다…', 4000);
          const st = SHEET_STYLES[S.sheetStyle], pages = [];
          for (const sh of sheets) { const c = await svgToCanvas(sh.svg, 3508, 2480, st.bg); const blob = await canvasBlob(c, 'image/jpeg', 0.92); pages.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), wPx: 3508, hPx: 2480 }); }
          await saveFile(`${base}-drawings.pdf`, new Blob([EX.pdfFromJpegs(pages)], { type: 'application/pdf' }));
        }),
        exp('이 시트 SVG', '벡터 원본. 일러스트·잉크스케이프에서 열 수 있습니다.', 'SVG', () => saveFile(`${base}-${cur().id}.svg`, cur().svg, 'image/svg+xml')),
        exp('이 시트 PNG', '300dpi 이미지.', 'PNG', async () => { const c = await svgToCanvas(cur().svg, 3508, 2480, SHEET_STYLES[S.sheetStyle].bg); await saveFile(`${base}-${cur().id}.png`, await canvasBlob(c)); })),
    ];
  }
  function exp(title, desc, label, fn) {
    const b = h('button', { type: 'button', class: 'btn btn--sm', html: `${icon('down')} ${label}`, onclick: async () => { b.disabled = true; try { await fn(); } catch (e) { toast(e.message || '저장하지 못했습니다. 다시 시도해 주세요.'); } b.disabled = false; } });
    return h('div', { class: 'export' }, h('b', {}, title), b, h('p', {}, desc));
  }

  // 재단
  function tabCut() {
    const lin = linearPlan(list, 300);
    const body = h('tbody', {}, list.rows.map((r) => h('tr', { dataset: { key: r.label }, tabindex: '0',
      onmouseenter: () => pickRow(r, false), onfocus: () => pickRow(r, false), onclick: () => pickRow(r, true), onkeydown: (e) => { if (e.key === 'Enter') pickRow(r, true); } },
      h('td', {}, h('span', { class: 'badge' }, r.label)),
      h('td', {}, r.name, r.opt ? h('small', {}, '선택 소품') : null, r.warn ? h('small', { class: 'warn' }, r.warn) : null, r.note ? h('small', {}, r.note) : null),
      h('td', { class: 'num' }, `×${r.qty}`),
      h('td', { class: 'num' }, r.dim, h('small', {}, `실물 ${r.dimReal}`)),
      h('td', {}, r.info.ko, h('small', {}, r.material)))));
    return [
      h('p', {}, `부품 ${list.rows.length}종 ${list.count}개. 줄을 누르면 3D에서 해당 부품이 노랗게 표시됩니다. 치수는 미니어처 mm입니다.`),
      h('div', { class: 'tablewrap' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['부호', '부품', '수량', '길이 × 폭 × 두께', '재료'].map((x, i) => h('th', { class: i === 2 || i === 3 ? 'num' : null, scope: 'col' }, x)))), body)),
      lin.length ? h('h3', {}, '각재·환봉·철사 절단 계획 (재료 길이 300mm 기준)') : null,
      lin.length ? h('ul', { class: 'checks' }, lin.map((g) => h('li', {}, `${g.sec} — ${g.pieces.length}토막`, h('span', {}, `합계 ${fmt(g.total, 0)}mm · ${g.count}개 필요`)))) : null,
      h('div', { class: 'note', html: `${icon('info')}<span>평면 부품은 <b>도면 → 재단 템플릿</b> 시트에 실제 크기로 배치돼 있습니다. 인쇄해 재료에 붙이면 따로 치수를 옮겨 그릴 필요가 없습니다.</span>` }),
      h('div', { class: 'exports' },
        exp('재단표 CSV', '엑셀·스프레드시트용.', 'CSV', () => saveFile(`${item.id}-1x${S.N}-cutlist.csv`, EX.toCSV(list, item), 'text/csv')),
        exp('재단 도안 DXF', '레이저 커터·커팅 플로터용. 두께별 레이어로 나뉩니다.', 'DXF', () => saveFile(`${item.id}-1x${S.N}-cut.dxf`, EX.toDXF(list), 'application/dxf'))),
    ];
  }
  function pickRow(r, scroll) {
    for (const tr of panel.querySelectorAll('tbody tr')) tr.classList.toggle('is-on', tr.dataset.key === r.label);
    if (stage) stage.highlight(r.parts[0]);
    if (scroll && window.innerWidth < 1040) viewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 조립
  const saveDone = () => store.setItem(id, { done: [...S.done], started: store.item(id).started || Date.now() });
  function stopPlay() { if (S.playing) { clearInterval(S.playing); S.playing = null; } }
  function goStep(n) { S.step = n == null ? null : Math.max(1, Math.min(model.steps.length, n)); if (stage) stage.setStep(S.step); renderTab(); const el = panel.querySelector('.step.is-cur'); if (el && window.innerWidth >= 1040) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  function tabAsm() {
    const steps = model.steps, cur = S.step, doneN = steps.filter((s) => S.done.has(s.n)).length;
    const bPlay = h('button', { type: 'button', class: 'btn btn--sm btn--mat', html: S.playing ? `${icon('pause')} 멈춤` : `${icon('play')} 처음부터 재생`, onclick: () => {
      if (S.playing) { stopPlay(); renderTab(); return; }
      goStep(1);
      S.playing = setInterval(() => { if (S.step >= model.steps.length) { stopPlay(); renderTab(); } else goStep(S.step + 1); }, 2200);
      renderTab();
    } });
    return [
      h('div', { class: 'player' }, h('p', {}, cur ? `${cur} / ${steps.length} 단계` : `${steps.length}단계 · ${doneN}단계 완료`),
        h('button', { type: 'button', class: 'btn btn--sm btn--icon', 'aria-label': '이전 단계', disabled: !cur || cur <= 1, html: icon('prev'), onclick: () => { stopPlay(); goStep((cur || 1) - 1); } }),
        h('button', { type: 'button', class: 'btn btn--sm btn--icon', 'aria-label': '다음 단계', disabled: cur >= steps.length, html: icon('next'), onclick: () => { stopPlay(); goStep((cur || 0) + 1); } }),
        bPlay, cur ? h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => { stopPlay(); goStep(null); } }, '완성 보기') : null),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(steps.length), 'aria-valuenow': String(doneN), 'aria-label': '완료한 단계' }, h('i', { style: { '--p': `${(doneN / steps.length) * 100}%` } })),
      h('ol', { class: 'steps' }, steps.map((s) => {
        const names = [...new Set(model.parts.filter((p) => p.step === s.n && !p.opt).map((p) => { const r = list.byId.get(p.id); return r ? `${r.label} ${p.name}` : p.name; }))].slice(0, 6).join(' · ');
        const done = S.done.has(s.n);
        return h('li', { class: `step${done ? ' is-done' : ''}${cur === s.n ? ' is-cur' : ''}` },
          h('button', { type: 'button', class: 'step__go', 'aria-current': cur === s.n ? 'step' : null, 'aria-label': `${s.n}단계 ${s.title} 3D로 보기`, onclick: () => { stopPlay(); goStep(s.n); } },
            h('span', { class: 'step__n' }, s.n), h('span', { class: 'step__t' }, s.title)),
          h('button', { type: 'button', class: 'step__ck', 'aria-label': done ? `${s.n}단계 완료 취소` : `${s.n}단계 완료로 표시`, 'aria-pressed': String(done), html: icon('check'),
            onclick: () => { if (done) S.done.delete(s.n); else S.done.add(s.n); saveDone(); renderTab(); if (S.done.size === steps.length) toast('모든 단계를 마쳤습니다. 완성을 축하합니다!'); } }),
          h('span', { class: 'step__d' }, s.desc), names ? h('span', { class: 'step__parts' }, names) : null,
          s.tip ? h('span', { class: 'step__tip' }, s.tip) : null);
      })),
    ];
  }

  // 내보내기
  function tabOut() {
    const pr = EX.printability(list), base = `${item.id}-1x${S.N}`, fin = item.finishes[S.fin];
    return [
      h('p', {}, `축척 1:${S.N} 크기(mm)로 내보냅니다.${inArtifact() ? ' 이 화면에서는 STL·OBJ·DXF가 zip으로 묶여 저장됩니다.' : ''}`),
      pr.ok ? h('div', { class: 'note', html: `${icon('check')}<span>모든 부품이 ${pr.minWall}mm 이상이라 FDM 프린터로 출력할 수 있습니다.</span>` })
        : h('div', { class: 'note note--warn', html: `${icon('warn')}<span>${pr.minWall}mm보다 얇은 부품 ${pr.thin.length}종: ${pr.thin.slice(0, 5).map((t) => `${esc(t.label)} ${esc(t.name)} ${fmt(t.t, 2)}mm`).join(', ')}. <b>시판 재료 두께에 맞추기</b>를 켜거나 더 큰 축척을 고르세요.</span>` }),
      h('h3', {}, '3D 모델'),
      h('div', { class: 'exports' },
        exp('완성형 STL', '조립된 모습 한 덩어리. 장식용으로 통째 출력할 때.', 'STL', () => saveFile(`${base}.stl`, EX.toSTL(EX.modelTriangles(model)), 'model/stl')),
        exp('부품 키트 STL', '부품을 눕혀 출력판(200mm)에 배치. 출력 후 직접 조립합니다.', 'STL', async () => {
          const plates = EX.kitTriangles(model);
          if (plates.length === 1) await saveFile(`${base}-kit.stl`, EX.toSTL(plates[0]), 'model/stl');
          else await saveFile(`${base}-kit.zip`, new Blob([EX.zip(plates.map((p, i) => ({ name: `${base}-kit-${i + 1}.stl`, data: EX.toSTL(p) })))]), 'application/zip');
        }),
        exp('OBJ + MTL', '색 정보 포함. 블렌더 등에서 편집할 때.', 'ZIP', async () => {
          const { obj, mtl } = EX.toOBJ(EX.modelTriangles(model, { includeOpt: true }), (p) => materialOf(p.role, fin));
          await saveFile(`${base}-obj.zip`, new Blob([EX.zip([{ name: 'model.obj', data: obj }, { name: 'model.mtl', data: mtl }])]), 'application/zip');
        })),
      h('h3', {}, '이미지'),
      h('div', { class: 'exports' },
        exp('지금 화면 PNG', '보고 있는 각도와 모드 그대로, 고품질로 다시 그려 저장합니다.', 'PNG', async () => {
          if (!stage) throw new Error('이 기기에서는 3D 렌더를 쓸 수 없습니다.');
          await saveFile(`${base}-render.png`, await canvasBlob(stage.renderStill({ samples: 96 })));
        })),
      h('p', { style: { fontSize: 'var(--t-xs)', color: 'var(--ink-3)' } }, '도면 PDF·SVG는 도면 탭, 재단표 CSV·DXF는 재단 탭에 있습니다.'),
    ];
  }

  // ───── 도면 뷰어 입력
  const ptrs = new Map(); let pinch = 0;
  sheetView.addEventListener('pointerdown', (e) => { sheetView.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  sheetView.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    if (ptrs.size === 2) { ptrs.set(e.pointerId, [e.clientX, e.clientY]); const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoom(d / pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = d; return; }
    pan.x += e.clientX - p[0]; pan.y += e.clientY - p[1]; ptrs.set(e.pointerId, [e.clientX, e.clientY]); placeSheet();
  });
  const up = (e) => { ptrs.delete(e.pointerId); pinch = 0; };
  sheetView.addEventListener('pointerup', up); sheetView.addEventListener('pointercancel', up);
  function zoom(f, cx, cy) {
    const r = sheetView.getBoundingClientRect(), ox = cx - r.left - r.width / 2, oy = cy - r.top - r.height / 2, k2 = Math.max(0.6, Math.min(24, pan.k * f)), g = k2 / pan.k;
    pan.x = ox - (ox - pan.x) * g; pan.y = oy - (oy - pan.y) * g; pan.k = k2; placeSheet();
  }
  sheetView.addEventListener('wheel', (e) => { e.preventDefault(); zoom(Math.exp(-e.deltaY * 0.0016), e.clientX, e.clientY); }, { passive: false });
  sheetView.addEventListener('dblclick', fitSheet);
  sheetView.addEventListener('keydown', (e) => { if (e.key === '+' || e.key === '=') zoom(1.25, innerWidth / 2, innerHeight / 2); else if (e.key === '-') zoom(0.8, innerWidth / 2, innerHeight / 2); else if (e.key === '0') fitSheet(); else if (e.key.startsWith('Arrow')) { e.preventDefault(); pan.x += e.key === 'ArrowLeft' ? 40 : e.key === 'ArrowRight' ? -40 : 0; pan.y += e.key === 'ArrowUp' ? 40 : e.key === 'ArrowDown' ? -40 : 0; placeSheet(); } });
  const ro = new ResizeObserver(() => { if (!sheetView.hidden) fitSheet(); });
  ro.observe(sheetView);

  // ───── 시작
  rebuild(false);
  import('../three/stage.js').then(({ Stage, webglSupported }) => {
    if (disposed || !webglSupported()) return;
    stageHost.innerHTML = ''; stageHost.dataset.gl = '1';
    stage = new Stage(stageHost, {
      maxDpr: ctx.lowPower ? 1.25 : 2, samples: ctx.lowPower ? 40 : 80,
      onHover: (p, e) => {
        if (!p) { tip.hidden = true; return; }
        const r = list.byId.get(p.id), vr = viewer.getBoundingClientRect();
        tip.innerHTML = `<b>${r ? `${esc(r.label)} · ` : ''}${esc(p.name)}</b>${r ? `${esc(r.dim)} mm · ${esc(r.info.ko)}` : ''}`;
        tip.style.left = `${e.clientX - vr.left}px`; tip.style.top = `${e.clientY - vr.top}px`; tip.hidden = false;
      },
      onSelect: (p) => {
        if (!hint.dataset.gone) { hint.dataset.gone = '1'; hint.style.opacity = '0'; }
        if (!p) { stage.highlight(null); return; }
        stage.highlight(p.id);
        const r = list.byId.get(p.id);
        if (r) { if (S.tab !== 'cut') setTab('cut'); const tr = panel.querySelector(`tr[data-key="${r.label}"]`); if (tr) { for (const x of panel.querySelectorAll('tbody tr')) x.classList.toggle('is-on', x === tr); tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }
      },
      onFrame: (s) => { const az = (((s.cam.theta * 180) / Math.PI) % 360 + 360) % 360; hud.az.textContent = `AZ ${String(Math.round(az)).padStart(3, '0')}°  EL ${String(Math.round(90 - (s.cam.phi * 180) / Math.PI)).padStart(2, '0')}°`; },
    });
    stage.setTheme({ dark: ctx.isDark() });
    stage.setLineTheme(ctx.isDark() ? 'night' : 'blueprint');
    stage.canvas.setAttribute('aria-label', `${item.name} ${item.type} 3D 모델. 화살표 키로 돌리고 +, - 키로 확대·축소합니다.`);
    stage.setModel(model, item.finishes[S.fin]);
    stage.setLamp(S.lamp);
    stage.setCallouts(list.rows.filter((r) => !r.opt).slice(0, 12).map((r) => ({ id: r.parts[0], text: r.label })));
    ctx.onTheme = () => { stage.setTheme({ dark: ctx.isDark() }); stage.setLineTheme(ctx.isDark() ? 'night' : 'blueprint'); };
    setTimeout(() => { if (!hint.dataset.gone) { hint.dataset.gone = '1'; hint.style.opacity = '0'; } }, 7000);
  }).catch(() => {});
  document.title = `${item.name} ${item.type} — MINIATYR`;

  return () => { disposed = true; stopPlay(); ro.disconnect(); ctx.onTheme = null; if (stage) stage.dispose(); };
}
