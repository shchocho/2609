/** Copilot 앱 모양 껍데기: 제목 표시줄 · 왼쪽 레일 · 작업 영역 패널 · 입력창 · 파일 선택 창 */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Grid20Regular, CheckboxChecked20Regular, PanelLeftContract20Regular, Subtract16Regular, Maximize16Regular, Dismiss16Regular,
  AddCircle20Filled, TaskListLtr20Regular, Flash20Regular, BrainCircuit20Regular, Search20Regular, Library20Regular,
  Code20Regular, Folder20Regular, Home20Regular, People20Regular, Star20Regular, Person20Regular, Calendar20Regular,
  Image20Regular, Video20Regular, Info16Regular, Search16Regular, NavigationRegular, ChevronDown12Regular,
  ChevronLeft20Regular, ChevronRight20Regular, ArrowUp20Regular, Dismiss12Regular, MusicNote220Regular, Desktop20Regular,
  ArrowDownload20Regular, Document20Regular,
} from '@fluentui/react-icons';
import { AppIcon, WE, X } from './ui';
import type { Pick } from '../types';

/* ---------- 스크롤 도우미 ---------- */
export function useAtBottom(ref: RefObject<HTMLElement | null>) {
  const [at, setAt] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setAt(el.scrollHeight - el.clientHeight - el.scrollTop < 40);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', check); ro.disconnect(); };
  }, [ref]);
  return at;
}
export const scrollToBottom = (el?: HTMLElement | null) => el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
/** 멈춰 둔 답변(.cwr-hold)의 머리가 보이게 스크롤 */
export function scrollToHold(el?: HTMLElement | null) {
  const hold = el?.querySelector('.cwr-hold');
  if (!el || !hold) return;
  const go = () => {
    const r = hold.getBoundingClientRect();
    if (r.height <= el.clientHeight) return;
    el.scrollTo({ top: Math.max(0, el.scrollTop + (r.top - el.getBoundingClientRect().top) - 12), behavior: 'smooth' });
  };
  go();
  const ro = new ResizeObserver(go);
  ro.observe(hold);
  return () => ro.disconnect();
}

/* ---------- 앱 껍데기 ---------- */
export type Mark = (zone: string) => string;
const noMark: Mark = z => `zone-${z}`;

function TitleBar({ name = 'Copilot' }: { name?: string }) {
  return (
    <>
      <div className="tb tb-left">
        <span className="wordmark">{name}</span>
        <div className="tb-icons">
          <span className="ico-btn" aria-hidden="true"><Grid20Regular fontSize={18} /></span>
          <span className="ico-btn" aria-hidden="true"><CheckboxChecked20Regular fontSize={18} /></span>
          <span className="ico-btn" aria-hidden="true"><PanelLeftContract20Regular fontSize={18} /></span>
        </div>
      </div>
      <div className="tb tb-right">
        <div className="winctrls" aria-hidden="true">
          <span className="win"><Subtract16Regular fontSize={11} /></span>
          <span className="win"><Maximize16Regular fontSize={11} /></span>
          <span className="win close"><Dismiss16Regular fontSize={11} /></span>
        </div>
      </div>
    </>
  );
}

