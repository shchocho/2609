/**
 * 앱 창 + 오른쪽 창: Word · Excel · PowerPoint(구조: docs/reference/render-spec.md §3.5),
 * Power Automate 흐름 디자이너(클라우드 흐름 · 데스크톱 흐름), Copilot Studio 에이전트 화면,
 * Microsoft Copilot 앱의 Code 탭(가운데 앱 미리보기 · 오른쪽 Copilot 대화).
 * 배치는 원본의 .sc-shell.is-office 스타일을 그대로 쓴다.
 */
import type { ReactNode, RefObject } from 'react';
import type { Artifact, Pick, PlayState, Scenario, Vars } from '../types';
import { artifactName, filterBy } from '../engine/text';
import { ArtifactView } from '../components/artifacts';
import { PickText, SlashPopup, type Mark, type PickPhase } from '../components/chrome';

interface Ui {
  app: string;
  tabs: string[];
  groups: [string, string][];
  /** 오른쪽 창 제목. 없으면 Office 의 Copilot 창 머리(모델 칩 · 편집 허용)를 쓴다 */
  pane?: string;
  head: string;
  sub?: string;
  /** 입력란 안내 글. 없으면 입력란이 없는 창(Copilot 대화가 없는 화면) */
  input?: string;
  status: string;
}
const UI: Record<string, Ui> = {
  word: {
    app: 'Word',
    tabs: ['파일', '홈', '삽입', '그리기', '디자인', '레이아웃', '참조', '편지', '검토', '보기'],
    groups: [['📋', '클립보드'], ['Ａ', '글꼴'], ['≡', '단락'], ['▤', '스타일'], ['⌕', '편집'], ['◈', 'Copilot']],
    head: '문서를 편집해 보겠습니다.',
    sub: '무엇을 하고 싶은지 알려주시면, 바로 문서 편집을 시작할 수 있습니다.',
    input: 'Copilot으로 편집',
    status: '1/5 페이지',
  },
  excel: {
    app: 'Excel',
    tabs: ['파일', '홈', '삽입', '페이지 레이아웃', '수식', '데이터', '검토', '보기', '자동화'],
    groups: [['📋', '클립보드'], ['Ａ', '글꼴'], ['≡', '맞춤'], ['%', '표시 형식'], ['⊞', '셀'], ['⌕', '편집'], ['◈', 'Copilot']],
    head: '통합 문서 편집',
    input: 'Copilot으로 편집',
    status: '준비',
  },
  powerpoint: {
    app: 'PowerPoint',
    tabs: ['파일', '홈', '삽입', '그리기', '디자인', '전환', '애니메이션', '슬라이드 쇼', '검토', '보기'],
    groups: [['📋', '클립보드'], ['⊞', '슬라이드'], ['Ａ', '글꼴'], ['≡', '단락'], ['◳', '그리기'], ['⌕', '편집'], ['◈', 'Copilot']],
    head: '프레젠테이션을 편집해 보겠습니다.',
    input: '만들거나 편집할 항목 설명',
    status: '',
  },
  cloudflow: {
    app: 'Power Automate',
    tabs: ['내 흐름', '클라우드 흐름 편집'],
    groups: [['↶', '실행 취소'], ['💾', '저장'], ['☑', '흐름 검사기'], ['▶', '테스트'], ['◈', 'Copilot']],
    pane: 'Copilot',
    head: '흐름을 말로 설명해 보세요.',
    sub: '만들거나 바꾸고 싶은 내용을 알려주시면 트리거와 작업을 구성합니다.',
    input: '흐름에서 하고 싶은 일을 설명하세요',
    status: '클라우드 흐름 · 초안',
  },
  deskflow: {
    app: 'Power Automate for desktop',
    tabs: ['파일', '편집', '디버그', '도구', '보기', '도움말'],
    groups: [['💾', '저장'], ['▶', '실행'], ['⏭', '다음 작업 실행'], ['■', '중지'], ['⏺', '녹화기']],
    pane: '녹화 · 실행 기록',
    head: '이 컴퓨터의 화면을 직접 조작하는 흐름입니다.',
    status: '데스크톱 흐름 · 이 컴퓨터에서 실행',
  },
  studio: {
    app: 'Copilot Studio',
    tabs: ['에이전트', '개요', '지식', '도구', '채널', '분석'],
    groups: [['💾', '저장'], ['🧪', '테스트'], ['🚀', '게시'], ['⚙', '설정']],
    pane: '에이전트 테스트',
    head: '만든 에이전트와 바로 대화해 볼 수 있습니다.',
    input: '메시지를 입력하세요',
    status: 'Copilot Studio · 에이전트',
  },
  code: {
    app: 'Microsoft Copilot',
    tabs: ['Home', 'Code', 'Autopilot'],
    groups: [['👁', '미리보기'], ['🗄', '데이터'], ['🔒', '권한'], ['🚀', '게시']],
    pane: 'Copilot',
    head: '만들고 싶은 앱을 말로 설명해 보세요.',
    sub: '화면·데이터·권한 계획을 먼저 보여 드린 뒤 샌드박스에서 만듭니다.',
    input: '만들거나 바꿀 내용을 설명하세요',
    status: 'Code · 테넌트 안의 샌드박스',
  },
};

