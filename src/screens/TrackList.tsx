import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowLeftRegular, ChevronLeftRegular, ChevronRightRegular, ColumnTripleRegular, SlideMultipleRegular, ChevronRight20Regular } from '@fluentui/react-icons';
import { trackById } from '../tracks';
import { AGENTS, APP_LOGO, appsOf, madeAppOf, scenariosOf } from '../data';
import { go, HASH_HOME, hashPlay } from '../router';
import { COPY } from '../copy';
import type { Scenario } from '../types';

const PRODUCTS = [
  { id: 'chat', label: 'Chat', description: <>요약·초안·아이디어가 필요할 때, <strong>대화로 빠르게</strong> 해결합니다.</> },
  { id: 'cowork', label: 'Cowork', description: <>목표를 주면 <strong>여러 앱과 파일에 걸친 작업</strong>을 단계별로 실행합니다.</> },
] as const;

interface Entry { id: string; order: number; title: string; badge: string; scenario: Scenario | null }

/** 트랙별 시나리오 목록 — 회전(오빗) 카드 보기 / 제품별 보기 */
export function TrackList({ track }: { track: string }) {
  const t = trackById(track);
  const [expanded, setExpanded] = useState(false);
  const [browsed, setBrowsed] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const transitioning = useRef(false);

  const entries: Entry[] = scenariosOf(track)
    .map(s => ({ id: s.id, order: s.order ?? 99, title: s.title, badge: AGENTS[s.agent].full, scenario: s }))
    .sort((a, b) => a.order - b.order);
  const first = entries.findIndex(e => e.scenario);
  const fanK = Math.round((1 - Math.cos(Math.min(Math.floor(entries.length / 2), 2) * Math.PI / 4)) * 1.4 * 1000) / 1000;
  const [active, setActive] = useState<number | null>(first < 0 ? null : first);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const step = (d: number) => setActive(c => ((c ?? 0) + d + entries.length) % entries.length);

  const toggleView = () => {
    if (transitioning.current) return;
    const apply = () => {
      flushSync(() => { setBrowsed(true); setExpanded(v => !v); });
      toggleRef.current?.focus({ preventScroll: true });
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return; }
    transitioning.current = true;
    const vt = doc.startViewTransition(apply);
    vt.ready.catch(() => {});
    vt.finished.catch(() => {}).finally(() => { transitioning.current = false; });
  };

  return (
    <main className="booth-list" data-track={track} data-expanded={expanded} data-browsed={browsed} data-brand-theme="copilot">
      <style>{entries.map((e, i) => {
        const n = Math.abs(i - (active ?? 0));
        const away = Math.min(n, entries.length - n);
        return `::view-transition-group(scenario-${e.id}) { z-index: ${10 - away}; animation-delay: ${expanded ? Math.min(i * 12, 48) : 0}ms; }`;
      }).join('\n')}</style>
      <header className="booth-hero">
        <img className="booth-hero-art" src="/brand/signiture/copilot-signature.png" alt="" aria-hidden="true" />
        <div className="booth-hero-inner">
          <button type="button" className="booth-back" onClick={() => go(HASH_HOME)}>
            <ArrowLeftRegular aria-hidden="true" />{COPY.backToHome}
          </button>
          <h1>{t?.name}</h1>
          <p className="booth-hero-about">{t?.about}</p>
        </div>
      </header>
      {entries.length > 0 && (
        <div className="booth-view-bar">
          <button ref={toggleRef} type="button" className="booth-view-action" aria-expanded={expanded} onClick={toggleView}>
            {expanded ? <SlideMultipleRegular aria-hidden="true" /> : <ColumnTripleRegular aria-hidden="true" />}
            {expanded ? '하나씩 둘러보기' : '제품별 시나리오 보기'}
          </button>
        </div>
      )}
      {expanded ? (
        <section id="product-view" className="booth-product-guide" aria-label="제품별 체험">
          <div className="booth-product-board">
            {PRODUCTS.map(p => {
              const list = entries.flatMap(e => (e.scenario?.agent === p.id ? [e.scenario] : []));
              return (
                <article key={p.id} data-agent={p.id}>
                  <header>
                    <h2 className="sc-overview-product-name">
                      <span className="sc-overview-copilot-logo"><img src="/logo/copilot/copilot-logo-horiz-gray.png" alt="Copilot" /></span>{' '}
                      <span className="sc-overview-product-suffix">{p.label}</span>
                    </h2>
                  </header>
                  <div className="booth-product-body">
                    <p>{p.description}</p>
                    {list.length > 0 && (
                      <ul>
                        {list.map(s => (
                          <li key={s.id} style={{ viewTransitionName: `scenario-${s.id}` } as React.CSSProperties}>
                            <button type="button" onClick={() => go(hashPlay(track, s.id))}>
                              <span>
                                <strong>{s.title}</strong>
                                <span className="booth-product-outcome">{s.hook || s.summary}</span>
                              </span>
                              <ChevronRight20Regular aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : entries.length === 0 ? (
        <p className="booth-empty">아직 준비된 시나리오가 없습니다.</p>
      ) : active !== null ? (
        <div
          id="scenario-view"
          className="booth-orbit-stage"
          style={{ '--fan-k': fanK } as React.CSSProperties}
          onPointerDown={e => { swipe.current = { x: e.clientX, y: e.clientY }; }}
          onPointerUp={e => {
            const s = swipe.current; swipe.current = null; if (!s) return;
            const dx = e.clientX - s.x, dy = e.clientY - s.y;
            if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
            swiped.current = true; step(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => { swipe.current = null; }}
        >
          <ul className="booth-orbit">
            {entries.map((e, i) => {
              const s = e.scenario;
              const isActive = i === active;
              const half = Math.floor(entries.length / 2);
              let o = i - active; if (o > half) o -= entries.length; if (o < -half) o += entries.length;
              return (
                <li
                  key={e.id}
                  data-product={s ? madeAppOf(s) : undefined}
                  data-active={isActive}
                  data-soon={s ? undefined : true}
                  style={{ '--o': o, viewTransitionName: s ? `scenario-${s.id}` : undefined } as React.CSSProperties}
                >
                  <span className="booth-orbit-stack" data-mark="logo" aria-hidden="true">
                    {(s ? appsOf(s) : []).slice(-3).map(app => (
                      <span key={app} data-product={app}><img src={APP_LOGO[app]} alt="" /></span>
                    ))}
                  </span>
                  <button
                    type="button"
                    className="booth-orbit-frame"
                    aria-current={isActive}
                    onClick={() => {
                      if (swiped.current) { swiped.current = false; return; }
                      if (isActive) { if (s) go(hashPlay(track, s.id)); } else setActive(i);
                    }}
                  >
                    <span className="booth-orbit-inner">
                      <span className="booth-marks"><span className="booth-skill">{e.badge}</span></span>
                      <span className="booth-orbit-text">
                        <strong>{e.title}</strong>
                        {s && (s.before || s.hook) && (
                          <dl className="booth-story booth-orbit-detail">
                            {s.before && <div><dt>AS-IS</dt><dd>{s.before}</dd></div>}
                            {s.hook && <div className="is-hook"><dt>TO-BE</dt><dd>{s.hook}</dd></div>}
                          </dl>
                        )}
                      </span>
                      {s ? <span className="booth-orbit-cta booth-orbit-detail">체험해보기</span>
                         : <span className="booth-orbit-soon booth-orbit-detail">다음 행사에서 공개합니다</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <nav className="booth-orbit-nav" aria-label="체험 탐색">
            <div className="booth-orbit-pager">
              <button type="button" aria-label="이전 시나리오" onClick={() => step(-1)}><ChevronLeftRegular /></button>
              <ol className="booth-orbit-dots">
                {entries.map((e, i) => (
                  <li key={e.id}>
                    <button type="button" aria-label={`${i + 1}번째 · ${e.title}`} aria-current={i === active} onClick={() => setActive(i)} />
                  </li>
                ))}
              </ol>
              <button type="button" aria-label="다음 시나리오" onClick={() => step(1)}><ChevronRightRegular /></button>
            </div>
          </nav>
        </div>
      ) : null}
    </main>
  );
}
