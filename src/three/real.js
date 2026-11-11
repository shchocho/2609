// real.js — 실물 스캔 자산 로더. 실제 사물을 사진 측량한 모델과 재질 사진(Poly Haven, CC0)을
// tools/fetch-real-assets.py 가 가벼운 형식으로 바꿔 둔 것을 읽는다. 못 읽으면 절차적 소품·텍스처가 그대로 쓰인다.

import * as THREE from '../../vendor/three.module.min.js';

const BASE = new URL('../../assets/real/', import.meta.url).href;
let manP = null;
/** manifest.json (없거나 실패하면 null). */
export function realManifest() {
  if (!manP) manP = fetch(`${BASE}manifest.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return manP;
}

const texCache = new Map();
/** 원본 텍스처(이미지 로드가 끝난 뒤에 resolve). 쓰는 쪽에서 clone 해서 반복 크기를 정한다. */
export function realTexture(name, srgb) {
  const key = `${name}|${srgb ? 1 : 0}`;
  if (!texCache.has(key)) {
    texCache.set(key, new Promise((res, rej) => {
      new THREE.TextureLoader().load(`${BASE}${name}`, (t) => { t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; res(t); }, undefined, rej);
    }));
  }
  return texCache.get(key);
}

const geoCache = new Map();
function realGeometry(id) {
  if (!geoCache.has(id)) {
    geoCache.set(id, realManifest().then(async (man) => {
      const info = man && man.models[id];
      if (!info) return null;
      const r = await fetch(`${BASE}${id}.bin`);
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      const meshes = info.meshes.map((e) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, e.pos, e.verts * 3), 3));
        g.setAttribute('normal', new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(new Int8Array(buf, e.nor, e.verts * 4), 4), 3, 0, true));
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(buf, e.uv, e.verts * 2), 2));
        g.setIndex(new THREE.BufferAttribute(new Uint32Array(buf, e.ind, e.idx), 1));
        g.computeBoundingSphere(); g.computeBoundingBox();
        return { geometry: g, mat: e.mat };
      });
      return { meshes, min: info.min, max: info.max };
    }).catch(() => null));
  }
  return geoCache.get(id);
}

/** 장면 하나(스테이지·쇼룸)가 쓰는 실물 모델 재질과 인스턴스. hook(material) 로 장면 전용 유니폼을 단다. */
export class RealAssets {
  constructor({ hook = (m) => m, lite = false } = {}) { this.hook = hook; this.lite = lite; this.mats = new Map(); this.disposed = false; }

  async _material(id, i, md) {
    const key = `${id}|${i}`;
    if (!this.mats.has(key)) {
      this.mats.set(key, (async () => {
        const [d, n, r] = await Promise.all([md.d ? realTexture(`tex/${md.d}`, true) : null, md.n ? realTexture(`tex/${md.n}`, false) : null, md.r ? realTexture(`tex/${md.r}`, false) : null]);
        for (const t of [d, n, r]) if (t && t.flipY) { t.flipY = false; t.needsUpdate = true; } // glTF UV 는 위에서 아래로
        const m = new THREE.MeshStandardMaterial({ map: d, normalMap: n, roughnessMap: r, metalnessMap: md.arm ? r : null, metalness: md.arm ? 1 : 0, roughness: 1, side: md.double ? THREE.DoubleSide : THREE.FrontSide, alphaTest: md.alpha === 'MASK' ? 0.5 : 0 });
        return this.hook(m);
      })());
    }
    return this.mats.get(key);
  }

  /** 모델 한 개(바닥 가운데가 원점, 높이 h mm 로 맞춤). 실패하면 null. */
  async instance(id, h) {
    if (this.lite && id === 'potted_plant_01') id = 'potted_plant_02'; // 많은 방에 놓을 때는 가벼운 화분으로
    const geo = await realGeometry(id);
    if (!geo || this.disposed) return null;
    const mats = await Promise.all(geo.meshes.map((m, i) => this._material(id, i, m.mat)));
    const g = new THREE.Group(), s = h ? h / (geo.max[1] - geo.min[1]) : 1;
    geo.meshes.forEach((m, i) => {
      const mesh = new THREE.Mesh(m.geometry, mats[i]);
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.libMat = true;
      g.add(mesh);
    });
    g.scale.setScalar(s);
    g.userData.offset = [-(geo.min[0] + geo.max[0]) / 2 * s, -geo.min[1] * s, -(geo.min[2] + geo.max[2]) / 2 * s];
    return g;
  }

  dispose() { this.disposed = true; for (const p of this.mats.values()) p.then((m) => m.dispose()).catch(() => {}); this.mats.clear(); }
}
