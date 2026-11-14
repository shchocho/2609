/**
 * Teams 기본 실습 화면 (agent: 'teams', surface: 'teamsapp') — Copilot 이 아닌 Teams 기본 기능을 순서대로 눌러 보는 화면.
 * 화면은 "지금까지 켜진 깃발"만으로 결정된다. 깃발은 재생된 tool 메시지의 sets 에서 읽으므로 "이전으로"를 눌러도 화면이 함께 되돌아간다.
 * 눌러야 할 곳은 cue 의 target(= data-act)이다. 단추 이름과 순서는 Microsoft 지원 문서 기준(docs/customer-sarang/PLAN.md "제품 사실 확인").
 *
 * mode 별 깃발(sets) → 그 깃발을 켜는 단추(target)
 *  chat     : chat(앱 바 채팅 'chat') · new(새 메시지 'new') · expand(대상 옆 화살표 'expand') · named(그룹 이름 'name')
 *             · people(대상 'to') · sent(보내기 'send' 뒤) · reply(상대 답장)
 *  calendar : calendar(앱 바 일정 'calendar') · new(신규 'new') · titled(제목 추가 'title') · people(필수 참석자 초대 'people')
 *             · online(Microsoft Teams 모임 'online') · saved(저장 'save')
 *  files    : teams(앱 바 Teams 'teams') · menu(새 항목 'menu') · dialog(새 팀 'team') · named(팀 이름 'name')
 *             · channel(첫 번째 채널 이름 'channel') · created(만들기 'create') · shared(공유 탭 'shared')
 *             · newmenu(만들기 또는 업로드 'new') · folder(폴더 'folder') · infolder(폴더 열기 'open')
 *             · upmenu(만들기 또는 업로드 'new' 두 번째) · uploaded(파일 업로드 'upload')
 * 표기는 2026-11-14 한국어 Teams 데스크톱 앱 화면에서 확인한 것이다(PLAN.md "제품 사실 확인").
 */
import type { ReactNode } from 'react';
import {
  AlertRegular, ChatRegular, ChatFilled, CalendarLtrRegular, CalendarLtrFilled, CallRegular, CloudRegular, AppsRegular,
  ComposeRegular, ChevronDownRegular, FilterRegular, VideoRegular, PeopleAddRegular, SendRegular, AddRegular,
  ArrowUploadRegular, FolderRegular, DocumentRegular, MoreHorizontalRegular, SearchRegular, CheckmarkCircleRegular,
  EmojiRegular, AttachRegular, PeopleTeamRegular, PeopleTeamFilled, ShareRegular, LinkRegular, LockClosedRegular, EditRegular,
} from '@fluentui/react-icons';
import type { Scenario, TeamsLab } from '../types';
import type { Mark } from '../components/chrome';

/** 화면 조각들이 함께 쓰는 것: 깃발 확인 · 누를 차례인 단추 · 영역 표시 */
interface Ctx { has: (f: string) => boolean; target?: string; onAct: () => void; mark: Mark }

/** 누를 차례인 단추만 살아 있고(is-hunt), 나머지는 모양만 있다 */
function B({ c, act, className = '', label, children }: { c: Ctx; act?: string; className?: string; label?: string; children?: ReactNode }) {
  const on = !!act && act === c.target;
  return (
    <button
      type="button" className={`${className}${on ? ' is-hunt' : ''}`} aria-label={label}
      {...(on ? { 'data-act': act, onClick: c.onAct } : { tabIndex: -1, 'aria-disabled': true })}
    >{children}</button>
  );
}
const Av = ({ name, team }: { name: string; team?: boolean }) => <span className={`tl-av${team ? ' is-team' : ''}`} aria-hidden="true">{name.slice(0, 1)}</span>;
const Empty = ({ children }: { children: ReactNode }) => <div className="tl-empty"><p>{children}</p></div>;
/** 눌러서 채우는 입력란: 채워지기 전에는 안내 글, 뒤에는 값 */
function Field({ c, act, filled, hint, children }: { c: Ctx; act: string; filled: boolean; hint: string; children: ReactNode }) {
  return filled ? <span className="tl-inp is-filled">{children}</span> : <B c={c} act={act} className="tl-inp">{hint}</B>;
}
const Chips = ({ names }: { names: string[] }) => <>{names.map(p => <em key={p} className="tl-chip">{p}</em>)}</>;

