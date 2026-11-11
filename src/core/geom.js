// geom.js — 의존성 없는 폴리곤 메시 커널.
// 단위 mm, 오른손 좌표계, Y가 위, +Z가 정면(보는 사람 쪽).
// Mesh = { v: [x,y,z][], f: number[][] (바깥에서 볼 때 반시계), vn?: [x,y,z][] (해석적 법선) }
// 같은 메시가 3D 렌더·SVG 도면·STL 내보내기의 공통 입력이 된다.

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

export const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};

/** 오일러 XYZ(도) → 3×3 행 우선 행렬. three.js의 Euler('XYZ')와 동일하다. */
export function rotMatrix(rot) {
  const a = rot[0] * D2R, b = rot[1] * D2R, c = rot[2] * D2R;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  return [
    cb * cc, -cb * sc, sb,
    sa * sb * cc + ca * sc, -sa * sb * sc + ca * cc, -sa * cb,
    -ca * sb * cc + sa * sc, ca * sb * sc + sa * cc, ca * cb,
  ];
}

export const applyM = (m, p) => [
  m[0] * p[0] + m[1] * p[1] + m[2] * p[2],
  m[3] * p[0] + m[4] * p[1] + m[5] * p[2],
  m[6] * p[0] + m[7] * p[1] + m[8] * p[2],
];

// ---------------------------------------------------------------- primitives

export function meshBox(sx, sy, sz) {
  const x = sx / 2, y = sy / 2, z = sz / 2;
  return {
    v: [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]],
    f: [[4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6], [0, 4, 7, 3], [7, 6, 2, 3], [0, 1, 5, 4]],
  };
}

function bandCoords(h, r, k, m) {
  const inner = h - r, out = [];
  for (let j = k; j >= 1; j--) out.push(-(inner + r * Math.tan((j / k) * Math.PI / 4)));
  if (inner > 1e-6) for (let i = 0; i <= m; i++) out.push(-inner + (2 * inner * i) / m);
  else out.push(0);
  for (let j = 1; j <= k; j++) out.push(inner + r * Math.tan((j / k) * Math.PI / 4));
  return out;
}

/**
 * 모서리를 둥글린 상자. k = 모서리 분할 수, m = 평면부 분할 수.
 * crown = [−x,+x,−y,+y,−z,+z] 방향으로 면 중앙이 부풀어 오르는 양(쿠션용).
 */
export function meshRBox(sx, sy, sz, r, k = 2, m = 1, crown = null) {
  const h = [sx / 2, sy / 2, sz / 2];
  r = Math.max(0, Math.min(r, h[0], h[1], h[2]));
  if (r < 1e-6) return meshBox(sx, sy, sz);
  const co = [bandCoords(h[0], r, k, m), bandCoords(h[1], r, k, m), bandCoords(h[2], r, k, m)];
  const v = [], vn = [], f = [], index = new Map();
  const put = (p) => {
    const q = [0, 0, 0], d = [0, 0, 0];
    for (let a = 0; a < 3; a++) {
      const lim = h[a] - r;
      q[a] = Math.max(-lim, Math.min(lim, p[a]));
      d[a] = p[a] - q[a];
    }
    const n = V.norm(d);
    const pos = [q[0] + n[0] * r, q[1] + n[1] * r, q[2] + n[2] * r];
    const key = `${Math.round(pos[0] * 1e3)},${Math.round(pos[1] * 1e3)},${Math.round(pos[2] * 1e3)}`;
    let i = index.get(key);
    if (i === undefined) {
      i = v.length;
      index.set(key, i);
      v.push(pos);
      vn.push(n);
    }
    return i;
  };
  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3, c = (a + 2) % 3;
    for (const s of [1, -1]) {
      const cb = co[b], cc = co[c];
      const grid = cb.map((u) => cc.map((w) => {
        const p = [0, 0, 0];
        p[a] = s * h[a]; p[b] = u; p[c] = w;
        return put(p);
      }));
      for (let i = 0; i < cb.length - 1; i++) {
        for (let j = 0; j < cc.length - 1; j++) {
          const q = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];
          const uniq = q.filter((x, t) => q.indexOf(x) === t);
          if (uniq.length < 3) continue;
          f.push(s > 0 ? uniq : uniq.reverse());
        }
      }
    }
  }
  const mesh = { v, f, vn };
  if (crown) {
    for (let i = 0; i < v.length; i++) {
      const p = v[i], n = vn[i];
      for (let a = 0; a < 3; a++) {
        const amt = crown[a * 2 + (n[a] > 0 ? 1 : 0)];
        if (!amt || Math.abs(n[a]) < 1e-4) continue;
        const b = (a + 1) % 3, c = (a + 2) % 3;
        const wb = 1 - Math.min(1, (p[b] / h[b]) ** 2), wc = 1 - Math.min(1, (p[c] / h[c]) ** 2);
        p[a] += n[a] * amt * Math.pow(wb * wc, 0.75);
      }
    }
    mesh.vn = smoothNormals(mesh);
  }
  return mesh;
}

