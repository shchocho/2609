import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message, MsgApprove, MsgChoice, MsgCue, MsgHunt, MsgSpot } from '../types';

/** 메시지가 나타나기 전 대기 시간 (ms) */
export function revealDelay(m: Message): number {
  if (m.role === 'cue' || m.role === 'spot' || m.role === 'approve' || m.role === 'choice' || m.role === 'hunt') return 0;
  if ('delayMs' in m && m.delayMs != null) return m.delayMs;
  if (m.role === 'note') return 400;
  if (m.role === 'tool') return 900;
  if (m.role === 'user') return 700;
  return Math.min(6000, 900 + m.text.length * 42);
}
const AFTER_BACK = 1500;

export interface Engine {
  shown: number;
  total: number;
  playing: boolean;
  done: boolean;
  pending: MsgCue | null;
  ask: string | null;
  spot: MsgSpot | null;
  approve: MsgApprove | null;
  choice: MsgChoice | null;
  hunt: MsgHunt | null;
  busy: boolean;
  play: () => void;
  pause: () => void;
  restart: () => void;
  back: () => void;
  canBack: boolean;
  act: () => void;
}

/**
 * 시나리오 재생기. messages 를 하나씩 공개하며, cue/spot/approve/choice/hunt 를 만나면
 * 사용자가 act() 할 때까지 멈춘다. skip(m) 이 true 인 메시지는 즉시 건너뛴다.
 */
export function useEngine(messages: Message[], skip?: (m: Message) => boolean, autoplay = true): Engine {
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const timer = useRef<number | undefined>(undefined);
  const afterBack = useRef(false);
  const skipRef = useRef(skip);
  skipRef.current = skip;
  const [seen, setSeen] = useState(messages);
  if (seen !== messages) { setSeen(messages); setShown(0); setPlaying(autoplay); }

  const total = messages.length;
  const done = shown >= total;
  const raw = messages[shown];
  const cur = !done && raw && skip?.(raw) ? undefined : raw;
  const pending = !done && cur?.role === 'cue' ? cur : null;
  const spot = !done && cur?.role === 'spot' ? cur : null;
  const approve = !done && cur?.role === 'approve' ? cur : null;
  const choice = !done && cur?.role === 'choice' ? cur : null;
  const hunt = !done && cur?.role === 'hunt' ? cur : null;
  const gate = !!(pending || spot || approve || choice || hunt);
  const busy = !!(playing && !done && !gate && cur?.role === 'assistant' && messages[shown - 1]?.role !== 'tool');
  const next = pending ? messages[shown + 1] : undefined;
  const ask = next?.role === 'user' ? next.text : null;

  useEffect(() => {
    window.clearTimeout(timer.current);
    const wasBack = afterBack.current;
    afterBack.current = false;
    if (!playing || done || gate) return;
    const m = messages[shown];
    if (!m) return;
    const skipped = skipRef.current?.(m);
    timer.current = window.setTimeout(() => setShown(s => s + 1), skipped ? 0 : Math.max(wasBack ? AFTER_BACK : 0, revealDelay(m)));
    return () => window.clearTimeout(timer.current);
  }, [messages, shown, playing, done, gate]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const restart = useCallback(() => { setShown(0); setPlaying(true); }, []);
  const back = useCallback(() => {
    window.clearTimeout(timer.current);
    afterBack.current = true;
    setShown(s => {
      for (let i = s - 1; i >= 0; i--) {
        const m = messages[i];
        if (m && !skipRef.current?.(m)) return i;
      }
      return 0;
    });
    setPlaying(true);
  }, [messages]);
  const act = useCallback(() => {
    setShown(s => (s === shown ? Math.min(shown + 1, total) : s));
    setPlaying(true);
  }, [shown, total]);

  return {
    shown, total, playing: playing && !done && !gate, done, pending, ask, spot, approve, choice, hunt, busy,
    play, pause, restart, back, canBack: shown > 0, act,
  };
}
