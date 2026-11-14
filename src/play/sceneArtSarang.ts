/*
 * 고객사(사랑의교회) 실습 시나리오의 상황 그림 — 새로 그린 그림입니다(원본 부스 이미지를 쓰지 않음).
 * 모든 그림이 같은 틀(왼쪽 목록 카드 · 아래 메모 카드 · 오른쪽 그림 카드)을 쓰고, 오른쪽 그림만 주제에 따라 바뀝니다.
 * 슬롯: 왼쪽제목 · 왼쪽1~3 · 왼쪽메모 · 가운데제목 · 가운데1~2 · 배지 · 그림제목 · 그림메모
 * 강조색은 영역 색(--track)을 따릅니다. 글자는 한 줄에 14자 안팎까지 들어갑니다.
 */
const ACC = 'var(--track,#5b5fc7)';
const INK = '#33415c', SUB = '#5b6478', LINE = '#e6ebf3';

const row = (y: number, slot: string) => `
<circle cx="72" cy="${y - 4}" r="9" style="fill:${ACC}" opacity=".22"/>
<text x="90" y="${y}" font-size="11.5" fill="${SUB}">{{${slot}}}</text>
<path d="M62 ${y + 14}h206" stroke="${LINE}" stroke-width="1.5"/>`;

function board(id: string, picto: string): string {
  return `<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
<defs><filter id="${id}S" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#1e2a4a" flood-opacity=".12"/></filter></defs>
<circle cx="230" cy="232" r="188" style="fill:${ACC}" opacity=".07"/>
<circle cx="640" cy="196" r="142" fill="#a9d4ff" opacity=".2"/>
<g class="il-fade il-d1">
<rect x="44" y="62" width="244" height="216" rx="16" fill="#fff" filter="url(#${id}S)"/>
<rect x="60" y="80" width="7" height="17" rx="2" style="fill:${ACC}"/>
<text x="76" y="94" font-size="12.5" font-weight="700" fill="${INK}">{{왼쪽제목}}</text>
${row(132, '왼쪽1')}${row(170, '왼쪽2')}${row(208, '왼쪽3')}
<rect x="60" y="238" width="212" height="26" rx="13" fill="#fdecea"/>
<text x="74" y="255" font-size="11" font-weight="600" fill="#b3261e">{{왼쪽메모}}</text>
</g>
<g class="il-fade il-d2">
<rect x="208" y="296" width="262" height="108" rx="16" fill="#fff" filter="url(#${id}S)"/>
<text x="226" y="326" font-size="12.5" font-weight="700" fill="${INK}">{{가운데제목}}</text>
<text x="226" y="352" font-size="11.5" fill="${SUB}">{{가운데1}}</text>
<text x="226" y="374" font-size="11.5" fill="${SUB}">{{가운데2}}</text>
<rect x="392" y="308" width="62" height="26" rx="13" style="fill:${ACC}"/>
<text x="423" y="325" font-size="11.5" font-weight="700" fill="#fff" text-anchor="middle">{{배지}}</text>
</g>
<g class="il-fade il-d3">
<rect x="504" y="70" width="252" height="300" rx="18" fill="#fff" filter="url(#${id}S)"/>
<text x="524" y="102" font-size="12.5" font-weight="700" fill="${INK}">{{그림제목}}</text>
${picto}
<text x="630" y="348" font-size="11.5" fill="${SUB}" text-anchor="middle">{{그림메모}}</text>
</g>
</svg>`;
}

