/** 시나리오 재생 화면: 상황 → 흐름 → 체험 → 결과 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowCounterclockwiseRegular, ArrowLeftRegular, ArrowPreviousRegular, HomeRegular, NextRegular,
} from '@fluentui/react-icons';
import { INITIAL_STATE, type ChoiceOption, type Message, type MsgChoice, type PlayState } from '../types';
import { productName, scenarioById } from '../data';
import { trackById } from '../tracks';
import { go, HASH_ATTRACT, hashTrack } from '../router';
import { useEngine } from '../engine/useEngine';
import { useWriting } from '../engine/useWriting';
import { fill, makeVars, passes, pickIds } from '../engine/text';
import { MessageView, Permission, Working } from '../components/messages';
import { Bubble, CueButton, Hint, Key, Options, Solved, SpotOptions, Tip, TipLayer } from '../components/coach';
import { CHAT_NAV, ChatComposer, ChatMain, CpApp, History, NavItem, RailTabs, scrollToBottom, scrollToHold, type PickPhase } from '../components/chrome';
import { WE } from '../components/ui';
import { Cowork } from './Cowork';
import { Office } from '../surfaces/Office';
import { DoneStage, OverviewStage, PainStage, SceneStage } from './Stages';

const LABEL: Record<string, string> = { pain: '상황', overview: '흐름', demo: '체험', done: '결과' };
const SPOT_HOLD = 2600, REWIND_MS = 1600;
const NO_MESSAGES: Message[] = [];

export function Play({ track, scenario }: { track: string; scenario: string }) {
  const s = scenarioById(scenario);
  const t = trackById(track);
  const [st, setSt] = useState<PlayState>(INITIAL_STATE);
  const ids = pickIds(st);
  const p = useEngine(s?.messages ?? NO_MESSAGES, m => !passes(ids, m));
  const [stepIdx, setStepIdx] = useState(0);
  const [restarts, setRestarts] = useState(0);
  const [rewind, setRewind] = useState(0);
  const [deniedAt, setDeniedAt] = useState<number | null>(null);
  const [lit, setLit] = useState<string | null>(null);
  const [holdAt, setHoldAt] = useState<number | null>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  // Office(Word·Excel·PowerPoint) 시나리오는 결과물(workbench)이 있어도 Cowork 화면이 아니라 앱 화면에서 재생한다
  const office = s?.agent === 'office';
  const cowork = !!s?.workbench && !office;
  const steps = s ? ['pain', ...(s.overview?.length ? ['overview'] : []), 'demo', 'done'] : [];
  const step = steps[Math.min(stepIdx, steps.length - 1)] ?? 'demo';

  useEffect(() => {
    if (!rewind) return;
    const tm = window.setTimeout(() => setRewind(0), REWIND_MS);
    return () => window.clearTimeout(tm);
  }, [rewind]);
  useEffect(() => { if (step === 'demo') p.play(); else p.pause(); }, [step, p.play, p.pause]); // eslint-disable-line react-hooks/exhaustive-deps

  // Copilot Chat: 답변이 나오면 멈추고 "이어서 보기"
  useEffect(() => {
    if (step !== 'demo' || cowork || p.shown === 0) return;
    const m = s?.messages[p.shown - 1];
    if (m?.role === 'assistant' && passes(ids, m)) setHoldAt(p.shown - 1);
  }, [step, p.shown, s, ids.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (step === 'demo' && holdAt !== null) p.pause(); }, [step, holdAt, p.pause, p.playing]); // eslint-disable-line react-hooks/exhaustive-deps

  useWriting(office ? s : undefined, step === 'demo', p.shown, st, setSt, ids);

  // "/" 로 자료를 찾아 붙이는 연출
  const firstUserIdx = s ? s.messages.findIndex(m => m.role === 'user') : -1;
  const firstUser = firstUserIdx >= 0 ? s?.messages[firstUserIdx] : undefined;
  const pick = firstUser?.role === 'user' ? firstUser.pick : undefined;
  const [phase, setPhase] = useState<PickPhase>('done');
  const phaseStarted = useRef(false);
  useEffect(() => {
    if (step !== 'demo' || !p.ask || !pick || phaseStarted.current) return;
    phaseStarted.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase('search'); return; }
    setPhase('type');
    const tm = window.setTimeout(() => setPhase('search'), 850);
    return () => window.clearTimeout(tm);
  }, [step, p.ask, pick]);
  const pickPhase: PickPhase = pick && p.ask ? (phaseStarted.current ? phase : 'type') : 'done';
  const pickDone = !pick || pickPhase === 'done';
  const selectPick = () => {
    if (pickPhase !== 'search') return;
    setPhase('pick');
    window.setTimeout(() => setPhase('done'), 460);
  };

  // 화면 영역 찾기 퀴즈의 표시
  const marks = p.spot && !p.spot.plain && holdAt === null && !lit ? p.spot.options.map(o => o.at) : [];
  const mark = (zone: string) => `zone-${zone}${marks.includes(zone) ? ' is-asked' : ''}${lit === zone ? ' is-lit' : ''}`;
  const actsMark = marks.includes('actions') ? 'is-asked' : lit === 'actions' ? 'is-lit' : '';

  // 시나리오가 바뀌면 초기화
  const [seen, setSeen] = useState(scenario);
  if (seen !== scenario) {
    setSeen(scenario); setStepIdx(0); setLit(null); setHoldAt(null); setSt(INITIAL_STATE); setDeniedAt(null);
    phaseStarted.current = false; setPhase('done');
  }

  useEffect(() => { scrollToBottom(streamRef.current); }, [step, p.shown, p.done, p.pending, p.spot, holdAt]);
  useEffect(() => scrollToHold(streamRef.current), [holdAt]);

  const next = useCallback(() => setStepIdx(i => Math.min(i + 1, steps.length - 1)), [steps.length]);

  if (!s) {
    return (
      <main className="sc">
        <p className="booth-empty">시나리오를 찾을 수 없습니다.</p>
        <button type="button" className="booth-back" onClick={() => go(hashTrack(track))}><ArrowLeftRegular aria-hidden="true" />목록으로</button>
      </main>
    );
  }

  const vars = makeVars(st, s.model, s.effort);
  const resetAll = () => {
    setRestarts(n => n + 1); setLit(null); setHoldAt(null); setSt(INITIAL_STATE); setDeniedAt(null);
    phaseStarted.current = false; setPhase('done');
    p.restart();
  };
  const canBack = (step === 'demo' && p.canBack) || stepIdx > 0;
  const back = () => {
    setLit(null); setHoldAt(null); setDeniedAt(null);
    if (step === 'demo' && p.canBack) { setRewind(Date.now()); p.back(); return; }
    p.pause();
    setStepIdx(i => Math.max(i - 1, 0));
  };
  const isLast = stepIdx === steps.length - 1;
  /** 선택지를 고르면 바로 다음으로 (되돌아와 다시 고르면 앞선 선택을 바꾼다) */
  const choose = (c: MsgChoice, o: ChoiceOption) => {
    setSt(x => ({
      ...x,
      picks: [...x.picks.filter(q => q.key !== c.key), { key: c.key, option: o }],
      ...(c.builds ? { opened: x.opened.includes(c.builds) ? x.opened : [...x.opened, c.builds], writing: c.builds, rows: 0 } : {}),
    }));
    p.act();
  };
  const ask = p.ask ? fill(p.ask, vars) : null;
  const onSend = holdAt === null && pickDone && p.pending ? p.act : undefined;
  const stream = (
    <>
      {s.startedAt && <p className="sc-date">{s.startedAt}</p>}
      {s.messages.slice(0, p.shown).map((m, i) => (!passes(ids, m) ? null : m.role === 'choice' ? (
        <div key={i} className="sc-user"><div className="sc-user-box"><p>{(o => o?.say ?? o?.label)(st.picks.find(x => x.key === m.key)?.option)}</p></div></div>
      ) : (
        <MessageView
          key={i}
          m={m.role === 'assistant' || m.role === 'user' ? { ...m, text: fill(m.text, vars) } : m}
          active={i === p.shown - 1 && p.playing}
          ids={ids}
          hold={i === holdAt}
          acts={actsMark}
          {...(i === firstUserIdx && pick ? { pick } : {})}
        />
      )))}
      {p.approve && (
        <Permission
          key={p.shown}
          a={p.approve}
          denied={deniedAt === p.shown}
          onAllow={p.act}
          onDeny={() => setDeniedAt(p.shown)}
          onBack={() => setDeniedAt(null)}
          note={p.approve.warn ? <>⚠ {p.approve.warn}</> : undefined}
        />
      )}
      {p.busy && <Working />}
    </>
  );

  return (
    <main className="sc" data-track={track} data-scenario={scenario} data-brand-theme="copilot">
      <header className="sc-head">
        <button type="button" className="sc-back" aria-label={`${t?.name ?? '목록'} 목록으로 돌아가기`} onClick={() => go(hashTrack(track))}>
          <ArrowLeftRegular aria-hidden="true" />
        </button>
        <div className="sc-jump">
          <button type="button" className="sc-ghost" onClick={() => { resetAll(); setStepIdx(0); }}><ArrowCounterclockwiseRegular aria-hidden="true" />처음으로</button>
          <button type="button" className="sc-ghost" onClick={back} disabled={!canBack}><ArrowPreviousRegular aria-hidden="true" />이전으로</button>
          {isLast
            ? <button type="button" className="sc-ghost" onClick={() => { p.pause(); go(HASH_ATTRACT); }}><HomeRegular aria-hidden="true" />홈으로</button>
            : <button type="button" className="sc-ghost" onClick={() => { setLit(null); p.pause(); setStepIdx(steps.length - 1); }}>건너뛰기<NextRegular aria-hidden="true" /></button>}
        </div>
        <div className="sc-title"><h1>{s.title}</h1></div>
      </header>
      <ol className="sc-steps" aria-label="진행 단계" style={{ '--n': steps.length, '--i': stepIdx } as React.CSSProperties}>
        {steps.map((k, i) => (
          <li key={k} className={i === stepIdx ? 'on' : i < stepIdx ? 'past' : ''} {...(i === stepIdx ? { 'aria-current': 'step' as const } : {})}>
            {i < stepIdx
              ? <button type="button" aria-label={`${LABEL[k]} 단계로 돌아가기`} onClick={() => { setLit(null); setStepIdx(i); }}>{LABEL[k]}</button>
              : <span>{LABEL[k]}</span>}
          </li>
        ))}
      </ol>

      {step === 'pain' && (s.scene
        ? <SceneStage scene={s.scene} onNext={next} />
        : <PainStage title={s.title} caption={s.before ?? s.summary} onNext={next} />)}
      {step === 'overview' && <OverviewStage product={productName(s)} steps={s.overview ?? []} hook={s.hook} onNext={next} />}
      {step === 'done' && <DoneStage s={s} st={st} vars={vars} completed={p.done} />}

      {cowork && (
        <div style={{ display: step === 'demo' ? 'contents' : 'none' }}>
          <Cowork key={`${scenario}:${restarts}`} active={step === 'demo'} s={s} p={p} st={st} setSt={setSt} onDone={next} />
        </div>
      )}

      {step === 'demo' && !cowork && (
        <div className="sc-feed">
          <div className="desk-win is-app">
            {office ? (
              <Office
                s={s} st={st} vars={vars} ids={ids} streamRef={streamRef} mark={mark}
                ask={ask} onSend={onSend} pick={pick} pickPhase={pickPhase} onPickSelect={selectPick}
                onSlide={n => setSt(x => ({ ...x, slide: n }))}
              >
                {stream}
              </Office>
            ) : (
            <CpApp
              mode="chat"
              mark={mark}
              side={(
                <>
                  <RailTabs active="chat" />
                  <div id="chat-nav-group">
                    <div className="nav">{CHAT_NAV.map(n => <NavItem key={n.id} icon={n.icon} name={n.name} active={n.id === 'new'} />)}</div>
                    <History label="채팅" items={[s.title]} />
                  </div>
                </>
              )}
            >
              <ChatMain
                model={s.model}
                streamRef={streamRef}
                mark={mark}
                composer={(
                  <ChatComposer
                    text={ask ?? 'Copilot에 메시지 보내기'}
                    filled={!!ask}
                    onSend={onSend}
                    mark={mark}
                    pick={pick}
                    pickPhase={pickPhase}
                    onPickSelect={selectPick}
                  />
                )}
              >
                {stream}
              </ChatMain>
            </CpApp>
            )}
            <TipLayer>
              {holdAt !== null && (
                <Tip zone=".cwr-hold">
                  <Bubble q={`${productName(s)}의 답변입니다.\n내용을 확인한 뒤 이어서 진행해 주세요.`}>
                    <CueButton next onClick={() => { setHoldAt(null); p.play(); }}>이어서 보기</CueButton>
                  </Bubble>
                </Tip>
              )}
              {holdAt === null && p.approve && (
                <Tip zone=".wb-perm"><Bubble q={'실행하기 전에 사람에게 한 번 확인합니다.\n확인하고 이상이 없다면 승인을 눌러주세요.'} /></Tip>
              )}
              {holdAt === null && p.choice && (
                <Tip>
                  <Bubble kind="choice" q={p.choice.text}>
                    <Options options={p.choice.options} onPick={o => p.choice && choose(p.choice, o as ChoiceOption)} />
                  </Bubble>
                </Tip>
              )}
              {holdAt === null && p.spot && (
                <SpotTip key={p.shown} spot={p.spot} lit={lit} onPick={setLit} onPass={() => { setLit(null); p.act(); }} />
              )}
              {holdAt === null && pick && pickPhase === 'search' && (
                <Tip zone={['.wb-slash', '.zone-composer']}>
                  <Bubble q="검색 목록이 열렸어요. 참고할 자료를 골라 붙여 볼까요?">
                    <Hint>검색 목록에서 <b>{pick.name}</b> 를 눌러 붙여 보세요.</Hint>
                  </Bubble>
                </Tip>
              )}
              {holdAt === null && p.pending && pickDone && (
                <Tip zone=".zone-composer">
                  <Bubble q={p.pending.text}>
                    {p.ask ? <Hint><Key>{WE.send}</Key>을 눌러 보내 보세요.</Hint> : <CueButton onClick={p.act}>{p.pending.action}</CueButton>}
                  </Bubble>
                </Tip>
              )}
              {p.done && holdAt === null && (
                <Tip dim={false}>
                  <Bubble q="모든 작업이 완료되었습니다."><CueButton next onClick={next}>결과물 보기</CueButton></Bubble>
                </Tip>
              )}
            </TipLayer>
          </div>
        </div>
      )}
      {rewind > 0 && <p className="sc-rewind" role="status">한 걸음 되돌렸습니다</p>}
    </main>
  );
}

function SpotTip({ spot, lit, onPick, onPass }: {
  spot: NonNullable<ReturnType<typeof useEngine>['spot']>; lit: string | null; onPick: (z: string) => void; onPass: () => void;
}) {
  const [picked, setPicked] = useState(false);
  return (
    <Tip zone={picked && lit ? `.zone-${lit}` : null} dim={picked}>
      <Bubble kind="quiz" q={spot.text}>
        <SpotOptions options={spot.options} answer={spot.answer} holdMs={SPOT_HOLD} onPass={onPass} onPick={z => { setPicked(true); onPick(z); }} />
        {picked && <Solved>{spot.does}</Solved>}
      </Bubble>
    </Tip>
  );
}
