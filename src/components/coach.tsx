/** 코치(안내 말풍선) 레이어 — 대상 영역만 밝게 뚫고 나머지를 어둡게 덮은 뒤 말풍선을 옆에 붙인다. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRightRegular, BranchFork20Regular, Target20Regular } from '@fluentui/react-icons';

const GAP = 18, EDGE = 12, BOTTOM = 88, TAIL_MIN = 30, SIDE_MIN = 240, PAD = 6, RADIUS = 10, CLEAR = 16;
const ALWAYS_LIT = ['[data-coach="lit"]', '.is-hunt'];

interface Rect { left: number; top: number; width: number; height: number }
interface Place { left: number; top: number; side: string; tail: number; max: number; holes: Rect[] }

/** host 좌표계로 변환한 사각형 (부모 zoom/scale 보정) */
function rel(host: Element, el: Element): Rect {
  const h = host.getBoundingClientRect(), r = el.getBoundingClientRect();
  const sx = host.clientWidth > 0 ? h.width / host.clientWidth : 1;
  const sy = host.clientHeight > 0 ? h.height / host.clientHeight : 1;
  return { left: (r.left - h.left) / (sx || 1), top: (r.top - h.top) / (sy || 1), width: r.width / (sx || 1), height: r.height / (sy || 1) };
}
function visibleArea(host: Element, root: Element, el: Element): Rect {
  let box = rel(host, host);
  for (let p = el.parentElement; p; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const r = rel(host, p);
      const l = Math.max(box.left, r.left), t = Math.max(box.top, r.top);
      const rr = Math.min(box.left + box.width, r.left + r.width), b = Math.min(box.top + box.height, r.top + r.height);
      box = { left: l, top: t, width: rr - l, height: b - t };
    }
    if (p === root || p === host) break;
  }
  return box;
}
const intersects = (a: Rect, b: Rect) => b.left + b.width > a.left && b.top + b.height > a.top && b.left < a.left + a.width && b.top < a.top + a.height;
const inside = (a: Rect, b: Rect) => b.left >= a.left && b.top >= a.top && b.left + b.width <= a.left + a.width && b.top + b.height <= a.top + a.height;
const overlap = (a: Rect, b: Rect) => {
  const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
};
const union = (a: Rect, b: Rect): Rect => {
  const l = Math.min(a.left, b.left), t = Math.min(a.top, b.top);
  return { left: l, top: t, width: Math.max(a.left + a.width, b.left + b.width) - l, height: Math.max(a.top + a.height, b.top + b.height) - t };
};
function holesFor(host: Element, root: Element, sels: string[]): Rect[] {
  const out: Rect[] = [];
  for (const sel of sels) {
    for (const el of root.querySelectorAll(sel)) {
      const r = rel(host, el);
      if (r.width === 0 || r.height === 0) continue;
      const v = visibleArea(host, root, el);
      if (!intersects(v, r)) continue;
      const l = Math.max(r.left - PAD, v.left), t = Math.max(r.top - PAD, v.top);
      const rr = Math.min(r.left + r.width + PAD, v.left + v.width), b = Math.min(r.top + r.height + PAD, v.top + v.height);
      if (rr - l > 0 && b - t > 0) out.push({ left: Math.round(l), top: Math.round(t), width: Math.round(rr - l), height: Math.round(b - t) });
    }
  }
  return out;
}
function merge(list: Rect[]): Rect[] {
  const a = [...list];
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      if (overlap(a[i], a[j]) > 0) { a[i] = union(a[i], a[j]); a.splice(j, 1); i = -1; break; }
    }
  }
  return a;
}
function allHoles(host: Element, root: Element, sels: string[]): Rect[] {
  if (!sels.length) return [];
  const main = holesFor(host, root, sels);
  if (!main.length) return [];
  const extra = holesFor(host, root, ALWAYS_LIT).filter(r => !main.some(m => inside(m, r)));
  return merge([...main, ...extra]);
}
function roundRectPath(r: Rect) {
  const k = Math.min(RADIUS, r.width / 2, r.height / 2), { left: x, top: y, width: w, height: h } = r;
  return `M${x + k} ${y}H${x + w - k}A${k} ${k} 0 0 1 ${x + w} ${y + k}V${y + h - k}A${k} ${k} 0 0 1 ${x + w - k} ${y + h}H${x + k}A${k} ${k} 0 0 1 ${x} ${y + h - k}V${y + k}A${k} ${k} 0 0 1 ${x + k} ${y}Z`;
}
const clipFor = (holes: Rect[]) => (holes.length ? `path(evenodd, "M0 0H99999V99999H0Z ${holes.map(roundRectPath).join(' ')}")` : undefined);
const clamp = (v: number, lo: number, hi: number) => Math.round(Math.max(lo, Math.min(v, Math.max(lo, hi))));

