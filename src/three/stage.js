// stage.js — 실사 3D 스테이지.
// 움직이는 동안은 1샘플로 빠르게 그리고, 멈추면 조명과 카메라를 미세하게 흔든 샘플을 누적해
// 면광원 그림자·주변광 차폐·안티에일리어싱이 수렴된 스튜디오 사진 같은 정지 화면을 만든다.

import * as THREE from '../../vendor/three.module.min.js';
import { MaterialLib, patchShaderChunks, iblDiffuse, withIbl } from './materials.js';
import { partGeometry, edgeGeometry, draftGeometry } from './meshes.js';
import { cuttingMatTexture, rulerTexture, MAT_MM } from './textures.js';
import { materialKey } from '../data/materials.js';
import { mergedGroup, decorGroup } from './merge.js';
import { RealAssets } from './real.js';
import { itemRoom } from '../data/rooms.js';
import { styleModel } from '../core/styling.js';

const D2R = Math.PI / 180;
const FS_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const PRESENT_FRAG = `
uniform sampler2D tA; uniform sampler2D tB; uniform sampler2D tL;
uniform float uMix; uniform float uSplit; uniform float uExposure; uniform float uVignette; uniform float uOpaque;
varying vec2 vUv;
vec3 neutral(vec3 color){
  const float sc = 0.76; const float ds = 0.15;
  float x = min(color.r, min(color.g, color.b));
  float off = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= off;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < sc) return color;
  float d = 1.0 - sc;
  float np = 1.0 - d * d / (peak + d - sc);
  color *= np / peak;
  float g = 1.0 - 1.0 / (ds * (peak - np) + 1.0);
  return mix(color, vec3(np), g);
}
vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0/2.4)) - 0.055, step(vec3(0.0031308), c)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec4 a = texture2D(tA, vUv); vec4 b = texture2D(tB, vUv);
  vec4 c = mix(a, b, uMix);
  float al = mix(c.a, 1.0, uOpaque);
  vec3 col = c.a > 0.0001 ? c.rgb / max(c.a, 0.0001) : vec3(0.0);
  col = neutral(col * uExposure);
  col = pow(col, vec3(1.04));
  vec2 q = vUv - 0.5;
  col *= 1.0 - uVignette * dot(q, q) * 1.5;
  col = srgb(col) + (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  vec4 photo = vec4(col * al, al);
  if (uSplit > 0.0 && vUv.x < uSplit) {
    vec4 l = texture2D(tL, vUv);
    photo = vec4(srgb(l.rgb), 1.0);
  }
  gl_FragColor = photo;
}`;
const OUTLINE_VERT = 'uniform float uT; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uT, 1.0); }';
const OUTLINE_FRAG = 'uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor, 1.0); }';

const VIEWS = { iso: [35, 66], front: [0, 86], side: [90, 86], back: [180, 80], top: [0, 3], hero: [-32, 72] };
const LINE_THEMES = {
  blueprint: { bg: '#143d68', fill: '#1a4a7c', line: '#eaf3fb' },
  paper: { bg: '#f4f5f2', fill: '#fbfbf9', line: '#18221e' },
  night: { bg: '#0f1a16', fill: '#14231d', line: '#bfe3d3' },
};

// 스튜디오 조명 배치. 환경맵(반사)과 누적 렌더의 면광원 표본이 같은 표를 쓴다.
const ENV_INTENSITY = 1.1;
const SOFTBOXES = [
  { name: 'key', size: [5.5, 5.5], pos: [-10, 11, 9], color: '#fff7ee', k: 14 },
  { name: 'fill', size: [12, 9], pos: [13, 5, 5], color: '#f1f5ff', k: 2.6 },
  { name: 'top', size: [14, 14], pos: [0, 16, 0], color: '#ffffff', k: 3.2 },
  { name: 'rim', size: [3.5, 12], pos: [7, 8, -13], color: '#ffffff', k: 7 },
];
const ROOM_L = 0.057;

/** 소프트박스 스튜디오를 PMREM 환경맵으로 굽는다(렌더러마다 하나씩 필요). */
export function studioEnv(renderer) {
  const s = new THREE.Scene();
  const mk = (w, h, color, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 1.5, 0); s.add(m);
  };
  s.add(new THREE.Mesh(new THREE.BoxGeometry(60, 36, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(ROOM_L, ROOM_L * 1.04, ROOM_L * 1.07), side: THREE.BackSide })));
  for (const b of SOFTBOXES) mk(b.size[0], b.size[1], b.color, b.k, b.pos);
  mk(40, 40, '#ffffff', 0.42, [0, -6, 0]); // 바닥 반사
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.02);
  pm.dispose();
  s.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt;
}
export const ENV_LEVEL = ENV_INTENSITY;
export const KEY_DIR = [-0.52, 0.62, 0.52];

