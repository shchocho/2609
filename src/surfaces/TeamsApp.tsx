/**
 * Teams 기본 실습 화면 (agent: 'teams', surface: 'teamsapp') — Copilot 이 아닌 Teams 기본 기능을 순서대로 눌러 보는 화면.
 * 화면은 "지금까지 켜진 깃발"만으로 결정된다. 깃발은 재생된 tool 메시지의 sets 에서 읽으므로 "이전으로"를 눌러도 화면이 함께 되돌아간다.
 * 눌러야 할 곳은 cue 의 target(= data-act)이다. 단추 이름과 순서는 Microsoft 지원 문서 기준(docs/customer-sarang/PLAN.md "제품 사실 확인").
 *
 * mode 별 깃발(sets) → 그 깃발을 켜는 단추(target)
 *  chat     : chat(앱 바 채팅 'chat') · new(새 채팅 'new') · expand(받는 사람 옆 화살표 'expand') · named(그룹 이름 'name')
 *             · people(받는 사람 'to') · sent(보내기 'send' 뒤) · reply(상대 답장)
 *  calendar : calendar(앱 바 일정 'calendar') · new(새로 만들기 'new') · titled(제목 'title') · people(필수 참석자 'people')
 *             · online(Teams 모임 'online') · saved(저장 'save')
 *  files    : menu(새 항목 'menu') · dialog(새 팀 'team') · named(팀 이름 'name') · channel(첫 번째 채널 이름 'channel')
 *             · created(만들기 'create') · shared(공유 탭 'shared') · newmenu(새로 만들기 'new') · folder(폴더 'folder')
 *             · infolder(폴더 열기 'open') · uploaded(업로드 'upload')
 */
import type { ReactNode } from 'react';
import {
  AlertRegular, ChatRegular, ChatFilled, CalendarLtrRegular, CalendarLtrFilled, CallRegular, CloudRegular, AppsRegular,
  ComposeRegular, ChevronDownRegular, FilterRegular, VideoRegular, PeopleAddRegular, SendRegular, AddRegular,
  ArrowUploadRegular, FolderRegular, DocumentRegular, MoreHorizontalRegular, SearchRegular, CheckmarkCircleRegular,
  EmojiRegular, AttachRegular,
} from '@fluentui/react-icons';
import type { Scenario, TeamsLab } from '../types';
import type { Mark } from '../components/chrome';

interface Ctx { has: (f: string) => boolean; target?: string; onAct: () => void }

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

const RAIL: [string, string, ReactNode, ReactNode][] = [
  ['activity', '활동', <AlertRegular />, <AlertRegular />],
  ['chat', '채팅', <ChatRegular />, <ChatFilled />],
  ['calendar', '일정', <CalendarLtrRegular />, <CalendarLtrFilled />],
  ['calls', '통화', <CallRegular />, <CallRegular />],
  ['onedrive', 'OneDrive', <CloudRegular />, <CloudRegular />],
  ['apps', '앱', <AppsRegular />, <AppsRegular />],
];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

