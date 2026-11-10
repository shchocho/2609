// pages.js — 만드는 법(가이드) · 스케일 랩 · 내 공방.

import { h, icon, store, thumb, toast, saveFile, esc, no3 } from './dom.js';
import { CATALOG, getItem } from '../data/catalog.js';
import { buildModel } from '../core/kit.js';
import { SCALES, fmt } from '../core/scale.js';
import { modelSVG, VIEWS } from '../core/project.js';

// ---------------------------------------------------------------- 가이드
const GUIDE = [
  ['scale', '축척 고르기', () => [
    h('p', {}, '축척은 "실물의 몇 분의 1로 줄이는가"입니다. 1:12는 실물 12cm가 미니어처 1cm가 된다는 뜻입니다. 처음이라면 재료와 소품을 구하기 쉬운 1:12를 권합니다.'),
    h('div', { class: 'cards2' }, SCALES.map((s) => h('div', { class: 'mini' }, h('span', { class: 'mono' }, s.label), h('b', {}, s.name), h('p', {}, s.note), h('p', { class: 'mono', style: { fontSize: 'var(--t-xs)', color: 'var(--ink-3)' } }, `책장 202cm → ${fmt(2020 / s.n, 1)}mm`)))),
    h('p', {}, '축척이 작아질수록 판재가 종이처럼 얇아집니다. 워크벤치의 "시판 재료 두께에 맞추기"를 켜면 0.5·1·1.5·2·3mm처럼 실제로 살 수 있는 두께로 도면 전체가 다시 계산됩니다.'),
  ]],
  ['material', '재료', () => [
    h('div', { class: 'cards2' }, [
      ['판재', '발사·바스우드 1~3mm가 기본입니다. 흰 가구는 하드보드지나 폼보드에 흰 종이를 붙여도 깔끔합니다.'],
      ['각재·환봉', '다리와 프레임에 씁니다. 가는 것은 이쑤시개·대나무 꼬치·성냥개비로 대신할 수 있습니다.'],
      ['철사·황동봉', '파이프 의자, 행거, 손잡이에 씁니다. 1~2mm 알루미늄 선이 구부리기 쉽습니다.'],
      ['투명판', '유리는 0.5~1mm PET판이나 아크릴로 만듭니다. 포장 케이스를 오려 써도 됩니다.'],
      ['원단·스펀지', '소파와 쿠션용. 얇고 올이 고운 면·린넨이 축척에 맞아 보입니다.'],
      ['종이', '조명 갓은 트레이싱지, 수납통은 색지로 접습니다. 전개도 시트를 그대로 인쇄해 씁니다.'],
    ].map(([t, d]) => h('div', { class: 'mini' }, h('b', {}, t), h('p', {}, d)))),
  ]],
  ['tools', '도구', () => [
    h('ul', { class: 'checks' }, ['커팅 매트와 쇠자 — 눈금이 있는 매트면 직각 맞추기가 쉽습니다', '아트 나이프(30° 칼날) — 날은 자주 갈아 끼웁니다', '목공 본드와 순간접착제 — 나무는 본드, 금속·플라스틱은 순간접착제', '사포 400·800방 — 납작한 막대에 붙여 쓰면 면이 평평하게 갈립니다', '핀셋·마스킹 테이프·직각자', '핀바이스(0.5~1mm 드릴) — 손잡이·경첩 구멍용'].map((x) => h('li', {}, x))),
  ]],
  ['cut', '재단', () => [
    h('p', {}, '도면 탭의 "재단 템플릿" 시트를 실제 크기(100%)로 인쇄합니다. 시트 위쪽 50mm 눈금을 자로 재어 배율이 맞는지 먼저 확인하세요.'),
    h('ol', { class: 'checks' }, ['템플릿을 딱풀로 재료에 붙입니다(나중에 떼기 쉽게 살짝만).', '쇠자를 대고 칼을 세워 여러 번 가볍게 긋습니다. 한 번에 자르려 하면 결이 뜯깁니다.', '같은 부품은 겹쳐 놓고 사포로 한꺼번에 다듬어 크기를 맞춥니다.', '곡선 부품은 바깥쪽에 여유를 두고 자른 뒤 사포로 선까지 갈아 냅니다.'].map((x) => h('li', {}, x))),
  ]],
  ['glue', '접착과 직각', () => [
    h('p', {}, '미니어처는 1mm만 틀어져도 눈에 띕니다. 붙일 때마다 직각자를 대고, 본드가 굳을 때까지 마스킹 테이프로 잡아 둡니다. 본드는 이쑤시개 끝으로 점 찍듯 바르고, 삐져나온 것은 굳기 전에 닦습니다.'),
  ]],
  ['paint', '도색과 마감', () => [
    h('p', {}, '칠은 조립 전에 하는 편이 깔끔합니다. 서페이서(밑칠) → 고운 사포 → 아크릴 물감 얇게 두세 번 → 무광·반광 바니시 순서입니다. 원목 느낌은 수성 스테인을 헝겊으로 문질러 냅니다.'),
  ]],
  ['fabric', '패브릭 가구', () => [
    h('p', {}, '소파는 폼보드나 발사로 덩어리(받침·등받이·팔걸이)를 만들고 각각 원단을 씌운 뒤 조립합니다. 쿠션은 스펀지를 재단해 원단으로 감싸고, 안쪽에서 양면테이프로 고정합니다. 윗면 모서리를 가위로 살짝 다듬으면 볼록한 쿠션이 됩니다.'),
  ]],
  ['print', '3D 프린트로 만들기', () => [
    h('p', {}, '내보내기 탭에서 STL을 받습니다. "부품 키트"는 부품을 눕혀 출력판에 배치한 파일이라 서포트 없이 출력한 뒤 직접 조립할 수 있습니다. 0.8mm보다 얇은 부품이 있으면 경고가 뜨니, 두께 맞추기를 켜거나 큰 축척을 고르세요.'),
  ]],
];

