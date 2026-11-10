/** 작업 결과물 뷰어: Excel 시트 · Word 문서 · Outlook 메일 · PowerPoint 덱 · Teams 게시물 */
import { useState, type ReactNode } from 'react';
import type { Artifact, Deck, DocBlock, Sheet, Vars } from '../types';
import { Blanks, Bold, filterBy, fill, artifactName } from '../engine/text';
import { AppIcon, FT, WE, X } from './ui';

export interface ViewProps {
  a: Artifact;
  writing: number | null;
  vars: Vars;
  ids: string[];
  slide?: number;
  moved?: number;
  over?: boolean;
  progressive?: boolean;
  onSlide?: (n: number) => void;
}

const colName = (i: number) => {
  let s = '';
  for (let n = i; n >= 0; n = Math.floor(n / 26) - 1) s = String.fromCharCode(65 + (n % 26)) + s;
  return s;
};

/* ---------------- Excel ---------------- */
function SheetView({ sheet, writing, vars, ids }: { sheet: Sheet; writing: number | null; vars: Vars; ids: string[] }) {
  const tabs = [
    ...(sheet.tabs ?? []),
    ...Object.entries(sheet.tabsAdd ?? {}).filter(([id]) => ids.includes(id)).map(([, name]) => name),
  ];
  const [tabState, setTab] = useState(0);
  const at = writing != null ? 0 : Math.min(tabState, Math.max(0, tabs.length - 1));
  const page = at === 0 ? undefined : sheet.pages?.[tabs[at]];
  const rows = filterBy((page ?? sheet).rows, ids);
  const shown = writing == null ? rows.length : Math.min(writing, rows.length);
  const addKey = page ? undefined : Object.keys(sheet.headAdd ?? {}).find(k => ids.includes(k));
  const heads = [...(page?.head ?? sheet.head), ...(addKey ? sheet.headAdd?.[addKey] ?? [] : [])];
  const nums = new Set(page?.num ?? sheet.num ?? []);
  const chart = writing == null && !page ? filterBy(sheet.charts ?? [], ids)[0] : undefined;
  const top = Math.max(1, ...(chart?.bars ?? []).map(b => b.value));
  return (
    <div className="wb-xl">
      {writing != null && (
        <p className="wb-xl-fx"><span className="wb-xl-ref is-live">A{shown + 1}</span><span className="wb-xl-f">fx</span></p>
      )}
      <div className="wb-xl-wrap">
        <table className="wb-xl-grid">
          <thead><tr><th />{heads.map((_h, i) => <th key={i}>{colName(i)}</th>)}</tr></thead>
          <tbody>
            <tr className="wb-xl-head"><th>1</th>{heads.map((h, i) => <td key={i}>{h}</td>)}</tr>
            {rows.slice(0, shown).map((r, y) => {
              const cells = [...r.cells, ...(addKey ? r.add?.[addKey] ?? [''] : [])];
              const cls = [r.tone ? `is-${r.tone}` : '', writing != null && y === shown - 1 ? 'is-now' : ''].filter(Boolean).join(' ');
              return (
                <tr key={y} className={cls || undefined}>
                  <th>{y + 2}</th>
                  {cells.map((c, x) => <td key={x} className={nums.has(x) ? 'num' : undefined}><Bold text={fill(c, vars)} /></td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
        {chart && (
          <figure className="wb-xl-chart">
            <figcaption>{chart.title}</figcaption>
            {chart.bars.map(b => (
              <p key={b.label} className={b.warn ? 'is-warn' : undefined}>
                <span>{b.label}</span><i style={{ width: `${(b.value / top) * 100}%` }} /><b>{b.value.toFixed(chart.digits ?? 0)}{chart.unit}</b>
              </p>
            ))}
          </figure>
        )}
      </div>
      {tabs.length > 0 && (
        <p className="wb-xl-tabs">
          {tabs.map((t, i) => (i === 0 || sheet.pages?.[t])
            ? <button key={t} type="button" className={i === at ? 'on' : ''} onClick={() => setTab(i)}>{t}</button>
            : <i key={t} className={i === at ? 'on' : ''}>{t}</i>)}
        </p>
      )}
    </div>
  );
}

/* ---------------- 문서 블록 ---------------- */
export function DocBlockView({ b, vars, ids }: { b: DocBlock; vars: Vars; ids: string[] }) {
  const o = (t?: string) => fill(t ?? '', vars);
  switch (b.kind) {
    case 'field': return <p className="wb-ol-f"><u>{b.label}</u><b>{o(b.value)}</b></p>;
    case 'subject': return <p className="wb-ol-f"><u>제목</u><b className="wb-ol-subj">{o(b.text)}</b></p>;
    case 'para': return <p className="wb-ol-p"><Bold text={o(b.text)} /></p>;
    case 'badge': return <p className="wb-ol-due">🕑 {o(b.text)}</p>;
    case 'sign': return <p className="wb-ol-sign">{(b.lines ?? []).map((l, i) => <span key={i}>{l}</span>)}</p>;
    case 'list':
      return (
        <div className={`wb-ol-req${b.ordered ? ' is-num' : ''}`}>
          {b.title && <b>{b.title}</b>}
          <ol>{(b.items ?? []).map((it, i) => <li key={i}><Bold text={o(it)} /></li>)}</ol>
        </div>
      );
    case 'head':
      return (
        <>
          <h3 className="wb-wd-h1">{o(b.text)}</h3>
          {b.meta && <p className="wb-wd-meta">{b.meta.map((m, i) => <span key={i}>{o(m)}</span>)}</p>}
        </>
      );
    case 'section':
      return (
        <section className="wb-wd-sec">
          <h4>{o(b.title)}</h4>
          {b.text && <p><Bold text={o(b.text)} /></p>}
          {b.items && <ul>{b.items.map((it, i) => <li key={i}><Bold text={o(it)} /></li>)}</ul>}
          {b.stats && (
            <p className="wb-wd-mini">
              {b.stats.map((s, i) => <span key={i}><u>{s.label}</u><b className={s.warn ? 'is-warn' : ''}>{o(s.value)}</b></span>)}
            </p>
          )}
          {b.table && (
            <table className="wb-wd-tbl">
              <thead><tr>{b.table.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
              <tbody>{b.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{o(c)}</td>)}</tr>)}</tbody>
            </table>
          )}
          {b.note && <em className="wb-ct-n">{o(b.note)}</em>}
        </section>
      );
    case 'clause': {
      const sel = Object.keys(b.textBy ?? {}).find(k => ids.includes(k));
      const body = b.text ?? (sel ? b.textBy?.[sel] : undefined);
      const open = !body;
      return (
        <section className={`wb-ct${open ? ' is-open' : ''}`}>
          <p className="wb-ct-h">
            <b>{b.no}</b><span>{b.title}</span>
            {b.src && <i className={b.src === '미합의' ? 'is-warn' : b.src === '표준' ? '' : 'is-src'}>{b.src}</i>}
          </p>
          <p>{body ? <Bold text={o(body)} /> : <Blanks text={o(b.tpl)} />}</p>
          {open && <em className="wb-ct-n">[협의 필요] 합의 전이라 채우지 않았습니다.</em>}
          {b.note && <em className="wb-ct-n">{o(b.note)}</em>}
        </section>
      );
    }
    case 'qa': return <section className="wb-ct"><p className="wb-ct-h"><b>Q</b><span>{o(b.q)}</span></p><p><Bold text={o(b.a)} /></p></section>;
    case 'note': return <p className="wb-ct-note"><Bold text={o(b.text)} /></p>;
    default: return null;
  }
}

function DocView({ a, writing, vars, ids }: ViewProps) {
  const blocks = filterBy(a.blocks ?? [], ids);
  const shown = writing == null ? blocks.length : Math.min(writing, blocks.length);
  return (
    <div className="wb-wd">
      <div className="wb-wd-page">
        {blocks.slice(0, shown).map((b, i) => (
          <div key={i} className={writing != null && i === shown - 1 ? 'wb-new is-now' : undefined}>
            <DocBlockView b={b} vars={vars} ids={ids} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Outlook ---------------- */
function MailView({ a, writing, vars, ids }: ViewProps) {
  const blocks = filterBy(a.blocks ?? [], ids);
  const shown = writing == null ? blocks.length : Math.min(writing, blocks.length);
  const vis = blocks.slice(0, shown);
  const fields = vis.filter(b => b.kind === 'field');
  const subject = vis.find(b => b.kind === 'subject');
  const body = vis.filter(b => b.kind !== 'field' && b.kind !== 'subject');
  const isRead = a.origin === 'read';
  const isSent = a.where.includes('보낸');
  return (
    <div className="wb-ol">
      <p className="wb-ol-bar">
        {isRead ? (
          <>
            <span className="wb-ol-act">{FT.reply}답장</span>
            <span className="wb-ol-act">{FT.reply}모두 답장</span>
            <span className="wb-ol-act">{FT.forward}전달</span>
          </>
        ) : (
          <>
            <span className="wb-ol-send">{FT.send}보내기</span>
            <span className="wb-ol-split" aria-hidden="true">{FT.caret}</span>
          </>
        )}
        <span className="wb-ol-grow" />
        <span className="wb-ol-ico is-shield" aria-hidden="true">{FT.shield}{FT.caret}</span>
        <span className="wb-ol-ico" aria-hidden="true">{FT.trash}</span>
        <span className="wb-ol-ico" aria-hidden="true">{FT.popout}</span>
      </p>
      <div className="wb-ol-fields">
        {fields.map((b, i) => <DocBlockView key={i} b={b} vars={vars} ids={ids} />)}
        <p className="wb-ol-subjrow">
          <span className="wb-ol-subj">{subject ? <Bold text={fill(subject.text ?? '', vars)} /> : '제목 추가'}</span>
          {!isRead && <em>{isSent ? '보냄' : '초안 저장됨'}</em>}
        </p>
      </div>
      <div className="wb-ol-body">
        {body.map((b, i) => (
          <div key={i} className={writing != null && i === body.length - 1 ? 'wb-new is-now' : undefined}>
            <DocBlockView b={b} vars={vars} ids={ids} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Cowork 오른쪽 패널에서 여는 메일 창 */
export function CoworkMail({ a, writing, vars, ids, onClose }: ViewProps & { onClose: () => void }) {
  const blocks = filterBy(a.blocks ?? [], ids);
  const shown = writing == null ? blocks.length : Math.min(writing, blocks.length);
  const vis = blocks.slice(0, shown);
  const subject = vis.find(b => b.kind === 'subject');
  const body = vis.filter(b => b.kind !== 'field' && b.kind !== 'subject');
  return (
    <section className="desk-win is-doc is-cwmail" data-app="outlook">
      <header className="cwm-bar">
        <span className="cwm-mark" aria-hidden="true"><AppIcon app="outlook" /></span>
        <b className="cwm-subj">{subject ? <Bold text={fill(subject.text ?? '', vars)} /> : a.name}</b>
        <span className="cwm-react" aria-hidden="true">{X.thumbUp}{X.thumbDown}</span>
        <span className="cwm-grow" />
        <span className="cwm-open">{X.open}Outlook에서 열기</span>
        <button type="button" className="cwm-x" aria-label="닫기" onClick={onClose}>{WE.close}</button>
      </header>
      <div className="cwm-body">
        <article className="cwm-letter">
          {body.map((b, i) => (
            <div key={i} className={writing != null && i === body.length - 1 ? 'wb-new is-now' : undefined}>
              <DocBlockView b={b} vars={vars} ids={ids} />
            </div>
          ))}
          <p className="cwm-sent">Sent by <span>Copilot Cowork</span></p>
        </article>
      </div>
    </section>
  );
}

/* ---------------- PowerPoint ---------------- */
function slideOf(deck: Deck, n: number, moved: number, ids: string[], vars: Vars, progressive: boolean) {
  const s = deck.slides.find(x => x.n === n);
  if (!s) return { head: deck.rest?.[n - deck.slides.length - 1] ?? '', done: false } as { head: string; sub?: string; body?: string[]; done: boolean };
  const done = !deck.src && (!progressive || moved >= s.n);
  const key = Object.keys(s.by ?? {}).find(k => ids.includes(k));
  const v = done && key ? s.by?.[key] : undefined;
  const sub = v?.sub ?? s.sub;
  return {
    head: fill(v?.head ?? s.head, vars),
    sub: sub == null ? undefined : fill(sub, vars),
    body: (v?.body ?? s.body)?.map(b => fill(b, vars)),
    done,
  };
}

function DeckView({ a, vars, ids, slide = 1, moved = 0, over = false, progressive = false, onSlide }: ViewProps) {
  const deck = a.deck;
  if (!deck) return null;
  const total = deck.total ?? deck.slides.length;
  const cur = slideOf(deck, slide, moved, ids, vars, progressive);
  const raw = deck.slides.find(s => s.n === slide);
  const isOver = !!(raw?.over && cur.done && over);
  return (
    <div className="wb-pp">
      <div className="wb-pp-thumbs">
        {Array.from({ length: total }, (_x, i) => i + 1).map(n => {
          const t = slideOf(deck, n, moved, ids, vars, progressive);
          const r = deck.slides.find(s => s.n === n);
          const o = !!(r?.over && t.done && over);
          return (
            <button key={n} type="button" className={`wb-pp-th${slide === n ? ' on' : ''}${t.done ? ' is-done' : ''}${o ? ' is-over' : ''}`} onClick={() => onSlide?.(n)}>
              <u>{n}</u><em><s>{t.head}</s><q /><q /></em>
            </button>
          );
        })}
      </div>
      <div className="wb-pp-stage">
        <div className={`wb-pp-slide${raw?.table ? ' has-table' : ''}`}>
          <span className="wb-pp-accent" />
          <b>{cur.head}</b>
          {cur.sub && <i>{cur.sub}</i>}
          {raw?.table && (
            <table className="wb-pp-table" aria-label={cur.head}>
              <thead><tr>{raw.table.head.map((h, i) => <th key={i} scope="col">{fill(h, vars)}</th>)}</tr></thead>
              <tbody>{raw.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{fill(c, vars)}</td>)}</tr>)}</tbody>
            </table>
          )}
          {cur.body && <ul>{cur.body.map((b, i) => <li key={i}>{b}</li>)}</ul>}
          <span className="wb-pp-no">{slide} / {total}</span>
          {isOver && <span className="wb-pp-over">⚠ 글상자를 넘침 · 확인 필요</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Teams ---------------- */
function TeamsView({ a, writing }: ViewProps) {
  const t = a.teams;
  if (!t) return null;
  const o = writing ?? t.body.length + 2;
  return (
    <div className="wb-tm">
      <p className="wb-tm-head"><b>{t.channel}</b><span>{t.team}</span></p>
      <div className="wb-tm-body">
        <div className="wb-tm-msg">
          <span className="wb-tm-av" aria-hidden="true">C</span>
          <div>
            <p className="wb-tm-mh"><b>{t.author}</b><time>{t.at}</time><i>초안 · 전송 전</i></p>
            {o > 0 && <p className="wb-tm-t">{t.title}</p>}
            {t.body.slice(0, Math.max(0, o - 1)).map((p, i) => <p key={i}><Bold text={p} /></p>)}
            {o > t.body.length + 1 && t.foot && <p className="wb-tm-foot">{t.foot}</p>}
            {o > t.body.length + 1 && t.reactions && <p className="wb-tm-re">{t.reactions.map((r, i) => <span key={i}>{r}</span>)}</p>}
          </div>
        </div>
      </div>
      <p className="wb-tm-comp"><span>메시지를 입력하세요</span><span className="wb-tm-send">전송</span></p>
    </div>
  );
}

/** 결과물 종류별 뷰어 선택 */
export function ArtifactView(p: ViewProps) {
  const { a } = p;
  if (a.kind === 'sheet' && a.sheet) return <SheetView key={a.name} sheet={a.sheet} writing={p.writing} vars={p.vars} ids={p.ids} />;
  if (a.kind === 'deck' && a.deck?.slides.some(s => s.only || s.not)) {
    return <DeckView {...p} a={{ ...a, deck: { ...a.deck, slides: filterBy(a.deck.slides, p.ids).map((s, i) => ({ ...s, n: i + 1 })) } }} />;
  }
  if (a.kind === 'deck') return <DeckView {...p} />;
  if (a.kind === 'teams') return <TeamsView {...p} />;
  if (a.kind === 'mail') return <MailView {...p} />;
  return <DocView {...p} />;
}

/* ---------------- 결과 화면 문서 창 ---------------- */
export function DocTabs({ tabs, onPick }: { tabs: { id: string; name: string; mark: ReactNode; on: boolean }[]; onPick: (id: string) => void }) {
  return (
    <nav className="doc-tabs">
      {tabs.map(t => (
        <button key={t.id} type="button" className={t.on ? 'on' : ''} onClick={() => onPick(t.id)}>
          {t.mark}<span>{t.name}</span>
        </button>
      ))}
    </nav>
  );
}

export function DocWindow({ app, mark, name, badge, note, tabs, children }: {
  app: string; mark?: ReactNode; name?: string; badge?: string; note?: string; tabs?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="desk-win is-doc" data-app={app}>
      {tabs}
      {name && (
        <header className="doc-bar">
          {mark}<b>{name}</b>
          {badge && <span className="doc-from is-made">{badge}</span>}
          <span className="doc-grow" />
        </header>
      )}
      <div className="doc-body">{children}</div>
      {note && <p className="doc-live" role="status"><span><Bold text={note} /></span></p>}
    </section>
  );
}

export { artifactName };