const DEFAULT_SPLIT = 110 / 2.1;
export function CpApp({ mode, side, panelOpen, panelResizable = false, panel, overlay, children, mark = noMark }: {
  mode: 'chat' | 'cowork'; side: ReactNode; panelOpen?: boolean; panelResizable?: boolean; panel?: ReactNode; overlay?: ReactNode; children: ReactNode; mark?: Mark;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const zoom = useRef(1);
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const [resizing, setResizing] = useState(false);
  const set = (v: number) => setSplit(Math.max(30, Math.min(70, v)));
  return (
    <div
      ref={ref}
      className="cp-app"
      data-mode={mode}
      data-cwrun={panelOpen ? 'on' : ''}
      data-resizing={resizing ? 'true' : undefined}
      style={panelResizable ? ({ '--cw-doc-main': `${100 - split}fr`, '--cw-doc-panel': `${split}fr` } as React.CSSProperties) : undefined}
    >
      <TitleBar />
      <aside className={`side sc-zone ${mark('rail')}`}>{side}</aside>
      <main className="main">{children}</main>
      {panelOpen && panel}
      {panelOpen && panelResizable && (
        <div
          className="cwr-resizer"
          role="separator"
          tabIndex={0}
          aria-label="결과물 패널 너비"
          aria-orientation="vertical"
          aria-valuemin={30}
          aria-valuemax={70}
          aria-valuenow={Math.round(split)}
          aria-valuetext={`${Math.round(split)}%`}
          onPointerDown={e => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.currentTarget.focus();
            e.currentTarget.setPointerCapture(e.pointerId);
            zoom.current = Number(getComputedStyle(document.documentElement).getPropertyValue('--booth-zoom')) || 1;
            setResizing(true);
          }}
          onPointerMove={e => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const main = ref.current?.querySelector(':scope > .main');
            const pnl = ref.current?.querySelector(':scope > .cwr-panel');
            if (!main || !pnl) return;
            const x = e.clientX / zoom.current, l = main.getBoundingClientRect().left, r = pnl.getBoundingClientRect().right;
            if (r > l) set(((r - x) / (r - l)) * 100);
          }}
          onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); setResizing(false); }}
          onPointerCancel={() => setResizing(false)}
          onLostPointerCapture={() => setResizing(false)}
          onDoubleClick={() => setSplit(DEFAULT_SPLIT)}
          onKeyDown={e => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault();
            if (e.key === 'Home') set(30); else if (e.key === 'End') set(70); else set(split + (e.key === 'ArrowLeft' ? 2 : -2));
          }}
        />
      )}
      {overlay}
    </div>
  );
}

/* ---------- 레일 ---------- */
export function RailTabs({ active }: { active: 'chat' | 'cowork' }) {
  return (
    <div className="tabs" data-active={active}>
      <div className="tab-thumb" />
      <div className={`tab${active === 'chat' ? ' active' : ''}`}>채팅</div>
      <div className={`tab${active === 'cowork' ? ' active' : ''}`}>Cowork</div>
    </div>
  );
}
export function NavItem({ icon, name, active, onClick }: { icon: ReactNode; name: string; active?: boolean; onClick?: () => void }) {
  return <button type="button" className={`nav-item${active ? ' active' : ''}`} onClick={onClick}><span className="ic">{icon}</span>{name}</button>;
}
export function History({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="scroll">
      <div className="section-label">{label}</div>
      <div className="hist">{items.map((t, i) => <button key={i} type="button" className={`hist-item${i === 0 ? ' active' : ''}`}><span className="t">{t}</span></button>)}</div>
    </div>
  );
}
export const COWORK_NAV = [
  { id: 'new', name: '새 작업', icon: <AddCircle20Filled /> },
  { id: 'mine', name: '내 작업', icon: <TaskListLtr20Regular /> },
  { id: 'auto', name: '자동화', icon: <Flash20Regular /> },
  { id: 'custom', name: '사용자 지정', icon: <BrainCircuit20Regular /> },
];
export const CHAT_NAV = [
  { id: 'new', name: '새 채팅', icon: <AddCircle20Filled /> },
  { id: 'search', name: '검색', icon: <Search20Regular /> },
  { id: 'library', name: '라이브러리', icon: <Library20Regular /> },
  { id: 'agents', name: '에이전트 및 기술', icon: <Code20Regular /> },
  { id: 'notebooks', name: '전자 필기장', icon: <Folder20Regular /> },
];