export function guidePage(root) {
  const page = h('div', { class: 'page wrap doc' },
    h('nav', { class: 'doc__toc', 'aria-label': '목차' }, GUIDE.map(([id, t]) => h('a', { href: `#guide`, onclick: (e) => { e.preventDefault(); document.getElementById(`g-${id}`).scrollIntoView({ behavior: 'smooth' }); } }, t))),
    h('div', { class: 'doc__body' },
      h('header', {}, h('span', { class: 'tape' }, '만드는 법'), h('h1', { style: { marginTop: '14px' } }, '도면 한 장에서 손바닥 위 가구까지'), h('p', {}, '미니어처 가구는 네 단계로 만듭니다. 각 단계는 워크벤치의 탭 하나와 짝을 이룹니다.')),
      h('ol', { class: 'flow' }, [['01', '도면', '축척을 고르면 삼면도·분해도·부품도가 그려집니다.'], ['02', '재단', '1:1 템플릿을 인쇄해 붙이고 자릅니다.'], ['03', '조립', '3D 순서를 따라 붙입니다.'], ['04', '마감', '칠하고, 씌우고, 손잡이를 답니다.']].map(([n, t, d]) => h('li', {}, h('i', {}, n), h('b', {}, t), h('span', {}, d)))),
      GUIDE.map(([id, t, body]) => h('section', { id: `g-${id}` }, h('h2', {}, t), body())),
      h('div', { class: 'hero__cta' }, h('a', { class: 'btn btn--lg btn--mat', href: '#item-billy' }, '첫 작품으로 BILLY 만들기'), h('a', { class: 'btn btn--lg', href: '#home' }, '컬렉션 보기'))));
  root.append(page);
  document.title = '만드는 법 — MINIATYR';
  return () => {};
}