/* 오른쪽 카드 안의 그림 (가로 524~736, 세로 120~320 안에 그린다) */
const PICTO = {
  chat: `<rect x="530" y="128" width="130" height="38" rx="14" fill="#eef1f8"/><rect x="600" y="178" width="130" height="38" rx="14" style="fill:${ACC}" opacity=".24"/>
<rect x="530" y="228" width="96" height="38" rx="14" fill="#eef1f8"/><rect x="634" y="278" width="96" height="30" rx="12" style="fill:${ACC}" opacity=".24"/>
<path d="M546 147h84M616 197h84M546 247h54" stroke="#b6c2d6" stroke-width="5" stroke-linecap="round"/>`,
  calendar: `<rect x="536" y="126" width="188" height="186" rx="12" fill="#f3f6fb"/><rect x="536" y="126" width="188" height="34" rx="12" style="fill:${ACC}" opacity=".85"/>
<path d="M536 190h188M536 230h188M536 270h188M583 160v152M630 160v152M677 160v152" stroke="#dbe2ee" stroke-width="1.5"/>
<rect x="588" y="196" width="37" height="28" rx="6" style="fill:${ACC}" opacity=".3"/><rect x="635" y="236" width="37" height="28" rx="6" fill="#ffd9a8"/>
<path d="M566 118v16M694 118v16" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
  files: `<path d="M540 160a10 10 0 0 1 10-10h54l16 18h90a10 10 0 0 1 10 10v114a10 10 0 0 1-10 10H550a10 10 0 0 1-10-10z" style="fill:${ACC}" opacity=".26"/>
<rect x="566" y="192" width="78" height="96" rx="8" fill="#fff" stroke="#dbe2ee" stroke-width="1.5"/><rect x="618" y="208" width="78" height="96" rx="8" fill="#fff" stroke="#dbe2ee" stroke-width="1.5"/>
<path d="M630 232h54M630 250h40M630 268h48" stroke="#b6c2d6" stroke-width="5" stroke-linecap="round"/>`,
  doc: `<rect x="566" y="124" width="128" height="190" rx="10" fill="#f3f6fb"/><rect x="582" y="144" width="60" height="12" rx="6" style="fill:${ACC}" opacity=".7"/>
<path d="M582 178h96M582 198h80M582 218h96M582 238h64M582 258h90M582 278h52" stroke="#c6d0e0" stroke-width="5" stroke-linecap="round"/>
<path d="M704 132l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" style="fill:${ACC}"/>`,
  chart: `<rect x="536" y="126" width="188" height="186" rx="12" fill="#f3f6fb"/>
<rect x="558" y="236" width="26" height="58" rx="5" style="fill:${ACC}" opacity=".35"/><rect x="596" y="200" width="26" height="94" rx="5" style="fill:${ACC}" opacity=".55"/>
<rect x="634" y="170" width="26" height="124" rx="5" style="fill:${ACC}" opacity=".8"/><rect x="672" y="214" width="26" height="80" rx="5" fill="#ffd9a8"/>
<path d="M552 294h156" stroke="#b6c2d6" stroke-width="2"/>`,
  mail: `<rect x="540" y="150" width="180" height="128" rx="12" fill="#f3f6fb"/><path d="M540 162l90 62 90-62" fill="none" style="stroke:${ACC}" stroke-width="5" stroke-linejoin="round"/>
<circle cx="716" cy="150" r="17" fill="#c4314b"/><text x="716" y="155" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">12</text>
<path d="M560 296h140M560 312h96" stroke="#c6d0e0" stroke-width="5" stroke-linecap="round"/>`,
  slides: `<rect x="544" y="128" width="172" height="104" rx="10" style="fill:${ACC}" opacity=".8"/><path d="M562 156h80M562 176h54" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
<rect x="544" y="246" width="80" height="54" rx="8" fill="#f3f6fb"/><rect x="636" y="246" width="80" height="54" rx="8" fill="#f3f6fb"/>
<path d="M556 264h44M556 280h30M648 264h44M648 280h30" stroke="#c6d0e0" stroke-width="5" stroke-linecap="round"/>`,
  form: `<rect x="560" y="122" width="140" height="194" rx="10" fill="#f3f6fb"/><rect x="560" y="122" width="140" height="22" rx="10" style="fill:${ACC}" opacity=".8"/>
<circle cx="582" cy="174" r="7" fill="none" style="stroke:${ACC}" stroke-width="2.5"/><circle cx="582" cy="174" r="3" style="fill:${ACC}"/>
<circle cx="582" cy="206" r="7" fill="none" stroke="#b6c2d6" stroke-width="2.5"/><circle cx="582" cy="238" r="7" fill="none" stroke="#b6c2d6" stroke-width="2.5"/>
<path d="M600 174h78M600 206h62M600 238h70" stroke="#c6d0e0" stroke-width="5" stroke-linecap="round"/><rect x="576" y="266" width="108" height="32" rx="8" fill="#fff" stroke="#dbe2ee" stroke-width="1.5"/>`,
  poster: `<rect x="572" y="120" width="116" height="164" rx="8" style="fill:${ACC}" opacity=".2"/><circle cx="630" cy="178" r="30" fill="#ffd9a8"/>
<path d="M590 240h80M602 258h56" style="stroke:${ACC}" stroke-width="6" stroke-linecap="round"/>
<rect x="548" y="150" width="116" height="164" rx="8" fill="none" stroke="#b6c2d6" stroke-width="1.6" stroke-dasharray="5 5"/>`,
  agent: `<rect x="576" y="150" width="108" height="92" rx="22" style="fill:${ACC}" opacity=".8"/><circle cx="610" cy="192" r="9" fill="#fff"/><circle cx="650" cy="192" r="9" fill="#fff"/>
<path d="M630 150v-18" style="stroke:${ACC}" stroke-width="5" stroke-linecap="round"/><circle cx="630" cy="128" r="7" style="fill:${ACC}"/>
<rect x="548" y="260" width="164" height="44" rx="14" fill="#f3f6fb"/><path d="M566 282h110" stroke="#c6d0e0" stroke-width="5" stroke-linecap="round"/>`,
  app: `<rect x="548" y="126" width="164" height="186" rx="14" fill="#f3f6fb"/><rect x="566" y="146" width="128" height="24" rx="7" fill="#fff" stroke="#dbe2ee" stroke-width="1.5"/>
<rect x="566" y="180" width="128" height="24" rx="7" fill="#fff" stroke="#dbe2ee" stroke-width="1.5"/><rect x="566" y="218" width="128" height="30" rx="9" style="fill:${ACC}" opacity=".85"/>
<path d="M592 274l-14 12 14 12M668 274l14 12-14 12M640 268l-20 36" fill="none" style="stroke:${ACC}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
};

export const SCENE_ART_SARANG: Record<string, string> = Object.fromEntries(
  Object.entries(PICTO).map(([k, p]) => [`sr-${k}`, board(`sr${k}`, p)]),
);
