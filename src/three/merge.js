// merge.js — 부품 여러 개를 재질별 메시 몇 개로 합친다(쇼룸의 가구·소품, 워크벤치 룸 배경).
// 부품마다 메시를 만들면 드로콜이 수천 개가 되므로, 고를 일이 없는 것들은 이렇게 묶는다.

import * as THREE from '../../vendor/three.module.min.js';
import { partGeometry } from './meshes.js';
import { materialKey, MATERIALS } from '../data/materials.js';

const NO_SHADOW = new Set(['glass', 'emit', 'paper', 'opal']);

/** parts → THREE.Group(재질마다 메시 하나). 부품 위치는 지오메트리에 구워 넣는다. */
export function mergedGroup(parts, lib, { detail = 0, finish = null, cast = true, receive = true } = {}) {
  const buckets = new Map();
  for (const p of parts) {
    if (p.inner) continue;
    const key = p.mat || materialKey(p.role, finish);
    let b = buckets.get(key);
    if (!b) { b = { geos: [], n: 0 }; buckets.set(key, b); }
    const geo = partGeometry(p, detail);
    b.geos.push([geo, p.pos]);
    b.n += geo.attributes.position.count;
  }
  const group = new THREE.Group();
  for (const [key, b] of buckets) {
    const pos = new Float32Array(b.n * 3), nor = new Float32Array(b.n * 3), uv = new Float32Array(b.n * 2);
    let o = 0;
    for (const [geo, pp] of b.geos) {
      const P = geo.attributes.position.array, n = P.length / 3;
      for (let i = 0, j = o * 3; i < n * 3; i += 3, j += 3) { pos[j] = P[i] + pp[0]; pos[j + 1] = P[i + 1] + pp[1]; pos[j + 2] = P[i + 2] + pp[2]; }
      nor.set(geo.attributes.normal.array, o * 3);
      uv.set(geo.attributes.uv.array, o * 2);
      o += n;
      geo.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.computeBoundingSphere(); g.computeBoundingBox();
    const mat = lib.get(key), mesh = new THREE.Mesh(g, mat), t = (MATERIALS[key] || {}).t;
    mesh.castShadow = cast && !NO_SHADOW.has(t) && !(mat.transmission > 0);
    mesh.receiveShadow = receive;
    if (mat.transparent) mesh.renderOrder = 2;
    mesh.userData.libMat = true; // 재질은 MaterialLib 소유: 그룹을 지울 때 재질까지 지우지 않는다
    group.add(mesh);
  }
  return group;
}

/**
 * 소품 묶음. parts.reals 가 있으면 그 소품들은 실물 스캔 모델로 바꿔 그린다:
 * 먼저 절차적 소품을 보여 주고, 스캔 모델이 모두 준비되면 갈아 끼운다(실패하면 그대로 둔다).
 */
export function decorGroup(parts, lib, assets, opts = {}) {
  const reals = parts.reals || [], g = new THREE.Group();
  if (!reals.length || !assets) { g.add(mergedGroup(parts, lib, opts)); return g; }
  g.add(mergedGroup(parts.filter((p) => p.real == null), lib, opts));
  const fb = mergedGroup(parts.filter((p) => p.real != null), lib, opts);
  g.add(fb);
  Promise.all(reals.map((r) => assets.instance(r.id, r.h))).then((list) => {
    if (!g.parent || list.some((x) => !x)) return;
    list.forEach((inst, i) => {
      const r = reals[i], o = inst.userData.offset, a = ((r.yaw || 0) + i * 73) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      inst.rotation.y = a;
      inst.position.set(r.pos[0] + o[0] * c + o[2] * s, r.pos[1] + o[1], r.pos[2] - o[0] * s + o[2] * c);
      g.add(inst);
    });
    g.remove(fb); disposeGroup(fb);
    if (opts.onReady) opts.onReady();
  }).catch(() => {});
  return g;
}

/** 그룹 안의 지오메트리를 모두 해제한다(재질은 MaterialLib 이 관리). */
export function disposeGroup(group) {
  group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}
