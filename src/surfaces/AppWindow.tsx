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
import { AttachRegular, MicRegular, NavigationRegular, NotebookRegular, SendRegular, ShieldCheckmarkRegular, TableSimpleRegular } from '@fluentui/react-icons';
import { OfficeRibbon, OfficeStatus, OfficeTitle, REAL } from './OfficeChrome';
import { isWeb, WebTop } from './WebChrome';
import { CsNav, CsStart, CsTop, isCs } from './CopilotChrome';

interface Ui {
  app: string;
  tabs: string[];
  /** [그림, 이름, 누를 수 있게 할 때의 단추 id] */
  groups: [string, string, string?][];
  /** 왼쪽 탐색 (둘째 항목이 현재 위치) */
  nav?: string[];
  /** Copilot 창에 처음 보이는 제안 단추 글 */
  tips?: string[];
  /** 오른쪽 창 제목. 없으면 Office 의 Copilot 창 머리(모델 칩 · 편집 허용)를 쓴다 */
  pane?: string;
  head?: string;
  sub?: string;
  /** 입력란 안내 글. 없으면 입력란이 없는 창(Copilot 대화가 없는 화면) */
  input?: string;
  status: string;
}
/** Forms 의 "Copilot으로 초안 작성" 상자 안내 글 (2026-11-14 실제 화면) */
const DRAFT_HINT = '컨텍스트, 목적, 의도된 대상 그룹 및 고려할 특정 요구 사항을 포함하여 만들고 싶은 양식을 설명합니다.';
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
  outlook: {
    app: 'Outlook',
    tabs: [], groups: [],
    nav: ['받은 편지함', '임시 보관함', '보낸 편지함', '지운 편지함'],
    pane: 'Copilot',
    tips: ['이 이메일 요약', '이 이메일 요약 및 회신'],
    input: 'Copilot에 메시지 보내기',
    status: '',
  },
  teams: {
    app: 'Teams',
    tabs: [], groups: [],
    nav: ['활동', '채팅', 'Teams', '일정', 'OneDrive'],
    pane: 'Copilot',
    head: '안녕하세요, 어떻게 도와드릴까요?',
    tips: ['이 채팅 요약'],
    input: 'Copilot에 메시지 보내기',
    status: '',
  },
  forms: {
    app: 'Forms',
    tabs: [], groups: [],
    pane: 'Copilot',
    input: 'Copilot에 메시지 보내기',
    status: '',
  },
  cloudflow: {
    app: 'Power Automate',
    tabs: ['내 흐름', '클라우드 흐름 편집'],
    // 디자이너 안의 Copilot 은 2026-11-30 지원 종료(MC1540258)라 Copilot 단추와 창을 두지 않는다.
    // 카드는 캔버스의 "트리거 추가" · "작업 추가"로 넣고, 저장 · 테스트는 위쪽 명령 막대에서 누른다
    groups: [['↶', '실행 취소'], ['💾', '저장', 'save'], ['☑', '흐름 검사기'], ['▶', '테스트', 'test']],
    pane: '흐름 만들기 · 실행 기록',
    head: '트리거 카드 하나와 작업 카드를 차례로 넣어 흐름을 만듭니다.',
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
    tabs: [], groups: [],
    pane: '에이전트 테스트',
    head: '만든 에이전트와 바로 대화해 볼 수 있습니다.',
    input: '메시지를 입력하세요',
    status: 'Copilot Studio · 에이전트',
  },
  code: {
    app: 'Microsoft Copilot',
    tabs: ['앱', '미리보기', '데이터', '권한'],
    groups: [],
    pane: 'Copilot',
    head: '만들고 싶은 앱을 말로 설명해 보세요.',
    sub: '화면·데이터·권한 계획을 먼저 보여 드린 뒤 샌드박스에서 만듭니다.',
    input: '만들거나 바꿀 내용을 설명하세요',
    status: 'Code · 테넌트 안의 샌드박스',
  },
};