const RAIL: [string, string, ReactNode, ReactNode][] = [
  ['activity', '활동', <AlertRegular />, <AlertRegular />],
  ['chat', '채팅', <ChatRegular />, <ChatFilled />],
  ['teams', 'Teams', <PeopleTeamRegular />, <PeopleTeamFilled />],
  ['calendar', '일정', <CalendarLtrRegular />, <CalendarLtrFilled />],
  ['onedrive', 'OneDrive', <CloudRegular />, <CloudRegular />],
  ['calls', '통화', <CallRegular />, <CallRegular />],
  ['apps', '앱', <AppsRegular />, <AppsRegular />],
];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

/* ---------- 채팅: 새 그룹 채팅 만들기 ---------- */
function ChatView({ c, g, sent, typed }: { c: Ctx; g: NonNullable<TeamsLab['group']>; sent?: string; typed: string | null }) {
  const { has, mark } = c;
  if (!has('chat')) return <Empty>왼쪽 앱 바에서 <b>채팅</b>을 열면 대화 목록이 보입니다.</Empty>;
  if (!has('new')) return <Empty>대화를 고르거나, 목록 위의 <b>새 메시지</b>로 대화를 시작하세요.</Empty>;
  return (
    <>
      {has('sent') ? (
        <header className={`tl-head sc-zone ${mark('header')}`}>
          <Av name={g.name} team /><b>{g.name}</b><i className="tl-pen"><EditRegular /></i>
          <span className="tl-tabs"><i className="on">채팅</i><i>공유</i><i>＋</i></span>
          <span className="tl-head-end"><i><VideoRegular /></i><i className="tl-people"><PeopleAddRegular />{g.people.length + 1}</i><i><MoreHorizontalRegular /></i></span>
        </header>
      ) : (
        <header className={`tl-head is-new sc-zone ${mark('header')}`}>
          {has('expand') && (
            <label className="tl-to"><span>그룹 이름:</span>
              <Field c={c} act="name" filled={has('named')} hint="그룹 이름 입력">{g.name}</Field>
            </label>
          )}
          <label className="tl-to"><span>대상:</span>
            <Field c={c} act="to" filled={has('people')} hint={has('expand') ? '이름, 전자 메일 또는 태그 입력' : '이름, 채팅, 채널, 이메일 또는 태그 입력'}><Chips names={g.people} /></Field>
            {!has('expand') && <B c={c} act="expand" className="tl-ico" label="그룹 이름 추가"><ChevronDownRegular /></B>}
          </label>
        </header>
      )}
      <div className="tl-thread">
        {!has('sent') && <div className="tl-hello"><b>새 대화를 시작하고 있습니다.</b><span>아래에 첫 번째 메시지를 입력하세요.</span></div>}
        {has('sent') && <div className="tl-msg is-me"><small>방금</small><p>{sent}</p></div>}
        {has('reply') && g.reply && <div className="tl-msg"><Av name={g.reply.from} /><div><small>{g.reply.from} · 방금</small><p>{g.reply.text}</p></div></div>}
      </div>
      <div className={`tl-compose sc-zone ${mark('composer')}`}>
        <span className={typed ? 'is-filled' : undefined}>{typed ?? '메시지를 입력하세요.'}</span>
        <i><EmojiRegular /></i><i><AttachRegular /></i>
        <B c={c} act="send" className="tl-send" label="보내기"><SendRegular /></B>
      </div>
    </>
  );
}

