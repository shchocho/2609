/** Copilot Cowork 작업 화면 — 여러 파일을 읽고 만드는 시나리오를 재생한다. */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { ChoiceOption, Message, PlayState, Scenario } from '../types';
import type { Engine } from '../engine/useEngine';
import { AGENTS, EFFORTS, MODELS } from '../data';
import { appFromName, artifactName, fill, makeVars, passes, pickIds, writeLength, objParticle, Rich } from '../engine/text';
import { ArtifactView, CoworkMail } from '../components/artifacts';
import { MessageView, Permission, SchedulePermission, Working, isSchedule, type Clip } from '../components/messages';
import { Bubble, CueButton, Hint, Key, Options, Solved, Tip, TipLayer } from '../components/coach';
import {
  COWORK_NAV, CoworkComposer, CoworkMain, CpApp, FilePicker, History, NavItem, PanelSection, RailTabs, Steps, WorkPanel,
  scrollToBottom, scrollToHold, type PickFile,
} from '../components/chrome';
import { AnswerActs, AppIcon, WE, X } from '../components/ui';

const CHOICE_DELAY = 1100, ROW_MS = 320, SLIDE_MS = 260;
const KIND_LABEL: Record<string, string> = {
  excel: 'Excel 스프레드시트', word: 'Word 문서', powerpoint: 'PowerPoint 프레젠테이션', onenote: 'OneNote 전자 필기장', teams: 'Teams 메시지',
};
const HUNT_LABEL: Record<string, string> = {
  model: '모델 선택', effort: '노력 수준', attach: '첨부', new: '새 작업', mine: '내 작업', auto: '자동화', custom: '사용자 지정',
};
const ATTACH_MENU = [
  { id: 'context', name: '작업 컨텍스트 추가', desc: '파일, 사람, 모임', keys: 'Ctrl+/', icon: X.context },
  { id: 'upload', name: '이미지 및 파일 업로드', desc: 'PDF, Word, Excel, 이미지', keys: 'Ctrl+U', icon: X.upload },
  { id: 'cloud', name: '클라우드 파일 및 폴더 첨부', desc: 'OneDrive, SharePoint, Teams', keys: 'Ctrl+Shift+U', icon: X.cloud },
  { id: 'custom', name: '사용자 지정', desc: '기술 및 플러그인 관리', keys: '', icon: X.plugin },
];
const ATTACH_TO: Record<string, Menu> = { upload: 'attach-local', cloud: 'attach-cloud' };
type Menu = 'model' | 'effort' | 'attach' | 'attach-cloud' | 'attach-local' | null;
type Extra = { say?: string; clip?: string; reply?: { text: string } };

const kindLabel = (a: { app: string; where: string }) =>
  a.app === 'outlook' ? (a.where.includes('보낸') ? '보낸 편지함에 저장됨' : a.where.includes('임시') ? '임시보관함에 저장됨' : a.where) : KIND_LABEL[a.app] ?? a.where;
const narrow = () => window.matchMedia('(max-width: 700px)').matches;

