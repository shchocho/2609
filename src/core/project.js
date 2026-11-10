// project.js — 부품 메시를 2D로 투영해 은선이 제거된 벡터 그림을 만든다.
// 부품 순서는 AABB 분리축으로 위상 정렬(화가 알고리즘), 부품 안에서는 면 단위로 정렬한다.
// 삼면도·등각도·분해도·조립도가 모두 이 함수 하나에서 나온다.

import { orientedMesh, faceNormal, V } from './geom.js';

const D2R = Math.PI / 180;

export const VIEWS = {
  front: { R: [1, 0, 0], U: [0, 1, 0], T: [0, 0, 1] },
  back: { R: [-1, 0, 0], U: [0, 1, 0], T: [0, 0, -1] },
  right: { R: [0, 0, -1], U: [0, 1, 0], T: [1, 0, 0] },
  left: { R: [0, 0, 1], U: [0, 1, 0], T: [-1, 0, 0] },
  top: { R: [1, 0, 0], U: [0, 0, -1], T: [0, 1, 0] },
};

/** yaw = 보는 사람이 +X 쪽으로 돌아간 각도, pitch = 내려다보는 각도. */
export function isoView(yaw = 35, pitch = 26) {
  const y = yaw * D2R, p = pitch * D2R;
  const T = [Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)];
  const R = [Math.cos(y), 0, -Math.sin(y)];
  return { R, U: V.cross(T, R), T };
}

/** 메시에 면 법선과 모서리 인접 정보를 붙여 캐시한다. */
export function prepMesh(p, detail = 0) {
  const key = `_m${detail}`;
  if (p[key]) return p[key];
  const m = orientedMesh(p, detail);
  m.fn = m.f.map((face) => faceNormal(m.v, face));
  const map = new Map();
  m.adj = m.f.map((face) => new Int32Array(face.length).fill(-1));
  m.f.forEach((face, fi) => {
    for (let e = 0; e < face.length; e++) {
      const a = face[e], b = face[(e + 1) % face.length];
      const k = a < b ? a * 1e6 + b : b * 1e6 + a;
      const prev = map.get(k);
      if (prev) { m.adj[fi][e] = prev[0]; m.adj[prev[0]][prev[1]] = fi; }
      else map.set(k, [fi, e]);
    }
  });
  Object.defineProperty(p, key, { value: m, enumerable: false, configurable: true });
  return m;
}

function order(items, T) {
  const n = items.length, EPS = 1e-6, TOL = 0.6;
  const behind = (A, B) => {
    for (let a = 0; a < 3; a++) {
      if (T[a] > EPS && A.max[a] <= B.min[a] + TOL) return true;
      if (T[a] < -EPS && A.min[a] >= B.max[a] - TOL) return true;
    }
    return false;
  };
  const indeg = new Int32Array(n), out = items.map(() => []);
  for (let i = 0; i < n; i++) {
    const a = items[i];
    for (let j = i + 1; j < n; j++) {
      const b = items[j];
      if (a.sb[0] >= b.sb[2] || b.sb[0] >= a.sb[2] || a.sb[1] >= b.sb[3] || b.sb[1] >= a.sb[3]) continue;
      const ab = behind(a.wb, b.wb), ba = behind(b.wb, a.wb);
      if (ab && !ba) { out[i].push(j); indeg[j]++; }
      else if (ba && !ab) { out[j].push(i); indeg[i]++; }
      else if (!ab && !ba) {
        // 겹친 부품: 깊이 중심으로 약하게 정렬
        if (a.depth < b.depth - 0.5) { out[i].push(j); indeg[j]++; }
        else if (b.depth < a.depth - 0.5) { out[j].push(i); indeg[i]++; }
      }
    }
  }
  const done = new Uint8Array(n), res = [];
  for (let c = 0; c < n; c++) {
    let pick = -1;
    for (let i = 0; i < n; i++) if (!done[i] && indeg[i] <= 0 && (pick < 0 || items[i].depth < items[pick].depth)) pick = i;
    if (pick < 0) for (let i = 0; i < n; i++) if (!done[i] && (pick < 0 || items[i].depth < items[pick].depth)) pick = i;
    done[pick] = 1;
    res.push(items[pick]);
    for (const j of out[pick]) indeg[j]--;
  }
  return res;
}

const r2 = (x) => Math.round(x * 100) / 100;

/**
 * @returns {{ items: Array<{part, faces: Array<{d:string, shade:number, edges:string, n:number[]}>, sb:number[], cx:number, cy:number}>, bbox:number[] }}
 */
