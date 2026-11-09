import { useEffect, useState } from 'react';
import { go, HASH_ATTRACT, useRoute } from './router';
import { Attract } from './screens/Attract';
import { Home } from './screens/Home';
import { TrackList } from './screens/TrackList';
import { Play } from './play/Play';
import { COPY } from './copy';

const USABLE = '(min-width: 768px) and (min-height: 600px)';
const IDLE_MS = 5 * 60 * 1000;

function useMedia(q: string) {
  const [ok, setOk] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setOk(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return ok;
}

/** 5분 동안 조작이 없으면 대기 화면으로 */
function useIdle(onIdle: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let t = window.setTimeout(onIdle, IDLE_MS);
    const reset = () => { window.clearTimeout(t); t = window.setTimeout(onIdle, IDLE_MS); };
    const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    for (const e of evs) window.addEventListener(e, reset, { passive: true });
    return () => { window.clearTimeout(t); for (const e of evs) window.removeEventListener(e, reset); };
  }, [onIdle, enabled]);
}
const toAttract = () => go(HASH_ATTRACT);

export function App() {
  const route = useRoute();
  const usable = useMedia(USABLE);
  useIdle(toAttract, usable && route.name !== 'attract');
  return (
    <div className="booth-root">
      {!usable && <Attract limited />}
      {usable && route.name === 'attract' && <Attract />}
      {usable && route.name === 'home' && <Home />}
      {usable && route.name === 'scenarios' && <TrackList key={route.track} track={route.track} />}
      {usable && route.name === 'play' && <Play track={route.track} scenario={route.scenario} />}
      {usable && (route.name === 'home' || route.name === 'scenarios') && <p className="booth-disclaimer">{COPY.disclaimer}</p>}
    </div>
  );
}
