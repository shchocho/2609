import { useEffect, useState } from 'react';
import { go, HASH_HOME } from '../router';
import { COPY } from '../copy';
import { DRAFT } from '../look';
import { DraftHero } from './DraftArt';

const HERO = {
  landscape: 'brand/hero/copilot-hero-light-16x9.png',
  motion: 'brand/hero/copilot-hero-motion-light-16x9.mp4',
};

function usePortrait() {
  const [p, setP] = useState(() => window.matchMedia('(orientation: portrait)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const on = () => setP(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return p;
}

/** 대기(어트랙트) 화면 — 화면 아무 곳이나 누르면 홈으로 */
export function Attract({ limited = false }: { limited?: boolean }) {
  usePortrait();
  return (
    <main
      className={`booth-attract${limited ? ' is-limited' : ''}`}
      data-brand-theme="m365-combined"
      onClick={limited ? undefined : () => go(HASH_HOME)}
    >
      {DRAFT ? (
        <DraftHero />
      ) : limited ? (
        <img className="booth-attract-art" src={HERO.landscape} alt="" />
      ) : (
        <video
          key={HERO.motion}
          className="booth-attract-art"
          src={HERO.motion}
          poster={HERO.landscape}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      )}
      {limited ? (
        <div className="booth-attract-say">
          <img className="booth-limited-logo" src="logo/copilot/copilot-horiz-black.png" alt="Copilot" />
          <h1>더 큰 화면에서<br />접속해 주세요</h1>
          <p>PC나 태블릿에서 체험해 주세요.<br />창을 작게 열었다면 크기를 늘려 주세요.</p>
        </div>
      ) : (
        <div className="booth-attract-say">
          <h1>
            <span className="booth-lockup-hold">
              <img className="booth-lockup" src="logo/copilot/copilot-horiz-black.png" alt="Copilot" />
              {COPY.particle}
            </span>{' '}
            함께라면, <span>{COPY.tagline}</span>
          </h1>
          <button type="button" className="booth-cta">체험해보기</button>
        </div>
      )}
    </main>
  );
}
