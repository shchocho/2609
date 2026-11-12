/*
 * 장면(상황) 그림 시안 — ?look=draft 에서만 쓰입니다.
 * 원본 부스 그림을 대신하는 새 그림입니다. 슬롯 이름({{…}})은 기존 템플릿과 같아 시나리오 JSON을 고치지 않아도 됩니다.
 * 강조색은 업무 영역 색(--track)을 따릅니다.
 */
const ACC = 'var(--track,#6c4bb6)';

export const SCENE_ART_DRAFT: Record<string, string> = {
  /* 견적 비교: 세 견적서 + 숨은 비용이 드러나는 막대 그래프와 돋보기 */
  'quote-compare': `<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
<defs>
<filter id="qdS" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#1e2a4a" flood-opacity=".12"/></filter>
<linearGradient id="qdBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9dbcf5"/><stop offset="1" stop-color="#6684cf"/></linearGradient>
<pattern id="qdHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" style="fill:${ACC}" opacity=".14"/><path d="M0 0v8" style="stroke:${ACC}" stroke-width="3" opacity=".6"/></pattern>
</defs>
<circle cx="250" cy="236" r="196" style="fill:${ACC}" opacity=".06"/>
<circle cx="640" cy="196" r="140" fill="#a9d4ff" opacity=".2"/>

<g class="il-fade il-d1">
<rect x="46" y="96" width="136" height="214" rx="16" fill="#fff" filter="url(#qdS)"/>
<rect x="46" y="96" width="136" height="44" rx="16" fill="#f3f6fb"/><rect x="46" y="124" width="136" height="16" fill="#f3f6fb"/>
<rect x="60" y="110" width="7" height="17" rx="2" fill="#c4314b"/>
<text x="74" y="123" font-size="10.5" font-weight="700" fill="#33415c">{{업체1}}</text>
<path d="M62 162h100M62 178h76M62 194h88" stroke="#e6ebf3" stroke-width="6" stroke-linecap="round"/>
<rect x="62" y="212" width="30" height="16" rx="8" style="fill:${ACC}" opacity=".3"/>
<rect x="98" y="212" width="30" height="16" rx="8" style="fill:${ACC}" opacity=".3"/>
<rect x="134" y="212" width="30" height="16" rx="8" fill="none" stroke="#b6c2d6" stroke-width="1.6" stroke-dasharray="3 3"/>
<rect x="60" y="248" width="108" height="42" rx="12" fill="#f3f6fb"/>
<text x="72" y="276" font-size="18" font-weight="800" fill="#1b1a19">{{금액1}}</text>
</g>

<g class="il-fade il-d2">
<rect x="196" y="80" width="136" height="214" rx="16" fill="#fff" filter="url(#qdS)"/>
<rect x="196" y="80" width="136" height="44" rx="16" fill="#f3f6fb"/><rect x="196" y="108" width="136" height="16" fill="#f3f6fb"/>
<rect x="210" y="94" width="7" height="17" rx="2" fill="#107c41"/>
<text x="224" y="107" font-size="10.5" font-weight="700" fill="#33415c">{{업체2}}</text>
<path d="M212 146h100M212 162h70" stroke="#e6ebf3" stroke-width="6" stroke-linecap="round"/>
<rect x="212" y="196" width="30" height="16" rx="8" style="fill:${ACC}" opacity=".3"/>
<rect x="248" y="196" width="30" height="16" rx="8" fill="none" stroke="#b6c2d6" stroke-width="1.6" stroke-dasharray="3 3"/>
<rect x="284" y="196" width="30" height="16" rx="8" fill="none" stroke="#b6c2d6" stroke-width="1.6" stroke-dasharray="3 3"/>
<rect x="210" y="232" width="108" height="42" rx="12" fill="#f3f6fb"/>
<text x="222" y="260" font-size="18" font-weight="800" fill="#1b1a19">{{금액2}}</text>
</g>

<g class="il-fade il-d3">
<rect x="346" y="96" width="136" height="214" rx="16" fill="#fff" filter="url(#qdS)"/>
<rect x="346" y="96" width="136" height="44" rx="16" fill="#f3f6fb"/><rect x="346" y="124" width="136" height="16" fill="#f3f6fb"/>
<rect x="360" y="110" width="7" height="17" rx="2" fill="#107c41"/>
<text x="374" y="123" font-size="10.5" font-weight="700" fill="#33415c">{{업체3}}</text>
<path d="M362 162h100M362 178h84M362 194h92" stroke="#e6ebf3" stroke-width="6" stroke-linecap="round"/>
<rect x="362" y="212" width="30" height="16" rx="8" style="fill:${ACC}" opacity=".3"/>
<rect x="398" y="212" width="30" height="16" rx="8" style="fill:${ACC}" opacity=".3"/>
<rect x="434" y="212" width="30" height="16" rx="8" style="fill:${ACC}" opacity=".3"/>
<rect x="360" y="248" width="108" height="42" rx="12" fill="#f3f6fb"/>
<text x="372" y="276" font-size="18" font-weight="800" fill="#1b1a19">{{금액3}}</text>
</g>

<g class="il-fade il-d4">
<rect x="520" y="80" width="238" height="230" rx="20" fill="#fff" filter="url(#qdS)"/>
<path d="M548 284h182" stroke="#dfe5ef" stroke-width="3" stroke-linecap="round"/>
<rect x="566" y="172" width="38" height="112" rx="8" fill="url(#qdBar)"/>
<rect x="566" y="152" width="38" height="20" rx="6" fill="url(#qdHatch)" style="stroke:${ACC}" stroke-width="1.5" stroke-dasharray="4 3"/>
<rect x="620" y="180" width="38" height="104" rx="8" fill="url(#qdBar)"/>
<rect x="620" y="132" width="38" height="48" rx="6" fill="url(#qdHatch)" style="stroke:${ACC}" stroke-width="1.5" stroke-dasharray="4 3"/>
<rect x="674" y="158" width="38" height="126" rx="8" fill="url(#qdBar)"/>
</g>

<g class="il-fade il-d5"><g class="ild-bob">
<circle cx="646" cy="150" r="38" fill="#fff" fill-opacity=".38" stroke="#33415c" stroke-width="7"/>
<path d="M674 178l28 28" stroke="#33415c" stroke-width="11" stroke-linecap="round"/>
<path d="M630 134a22 22 0 0 1 18-8" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>
</g></g>

<g class="il-fade il-d6">
<rect x="144" y="336" width="240" height="36" rx="18" fill="#fff" style="stroke:${ACC}" stroke-width="2"/>
<text x="264" y="359" font-size="13" font-weight="700" style="fill:${ACC}" text-anchor="middle">{{배지}}</text>
</g>
</svg>`,

  /* 지원서 정리: 양식이 다른 서류 더미 → 같은 항목 표, 개인정보는 제외 */
  'resume-screening': `<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
<defs>
<filter id="rdS" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#1e2a4a" flood-opacity=".12"/></filter>
</defs>
<circle cx="190" cy="270" r="170" style="fill:${ACC}" opacity=".06"/>
<circle cx="610" cy="230" r="160" fill="#c4f0df" opacity=".25"/>

<g class="il-fade il-d1">
<text x="56" y="68" font-size="16" font-weight="700" style="fill:${ACC}">{{원본제목}}</text>
<text x="56" y="106" font-size="34" font-weight="800" fill="#1b1a19">{{원본건수}}</text>
</g>

<g class="il-fade il-d2">
<g transform="rotate(-9 128 240)">
<rect x="52" y="146" width="152" height="190" rx="14" fill="#fff" filter="url(#rdS)"/>
<rect x="68" y="164" width="7" height="17" rx="2" fill="#c4314b"/>
<text x="82" y="177" font-size="11.5" font-weight="700" fill="#33415c">{{문서1}}</text>
<path d="M70 204h118M70 220h90M70 236h108M70 268h112M70 284h80M70 300h100" stroke="#e6ebf3" stroke-width="6" stroke-linecap="round"/>
<path d="M70 252h96" stroke="#d3ecdc" stroke-width="8" stroke-linecap="round"/>
</g>
<g transform="rotate(6 236 238)">
<rect x="160" y="136" width="152" height="204" rx="14" fill="#fff" filter="url(#rdS)"/>
<rect x="176" y="154" width="7" height="17" rx="2" fill="#185abd"/>
<text x="190" y="167" font-size="11.5" font-weight="700" fill="#33415c">{{문서2}}</text>
<rect x="176" y="188" width="120" height="70" rx="8" fill="#f5f8fc" stroke="#e3e9f2"/>
<path d="M176 211h120M176 234h120M216 188v70" stroke="#e3e9f2" stroke-width="2"/>
<path d="M226 200h52M226 223h40M226 246h48" stroke="#cbd6e6" stroke-width="5" stroke-linecap="round"/>
<path d="M178 282h110M178 298h84" stroke="#e6ebf3" stroke-width="6" stroke-linecap="round"/>
</g>
<g transform="rotate(-3 168 318)">
<rect x="104" y="282" width="128" height="76" rx="12" fill="#fff" filter="url(#rdS)"/>
<circle cx="136" cy="320" r="18" fill="#e9eef6"/><circle cx="136" cy="314" r="7" fill="#c3cfe0"/><path d="M123 332a13 10 0 0 1 26 0" fill="#c3cfe0"/>
<path d="M164 308h52M164 324h38M164 340h46" stroke="#e6ebf3" stroke-width="6" stroke-linecap="round"/>
</g>
</g>

<g class="il-fade il-d3">
<path class="il-dash" d="M318 236h40" stroke="#9aa9c4" stroke-width="4" stroke-linecap="round" stroke-dasharray="4 8"/>
<rect x="362" y="204" width="64" height="64" rx="18" fill="#fff" filter="url(#rdS)"/>
<path d="M394 218l5.5 12.5 12.5 5.5-12.5 5.5-5.5 12.5-5.5-12.5-12.5-5.5 12.5-5.5z" style="fill:${ACC}"/>
<path class="il-dash" d="M430 236h22" stroke="#9aa9c4" stroke-width="4" stroke-linecap="round" stroke-dasharray="4 8"/>
</g>

<g class="il-fade il-d5">
<rect x="456" y="92" width="300" height="264" rx="18" fill="#fff" filter="url(#rdS)"/>
<rect x="476" y="114" width="8" height="12" rx="2" fill="#107c41"/>
<text x="492" y="125" font-size="14" font-weight="700" fill="#1b1a19">{{출력제목}}</text>
<rect x="472" y="142" width="268" height="34" rx="10" style="fill:${ACC}" opacity=".1"/>
<text x="520" y="164" font-size="12.5" font-weight="700" style="fill:${ACC}" text-anchor="middle">{{항목1}}</text>
<text x="608" y="164" font-size="12.5" font-weight="700" style="fill:${ACC}" text-anchor="middle">{{항목2}}</text>
<text x="696" y="164" font-size="12.5" font-weight="700" style="fill:${ACC}" text-anchor="middle">{{항목3}}</text>
<path d="M476 214h260M476 252h260M476 290h260" stroke="#eef1f6" stroke-width="2"/>
<g fill="#dbe3ee">
<rect x="498" y="190" width="44" height="10" rx="5"/><rect x="498" y="228" width="34" height="10" rx="5"/><rect x="498" y="266" width="48" height="10" rx="5"/><rect x="498" y="304" width="38" height="10" rx="5"/>
<rect x="674" y="190" width="44" height="10" rx="5"/><rect x="674" y="228" width="44" height="10" rx="5"/><rect x="674" y="266" width="30" height="10" rx="5"/><rect x="674" y="304" width="44" height="10" rx="5"/>
</g>
<g style="fill:${ACC}">
<circle cx="608" cy="195" r="9"/><circle cx="608" cy="271" r="9"/><circle cx="608" cy="309" r="9"/>
</g>
<path d="M603.5 195l3 3 5.5-6M603.5 271l3 3 5.5-6M603.5 309l3 3 5.5-6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="608" cy="233" r="8" fill="none" stroke="#c9d3e3" stroke-width="2"/>
</g>

<g class="il-fade il-d6">
<rect x="456" y="374" width="300" height="38" rx="19" fill="#fff" stroke="#d6deea" stroke-width="2"/>
<path d="M472 393c4-6 9-9 14-9s10 3 14 9c-4 6-9 9-14 9s-10-3-14-9z" fill="none" stroke="#8a9bb8" stroke-width="2"/>
<circle cx="486" cy="393" r="3.5" fill="#8a9bb8"/><path d="M474 403l24-20" stroke="#8a9bb8" stroke-width="2" stroke-linecap="round"/>
<text x="510" y="398" font-size="12.5" font-weight="600" fill="#5a6b8c">{{제외항목}}</text>
</g>
</svg>`,

  /* 납기 지연: 늦어진 일정 + 남은 재고 게이지 + 비는 구간 + 대응 방법 */
  'delay-response': `<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
<defs>
<filter id="ddS" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#1e2a4a" flood-opacity=".12"/></filter>
<pattern id="ddHatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#fde9eb"/><path d="M0 0v9" stroke="#e9a4ab" stroke-width="3"/></pattern>
</defs>
<circle cx="636" cy="226" r="150" style="fill:${ACC}" opacity=".07"/>
<circle cx="214" cy="176" r="140" fill="#a9d4ff" opacity=".18"/>

<g class="il-fade il-d1">
<text x="62" y="78" font-size="16" font-weight="800" fill="#c4314b">{{지연라벨}}</text>
<path d="M70 140h420" stroke="#dbe3ee" stroke-width="8" stroke-linecap="round"/>
<g fill="#c9d3e3"><circle cx="110" cy="140" r="3"/><circle cx="190" cy="140" r="3"/><circle cx="230" cy="140" r="3"/><circle cx="270" cy="140" r="3"/><circle cx="310" cy="140" r="3"/><circle cx="350" cy="140" r="3"/><circle cx="390" cy="140" r="3"/><circle cx="460" cy="140" r="3"/></g>
</g>

<g class="il-fade il-d3">
<rect x="150" y="134" width="270" height="12" rx="6" fill="#c4314b" opacity=".16"/>
<circle cx="150" cy="140" r="10" fill="#8a9bb8" stroke="#fff" stroke-width="3"/>
<circle cx="420" cy="140" r="11" fill="#c4314b" stroke="#fff" stroke-width="3"/>
<text x="150" y="176" text-anchor="middle" font-size="12" font-weight="600" fill="#6b7a90">{{기존납기}}</text>
<text x="420" y="176" text-anchor="middle" font-size="12.5" font-weight="800" fill="#c4314b">{{변경납기}}</text>
<g class="ild-roll">
<rect x="360" y="98" width="38" height="24" rx="5" fill="#5a6b8c"/>
<path d="M398 106h12l8 8v8h-20z" fill="#7f91b0"/>
<circle cx="372" cy="124" r="5.5" fill="#33415c" stroke="#fff" stroke-width="2"/><circle cx="406" cy="124" r="5.5" fill="#33415c" stroke="#fff" stroke-width="2"/>
</g>
</g>

<g class="il-fade il-d2">
<rect x="50" y="206" width="200" height="180" rx="18" fill="#fff" filter="url(#ddS)"/>
<text x="70" y="236" font-size="13" font-weight="700" fill="#5a6b8c">{{재고라벨}}</text>
<path d="M94 324a56 56 0 0 1 112 0" fill="none" stroke="#edf0f5" stroke-width="16" stroke-linecap="round"/>
<path d="M94 324a56 56 0 0 1 23.1-45.3" fill="none" stroke="#e0524f" stroke-width="16" stroke-linecap="round"/>
<text x="150" y="318" text-anchor="middle" font-size="19" font-weight="800" fill="#1b1a19">{{현재고}}</text>
<text x="150" y="364" text-anchor="middle" font-size="10.5" font-weight="600" fill="#8a8886">{{사용량}}</text>
</g>

<g class="il-fade il-d4">
<rect x="266" y="206" width="234" height="180" rx="18" fill="#fff6f6" stroke="#f0c4c8" stroke-width="2"/>
<rect x="286" y="226" width="194" height="72" rx="12" fill="url(#ddHatch)"/>
<path d="M383 244l17 30h-34z" fill="#c4314b" stroke="#c4314b" stroke-width="4" stroke-linejoin="round"/>
<path d="M383 254v9" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><circle cx="383" cy="268.5" r="1.9" fill="#fff"/>
<text x="383" y="330" text-anchor="middle" font-size="14" font-weight="800" fill="#c4314b">{{공백라벨}}</text>
<text x="383" y="356" text-anchor="middle" font-size="10" font-weight="600" fill="#8a6269">{{공백설명}}</text>
</g>

<g class="il-fade il-d5">
<rect x="524" y="56" width="228" height="330" rx="20" fill="#fff" filter="url(#ddS)"/>
<text x="546" y="92" font-size="14" font-weight="800" fill="#33415c">{{대응라벨}}</text>
<rect x="540" y="110" width="196" height="74" rx="14" fill="#f4f7fb"/>
<circle cx="572" cy="147" r="19" style="fill:${ACC}" opacity=".9"/>
<g transform="translate(572 147) rotate(-35)" fill="#fff"><rect x="-11" y="-2.2" width="22" height="4.4" rx="2.2"/><path d="M-2-2l6 0-5-10h-3zM-2 2l6 0-5 10h-3zM-11-2h3l-3-5h-2zM-11 2h3l-3 5h-2z"/></g>
<text x="600" y="152" font-size="11.5" font-weight="700" fill="#33415c">{{대응1}}</text>
<rect x="540" y="196" width="196" height="74" rx="14" fill="#f4f7fb"/>
<circle cx="572" cy="233" r="19" style="fill:${ACC}" opacity=".9"/>
<g transform="translate(572 233)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><rect x="-10" y="-7" width="12" height="13" rx="2"/><path d="M5 -1h7M9 -4l3 3-3 3"/></g>
<text x="600" y="238" font-size="11.5" font-weight="700" fill="#33415c">{{대응2}}</text>
</g>
<g class="il-fade il-d6">
<rect x="540" y="282" width="196" height="74" rx="14" fill="#f4f7fb"/>
<circle cx="572" cy="319" r="19" style="fill:${ACC}" opacity=".9"/>
<g transform="translate(572 319)" fill="#fff"><path d="M-11-2 0-11 11-2z"/><rect x="-8" y="-2" width="16" height="12" rx="1.5"/><rect x="-2.2" y="3" width="4.4" height="7" style="fill:${ACC}"/></g>
<text x="600" y="324" font-size="11.5" font-weight="700" fill="#33415c">{{대응3}}</text>
</g>
</svg>`,
};
