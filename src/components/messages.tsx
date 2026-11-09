/** 대화 흐름에 나타나는 메시지 조각들 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  ChevronLeftRegular, ChevronRightRegular, Dismiss20Regular, DismissRegular, Document20Regular,
  DocumentPdf20Regular, Globe20Regular, Open20Regular, ZoomInRegular,
} from '@fluentui/react-icons';
import type { ImageRef, Message, MsgApprove, MsgAssistant, Pick, Source } from '../types';
import { Bold, Rich, asset } from '../engine/text';
import { AnswerActs, AppIcon, WE, X } from './ui';

/** 도구 실행 문구 → 분류 단어 */
function toolCategory(t: string) {
  if (/검색|찾는|훑는/.test(t)) return '검색';
  if (/읽는|보는/.test(t)) return '읽기';
  if (/계산|분석|정렬|대조/.test(t)) return '분석';
  if (/작성|쓰는|만드는|그리는|채우는/.test(t)) return '생성';
  if (/연결|가져오는|불러오는/.test(t)) return '연결';
  if (/변환|옮기는/.test(t)) return '변환';
  if (/예약|요청|발송|올리는|등록/.test(t)) return '실행';
  return '확인';
}

export interface Clip { name: string; app: string; link?: boolean }

/** 대화 메시지 하나 (cue/spot/approve/choice/hunt 는 별도 UI로 처리하므로 그리지 않음) */
export function MessageView({ m, active, ids, extra, hold = false, clips, pick, acts = '' }: {
  m: Message; active?: boolean; ids?: string[]; extra?: ReactNode; hold?: boolean; clips?: Clip[]; pick?: Pick; acts?: string;
}) {
  if (m.role === 'cue' || m.role === 'spot' || m.role === 'approve' || m.role === 'choice' || m.role === 'hunt') return null;
  if (ids && m.only && !m.only.some(id => ids.includes(id))) return null;
  if (m.role === 'note') return <p className="sc-note">{m.text}</p>;
  if (m.role === 'tool') {
    return (
      <div className={`sc-act${active ? ' is-now' : ' is-done'}`}>
        <p className="sc-act-h"><img className="sc-act-ico" src="/logo/copilot/copilot.png" alt="" aria-hidden="true" />{toolCategory(m.tool)}<i aria-hidden="true">›</i></p>
        <p className="sc-act-d">{m.tool}</p>
      </div>
    );
  }
  if (m.role === 'user') {
    const parts = pick ? m.text.split(pick.token) : null;
    return (
      <div className="sc-user">
        {pick && <p className="sc-user-clip"><AppIcon app={pick.app ?? 'word'} /><span>{pick.name}</span></p>}
        {clips?.map(c => c.link
          ? <p key={c.name} className="sc-user-link"><span className="cwr-link">{c.name}</span></p>
          : <p key={c.name} className="sc-user-clip"><AppIcon app={c.app} /><span>{c.name}</span></p>)}
        <div className="sc-user-box">
          <p>{parts ? <>{parts[0]}<span className="cwr-link">{pick!.name}</span>{parts.slice(1).join(pick!.token)}</> : <Bold text={m.text} />}</p>
        </div>
      </div>
    );
  }
  if (m.sources?.length) return <SourcedAnswer message={m} extra={extra} hold={hold} />;
  return (
    <div className={`sc-answer${hold ? ' cwr-hold' : ''}`}>
      <div className="sc-answer-body">
        <Rich text={m.text} />
        {m.images && <ImageGallery images={m.images} />}
      </div>
      {extra}
      <div className={`sc-answer-acts sc-zone zone-actions ${acts}`}><AnswerActs /></div>
    </div>
  );
}

/* ---------- 출처가 달린 답변 (Copilot Chat) ---------- */
function SourceMark({ source }: { source: Source }) {
  return (
    <span className={`sc-source-mark is-${source.kind}`} aria-hidden="true">
      {source.kind === 'pdf' ? <DocumentPdf20Regular /> : source.kind === 'page' ? <Globe20Regular /> : <Document20Regular />}
    </span>
  );
}