/* ---------- 일정: 새 모임 만들기 ---------- */
function CalendarView({ c, week, ev }: { c: Ctx; week: NonNullable<TeamsLab['week']>; ev: NonNullable<TeamsLab['event']> }) {
  const { has, mark } = c;
  if (!has('calendar')) return <Empty>왼쪽 앱 바에서 <b>일정</b>을 열면 이번 주 일정이 보입니다.</Empty>;
  if (has('new') && !has('saved')) {
    return (
      <>
        <header className={`tl-head sc-zone ${mark('header')}`}>
          <b>새 이벤트</b>
          <span className="tl-seg"><i className="on">이벤트</i><i>되풀이 항목</i><i>다른 용무 중 ⌄</i></span>
          <span className="tl-head-end"><B c={c} act="save" className="tl-primary">저장</B></span>
        </header>
        <div className="tl-form">
          <label><span>제목</span><Field c={c} act="title" filled={has('titled')} hint="제목 추가">{ev.title}</Field></label>
          <label><span>참석자</span><Field c={c} act="people" filled={has('people')} hint="필수 참석자 초대"><Chips names={ev.people} /></Field></label>
          <label className="is-when"><span>날짜·시간</span><span className="tl-inp is-filled">{ev.when}</span><i className="tl-ghost">스케줄러</i></label>
          <label><span>온라인</span>
            <B c={c} act="online" className={`tl-toggle${has('online') ? ' is-on' : ''}`} label="Microsoft Teams 모임"><i /></B>
            <small><b>Microsoft Teams 모임</b>{has('online') ? ' — 초대에 온라인 참가 링크가 들어갑니다' : ''}</small>
          </label>
          <label><span>내용</span><span className="tl-inp is-area">안건 추가</span></label>
        </div>
      </>
    );
  }
  const events = [...(week.events ?? []), ...(has('saved') ? [{ day: ev.day, hour: ev.hour, title: ev.title, isNew: true }] : [])];
  return (
    <>
      <header className={`tl-head sc-zone ${mark('header')}`}>
        <i className="tl-ghost">오늘</i><b>{week.label}</b><small>작업 주 ⌄</small>
        <span className="tl-head-end"><i className="tl-ghost"><VideoRegular />지금 모임 시작</i><B c={c} act="new" className="tl-primary"><AddRegular />신규</B></span>
      </header>
      <div className="tl-cal" style={{ '--days': week.days.length } as React.CSSProperties}>
        <i />{week.days.map(d => <b key={d}>{d}</b>)}
        {HOURS.map(h => [
          <i key={h}>{h}:00</i>,
          ...week.days.map((d, di) => {
            const e = events.find(x => x.day === di && x.hour === h);
            return <span key={d + h}>{e && <em className={'isNew' in e ? 'is-new' : undefined}>{e.title}</em>}</span>;
          }),
        ])}
      </div>
      {has('saved') && <p className="tl-toast" role="status"><CheckmarkCircleRegular />일정에 저장하고 참석자 {ev.people.length}명에게 초대를 보냈습니다.</p>}
    </>
  );
}