export function Cowork({ active, s, p, st, setSt, onDone }: {
  active: boolean; s: Scenario; p: Engine; st: PlayState; setSt: React.Dispatch<React.SetStateAction<PlayState>>; onDone: () => void;
}) {
  const wb = s.workbench!;
  const model = st.model ?? s.model;
  const effort = st.effort ?? s.effort ?? '보통';
  const [menu, setMenu] = useState<Menu>(null);
  const menuOpener = useRef<HTMLElement | null>(null);
  const [menuPos, setMenuPos] = useState({ left: 8, bottom: 56 });
  const [clip, setClip] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: string } | null>(null);
  const [extras, setExtras] = useState<Record<number, Extra>>({});
  const [denied, setDenied] = useState(false);
  const [allowedAt, setAllowedAt] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [ackAt, setAckAt] = useState(-1);
  const [holdAt, setHoldAt] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  const hold = holding && !p.done;
  const [openId, setOpenId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [panelOpens, setPanelOpens] = useState(0);
  const [panelOn, setPanelOn] = useState(() => window.matchMedia('(min-width: 701px)').matches);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (active && panelOpens > 0) panelRef.current?.focus({ preventScroll: true }); }, [active, panelOpens]);
  useEffect(() => {
    if (p.shown === 0) { setAckAt(-1); setReviewed([]); setHoldAt(null); setHolding(false); setOpenId(null); }
  }, [p.shown]);
  const [lastShown, setLastShown] = useState(p.shown);
  if (lastShown !== p.shown) {
    const rewound = p.shown < lastShown;
    setLastShown(p.shown);
    setMenu(null);
    if (rewound) { setHolding(false); setHoldAt(null); }
  }
  useEffect(() => { if (!active) setMenu(null); }, [active]);
  useEffect(() => {
    if (menu === null && document.activeElement === document.body) menuOpener.current?.focus({ preventScroll: true });
  }, [menu]);

  const ids = useMemo(() => pickIds(st), [st.picks, st.hunted]); // eslint-disable-line react-hooks/exhaustive-deps
  const vars = useMemo(() => makeVars(st, s.model, s.effort), [st.picks, st.model, st.effort, s.model, s.effort]); // eslint-disable-line react-hooks/exhaustive-deps
  const pickedNow = st.picks.find(x => x.key === p.choice?.key)?.option;

  // 선택지를 고른 뒤: 잠시 후 (다시 정리한 답변이 있으면 보여 주고) 다음으로
  useEffect(() => {
    if (!active || !p.choice || !pickedNow) return;
    const at = p.shown;
    const t = window.setTimeout(() => {
      if (pickedNow.reply) {
        const reply = pickedNow.reply;
        setExtras(x => ({ ...x, [at]: { say: pickedNow.label, reply } }));
        setHoldAt(at);
        setHolding(true);
      }
      p.act();
    }, CHOICE_DELAY);
    return () => window.clearTimeout(t);
  }, [active, p.choice, p.shown, p.act, pickedNow]); // eslint-disable-line react-hooks/exhaustive-deps

  // 답변이 나타나면 멈추고 "이어서 보기"를 기다린다
  useEffect(() => {
    if (!active || p.shown === 0) return;
    const m = s.messages[p.shown - 1];
    if (m?.role !== 'assistant' || !passes(ids, m) || holdAt === p.shown - 1) return;
    setHoldAt(p.shown - 1);
    setHolding(true);
  }, [active, p.shown, s.messages, st.picks.length, holdAt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (active && hold) p.pause(); }, [active, hold, p.pause, p.playing]); // eslint-disable-line react-hooks/exhaustive-deps

  // 승인 후 잠시 뒤 진행
  useEffect(() => {
    if (!active || !p.approve || allowedAt !== p.shown) return;
    const t = window.setTimeout(p.act, 600);
    return () => window.clearTimeout(t);
  }, [active, p.approve, p.shown, p.act, allowedAt]);
  // 기능 찾기 성공 후 진행
  useEffect(() => {
    if (!active || !p.hunt || !st.hunted || menu) return;
    const t = window.setTimeout(p.act, 700);
    return () => window.clearTimeout(t);
  }, [active, p.hunt, p.act, st.hunted, menu]);

  // 도구 메시지의 효과: 파일 열기 / 작성 / 슬라이드 옮기기
  useEffect(() => {
    const m = s.messages[p.shown - 1];
    if (!m || !passes(ids, m)) return;
    if (m.role === 'tool') {
      const open = m.opens ?? m.shows;
      if (open) setSt(x => ({ ...x, opened: x.opened.includes(open) ? x.opened : [...x.opened, open] }));
      if (m.writes) {
        const w = m.writes;
        setSt(x => ({ ...x, opened: x.opened.includes(w) ? x.opened : [...x.opened, w], writing: w, rows: 0 }));
      }
      if (m.translate) setSt(x => ({ ...x, moved: 0, moving: 1 }));
      return;
    }
    if (m.role === 'assistant' && m.over) setSt(x => ({ ...x, over: true }));
  }, [p.shown, s.messages, st.picks.length, st.hunted, setSt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = st.writing;
    if (!active || !id) return;
    const a = wb.artifacts[id];
    if (!a) return;
    if (st.rows >= writeLength(a, ids)) { setSt(x => ({ ...x, writing: null })); return; }
    const t = window.setTimeout(() => setSt(x => ({ ...x, rows: x.rows + 1 })), ROW_MS);
    return () => window.clearTimeout(t);
  }, [active, st.writing, st.rows, st.picks.length, st.hunted, setSt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!active || !st.moving) return;
    const deck = Object.values(wb.artifacts).find(a => a.deck && !a.deck.src)?.deck;
    if (!deck) return;
    if (st.moved >= deck.slides.length) { setSt(x => ({ ...x, moving: 0 })); return; }
    const t = window.setTimeout(() => setSt(x => ({ ...x, moved: x.moved + 1, moving: x.moved + 2, slide: x.moved + 1 })), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [active, st.moving, st.moved, setSt]); // eslint-disable-line react-hooks/exhaustive-deps

  // 메시지 아래에 붙는 파일 카드 위치
  const slots = useMemo(() => {
    const out: Record<number, string[]> = {};
    const seen = new Set<string>();
    const put = (i: number, id: string) => { if (seen.has(id)) return; seen.add(id); (out[i] ??= []).push(id); };
    s.messages.forEach((m, i) => {
      if (!passes(ids, m)) return;
      if (m.role === 'tool') {
        const open = m.opens ?? m.shows;
        if (open) put(i, open);
        if (m.writes) {
          const j = s.messages.findIndex((n, k) => k > i && n.role === 'assistant' && passes(ids, n));
          put(j < 0 ? i : j, m.writes);
        }
      }
      if (m.role === 'assistant' && m.files) m.files.forEach(f => put(i, f));
    });
    return out;
  }, [s.messages, ids]);

  // 첫 요청에 함께 붙는 읽기 자료
  const clips: Clip[] = useMemo(() => {
    const menuNames = new Set(s.messages.flatMap(m => (m.role === 'hunt' && m.target === 'attach' ? (m.menu?.items ?? []).map(x => x.name) : [])));
    return Object.values(wb.artifacts)
      .filter(a => a.origin === 'read')
      .map(a => ({ name: artifactName(a, ids), app: a.app, link: a.share === 'link' }))
      .filter(c => !menuNames.has(c.name) && (c.link || /\.\w{3,4}$/.test(c.name)));
  }, [s.messages, wb, ids]);
  const firstUser = s.messages.findIndex(m => m.role === 'user');

  // 결과물 확인(리뷰) 단계
  const madeSlots = Object.entries(slots)
    .map(([i, list]) => [Number(i), list.filter(id => wb.artifacts[id]?.origin === 'made')] as const)
    .filter(([i, list]) => i < p.shown && list.length > 0)
    .sort((a, b) => a[0] - b[0]);
  const lastMade = madeSlots.at(-1)?.[1] ?? [];
  const lastMadeAt = madeSlots.at(-1)?.[0] ?? -1;
  const review = !p.done && lastMadeAt > ackAt;
  const unseen = lastMade.filter(id => !reviewed.includes(id));
  useEffect(() => {
    if (!active || !review) return;
    p.pause();
    if (narrow()) setPanelOn(false);
  }, [active, review, p.pause, p.playing]); // eslint-disable-line react-hooks/exhaustive-deps

  // 스크롤
  useEffect(() => {
    const el = streamRef.current;
    if (!active || !el) return;
    const cue = el.querySelector('.cwr-fcard.is-cue');
    if (cue && !p.done) { cue.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    scrollToBottom(el);
  }, [active, p.shown, p.pending, p.choice, p.hunt, p.approve, p.done, hold, reviewed, extras]);
  useEffect(() => (active && hold ? scrollToHold(streamRef.current) : undefined), [active, hold]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const sendReady = !review && !!(p.pending && p.ask);

  const openArtifact = (id: string, from?: HTMLElement) => {
    setReviewed(r => (r.includes(id) ? r : [...r, id]));
    if (from) returnFocus.current = from;
    setOpenId(id);
    setPanelOn(true);
    setPanelOpens(n => n + 1);
    setSt(x => ({ ...x, tab: id, opened: x.opened.includes(id) ? x.opened : [...x.opened, id] }));
  };
  const closeArtifact = () => {
    setOpenId(null);
    if (narrow()) setPanelOn(false);
    returnFocus.current?.focus({ preventScroll: true });
  };
  const nextReview = () => {
    const next = unseen[0];
    if (next) { openArtifact(next); return; }
    closeArtifact();
    setPanelOn(false);
    setMenu(null);
    setAckAt(lastMadeAt);
    setHolding(false);
    p.play();
  };
  const finish = () => { closeArtifact(); setPanelOn(false); onDone(); };

  const pickOption = (key: string, builds: string | undefined, o: ChoiceOption) => {
    if (st.picks.some(x => x.key === key)) return;
    const at = p.shown;
    setExtras(x => ({ ...x, [at]: { say: o.label } }));
    setSt(x => ({
      ...x,
      picks: [...x.picks, { key, option: o }],
      ...(builds ? { opened: x.opened.includes(builds) ? x.opened : [...x.opened, builds], writing: builds, rows: 0 } : {}),
    }));
  };

  /** 기능 찾기(hunt) 판정 */
  const tryHunt = (target: string, value?: string, file?: string) => {
    if (review) return;
    const h = p.hunt;
    if (!h || st.hunted) {
      setToast(value ? { text: `‘${value}’ 으로 바꿨습니다`, tone: '' } : { text: '체험 화면에서는 이 기능이 동작하지 않습니다', tone: '' });
      return;
    }
    if (target !== h.target) { setToast({ text: h.wrong?.[target] ?? '이번에 찾을 곳은 여기가 아닙니다', tone: 'is-warn' }); return; }
    if ((target === 'model' || target === 'effort') && !value) return;
    setSt(x => ({ ...x, hunted: h.chip ?? value ?? HUNT_LABEL[target] ?? target }));
    const label = HUNT_LABEL[target] ?? target;
    setToast({ text: `미션 완료 — ${label}${objParticle(label)} 찾았습니다`, tone: 'is-good' });
    const at = p.shown;
    const say = h.say ? fill(h.say, { ...vars, effort: value ?? effort }) : h.does;
    const att = file ?? clip;
    setExtras(x => ({ ...x, [at]: { say, ...(att ? { clip: att } : {}) } }));
    setClip(null);
  };
  const pickValue = (kind: 'model' | 'effort', v: string) => {
    setMenu(null);
    setSt(x => ({ ...x, [kind]: v }));
    tryHunt(kind, v);
  };
  const toggleMenu = (m: Exclude<Menu, null>, btn: HTMLElement) => {
    menuOpener.current = btn;
    const box = btn.closest('.cwr-cbox'), row = btn.closest('.crow');
    if (box && row) {
      const b = box.getBoundingClientRect();
      setMenuPos({ left: Math.round(btn.getBoundingClientRect().left - b.left), bottom: Math.round(b.bottom - row.getBoundingClientRect().top + 8) });
    }
    setMenu(cur => (cur === m ? null : m));
  };
  const railClick = (id: string) => { setMenu(null); tryHunt(id); };

  // 첨부 찾기에서 고를 파일
  const attachFiles: PickFile[] = useMemo(() => {
    const h = p.hunt;
    if (!h || h.target !== 'attach' || st.hunted) return [];
    const item = h.menu?.items.find(x => !x.wrong);
    if (!item) return [];
    if (item.files?.length) return item.files;
    return /\.\w{3,4}$/.test(item.name) ? [{ name: item.name, app: appFromName(item.name) }] : [];
  }, [p.hunt, st.hunted]);
  const attachOpen = attachFiles.length > 0 && (menu === 'attach' || menu === 'attach-cloud' || menu === 'attach-local');
  const pickerKind = menu === 'attach-cloud' ? 'cloud' : menu === 'attach-local' ? 'local' : null;

  const steps = s.messages
    .map((m, i) => ({ m, i }))
    .filter(x => x.m.role === 'tool' && passes(ids, x.m))
    .map(x => ({ name: x.m.role === 'tool' ? x.m.tool : '', state: (x.i < p.shown - 1 ? 'done' : x.i === p.shown - 1 ? 'active' : 'pending') as 'done' | 'active' | 'pending' }));
  const outputs = st.opened.map(id => ({ id, a: wb.artifacts[id] })).filter(x => x.a?.origin === 'made');
  const approve = p.approve?.mail
    ? { ...p.approve, mail: { ...p.approve.mail, to: fill(p.approve.mail.to, vars), subject: fill(p.approve.mail.subject, vars), body: p.approve.mail.body.map(b => fill(b, vars)) } }
    : p.approve;
  const opened = openId ? wb.artifacts[openId] : undefined;
  const progressive = s.messages.some(m => m.role === 'tool' && m.translate);
  const writing = st.writing === openId ? st.rows : null;

  const card = (id: string, cue: boolean) => {
    const a = wb.artifacts[id];
    if (!a) return null;
    if (a.origin === 'read') {
      return (
        <button type="button" className={`cwr-ref${st.tab === id ? ' is-on' : ''}`} onClick={e => openArtifact(id, e.currentTarget)}>
          <span className="ri" aria-hidden="true">{X.search}</span>
          <span className="rt"><b>“{artifactName(a, ids)}”</b>{cue ? ' 검색 중' : ''}</span>
          <span className="rp"><AppIcon app={a.app} />파일</span>
          <span className="rc" aria-hidden="true">{X.chevRight}</span>
        </button>
      );
    }
    return (
      <div className="cwr-files">
        <button type="button" className={`cwr-fcard${st.tab === id ? ' is-on' : ''}${(p.done || review) && unseen.includes(id) ? ' is-cue' : ''}`} onClick={e => openArtifact(id, e.currentTarget)}>
          <AppIcon app={a.app} />
          <span className="ftx"><span className="fn">{artifactName(a, ids)}</span><span className="fk">{kindLabel(a)}</span></span>
          <span className="op" aria-hidden="true">{X.open}</span>
        </button>
      </div>
    );
  };

  const composer = (
    <CoworkComposer
      text={sendReady && p.ask ? fill(p.ask, vars) : `${AGENTS.cowork.name}에 메시지 보내기`}
      filled={sendReady}
      clip={clip ? (
        <p className="cwr-clip"><AppIcon app={appFromName(clip)} /><span>{clip}</span><button type="button" aria-label="붙인 파일 빼기" onClick={() => setClip(null)}>{WE.close}</button></p>
      ) : sendReady && p.shown === 0 && clips.length > 0 ? (
        <div className="cwr-clips">
          {clips.map(c => (c.link ? <span key={c.name} className="cwr-link">{c.name}</span> : <p key={c.name} className="cwr-clip"><AppIcon app={c.app} /><span>{c.name}</span></p>))}
        </div>
      ) : undefined}
      menus={(
        <>
          {menu === 'model' && (
            <div className="wb-menu is-model" data-coach="lit" style={menuPos}>
              {MODELS.map((m, i) => (
                <Fragment key={m.v}>
                  <button type="button" className={m.v === model ? 'is-on' : ''} onClick={() => pickValue('model', m.v)}>
                    <i aria-hidden="true">{m.v === model ? '✓' : ''}</i><span>{m.v}<em>{m.d}</em></span>
                  </button>
                  {i === 0 && <span className="wb-menu-div" aria-hidden="true" />}
                </Fragment>
              ))}
            </div>
          )}
          {menu === 'effort' && (() => {
            const at = Math.max(0, EFFORTS.findIndex(e => e.v === effort));
            return (
              <div className="wb-menu is-effort" data-coach="lit" style={{ ...menuPos, '--at': at, '--last': EFFORTS.length - 1 } as React.CSSProperties}>
                <p className="wb-eff-h">노력 {effort}</p>
                <p className="wb-eff-ends"><span>빠르게</span><span>더 스마트하게</span></p>
                <div className="wb-eff-track">
                  <span className="wb-eff-fill" aria-hidden="true" />
                  {EFFORTS.map((e, i) => (
                    <button key={e.v} type="button" className={`wb-eff-stop${i === at ? ' is-on' : ''}${i < at ? ' is-past' : ''}`} aria-label={`${e.v} — ${e.d}`} aria-current={i === at} onClick={() => pickValue('effort', e.v)}>
                      <i aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <p className="wb-menu-note">더 많은 <b>노력</b>을 기울이면 더 철저해지지만, 속도는 더 느려지고 크레딧도 더 많이 소모됩니다.</p>
              </div>
            );
          })()}
          {menu === 'attach' && (
            <div className="wb-menu is-attach" data-coach="lit" style={menuPos}>
              {ATTACH_MENU.map(it => (
                <Fragment key={it.id}>
                  {it.id === 'custom' && <span className="wb-menu-div" aria-hidden="true" />}
                  <button
                    type="button"
                    className="is-row"
                    onClick={() => {
                      const to = ATTACH_TO[it.id];
                      if (to && attachFiles.length > 0) { setMenu(to); return; }
                      setMenu(null);
                      if (!st.hunted) setToast({ text: '체험 화면에서는 이 기능이 동작하지 않습니다', tone: '' });
                    }}
                  >
                    <span className="wb-menu-ico" aria-hidden="true">{it.icon}</span>
                    <span>{it.name}<em>{it.desc}</em></span>
                    {it.keys ? <kbd className="wb-menu-keys">{it.keys}</kbd> : null}
                  </button>
                </Fragment>
              ))}
            </div>
          )}
        </>
      )}
    >
      <button
        type="button"
        className="round-btn"
        aria-label="첨부"
        onClick={e => {
          const h = p.hunt;
          toggleMenu('attach', e.currentTarget);
          if (!h || st.hunted) return;
          if (h.target !== 'attach') { tryHunt('attach'); return; }
          if (attachFiles.length === 0) tryHunt('attach');
        }}
      >
        {WE.plus}
      </button>
      <button type="button" className={`dd-btn${menu === 'model' ? ' is-open' : ''}`} onClick={e => { toggleMenu('model', e.currentTarget); if (p.hunt && !st.hunted && p.hunt.target !== 'model') tryHunt('model'); }}>
        {model}{WE.chevron}
      </button>
      <button type="button" className={`dd-btn${menu === 'effort' ? ' is-open' : ''}`} onClick={e => { toggleMenu('effort', e.currentTarget); if (p.hunt && !st.hunted && p.hunt.target !== 'effort') tryHunt('effort'); }}>
        {effort}{WE.chevron}
      </button>
      <span className="spacer" />
      <button type="button" className="round-btn" aria-label="음성" onClick={() => tryHunt('mic')}>{WE.mic}</button>
      <button
        type="button"
        className={`cw-send${sendReady || clip ? ' is-hunt' : ''}`}
        disabled={review || (!sendReady && !clip)}
        onClick={() => (clip && !sendReady ? tryHunt('attach', clip, clip) : p.act())}
        aria-label="보내기"
      >
        {WE.send}
      </button>
    </CoworkComposer>
  );

  const showTips = active && (!opened || review || p.done);

  return (
    <div className="desk">
      <div className="desk-win is-app is-back">
        <CpApp
          mode="cowork"
          panelOpen={panelOn || !!opened}
          panelResizable={!!opened}
          overlay={pickerKind && attachFiles.length > 0 ? (
            <FilePicker kind={pickerKind} files={attachFiles} onPick={f => { setMenu(null); setClip(f.name); }} onClose={() => setMenu('attach')} />
          ) : undefined}
          side={(
            <>
              <RailTabs active="cowork" />
              <div id="cowork-nav-group">
                <div className="nav">{COWORK_NAV.map(n => <NavItem key={n.id} icon={n.icon} name={n.name} active={n.id === 'new'} onClick={() => railClick(n.id)} />)}</div>
                <History label="작업" items={[wb.task]} />
              </div>
            </>
          )}
          panel={opened ? (
            <aside ref={panelRef} className={`cwr-panel is-doc${p.done || review ? ' is-reviewing' : ''}`} tabIndex={-1} aria-label={artifactName(opened, ids)}>
              {opened.kind === 'mail' ? (
                <CoworkMail a={opened} writing={writing} vars={vars} ids={ids} onClose={closeArtifact} />
              ) : (
                <>
                  <div className="cwr-ptop">
                    <h2><AppIcon app={opened.app} />{artifactName(opened, ids)}</h2>
                    <button type="button" className="x" aria-label="닫기" onClick={closeArtifact}>{X.x}</button>
                  </div>
                  <div className="cwr-pdoc">
                    <ArtifactView
                      a={opened} writing={writing} vars={vars} ids={ids} slide={st.slide} moved={st.moved}
                      progressive={progressive} over={st.over} onSlide={n => setSt(x => ({ ...x, slide: n }))}
                    />
                  </div>
                </>
              )}
            </aside>
          ) : (
            <WorkPanel onClose={() => setPanelOn(false)}>
              {steps.length > 0 && <PanelSection title="단계" count={`${steps.filter(x => x.state === 'done').length}/${steps.length}`}><Steps items={steps} /></PanelSection>}
              {outputs.length > 0 && (
                <PanelSection title="출력" count={String(outputs.length)}>
                  <ul className="cwr-outs">
                    {outputs.map(({ id, a }) => (
                      <li key={id}>
                        <button type="button" onClick={e => openArtifact(id, e.currentTarget)}>
                          <AppIcon app={a.app} /><span className="on">{artifactName(a, ids)}</span><span aria-hidden="true">{X.open}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </PanelSection>
              )}
            </WorkPanel>
          )}
        >
          <CoworkMain
            panelOpen={panelOn || !!opened}
            onTogglePanel={() => setPanelOn(v => !v)}
            streamRef={streamRef}
            toast={toast ? <p className={`wb-toast ${toast.tone}`} data-coach="over">{toast.text}</p> : undefined}
            composer={composer}
          >
            {s.messages.slice(0, p.shown).map((m: Message, i) => {
              const ex = extras[i];
              return (
                <div key={i} className={i === holdAt && (hold || p.choice) ? 'cwr-hold' : undefined}>
                  <MessageView
                    m={m.role === 'assistant' || m.role === 'user' ? { ...m, text: fill(m.text, vars) } : m}
                    active={i === p.shown - 1 && p.playing}
                    ids={ids}
                    {...(i === firstUser ? { clips } : {})}
                  />
                  {slots[i] && !(i === holdAt && hold) && (
                    <div className="cwr-slots">{slots[i].map(id => <div key={id}>{card(id, i === p.shown - 1 && p.playing)}</div>)}</div>
                  )}
                  {ex?.say && (
                    <div className="sc-user">
                      {ex.clip && <p className="sc-user-clip"><AppIcon app={appFromName(ex.clip)} /><span>{ex.clip}</span></p>}
                      <div className="sc-user-box"><p>{ex.say}</p></div>
                    </div>
                  )}
                  {ex?.reply && (
                    <div className="sc-answer">
                      <div className="sc-answer-body"><Rich text={fill(ex.reply.text, vars)} /></div>
                      <div className="sc-answer-acts"><AnswerActs /></div>
                    </div>
                  )}
                </div>
              );
            })}
            {!review && !hold && approve && (isSchedule(approve) ? (
              <SchedulePermission
                a={approve} denied={denied}
                onBook={() => { setSt(x => ({ ...x, allowed: true })); setAllowedAt(p.shown); }}
                onDeny={() => { setAllowedAt(null); setDenied(true); }}
                onBack={() => setDenied(false)}
              />
            ) : (
              <Permission
                a={approve} denied={denied}
                onAllow={() => { setSt(x => ({ ...x, allowed: true })); setAllowedAt(p.shown); }}
                onDeny={() => { setAllowedAt(null); setDenied(true); }}
                onBack={() => setDenied(false)}
                note={<><span aria-hidden="true">⊙</span> 아래에 메시지를 보내면 편집 내용이 삭제되고 위의 작업이 취소됩니다.</>}
              />
            ))}
            {!review && p.busy && <Working />}
          </CoworkMain>
        </CpApp>
        {showTips && (
          <TipLayer>
            {!opened && hold && (
              <Tip zone=".cwr-hold">
                <Bubble q={holdAt !== null && extras[holdAt]?.reply
                  ? `선택하신 기준으로 ${AGENTS.cowork.name}이 다시 정리한 내용입니다.\n내용을 확인한 뒤 이어서 진행해 주세요.`
                  : `${AGENTS.cowork.name}의 답변입니다.\n내용을 확인한 뒤 이어서 진행해 주세요.`}>
                  <CueButton next onClick={() => { setMenu(null); setHolding(false); p.play(); }}>이어서 보기</CueButton>
                </Bubble>
              </Tip>
            )}
            {!opened && !review && !hold && p.approve && (
              <Tip zone={isSchedule(p.approve) ? '.wb-task' : '.wb-perm'}>
                <Bubble q={isSchedule(p.approve)
                  ? '실행 주기와 시점은 사람에게 먼저 확인합니다.\n일정을 확인하고 이상이 없다면 예약을 눌러주세요.'
                  : p.approve.mail
                    ? `${AGENTS.cowork.name}은 메일 초안까지만 작성합니다.\n내용을 확인하고 이상이 없다면 승인을 눌러주세요.`
                    : '실행하기 전에 사람에게 한 번 확인합니다.\n확인하고 이상이 없다면 승인을 눌러주세요.'} />
              </Tip>
            )}
            {!opened && !review && !hold && p.choice && (
              <Tip zone={holdAt === null ? null : '.cwr-hold'}>
                <Bubble kind="choice" q={p.choice.text}>
                  <Options options={p.choice.options} onPick={o => p.choice && pickOption(p.choice.key, p.choice.builds, o as ChoiceOption)} />
                </Bubble>
              </Tip>
            )}
            {!opened && !review && !hold && p.hunt && (!menu || st.hunted || attachOpen) && (
              <Tip zone={pickerKind ? '.wb-filepick' : menu ? '.wb-menu' : p.hunt.at === 'rail' ? '.side' : '.cwr-cbox'}>
                <Bubble kind="quiz" q={p.hunt.text}>
                  {st.hunted ? (
                    <>
                      <Solved>{p.hunt.does}</Solved>
                      {menu && <CueButton next onClick={() => setMenu(null)}>이어서 보기</CueButton>}
                    </>
                  ) : clip ? (
                    <Hint><Key>{WE.send}</Key>을 눌러 전송해 주세요.</Hint>
                  ) : attachOpen ? (
                    <Hint>{pickerKind === 'cloud' ? '첨부할 자료를 선택하고 ‘선택’을 눌러주세요.' : pickerKind === 'local' ? '첨부할 파일을 선택하고 ‘열기’를 눌러주세요.' : '파일 선택 영역을 눌러 첨부할 문서를 열어 보세요.'}</Hint>
                  ) : (
                    <Hint>{p.hunt.hint}</Hint>
                  )}
                </Bubble>
              </Tip>
            )}
            {!opened && !review && !hold && p.pending && (
              <Tip zone=".cwr-cbox">
                <Bubble q={p.pending.text}>
                  {p.ask ? <Hint><Key>{WE.send}</Key>을 눌러 보내 보세요.</Hint> : <CueButton onClick={p.act}>{p.pending.action}</CueButton>}
                </Bubble>
              </Tip>
            )}
            {review && !hold && (
              <Tip zone={opened ? '.cwr-panel.is-doc' : unseen.length > 0 ? '.cwr-fcard.is-cue' : '.cwr-fcard.is-on'}>
                {opened ? (
                  <Bubble q="결과물 내용을 확인해 보세요."><CueButton onClick={nextReview}>{unseen.length > 0 ? '다음 결과물' : '다음 단계'}</CueButton></Bubble>
                ) : unseen.length === 0 ? (
                  <Bubble q="결과물을 확인했습니다. 다음 작업을 이어갈까요?"><CueButton onClick={nextReview}>다음 단계</CueButton></Bubble>
                ) : (
                  <Bubble q="결과물이 완성되었습니다. 생성된 문서를 하나씩 열어 확인해 보세요.">
                    <Hint>대화창의 파일 카드를 눌러 열어 보세요.{lastMade.length > 1 && <b>{` ${lastMade.length - unseen.length} / ${lastMade.length}`}</b>}</Hint>
                  </Bubble>
                )}
              </Tip>
            )}
            {p.done && (
              <Tip dim={false} zone={unseen.length > 0 ? '.cwr-fcard.is-cue' : null}>
                <Bubble q="모든 작업이 완료되었습니다.">
                  <Hint>위로 올리면 처음부터 다시 볼 수 있습니다.{unseen.length > 0 && ' 생성된 결과물은 대화창의 파일 카드를 눌러 다시 확인할 수 있습니다.'}</Hint>
                  <CueButton next onClick={finish}>결과 보기</CueButton>
                </Bubble>
              </Tip>
            )}
          </TipLayer>
        )}
      </div>
    </div>
  );
}