/**
 * 회전체. profile = [[r, y], …] 를 (r, y) 반평면에서 반시계 방향으로 준다
 * (속이 찬 물체는 축에서 시작해 축에서 끝난다). closed = 고리형 단면(속이 빈 갓·링).
 */
export function meshLathe(profile, seg = 24, closed = false) {
  const v = [], f = [], rings = [];
  for (const [r, y] of profile) {
    if (r < 1e-6) {
      rings.push([v.length]);
      v.push([0, y, 0]);
    } else {
      const ring = [];
      for (let j = 0; j < seg; j++) {
        const a = (j / seg) * TAU;
        ring.push(v.length);
        v.push([r * Math.cos(a), y, r * Math.sin(a)]);
      }
      rings.push(ring);
    }
  }
  const n = rings.length, last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const A = rings[i], B = rings[(i + 1) % n];
    if (A.length === 1 && B.length === 1) continue;
    for (let j = 0; j < seg; j++) {
      const j1 = (j + 1) % seg;
      if (A.length === 1) f.push([A[0], B[j], B[j1]]);
      else if (B.length === 1) f.push([A[j], B[0], A[j1]]);
      else f.push([A[j], B[j], B[j1], A[j1]]);
    }
  }
  if (!closed) {
    const A = rings[0], Z = rings[n - 1];
    if (A.length > 1) f.push([...A]);
    if (Z.length > 1) f.push([...Z].reverse());
  }
  return { v, f };
}

export function cylProfile(r1, r2, len, bevel = 0) {
  const h = len / 2, b = Math.min(bevel, r1 * 0.5, r2 * 0.5, len * 0.25);
  if (b > 1e-3) return [[0, -h], [r1 - b, -h], [r1, -h + b], [r2, h - b], [r2 - b, h], [0, h]];
  return [[0, -h], [r1, -h], [r2, h], [0, h]];
}

export function sphereProfile(r, rings = 10, sy = 1) {
  const p = [];
  for (let i = 0; i <= rings; i++) {
    const a = -Math.PI / 2 + (i / rings) * Math.PI;
    p.push([i === 0 || i === rings ? 0 : r * Math.cos(a), r * Math.sin(a) * sy]);
  }
  return p;
}

const area2 = (pts) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};

export function polyCCW(pts) {
  return area2(pts) < 0 ? [...pts].reverse() : pts;
}

/** 반시계 다각형을 안쪽으로 d만큼 오프셋(마이터 제한). */
export function insetPoly(pts, d) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    let e1 = [p1[0] - p0[0], p1[1] - p0[1]], e2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(e1[0], e1[1]) || 1, l2 = Math.hypot(e2[0], e2[1]) || 1;
    e1 = [e1[0] / l1, e1[1] / l1]; e2 = [e2[0] / l2, e2[1] / l2];
    const n1 = [-e1[1], e1[0]], n2 = [-e2[1], e2[0]];
    let mx = n1[0] + n2[0], my = n1[1] + n2[1];
    const ml = Math.hypot(mx, my);
    if (ml < 1e-6) { out.push([p1[0] + n1[0] * d, p1[1] + n1[1] * d]); continue; }
    mx /= ml; my /= ml;
    const s = d / Math.max(mx * n1[0] + my * n1[1], 0.4);
    out.push([p1[0] + mx * s, p1[1] + my * s]);
  }
  return out;
}

/**
 * 2D 윤곽을 두께 t만큼 밀어낸 판. 로컬 (u, v, w) 좌표.
 * wall > 0 이면 속이 빈 테두리(트레이 벽·바구니), bevel > 0 이면 모서리 면취.
 */
