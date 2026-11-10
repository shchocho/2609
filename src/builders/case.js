// case.js — 수납가구(책장·서랍장·옷장·TV장) 공용 엔진.
// 전면을 가로/세로로 나누는 레이아웃 트리를 받아 본체·칸막이·서랍·문·손잡이를 만든다.

import { knob, barHandle, caster } from './util.js';

export const CASE_FLOW = [
  ['carcass', '본체 짜기', '측판 사이에 바닥판·상판·칸막이를 직각으로 세워 붙입니다.', '직각자를 대고, 접착제가 굳을 때까지 마스킹 테이프로 잡아 두세요.'],
  ['back', '뒤판 붙이기', '뒤판을 붙여 본체의 뒤틀림을 잡습니다.', '두 대각선 길이가 같으면 직각입니다.', [0, 0, -1]],
  ['base', '받침 달기', '걸레받이나 다리를 바닥면에 붙입니다.', '네 다리 길이를 한 번에 맞춰 자르면 흔들리지 않습니다.', [0, -1, 0]],
  ['top', '상판 올리기', '상판을 본체 위에 올려 붙입니다.', '앞·옆 돌출 길이가 좌우 같게 맞추세요.', [0, 1, 0]],
  ['shelf', '선반 끼우기', '이동 선반을 원하는 높이에 끼웁니다.', '선반 받침은 1mm 각재 조각이나 시침핀으로 만듭니다.', [0, 0, 1]],
  ['drawer', '서랍 만들기', '서랍 상자를 짠 뒤 앞판을 붙여 칸에 넣습니다.', '상자를 먼저 넣어 보고 앞판 틈을 맞춘 다음 붙이세요.', [0, 0, 1]],
  ['door', '문 달기', '문짝을 맞춰 붙입니다. 여닫게 하려면 핀 경첩을 씁니다.', '문 위아래에 핀을 꽂아 회전축으로 쓰면 실제로 열립니다.', [0, 0, 1]],
  ['hw', '손잡이 달기', '손잡이와 철물을 붙입니다.', '핀바이스로 구멍을 내고 순간접착제를 점 찍듯 바르세요.', [0, 0, 1]],
];

const leafType = (n) => (typeof n === 'string' ? n : n.type);

/** 정면(+Z)을 보는 서랍 하나: 앞판 + 상자. */
export function addDrawer(k, o) {
  const { cx, y0, y1, w, zFront, ft, depth, roleFront = 'front', roleBox = 'drawer' } = o;
  const fh = y1 - y0;
  k.box(o.name || '서랍 앞판', [w, fh, ft], [cx, (y0 + y1) / 2, zFront - ft / 2], { role: roleFront, phase: 'drawer', group: '서랍', ex: [0, 0, 1] });
  if (k.simple || o.dummy) return;
  const st = k.T(10), bt = k.T(3);
  const bw = (o.boxW ?? w - 24), bh = Math.max(20, fh - (o.clearTop ?? 28)), dd = Math.max(40, depth);
  const zf = zFront - ft, yb = y0 + (o.lift ?? 6);
  k.box('서랍 옆판', [st, bh, dd], [cx + bw / 2 - st / 2, yb + bh / 2, zf - dd / 2], { role: roleBox, phase: 'drawer', group: '서랍', mx: false, ex: [0, 0, 1] });
  k.box('서랍 옆판', [st, bh, dd], [cx - bw / 2 + st / 2, yb + bh / 2, zf - dd / 2], { role: roleBox, phase: 'drawer', group: '서랍', ex: [0, 0, 1] });
  k.box('서랍 뒤판', [bw - 2 * st, bh, st], [cx, yb + bh / 2, zf - dd + st / 2], { role: roleBox, phase: 'drawer', group: '서랍', ex: [0, 0, 1] });
  k.box('서랍 바닥', [bw - 2 * st, bt, dd - st], [cx, yb + bt / 2, zf - (dd - st) / 2], { role: 'back', phase: 'drawer', group: '서랍', ex: [0, 0, 1] });
}

