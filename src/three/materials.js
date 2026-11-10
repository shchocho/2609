// materials.js — 재질 표(MATERIALS)를 three.js PBR 재질로. 스튜디오 조명에 맞춘 값.

import * as THREE from '../../vendor/three.module.min.js';
import { woodTextures, fabricTextures, noiseTextures, galvTextures, pegboardTexture, WOOD_MM, FABRIC_MM, NOISE_MM, PEG_MM } from './textures.js';
import { MATERIALS } from '../data/materials.js';

// IBL 확산광 세기를 유니폼으로 분리한다(누적 렌더에서 그림자 있는 돔 조명으로 대체하기 위해).
export const iblDiffuse = { value: 1 };
let patched = false;
export function patchShaderChunks() {
  if (patched) return;
  patched = true;
  const C = THREE.ShaderChunk, needle = 'iblIrradiance += getIBLIrradiance( geometryNormal );';
  if (C.lights_fragment_maps.includes(needle)) {
    C.lights_fragment_maps = C.lights_fragment_maps.replace(needle, 'iblIrradiance += getIBLIrradiance( geometryNormal ) * uIblDiffuse;');
    C.lights_pars_begin = `uniform float uIblDiffuse;\n${C.lights_pars_begin}`;
  } else {
    console.warn('[stage] IBL 패치 지점을 찾지 못했습니다. 기본 조명으로 렌더합니다.');
    iblDiffuse.missing = true;
  }
}
const withIbl = (m) => {
  m.onBeforeCompile = (shader) => { shader.uniforms.uIblDiffuse = iblDiffuse; };
  return m;
};

const WARM = new THREE.Color('#ffd9a8');

export class MaterialLib {
  constructor({ cutout = false, grainScale = 1 } = {}) {
    this.cutout = cutout;
    this.grainScale = grainScale;
    this.cache = new Map();
    this.reps = new Map();
    this.glow = []; // 조명 켜기/끄기에 반응하는 재질
    this.lampOn = true;
  }

  setLamp(on) {
    this.lampOn = on;
    for (const g of this.glow) g.m.emissiveIntensity = on ? g.i : 0;
  }

  /** 같은 이미지를 다른 반복 크기로 쓰기 위해 텍스처를 복제한다(이미지 소스는 공유). */
  _rep(t, mmU, mmV = mmU) {
    const key = `${t.uuid}|${mmU}|${mmV}`;
    let c = this.reps.get(key);
    if (!c) {
      c = t.clone();
      c.repeat.set(1 / (mmU * this.grainScale), 1 / (mmV * this.grainScale));
      c.needsUpdate = true;
      this.reps.set(key, c);
    }
    return c;
  }

  get(key) {
    if (this.cache.has(key)) return this.cache.get(key);
    const d = MATERIALS[key] || MATERIALS.white;
    const m = this._make(d);
    m.name = key;
    this.cache.set(key, m);
    return m;
  }

