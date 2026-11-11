// kit.js — 부품 DSL. 빌더는 실물 mm로 부품을 선언하고,
// 여기서 재료 분류·조립 단계·분해 방향·경계 상자를 계산해 "모델"을 만든다.
// 모델 하나가 3D·도면·재단표·내보내기의 단일 소스다.

import { snapSheet, snapRod } from './scale.js';
import { orientedMesh, bboxOf, pathLength, V, polyCCW } from './geom.js';

const SOFT = new Set(['fabric', 'cushion', 'mattress', 'pillow', 'seat']);
const D2R = Math.PI / 180;

const rotY = (p, deg) => {
  if (!deg) return p;
  const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

function mirror(p, axis) {
  const q = { ...p, pos: [...p.pos], rot: [...p.rot], flip: [...p.flip] };
  if (axis === 0) { q.pos[0] = -q.pos[0]; q.rot[1] = -q.rot[1]; q.rot[2] = -q.rot[2]; q.flip[0] = -q.flip[0]; }
  else { q.pos[2] = -q.pos[2]; q.rot[0] = -q.rot[0]; q.rot[1] = -q.rot[1]; q.flip[2] = -q.flip[2]; }
  q.yaw = -(q.yaw || 0);
  if (q.ex) { q.ex = [...q.ex]; q.ex[axis] = -q.ex[axis]; }
  q.twin = true;
  return q;
}

export class Kit {
  constructor(env = {}) {
    this.N = env.N || 12;
    this.fit = !!env.fit;
    this.simple = env.detail === 'simple';
    this.parts = [];
    this._phase = 'body';
    this._group = '본체';
    this._frames = [];
    this._flow = [];
    this._n = 0;
  }

  /** 판재 두께(실물 mm). '재료 맞춤'이 켜져 있으면 시판 두께에 맞춘 실물 환산값을 돌려준다. */
  T(mm) { return this.fit ? snapSheet(mm / this.N) * this.N : mm; }
  /** 환봉·각재 굵기. */
  D(mm) { return this.fit ? snapRod(mm / this.N) * this.N : mm; }

  /** 이후 추가되는 부품의 조립 단계(phase)와 그룹. */
  ph(phase, group) { this._phase = phase; if (group) this._group = group; return this; }

  /** 조립 순서 정의: [[phase, 제목, 설명, 팁, 분해방향], …] */
  flow(list) { this._flow = list; return this; }

  /** 원점 이동 + Y축 회전 프레임 안에서 부품을 추가한다. */
  at(origin, yaw, fn, lock) {
    this._frames.push({ origin, yaw: yaw || 0, lock: lock || null });
    fn();
    this._frames.pop();
    return this;
  }

  _push(name, kind, geo, pos, o = {}) {
    const base = {
      id: '', name, kind, ...geo,
      pos: [...pos], rot: o.rot ? [...o.rot] : [0, 0, 0], flip: [1, 1, 1], yaw: 0,
      role: o.role || 'body', group: o.group || this._group, phase: o.phase || this._phase,
      ex: o.ex || null, opt: !!o.opt,
    };
    if (o.bevel !== undefined) base.bevel = o.bevel;
    if (o.grain) base.grain = o.grain;
    if (o.stock) base.stockHint = o.stock;
    if (o.note) base.note = o.note;
    if (o.glow) base.glow = o.glow;
    if (o.inner) base.inner = true;
    if (o.mat) base.mat = o.mat; // 소품: 마감표를 거치지 않고 재질 키를 직접 지정
    if (o.lo) base.lo = true; // 소품: 멀리서 보는 저분할 메시에서 분할 수를 더 줄인다
    let list = [base];
    if (o.mx) list = list.concat(list.map((p) => mirror(p, 0)));
    if (o.mz) list = list.concat(list.map((p) => mirror(p, 2)));
    for (const p of list) {
      for (let i = this._frames.length - 1; i >= 0; i--) {
        const fr = this._frames[i];
        if (fr.lock) { p.phase = fr.lock.phase; if (fr.lock.group) p.group = fr.lock.group; }
        p.pos = V.add(rotY(p.pos, fr.yaw), fr.origin);
        p.yaw = (p.yaw || 0) + fr.yaw;
        if (p.ex) p.ex = rotY(p.ex, fr.yaw);
      }
      p.id = `p${++this._n}`;
      this.parts.push(p);
    }
    return list;
  }

  box(name, size, pos, o) { return this._push(name, 'box', { size: [...size] }, pos, o); }
  rbox(name, size, pos, r, o = {}) { return this._push(name, 'rbox', { size: [...size], r, crown: o.crown || null }, pos, o); }
  cyl(name, r, len, pos, o = {}) { return this._push(name, 'cyl', { r, r2: o.r2 ?? r, len, axis: o.axis || 'y' }, pos, o); }
  sph(name, r, pos, o = {}) { return this._push(name, 'sph', { r, sy: o.sy ?? 1 }, pos, o); }
  lathe(name, profile, pos, o = {}) { return this._push(name, 'lathe', { profile, closed: !!o.closed }, pos, o); }
  ext(name, pts, t, plane, pos, o = {}) { return this._push(name, 'ext', { pts: polyCCW(pts), t, plane, wall: o.wall || 0 }, pos, o); }
  tube(name, path, r, o = {}) { return this._push(name, 'tube', { path, r, corner: o.corner || 0, closed: !!o.closed }, o.pos || [0, 0, 0], o); }

  finalize(item, variant) {
    const parts = this.parts;
    // 1) 조립 단계
    const used = new Set(parts.map((p) => p.phase));
    const steps = [];
    const phaseStep = new Map();
    for (const f of this._flow) {
      if (!used.has(f[0])) continue;
      steps.push({ n: steps.length + 1, phase: f[0], title: f[1], desc: f[2] || '', tip: f[3] || '', ex: f[4] || null });
      phaseStep.set(f[0], steps.length);
    }
    for (const ph of used) {
      if (phaseStep.has(ph)) continue;
      steps.push({ n: steps.length + 1, phase: ph, title: '나머지 부품 붙이기', desc: '남은 부품을 제자리에 붙입니다.', tip: '', ex: null });
      phaseStep.set(ph, steps.length);
    }
    // 2) 경계 상자
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const p of parts) {
      const m = orientedMesh(p, 0);
      const bb = bboxOf(m.v);
      p.bb = { min: V.add(bb.min, p.pos), max: V.add(bb.max, p.pos) };
      p.center = V.add(bb.center, p.pos);
      if (!p.opt) for (let a = 0; a < 3; a++) { min[a] = Math.min(min[a], p.bb.min[a]); max[a] = Math.max(max[a], p.bb.max[a]); }
    }
    if (!Number.isFinite(min[0])) { min = [0, 0, 0]; max = [0, 0, 0]; }
    const bbox = { min, max, size: V.sub(max, min), center: V.mul(V.add(min, max), 0.5) };
    // 3) 단계 번호·분해 방향·재료 분류
    for (const p of parts) {
      p.step = phaseStep.get(p.phase) || 1;
      if (!p.ex) {
        const st = steps[p.step - 1];
        if (st && st.ex) p.ex = st.ex;
        else {
          const d = V.sub(p.center, bbox.center);
          const rel = [d[0] / (bbox.size[0] || 1), d[1] / (bbox.size[1] || 1), d[2] / (bbox.size[2] || 1)];
          const a = [0, 1, 2].sort((i, j) => Math.abs(rel[j]) - Math.abs(rel[i]))[0];
          const e = [0, 0, 0];
          e[a] = Math.abs(rel[a]) < 0.08 ? 0 : Math.sign(rel[a]);
          p.ex = e;
        }
      }
      Object.assign(p, classify(p));
    }
    return {
      item, variant: variant || null, N: this.N, fit: this.fit,
      parts, steps, bbox,
      dims: [bbox.size[0], bbox.size[2], bbox.size[1]], // 폭 × 깊이 × 높이
    };
  }
}