// ---------------------------------------------------------------- 스케일 랩
export function labPage(root) {
  const S = { id: 'billy', N: store.get('N'), mm: store.get('mmpx') };
  const board = h('div', { class: 'lab__board' });
  const tbl = h('tbody', {});
  const sel = h('select', { id: 'lab-item', 'aria-label': '가구', onchange: (e) => { S.id = e.target.value; draw(); } }, CATALOG.map((it) => h('option', { value: it.id }, `${no3(it.no)} ${it.name} ${it.type}`)));
  const seg = h('div', { class: 'seg seg--mono', role: 'group', 'aria-label': '축척' }, SCALES.map((s) => h('button', { type: 'button', 'aria-pressed': String(s.n === S.N), onclick: () => { S.N = s.n; store.set('N', s.n); for (const b of seg.children) b.setAttribute('aria-pressed', String(b.textContent === s.label)); draw(); } }, s.label)));
  const cal = h('input', { class: 'range', type: 'range', id: 'lab-cal', min: '2.4', max: '6.5', step: '0.005', value: String(S.mm), 'aria-label': '화면 크기 보정', oninput: (e) => { S.mm = Number(e.target.value); store.set('mmpx', S.mm); draw(); } });
  function draw() {
    const it = getItem(S.id), model = buildModel(it, { N: S.N }), [w, hh, d] = model.bbox.size, mm = S.mm;
    board.style.setProperty('--mm', `${mm}px`);
    const svg = modelSVG(model, { view: VIEWS.front, pad: 0, stroke: 0.004, filter: (p) => !p.opt, style: () => ({ fill: '#2c6b58', stroke: '#eef7f1' }) });
    const pw = (w / S.N) * mm, ph = (hh / S.N) * mm, cardW = 85.6 * mm, cardH = 53.98 * mm, coin = 26.5 * mm, pad = 10 * mm;
    const H = Math.max(ph, cardH) + pad * 2 + 24;
    board.innerHTML = `<div style="position:relative;width:${pw + cardW + coin + pad * 5}px;height:${H}px">
      <div style="position:absolute;left:${pad}px;bottom:${pad}px;width:${pw}px;height:${ph}px">${svg.replace('<svg ', '<svg width="100%" height="100%" preserveAspectRatio="none" ')}</div>
      <div style="position:absolute;left:${pad * 2 + pw}px;bottom:${pad}px;width:${cardW}px;height:${cardH}px;border:1.5px dashed #eef7f1;border-radius:${3.2 * mm}px;display:grid;place-items:center;color:#eef7f1;font:500 12px var(--f-mono)">신용카드 85.6 × 54</div>
      <div style="position:absolute;left:${pad * 3 + pw + cardW}px;bottom:${pad}px;width:${coin}px;height:${coin}px;border:1.5px dashed #eef7f1;border-radius:50%;display:grid;place-items:center;color:#eef7f1;font:500 10px var(--f-mono)">500원</div>
      <div style="position:absolute;left:${pad}px;top:8px;color:#eef7f1;font:600 12px var(--f-mono)">${esc(it.name)} 정면 · 1:${S.N} · ${fmt(w / S.N, 1)} × ${fmt(hh / S.N, 1)} mm (실제 크기)</div></div>`;
    tbl.replaceChildren(...SCALES.map((s) => h('tr', { class: s.n === S.N ? 'is-on' : null }, h('td', { class: 'mono' }, s.label), h('td', { class: 'num' }, fmt(w / s.n, 1)), h('td', { class: 'num' }, fmt(d / s.n, 1)), h('td', { class: 'num' }, fmt(hh / s.n, 1)))));
  }
  const page = h('div', { class: 'page wrap' },
    h('div', { class: 'sec__head', style: { paddingTop: '20px' } }, h('div', {}, h('span', { class: 'tape' }, '스케일 랩'), h('h2', { style: { marginTop: '12px' } }, '완성하면 실제로 얼마나 클까'), h('p', {}, '초록 판의 눈금은 1cm입니다. 가구 정면이 화면에 실제 크기로 그려집니다.'))),
    h('div', { class: 'lab' }, board,
      h('aside', { class: 'lab__side' },
        h('div', { class: 'panel ctl' },
          h('div', { class: 'ctl__row' }, h('span', {}, '가구'), h('label', { class: 'field' }, sel)),
          h('div', { class: 'ctl__row' }, h('span', {}, '축척'), seg),
          h('div', { class: 'ctl__row' }, h('span', {}, '화면 보정'), cal, h('p', { style: { fontSize: 'var(--t-xs)', color: 'var(--ink-3)', lineHeight: 1.5 } }, '실제 신용카드를 화면의 점선 카드에 대고, 폭이 같아질 때까지 조절하세요. 한 번 맞추면 이 기기에 기억됩니다.'))),
        h('div', { class: 'tablewrap' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['축척', '폭', '깊이', '높이 (mm)'].map((x, i) => h('th', { class: i ? 'num' : null, scope: 'col' }, x)))), tbl)),
        h('a', { class: 'btn btn--mat', href: '#home', onclick: (e) => { e.preventDefault(); location.hash = `#item-${S.id}`; } }, '이 가구 만들러 가기'))));
  root.append(page);
  draw();
  document.title = '스케일 랩 — MINIATYR';
  return () => {};
}

