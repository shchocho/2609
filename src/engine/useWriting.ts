import { useEffect } from 'react';
import type { PlayState, Scenario } from '../types';
import { passes, writeLength } from './text';

const ROW_MS = 320;

/**
 * 도구 메시지의 효과: 결과물 열기(opens·shows) · 한 줄씩 작성(writes) · 슬라이드 옮기기 시작(translate).
 * Cowork 작업 화면과 Office 화면이 같이 쓴다. s 가 없으면 아무것도 하지 않는다.
 */
export function useWriting(
  s: Scenario | undefined, active: boolean, shown: number, st: PlayState,
  setSt: React.Dispatch<React.SetStateAction<PlayState>>, ids: string[],
) {
  useEffect(() => {
    const m = s?.messages[shown - 1];
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
  }, [shown, s, st.picks.length, st.hunted, setSt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = st.writing;
    if (!active || !id) return;
    const a = s?.workbench?.artifacts[id];
    if (!a) return;
    if (st.rows >= writeLength(a, ids)) { setSt(x => ({ ...x, writing: null })); return; }
    const t = window.setTimeout(() => setSt(x => ({ ...x, rows: x.rows + 1 })), ROW_MS);
    return () => window.clearTimeout(t);
  }, [active, s, st.writing, st.rows, st.picks.length, st.hunted, setSt]); // eslint-disable-line react-hooks/exhaustive-deps
}