/* ---------- 작업 영역(오른쪽) 패널 ---------- */
export function WorkPanel({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <aside className="cwr-panel">
      <div className="cwr-ptop"><h2>작업 영역</h2><button type="button" className="x" aria-label="닫기" onClick={onClose}>{X.x}</button></div>
      {children}
    </aside>
  );
}
export function PanelSection({ title, count, children }: { title: string; count?: string; children: ReactNode }) {
  return <div className="cwr-psec"><div className="cwr-ph">{title} {count && <span className="n">{count}</span>}</div>{children}</div>;
}
export function Steps({ items }: { items: { name: string; state: 'done' | 'active' | 'pending' }[] }) {
  return (
    <ul className="cwr-steps">
      {items.map((s, i) => (
        <li key={i} className={s.state}>
          <span className="mk" aria-hidden="true">{s.state === 'done' ? X.check2 : s.state === 'active' ? X.spin : X.circle}</span>
          <span className="sx"><span className="st">{s.name}</span>{s.state === 'active' && <span className="ss">진행 중</span>}{s.state === 'pending' && <span className="ss">보류 중</span>}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Cowork 본문과 입력창 ---------- */
export function CoworkMain({ panelOpen, onTogglePanel, streamRef, children, composer, toast }: {
  panelOpen: boolean; onTogglePanel: () => void; streamRef: RefObject<HTMLDivElement | null>; children: ReactNode; composer: ReactNode; toast?: ReactNode;
}) {
  const atBottom = useAtBottom(streamRef);
  const foot = useRef<HTMLDivElement>(null);
  const [dock, setDock] = useState(150);
  useEffect(() => {
    const el = foot.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDock(el.offsetHeight));
    ro.observe(el);
    setDock(el.offsetHeight);
    return () => ro.disconnect();
  }, []);
  return (
    <>
      <section className="view active" style={{ '--cwr-dock': `${dock}px` } as React.CSSProperties}>
        <div className="cwr-top">
          <div className="tr">
            <span className="cwr-shield" title="보호됨" aria-hidden="true">{X.shield}</span>
            <span className="ico-btn" aria-hidden="true">{X.more}</span>
            {!panelOpen && <><span className="sep" aria-hidden="true" /><button type="button" className="ico-btn" aria-label="작업 영역" onClick={onTogglePanel}>{X.panel}</button></>}
          </div>
        </div>
        <div className="cwr-stream" ref={streamRef}><div className="cwr-wrap">{children}</div></div>
        <div className="cwr-foot-wrap" ref={foot}>
          {!atBottom && <button type="button" className="cwr-down" aria-label="맨 아래로" onClick={() => scrollToBottom(streamRef.current)}>{X.down}</button>}
          {composer}
        </div>
      </section>
      {toast}
    </>
  );
}
export function CoworkComposer({ text, filled, clip, children, menus, note = 'AI 생성 콘텐츠는 정확하지 않을 수 있습니다.' }: {
  text: string; filled: boolean; clip?: ReactNode; children: ReactNode; menus?: ReactNode; note?: string;
}) {
  return (
    <div className="cwr-composer">
      <div className="cwr-cbox">
        {clip}
        <p className={`ph${filled ? ' is-filled' : ''}`}>{text}</p>
        <div className="crow">{children}</div>
        {menus}
      </div>
      <p className="cwr-foot">{note}</p>
    </div>
  );
}

/* ---------- Copilot Chat 본문과 입력창 ---------- */
export function ChatMain({ model, streamRef, children, composer, mark }: {
  model: string; streamRef: RefObject<HTMLDivElement | null>; children: ReactNode; composer: ReactNode; mark: Mark;
}) {
  const atBottom = useAtBottom(streamRef);
  return (
    <>
      <div className={`main-top sc-zone ${mark('top')}`}>
        <span className="workiq"><span className="dot" aria-hidden="true" />Work IQ</span>
        <div className="dd"><button type="button" className="dd-btn">{model}{WE.chevron}</button></div>
      </div>
      <section className="view active">
        <div className={`conv sc-zone ${mark('stream')}`} ref={streamRef}>{children}</div>
        <div className="composer-dock">
          {!atBottom && <button type="button" className="cwr-down" aria-label="맨 아래로" onClick={() => scrollToBottom(streamRef.current)}>{X.down}</button>}
          {composer}
        </div>
      </section>
    </>
  );
}

export type PickPhase = 'type' | 'search' | 'pick' | 'done';
export function SlashPopup({ pick, active, onPick }: { pick: Pick; active: boolean; onPick?: () => void }) {
  const at = pick.name.indexOf(pick.query);
  const name = at < 0 ? <>{pick.name}</> : <>{pick.name.slice(0, at)}<b>{pick.query}</b>{pick.name.slice(at + pick.query.length)}</>;
  const row = (<><AppIcon app={pick.app ?? 'word'} /><span className="wb-slash-name">{name}</span>{pick.meta && <span className="wb-slash-meta">{pick.meta}</span>}</>);
  return (
    <div className="wb-slash" data-coach="lit">
      <ul className="wb-slash-tabs" aria-hidden="true">{['전체', '파일', '이메일', '채팅', '사이트'].map((t, i) => <li key={t} className={i === 0 ? 'on' : undefined}>{t}</li>)}</ul>
      {onPick
        ? <button type="button" className={`wb-slash-row is-pick${active ? ' on' : ''}`} onClick={onPick}>{row}</button>
        : <div className={`wb-slash-row${active ? ' on' : ''}`}>{row}</div>}
    </div>
  );
}
/** 입력창 글: "/검색어" 를 입력하는 중 → 고른 자료 이름 */
export function PickText({ text, pick, phase }: { text: string; pick: Pick; phase: PickPhase }) {
  if (!text.includes(pick.token)) return <>{text}</>;
  const [a, ...rest] = text.split(pick.token);
  return phase === 'done'
    ? <>{a}<span className="cwr-link">{pick.name}</span>{rest.join(pick.token)}</>
    : <>{a}<span className="wb-slashq">/{pick.query}<i className="wb-caret" /></span></>;
}
export function ChatComposer({ text, filled, onSend, mark, pick, pickPhase = 'done', onPickSelect }: {
  text: string; filled: boolean; onSend?: () => void; mark: Mark; pick?: Pick; pickPhase?: PickPhase; onPickSelect?: () => void;
}) {
  const hasClip = !!(pick && filled && pickPhase === 'done');
  const body: ReactNode = pick && filled ? <PickText text={text} pick={pick} phase={pickPhase} /> : text;
  return (
    <>
      <div className={`composer sc-zone ${mark('composer')}${hasClip ? ' has-clip' : ''}`}>
        {hasClip && <div className="composer-clip"><p className="cwr-clip"><AppIcon app={pick!.app ?? 'word'} /><span>{pick!.name}</span></p></div>}
        <span className="round-btn" aria-hidden="true">{WE.plus}</span>
        <p className={`ph${filled ? ' is-filled' : ''}`}>{body}</p>
        <span className="round-btn" aria-hidden="true">{WE.mic}</span>
        {onSend
          ? <button type="button" className="round-btn send is-hunt" aria-label="보내기" onClick={onSend}>{WE.send}</button>
          : <span className="round-btn send" aria-hidden="true">{WE.send}</span>}
        {pick && filled && (pickPhase === 'search' || pickPhase === 'pick') && (
          <SlashPopup pick={pick} active={pickPhase === 'pick'} onPick={pickPhase === 'search' ? onPickSelect : undefined} />
        )}
      </div>
      <p className="foot-note">AI 생성 콘텐츠는 정확하지 않을 수 있습니다.</p>
    </>
  );
}

/* ---------- 파일 선택 창 ---------- */
const TYPE_NAME: Record<string, string> = {
  word: 'Microsoft Word 문서', excel: 'Microsoft Excel 워크시트', powerpoint: 'Microsoft PowerPoint 프레젠테이션',
  onenote: 'Microsoft OneNote 구역', outlook: 'Outlook 항목',
};
export interface PickFile { name: string; app: string; at?: string; by?: string }
export function FilePicker({ kind, files, onPick, onClose }: { kind: 'cloud' | 'local'; files: PickFile[]; onPick: (f: PickFile) => void; onClose: () => void }) {
  const [sel, setSel] = useState<PickFile | null>(null);
  const rows = files.map(f => (
    <button
      key={f.name}
      type="button"
      className={`wb-fp-row${sel?.name === f.name ? ' is-on' : ''}`}
      aria-pressed={sel?.name === f.name}
      onClick={() => setSel(f)}
      onDoubleClick={() => onPick(f)}
    >
      <span className="wb-fp-ico"><AppIcon app={f.app} /></span>
      <span className="wb-fp-name">{f.name}</span>
      <span className="wb-fp-c">{f.at ?? '—'}</span>
      <span className="wb-fp-c">{kind === 'cloud' ? f.by ?? '—' : TYPE_NAME[f.app] ?? '파일'}</span>
    </button>
  ));
  const place = (icon: ReactNode, name: string, on = false) => <span key={name} className={`wb-fp-place${on ? ' is-on' : ''}`}><i>{icon}</i>{name}</span>;
  return (
    <div className="wb-fp-wrap">
      <div className="wb-fp-dim" aria-hidden="true" />
      {kind === 'cloud' ? (
        <div className="wb-filepick is-cloud" role="dialog" aria-label="항목 선택" data-coach="lit">
          <aside className="wb-fp-rail">
            <p className="wb-fp-title">항목 선택</p>
            <div className="wb-fp-places">
              {place(<Home20Regular />, '홈')}{place(<Folder20Regular />, '내 파일', true)}{place(<People20Regular />, '공유됨')}{place(<Star20Regular />, '즐겨찾기')}
            </div>
            <p className="wb-fp-h">다음을 기준으로 검색</p>
            <div className="wb-fp-places">{place(<Person20Regular />, '사람')}{place(<Calendar20Regular />, '모임')}{place(<Image20Regular />, '미디어')}</div>
            <p className="wb-fp-h">빠른 액세스 <Info16Regular /></p>
          </aside>
          <div className="wb-fp-body">
            <div className="wb-fp-top">
              <h3>내 파일</h3>
              <span className="wb-fp-search"><Search16Regular />내 파일에서 검색</span>
              <span className="wb-fp-view"><NavigationRegular fontSize={16} /><ChevronDown12Regular fontSize={12} /></span>
            </div>
            <div className="wb-fp-table">
              <div className="wb-fp-hrow"><span /><span>이름</span><span>수정된 날짜</span><span>수정한 사람</span></div>
              {rows}
            </div>
          </div>
          <footer className="wb-fp-foot">
            <button type="button" className="wb-fp-go" disabled={!sel} onClick={() => sel && onPick(sel)}>선택</button>
            <button type="button" className="wb-fp-b" onClick={onClose}>취소</button>
          </footer>
        </div>
      ) : (
        <div className="wb-filepick is-local" role="dialog" aria-label="열기" data-coach="lit">
          <div className="wb-fp-bar"><span className="wb-fp-bt">열기</span><span className="wb-fp-x"><Dismiss12Regular /></span></div>
          <div className="wb-fp-nav" aria-hidden="true">
            <ChevronLeft20Regular /><ChevronRight20Regular /><ArrowUp20Regular />
            <span className="wb-fp-crumb"><Folder20Regular /> 문서 ›</span>
            <span className="wb-fp-search"><Search16Regular />문서 검색</span>
          </div>
          <div className="wb-fp-main">
            <aside className="wb-fp-places is-local">
              {place(<Home20Regular />, '홈')}{place(<Image20Regular />, '갤러리')}{place(<Desktop20Regular />, '바탕 화면')}{place(<ArrowDownload20Regular />, '다운로드')}
              {place(<Document20Regular />, '문서', true)}{place(<Image20Regular />, '사진')}{place(<MusicNote220Regular />, '음악')}{place(<Video20Regular />, '동영상')}
            </aside>
            <div className="wb-fp-table">
              <div className="wb-fp-hrow"><span /><span>이름</span><span>수정한 날짜</span><span>유형</span></div>
              {rows}
            </div>
          </div>
          <footer className="wb-fp-foot is-local">
            <span className="wb-fp-label">파일 이름(N):</span>
            <span className="wb-fp-input">{sel?.name}</span>
            <span className="wb-fp-kind">모든 파일 <ChevronDown12Regular /></span>
            <div className="wb-fp-btns">
              <button type="button" className="wb-fp-go" disabled={!sel} onClick={() => sel && onPick(sel)}>열기(O)</button>
              <button type="button" className="wb-fp-b" onClick={onClose}>취소</button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
