import { TRACKS } from '../tracks';
import { countByTrack } from '../data';
import { go, hashTrack } from '../router';
import { TrackIcon } from '../components/Icons';
import { COPY } from '../copy';

const GROUPS = [
  { title: COPY.groupWork, tracks: TRACKS.filter(t => !t.group) },
  { title: COPY.groupProduct, tracks: TRACKS.filter(t => t.group === 'product') },
];

/** 홈(#/start) — 업무 영역 · 제품 기능 체험(트랙) 선택 */
export function Home() {
  const counts = countByTrack();
  return (
    <main className="booth-home" data-brand-theme="copilot">
      <svg className="booth-paint-defs" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="copilot-green" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c9ef6a" />
            <stop offset=".55" stopColor="#8fd14f" />
            <stop offset="1" stopColor="#4dd2a3" />
          </linearGradient>
        </defs>
      </svg>
      <header className="booth-hero booth-home-head">
        <div className="booth-hero-inner booth-home-copy">
          <h1 className="booth-home-title">
            <span className="booth-home-title-line">
              <span className="booth-home-title-product">
                <span className="booth-home-lockup">
                  <img src="logo/copilot/copilot-lockup-horiz.png" alt="Microsoft Copilot" />
                </span>
                <span>{COPY.particle}</span>
              </span>
              <span>함께라면,</span>
            </span>
            <span>{COPY.tagline}</span>
          </h1>
          <p className="booth-hero-about">
            <span>{COPY.homeLead}</span>
            <span>{COPY.homeSub}</span>
          </p>
        </div>
      </header>
      <div className="booth-track-groups">
        {GROUPS.map(g => (
          <section key={g.title} aria-label={g.title}>
            <h2>{g.title}</h2>
            <ul className="booth-track-grid" style={{ '--cols': g.tracks.length } as React.CSSProperties}>
              {g.tracks.map(t => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="booth-track-card"
                    data-track={t.id}
                    disabled={!counts[t.id]}
                    onClick={() => go(hashTrack(t.id))}
                  >
                    <span className="booth-track-inner">
                      <span className="booth-track-icon"><TrackIcon id={t.id} fallback={t.icon} /></span>
                      <div className="booth-track-body">
                        <strong>{t.name}</strong>
                        <p>{t.about}</p>
                      </div>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <footer className="booth-foot">
        <span>{COPY.footerLeft}</span>
        <span className="booth-em">{COPY.footerRight}</span>
      </footer>
    </main>
  );
}