// ---------------------------------------------------------------- 내 공방
export function workshopPage(root) {
  const list = h('div', { style: { display: 'grid', gap: '12px' } });
  function draw() {
    const items = Object.entries(store.all().items).filter(([, v]) => v.started || (v.done && v.done.length)).map(([id, v]) => ({ it: getItem(id), v })).filter((x) => x.it).sort((a, b) => (b.v.started || 0) - (a.v.started || 0));
    list.replaceChildren();
    if (!items.length) {
      list.append(h('div', { class: 'panel', style: { padding: '40px 24px', textAlign: 'center', display: 'grid', gap: '14px', justifyItems: 'center' } },
        h('p', { style: { fontWeight: 700, fontSize: 'var(--t-lg)' } }, '아직 시작한 작품이 없습니다'),
        h('p', { style: { color: 'var(--ink-2)', maxWidth: '30em' } }, '가구를 골라 조립 탭에서 단계를 체크하면 여기에 진행 상황이 쌓입니다. 기록은 이 기기의 브라우저에만 저장됩니다.'),
        h('a', { class: 'btn btn--mat', href: '#home' }, '컬렉션에서 고르기')));
      return;
    }
    for (const { it, v } of items) {
      const total = buildModel(it, { N: 12, variant: v.variant || undefined }).steps.length, done = (v.done || []).length;
      let armed = false;
      const del = h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => { if (!armed) { armed = true; del.textContent = '한 번 더 누르면 지웁니다'; setTimeout(() => { armed = false; del.textContent = '기록 지우기'; }, 3000); return; } store.dropItem(it.id); toast(`${it.name} 진행 기록을 지웠습니다.`); draw(); } }, '기록 지우기');
      list.append(h('div', { class: 'panel proj' },
        h('img', { src: thumb(it.id), alt: '' }),
        h('div', { style: { display: 'grid', gap: '6px', minWidth: 0 } }, h('h3', {}, it.name), h('p', {}, `${it.ko} ${it.type} · ${done}/${total}단계${done >= total ? ' · 완성' : ''}`),
          h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(done), 'aria-label': `${it.name} 진행률` }, h('i', { style: { '--p': `${Math.min(100, (done / total) * 100)}%` } }))),
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, h('a', { class: 'btn btn--sm btn--mat', href: `#item-${it.id}` }, done >= total ? '다시 보기' : '이어서 만들기'), del)));
    }
  }
  const file = h('input', { type: 'file', id: 'ws-file', accept: 'application/json,.json', class: 'sr', onchange: async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const data = JSON.parse(await f.text()); if (!data || typeof data.items !== 'object') throw new Error(); store.replace(data); toast('백업을 불러왔습니다.'); draw(); }
    catch { toast('백업 파일을 읽지 못했습니다. MINIATYR에서 내보낸 .json 파일인지 확인해 주세요.'); }
    e.target.value = '';
  } });
  const page = h('div', { class: 'page wrap' },
    h('div', { class: 'sec__head', style: { paddingTop: '20px' } }, h('div', {}, h('span', { class: 'tape' }, '내 공방'), h('h2', { style: { marginTop: '12px' } }, '만들고 있는 것들'), h('p', {}, '조립 단계를 체크한 가구가 여기에 모입니다.')),
      h('div', { style: { display: 'flex', gap: '8px' } },
        h('button', { type: 'button', class: 'btn btn--sm', html: `${icon('down')} 백업 저장`, onclick: () => saveFile('miniatyr-backup.json', JSON.stringify(store.all(), null, 2), 'application/json') }),
        h('label', { class: 'btn btn--sm', for: 'ws-file', tabindex: '0', onkeydown: (e) => { if (e.key === 'Enter') file.click(); } }, '백업 불러오기'), file)),
    list, h('div', { style: { height: '72px' } }));
  root.append(page);
  draw();
  document.title = '내 공방 — MINIATYR';
  return () => {};
}
