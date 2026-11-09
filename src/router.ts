import { useEffect, useState } from 'react';
import { TRACK_IDS } from './tracks';

export type Route =
  | { name: 'attract' }
  | { name: 'home' }
  | { name: 'scenarios'; track: string }
  | { name: 'play'; track: string; scenario: string };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'start') return { name: 'home' };
  if (parts[0] !== 't' || !parts[1] || !TRACK_IDS.includes(parts[1])) return { name: 'attract' };
  const track = parts[1];
  return parts[2] ? { name: 'play', track, scenario: parts[2] } : { name: 'scenarios', track };
}

export const HASH_ATTRACT = '#/';
export const HASH_HOME = '#/start';
export const hashTrack = (t: string) => `#/t/${t}`;
export const hashPlay = (t: string, s: string) => `#/t/${t}/${s}`;

export function go(hash: string) {
  if (window.location.hash === hash) return;
  window.location.hash = hash;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