export function AppWindow({ s, st, vars, ids, shown, streamRef, mark, ask, onSend, pick, pickPhase, onPickSelect, onSlide, target, onAct, children }: {
  s: Scenario; st: PlayState; vars: Vars; ids: string[]; streamRef: RefObject<HTMLDivElement | null>; mark: Mark;
  /** 지금까지 재생한 메시지 수 — Copilot 단추(target 'copilot')를 누르기 전에는 Copilot 창을 닫아 둔다 */
  shown: number;
  ask: string | null; onSend?: () => void; pick?: Pick; pickPhase: PickPhase; onPickSelect: () => void;
  onSlide: (n: number) => void; children: ReactNode;
  /** 화면에서 직접 눌러야 할 단추 id(cue.target)와 눌렀을 때 할 일 */
  target?: string; onAct: () => void;
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
  // Copilot Studio · Code 는 실제 화면의 왼쪽 메뉴 · 위쪽 막대를 쓰고, 만들기 전에는 시작 화면부터 보인다 (target 'create' 를 누를 차례일 때)
  const cs = isCs(surface) ? surface : null;
  const creating = !!cs && writing === 0 && !!doc && target === 'create';
  // 화면의 단추를 누를 차례에는 입력란을 비워 둔다
  const typed = target ? null : ask;
  const hot = (act?: string) => !!act && act === target;
  const slashOpen = !!(pick && typed && (pickPhase === 'search' || pickPhase === 'pick'));
  // Word · Excel · PowerPoint 는 실제 데스크톱 앱의 제목 표시줄 · 리본을 쓴다. Copilot 창은 문서 오른쪽 아래의 Copilot 단추로 연다
  const real = REAL[surface];
  const copilotAt = s.messages.findIndex(m => m.role === 'cue' && m.target === 'copilot');
  const paneOpen = (copilotAt < 0 || shown > copilotAt) && !creating; // 시작 화면에는 오른쪽 창이 없다
  const name = creating ? '새로 만들기' : doc ? artifactName(doc, ids) : s.title;
  // Outlook · Teams · Forms 는 실제 화면의 위쪽 모양을 쓴다. Outlook · Teams 는 위쪽의 Copilot 단추로 창을 연다
  const web = isWeb(surface) ? surface : null;
  // Forms 는 Copilot 창을 열기 전까지 양식 위의 "Copilot으로 초안 작성" 상자에서 요청한다
  const draft = web === 'forms' && !paneOpen;
  // Teams 는 모임 채팅 이름(처음 연 것), Forms 는 만들기 전의 이름을 머리에 둔다
  const webName = web === 'teams' ? Object.values(arts).find(fits)?.name ?? name : web === 'forms' && writing === 0 ? '제목 없는 양식' : name;
  const navOn = web === 'outlook' && doc?.origin !== 'made' ? 0 : 1;
  const composer = pane.input && (
    <div className={`sc-composer is-pane sc-zone ${mark('composer')}${draft ? ' is-draft' : ''}`}>
      {!draft && <b aria-hidden="true">＋</b>}
      <span className={typed ? 'is-filled' : undefined}>{typed && pick ? <PickText text={typed} pick={pick} phase={pickPhase} /> : typed ?? (draft ? DRAFT_HINT : pane.input)}</span>
      {draft && <small aria-hidden="true">{typed?.length ?? 0} / 2000</small>}
      <i aria-hidden="true">{draft ? <><NotebookRegular /><AttachRegular /></> : real || web ? <MicRegular /> : '🎤'}</i>
      {onSend && !target && <button type="button" className="sc-pane-send is-hunt" aria-label="보내기" onClick={onSend}>{draft ? <SendRegular /> : '↑'}</button>}
      {slashOpen && pick && <SlashPopup pick={pick} active={pickPhase === 'pick'} onPick={pickPhase === 'search' ? onPickSelect : undefined} />}
    </div>
  );
  return (
    <div className="sc-shell is-office" data-app={surface} data-real={real || web ? '' : undefined} data-cs={cs ? '' : undefined}>
      {cs && <CsNav surface={cs} session={creating ? undefined : name} />}
      {real ? <OfficeTitle r={real} surface={surface} name={name} me="나" /> : web || cs ? null : (
        <div className="sc-win">
          <span className="sc-win-name">
            {!ui.pane && <span className="sc-save">자동 저장 ●</span>}{name} · {ui.app}
          </span>
          <span className="sc-win-search">⌕ 검색</span>
          <span className="sc-win-btns" aria-hidden="true"><i>─</i><i>▢</i><i>✕</i></span>
        </div>
      )}
      {real ? (
        <OfficeRibbon
          r={real} className={`sc-zone ${mark('ribbon')}`}
          extra={surface === 'excel' ? <div className="or-fx" aria-hidden="true"><i>A1</i><b>fx</b><span /></div> : undefined}
        />
      ) : web ? <WebTop surface={web} name={webName} zone={`sc-zone ${mark('ribbon')}`} hot={hot('copilot')} onAct={onAct} />
        : cs ? <CsTop surface={cs} name={creating ? '제목 없는 에이전트' : name} live={ids.includes('live') || doc?.origin === 'read'} creating={creating} tabs={ui.tabs} zone={`sc-zone ${mark('ribbon')}`} hot={hot('publish')} onAct={onAct} /> : (
        <div className={`sc-ribbon sc-zone ${mark('ribbon')}`}>
          <span className="sc-ribbon-tabs">{ui.tabs.map((t, i) => <i key={t} className={i === 1 ? 'on' : undefined}>{t}</i>)}</span>
          <span className="sc-ribbon-groups">
            {ui.groups.map(([ico, name, act]) => (hot(act)
              ? <button key={name} type="button" className="is-hunt" data-act={act} onClick={onAct}><b aria-hidden="true">{ico}</b><i>{name}</i></button>
              : <span key={name} className={name === 'Copilot' ? 'is-copilot' : undefined}><b aria-hidden="true">{ico}</b><i>{name}</i></span>
            ))}
          </span>
        </div>
      )}
      <div className={`sc-office-body${paneOpen ? '' : ' is-paneless'}`}>
        {(real || (draft && writing === null)) && !paneOpen && (
          <button type="button" className={`or-fab${hot('copilot') ? ' is-hunt' : ''}`} aria-label="Copilot" {...(hot('copilot') ? { 'data-act': 'copilot', onClick: onAct } : { tabIndex: -1 })}>
            <img src="logo/copilot/copilot.png" alt="" />
          </button>
        )}
        {ui.nav && <nav className="sc-app-nav" aria-hidden="true">{ui.nav.map((n, i) => <i key={n} className={i === navOn ? 'on' : undefined}>{n}</i>)}</nav>}
        <div className={`sc-canvas sc-zone ${mark('canvas')}`}>
          {draft && (
            <div className={`sc-pane ww-draft${writing === null ? ' is-made' : ''} sc-zone ${mark('pane')}`}>
              <span className="sc-pane-top ww-pane-top"><img src="logo/copilot/copilot.png" alt="" /><b>Copilot으로 초안 작성</b><i>✕</i></span>
              <div className="sc-stream-in" ref={streamRef}>{children}</div>
              {composer}
            </div>
          )}
          {web === 'outlook' && doc?.origin === 'read' && <span className="ww-sum"><img src="logo/copilot/copilot.png" alt="" />이 이메일 요약</span>}
          {web === 'forms' && <span className="ww-tpl" aria-hidden="true"><TableSimpleRegular />서식 파일</span>}
          {creating && cs ? <CsStart surface={cs} ask={ask ?? s.workbench?.ask ?? ''} model={vars.model} onAct={onAct} /> : view && (
            <ArtifactView
              a={view} writing={writing} vars={vars} ids={ids} slide={slide} moved={st.moved} over={st.over} onSlide={onSlide}
              act={{ target, go: onAct }}
            />
          )}
        </div>
        {paneOpen && (
        <div className={`sc-pane sc-zone ${mark('pane')}`} data-pane={s.surface}>
          {web ? <span className="sc-pane-top ww-pane-top"><img src="logo/copilot/copilot.png" alt="" /><b>Copilot</b><i>✕</i></span> : real
            ? <span className="sc-pane-top or-pane-top"><i><NavigationRegular /></i><i className="sc-chip">{vars.model} ⌄</i><em /><i className="or-shield"><ShieldCheckmarkRegular /></i><i>⋯</i><i>✕</i></span>
            : pane.pane
              ? <span className="sc-pane-top"><b>{pane.pane}</b><i>✕</i></span>
              : <span className="sc-pane-top"><i>≡</i><i>⛨</i><i className="sc-chip">{vars.model} ⌄</i><i>⋯</i><i>✕</i></span>}
          {pane.head && <b className="sc-pane-head">{pane.head}</b>}
          {pane.sub && <span className="sc-pane-sub">{pane.sub}</span>}
          {pane.tips && <span className="sc-pane-sub ww-tips">{pane.tips.map(t => <i key={t}>{t}</i>)}</span>}
          {!pane.pane && !real && <i className="sc-pane-allow">편집 허용 ⌄</i>}
          <div className="sc-stream-in" ref={streamRef}>{children}</div>
          {real && <i className="or-allow">편집 허용 ⌄</i>}
          {composer}
          {real && <small className="or-pane-foot">M365 Copilot(프리미엄) ⓘ</small>}
        </div>
        )}
      </div>
      {real ? <OfficeStatus r={real} lead={surface === 'powerpoint' ? `슬라이드 ${slide}/${slides}` : undefined} /> : web || cs ? null : (
        <div className="sc-status">
          <span>{surface === 'powerpoint' ? `슬라이드 ${slide}/${slides}` : ui.status}</span>
          <span>한국어</span>
          {!ui.pane && <span className="sc-status-end">─ ───●─── ＋ 77%</span>}
        </div>
      )}
    </div>
  );
}