function SourcedAnswer({ message, extra, hold }: { message: MsgAssistant; extra?: ReactNode; hold?: boolean }) {
  const sources = message.sources ?? [];
  const id = useId().replace(/:/g, '');
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Source[]>(sources);
  const open = (list: Source[]) => { setSelected(list); dialog.current?.showModal(); };
  return (
    <div className={`sc-answer sc-referenced-answer${hold ? ' cwr-hold' : ''}`}>
      <div className="sc-answer-body">
        <Rich
          text={message.text}
          afterParagraph={i => {
            const hits = sources.filter(s => s.blocks?.includes(i));
            if (!hits.length) return null;
            const labels = hits.map(s => s.label).join(', ');
            return (
              <button type="button" className="sc-citation" title={labels} aria-label={`출처 확인: ${labels}`} aria-haspopup="dialog" aria-controls={id} onClick={() => open(hits)}>
                <SourceMark source={hits[0]} />{hits.length > 1 && <span>외 {hits.length - 1}개</span>}
              </button>
            );
          }}
        />
        <section className="sc-answer-sources" aria-label="Sources">
          <h3>Sources</h3>
          <ul>
            {sources.map(s => (
              <li key={s.id}>
                <button type="button" className="sc-source-link" aria-haspopup="dialog" aria-controls={id} onClick={() => open([s])}>
                  <span>{s.label}</span><SourceMark source={s} />
                </button>
              </li>
            ))}
          </ul>
        </section>
        {message.images && <ImageGallery images={message.images} />}
      </div>
      {extra}
      <div className="sc-answer-acts">
        <AnswerActs />
        <button type="button" className="sc-reference-trigger" aria-label={`참조 ${sources.length}개`} aria-haspopup="dialog" aria-controls={id} onClick={() => open(sources)}>
          <span className="sc-source-stack">{sources.map(s => <SourceMark key={s.id} source={s} />)}</span><span>참조</span>
        </button>
      </div>
      <dialog ref={dialog} id={id} className="sc-source-dialog" aria-labelledby={`${id}-title`} onClick={e => { if (e.target === dialog.current) dialog.current?.close(); }}>
        <header>
          <h2 id={`${id}-title`}>참조</h2>
          <button type="button" className="sc-source-close" title="닫기" aria-label="참조 닫기" onClick={() => dialog.current?.close()}><Dismiss20Regular /></button>
        </header>
        <ul>
          {selected.map(s => (
            <li key={s.id}>
              <h3><SourceMark source={s} /><span>{s.label}</span></h3>
              {s.detail && <p>{s.detail}</p>}
              {s.url
                ? <a href={s.url} target="_blank" rel="noopener noreferrer"><Open20Regular />원문 열기</a>
                : <p className="sc-source-unavailable">원문 링크 미제공</p>}
            </li>
          ))}
        </ul>
      </dialog>
    </div>
  );
}

/* ---------- 생성 이미지 ---------- */
export function Slides({ slides, title, labels, initial = 0 }: { slides: string[]; title: string; labels?: string[]; initial?: number }) {
  const [i, setI] = useState(initial);
  const n = slides.length;
  return (
    <div
      className="sc-slides"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'ArrowLeft') setI(v => Math.max(0, v - 1));
        if (e.key === 'ArrowRight') setI(v => Math.min(n - 1, v + 1));
      }}
    >
      <div className="sc-slide-view">
        <button type="button" className="sc-slide-nav" title="이전 이미지" disabled={i === 0} onClick={() => setI(v => Math.max(0, v - 1))}><ChevronLeftRegular /></button>
        <div className="sc-image-stage"><img src={asset(slides[i])} alt={labels?.[i] ?? `${title} ${i + 1}번째 이미지`} /></div>
        <button type="button" className="sc-slide-nav" title="다음 이미지" disabled={i === n - 1} onClick={() => setI(v => Math.min(n - 1, v + 1))}><ChevronRightRegular /></button>
      </div>
      <div className="sc-slide-bar"><span aria-live="polite">{i + 1} <i>/ {n}</i></span></div>
    </div>
  );
}

