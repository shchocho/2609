/**
 * Copilot Studio(에이전트 빌드 화면) · Microsoft Copilot 앱의 코드 탭: 왼쪽 메뉴 · 위쪽 막대 · 시작 화면.
 * 2026-11-17 한국어 실제 화면에서 읽은 이름과 배치를 옮겼다. 확인한 것은 시작 화면 한 장씩이다.
 * 만든 뒤의 화면(Code 의 앱 · 미리보기 · 데이터 · 권한 탭, Studio 오른쪽의 테스트 창)은 실제 화면을 보지 못해 이전 모양 그대로다.
 */
import type { ReactNode } from 'react';
import {
  AddCircleFilled, AddRegular, ArrowRedoRegular, ArrowUndoRegular, ArrowUpRegular, ArrowUploadRegular, BotRegular, CodeRegular,
  DesktopRegular, FilterRegular, FlowRegular, FolderRegular, GlobeRegular, GridDotsRegular, HomeRegular, InfoRegular, LinkRegular,
  MicRegular, MoreHorizontalRegular, NotepadEditRegular, PanelLeftRegular, PeopleRegular, PlugDisconnectedRegular,
  QuestionCircleRegular, SaveRegular, SearchRegular, SettingsRegular, ShareRegular, ShieldCheckmarkRegular, StethoscopeRegular,
  TaskListLtrRegular, TaskListSquareLtrRegular, TextBoldRegular, TextBulletListLtrRegular, TextItalicRegular,
  TextNumberListLtrRegular, TextStrikethroughRegular, ToolboxRegular,
} from '@fluentui/react-icons';

export type Cs = 'studio' | 'code';
export const isCs = (x: string): x is Cs => x === 'studio' || x === 'code';

const icons = (list: ReactNode[]) => list.map((x, i) => <i key={i}>{x}</i>);

/** 왼쪽 메뉴. session 은 만든 뒤 세션 목록에 올라오는 이름(Code) */
export function CsNav({ surface, session }: { surface: Cs; session?: string }) {
  if (surface === 'studio') {
    return (
      <nav className="cs-nav is-studio" aria-hidden="true">
        <img src="logo/copilot/copilot-studio.svg" alt="" />
        {icons([<HomeRegular />])}
        <i className="on"><BotRegular /></i>
        {icons([<FlowRegular />, <ToolboxRegular />])}
        <em />
        {icons([<GlobeRegular />])}
        <b>나</b>
        {icons([<MoreHorizontalRegular />])}
      </nav>
    );
  }
  return (
    <nav className="cs-nav is-code" aria-hidden="true">
      <span className="cs-brand"><b>Copilot</b>{icons([<GridDotsRegular />, <TaskListSquareLtrRegular />, <PanelLeftRegular />])}</span>
      <span className="cs-seg"><i>홈</i><i className="on">코드</i></span>
      <span className={`cs-row${session ? '' : ' on'}`}><AddCircleFilled />새 세션</span>
      <span className="cs-row"><TaskListLtrRegular />내 작업</span>
      <span className="cs-row"><PlugDisconnectedRegular />플러그 인</span>
      <span className="cs-label">세션{icons([<SearchRegular />, <FilterRegular />])}</span>
      <small>로컬</small>
      <small>클라우드</small>
      {session && <span className="cs-row on"><CodeRegular />{session}</span>}
      <em />
      <span className="cs-me"><b>나</b><span><strong><u>업무</u>나</strong><small>M365 Copilot(프리미엄)</small></span><i><SettingsRegular /></i></span>
    </nav>
  );
}