export function projectParts(parts, opts = {}) {
  const view = opts.view || isoView();
  const { R, U, T } = view;
  const detail = opts.detail ?? 0;
  const creaseCos = Math.cos((opts.crease ?? 32) * D2R);
  const L = V.norm(opts.light || V.add(V.add(V.mul(T, 0.55), V.mul(U, 0.75)), V.mul(R, -0.4)));
  let items = [];
  for (const p of parts) {
    if (p.inner && !opts.showInner) continue;
    if (opts.filter && !opts.filter(p)) continue;
    const m = prepMesh(p, detail);
    const off = opts.offset ? opts.offset(p) : null;
    const o = off ? V.add(p.pos, off) : p.pos;
    const n = m.v.length, sx = new Float64Array(n), sy = new Float64Array(n), sz = new Float64Array(n);
    const sb = [Infinity, Infinity, -Infinity, -Infinity], min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    let z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < n; i++) {
      const w = [m.v[i][0] + o[0], m.v[i][1] + o[1], m.v[i][2] + o[2]];
      const x = w[0] * R[0] + w[1] * R[1] + w[2] * R[2], y = -(w[0] * U[0] + w[1] * U[1] + w[2] * U[2]), z = w[0] * T[0] + w[1] * T[1] + w[2] * T[2];
      sx[i] = x; sy[i] = y; sz[i] = z;
      if (x < sb[0]) sb[0] = x; if (x > sb[2]) sb[2] = x; if (y < sb[1]) sb[1] = y; if (y > sb[3]) sb[3] = y;
      if (z < z0) z0 = z; if (z > z1) z1 = z;
      for (let a = 0; a < 3; a++) { if (w[a] < min[a]) min[a] = w[a]; if (w[a] > max[a]) max[a] = w[a]; }
    }
    items.push({ part: p, m, sx, sy, sz, sb, wb: { min, max }, depth: (z0 + z1) / 2 });
  }
  items = order(items, T);
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  const out = [];
  for (const it of items) {
    const { m, sx, sy, sz } = it;
    const nf = m.f.length, vis = new Uint8Array(nf), fd = new Float64Array(nf);
    const list = [];
    for (let i = 0; i < nf; i++) {
      const nrm = m.fn[i];
      if (nrm[0] * T[0] + nrm[1] * T[1] + nrm[2] * T[2] > 1e-5) {
        vis[i] = 1;
        let s = 0;
        for (const vi of m.f[i]) s += sz[vi];
        fd[i] = s / m.f[i].length;
        list.push(i);
      }
    }
    list.sort((a, b) => fd[a] - fd[b]);
    const rank = new Int32Array(nf).fill(-1);
    list.forEach((fi, i) => { rank[fi] = i; });
    const faces = [];
    for (const fi of list) {
      const face = m.f[fi], nrm = m.fn[fi];
      let d = '', e = '';
      for (let k = 0; k < face.length; k++) d += `${k ? 'L' : 'M'}${r2(sx[face[k]])} ${r2(sy[face[k]])}`;
      d += 'Z';
      for (let k = 0; k < face.length; k++) {
        const g = m.adj[fi][k];
        let draw;
        if (g < 0 || !vis[g]) draw = true;
        else if (V.dot(nrm, m.fn[g]) < creaseCos) draw = rank[fi] > rank[g];
        else draw = false;
        if (draw) {
          const a = face[k], b = face[(k + 1) % face.length];
          e += `M${r2(sx[a])} ${r2(sy[a])}L${r2(sx[b])} ${r2(sy[b])}`;
        }
      }
      faces.push({ d, e, shade: Math.max(0, V.dot(nrm, L)), n: nrm });
    }
    if (it.sb[0] < bbox[0]) bbox[0] = it.sb[0]; if (it.sb[1] < bbox[1]) bbox[1] = it.sb[1];
    if (it.sb[2] > bbox[2]) bbox[2] = it.sb[2]; if (it.sb[3] > bbox[3]) bbox[3] = it.sb[3];
    out.push({ part: it.part, faces, sb: it.sb, cx: (it.sb[0] + it.sb[2]) / 2, cy: (it.sb[1] + it.sb[3]) / 2 });
  }
  if (!out.length) return { items: [], bbox: [0, 0, 0, 0] };
  return { items: out, bbox };
}

const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
export function shadeColor(c, s) {
  const [r, g, b] = hex(c), k = 0.6 + 0.48 * s;
  const f = (x) => Math.max(0, Math.min(255, Math.round(k <= 1 ? x * k : x + (255 - x) * (k - 1) * 1.6)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/**
 * 투영 결과를 SVG 조각으로. style(part) → { fill: '#hex'|null, stroke, sw, shade:boolean, opacity, cls }
 */
export function projectionSVG(proj, style, o = {}) {
  const sw0 = o.sw ?? 1;
  let s = '';
  for (const it of proj.items) {
    const st = style(it.part) || {};
    if (st.skip) continue;
    const fill = st.fill === undefined ? '#ffffff' : st.fill, stroke = st.stroke ?? '#111', sw = st.sw ?? sw0;
    s += `<g data-pid="${it.part.id}"${st.cls ? ` class="${st.cls}"` : ''}${st.opacity != null ? ` opacity="${st.opacity}"` : ''}>`;
    if (st.shade && fill) {
      for (const fc of it.faces) {
        const c = shadeColor(fill, fc.shade);
        s += `<path d="${fc.d}" fill="${c}" stroke="${c}" stroke-width="${sw * 0.5}"${st.fo != null ? ` fill-opacity="${st.fo}"` : ''}/>`;
        if (fc.e && stroke !== 'none') s += `<path d="${fc.e}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
      }
    } else {
      for (const fc of it.faces) {
        if (fill) s += `<path d="${fc.d}" fill="${fill}"${st.fo != null ? ` fill-opacity="${st.fo}"` : ''}/>`;
        if (fc.e && stroke !== 'none') s += `<path d="${fc.e}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
      }
    }
    s += '</g>';
  }
  return s;
}

/** 모델 전체를 한 장의 SVG 문자열로(썸네일·디버그용). */
export function modelSVG(model, o = {}) {
  const view = o.view || isoView(o.yaw ?? 35, o.pitch ?? 24);
  const proj = projectParts(model.parts, { view, detail: o.detail ?? 0, filter: o.filter, offset: o.offset });
  const [x0, y0, x1, y1] = proj.bbox, w = x1 - x0, h = y1 - y0, pad = Math.max(w, h) * (o.pad ?? 0.04);
  const sw = Math.max(w, h) * (o.stroke ?? 0.0022);
  const body = projectionSVG(proj, o.style || (() => ({ fill: '#ffffff', stroke: '#16201c' })), { sw });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r2(x0 - pad)} ${r2(y0 - pad)} ${r2(w + 2 * pad)} ${r2(h + 2 * pad)}" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
}