function ImageGallery({ images }: { images: ImageRef[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open !== null) dialog.current?.showModal();
  }, [open]);
  return (
    <>
      <div className="sc-image-gallery" style={{ '--image-columns': Math.min(4, images.length) } as React.CSSProperties}>
        {images.map((im, i) => (
          <button key={im.src} type="button" className="sc-image-thumb" title={`${im.alt} 확대`} aria-label={`${im.alt} 확대`} onClick={() => setOpen(i)}>
            <img src={asset(im.src)} alt={im.alt} />
            <span>{im.alt}<ZoomInRegular /></span>
          </button>
        ))}
      </div>
      <dialog ref={dialog} className="sc-image-dialog" aria-label="이미지 확대 보기" onClose={() => setOpen(null)}>
        <h2>생성된 이미지</h2>
        <button type="button" className="sc-image-close" aria-label="확대 보기 닫기" title="닫기" onClick={() => dialog.current?.close()}><DismissRegular /></button>
        {open !== null && <Slides slides={images.map(x => x.src)} labels={images.map(x => x.alt)} title="생성된 이미지" initial={open} />}
      </dialog>
    </>
  );
}

/* ---------- 작업 중 표시 ---------- */
const MARK_A = 'M609.124 435.184L605.261 450.65H568.079C540.534 450.65 516.501 469.399 509.83 496.136L476.176 630.787H408.974C369.913 630.787 341.245 594.078 350.724 556.176L384.466 421.227C393.384 385.589 425.405 360.59 462.132 360.59H550.892C589.953 360.59 618.621 397.299 609.141 435.201L609.124 435.184Z';
const MARK_B = 'M472.295 646.234L476.157 630.768H513.34C540.884 630.768 564.918 612.018 571.589 585.281L605.242 450.631H672.445C711.506 450.631 740.174 487.339 730.694 525.242L696.952 660.191C688.034 695.828 656.013 720.827 619.287 720.827H530.526C491.465 720.827 462.797 684.119 472.277 646.217L472.295 646.234Z';
const MARK_MASK = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='341 341 400 400'><path d='${MARK_A}'/><path d='${MARK_B}'/></svg>`)}")`;

export function Working({ label = '작업 중…' }: { label?: string }) {
  return (
    <p className="cpw cpw-copilot" aria-live="polite">
      <span className="cpw-shimmer-mark" style={{ maskImage: MARK_MASK, WebkitMaskImage: MARK_MASK }} aria-hidden="true" />
      <span className="cpw-t">{label}</span>
    </p>
  );
}

/* ---------- 실행 전 권한 확인 ---------- */
export function Permission({ a, denied, onAllow, onDeny, onBack, note }: {
  a: MsgApprove; denied: boolean; onAllow: () => void; onDeny: () => void; onBack: () => void; note?: ReactNode;
}) {
  if (denied) {
    return (
      <div className="wb-perm is-denied" role="status">
        <div className="wb-perm-head"><span className="wb-perm-ico" aria-hidden="true">{X.copy}</span><span className="wb-perm-title">{a.what}</span></div>
        <div className="wb-perm-foot">
          <span className="wb-perm-note">{a.denied ?? '거절하셨습니다. 여기서 멈춥니다.'}</span>
          <div className="wb-perm-btns"><button type="button" className="wb-perm-b" onClick={onBack}>다시 보기</button></div>
        </div>
      </div>
    );
  }
  return (
    <div className="wb-perm-box">
      <div className={`wb-perm${a.mail ? ' is-mail' : ''}`} role="dialog" aria-label="Permission">
        <div className="wb-perm-head">
          <span className="wb-perm-ico" aria-hidden="true">{a.mail ? <AppIcon app="outlook" /> : X.copy}</span>
          <span className="wb-perm-title">{a.what}</span>
          {a.kind && <span className="wb-perm-kind">{a.kind}</span>}
        </div>
        {a.rows && (
          <div className="wb-perm-rows">
            {a.rows.map((r, i) => <div key={i} className="wb-perm-row"><span className="wb-perm-k">{r.label}</span><span className="wb-perm-v">{r.value}</span></div>)}
          </div>
        )}
        {a.mail && (
          <div className="wb-perm-mail">
            <div className="wb-perm-rows">
              <div className="wb-perm-row"><span className="wb-perm-k">받는 사람</span><span className="wb-perm-v"><b className="wb-perm-to">{a.mail.to}</b></span></div>
              <div className="wb-perm-row"><span className="wb-perm-k">제목</span><span className="wb-perm-v">{a.mail.subject}</span></div>
            </div>
            <div className="wb-perm-letter">
              {a.mail.body.map((p, i) => <p key={i}><Bold text={p} /></p>)}
              {a.mail.sign && <p className="wb-perm-sign">{a.mail.sign}</p>}
            </div>
          </div>
        )}
        <div className="wb-perm-foot">
          <span className="wb-perm-note">{a.line ?? '승인하기 전에 세부 정보를 검토하세요.'}</span>
          <div className="wb-perm-btns">
            <button type="button" className="wb-perm-b" onClick={onDeny}>취소</button>
            <button type="button" className="wb-perm-b is-go" onClick={onAllow}>
              <span className="wb-perm-bt">{a.go && <i className="wb-perm-bi">{X.mailSend}</i>}{a.go ?? '승인'}</span>
              <i className="wb-perm-bx" aria-hidden="true">{X.caretSm}</i>
            </button>
          </div>
        </div>
      </div>
      {note && <p className="wb-perm-after">{note}</p>}
    </div>
  );
}