export function AppWindow({ s, st, vars, ids, streamRef, mark, ask, onSend, pick, pickPhase, onPickSelect, onSlide, children }: {
  s: Scenario; st: PlayState; vars: Vars; ids: string[]; streamRef: RefObject<HTMLDivElement | null>; mark: Mark;
  ask: string | null; onSend?: () => void; pick?: Pick; pickPhase: PickPhase; onPickSelect: () => void;
  onSlide: (n: number) => void; children: ReactNode;
}) {
  // 가운데 문서: 이 화면에 올릴 수 있는 결과물 중 가장 최근에 연 것, 아직 없으면 맨 앞의 것.
  // Office 는 그 앱의 파일만, Power Automate 는 흐름이면 종류(클라우드·데스크톱)에 따라 창이 바뀐다
  const arts = s.workbench?.artifacts ?? {};
  const fits = (a?: Artifact) => !!a && (s.agent === 'flow' ? a.kind === 'flow' : a.app === s.surface);
  const id = [...st.opened].reverse().find(k => fits(arts[k])) ?? Object.keys(arts).find(k => fits(arts[k]));
  const doc = id ? arts[id] : undefined;
  const surface = (s.agent === 'flow' ? doc?.app : undefined) ?? s.surface ?? 'word'; // check-scenarios 가 화면 종류를 제한
  const ui = UI[surface] ?? UI.word;
  // 오른쪽 창은 대화를 시작한 화면의 것을 유지한다 (클라우드 흐름에서 데스크톱 흐름을 열어 봐도 Copilot 창)
  const pane = UI[s.surface ?? ''] ?? ui;
  // 쓰기 전의 새 결과물은 빈 문서로 둔다
  const writing = !id || !doc ? null : st.writing === id ? st.rows : doc.origin === 'made' && !st.opened.includes(id) ? 0 : null;
  // 덱은 만드는 동안 지금까지 만든 슬라이드만 보여 준다 (덱 뷰어는 writing 을 쓰지 않는다)
  const building = doc?.deck && writing != null ? doc.deck.slides.slice(0, writing) : null;
  const view = doc?.deck && building ? { ...doc, deck: { slides: building.length ? building : [{ n: 1, head: '제목을 추가하려면 클릭' }] } } : doc;
  const slide = building ? Math.max(1, filterBy(building, ids).length) : st.slide;
  const slides = view?.deck ? view.deck.total ?? filterBy(view.deck.slides, ids).length : 1;
  const slashOpen = !!(pick && ask && (pickPhase === 'search' || pickPhase === 'pick'));
  return (
    <div className="sc-shell is-office" data-app={surface}>
      <div className="sc-win">
        <span className="sc-win-name">
          {s.agent === 'office' && <span className="sc-save">자동 저장 ●</span>}{doc ? artifactName(doc, ids) : s.title} · {ui.app}
        </span>
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
          {view && <ArtifactView a={view} writing={writing} vars={vars} ids={ids} slide={slide} moved={st.moved} over={st.over} onSlide={onSlide} />}
        </div>
        <div className={`sc-pane sc-zone ${mark('pane')}`} data-pane={s.surface}>
          {pane.pane
            ? <span className="sc-pane-top"><b>{pane.pane}</b><i>✕</i></span>
            : <span className="sc-pane-top"><i>≡</i><i>⛨</i><i className="sc-chip">{vars.model} ⌄</i><i>⋯</i><i>✕</i></span>}
          <b className="sc-pane-head">{pane.head}</b>
          {pane.sub && <span className="sc-pane-sub">{pane.sub}</span>}
          {!pane.pane && <i className="sc-pane-allow">편집 허용 ⌄</i>}
          <div className="sc-stream-in" ref={streamRef}>{children}</div>
          {pane.input && (
            <div className={`sc-composer is-pane sc-zone ${mark('composer')}`}>
              <b aria-hidden="true">＋</b>
              <span className={ask ? 'is-filled' : undefined}>{ask && pick ? <PickText text={ask} pick={pick} phase={pickPhase} /> : ask ?? pane.input}</span>
              <i aria-hidden="true">🎤</i>
              {onSend && <button type="button" className="sc-pane-send is-hunt" aria-label="보내기" onClick={onSend}>↑</button>}
              {slashOpen && pick && <SlashPopup pick={pick} active={pickPhase === 'pick'} onPick={pickPhase === 'search' ? onPickSelect : undefined} />}
            </div>
          )}
        </div>
      </div>
      <div className="sc-status">
        <span>{surface === 'powerpoint' ? `슬라이드 ${slide}/${slides}` : ui.status}</span>
        <span>한국어</span>
        {s.agent === 'office' && <span className="sc-status-end">─ ───●─── ＋ 77%</span>}
      </div>
    </div>
  );
}