function halton(i, b) { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function webglSupported() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

export class Stage {
  constructor(host, opts = {}) {
    patchShaderChunks();
    this.host = host;
    this.cutout = !!opts.cutout;
    this.maxSamples = opts.samples ?? 72;
    this.fov = opts.fov ?? 27;
    this.onHover = opts.onHover || null;
    this.onSelect = opts.onSelect || null;
    this.onFrame = opts.onFrame || null;
    this.interactive = opts.interactive !== false;
    this.sceneKind = opts.scene === 'room' ? 'room' : 'studio'; // 배경: 스튜디오(호리존) | 룸(벽·바닥·소품)
    this.roomWalls = []; this.styling = null; this.roomPlanes = null;

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve }));
    this.dpr = Math.min(opts.pixelRatio ?? window.devicePixelRatio ?? 1, opts.maxDpr ?? 2);
    r.setPixelRatio(1);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.shadowMap.autoUpdate = false;
    r.toneMapping = THREE.NoToneMapping;
    r.setClearColor(0x000000, 0);
    r.domElement.className = 'stage-canvas';
    r.domElement.setAttribute('role', 'img');
    host.appendChild(r.domElement);
    this.canvas = r.domElement;
    this.floatBlend = !!r.extensions.get('EXT_float_blend') && !!r.extensions.get('EXT_color_buffer_float');
    this.maxSamplesMS = Math.min(4, r.capabilities.maxSamples || 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.fov, 1, 10, 100000);
    this.root = new THREE.Group();
    this.lineRoot = new THREE.Group();
    this.props = new THREE.Group();
    this.lineRoot.visible = false;
    this.scene.add(this.root, this.lineRoot, this.props);
    this.lib = new MaterialLib({ cutout: this.cutout });
    // 실물 재질 사진·스캔 소품이 도착하면 다시 그린다
    const redraw = () => { this.shadowDirty = true; this.invalidate(); };
    this.lib.onChange = redraw; this._redraw = redraw;
    this.assets = new RealAssets({ hook: withIbl });
    this.meshes = new Map();
    this.R = 1000;
    this.center = new THREE.Vector3();
    this.theme = { bg: '#e9ecea', dark: false };
    this.lineTheme = 'blueprint';
    this.style = 'photo';
    this.split = 0;
    this.explode = 0; this.explodeGoal = 0;
    this.step = null; this.stepAnim = 1;
    this.showOpt = true;
    this.mini = false; this.N = 12;
    this.lamp = true;
    this.autoRotate = false;
    this.cam = { theta: 35 * D2R, phi: 66 * D2R, dist: 4000, target: new THREE.Vector3() };
    this.goal = { theta: this.cam.theta, phi: this.cam.phi, dist: 4000, target: new THREE.Vector3() };
    this.accum = { n: 0, idle: 0 };
    this.dirty = true; this.shadowDirty = true;
    this.running = false; this.visible = true; this.disposed = false;
    this.hoverId = null; this.selectedId = null;
    this.dimsOn = false;

    this._buildEnv();
    this._buildLights();
    this._buildGround();
    this._buildPost();
    this._buildDims();
    if (this.interactive) this._bindInput();
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(host);
    this._io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; if (this.visible) this.invalidate(); });
    this._io.observe(host);
    this.resize();
  }

  // ------------------------------------------------------------ setup
  _buildEnv() {
    // 누적 렌더용 로브: 방향, 퍼짐각, 수직 입사 조도(E = 휘도 × 입체각)
    const lobes = SOFTBOXES.map((b) => {
      const p = new THREE.Vector3(b.pos[0], b.pos[1] - 1.5, b.pos[2]), d2 = p.lengthSq();
      return { dir: p.clone().normalize(), spread: Math.atan(Math.max(b.size[0], b.size[1]) / 2 / Math.sqrt(d2)), E: ((b.k * b.size[0] * b.size[1]) / d2) * ENV_INTENSITY, color: new THREE.Color(b.color) };
    });
    lobes.push({ dir: null, spread: 0, E: 2 * Math.PI * ROOM_L * ENV_INTENSITY, color: new THREE.Color('#f4f7ff') });
    const total = lobes.reduce((a, l) => a + l.E, 0);
    let acc = 0;
    for (const l of lobes) { acc += l.E / total; l.cum = acc; }
    this.lobes = lobes; this.lobeTotal = total;
    this.envRT = studioEnv(this.renderer);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = ENV_INTENSITY;
  }

  _buildLights() {
    this.keyDir = new THREE.Vector3(-0.52, 0.62, 0.52).normalize();
    const k = (this.key = new THREE.DirectionalLight(0xfff6ec, 3.0));
    k.castShadow = true; k.shadow.mapSize.set(2048, 2048); k.shadow.bias = -0.0005; k.shadow.radius = 3.2;
    const d = (this.dome = new THREE.DirectionalLight(0xfafbff, 0));
    d.castShadow = true; d.shadow.mapSize.set(1024, 1024); d.shadow.bias = -0.0008; d.shadow.radius = 2;
    k.shadow.autoUpdate = false; d.shadow.autoUpdate = false;
    this.scene.add(k, k.target, d, d.target);
    // 카메라 쪽 정면 보조광(사진가의 반사판): 선반 안쪽처럼 깊은 곳이 까맣게 죽지 않게 한다.
    this.headE = 1.0;
    this.head = new THREE.DirectionalLight(0xffffff, this.headE);
    this.scene.add(this.head, this.head.target);
    this.lampLight = new THREE.PointLight(0xffd2a0, 0, 0, 2);
    this.scene.add(this.lampLight);
  }

  _buildGround() {
    if (this.cutout) {
      // 컷아웃: 그림자만 받는 바닥. 물체에서 멀어질수록 그림자를 부드럽게 지운다.
      const sm = new THREE.ShadowMaterial({ color: 0x0a0f0d, opacity: 0.62 });
      this.fade = { c: { value: new THREE.Vector2() }, r: { value: 1000 } };
      sm.onBeforeCompile = (sh) => {
        sh.uniforms.uFadeC = this.fade.c; sh.uniforms.uFadeR = this.fade.r;
        sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec2 vGround;\nvoid main() {\n\tvGround = (modelMatrix * vec4(position, 1.0)).xz;');
        sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'varying vec2 vGround;\nuniform vec2 uFadeC;\nuniform float uFadeR;\nvoid main() {')
          .replace('#include <tonemapping_fragment>', 'gl_FragColor.a *= smoothstep(uFadeR, uFadeR * 0.3, distance(vGround, uFadeC));\n\t#include <tonemapping_fragment>');
      };
      const g = (this.ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sm));
      g.rotation.x = -Math.PI / 2; g.receiveShadow = true;
      this.scene.add(g);
      return;
    }
    // 무한 호리존(cove): 바닥이 뒤에서 벽으로 말려 올라가는 스튜디오 배경
    const pts = [new THREE.Vector2(0.001, 0), new THREE.Vector2(7, 0)];
    for (let i = 1; i <= 14; i++) { const a = (i / 14) * Math.PI * 0.5; pts.push(new THREE.Vector2(7 + Math.sin(a) * 3, 3 - Math.cos(a) * 3)); }
    pts.push(new THREE.Vector2(10, 40));
    const geo = new THREE.LatheGeometry(pts, 96);
    this.coveMat = withIbl(new THREE.MeshStandardMaterial({ color: 0xd6d9d6, roughness: 0.96, metalness: 0, side: THREE.DoubleSide }));
    const g = (this.ground = new THREE.Mesh(geo, this.coveMat));
    g.receiveShadow = true;
    this.scene.add(g);
  }

  _buildPost() {
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.accumMat = new THREE.ShaderMaterial({
      uniforms: { tS: { value: null } }, vertexShader: FS_VERT,
      fragmentShader: 'uniform sampler2D tS; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tS, vUv); }',
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ConstantAlphaFactor, blendDst: THREE.OneMinusConstantAlphaFactor,
      blendSrcAlpha: THREE.ConstantAlphaFactor, blendDstAlpha: THREE.OneMinusConstantAlphaFactor, depthTest: false, depthWrite: false, transparent: true,
    });
    this.presentMat = new THREE.ShaderMaterial({
      uniforms: { tA: { value: null }, tB: { value: null }, tL: { value: null }, uMix: { value: 0 }, uSplit: { value: 0 }, uExposure: { value: 1.0 }, uVignette: { value: this.cutout ? 0 : 0.22 }, uOpaque: { value: this.cutout ? 0 : 1 } },
      vertexShader: FS_VERT, fragmentShader: PRESENT_FRAG, depthTest: false, depthWrite: false, transparent: false, blending: THREE.NoBlending,
    });
    this.postQuad = new THREE.Mesh(tri, this.presentMat);
    this.postQuad.frustumCulled = false;
    this.postScene = new THREE.Scene();
    this.postScene.add(this.postQuad);
    this.outlineMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 1 }, uColor: { value: new THREE.Color('#eaf3fb') } }, vertexShader: OUTLINE_VERT, fragmentShader: OUTLINE_FRAG, side: THREE.BackSide });
    this.glassEdge = new THREE.LineBasicMaterial({ color: '#8fb8a8', transparent: true, opacity: 0.75 });
    this.fillMat = new THREE.MeshBasicMaterial({ color: '#1a4a7c', polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    this.lineMat = new THREE.LineBasicMaterial({ color: '#eaf3fb' });
    this.hiMat = new THREE.MeshBasicMaterial({ color: '#f4c430', transparent: true, opacity: 0.34, depthFunc: THREE.LessEqualDepth, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.stepMat = new THREE.MeshBasicMaterial({ color: '#f4c430', transparent: true, opacity: 0.2, depthFunc: THREE.LessEqualDepth, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  }

  _targets(w, h) {
    const type = THREE.HalfFloatType, ms = this.maxSamplesMS;
    for (const k of ['rtA', 'rtS', 'rtB', 'rtL']) if (this[k]) this[k].dispose();
    this.rtA = new THREE.WebGLRenderTarget(w, h, { type, samples: ms, depthBuffer: true });
    this.rtS = new THREE.WebGLRenderTarget(w, h, { type, samples: 0, depthBuffer: true });
    this.rtB = new THREE.WebGLRenderTarget(w, h, { type: this.floatBlend ? THREE.FloatType : type, depthBuffer: false });
    this.rtL = new THREE.WebGLRenderTarget(w, h, { samples: ms, depthBuffer: true });
  }

  _buildDims() {
    this.dimLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#f4c430', depthTest: false, transparent: true }));
    this.dimLines.renderOrder = 999; this.dimLines.visible = false; this.dimLines.frustumCulled = false;
    this.scene.add(this.dimLines);
    this.labelBox = document.createElement('div');
    this.labelBox.className = 'stage-labels';
    this.host.appendChild(this.labelBox);
    this.dimLabels = [];
  }

  // ------------------------------------------------------------ public state
  setTheme(theme) {
    this.theme = { ...this.theme, ...theme };
    if (this.coveMat) this.coveMat.color.set(this.theme.cove || (this.theme.dark ? '#2a2f2d' : '#d6d9d6'));
    this.invalidate();
  }

  setLineTheme(name) {
    this.lineTheme = LINE_THEMES[name] ? name : 'blueprint';
    const t = LINE_THEMES[this.lineTheme];
    this.fillMat.color.set(t.fill); this.lineMat.color.set(t.line); this.outlineMat.uniforms.uColor.value.set(t.line);
    this.invalidate();
  }

  setModel(model, finish, { keepView = false } = {}) {
    this._clearModel();
    this.model = model; this.finish = finish;
    const bb = model.bbox;
    for (const p of model.parts) {
      const geo = partGeometry(p);
      const mat = this.lib.get(materialKey(p.role, finish));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
      const glass = mat.transmission > 0 || (mat.transparent && mat.opacity < 0.6);
      mesh.castShadow = !glass && p.role !== 'opal' && p.role !== 'paper' && p.role !== 'shade';
      mesh.receiveShadow = true;
      mesh.userData.part = p;
      if (mat.transparent) mesh.renderOrder = 2;
      if (p.role === 'glass') {
        const ed = new THREE.LineSegments(edgeGeometry(p), this.glassEdge);
        ed.userData.overlay = true; ed.renderOrder = 3;
        mesh.add(ed);
      }
      this.root.add(mesh);
      this.meshes.set(p.id, mesh);
    }
    // 프레이밍: 선택 부품(침구 등) 포함 전체 경계
    const min = new THREE.Vector3(Infinity, Infinity, Infinity), max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const p of model.parts) { min.min(new THREE.Vector3(...p.bb.min)); max.max(new THREE.Vector3(...p.bb.max)); }
    this.bbMin = min; this.bbMax = max;
    this.center.copy(min).add(max).multiplyScalar(0.5);
    this.R = Math.max(120, min.distanceTo(max) / 2);
    this.span = Math.max(bb.size[0], bb.size[1], bb.size[2]);
    this._lamp();
    this._layoutSet();
    this._applyVisibility();
    this._applyOffsets(true);
    if (!keepView) this.fit(true);
    this._lineBuilt = false;
    if (this.style !== 'photo' || this.split > 0) this._buildLines();
    this._dimsGeometry();
    this.shadowDirty = true;
    this.invalidate();
  }

  setFinish(finish) {
    this.finish = finish;
    for (const [, mesh] of this.meshes) {
      const p = mesh.userData.part, mat = this.lib.get(materialKey(p.role, finish));
      mesh.material = mat;
      const glass = mat.transmission > 0 || (mat.transparent && mat.opacity < 0.6);
      mesh.castShadow = !glass && p.role !== 'opal' && p.role !== 'paper' && p.role !== 'shade';
    }
    if (this.roomOn) this._layoutSet(); // 벽 색과 쿠션 색은 마감을 따라간다
    this.shadowDirty = true;
    this.invalidate();
  }

  /** 룸 배경이 실제로 켜져 있는가(컷아웃·미니어처 보기에서는 쓰지 않는다). */
  get roomOn() { return !this.cutout && !this.mini && this.sceneKind === 'room' && !!this.model; }

  /** 룸을 지금 그리는가: 분해·조립 중에는 부품이 벽을 뚫지 않게 스튜디오 배경으로 돌아간다. */
  get roomShown() { return this.roomOn && this.explode < 0.02 && this.explodeGoal < 0.02 && this.step == null; }

  /** 배경을 바꾼다: 'studio' = 무한 호리존, 'room' = 벽·바닥·소품이 있는 방 한 귀퉁이. */
  setScene(kind) {
    this.sceneKind = kind === 'room' ? 'room' : 'studio';
    if (!this.model) return;
    this._layoutSet();
    this.fit(false, true);
    this.shadowDirty = true;
    this.invalidate();
  }

  setMini(on, N = this.N) {
    this.mini = !!on; this.N = N;
    if (this.autoDof !== false) this.dof = this.mini ? 0.007 : 0;
    this._layoutSet();
    this._dimsText();
    this.shadowDirty = true;
    this.invalidate();
  }

  setExplode(t, animate = true) {
    this.explodeGoal = Math.max(0, Math.min(1, t));
    if (!animate) { this.explode = this.explodeGoal; this._applyOffsets(); }
    this.invalidate();
  }

  setStep(n) {
    this.step = n == null ? null : n;
    this.stepAnim = 0;
    this._applyVisibility();
    this.invalidate();
  }

  setShowOptional(v) { this.showOpt = !!v; this._applyVisibility(); this.shadowDirty = true; this.invalidate(); }

  setLamp(on) { this.lamp = !!on; this.lib.setLamp(this.lamp); this._lamp(); this.invalidate(); }

  setStyle(style) {
    this.style = style === 'line' ? 'line' : 'photo';
    if (this.style === 'line') this._buildLines();
    this.invalidate();
  }

  /** 0 = 실사만, 0~1 = 왼쪽을 도면선으로 보여 주는 분할 위치. */
  setSplit(f) {
    this.split = Math.max(0, Math.min(1, f || 0));
    if (this.split > 0) this._buildLines();
    this.invalidate();
  }

  setDims(show) {
    this.dimsOn = !!show;
    this.dimLines.visible = this.dimsOn;
    this.labelBox.hidden = !this.dimsOn;
    this._dimsText();
    this.invalidate();
  }

  highlight(id) {
    if (this.selectedId === id) return;
    this._hi(this.selectedId, false, 'sel');
    this.selectedId = id || null;
    this._hi(this.selectedId, true, 'sel');
    this.invalidate();
  }

  setView(name, animate = true) {
    const v = VIEWS[name] || VIEWS.iso;
    this.goal.theta = v[0] * D2R; this.goal.phi = v[1] * D2R;
    // 가장 가까운 회전 방향으로
    while (this.goal.theta - this.cam.theta > Math.PI) this.goal.theta -= Math.PI * 2;
    while (this.goal.theta - this.cam.theta < -Math.PI) this.goal.theta += Math.PI * 2;
    this.fit(!animate, true);
    this.invalidate();
  }

  fit(instant = false, keepAngles = false) {
    const asp = this.camera.aspect || 1, half = (this.fov * D2R) / 2;
    const hfov = Math.atan(Math.tan(half) * asp);
    const ext = 1 + this.explodeGoal * 0.75;
    // 룸 배경에서는 주변이 보이게 조금 물러서고, 아주 작은 가구는 놓인 자리(콘솔·벽)까지 담는다
    const room = this.roomOn, Rf = room ? Math.max(this.R, 560) : this.R;
    const dist = (Rf * ext * (this.fitScale ?? (room ? 1.34 : 1.12))) / Math.sin(Math.min(half, hfov));
    this.goal.dist = dist;
    this.goal.target.copy(this.center);
    if (!keepAngles && instant) { this.goal.theta = this.cam.theta; this.goal.phi = this.cam.phi; }
    if (instant) { this.cam.dist = dist; this.cam.target.copy(this.center); this.cam.theta = this.goal.theta; this.cam.phi = this.goal.phi; }
    this.invalidate();
  }

  // ------------------------------------------------------------ internals
  _clearModel() {
    for (const [, mesh] of this.meshes) { mesh.geometry.dispose(); this.root.remove(mesh); }
    this.meshes.clear();
    for (const o of [...this.lineRoot.children]) { o.traverse((c) => { if (c.geometry && !c.userData.shared) c.geometry.dispose(); }); this.lineRoot.remove(o); }
    this.hoverId = null; this.selectedId = null;
  }

  _buildLines() {
    if (this._lineBuilt || !this.model) return;
    this._lineBuilt = true;
    for (const p of this.model.parts) {
      const g = new THREE.Group();
      g.position.set(p.pos[0], p.pos[1], p.pos[2]);
      g.add(new THREE.Mesh(draftGeometry(p), this.fillMat));
      g.add(new THREE.LineSegments(edgeGeometry(p), this.lineMat));
      const hull = new THREE.Mesh(this.meshes.get(p.id).geometry, this.outlineMat);
      hull.userData.shared = true;
      g.add(hull);
      g.userData.part = p;
      this.lineRoot.add(g);
    }
    this._applyVisibility();
    this._applyOffsets(true);
  }

  _lamp() {
    const glowPart = this.model && this.model.parts.find((p) => p.glow);
    if (glowPart && this.lamp) {
      this.lampLight.position.set(glowPart.center[0], glowPart.center[1], glowPart.center[2]);
      this.lampLight.intensity = this.R * this.R * 2.2;
    } else this.lampLight.intensity = 0;
  }

  _layoutSet() {
    for (const o of [...this.props.children]) {
      o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (!c.userData.libMat) for (const m of [].concat(c.material || [])) m.dispose(); });
      this.props.remove(o);
    }
    this.roomWalls = []; this.styling = null; this.roomPlanes = null;
    const R = this.R;
    if (this.cutout) {
      this.ground.scale.set(R * 14, R * 14, 1);
      this.ground.position.set(this.center.x, 0, this.center.z);
      const fr = Math.hypot(this.bbMax.x - this.bbMin.x, this.bbMax.z - this.bbMin.z) / 2;
      this.fade.c.value.set(this.center.x, this.center.z);
      this.fade.r.value = fr * 1.5 + (this.bbMax.y - this.bbMin.y) * 0.35;
      return;
    }
    if (this.roomOn) {
      this._buildRoom();
      // 분해·조립 때 돌아갈 스튜디오 호리존도 이 모델 크기에 맞춰 둔다
      this.ground.scale.setScalar(R); this.ground.position.set(this.center.x, 0, this.center.z);
      return;
    }
    let floorY = 0;
    if (this.mini && this.model) {
      // 커팅 매트 위의 미니어처: 소품은 N배로 키워 실물 크기 비례를 맞춘다.
      const N = this.N, fw = (this.bbMax.x - this.bbMin.x) / N, fd = (this.bbMax.z - this.bbMin.z) / N;
      const k = fw > 330 || fd > 210 ? (fw > 520 || fd > 340 ? 2.4 : 1.6) : 1;
      const mw = MAT_MM[0] * k * N, md = MAT_MM[1] * k * N, mt = 3 * N;
      const tex = cuttingMatTexture();
      const top = withIbl(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86 }));
      const edge = withIbl(new THREE.MeshStandardMaterial({ color: '#27594a', roughness: 0.9 }));
      const mat = new THREE.Mesh(new THREE.BoxGeometry(mw, mt, md), [edge, edge, top, edge, edge, edge]);
      mat.position.set(this.center.x, -mt / 2, this.center.z + md * 0.06);
      mat.receiveShadow = true; mat.castShadow = true;
      this.props.add(mat);
      floorY = -mt;
      // 15cm 쇠자
      const ruler = new THREE.Mesh(new THREE.BoxGeometry(160 * N, 0.8 * N, 20 * N), [edge, edge, withIbl(new THREE.MeshStandardMaterial({ map: rulerTexture(), metalness: 0.85, roughness: 0.36 })), edge, edge, edge].map((m, i) => (i === 2 ? m : withIbl(new THREE.MeshStandardMaterial({ color: '#b9bcbf', metalness: 0.9, roughness: 0.35 })))));
      ruler.position.set(this.center.x - mw * 0.2, 0.4 * N, this.bbMax.z + Math.min(md * 0.2, 34 * N));
      ruler.rotation.y = 0.07; ruler.castShadow = true; ruler.receiveShadow = true;
      this.props.add(ruler);
      // 500원 동전(지름 26.5mm)
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(13.25 * N, 13.25 * N, 2 * N, 64), withIbl(new THREE.MeshStandardMaterial({ color: '#c9cbcc', metalness: 1, roughness: 0.32 })));
      coin.position.set(this.bbMax.x + Math.min(mw * 0.12, 30 * N), 1 * N, this.bbMax.z + 8 * N);
      coin.castShadow = true; coin.receiveShadow = true;
      this.props.add(coin);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(12.2 * N, 0.5 * N, 8, 64), coin.material);
      rim.rotation.x = Math.PI / 2; rim.position.copy(coin.position); rim.position.y = 2 * N;
      this.props.add(rim);
    }
    this.ground.scale.setScalar(R * (this.mini ? 1.5 : 1));
    this.ground.position.set(this.center.x, floorY, this.center.z);
  }

  /** 룸 배경: 바닥·벽(그림자를 받기만 함)·방 소품·가구 스타일링 소품. */
  _buildRoom() {
    const item = this.model.item, spec = itemRoom(item, this.model, { finish: this.finish });
    const add = (parts, cast) => { const g = decorGroup(parts, this.lib, this.assets, { detail: 1, cast, onReady: this._redraw }); this.props.add(g); return g; };
    add([spec.floor], false);
    for (const w of spec.walls) {
      const g = new THREE.Group();
      this.props.add(g);
      g.add(mergedGroup([w.part], this.lib, { detail: 1, cast: false }), decorGroup(w.decor, this.lib, this.assets, { detail: 1, onReady: this._redraw }));
      this.roomWalls.push({ name: w.name, group: g });
    }
    add(spec.base, true);
    const sp = styleModel(item, this.model, { finish: this.finish });
    if (sp.length) this.styling = add(sp, true);
    this.roomPlanes = spec.planes;
  }

  _applyVisibility() {
    const vis = (p) => (this.showOpt || !p.opt) && (this.step == null || p.step <= this.step);
    for (const [, mesh] of this.meshes) {
      const p = mesh.userData.part;
      mesh.visible = vis(p);
      const cur = this.step != null && p.step === this.step && !p.opt;
      this._hi(p.id, cur, 'step');
    }
    for (const g of this.lineRoot.children) g.visible = vis(g.userData.part);
    this.shadowDirty = true;
  }

  _hi(id, on, kind) {
    const mesh = id && this.meshes.get(id);
    if (!mesh) return;
    const key = `_${kind}`;
    if (on && !mesh.userData[key]) {
      const o = new THREE.Mesh(mesh.geometry, kind === 'step' ? this.stepMat : this.hiMat);
      o.renderOrder = 5; o.userData.overlay = true;
      mesh.add(o); mesh.userData[key] = o;
    } else if (!on && mesh.userData[key]) { mesh.remove(mesh.userData[key]); mesh.userData[key] = null; }
  }

  _applyOffsets() {
    if (!this.model) return;
    const E = this.span * 0.5, t = ease(this.explode);
    const steps = this.model.steps.length || 1;
    const sAnim = this.step != null ? 1 - ease(Math.min(1, this.stepAnim)) : 0;
    const place = (obj, p) => {
      const k = t * (0.55 + 0.45 * (p.step / steps));
      let ox = p.ex[0] * E * k, oy = p.ex[1] * E * k, oz = p.ex[2] * E * k;
      if (sAnim > 0 && p.step === this.step) { ox += p.ex[0] * E * 0.7 * sAnim; oy += (p.ex[1] * E * 0.7 + E * 0.12) * sAnim; oz += p.ex[2] * E * 0.7 * sAnim; }
      obj.position.set(p.pos[0] + ox, p.pos[1] + oy, p.pos[2] + oz);
    };
    for (const [, mesh] of this.meshes) place(mesh, mesh.userData.part);
    for (const g of this.lineRoot.children) place(g, g.userData.part);
    this.shadowDirty = true;
  }

  _dimsGeometry() {
    if (!this.model) return;
    const b = this.model.bbox, [x0, y0, z0] = b.min, [x1, y1, z1] = b.max, o = this.span * 0.06, tk = this.span * 0.018;
    const P = [];
    const seg = (a, c) => P.push(...a, ...c);
    // 폭: 앞쪽 바닥
    seg([x0, y0, z1 + o], [x1, y0, z1 + o]); seg([x0, y0, z1 + o - tk], [x0, y0, z1 + o + tk]); seg([x1, y0, z1 + o - tk], [x1, y0, z1 + o + tk]);
    // 깊이: 오른쪽 바닥
    seg([x1 + o, y0, z0], [x1 + o, y0, z1]); seg([x1 + o - tk, y0, z0], [x1 + o + tk, y0, z0]); seg([x1 + o - tk, y0, z1], [x1 + o + tk, y0, z1]);
    // 높이: 왼쪽 앞 모서리
    seg([x0 - o, y0, z1], [x0 - o, y1, z1]); seg([x0 - o - tk, y0, z1], [x0 - o + tk, y0, z1]); seg([x0 - o - tk, y1, z1], [x0 - o + tk, y1, z1]);
    this.dimLines.geometry.dispose();
    this.dimLines.geometry = new THREE.BufferGeometry();
    this.dimLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    this.dimAnchors = [new THREE.Vector3((x0 + x1) / 2, y0, z1 + o), new THREE.Vector3(x1 + o, y0, (z0 + z1) / 2), new THREE.Vector3(x0 - o, (y0 + y1) / 2, z1)];
    this.labelBox.innerHTML = '';
    this.dimLabels = ['폭', '깊이', '높이'].map(() => { const el = document.createElement('span'); el.className = 'stage-dim'; this.labelBox.appendChild(el); return el; });
    this.labelBox.hidden = !this.dimsOn;
    this._dimsText();
  }

  _dimsText() {
    if (!this.model || !this.dimLabels.length) return;
    const s = this.model.bbox.size, vals = [s[0], s[2], s[1]], names = ['폭', '깊이', '높이'];
    const f = (v) => { const r = Math.round(v * 10) / 10; return Number.isInteger(r) ? String(r) : r.toFixed(1); };
    this.dimLabels.forEach((el, i) => {
      el.textContent = this.mini ? `${names[i]} ${f(vals[i] / this.N)} mm` : `${names[i]} ${f(vals[i] / 10)} cm`;
    });
  }

  /** 분해했을 때 부품에 붙는 라벨. items = [{ id, text }] */
  setCallouts(items) {
    if (!this.callBox) { this.callBox = document.createElement('div'); this.callBox.className = 'stage-labels'; this.host.appendChild(this.callBox); }
    this.callBox.innerHTML = '';
    this.calls = (items || []).map((it) => { const el = document.createElement('span'); el.className = 'stage-call'; el.textContent = it.text; this.callBox.appendChild(el); return { id: it.id, el }; });
    this.invalidate();
  }

  _placeLabels() {
    if (this.calls && this.calls.length) {
      const w = this.host.clientWidth, h = this.host.clientHeight, v = new THREE.Vector3(), on = this.explode > 0.4 && this.style !== 'line';
      for (const c of this.calls) {
        const mesh = this.meshes.get(c.id);
        if (!on || !mesh || !mesh.visible) { c.el.style.opacity = '0'; continue; }
        const p = mesh.userData.part;
        v.set(mesh.position.x - p.pos[0] + p.center[0], mesh.position.y - p.pos[1] + p.center[1], mesh.position.z - p.pos[2] + p.center[2]).project(this.camera);
        c.el.style.transform = `translate(-50%,-50%) translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
        c.el.style.opacity = String(Math.min(1, (this.explode - 0.4) * 3.5));
      }
    }
    if (!this.dimsOn || !this.dimAnchors) return;
    const w = this.host.clientWidth, h = this.host.clientHeight, v = new THREE.Vector3();
    this.dimLabels.forEach((el, i) => {
      v.copy(this.dimAnchors[i]).project(this.camera);
      el.style.transform = `translate(-50%,-50%) translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
      el.style.opacity = v.z < 1 ? '1' : '0';
    });
  }

  // ------------------------------------------------------------ input
  _bindInput() {
    const el = this.canvas, ptrs = new Map();
    let last = null, moved = 0, pinch = 0;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      last = [e.clientX, e.clientY]; moved = 0;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
    });
    el.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) { if (e.pointerType === 'mouse') this._hover(e); return; }
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch > 0) this.goal.dist = Math.max(this.R * 0.9, Math.min(this.R * 14, this.goal.dist * (pinch / d)));
        pinch = d; this.invalidate();
        return;
      }
      const dx = e.clientX - last[0], dy = e.clientY - last[1];
      last = [e.clientX, e.clientY]; moved += Math.abs(dx) + Math.abs(dy);
      if (e.buttons === 2 || e.shiftKey) {
        const s = (this.cam.dist * Math.tan((this.fov * D2R) / 2) * 2) / this.host.clientHeight;
        const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
        this.goal.target.addScaledVector(right, -dx * s).addScaledVector(up, dy * s);
      } else {
        this.goal.theta -= dx * 0.0062;
        this.goal.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, this.goal.phi - dy * 0.005));
      }
      this.autoRotate = false;
      this.invalidate();
    });
    const up = (e) => {
      ptrs.delete(e.pointerId); pinch = 0;
      if (moved < 5 && e.type === 'pointerup') { const p = this.pick(e.clientX, e.clientY); if (this.onSelect) this.onSelect(p); }
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', () => { if (this.hoverId) { this._hi(this.hoverId, false, 'hov'); this.hoverId = null; if (this.onHover) this.onHover(null); this.invalidate(); } });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.goal.dist = Math.max(this.R * 0.9, Math.min(this.R * 14, this.goal.dist * Math.exp(e.deltaY * 0.0011)));
      this.invalidate();
    }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.tabIndex = 0;
    el.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowLeft') this.goal.theta -= 0.18; else if (k === 'ArrowRight') this.goal.theta += 0.18;
      else if (k === 'ArrowUp') this.goal.phi = Math.max(0.05, this.goal.phi - 0.12); else if (k === 'ArrowDown') this.goal.phi = Math.min(Math.PI / 2 - 0.02, this.goal.phi + 0.12);
      else if (k === '+' || k === '=') this.goal.dist = Math.max(this.R * 0.9, this.goal.dist * 0.88); else if (k === '-') this.goal.dist = Math.min(this.R * 14, this.goal.dist * 1.14);
      else if (k === '0') { this.setView('iso'); return; } else return;
      e.preventDefault(); this.autoRotate = false; this.invalidate();
    });
    el.addEventListener('dblclick', () => { this.setView('iso'); });
  }

  _hover(e) {
    if (!this.onHover) return;
    const p = this.pick(e.clientX, e.clientY), id = p ? p.id : null;
    if (id === this.hoverId) { if (p) this.onHover(p, e); return; }
    this._hi(this.hoverId, false, 'hov');
    this.hoverId = id;
    this._hi(id, true, 'hov');
    this.onHover(p, e);
    this.invalidate();
  }

  pick(cx, cy) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -(((cy - r.top) / r.height) * 2 - 1));
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, this.camera);
    const hits = rc.intersectObjects([...this.meshes.values()].filter((m) => m.visible), false);
    return hits.length ? hits[0].object.userData.part : null;
  }

  // ------------------------------------------------------------ loop
  invalidate() {
    this.dirty = true;
    if (!this.running && !this.disposed && !this.frozen) { this.running = true; this._last = performance.now(); requestAnimationFrame((t) => this._tick(t)); }
  }

  resize() {
    const w = Math.max(2, this.host.clientWidth), h = Math.max(2, this.host.clientHeight);
    const pw = Math.round(w * this.dpr), ph = Math.round(h * this.dpr);
    if (pw === this.pw && ph === this.ph) return;
    this.pw = pw; this.ph = ph;
    this.renderer.setSize(pw, ph, false);
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this._targets(pw, ph);
    if (this.model) this.fit(true, true);
    this.invalidate();
  }

  _updateCamera(dt) {
    const c = this.cam, g = this.goal, k = 1 - Math.exp(-dt * 11);
    if (this.autoRotate) g.theta += dt * 0.25;
    let moving = false;
    for (const key of ['theta', 'phi', 'dist']) { const d = g[key] - c[key]; if (Math.abs(d) > (key === 'dist' ? this.R * 0.0006 : 0.0004)) { c[key] += d * k; moving = true; } else c[key] = g[key]; }
    if (c.target.distanceToSquared(g.target) > this.R * this.R * 1e-7) { c.target.lerp(g.target, k); moving = true; } else c.target.copy(g.target);
    this._placeCamera(0, 0);
    return moving || this.autoRotate;
  }

  _placeCamera() {
    const c = this.cam, sp = Math.sin(c.phi);
    this.camera.position.set(c.target.x + c.dist * sp * Math.sin(c.theta), c.target.y + c.dist * Math.cos(c.phi), c.target.z + c.dist * sp * Math.cos(c.theta));
    this.camera.near = Math.max(5, c.dist - this.R * 6); this.camera.far = c.dist + this.R * 60;
    this.camera.lookAt(c.target);
    this.head.position.copy(this.camera.position); this.head.target.position.copy(c.target);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  _lights(jitter, i) {
    const R = this.R * (1 + this.explode * 0.8), c = this.center, D = R * 6;
    const fitShadow = (L, dir, pad) => {
      L.position.copy(c).addScaledVector(dir, D);
      L.target.position.copy(c);
      const s = L.shadow.camera;
      s.left = -R * pad; s.right = R * pad; s.top = R * pad; s.bottom = -R * pad; s.near = D - R * 3; s.far = D + R * 5;
      s.updateProjectionMatrix();
      L.shadow.normalBias = R * 0.0035;
      L.shadow.needsUpdate = true;
    };
    const kd = this.keyDir.clone();
    if (jitter) {
      // 키 라이트를 면광원처럼: 지름 약 7° 원판 위에서 표본
      const a = halton(i, 2) * Math.PI * 2, r = Math.sqrt(halton(i, 3)) * 0.062;
      const t = new THREE.Vector3(0, 1, 0).cross(kd).normalize(), b = kd.clone().cross(t);
      kd.addScaledVector(t, Math.cos(a) * r).addScaledVector(b, Math.sin(a) * r).normalize();
      // 보조광: 소프트박스(와 방 전체)를 조도 비율대로 골라 그 면 위의 한 점을 표본한다.
      // 환경맵 확산광의 대부분을 그림자가 있는 빛으로 바꿔 주변광 차폐와 다중 반그림자를 얻는다.
      const keep = this.iblAccum ?? 0.3, envE = this.lobeTotal * (1 - keep), total = envE + this.headE;
      let pick = halton(i, 5) * total, lobe;
      const dd = new THREE.Vector3();
      if (pick < this.headE) {
        // 정면 보조광도 그림자가 있는 면광원으로
        lobe = { color: this.head.color };
        const cd = this.camera.position.clone().sub(c).normalize();
        const a2 = halton(i, 7) * Math.PI * 2, r2 = Math.sqrt(halton(i, 11)) * 0.5;
        const t2 = new THREE.Vector3(0, 1, 0).cross(cd).normalize(), b2 = cd.clone().cross(t2);
        dd.copy(cd).addScaledVector(t2, Math.cos(a2) * r2).addScaledVector(b2, Math.sin(a2) * r2).normalize();
        if (dd.y < 0.05) dd.y = 0.05;
      } else {
        pick = (pick - this.headE) / envE;
        lobe = this.lobes.find((l) => pick <= l.cum) || this.lobes[this.lobes.length - 1];
      }
      if (lobe.dir === undefined) { /* 정면 보조광: 방향 계산 끝 */ } else if (lobe.dir) {
        const a2 = halton(i, 7) * Math.PI * 2, r2 = Math.sqrt(halton(i, 11)) * Math.tan(lobe.spread);
        const t2 = new THREE.Vector3(0.3, 1, 0.2).cross(lobe.dir).normalize(), b2 = lobe.dir.clone().cross(t2);
        dd.copy(lobe.dir).addScaledVector(t2, Math.cos(a2) * r2).addScaledVector(b2, Math.sin(a2) * r2).normalize();
        if (dd.y < 0.06) dd.y = 0.06;
      } else {
        const u = 0.08 + 0.92 * halton(i, 7), ph = halton(i, 11) * Math.PI * 2, sr = Math.sqrt(1 - u * u);
        dd.set(Math.cos(ph) * sr, u, Math.sin(ph) * sr);
      }
      fitShadow(this.dome, dd.normalize(), this.roomShown ? 2.4 : 1.5);
      this.dome.color.copy(lobe.color);
      this.dome.intensity = total * (this.domeGain ?? 1);
      this.head.intensity = 0;
      iblDiffuse.value = keep;
      this.key.shadow.radius = 1.6;
    } else {
      if (this.cutout) fitShadow(this.dome, new THREE.Vector3(0.05, 1, 0.05).normalize(), 1.5);
      this.dome.intensity = 0;
      this.head.intensity = this.headE;
      iblDiffuse.value = 1;
      this.key.shadow.radius = 3.4;
    }
    fitShadow(this.key, kd, this.roomShown ? 2.6 : 1.6);
  }

  _renderScene(target, jitter, i) {
    const r = this.renderer;
    if (jitter) {
      this._viewOffset(halton(i + 1, 2) - 0.5, halton(i + 1, 3) - 0.5);
      if (this.dof > 0) {
        // 얇은 렌즈: 조리개 원판 위의 한 점에서 초점(타깃)을 바라본다 → 매크로 사진 같은 얕은 심도
        const a = halton(i, 13) * Math.PI * 2, rad = Math.sqrt(halton(i, 17)) * this.dof * this.cam.dist;
        const rt = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
        this.camera.position.addScaledVector(rt, Math.cos(a) * rad).addScaledVector(up, Math.sin(a) * rad);
        this.camera.lookAt(this.cam.target); this.camera.updateMatrixWorld();
      }
    } else this._viewOffset(0, 0);
    if (jitter || this.shadowDirty) { this._lights(jitter, i); r.shadowMap.needsUpdate = true; this.shadowDirty = jitter; }
    const room = this.roomShown;
    this.root.visible = true; this.lineRoot.visible = false; this.ground.visible = !room; this.props.visible = room || !this.roomOn;
    if (room) {
      // 카메라가 벽 뒤로 가면 그 벽은 감춘다
      const cp = this.camera.position;
      for (const w of this.roomWalls) w.group.visible = w.name === 'back' ? cp.z > this.roomPlanes.zb : cp.x > this.roomPlanes.xl;
    }
    this.dimLines.visible = this.dimsOn;
    if (this.cutout) { this.scene.background = null; r.setClearColor(0x000000, 0); }
    else { r.setClearColor(new THREE.Color(this.theme.dark ? '#1b1f1d' : '#dfe2df'), 1); }
    r.setRenderTarget(target);
    r.clear();
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
    if (jitter) { if (this.dof > 0) this._placeCamera(); this._viewOffset(0, 0); }
  }

  /** 모델을 화면 한쪽으로 밀어 그린다(글자와 겹치지 않게). viewShift = [가로, 세로] 비율. */
  _viewOffset(jx, jy) {
    const vs = this.viewShift;
    if (!vs && !jx && !jy) { this.camera.clearViewOffset(); return; }
    this.camera.setViewOffset(this.pw, this.ph, (vs ? -vs[0] * this.pw : 0) + jx, (vs ? -vs[1] * this.ph : 0) + jy, this.pw, this.ph);
  }

  _renderLines() {
    const r = this.renderer, t = LINE_THEMES[this.lineTheme];
    this.root.visible = false; this.lineRoot.visible = true; this.ground.visible = false; this.props.visible = false; this.dimLines.visible = this.dimsOn;
    this.outlineMat.uniforms.uT.value = ((this.cam.dist * Math.tan((this.fov * D2R) / 2) * 2) / this.ph) * 1.6 * this.dpr;
    r.setClearColor(new THREE.Color(t.bg), 1);
    r.setRenderTarget(this.rtL);
    r.clear();
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
    this.root.visible = true; this.lineRoot.visible = false; this.ground.visible = !this.roomShown; this.props.visible = this.roomShown || !this.roomOn;
  }

  _present() {
    const u = this.presentMat.uniforms, r = this.renderer;
    u.tA.value = this.rtA.texture; u.tB.value = this.rtB.texture; u.tL.value = this.rtL.texture;
    u.uMix.value = Math.max(0, Math.min(1, (this.accum.n - 3) / 9));
    u.uSplit.value = this.style === 'line' ? 1.01 : this.split;
    this.postQuad.material = this.presentMat;
    r.setRenderTarget(null);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(this.postScene, this.postCam);
    this._placeLabels();
    if (this.onFrame) this.onFrame(this);
  }

  _accumulate() {
    const n = ++this.accum.n, r = this.renderer;
    this._renderScene(this.rtS, true, n);
    this.accumMat.uniforms.tS.value = this.rtS.texture;
    this.accumMat.blendAlpha = 1 / n;
    this.postQuad.material = this.accumMat;
    const ac = r.autoClear; r.autoClear = false;
    r.setRenderTarget(this.rtB);
    r.render(this.postScene, this.postCam);
    r.setRenderTarget(null);
    r.autoClear = ac;
  }

  _tick(now) {
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this._last) / 1000 || 0.016);
    this._last = now;
    if (!this.visible || !this.model || this.frozen) { this.running = false; return; }
    let moving = this._updateCamera(dt);
    if (Math.abs(this.explodeGoal - this.explode) > 0.002) { this.explode += (this.explodeGoal - this.explode) * (1 - Math.exp(-dt * 7)); this._applyOffsets(); moving = true; }
    else if (this.explode !== this.explodeGoal) { this.explode = this.explodeGoal; this._applyOffsets(); moving = true; }
    if (this.step != null && this.stepAnim < 1) { this.stepAnim = Math.min(1, this.stepAnim + dt * 1.5); this._applyOffsets(); moving = true; }
    const needLines = this.style === 'line' || this.split > 0;
    if (moving || this.dirty) {
      this.dirty = false;
      this.accum.n = 0; this.accum.idle = 0;
      if (this.style !== 'line') this._renderScene(this.rtA, false, 0);
      if (needLines) this._renderLines();
      this._present();
    } else if (this.style !== 'line' && this.accum.n < this.maxSamples) {
      if (++this.accum.idle > 3) { this._accumulate(); this._present(); }
    } else { this.running = false; return; }
    requestAnimationFrame((t) => this._tick(t));
  }

  /** 지정 크기·샘플 수로 수렴된 정지 화면을 그려 캔버스를 돌려준다(썸네일·PNG 저장). */
  renderStill({ samples = 64 } = {}) {
    this._updateCamera(1);
    this.cam.theta = this.goal.theta; this.cam.phi = this.goal.phi; this.cam.dist = this.goal.dist; this.cam.target.copy(this.goal.target);
    this.explode = this.explodeGoal; this.stepAnim = 1; this._applyOffsets();
    this._placeCamera();
    this.accum.n = 0;
    this._renderScene(this.rtA, false, 0);
    if (this.style === 'line' || this.split > 0) this._renderLines();
    if (this.style !== 'line') for (let i = 0; i < samples; i++) this._accumulate();
    if (samples > 0) this.accum.n = Math.max(this.accum.n, 12);
    this._present();
    // 이미 수렴된 화면이므로 루프가 다시 누적을 시작하지 않게 한다.
    this.dirty = false;
    if (samples > 0) this.accum.n = this.maxSamples;
    return this.canvas;
  }

  dispose() {
    this.disposed = true;
    this._ro.disconnect(); this._io.disconnect();
    this._clearModel();
    this.lib.dispose(); this.assets.dispose();
    for (const k of ['rtA', 'rtS', 'rtB', 'rtL']) if (this[k]) this[k].dispose();
    this.envRT.dispose();
    this.renderer.dispose();
    this.canvas.remove(); this.labelBox.remove(); if (this.callBox) this.callBox.remove();
  }
}
