/** Word · Excel · PowerPoint 창과 오른쪽 Copilot 창 (구조: docs/reference/render-spec.md §3.5) */
import type { ReactNode, RefObject } from 'react';
import type { Pick, PlayState, Scenario, Vars } from '../types';
import { APPS, type AppId } from '../data';
import { artifactName } from '../engine/text';
import { ArtifactView } from '../components/artifacts';
import { PickText, SlashPopup, type Mark, type PickPhase } from '../components/chrome';

const UI: Record<string, { tabs: string[]; groups: [string, string][]; head: string; sub?: string; input: string }> = {
  word: {
    tabs: ['파일', '홈', '삽입', '그리기', '디자인', '레이아웃', '참조', '편지', '검토', '보기'],
    groups: [['📋', '클립보드'], ['Ａ', '글꼴'], ['≡', '단락'], ['▤', '스타일'], ['⌕', '편집'], ['◈', 'Copilot']],
    head: '문서를 편집해 보겠습니다.',
    sub: '무엇을 하고 싶은지 알려주시면, 바로 문서 편집을 시작할 수 있습니다.',
    input: 'Copilot으로 편집',
  },
  excel: {
    tabs: ['파일', '홈', '삽입', '페이지 레이아웃', '수식', '데이터', '검토', '보기', '자동화'],
    groups: [['📋', '클립보드'], ['Ａ', '글꼴'], ['≡', '맞춤'], ['%', '표시 형식'], ['⊞', '셀'], ['⌕', '편집'], ['◈', 'Copilot']],
    head: '통합 문서 편집',
    input: 'Copilot으로 편집',
  },
  powerpoint: {
    tabs: ['파일', '홈', '삽입', '그리기', '디자인', '전환', '애니메이션', '슬라이드 쇼', '검토', '보기'],
    groups: [['📋', '클립보드'], ['⊞', '슬라이드'], ['Ａ', '글꼴'], ['≡', '단락'], ['◳', '그리기'], ['⌕', '편집'], ['◈', 'Copilot']],
    head: '프레젠테이션을 편집해 보겠습니다.',
    input: '만들거나 편집할 항목 설명',
  },
};

export function Office({ s, st, vars, ids, streamRef, mark, ask, onSend, pick, pickPhase, onPickSelect, onSlide, children }: {
  s: Scenario; st: PlayState; vars: Vars; ids: string[]; streamRef: RefObject<HTMLDivElement | null>; mark: Mark;
  ask: string | null; onSend?: () => void; pick?: Pick; pickPhase: PickPhase; onPickSelect: () => void;
  onSlide: (n: number) => void; children: ReactNode;
}) {
  const surface = s.surface as AppId; // check-scenarios 가 word · excel · powerpoint 로 제한
  const ui = UI[surface] ?? UI.word;
  // 캔버스 문서: 이 앱의 결과물 중 가장 최근에 연 것, 아직 없으면 맨 앞의 것
  const arts = s.workbench?.artifacts ?? {};
  const id = [...st.opened].reverse().find(k => arts[k]?.app === surface) ?? Object.keys(arts).find(k => arts[k].app === surface);
  const doc = id ? arts[id] : undefined;
  // Copilot 이 쓰기 전의 새 결과물은 빈 문서로 둔다
  const writing = !id || !doc ? null : st.writing === id ? st.rows : doc.origin === 'made' && !st.opened.includes(id) ? 0 : null;
  const slashOpen = !!(pick && ask && (pickPhase === 'search' || pickPhase === 'pick'));
  return (
    <div className="sc-shell is-office" data-app={surface}>
      <div className="sc-win">
        <span className="sc-win-name"><span className="sc-save">자동 저장 ●</span>{doc ? artifactName(doc, ids) : s.title} · {APPS[surface].name}</span>
        <span className="sc-win-search">⌕ 검색</span>
        <span className="sc-win-btns" aria-hidden="true"><i>─</i><i>▢</i><i>✕</i></span>
      </div>
      <div className={`sc-ribbon sc-zone ${mark('ribbon')}`}>
        <span className="sc-ribbon-tabs">{ui.tabs.map((t, i) => <i key={t} className={i === 1 ? 'on' : undefined}>{t}</i>)}</span>
        <span className="sc-ribbon-groups">
          {ui.groups.map(([ico, name]) => (
            <span key={name} className={name === 'Copilot' ? 'is-copilot' : undefined}><b aria-hidden="true">{ico}</b><i>{name}</i></span>
          ))}
        </span>
      </div>
      <div className="sc-office-body">
        <div className={`sc-canvas sc-zone ${mark('canvas')}`}>
          {doc && <ArtifactView a={doc} writing={writing} vars={vars} ids={ids} slide={st.slide} moved={st.moved} over={st.over} onSlide={onSlide} />}
        </div>
        <div className={`sc-pane sc-zone ${mark('pane')}`}>
          <span className="sc-pane-top"><i>≡</i><i>⛨</i><i className="sc-chip">{vars.model} ⌄</i><i>⋯</i><i>✕</i></span>
          <b className="sc-pane-head">{ui.head}</b>
          {ui.sub && <span className="sc-pane-sub">{ui.sub}</span>}
          <i className="sc-pane-allow">편집 허용 ⌄</i>
          <div className="sc-stream-in" ref={streamRef}>{children}</div>
          <div className={`sc-composer is-pane sc-zone ${mark('composer')}`}>
            <b aria-hidden="true">＋</b>
            <span className={ask ? 'is-filled' : undefined}>{ask && pick ? <PickText text={ask} pick={pick} phase={pickPhase} /> : ask ?? ui.input}</span>
            <i aria-hidden="true">🎤</i>
            {onSend && <button type="button" className="sc-pane-send is-hunt" aria-label="보내기" onClick={onSend}>↑</button>}
            {slashOpen && pick && <SlashPopup pick={pick} active={pickPhase === 'pick'} onPick={pickPhase === 'search' ? onPickSelect : undefined} />}
          </div>
        </div>
      </div>
      <div className="sc-status">
        <span>{surface === 'powerpoint' ? `슬라이드 ${st.slide}/${doc?.deck?.total ?? doc?.deck?.slides.length ?? 1}` : surface === 'excel' ? '준비' : '1/5 페이지'}</span>
        <span>한국어</span>
        <span className="sc-status-end">─ ───●─── ＋ 77%</span>
      </div>
    </div>
  );
}