function placeOnSide(side: string, box: Rect, tip: Rect, t: Rect) {
  const cx = (v: number) => clamp(v, EDGE, box.width - tip.width - EDGE);
  const cy = (v: number) => clamp(v, EDGE, box.height - tip.height - EDGE);
  if (side === 'top' || side === 'bottom') {
    const left = cx(t.left + t.width / 2 - tip.width / 2);
    return { left, top: cy(side === 'top' ? t.top - tip.height - GAP : t.top + t.height + GAP), tail: clamp(t.left + t.width / 2 - left, TAIL_MIN, tip.width - TAIL_MIN) };
  }
  const tall = t.height > tip.height * 1.8;
  const top = cy(tall ? t.top + 20 : t.top + t.height / 2 - tip.height / 2);
  return { left: cx(side === 'left' ? t.left - tip.width - GAP : t.left + t.width + GAP), top, tail: clamp(tall ? tip.height / 2 : t.top + t.height / 2 - top, TAIL_MIN, tip.height - TAIL_MIN) };
}
function sideRoom(side: string, box: Rect, t: Rect) {
  const v = side === 'right' ? box.width - (t.left + t.width) - GAP - EDGE : side === 'left' ? t.left - GAP - EDGE : 0;
  return v >= SIDE_MIN ? Math.round(v) : 0;
}
function place(box: Rect, tip: Rect, holes: Rect[]): Place {
  const target = holes[0];
  if (!target) {
    return { left: clamp((box.width - tip.width) / 2, EDGE, box.width - tip.width - EDGE), top: clamp(box.height - tip.height - BOTTOM, EDGE, box.height - tip.height - EDGE), side: 'none', tail: 0, max: 0, holes };
  }
  const order = target.width < box.width * 0.55 ? ['right', 'left', 'top', 'bottom'] : ['top', 'bottom', 'right', 'left'];
  let best: (Place & { hid: number }) | null = null;
  for (const side of order) {
    const room = sideRoom(side, box, target);
    const w = room > 0 ? Math.min(tip.width, room) : tip.width;
    const p = placeOnSide(side, box, { ...tip, width: w }, target);
    const hid = holes.reduce((s, h) => s + overlap({ left: p.left, top: p.top, width: w, height: tip.height }, h), 0);
    if (hid === 0) return { ...p, side, max: room, holes };
    if (!best || hid < best.hid) best = { ...p, side, max: room, holes, hid };
  }
  const r = Math.round(Math.max(EDGE, box.width - tip.width - EDGE)), b = Math.round(Math.max(EDGE, box.height - tip.height - EDGE));
  for (const c of [{ left: r, top: b }, { left: EDGE, top: b }, { left: r, top: EDGE }, { left: EDGE, top: EDGE }]) {
    if (holes.every(h => overlap({ ...c, width: tip.width, height: tip.height }, h) === 0)) return { ...c, side: 'none', tail: 0, max: 0, holes };
  }
  const { hid: _h, ...rest } = best!;
  return rest;
}
const samePlace = (a: Place | null, b: Place) =>
  !!a && a.left === b.left && a.top === b.top && a.side === b.side && a.tail === b.tail && a.max === b.max &&
  a.holes.length === b.holes.length && a.holes.every((h, i) => h.left === b.holes[i].left && h.top === b.holes[i].top && h.width === b.holes[i].width && h.height === b.holes[i].height);
function taller(el: Element) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') return el.getBoundingClientRect().height > p.clientHeight;
  }
  return false;
}
function offscreen(host: Element, el: Element) {
  const h = rel(host, host), r = rel(host, el);
  if (r.width === 0 || r.height === 0) return false;
  return r.top < h.top || r.left < h.left || r.top + r.height > h.top + h.height || r.left + r.width > h.left + h.width;
}

/** 말풍선 레이어 (작업 창 위를 덮음) */
export function TipLayer({ children }: { children: ReactNode }) {
  return <div className="wb-tip-layer">{children}</div>;
}