  _make(d) {
    const noise = noiseTextures();
    const nz = (m, n = 0.12) => {
      m.roughnessMap = this._rep(noise.roughnessMap, NOISE_MM);
      m.normalMap = this._rep(noise.normalMap, NOISE_MM);
      m.normalScale = new THREE.Vector2(n, n);
      return m;
    };
    switch (d.t) {
      case 'wood': {
        const t = woodTextures(d);
        const R = (k) => this._rep(t[k], WOOD_MM[0], WOOD_MM[1]);
        return withIbl(new THREE.MeshPhysicalMaterial({
          map: R('map'), roughnessMap: R('roughnessMap'), normalMap: R('normalMap'), normalScale: new THREE.Vector2(0.35, 0.35),
          roughness: 0.78, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.5, vertexColors: false,
        }));
      }
      case 'paint':
        return withIbl(nz(new THREE.MeshPhysicalMaterial({ color: d.c, roughness: (d.rough ?? 0.42) + 0.12, metalness: 0, clearcoat: 0.22, clearcoatRoughness: 0.42 }), 0.1));
      case 'plastic':
        return withIbl(nz(new THREE.MeshPhysicalMaterial({ color: d.c, roughness: (d.rough ?? 0.38) + 0.1, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.35 }), 0.08));
      case 'metal': {
        const m = new THREE.MeshStandardMaterial({ color: d.c, metalness: 1, roughness: (d.rough ?? 0.2) + 0.06 });
        if (d.tex === 'galv') { const g = galvTextures(); m.map = this._rep(g.map, 180); m.roughnessMap = this._rep(g.roughnessMap, 180); }
        else nz(m, 0.05);
        return withIbl(m);
      }
      case 'coat':
        return withIbl(nz(new THREE.MeshStandardMaterial({ color: d.c, metalness: 0.15, roughness: (d.rough ?? 0.5) + 0.08 }), 0.2));
      case 'glass':
        if (this.cutout) {
          return withIbl(new THREE.MeshPhysicalMaterial({ color: d.c, transparent: true, opacity: d.op ?? 0.2, roughness: 0.04, metalness: 0, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6 }));
        }
        return withIbl(new THREE.MeshPhysicalMaterial({
          color: d.op ? d.c : '#ffffff', transmission: d.op ? 0.72 : 0.94, thickness: 14, ior: 1.5, roughness: 0.02, metalness: 0,
          attenuationColor: new THREE.Color(d.op ? d.c : '#bfe0d2'), attenuationDistance: d.op ? 60 : 90, envMapIntensity: 2.2, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.02,
        }));
      case 'mirror':
        return withIbl(new THREE.MeshStandardMaterial({ color: d.c, metalness: 1, roughness: 0.03, envMapIntensity: 1.25 }));
      case 'fabric': {
        const t = fabricTextures(!!d.fine), mm = d.fine ? 40 : FABRIC_MM;
        const col = new THREE.Color(d.c);
        return withIbl(new THREE.MeshPhysicalMaterial({
          color: d.c, map: this._rep(t.map, mm), normalMap: this._rep(t.normalMap, mm), normalScale: new THREE.Vector2(d.fine ? 0.3 : 0.65, d.fine ? 0.3 : 0.65),
          roughness: 0.96, metalness: 0, sheen: 0.7, sheenRoughness: 0.55, sheenColor: col.clone().lerp(new THREE.Color('#ffffff'), 0.45),
        }));
      }
      case 'leather':
        return withIbl(nz(new THREE.MeshPhysicalMaterial({ color: d.c, roughness: 0.5, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.5 }), 0.5));
      case 'mesh': {
        const t = fabricTextures(true);
        return withIbl(new THREE.MeshStandardMaterial({ color: d.c, map: this._rep(t.map, 30), normalMap: this._rep(t.normalMap, 30), roughness: 0.9, transparent: true, opacity: 0.9 }));
      }
      case 'paper': {
        const m = new THREE.MeshPhysicalMaterial({ color: d.c, roughness: 0.92, side: THREE.DoubleSide, emissive: WARM, emissiveIntensity: 0, sheen: 0.3, sheenColor: new THREE.Color('#fff8ea') });
        this.glow.push({ m, i: 0.85 });
        m.emissiveIntensity = this.lampOn ? 0.85 : 0;
        return withIbl(m);
      }
      case 'opal': {
        const m = new THREE.MeshPhysicalMaterial({ color: d.c, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2, emissive: WARM, emissiveIntensity: 0 });
        this.glow.push({ m, i: 1.5 });
        m.emissiveIntensity = this.lampOn ? 1.5 : 0;
        return withIbl(m);
      }
      case 'pegboard':
        return withIbl(new THREE.MeshStandardMaterial({ map: this._rep(pegboardTexture(d.c), PEG_MM), roughness: 0.62 }));
      case 'emit':
        return new THREE.MeshBasicMaterial({ color: new THREE.Color(d.c).multiplyScalar(1.6) });
      default:
        return withIbl(new THREE.MeshStandardMaterial({ color: d.c || '#cccccc', roughness: 0.6 }));
    }
  }

  dispose() {
    for (const m of this.cache.values()) m.dispose();
    for (const t of this.reps.values()) t.dispose();
    this.cache.clear();
    this.reps.clear();
    this.glow = [];
  }
}

export { withIbl };