export function TeamsApp({ s, shown, mark, target, onAct, ask }: {
  s: Scenario; shown: number; mark: Mark; target?: string; onAct: () => void; ask: string | null;
}) {
  const t = s.teams as TeamsLab; // check-scenarios 가 teams 시나리오의 teams 항목을 보장한다
  const flags = s.messages.slice(0, shown).flatMap(m => (m.role === 'tool' && m.sets ? [m.sets] : []));
  const c: Ctx = { has: f => flags.includes(f), target, onAct };
  const { has } = c;
  const g = t.group, ev = t.event, tm = t.team;
  const app = t.mode === 'chat' ? (has('chat') ? 'chat' : 'activity') : t.mode === 'calendar' ? (has('calendar') ? 'calendar' : 'chat') : 'chat';
  const chats = t.chats ?? [];
  const groupMade = t.mode === 'chat' && has('sent');
  const teamMade = t.mode === 'files' && has('created');

  /* ---------- 가운데 목록 ---------- */
  const list = app === 'activity' ? (
    <>
      <div className="tl-list-head"><b>활동</b><span><i><FilterRegular /></i><i><MoreHorizontalRegular /></i></span></div>
      <p className="tl-list-note">새 알림이 없습니다.</p>
    </>
  ) : (
    <>
      <div className="tl-list-head">
        <b>채팅</b>
        <span>
          <i><FilterRegular /></i>
          <B c={c} act={t.mode === 'chat' ? 'new' : undefined} className="tl-ico" label="새 채팅"><ComposeRegular /></B>
          <B c={c} act={t.mode === 'files' ? 'menu' : undefined} className="tl-ico is-caret" label="새 항목"><ChevronDownRegular /></B>
        </span>
        {t.mode === 'files' && has('menu') && !has('dialog') && (
          <div className="tl-menu" role="menu">
            <span><ComposeRegular />새 채팅</span>
            <span><AddRegular />새 채널</span>
            <B c={c} act="team" className="tl-menu-row"><AddRegular />새 팀</B>
          </div>
        )}
      </div>
      {teamMade && tm && (
        <>
          <u>팀 및 채널</u>
          <span className="tl-row"><Av name={tm.name} team /><span><b>{tm.name}</b></span></span>
          <span className="tl-row is-sub is-on"><span><b>{tm.channel}</b></span></span>
        </>
      )}
      <u>채팅</u>
      {groupMade && g && <span className="tl-row is-on"><Av name={g.name} team /><span><b>{g.name}</b><em>나: {s.messages.find(m => m.role === 'user')?.text.slice(0, 18)}…</em></span></span>}
      {chats.map(x => <span key={x.name} className="tl-row"><Av name={x.name} /><span><b>{x.name}</b><em>{x.sub}</em></span></span>)}
    </>
  );

  /* ---------- 오른쪽 본문 ---------- */
  let main: ReactNode;
  if (t.mode === 'chat' && g) {
    const typed = target === 'send' ? ask : null;
    main = !has('chat') ? <Empty>왼쪽 앱 바에서 <b>채팅</b>을 열면 대화 목록이 보입니다.</Empty>
      : !has('new') ? <Empty>대화를 고르거나, 목록 위의 <b>새 채팅</b>으로 대화를 시작하세요.</Empty>
      : (
        <>
          {has('sent') ? (
            <header className={`tl-head sc-zone ${mark('header')}`}>
              <Av name={g.name} team /><b>{g.name}</b>
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
              <label className="tl-to"><span>받는 사람:</span>
                <Field c={c} act="to" filled={has('people')} hint="이름, 메일 또는 태그 입력">{g.people.map(p => <em key={p} className="tl-chip">{p}</em>)}</Field>
                {!has('expand') && <B c={c} act="expand" className="tl-ico" label="그룹 이름 추가"><ChevronDownRegular /></B>}
              </label>
            </header>
          )}
          <div className="tl-thread">
            {has('sent') && <div className="tl-msg is-me"><small>방금</small><p>{s.messages.find(m => m.role === 'user')?.text}</p></div>}
            {has('reply') && g.reply && <div className="tl-msg"><Av name={g.reply.from} /><div><small>{g.reply.from} · 방금</small><p>{g.reply.text}</p></div></div>}
          </div>
          <div className={`tl-compose sc-zone ${mark('composer')}`}>
            <span className={typed ? 'is-filled' : undefined}>{typed ?? '메시지 입력'}</span>
            <i><EmojiRegular /></i><i><AttachRegular /></i>
            <B c={c} act="send" className="tl-send" label="보내기"><SendRegular /></B>
          </div>
        </>
      );
  } else if (t.mode === 'calendar' && ev && t.week) {
    const events = [...(t.week.events ?? []), ...(has('saved') ? [{ day: ev.day, hour: ev.hour, title: ev.title, isNew: true }] : [])];
    main = !has('calendar') ? <Empty>왼쪽 앱 바에서 <b>일정</b>을 열면 이번 주 일정이 보입니다.</Empty>
      : has('new') && !has('saved') ? (
        <>
          <header className={`tl-head sc-zone ${mark('header')}`}>
            <b>새 이벤트</b>
            <span className="tl-head-end"><i className="tl-ghost">스케줄러</i><B c={c} act="save" className="tl-primary">저장</B></span>
          </header>
          <div className="tl-form">
            <label><span>제목</span><Field c={c} act="title" filled={has('titled')} hint="제목 추가">{ev.title}</Field></label>
            <label><span>필수 참석자</span><Field c={c} act="people" filled={has('people')} hint="필수 참석자 추가">{ev.people.map(p => <em key={p} className="tl-chip">{p}</em>)}</Field></label>
            <label><span>날짜·시간</span><span className="tl-inp is-filled">{ev.when}</span></label>
            <label><span>Teams 모임</span>
              <B c={c} act="online" className={`tl-toggle${has('online') ? ' is-on' : ''}`} label="Teams 모임"><i /></B>
              <small>{has('online') ? '켜짐 — 초대에 온라인 참가 링크가 들어갑니다' : '꺼짐'}</small>
            </label>
            <label><span>설명</span><span className="tl-inp is-area">이 모임에 대한 설명 입력</span></label>
          </div>
        </>
      ) : (
        <>
          <header className={`tl-head sc-zone ${mark('header')}`}>
            <b>일정</b><small>{t.week.label}</small>
            <span className="tl-head-end"><i className="tl-ghost">지금 모임 시작</i><B c={c} act="new" className="tl-primary"><AddRegular />새로 만들기</B></span>
          </header>
          <div className="tl-cal" style={{ '--days': t.week.days.length } as React.CSSProperties}>
            <i />{t.week.days.map(d => <b key={d}>{d}</b>)}
            {HOURS.map(h => [
              <i key={h}>{h}:00</i>,
              ...t.week!.days.map((d, di) => {
                const e = events.find(x => x.day === di && x.hour === h);
                return <span key={d + h}>{e && <em className={'isNew' in e ? 'is-new' : undefined}>{e.title}</em>}</span>;
              }),
            ])}
          </div>
          {has('saved') && <p className="tl-toast" role="status"><CheckmarkCircleRegular />일정에 저장하고 참석자 {ev.people.length}명에게 초대를 보냈습니다.</p>}
        </>
      );
  } else if (t.mode === 'files' && tm) {
    main = !has('created') ? (
      <>
        <Empty>목록 위의 <b>새 항목</b>에서 팀과 채널을 만들 수 있습니다.</Empty>
        {has('dialog') && (
          <div className="tl-scrim">
            <div className="tl-dialog" role="dialog" aria-label="새 팀">
              <h3>새 팀</h3>
              <label><span>팀 이름</span><Field c={c} act="name" filled={has('named')} hint="팀 이름 입력">{tm.name}</Field></label>
              <label><span>설명</span><span className={`tl-inp${has('named') ? ' is-filled' : ''}`}>{has('named') ? tm.desc : '팀을 설명하는 글 (선택)'}</span></label>
              <label><span>팀 유형</span><span className="tl-radio"><i className="on" />비공개 <small>초대한 사람만 참가</small><i />공개 <small>조직의 누구나 참가</small></span></label>
              <label><span>첫 번째 채널 이름</span><Field c={c} act="channel" filled={has('channel')} hint="채널 이름 입력 (필수)">{tm.channel}</Field></label>
              <div className="tl-dialog-end"><i className="tl-ghost">취소</i><B c={c} act="create" className="tl-primary">만들기</B></div>
            </div>
          </div>
        )}
      </>
    ) : (
      <>
        <header className={`tl-head sc-zone ${mark('header')}`}>
          <Av name={tm.name} team /><b>{tm.channel}</b>
          <span className="tl-tabs">
            <i className={has('shared') ? undefined : 'on'}>게시물</i>
            {has('shared') ? <i className="on">공유</i> : <B c={c} act="shared" className="tl-tab">공유</B>}
            <i>＋</i>
          </span>
          <span className="tl-head-end"><i className="tl-ghost"><VideoRegular />지금 모임 시작</i><i><MoreHorizontalRegular /></i></span>
        </header>
        {!has('shared') ? (
          <>
            <div className="tl-thread">
              <div className="tl-msg"><Av name={t.me} /><div><small>{t.me} · 방금</small><p>{tm.welcome ?? `${tm.name} 팀을 만들었습니다.`}</p></div></div>
            </div>
            <div className={`tl-compose sc-zone ${mark('composer')}`}><span>채널에 게시</span><i><EmojiRegular /></i><i><AttachRegular /></i></div>
          </>
        ) : (
          <div className="tl-files">
            <div className="tl-bar">
              <B c={c} act="new" className="tl-primary"><AddRegular />새로 만들기</B>
              <B c={c} act="upload" className="tl-ghost"><ArrowUploadRegular />업로드</B>
              <i className="tl-ghost">SharePoint에서 열기</i>
              {has('newmenu') && !has('folder') && (
                <div className="tl-menu" role="menu">
                  <B c={c} act="folder" className="tl-menu-row"><FolderRegular />폴더</B>
                  <span><DocumentRegular />Word 문서</span>
                  <span><DocumentRegular />Excel 통합 문서</span>
                  <span><DocumentRegular />PowerPoint 프레젠테이션</span>
                </div>
              )}
            </div>
            <p className="tl-crumb">문서 › {tm.channel}{has('infolder') && <> › <b>{tm.folder}</b></>}</p>
            <div className="tl-table" role="table">
              <div role="row"><b>이름</b><b>수정한 날짜</b><b>수정한 사람</b></div>
              {has('infolder')
                ? has('uploaded')
                  ? <div role="row" className="is-in"><span><DocumentRegular />{tm.file}</span><span>방금</span><span>{t.me}</span></div>
                  : <div role="row" className="is-none"><span>이 폴더는 비어 있습니다. 파일을 끌어다 놓거나 업로드를 누르세요.</span></div>
                : has('folder')
                  ? <div role="row" className="is-in"><B c={c} act="open" className="tl-link"><FolderRegular />{tm.folder}</B><span>방금</span><span>{t.me}</span></div>
                  : <div role="row" className="is-none"><span>아직 파일이 없습니다. 새로 만들기로 폴더부터 만들어 보세요.</span></div>}
            </div>
            {has('uploaded') && <p className="tl-toast" role="status"><CheckmarkCircleRegular />업로드했습니다. {tm.name} 구성원은 따로 권한을 주지 않아도 바로 열 수 있습니다.</p>}
          </div>
        )}
      </>
    );
  }

  const wide = app === 'calendar';
  return (
    <div className={`sc-shell is-teams tl${wide ? ' is-wide' : ''}`} data-app="teamsapp" data-mode={t.mode}>
      <div className="sc-tm-title">
        <span className="sc-tm-lead"><b>T</b>Microsoft Teams</span>
        <span className="sc-tm-search"><i><SearchRegular /></i>검색(Ctrl+E)</span>
        <span className="sc-tm-right"><i>⋯</i><b>{t.me.slice(0, 1)}</b></span>
      </div>
      <nav className={`tl-rail sc-zone ${mark('rail')}`} aria-label="Teams 앱 바">
        {RAIL.map(([id, name, ico, icoOn]) => (
          <B key={id} c={c} act={id !== app && (id === 'chat' || id === 'calendar') ? id : undefined} className={`tl-app${id === app ? ' is-on' : ''}`}>
            {id === app ? icoOn : ico}<span>{name}</span>
          </B>
        ))}
      </nav>
      {!wide && <aside className={`tl-list sc-zone ${mark('list')}`}>{list}</aside>}
      <section className={`tl-main sc-zone ${mark('main')}`}>{main}</section>
    </div>
  );
}