export function meshExtrude(ptsIn, t, { bevel = 0, wall = 0 } = {}) {
  const pts = polyCCW(ptsIn), n = pts.length, v = [], f = [];
  const ring = (poly, w) => poly.map((p) => { v.push([p[0], p[1], w]); return v.length - 1; });
  const sideOut = (A, B) => { for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([A[i], B[i], B[j], A[j]]); } };
  const h = t / 2;
  if (wall > 0) {
    const inner = insetPoly(pts, wall);
    const fo = ring(pts, h), bo = ring(pts, -h), fi = ring(inner, h), bi = ring(inner, -h);
    sideOut(fo, bo);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      f.push([fi[i], fi[j], bi[j], bi[i]]);
      f.push([fo[i], fo[j], fi[j], fi[i]]);
      f.push([bo[j], bo[i], bi[i], bi[j]]);
    }
    return { v, f };
  }
  const b = Math.min(bevel, h * 0.6);
  if (b > 1e-3) {
    const ins = insetPoly(pts, b);
    const f0 = ring(ins, h), f1 = ring(pts, h - b), b1 = ring(pts, -h + b), b0 = ring(ins, -h);
    sideOut(f0, f1); sideOut(f1, b1); sideOut(b1, b0);
    f.push([...f0]); f.push([...b0].reverse());
  } else {
    const fr = ring(pts, h), bk = ring(pts, -h);
    sideOut(fr, bk);
    f.push([...fr]); f.push([...bk].reverse());
  }
  return { v, f };
}

/** 꺾이는 점을 2차 베지어로 둥글린 경로. */
export function filletPath(path, rc, cseg = 5, closed = false) {
  if (!rc) return path.map((p) => p.slice());
  const n = path.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = path[i];
    if (!closed && (i === 0 || i === n - 1)) { out.push(p.slice()); continue; }
    const a = path[(i + n - 1) % n], b = path[(i + 1) % n];
    const d1 = V.sub(a, p), d2 = V.sub(b, p), l1 = V.len(d1), l2 = V.len(d2);
    if (l1 < 1e-6 || l2 < 1e-6) { out.push(p.slice()); continue; }
    const L = Math.min(rc, l1 * 0.48, l2 * 0.48);
    const A = V.add(p, V.mul(d1, L / l1)), B = V.add(p, V.mul(d2, L / l2));
    for (let s = 0; s <= cseg; s++) {
      const t = s / cseg, u = 1 - t;
      out.push([u * u * A[0] + 2 * u * t * p[0] + t * t * B[0], u * u * A[1] + 2 * u * t * p[1] + t * t * B[1], u * u * A[2] + 2 * u * t * p[2] + t * t * B[2]]);
    }
  }
  return out;
}

export function pathLength(path, closed = false) {
  let s = 0;
  for (let i = 0; i < path.length - 1; i++) s += V.len(V.sub(path[i + 1], path[i]));
  if (closed) s += V.len(V.sub(path[0], path[path.length - 1]));
  return s;
}

/** 원형 단면을 3D 경로를 따라 쓸어 만든 파이프(철제 프레임·와이어). */
export function meshTube(path, r, { seg = 10, corner = 0, cseg = 5, closed = false } = {}) {
  const P = filletPath(path, corner, cseg, closed), n = P.length;
  const tan = P.map((_, i) => {
    const a = P[closed ? (i + n - 1) % n : Math.max(i - 1, 0)], b = P[closed ? (i + 1) % n : Math.min(i + 1, n - 1)];
    return V.norm(V.sub(b, a));
  });
  const t0 = tan[0];
  let nrm = V.norm(V.cross(V.cross(t0, Math.abs(t0[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]), t0));
  const v = [], f = [], rings = [];
  for (let i = 0; i < n; i++) {
    const t = tan[i];
    nrm = V.sub(nrm, V.mul(t, V.dot(nrm, t)));
    const l = V.len(nrm);
    nrm = l > 1e-6 ? V.mul(nrm, 1 / l) : V.norm(V.cross(t, [0.31, 0.57, 0.76]));
    const bi = V.cross(t, nrm), ring = [];
    for (let j = 0; j < seg; j++) {
      const a = (j / seg) * TAU, c = Math.cos(a) * r, s = Math.sin(a) * r;
      ring.push(v.length);
      v.push([P[i][0] + nrm[0] * c + bi[0] * s, P[i][1] + nrm[1] * c + bi[1] * s, P[i][2] + nrm[2] * c + bi[2] * s]);
    }
    rings.push(ring);
  }
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const A = rings[i], B = rings[(i + 1) % n];
    for (let j = 0; j < seg; j++) { const j1 = (j + 1) % seg; f.push([A[j], A[j1], B[j1], B[j]]); }
  }
  if (!closed) { f.push([...rings[0]].reverse()); f.push([...rings[n - 1]]); }
  return { v, f };
}

// ---------------------------------------------------------------- helpers