/** 부품을 미니어처 재료 종류와 재단 치수로 분류한다. */
export function classify(p) {
  const soft = SOFT.has(p.role);
  const hint = p.stockHint;
  switch (p.kind) {
    case 'box': {
      const d = [...p.size].sort((a, b) => a - b);
      if (p.role === 'glass' || p.role === 'mirror') return { stock: 'film', cut: { l: d[2], w: d[1], t: d[0] } };
      if (soft) return { stock: 'foam', cut: { l: d[2], w: d[1], t: d[0] } };
      if (hint) return { stock: hint, cut: hint === 'stick' ? { l: d[2], a: d[1], b: d[0] } : { l: d[2], w: d[1], t: d[0] } };
      if (d[1] <= d[0] * 3.2 && d[2] >= d[1] * 2.2 && d[1] <= 95) return { stock: 'stick', cut: { l: d[2], a: d[1], b: d[0] } };
      if (d[0] <= 60 || d[1] >= d[0] * 2.5) return { stock: 'sheet', cut: { l: d[2], w: d[1], t: d[0] } };
      return { stock: 'block', cut: { l: d[2], w: d[1], t: d[0] } };
    }
    case 'rbox': {
      const d = [...p.size].sort((a, b) => a - b);
      const stock = hint || (soft ? 'foam' : d[1] >= d[0] * 3 ? 'sheet' : 'block');
      return { stock, cut: { l: d[2], w: d[1], t: d[0], r: p.r } };
    }
    case 'cyl': {
      const dia = 2 * Math.max(p.r, p.r2 ?? p.r), dia2 = 2 * Math.min(p.r, p.r2 ?? p.r);
      if (hint) return { stock: hint, cut: { d: dia, l: p.len, d2: dia2 } };
      if (p.len >= dia * 1.4) return { stock: 'rod', cut: { d: dia, l: p.len, d2: dia2 } };
      if (p.len <= dia * 0.45) return { stock: 'disc', cut: { d: dia, t: p.len } };
      return { stock: 'turn', cut: { d: dia, l: p.len, d2: dia2 } };
    }
    case 'sph':
      return { stock: 'bead', cut: { d: 2 * p.r } };
    case 'lathe': {
      let rmax = 0, y0 = Infinity, y1 = -Infinity;
      for (const [r, y] of p.profile) { rmax = Math.max(rmax, r); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const stock = hint || (p.role === 'shade' || p.role === 'paper' ? 'cone' : 'turn');
      return { stock, cut: { d: 2 * rmax, l: y1 - y0 } };
    }
    case 'ext': {
      let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity, per = 0;
      p.pts.forEach((q, i) => {
        u0 = Math.min(u0, q[0]); u1 = Math.max(u1, q[0]); v0 = Math.min(v0, q[1]); v1 = Math.max(v1, q[1]);
        const n = p.pts[(i + 1) % p.pts.length];
        per += Math.hypot(n[0] - q[0], n[1] - q[1]);
      });
      const bw = u1 - u0, bh = v1 - v0;
      if (p.wall) return { stock: 'band', cut: { l: per, w: p.t, t: p.wall } };
      if (soft) return { stock: 'foam', cut: { l: Math.max(bw, bh), w: Math.min(bw, bh), t: p.t, shaped: true } };
      if (p.role === 'glass' || p.role === 'mirror') return { stock: 'film', cut: { l: Math.max(bw, bh), w: Math.min(bw, bh), t: p.t, shaped: true } };
      return { stock: hint || 'profile', cut: { l: Math.max(bw, bh), w: Math.min(bw, bh), t: p.t, shaped: true, origin: [u0, v0], bw, bh } };
    }
    case 'tube':
      return { stock: 'wire', cut: { d: 2 * p.r, l: pathLength(p.path, p.closed) } };
    default:
      return { stock: 'block', cut: {} };
  }
}

export function buildModel(item, opts = {}) {
  const variant = (item.variants || []).find((v) => v.id === opts.variant) || null;
  const P = { ...(item.params || {}), ...(variant ? variant.params : {}) };
  const k = new Kit({ N: opts.N || 12, fit: opts.fit, detail: opts.detail });
  item.build(k, P);
  return k.finalize(item, variant);
}

export const STOCK_INFO = {
  sheet: { ko: '판재', hint: '발사·바스우드·MDF·하드보드를 두께에 맞춰 재단' },
  profile: { ko: '판재(곡선)', hint: '도안을 붙이고 실톱·칼로 윤곽을 따라 재단' },
  stick: { ko: '각재', hint: '각재를 길이에 맞춰 자름' },
  rod: { ko: '환봉', hint: '다월·황동봉·이쑤시개를 길이에 맞춰 자름' },
  wire: { ko: '철사·파이프', hint: '철사나 황동봉을 도면대로 구부림' },
  disc: { ko: '원판', hint: '판재에서 원형으로 오려 냄' },
  turn: { ko: '깎는 부품', hint: '환봉을 사포로 다듬거나 레진·점토로 성형' },
  block: { ko: '블록', hint: '판재를 겹쳐 붙이거나 블록을 깎아 만듦' },
  foam: { ko: '쿠션', hint: '스펀지·우레탄폼에 원단을 씌움' },
  film: { ko: '투명판', hint: '아크릴·PET 필름을 재단' },
  band: { ko: '띠(둘레판)', hint: '얇은 판·종이를 띠로 잘라 둘러 붙임' },
  cone: { ko: '전개도', hint: '종이에 전개도를 인쇄해 말아 붙임' },
  bead: { ko: '구슬', hint: '비즈·구슬·레진 볼 사용' },
};