/* ---------- 팀·채널: 새 팀 만들고 채널 파일에 폴더 만들기 ---------- */
function FilesView({ c, tm, me }: { c: Ctx; tm: NonNullable<TeamsLab['team']>; me: string }) {
  const { has, mark } = c;
  if (!has('created')) {
    return (
      <>
        <Empty>{has('teams') ? <>목록 위의 <b>새 항목</b>(화살표)에서 새 팀과 새 채널을 만들 수 있습니다.</> : <>팀과 채널은 왼쪽 앱 바의 <b>Teams</b>에 모여 있습니다.</>}</Empty>
        {has('dialog') && (
          <div className="tl-scrim">
            <div className="tl-dialog" role="dialog" aria-label="팀 만들기">
              <h3>팀 만들기</h3>
              <p>처음부터 팀을 만들고 있습니다.</p>
              <label><span>팀 이름 *</span><Field c={c} act="name" filled={has('named')} hint="팀 이름 지정">{tm.name}</Field></label>
              <label><span>설명</span><span className={`tl-inp${has('named') ? ' is-filled' : ''}`}>{has('named') ? tm.desc : '다른 사람에게 이 팀이 어떤 팀인지 알려주세요.'}</span></label>
              <label><span>팀 유형</span><span><i className="tl-ghost"><LockClosedRegular />비공개</i></span></label>
              <label><span>첫 번째 채널 이름 *</span><Field c={c} act="channel" filled={has('channel')} hint="">{tm.channel}</Field></label>
              <div className="tl-dialog-end"><i className="tl-ghost">취소</i><B c={c} act="create" className="tl-primary">만들기</B></div>
            </div>
          </div>
        )}
      </>
    );
  }
  return (
    <>
      <header className={`tl-head sc-zone ${mark('header')}`}>
        <Av name={tm.name} team /><b>{tm.channel}</b>
        <span className="tl-tabs">
          <i className={has('shared') ? undefined : 'on'}>게시물</i>
          {has('shared') ? <i className="on">공유</i> : <B c={c} act="shared" className="tl-tab">공유</B>}
          <i>＋</i>
        </span>
        <span className="tl-head-end"><i className="tl-ghost"><VideoRegular />지금 모임 시작 ⌄</i><i><MoreHorizontalRegular /></i></span>
      </header>
      {!has('shared') ? (
        <>
          <div className="tl-thread">
            <div className="tl-msg"><Av name={me} /><div><small>{me} · 방금</small><p>{tm.welcome ?? `${tm.name} 팀을 만들었습니다.`}</p></div></div>
          </div>
          <div className={`tl-post sc-zone ${mark('composer')}`}><i className="tl-primary"><EditRegular />채널에 게시</i></div>
        </>
      ) : (
        <div className="tl-files">
          <div className="tl-bar">
            <p className="tl-crumb">문서 › {has('infolder') ? <>{tm.channel} › <b>{tm.folder}</b></> : <b>{tm.channel}</b>}</p>
            <i><ShareRegular />공유</i><i><LinkRegular />링크 복사</i><i><MoreHorizontalRegular /></i>
            <B c={c} act="new" className="tl-primary"><AddRegular />만들기 또는 업로드</B>
            {((has('newmenu') && !has('folder')) || (has('upmenu') && !has('uploaded'))) && (
              <div className="tl-menu">
                <B c={c} act={has('folder') ? undefined : 'folder'} className="tl-menu-row"><FolderRegular />폴더</B>
                <B c={c} act={has('infolder') ? 'upload' : undefined} className="tl-menu-row"><ArrowUploadRegular />파일 업로드</B>
                <span><ArrowUploadRegular />폴더 업로드</span>
                <span><DocumentRegular />Word 문서</span>
                <span><DocumentRegular />Excel 통합 문서</span>
                <span><DocumentRegular />PowerPoint 프레젠테이션</span>
              </div>
            )}
          </div>
          <div className="tl-views"><i className="on">모든 문서</i><i>메시지 내</i><i>＋ 보기 추가</i></div>
          <div className="tl-table">
            <div className="tl-tr"><b>이름</b><b>수정된 날짜</b><b>수정한 사람</b></div>
            {has('infolder')
              ? has('uploaded')
                ? <div className="tl-tr is-in"><span><DocumentRegular />{tm.file}</span><span>방금</span><span>{me}</span></div>
                : <div className="tl-tr is-none"><span>이 폴더는 비어 있습니다.</span></div>
              : has('folder')
                ? <div className="tl-tr is-in"><B c={c} act="open" className="tl-link"><FolderRegular />{tm.folder}</B><span>방금</span><span>{me}</span></div>
                : <div className="tl-tr is-none"><span>아직 파일이 없습니다.</span></div>}
          </div>
          {has('uploaded') && <p className="tl-toast" role="status"><CheckmarkCircleRegular />업로드했습니다. {tm.name} 구성원은 따로 권한을 주지 않아도 바로 열 수 있습니다.</p>}
        </div>
      )}
    </>
  );
}