export function caseGood(k, s) {
  const { w, d, h } = s;
  const t = k.T(s.t ?? 16), ft = k.T(s.frontT ?? s.t ?? 16), bt = k.T(s.backT ?? 3);
  const gap = s.gap ?? 3;
  const overlay = s.front === 'overlay';
  const base = s.base || { type: 'none' };
  const bh = base.type === 'none' ? 0 : (base.h ?? 60);
  const top = s.top || {};
  const style = top.style || 'over';
  const tt = k.T(top.t ?? s.t ?? 16);
  const [of, os, ob] = top.over || [0, 0, 0];
  const overhang = of > 0 || os > 0;
  const R = { body: 'body', front: 'front', top: 'top', back: 'back', leg: 'leg', knob: 'knob', drawer: 'drawer', ...(s.roles || {}) };
  const cw = w - 2 * os;
  const zF = d / 2 - of, zB = -d / 2 + ob;
  const zC = overlay ? zF - ft - 1.5 : zF;
  const cd = zC - zB, zMid = (zC + zB) / 2;
  const yS0 = base.type === 'sides' ? 0 : bh;
  const yBot = bh, yTopU = h - tt;
  const ySTop = style === 'between' ? h : yTopU;
  const hasBack = s.back !== false;
  const zI0 = zB + (hasBack ? bt + (s.backInset || 0) : 0);
  const hd = s.handle || { type: 'none' };

  // ---- 본체
  k.ph('carcass', '본체');
  k.box('측판', [t, ySTop - yS0, cd], [cw / 2 - t / 2, (ySTop + yS0) / 2, zMid], { role: R.body, mx: true, ex: [1, 0, 0] });
  k.box('바닥판', [cw - 2 * t, t, cd], [0, yBot + t / 2, zMid], { role: R.body, ex: [0, -0.6, 0] });
  if (style === 'between') k.box('상판', [cw - 2 * t, tt, cd], [0, h - tt / 2, zMid], { role: R.body, ex: [0, 1, 0] });
  else k.box('상판', [w, tt, d], [0, h - tt / 2, 0], { role: overhang ? R.top : R.body, ex: [0, 1, 0], phase: overhang ? 'top' : 'carcass' });

  // ---- 레이아웃
  const leaves = [];
  const lay = (node, r) => {
    if (typeof node === 'string') node = { type: node };
    if (node.h) {
      const kids = node.h, n = kids.length, sz = node.sizes || kids.map(() => 1), sum = sz.reduce((a, b) => a + b, 0);
      const total = r.x1 - r.x0 - (node.nodiv ? 0 : n - 1) * t;
      let x = r.x0;
      kids.forEach((kid, i) => {
        const cwid = (total * sz[i]) / sum, mid = node.nodiv ? 'none' : 'div';
        lay(kid, { x0: x, x1: x + cwid, y0: r.y0, y1: r.y1, e: { l: i === 0 ? r.e.l : mid, r: i === n - 1 ? r.e.r : mid, t: r.e.t, b: r.e.b } });
        x += cwid;
        if (i < n - 1 && !node.nodiv) {
          k.box('칸막이', [t, r.y1 - r.y0, zC - zI0], [x + t / 2, (r.y0 + r.y1) / 2, (zC + zI0) / 2], { role: R.body, phase: 'carcass', group: '본체', ex: [0, 0, 0.5] });
          x += t;
        }
      });
    } else if (node.v) {
      const kids = node.v, n = kids.length, sz = node.sizes || kids.map(() => 1), sum = sz.reduce((a, b) => a + b, 0);
      const isDr = (x) => leafType(x) === 'drawer';
      const div = kids.slice(0, -1).map((kid, i) => !(node.nodiv || (isDr(kid) && isDr(kids[i + 1]))));
      const total = r.y1 - r.y0 - div.filter(Boolean).length * t;
      let y = r.y1;
      kids.forEach((kid, i) => {
        const ch = (total * sz[i]) / sum;
        lay(kid, { x0: r.x0, x1: r.x1, y0: y - ch, y1: y, e: { l: r.e.l, r: r.e.r, t: i === 0 ? r.e.t : div[i - 1] ? 'div' : 'none', b: i === n - 1 ? r.e.b : div[i] ? 'div' : 'none' } });
        y -= ch;
        if (i < n - 1 && div[i]) {
          k.box('고정 선반', [r.x1 - r.x0, t, zC - zI0], [(r.x0 + r.x1) / 2, y - t / 2, (zC + zI0) / 2], { role: R.body, phase: 'carcass', group: '본체', ex: [0, 0, 0.5] });
          y -= t;
        }
      });
    } else leaves.push({ node, r });
  };
  lay(s.layout || 'open', { x0: -cw / 2 + t, x1: cw / 2 - t, y0: yBot + t, y1: yTopU, e: { l: 'outer', r: 'outer', t: 'outer', b: 'outer' } });

  // ---- 뒤판
  if (hasBack) {
    k.ph('back', '본체');
    const y0b = yBot + t / 2, y1b = style === 'between' ? h - tt / 2 : yTopU;
    k.box('뒤판', [cw - t, y1b - y0b, bt], [0, (y0b + y1b) / 2, zB + (s.backInset || 0) + bt / 2], { role: R.back, ex: [0, 0, -1] });
  }

  // ---- 받침
  k.ph('base', '받침');
  if (base.type === 'sides') {
    k.box('걸레받이', [cw - 2 * t, bh, t], [0, bh / 2, zC - (base.inset ?? 15) - t / 2], { role: R.body, ex: [0, -0.4, 1] });
  } else if (base.type === 'plinth') {
    const ins = base.inset ?? 20;
    k.box('받침 앞뒤판', [cw - 2 * ins, bh, t], [0, bh / 2, zC - ins - t / 2], { role: R.body, ex: [0, -1, 0] });
    k.box('받침 앞뒤판', [cw - 2 * ins, bh, t], [0, bh / 2, zB + ins + t / 2], { role: R.body, ex: [0, -1, 0] });
    k.box('받침 옆판', [t, bh, cd - 2 * ins - 2 * t], [cw / 2 - ins - t / 2, bh / 2, zMid], { role: R.body, mx: true, ex: [0, -1, 0] });
  } else if (base.type === 'legs') {
    const sec = k.D(base.sec ?? 40), ins = base.inset ?? 0;
    for (const z of [zF - sec / 2 - ins - (overlay ? 0 : 0), zB + sec / 2 + ins]) {
      if (base.shape === 'round' || base.shape === 'taper') {
        k.cyl('다리', base.shape === 'taper' ? sec * 0.32 : sec / 2, bh, [cw / 2 - sec / 2 - ins, bh / 2, z], { r2: sec / 2, role: R.leg, mx: true, ex: [0, -1, 0] });
      } else k.box('다리', [sec, bh, sec], [cw / 2 - sec / 2 - ins, bh / 2, z], { role: R.leg, mx: true, ex: [0, -1, 0] });
    }
  } else if (base.type === 'casters') {
    for (const x of [cw / 2 - 28, -cw / 2 + 28]) for (const z of [zF - 34, zB + 34]) caster(k, x, z, bh);
  } else if (base.type === 'feet') {
    for (const x of [cw / 2 - 30, -cw / 2 + 30]) for (const z of [zF - 40, zB + 40]) k.cyl('발', 14, bh, [x, bh / 2, z], { role: 'metal', ex: [0, -1, 0] });
  }

  // ---- 칸 채우기
  const zFace = overlay ? zF : zC - (s.recess || 0); // 앞판 앞면
  const pull = (x, y, o = {}) => {
    const type = o.type || hd.type;
    if (type === 'knob') knob(k, [x, y, zFace], { r: hd.r, len: hd.len, role: R.knob });
    else if (type === 'bar') barHandle(k, [x, y, zFace], o.len || hd.len || 128, { vertical: o.vertical, role: R.knob });
    else if (type === 'tab') k.box('손잡이', [o.len || hd.len || 70, 12, 14], [x, y, zFace + 7], { role: R.knob, phase: 'hw', group: '철물', ex: [0, 0, 1] });
  };
  for (const { node, r } of leaves) {
    const cwid = r.x1 - r.x0, ch = r.y1 - r.y0, cx = (r.x0 + r.x1) / 2;
    const exp = (kind, tk) => (overlay ? (kind === 'outer' ? tk - 1 : kind === 'div' ? t / 2 : 0) : 0);
    const fx0 = r.x0 - exp(r.e.l, t) + gap / 2, fx1 = r.x1 + exp(r.e.r, t) - gap / 2;
    const fy0 = r.y0 - exp(r.e.b, t) + gap / 2, fy1 = r.y1 + exp(r.e.t, overhang ? 0 : tt) - gap / 2;
    const fw = fx1 - fx0, fh = fy1 - fy0, fcx = (fx0 + fx1) / 2, fcy = (fy0 + fy1) / 2;
    const shelves = (n, role) => {
      const st = k.T(s.shelfT ?? s.t ?? 16);
      for (let i = 1; i <= n; i++) {
        k.box('이동 선반', [cwid - 2, st, zC - zI0 - (node.glassShelf ? 20 : 12)], [cx, r.y0 + (ch * i) / (n + 1), (zC + zI0) / 2 - 4],
          { role: role || (node.glassShelf ? 'glass' : R.body), phase: 'shelf', group: '선반', ex: [0, 0, 1] });
      }
    };
    switch (node.type) {
      case 'open':
        if (node.shelves) shelves(node.shelves);
        break;
      case 'drawer': {
        addDrawer(k, { cx: fcx, y0: fy0, y1: fy1, w: fw, zFront: zFace, ft, depth: zFace - ft - zI0 - 14, boxW: cwid - 8, roleFront: R.front, roleBox: R.drawer, dummy: s.dummyDrawers });
        const n = hd.n || (fw > 520 ? 2 : 1), ky = fcy + (hd.dy ?? 0);
        if (hd.type && hd.type !== 'none') {
          if (n === 1) pull(fcx, ky); else { pull(fcx - fw * 0.27, ky); pull(fcx + fw * 0.27, ky); }
        }
        break;
      }
      case 'door':
      case 'flap': {
        const nl = node.hinge === 'pair' ? 2 : 1, lw = (fw - (nl - 1) * gap) / nl;
        for (let i = 0; i < nl; i++) {
          const lx = fx0 + lw / 2 + i * (lw + gap);
          const hinge = nl === 2 ? (i === 0 ? 'l' : 'r') : node.hinge || 'l';
          if (node.glass) {
            const sw = Math.min(node.frame ?? 55, lw * 0.2);
            k.box('문 세로틀', [sw, fh, ft], [lx - lw / 2 + sw / 2, fcy, zFace - ft / 2], { role: R.front, phase: 'door', group: '문', ex: [0, 0, 1] });
            k.box('문 세로틀', [sw, fh, ft], [lx + lw / 2 - sw / 2, fcy, zFace - ft / 2], { role: R.front, phase: 'door', group: '문', ex: [0, 0, 1] });
            k.box('문 가로틀', [lw - 2 * sw, sw, ft], [lx, fy1 - sw / 2, zFace - ft / 2], { role: R.front, phase: 'door', group: '문', ex: [0, 0, 1] });
            k.box('문 가로틀', [lw - 2 * sw, sw, ft], [lx, fy0 + sw / 2, zFace - ft / 2], { role: R.front, phase: 'door', group: '문', ex: [0, 0, 1] });
            k.box('문 유리', [lw - 2 * sw + 12, fh - 2 * sw + 12, 4], [lx, fcy, zFace - ft / 2], { role: 'glass', phase: 'door', group: '문', ex: [0, 0, 1] });
          } else {
            k.box(node.type === 'flap' ? '플랩 앞판' : '문짝', [lw, fh, ft], [lx, fcy, zFace - ft / 2], { role: R.front, phase: 'door', group: '문', ex: [0, 0, 1] });
            const mir = node.mirror === true || node.mirror === i;
            if (mir) k.box('거울', [lw - 6, fh - 6, 3], [lx, fcy, zFace + 1.5], { role: 'mirror', phase: 'door', group: '문', ex: [0, 0, 1.3] });
          }
          if (hd.type && hd.type !== 'none' && !node.nohandle) {
            if (node.type === 'flap') pull(lx, fy1 - Math.min(60, fh * 0.15));
            else {
              const kx = hinge === 'l' ? lx + lw / 2 - (hd.edge ?? 32) : lx - lw / 2 + (hd.edge ?? 32);
              const ky = node.knobY ?? (fh > 1100 ? Math.min(fy1 - 200, Math.max(fy0 + 200, 1050)) : hd.doorPos === 'top' ? fy1 - 60 : hd.doorPos === 'bottom' ? fy0 + 60 : fcy);
              pull(kx, ky, { vertical: true });
            }
          }
        }
        if (node.shelves) shelves(node.shelves);
        if (node.rail) {
          const sy = r.y1 - Math.min(320, ch * 0.2);
          k.box('고정 선반', [cwid, t, zC - zI0 - 10], [cx, sy, (zC + zI0) / 2], { role: R.body, phase: 'shelf', group: '선반', ex: [0, 0, 1] });
          k.cyl('옷걸이 봉', 11, cwid, [cx, sy - 70, (zC + zI0) / 2], { axis: 'x', role: 'metal', phase: 'shelf', group: '선반', ex: [0, 0, 1] });
        }
        break;
      }
      case 'panel':
        k.box('앞판', [fw, fh, ft], [fcx, fcy, zFace - ft / 2], { role: R.front, phase: 'door', group: '문', ex: [0, 0, 1] });
        break;
      default:
        break;
    }
  }
  if (s.extra) s.extra(k, { t, ft, bt, tt, cw, zF, zB, zC, zI0, yBot, yTopU, bh, R });
  if (!s.noFlow) k.flow(CASE_FLOW);
}

/** 서랍 n개를 세로로 쌓는 레이아웃. */
export const drawers = (n, sizes) => ({ v: Array.from({ length: n }, () => 'drawer'), sizes });