export const isSchedule = (a: MsgApprove) => /^(schedule|automation)/.test(a.kind ?? '');

/** 되풀이 작업(예약) 확인 */
export function SchedulePermission({ a, denied, onBook, onDeny, onBack, note }: {
  a: MsgApprove; denied: boolean; onBook: () => void; onDeny: () => void; onBack: () => void; note?: ReactNode;
}) {
  if (denied) {
    return (
      <div className="wb-task is-denied" role="status">
        <div className="wb-task-head"><span className="wb-task-ico" aria-hidden="true">{X.clock}</span><span className="wb-task-title">되풀이 작업 만들기</span></div>
        <div className="wb-task-foot">
          <span className="wb-task-note">{a.denied ?? '자동 실행을 예약하지 않았습니다. 필요할 때 직접 실행할 수 있습니다.'}</span>
          <div className="wb-task-btns"><button type="button" className="wb-task-b" onClick={onBack}>다시 보기</button></div>
        </div>
      </div>
    );
  }
  const rows = a.rows ?? [];
  const get = (label: string) => rows.find(r => r.label === label)?.value;
  const known = new Set(['이름', '반복', '다음에서 실행', '설명', '지금 한 번 실행']);
  const name = get('이름') ?? rows[0]?.value ?? a.what;
  const repeat = get('반복') ?? '';
  const m = repeat.match(/^(.*?)[\s·]*((?:오전|오후)\s*[\d:시]+)/);
  const cadence = m ? m[1] : repeat;
  const time = m ? m[2] : '';
  const where = get('다음에서 실행') ?? '새 대화';
  const desc = get('설명') ?? '메시지 입력...';
  const onceRaw = get('지금 한 번 실행');
  const once = onceRaw == null || onceRaw.includes('체크');
  const extra = rows.filter(r => !known.has(r.label) && r.value !== name);
  return (
    <div className="wb-task-box">
      <div className="wb-task" role="dialog" aria-label="되풀이 작업">
        <div className="wb-task-head"><span className="wb-task-ico" aria-hidden="true">{X.clock}</span><span className="wb-task-title">되풀이 작업을 만드시겠습니까?</span></div>
        <div className="wb-task-rows">
          <div className="wb-task-row"><span className="wb-task-k">이름:</span><span className="wb-task-v is-plain">{name}</span></div>
          <div className="wb-task-row"><span className="wb-task-k">반복:</span><span className="wb-task-v"><i className="wb-task-dd">{cadence}{WE.chevron}</i>{time && <i className="wb-task-dd">{time}{WE.chevron}</i>}</span></div>
          <div className="wb-task-row"><span className="wb-task-k">다음에서 실행:</span><span className="wb-task-v"><i className="wb-task-dd">{where}{WE.chevron}</i></span></div>
          {extra.map((r, i) => <div key={i} className="wb-task-row"><span className="wb-task-k">{r.label}:</span><span className="wb-task-v is-plain">{r.value}</span></div>)}
        </div>
        <div className="wb-task-memo"><span className="wb-task-k">설명</span><p>{desc}</p></div>
        <div className="wb-task-foot">
          <span className="wb-task-once"><i aria-hidden="true">{once ? '✓' : ''}</i>지금 한 번 실행</span>
          <div className="wb-task-btns">
            <button type="button" className="wb-task-b" onClick={onDeny}>취소</button>
            <button type="button" className="wb-task-b is-go" onClick={onBook}><span className="wb-task-bt">예약</span><i className="wb-task-bx" aria-hidden="true">{X.caretSm}</i></button>
          </div>
        </div>
      </div>
      {(a.warn ?? note) && <p className="wb-task-after">{a.warn ?? note}</p>}
    </div>
  );
}