/* ---------- 가운데 목록: 활동 또는 채팅(+ 팀 및 채널) ---------- */
function ListPane({ c, t, app, sent }: { c: Ctx; t: TeamsLab; app: string; sent?: string }) {
  const { has } = c;
  if (app === 'activity') {
    return (
      <>
        <div className="tl-list-head"><b>활동</b><span><i><FilterRegular /></i><i><MoreHorizontalRegular /></i></span></div>
        <p className="tl-list-note">새 알림이 없습니다.</p>
      </>
    );
  }
  const g = t.group, tm = t.team;
  const head = (title: string, chips: string[], menu?: ReactNode) => (
    <>
      <div className="tl-list-head">
        <b>{title}</b>
        <span>
          <i><MoreHorizontalRegular /></i><i><SearchRegular /></i>
          <B c={c} act={t.mode === 'chat' ? 'new' : undefined} className="tl-ico" label="새 메시지"><ComposeRegular /></B>
          <B c={c} act={t.mode === 'files' ? 'menu' : undefined} className="tl-ico is-caret" label="새 항목"><ChevronDownRegular /></B>
        </span>
        {menu}
      </div>
      <p className="tl-chips">{chips.map(x => <i key={x}>{x}</i>)}</p>
    </>
  );
  if (app === 'teams') {
    return (
      <>
        {head('Teams', ['읽지 않음', '채널', '커뮤니티'], has('menu') && !has('dialog') && (
          <div className="tl-menu">
            <span><ComposeRegular />새 메시지</span>
            <span><AddRegular />새 채널</span>
            <span><FilterRegular />새 스토리라인 게시물</span>
            <span><PeopleAddRegular />팀 참가</span>
            <B c={c} act="team" className="tl-menu-row"><PeopleTeamRegular />새 팀</B>
            <span><AddRegular />새 섹션</span>
          </div>
        ))}
        <u>Teams 및 채널</u>
        {has('created') && tm && (
          <>
            <span className="tl-row"><Av name={tm.name} team /><span><b>{tm.name}</b></span></span>
            <span className="tl-row is-sub is-on"><span><b>{tm.channel}</b></span></span>
          </>
        )}
        <span className="tl-row"><Av name="교" team /><span><b>교육부</b></span></span>
        <span className="tl-row"><Av name="사" team /><span><b>사무처 공지</b></span></span>
      </>
    );
  }
  return (
    <>
      {head('채팅', ['읽지 않음', '채팅', '모임 채팅'])}
      <u>채팅</u>
      {t.mode === 'chat' && has('new') && !has('sent') && <span className="tl-row is-on"><Av name="＋" /><span><b>새 메시지</b></span></span>}
      {t.mode === 'chat' && has('sent') && g && <span className="tl-row is-on"><Av name={g.name} team /><span><b>{g.name}</b><em>나: {sent?.slice(0, 18)}…</em></span></span>}
      {(t.chats ?? []).map(x => <span key={x.name} className="tl-row"><Av name={x.name} /><span><b>{x.name}</b><em>{x.sub}</em></span></span>)}
    </>
  );
}

export function TeamsApp({ s, shown, mark, target, onAct, ask }: {
  s: Scenario; shown: number; mark: Mark; target?: string; onAct: () => void; ask: string | null;
}) {
  const t = s.teams as TeamsLab; // check-scenarios 가 teams 시나리오의 teams 항목을 보장한다
  const flags = s.messages.slice(0, shown).flatMap(m => (m.role === 'tool' && m.sets ? [m.sets] : []));
  const c: Ctx = { has: f => flags.includes(f), target, onAct, mark };
  const app = t.mode === 'chat' ? (c.has('chat') ? 'chat' : 'activity') : t.mode === 'calendar' ? (c.has('calendar') ? 'calendar' : 'chat') : c.has('teams') ? 'teams' : 'chat';
  const sent = s.messages.find(m => m.role === 'user')?.text;
  const wide = app === 'calendar';
  return (
    <div className={`sc-shell is-teams tl${wide ? ' is-wide' : ''}`} data-app="teamsapp" data-mode={t.mode}>
      <div className="sc-tm-title">
        <span className="sc-tm-lead"><b>T</b>Microsoft Teams</span>
        <span className="sc-tm-search"><i><SearchRegular /></i>검색하거나 Copilot에게 질문하기(Ctrl+E)</span>
        <span className="sc-tm-right"><i>⋯</i><b>{t.me.slice(0, 1)}</b></span>
      </div>
      <nav className={`tl-rail sc-zone ${mark('rail')}`} aria-label="Teams 앱 바">
        {RAIL.map(([id, name, ico, icoOn]) => (
          <B key={id} c={c} act={id !== app && (id === 'chat' || id === 'calendar' || id === 'teams') ? id : undefined} className={`tl-app${id === app ? ' is-on' : ''}`}>
            {id === app ? icoOn : ico}<span>{name}</span>
          </B>
        ))}
      </nav>
      {!wide && <aside className={`tl-list sc-zone ${mark('list')}`}><ListPane c={c} t={t} app={app} sent={sent} /></aside>}
      <section className={`tl-main sc-zone ${mark('main')}`}>
        {t.mode === 'chat' && t.group && <ChatView c={c} g={t.group} sent={sent} typed={target === 'send' ? ask : null} />}
        {t.mode === 'calendar' && t.week && t.event && <CalendarView c={c} week={t.week} ev={t.event} />}
        {t.mode === 'files' && t.team && <FilesView c={c} tm={t.team} me={t.me} />}
      </section>
    </div>
  );
}
