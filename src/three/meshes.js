// meshes.js — 커널 메시 → three.js BufferGeometry. 크리스 각 법선과 mm 단위 UV(나뭇결 방향)를 만든다.

import * as THREE from '../../vendor/three.module.min.js';
import { localMesh, orientFn, faceNormal, triangulate, V } from '../core/geom.js';
import { prepMesh } from '../core/project.js';

const CREASE = Math.cos((38 * Math.PI) / 180);

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

/** 렌더용 지오메트리(면취·고분할). UV는 부품 로컬 좌표의 mm. */
export function partGeometry(p, detail = 1) {
  const m = localMesh(p, detail);
  const { tf, det } = orientFn(p);
  const nf = m.f.length, fn = m.f.map((f) => faceNormal(m.v, f));
  // 로컬 경계와 결 방향
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const q of m.v) for (let a = 0; a < 3; a++) { if (q[a] < min[a]) min[a] = q[a]; if (q[a] > max[a]) max[a] = q[a]; }
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const g = p.grain ? 'xyz'.indexOf(p.grain) : size.indexOf(Math.max(...size));
  const seed = hash(p.id + p.name), off = [seed * 1900, ((seed * 7919) % 1) * 600];
  // 크리스 각 법선
  let corner = null;
  if (!m.vn) {
    const vf = m.v.map(() => []);
    m.f.forEach((f, i) => { for (const vi of f) vf[vi].push(i); });
    corner = m.f.map((f, i) => f.map((vi) => {
      let n = [0, 0, 0];
      for (const j of vf[vi]) if (V.dot(fn[i], fn[j]) >= CREASE) n = V.add(n, fn[j]);
      return V.norm(n);
    }));
  }
  const pos = [], nor = [], uv = [];
  for (let i = 0; i < nf; i++) {
    const f = m.f[i], n = fn[i];
    const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
    const na = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2;
    const a = (na + 1) % 3, b = (na + 2) % 3;
    const ua = g === b ? b : a, va = g === b ? a : b;
    const idx = new Map(f.map((vi, k) => [vi, k]));
    for (const tri of triangulate(m.v, f, n)) {
      const order = det < 0 ? [tri[0], tri[2], tri[1]] : tri;
      for (const vi of order) {
        const q = m.v[vi], w = tf(q);
        pos.push(w[0], w[1], w[2]);
        const ln = m.vn ? m.vn[vi] : corner[i][idx.get(vi)];
        // 뒤집힌 부품은 법선도 같은 변환을 거친다(반사 포함).
        const wn = tf(ln), l = Math.hypot(wn[0], wn[1], wn[2]) || 1;
        nor.push(wn[0] / l, wn[1] / l, wn[2] / l);
        uv.push(q[ua] + off[0], q[va] + off[1]);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

/** 도면선 스타일용: 각진 메시의 크리스 모서리 선분. */
export function edgeGeometry(p) {
  const m = prepMesh(p, 0), pts = [], seen = new Set();
  for (let i = 0; i < m.f.length; i++) {
    const f = m.f[i];
    for (let e = 0; e < f.length; e++) {
      const j = m.adj[i][e], a = f[e], b = f[(e + 1) % f.length];
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (j < 0 || V.dot(m.fn[i], m.fn[j]) < 0.82) pts.push(...m.v[a], ...m.v[b]);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

/** 도면선 스타일용: 각진 메시의 면(은선 제거용 채움). */
export function draftGeometry(p) {
  const m = prepMesh(p, 0), pos = [];
  for (let i = 0; i < m.f.length; i++) for (const tri of triangulate(m.v, m.f[i], m.fn[i])) for (const vi of tri) pos.push(...m.v[vi]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}