export function faceNormal(v, face) {
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < face.length; i++) {
    const a = v[face[i]], b = v[face[(i + 1) % face.length]];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

export function smoothNormals(mesh) {
  const acc = mesh.v.map(() => [0, 0, 0]);
  for (const face of mesh.f) {
    const n = faceNormal(mesh.v, face);
    for (const i of face) { acc[i][0] += n[0]; acc[i][1] += n[1]; acc[i][2] += n[2]; }
  }
  return acc.map(V.norm);
}

/** 귀 자르기 삼각 분할(오목 다각형 지원). 인덱스 삼각형 배열을 돌려준다. */
export function triangulate(v, face, normal) {
  const n = face.length;
  if (n === 3) return [[face[0], face[1], face[2]]];
  const nn = normal || faceNormal(v, face);
  const ax = Math.abs(nn[0]), ay = Math.abs(nn[1]), az = Math.abs(nn[2]);
  let a, b, flip;
  if (ax >= ay && ax >= az) { a = 1; b = 2; flip = nn[0] < 0; }
  else if (ay >= az) { a = 2; b = 0; flip = nn[1] < 0; }
  else { a = 0; b = 1; flip = nn[2] < 0; }
  const P = face.map((i) => (flip ? [v[i][b], v[i][a]] : [v[i][a], v[i][b]]));
  if (n === 4) {
    const cr = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
    const ok = [0, 1, 2, 3].every((i) => cr(P[i], P[(i + 1) % 4], P[(i + 2) % 4]) >= -1e-9);
    if (ok) return [[face[0], face[1], face[2]], [face[0], face[2], face[3]]];
  }
  const idx = P.map((_, i) => i), tris = [];
  const cross = (o, p, q) => (P[p][0] - P[o][0]) * (P[q][1] - P[o][1]) - (P[p][1] - P[o][1]) * (P[q][0] - P[o][0]);
  const inside = (p, a0, b0, c0) => cross(a0, b0, p) >= -1e-9 && cross(b0, c0, p) >= -1e-9 && cross(c0, a0, p) >= -1e-9;
  let guard = n * n + 8;
  while (idx.length > 3 && guard-- > 0) {
    let cut = false;
    for (let i = 0; i < idx.length; i++) {
      const i0 = idx[(i + idx.length - 1) % idx.length], i1 = idx[i], i2 = idx[(i + 1) % idx.length];
      if (cross(i0, i1, i2) <= 1e-9) continue;
      let ear = true;
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue;
        if (inside(j, i0, i1, i2)) { ear = false; break; }
      }
      if (!ear) continue;
      tris.push([face[i0], face[i1], face[i2]]);
      idx.splice(i, 1);
      cut = true;
      break;
    }
    if (!cut) idx.splice(0, 1);
  }
  if (idx.length === 3) tris.push([face[idx[0]], face[idx[1]], face[idx[2]]]);
  return tris;
}

export function bboxOf(points) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of points) for (let a = 0; a < 3; a++) { if (p[a] < min[a]) min[a] = p[a]; if (p[a] > max[a]) max[a] = p[a]; }
  return { min, max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]], center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2] };
}

// ---------------------------------------------------------------- part → mesh

const PLANE = {
  xy: (p) => [p[0], p[1], p[2]],
  zy: (p) => [-p[2], p[1], p[0]],
  xz: (p) => [p[0], -p[2], p[1]],
};
const AXIS = {
  y: (p) => p,
  x: (p) => [p[1], -p[0], p[2]],
  z: (p) => [p[0], -p[2], p[1]],
};