/** zone(CSS 선택자) 근처에 말풍선을 붙이고, dim 이면 나머지를 어둡게 덮는다 */
export function Tip({ zone, dim = true, children }: { zone?: string | string[] | null; dim?: boolean; children: ReactNode }) {
  const tipRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Place | null>(null);
  const last = useRef<Place | null>(null);
  const scrolled = useRef<Element | null>(null);
  const key = Array.isArray(zone) ? zone.join(',') : zone ?? '';

  useLayoutEffect(() => {
    const tip = tipRef.current, layer = tip?.parentElement, root = layer?.parentElement;
    if (!tip || !layer || !root) return;
    const sels = key ? key.split(',') : [];
    let raf = 0;
    const ensureVisible = () => {
      const el = sels[0] ? root.querySelector(sels[0]) : null;
      if (!el) return;
      if (!offscreen(layer, el)) { scrolled.current = null; return; }
      if (scrolled.current !== el) { scrolled.current = el; el.scrollIntoView({ block: taller(el) ? 'start' : 'center', inline: 'nearest' }); }
    };
    const measure = () => {
      raf = 0;
      ensureVisible();
      const next = place(rel(layer, layer), rel(layer, tip), allHoles(layer, root, sels));
      const clear = !dim && !key ? `${Math.round(tip.offsetHeight + CLEAR)}px` : '';
      if (root.style.getPropertyValue('--wb-tip-clear') !== clear) root.style.setProperty('--wb-tip-clear', clear);
      if (!samePlace(last.current, next)) { last.current = next; setPos(next); }
    };
    const schedule = () => { if (!raf) raf = window.requestAnimationFrame(measure); };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(layer); ro.observe(tip);
    const mo = new MutationObserver(schedule);
    mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    root.addEventListener('scroll', schedule, true);
    return () => {
      window.cancelAnimationFrame(raf);
      scrolled.current = null;
      root.style.removeProperty('--wb-tip-clear');
      ro.disconnect(); mo.disconnect();
      root.removeEventListener('scroll', schedule, true);
    };
  }, [key, dim]);

  useEffect(() => {
    const v = veilRef.current;
    if (!v) return;
    const stop = (e: WheelEvent) => e.preventDefault();
    v.addEventListener('wheel', stop, { passive: false });
    return () => v.removeEventListener('wheel', stop);
  }, [pos, dim]);

  return (
    <>
      {pos && dim && (pos.holes.length > 0 || !key) && (
        <div ref={veilRef} className="wb-tip-veil" style={{ clipPath: clipFor(pos.holes) }} aria-hidden="true" />
      )}
      <div
        ref={tipRef}
        className={`wb-tip is-${pos?.side ?? 'none'}`}
        style={{
          left: pos ? `${pos.left}px` : '0', top: pos ? `${pos.top}px` : '0', visibility: pos ? 'visible' : 'hidden',
          '--tail': `${pos?.tail ?? 0}px`, ...(pos?.max ? { '--wb-tip-max': `${pos.max}px` } : {}),
        } as React.CSSProperties}
      >
        {children}
      </div>
    </>
  );
}

const KIND = {
  choice: { say: '선택한 기준에 따라 결과물이 달라집니다', icon: <BranchFork20Regular fontSize={15} /> },
  quiz: { say: 'Quiz', icon: <Target20Regular fontSize={15} /> },
};

/** 말풍선 본문 */
export function Bubble({ kind, q, children }: { kind?: 'choice' | 'quiz'; q: string; children?: ReactNode }) {
  const k = kind ? KIND[kind] : null;
  return (
    <div className={`wb-pick${kind ? ` is-${kind}` : ''}`}>
      <span className="wb-pick-tail" aria-hidden="true" />
      {k && <p className="wb-pick-kind"><i aria-hidden="true">{k.icon}</i>{k.say}</p>}
      <p className="wb-pick-q">{q}</p>
      {children}
    </div>
  );
}

export function Options({ options, onPick }: { options: { id: string; label: string; desc?: string; meta?: string }[]; onPick: (o: (typeof options)[number]) => void }) {
  return (
    <ul className="wb-opts">
      {options.map((o, i) => (
        <li key={o.id}>
          <button type="button" onClick={() => onPick(o)}>
            <span className="wb-opt-n">{i + 1}</span>
            <span className="wb-opt-t"><b>{o.label}</b><em>{o.desc}{o.meta ? ` (${o.meta})` : ''}</em></span>
            <ArrowRightRegular aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export const Hint = ({ children }: { children: ReactNode }) => <p className="wb-hunt-hint">{children}</p>;
export const Key = ({ children }: { children: ReactNode }) => <b className="cp-key" aria-hidden="true">{children}</b>;
export const Solved = ({ children }: { children: ReactNode }) => <p className="wb-hunt-done">✓ {children}</p>;
export function CueButton({ onClick, next, children }: { onClick: () => void; next?: boolean; children: ReactNode }) {
  return (
    <button type="button" className="sc-cue-btn" onClick={onClick}>
      {children}{next && <ArrowRightRegular aria-hidden="true" />}
    </button>
  );
}

/** 화면 영역 찾기 퀴즈 보기 */
export function SpotOptions({ options, answer, holdMs, onPick, onPass }: {
  options: { at: string; label: string }[]; answer: number; holdMs: number; onPick: (at: string) => void; onPass: () => void;
}) {
  const [wrong, setWrong] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);
  useEffect(() => {
    if (!passed) return;
    const t = window.setTimeout(onPass, holdMs);
    return () => window.clearTimeout(t);
  }, [passed, holdMs, onPass]);
  const choose = (i: number) => {
    if (passed) return;
    if (i !== answer) { setWrong(null); window.requestAnimationFrame(() => setWrong(i)); return; }
    setPassed(true);
    const o = options[answer];
    if (o) onPick(o.at);
  };
  return (
    <>
      <ul className="wb-opts">
        {options.map((o, i) => (
          <li key={i}>
            <button type="button" className={`${passed && i === answer ? 'is-right' : ''}${wrong === i ? ' is-wrong' : ''}`} disabled={passed} onClick={() => choose(i)}>
              <span className="wb-opt-n">{i + 1}</span>
              <span className="wb-opt-t"><b>{o.label}</b></span>
              <ArrowRightRegular aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {wrong !== null && !passed && <Hint>다시 찾아 보세요.</Hint>}
    </>
  );
}