/** 위쪽 막대. 게시 단추(target 'publish')만 누를 수 있다. live: 게시했거나, 이미 있던 에이전트를 연 경우 */
export function CsTop({ surface, name, live, creating, tabs, zone, hot, onAct }: {
  surface: Cs; name: string; live: boolean; creating: boolean; tabs: string[]; zone: string; hot: boolean; onAct: () => void;
}) {
  const publish = hot
    ? <button type="button" className="cs-publish is-hunt" data-act="publish" onClick={onAct}>게시</button>
    : <span className="cs-publish">게시</span>;
  if (surface === 'studio') {
    return (
      <div className={`cs-top ${zone}`}>
        <span className="cs-name"><b>{name}</b><i className="cs-badge">{live ? '게시됨' : '초안'}</i></span>
        <span className="cs-tabs"><i className="on">빌드</i><i>미리 보기</i><i className="off">평가</i><i className="off">모니터</i></span>
        <span className="cs-end">
          {icons([<MoreHorizontalRegular />, <PeopleRegular />, <ShareRegular />, <SaveRegular />])}
          <span className="cs-btn"><StethoscopeRegular />검토</span>
          {publish}
        </span>
      </div>
    );
  }
  return (
    <div className={`cs-top is-code ${zone}`}>
      {!creating && <span className="cs-name"><b>{name}</b></span>}
      {!creating && <span className="cs-tabs">{tabs.map((t, i) => <i key={t} className={i === 1 ? 'on' : undefined}>{t}</i>)}</span>}
      <span className="cs-end">
        <i className="cs-frontier">FRONTIER</i>
        {icons([<QuestionCircleRegular />])}
        <i className="cs-shield"><ShieldCheckmarkRegular /></i>
        {!creating && <span className="cs-btn">공유</span>}
        {!creating && publish}
        <span className="sc-win-btns"><i>─</i><i>▢</i><i>✕</i></span>
      </span>
    </div>
  );
}

const PANEL: [string, string][] = [
  ['기술', '구조화된 지침을 통해 동작을 정의합니다.'],
  ['도구', '에이전트를 외부 시스템 및 작업에 연결합니다.'],
  ['지식', '신뢰할 수 있는 컨텍스트를 제공하여 의사 결정 안내'],
  ['연결된 에이전트', '에이전트 간에 협업하여 작업을 완료합니다.'],
];

/** 만들기 전의 시작 화면. 준비된 글(ask)이 들어 있고, 단추(target 'create')로 시작한다 */
export function CsStart({ surface, ask, model, onAct }: { surface: Cs; ask: string; model: string; onAct: () => void }) {
  if (surface === 'studio') {
    return (
      <div className="cs-build">
        <div className="cs-build-main">
          <div className="cs-build-head"><i aria-hidden="true"><NotepadEditRegular /></i><span>제목 없는 에이전트</span></div>
          <div className="cs-build-bar" aria-hidden="true">
            <b>안내 <InfoRegular /></b>
            <span>
              {icons([<ArrowUndoRegular />, <ArrowRedoRegular />, <TextBoldRegular />, <TextItalicRegular />, <TextStrikethroughRegular />,
                <TextBulletListLtrRegular />, <TextNumberListLtrRegular />, <LinkRegular />])}
              <i className="cs-up"><ArrowUploadRegular />Upload</i>
            </span>
          </div>
          <p>{ask}</p>
          <button type="button" className="is-hunt" data-act="create" onClick={onAct}>만들기</button>
        </div>
        <aside className="cs-panel" aria-hidden="true">
          {PANEL.map(([t, d]) => <span key={t}><b>{t}</b><small>{d}</small><i><AddRegular /></i></span>)}
          <span><b>메모리 <u>Preview</u></b><small>에이전트가 향후 응답을 개선할 수 있도록 정보를 기억하고 사용하게 합니다.</small><i className="cs-toggle" /></span>
        </aside>
      </div>
    );
  }
  return (
    <div className="cs-start">
      <h2>함께 만들어 보세요.</h2>
      <div className="cs-ask">
        <span className="cs-ask-top" aria-hidden="true"><i><FolderRegular />새 프로젝트 ⌄</i><i><DesktopRegular />로컬 ⌄</i></span>
        <p>{ask}</p>
        <span className="cs-ask-end">
          <i aria-hidden="true"><AddRegular /></i><i aria-hidden="true">대화형 ⌄</i><em />
          <i aria-hidden="true">{model} ⌄</i><i aria-hidden="true"><MicRegular /></i>
          <button type="button" className="cs-send is-hunt" data-act="create" aria-label="보내기" onClick={onAct}><ArrowUpRegular /></button>
        </span>
      </div>
      <b>다음에 다시 시도</b>
      <div className="cs-tips" aria-hidden="true">
        <span>표준 시간대별 회의 시간 확인</span><span>집중을 돕는 타이머를 만들기</span><span>다음 아이디어에 대한 웹사이트 만들기</span>
      </div>
    </div>
  );
}