/** 회전·뒤집기 전의 로컬 메시. detail 0 = 도면용(각진 형상), 1 = 렌더용(면취·고분할). */
export function localMesh(p, detail = 0) {
  let m;
  switch (p.kind) {
    case 'box': {
      const bv = detail ? Math.min(p.bevel ?? 1.2, Math.min(...p.size) * 0.4) : 0;
      m = bv > 0.05 ? meshRBox(p.size[0], p.size[1], p.size[2], bv, detail > 1 ? 2 : 1, 1) : meshBox(p.size[0], p.size[1], p.size[2]);
      break;
    }
    case 'rbox': {
      const soft = !!p.crown;
      m = meshRBox(p.size[0], p.size[1], p.size[2], p.r, detail ? (soft ? 4 : 3) : 2, soft ? (detail ? 6 : 2) : 1, p.crown || null);
      break;
    }
    case 'cyl': {
      m = meshLathe(cylProfile(p.r, p.r2 ?? p.r, p.len, detail ? (p.bevel ?? Math.min(1.2, p.r * 0.2)) : 0), detail ? (p.r > 60 ? 64 : 28) : p.lo ? (p.r > 200 ? 28 : 10) : (p.r > 60 ? 32 : 14));
      const fn = AXIS[p.axis || 'y'];
      if (fn !== AXIS.y) m.v = m.v.map(fn);
      break;
    }
    case 'sph':
      m = meshLathe(sphereProfile(p.r, detail ? 20 : p.lo ? 6 : 12, p.sy ?? 1), detail ? 40 : p.lo ? 10 : 24);
      break;
    case 'lathe':
      m = meshLathe(p.profile, detail ? 64 : p.lo ? 14 : 24, !!p.closed);
      break;
    case 'ext': {
      m = meshExtrude(p.pts, p.t, { bevel: detail ? (p.bevel ?? Math.min(1, p.t * 0.25)) : 0, wall: p.wall || 0 });
      m.v = m.v.map(PLANE[p.plane || 'xy']);
      break;
    }
    case 'tube':
      m = meshTube(p.path, p.r, { seg: detail ? 16 : p.lo ? 5 : 8, corner: p.corner || 0, cseg: detail ? 8 : 3, closed: !!p.closed });
      break;
    default:
      throw new Error(`unknown part kind: ${p.kind}`);
  }
  return m;
}

/** 부품의 방향 변환(뒤집기 → 회전 → 요). det < 0 이면 면 방향을 뒤집어야 한다. */
export function orientFn(p) {
  const fl = p.flip || [1, 1, 1], det = fl[0] * fl[1] * fl[2];
  const R = p.rot && (p.rot[0] || p.rot[1] || p.rot[2]) ? rotMatrix(p.rot) : null;
  const Y = p.yaw ? rotMatrix([0, p.yaw, 0]) : null;
  const tf = (q) => {
    let s = [q[0] * fl[0], q[1] * fl[1], q[2] * fl[2]];
    if (R) s = applyM(R, s);
    return Y ? applyM(Y, s) : s;
  };
  return { tf, det };
}

/** 부품 기준점에 대한 방향이 적용된 메시(회전·뒤집기 포함, 위치 제외). */
export function orientedMesh(p, detail = 0) {
  const m = localMesh(p, detail);
  const { tf, det } = orientFn(p);
  const out = { v: m.v.map(tf), f: det < 0 ? m.f.map((x) => [...x].reverse()) : m.f };
  if (m.vn) out.vn = m.vn.map(tf);
  return out;
}

export function worldPoints(p, mesh, offset) {
  const o = offset ? V.add(p.pos, offset) : p.pos;
  return mesh.v.map((q) => [q[0] + o[0], q[1] + o[1], q[2] + o[2]]);
}

/** 삼각형 목록(Float 좌표)으로 변환 — STL/OBJ 내보내기용. */
export function toTriangles(mesh) {
  const tris = [];
  for (const face of mesh.f) for (const t of triangulate(mesh.v, face)) tris.push(t);
  return tris;
}

// ---------------------------------------------------------------- profile helpers (빌더에서 사용)

/** 둥근 모서리 사각 윤곽. */
export function roundedRect(w, h, r, seg = 6) {
  r = Math.min(r, w / 2, h / 2);
  if (r <= 0) return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  const pts = [], cs = [[w / 2 - r, -h / 2 + r, -90], [w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180]];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= seg; i++) {
    const a = (a0 + (90 * i) / seg) * D2R;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

export function circlePts(r, seg = 40, rx = 1, ry = 1) {
  const pts = [];
  for (let i = 0; i < seg; i++) { const a = (i / seg) * TAU; pts.push([r * rx * Math.cos(a), r * ry * Math.sin(a)]); }
  return pts;
}

/** 2D 꺾은선의 모서리를 둥글린다. */
export function fillet2D(pts, r, seg = 6) {
  return filletPath(pts.map((p) => [p[0], p[1], 0]), r, seg, false).map((p) => [p[0], p[1]]);
}

/** 중심선(2D 꺾은선)을 두께 t의 띠 윤곽으로 — 곡목 프레임·팔걸이. */
export function stripProfile(center, t, r = 0, seg = 6) {
  const c = r ? fillet2D(center, r, seg) : center, n = c.length, L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, n - 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    L.push([c[i][0] + (nx * t) / 2, c[i][1] + (ny * t) / 2]);
    Rr.push([c[i][0] - (nx * t) / 2, c[i][1] - (ny * t) / 2]);
  }
  return [...L, ...Rr.reverse()];
}

export function arcPts(cx, cy, r, a0, a1, seg = 12) {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const a = (a0 + ((a1 - a0) * i) / seg) * D2R; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
}
