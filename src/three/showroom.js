// showroom.js — 3D 쇼룸: 커팅 매트 위에 방 16개(룸 세트)를 짓고, 지도처럼 끌어 돌아다니며 가구를 고른다.
// 가구·소품은 재질별로 합친 저분할 메시로 그린다. 누적 렌더 없이 실시간으로만 그린다.
// 카메라가 벽 뒤로 가면 그 벽은 낮게 잘라(컷어웨이) 방 안이 늘 보이게 한다.

import * as THREE from '../../vendor/three.module.min.js';
import { MaterialLib, patchShaderChunks } from './materials.js';
import { mergedGroup, decorGroup, disposeGroup } from './merge.js';
import { RealAssets } from './real.js';
import { studioEnv, ENV_LEVEL, KEY_DIR } from './stage.js';
import { radialAlpha } from './textures.js';
import { layoutShowroom, modelOf, WALL_T } from '../data/rooms.js';
import { styleModel } from '../core/styling.js';

const D2R = Math.PI / 180;
const STUB = 0.05; // 잘린 벽의 남는 높이 비율
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Showroom {
  constructor(host, opts = {}) {
    patchShaderChunks();
    this.host = host;
    this.onOpen = opts.onOpen || (() => {}); this.onFocus = opts.onFocus || (() => {}); this.onProgress = opts.onProgress || (() => {});
    this.dark = !!opts.dark; this.low = !!opts.lowPower; this.fov = 30;
    this.hover = -1; this.focus = -1; this.dirty = true; this.running = false; this.disposed = false; this.visible = true; this.slow = 0;
    const L = (this.layout = layoutShowroom());
    this.W = L.W; this.D = L.D;

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }));
    this.pr = Math.min(window.devicePixelRatio || 1, this.low ? 1.25 : 2);
    r.setPixelRatio(this.pr);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0;
    r.domElement.className = 'stage-canvas'; r.domElement.tabIndex = 0;
    r.domElement.setAttribute('role', 'application');
    r.domElement.setAttribute('aria-label', `3D 쇼룸. 방 ${L.rooms.length}개에 가구 ${L.places.length}개가 놓여 있습니다. 화살표 키로 이동, + − 로 확대·축소, Q E 로 회전, Page Up/Down 으로 방 이동, Enter 로 가운데 가구를 엽니다. 같은 목록은 격자 보기에서도 볼 수 있습니다.`);
    host.appendChild(r.domElement);
    this.canvas = r.domElement;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.fov, 1, 50, 400000);
    this.ibl = { value: 1 };
    this.lib = new MaterialLib({ ibl: this.ibl, cutout: true });
    // 실물 재질 사진·스캔 소품이 도착하면 다시 그린다. 저사양에서는 무거운 스캔 모델을 쓰지 않는다.
    const redraw = () => this.invalidate();
    this.lib.onChange = redraw; this._redraw = redraw;
    this.assets = this.low ? null : new RealAssets({ lite: true, hook: (m) => { m.onBeforeCompile = (sh) => { sh.uniforms.uIblDiffuse = this.ibl; }; return m; } });
    this.envRT = studioEnv(r);
    this.scene.environment = this.envRT.texture; this.scene.environmentIntensity = ENV_LEVEL * 0.8;
    this.keyDir = new THREE.Vector3(...KEY_DIR).normalize();
    this.key = new THREE.DirectionalLight(0xfff0dc, 4.3);
    this.key.castShadow = true; { const sm = this.low ? 1024 : r.capabilities.maxTextureSize >= 8192 ? 4096 : 2048; this.key.shadow.mapSize.set(sm, sm); } this.key.shadow.bias = -0.0003;
    this.head = new THREE.DirectionalLight(0xf2f6ff, 0.38);
    this.scene.add(this.key, this.key.target, this.head, this.head.target);

    // 공용 재질: 접지 그림자, 조명 번짐, 강조 타일, 핀
    const rad = (this.radTex = radialAlpha());
    this.aoMats = [0.1, 0.19, 0.3].map((opacity) => new THREE.MeshBasicMaterial({ color: 0x0b0f0d, alphaMap: rad, transparent: true, opacity, depthWrite: false }));
    this.glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb46e').multiplyScalar(0.15), map: rad, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    this.quad = new THREE.PlaneGeometry(1, 1); this.quad.rotateX(-Math.PI / 2);
    this.tile = new THREE.Mesh(this.quad, new THREE.MeshBasicMaterial({ color: '#f4c430', transparent: true, opacity: 0.9, depthWrite: false }));
    this.tile.visible = false; this.tile.renderOrder = 1; this.scene.add(this.tile);
    this.pinGeo = new THREE.ConeGeometry(70, 190, 14); this.pinGeo.rotateX(Math.PI); this.pinGeo.translate(0, 95, 0);
    this.pinMat = new THREE.MeshBasicMaterial({ color: '#f4c430' });
    this.pins = new THREE.Group(); this.scene.add(this.pins);

    this._ground();
    this.rooms = L.rooms.map((def, i) => ({ def, i, group: null, walls: [], cx: def.x + def.w / 2, cz: def.z + def.d / 2 }));
    this.slots = L.places.map((p, i) => {
      const cx = p.fp.reduce((a, q) => a + q[0], 0) / 4 + p.room.x, cz = p.fp.reduce((a, q) => a + q[1], 0) / 4 + p.room.z;
      return { p, it: p.it, i, group: null, lift: 0, cx, cz, top: p.y + p.h, box: null, inv: null, match: false, pin: null };
    });
    this.slotOf = new Map(this.slots.map((s) => [s.it.id, s]));

    // 카메라: 처음에는 맨 앞 열(거실)을 조금 위에서 내려다본다.
    const front = this.rooms.filter((q) => q.def.row === 0), fz = front[0].def.z;
    this.maxDist = Math.max(this.W, this.D) * 1.12; this.minDist = 2400;
    this.home = { theta: 12 * D2R, phi: 54 * D2R, dist: 17000, x: -400, z: fz + 700 };
    this.goal = { ...this.home };
    this.cam = { theta: -16 * D2R, phi: 34 * D2R, dist: this.home.dist * 1.7, x: this.home.x, z: this.home.z };

    this.labelBox = document.createElement('div');
    this.labelBox.className = 'room__labels';
    host.appendChild(this.labelBox);
    this.chips = this.rooms.map((q) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'room__chip'; b.textContent = q.def.name;
      b.setAttribute('aria-label', `${q.def.name} 방으로 이동 (가구 ${q.def.places.length}개)`);
      b.addEventListener('click', () => this.flyToRoom(q.i));
      this.labelBox.appendChild(b);
      return b;
    });

    this._plan();
    this.setTheme(this.dark);
    this._input();
    this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(host);
    this._io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; if (this.visible) this.invalidate(); }); this._io.observe(host);
    this.resize();
    // 움직임 줄이기 설정이면 처음의 카메라 진입 연출을 건너뛴다
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) Object.assign(this.cam, this.goal);
    if (opts.match) this.setMatch(opts.match, false);
  }

  // ------------------------------------------------------------ 바닥(커팅 매트)
  _ground() {
    const W = this.W, D = this.D, s = Math.min(4096 / W, 4096 / D, 0.16);
    const cw = Math.round(W * s), ch = Math.round(D * s), cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d');
    g.fillStyle = '#2c6b58'; g.fillRect(0, 0, cw, ch);
    const X = (x) => (x + W / 2) * s, Z = (z) => (z + D / 2) * s, m = 600;
    g.strokeStyle = '#e0f0e6';
    for (let x = -W / 2 + m; x <= W / 2 - m + 1; x += 120) { const major = Math.round(x + W / 2 - m) % 600 === 0; g.globalAlpha = major ? 0.4 : 0.12; g.lineWidth = major ? 1.3 : 1; g.beginPath(); g.moveTo(X(x), Z(-D / 2 + m)); g.lineTo(X(x), Z(D / 2 - m)); g.stroke(); }
    for (let z = -D / 2 + m; z <= D / 2 - m + 1; z += 120) { const major = Math.round(z + D / 2 - m) % 600 === 0; g.globalAlpha = major ? 0.4 : 0.12; g.lineWidth = major ? 1.3 : 1; g.beginPath(); g.moveTo(X(-W / 2 + m), Z(z)); g.lineTo(X(W / 2 - m), Z(z)); g.stroke(); }
    g.globalAlpha = 0.85; g.lineWidth = 2; g.strokeRect(X(-W / 2 + m), Z(-D / 2 + m), (W - 2 * m) * s, (D - 2 * m) * s);
    // 방 이름: 열린 앞쪽 매트 위에 인쇄
    g.fillStyle = '#e8f5ee'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const r of this.layout.rooms) {
      const x = r.x + r.w / 2, z = r.z + r.d + 620;
      g.globalAlpha = 0.95; g.font = `800 ${Math.round(400 * s)}px Archivo, "IBM Plex Sans KR", sans-serif`;
      g.fillText(r.name, X(x), Z(z), (r.w - 400) * s);
      g.globalAlpha = 0.7; g.font = `500 ${Math.round(190 * s)}px "IBM Plex Mono", ui-monospace, monospace`;
      g.fillText(`ROOM ${String(this.layout.rooms.indexOf(r) + 1).padStart(2, '0')} · ${r.places.length} PCS · 1:12`, X(x), Z(z + 430));
    }
    g.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 16;
    this.matTex = tex;
    const hook = (m) => { m.onBeforeCompile = (sh) => { sh.uniforms.uIblDiffuse = this.ibl; }; return m; };
    const top = hook(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88 })), edge = hook(new THREE.MeshStandardMaterial({ color: '#27594a', roughness: 0.9 }));
    const mat = new THREE.Mesh(new THREE.BoxGeometry(W, 36, D), [edge, edge, top, edge, edge, edge]);
    mat.position.y = -40 - 18; mat.receiveShadow = true; mat.castShadow = true;
    this.deskMat = hook(new THREE.MeshStandardMaterial({ color: '#d2d6d2', roughness: 0.95 }));
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(W * 14, D * 14), this.deskMat);
    desk.rotation.x = -Math.PI / 2; desk.position.y = -40 - 36; desk.receiveShadow = true;
    this.scene.add(mat, desk);
    this.groundObjs = [mat, desk];
    this.groundY = -40;
  }

  setTheme(dark) {
    this.dark = !!dark;
    const bg = new THREE.Color(this.dark ? '#141b18' : '#dde1dd');
    this.scene.background = bg;
    this.scene.fog = new THREE.Fog(bg, 1, 2);
    this.deskMat.color.set(this.dark ? '#1b2420' : '#d2d6d2');
    this.scene.environmentIntensity = ENV_LEVEL * (this.dark ? 0.66 : 0.8);
    this.invalidate();
  }

  // ------------------------------------------------------------ 짓기(조금씩)
  _plan() {
    const near = (q) => Math.hypot(q.cx - this.home.x, q.cz - this.home.z), order = [...this.rooms].sort((a, b) => near(a) - near(b));
    this.queue = []; this.built = 0;
    for (const q of order) this.queue.push(() => this._shell(q));
    for (const q of order) {
      for (const s of this.slots) if (s.p.room === q.def && !s.p.on) this.queue.push(() => this._item(s));
      for (const s of this.slots) if (s.p.room === q.def && s.p.on) this.queue.push(() => this._item(s));
      this.queue.push(() => this._decor(q));
    }
  }

  /** 방의 바닥과 벽. 벽은 따로 두어 카메라 위치에 따라 높이를 줄인다. */
  _shell(q) {
    const d = q.def, g = (q.group = new THREE.Group());
    g.position.set(d.x, 0, d.z);
    const floor = mergedGroup([d.shell.floor], this.lib, { cast: true });
    g.add(floor);
    for (const name of ['back', 'left', 'right']) {
      const holder = mergedGroup([d.shell.walls[name]], this.lib, { cast: false });
      g.add(holder);
      q.walls.push({ name, holder, decor: null, h: 1, to: 1 });
    }
    this.scene.add(g);
  }

  /** 방의 소품(러그·화분·액자·창…)과 조명 번짐. */
  _decor(q) {
    const d = q.def, base = decorGroup(d.decor.base, this.lib, this.assets, { onReady: this._redraw });
    q.group.add(base);
    this._glows(d.decor.base, base, null);
    for (const w of q.walls) {
      w.decor = decorGroup(d.decor[w.name], this.lib, this.assets, { onReady: this._redraw });
      q.group.add(w.decor);
      this._glows(d.decor[w.name], w.decor, null);
    }
  }

  /** 빛나는 부품(전등갓) 아래 바닥과 뒤쪽 벽에 따뜻한 번짐을 얹는다. */
  _glows(parts, parent, floorY) {
    for (const p of parts) {
      if (!p.glow) continue;
      const [x, y, z] = p.pos, r = 420 + Math.min(650, y * 0.32);
      const pool = new THREE.Mesh(this.quad, this.glowMat);
      pool.position.set(x, floorY ?? 15, z); pool.scale.set(r * 2, 1, r * 2); pool.renderOrder = 1;
      parent.add(pool);
    }
  }

  /** 가구 하나: 재질별로 합친 본체 + 자동 스타일링 소품. */
  _item(s) {
    const p = s.p, it = s.it, model = modelOf(it), fin = it.finishes[p.fin] || it.finishes[0], bb = model.bbox;
    const group = mergedGroup(model.parts, this.lib, { finish: fin });
    const props = styleModel(it, model, { finish: fin, avoid: p.avoid, seed: p.seed, throws: p.throws });
    if (props.length) group.add(decorGroup(props, this.lib, this.assets, { onReady: this._redraw }));
    group.position.set(p.room.x + p.x, p.y, p.room.z + p.z);
    group.rotation.y = p.yaw * D2R;
    // 받침 가구와 함께 들리도록, 위에 올린 것은 받침 그룹의 자식으로 둔다
    this.scene.add(group);
    group.updateMatrixWorld(true);
    s.group = group; s.baseY = p.y;
    s.box = new THREE.Box3(new THREE.Vector3(bb.min[0] - 50, Math.min(0, bb.min[1]), bb.min[2] - 50), new THREE.Vector3(bb.max[0] + 50, bb.max[1] + 60, bb.max[2] + 50));
    s.inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
    s.size = [bb.max[0] - bb.min[0], bb.max[2] - bb.min[2]];
    if (!p.y && !p.under) {
      // 접지 그림자: 발자국보다 조금 큰 부드러운 얼룩
      // 다리만 닿는 탁자·의자는 옅게, 몸통이 바닥에 닿는 수납장·소파는 진하게
      let low = 0;
      for (const q of model.parts) if (!q.opt && !q.inner && q.bb.min[1] < 45) low += (q.bb.max[0] - q.bb.min[0]) * (q.bb.max[2] - q.bb.min[2]);
      const solid = low / Math.max(1, s.size[0] * s.size[1]);
      const ao = new THREE.Mesh(this.quad, this.aoMats[solid > 0.55 ? 2 : solid > 0.16 ? 1 : 0]);
      ao.position.set((bb.min[0] + bb.max[0]) / 2, 14 - Math.min(0, bb.min[1]), (bb.min[2] + bb.max[2]) / 2);
      ao.scale.set(s.size[0] + 420, 1, s.size[1] + 420);
      group.add(ao); s.ao = ao;
    }
    // 스탠드: 바닥 번짐(가구 좌표)
    const lamps = model.parts.filter((q) => q.glow && !q.inner).concat(props.filter((q) => q.glow));
    if (lamps.length) {
      const q = lamps[0], r = 400 + Math.min(650, (p.y + q.pos[1]) * 0.32), pool = new THREE.Mesh(this.quad, this.glowMat);
      pool.position.set(q.pos[0], 16 - p.y, q.pos[2]); pool.scale.set(r * 2, 1, r * 2); pool.renderOrder = 1;
      group.add(pool); s.pool = pool;
    }
    this.built++;
    if (s.match) this._pin(s);
  }

  // ------------------------------------------------------------ 찾기(필터) 표시
  /** ids = 강조할 품목 id 집합(전체이거나 null 이면 표시 없음). */
  setMatch(ids, fly = true) {
    const all = !ids || ids.size >= this.slots.length;
    this.matchCount = all ? 0 : ids.size;
    for (const s of this.slots) {
      s.match = !all && ids.has(s.it.id);
      if (s.pin) { this.pins.remove(s.pin); s.pin = null; }
      if (s.match && s.group) this._pin(s);
    }
    if (fly && !all && ids.size) {
      this._moved = true;
      // 찾은 가구들이 모두 보이게 카메라를 옮긴다
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const s of this.slots) if (s.match) { x0 = Math.min(x0, s.cx); x1 = Math.max(x1, s.cx); z0 = Math.min(z0, s.cz); z1 = Math.max(z1, s.cz); }
      this.goal.x = (x0 + x1) / 2; this.goal.z = (z0 + z1) / 2 + 600;
      this.goal.dist = clamp(this._fit(x1 - x0 + 5000, z1 - z0 + 4200), 7000, this.maxDist);
      this.goal.theta = this.home.theta; this.goal.phi = this.home.phi;
    }
    this.invalidate();
  }
  _pin(s) {
    const pin = new THREE.Mesh(this.pinGeo, this.pinMat);
    pin.position.set(s.cx, s.top + 170, s.cz);
    this.pins.add(pin); s.pin = pin;
  }

  // ------------------------------------------------------------ 입력
  _input() {
    const el = this.canvas, ptrs = new Map();
    let last = null, moved = 0, pinch = 0, twist = 0;
    el.style.touchAction = 'none';
    const scale = () => (this.cam.dist * Math.tan((this.fov * D2R) / 2) * 2) / Math.max(1, this.host.clientHeight);
    const panBy = (dx, dy) => {
      this._moved = true;
      const k = scale(), t = this.goal.theta, c = Math.max(0.3, Math.cos(this.cam.phi));
      this.goal.x -= Math.cos(t) * dx * k + (Math.sin(t) * dy * k) / c;
      this.goal.z -= -Math.sin(t) * dx * k + (Math.cos(t) * dy * k) / c;
      this._clamp();
    };
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); last = [e.clientX, e.clientY]; moved = 0;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); twist = Math.atan2(b[1] - a[1], b[0] - a[0]); }
    });
    el.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) { if (e.pointerType === 'mouse') this._hover(e.clientX, e.clientY); return; }
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        this._moved = true;
        if (pinch) this.goal.dist = clamp(this.goal.dist * (pinch / d), this.minDist, this.maxDist);
        this.goal.theta -= ang - twist; pinch = d; twist = ang; moved = 99; this.invalidate();
        return;
      }
      const dx = e.clientX - last[0], dy = e.clientY - last[1];
      last = [e.clientX, e.clientY]; moved += Math.abs(dx) + Math.abs(dy);
      if (e.buttons === 2 || e.shiftKey) { this.goal.theta -= dx * 0.006; this.goal.phi = clamp(this.goal.phi - dy * 0.004, 20 * D2R, 76 * D2R); } else panBy(dx, dy);
      this.invalidate();
    });
    const up = (e) => {
      const had = ptrs.delete(e.pointerId); pinch = 0;
      if (!had || e.type !== 'pointerup' || moved > 6) return;
      const i = this._pick(e.clientX, e.clientY);
      if (i < 0) { this.setFocus(-1); return; }
      if (e.pointerType === 'mouse' || this.focus === i) this.onOpen(this.slots[i].it); else this.setFocus(i);
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', () => { if (this.hover >= 0) { this.hover = -1; this._emit(); this.invalidate(); } });
    el.addEventListener('wheel', (e) => { e.preventDefault(); this._moved = true; this.goal.dist = clamp(this.goal.dist * Math.exp(e.deltaY * 0.0012), this.minDist, this.maxDist); this.invalidate(); }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('dblclick', (e) => { const i = this._pick(e.clientX, e.clientY); if (i >= 0) this.flyTo(i); });
    el.addEventListener('keydown', (e) => {
      const k = e.key, step = 90;
      this._moved = true;
      if (k === 'ArrowLeft') panBy(step, 0); else if (k === 'ArrowRight') panBy(-step, 0); else if (k === 'ArrowUp') panBy(0, step); else if (k === 'ArrowDown') panBy(0, -step);
      else if (k === '+' || k === '=') this.goal.dist = Math.max(this.minDist, this.goal.dist * 0.85); else if (k === '-') this.goal.dist = Math.min(this.maxDist, this.goal.dist * 1.18);
      else if (k === 'q' || k === 'Q') this.goal.theta -= 0.2; else if (k === 'e' || k === 'E') this.goal.theta += 0.2;
      else if (k === '0') { this.reset(); e.preventDefault(); return; }
      else if (k === 'PageDown' || k === 'PageUp') { const n = this.rooms.length, cur = this._nearRoom(); this.flyToRoom((cur + (k === 'PageDown' ? 1 : n - 1)) % n); e.preventDefault(); return; }
      else if (k === 'Enter') { const i = this.focus >= 0 ? this.focus : this._nearest(); if (i >= 0) this.onOpen(this.slots[i].it); return; }
      else return;
      e.preventDefault();
      this.setFocus(this._nearest(this.goal.x, this.goal.z));
      this.invalidate();
    });
  }

  _clamp() { this.goal.x = clamp(this.goal.x, -this.W / 2, this.W / 2); this.goal.z = clamp(this.goal.z, -this.D / 2, this.D / 2); }
  _nearest(x = this.cam.x, z = this.cam.z) { let best = -1, bd = Infinity; for (const s of this.slots) { const d = (s.cx - x) ** 2 + (s.cz - z) ** 2; if (d < bd) { bd = d; best = s.i; } } return best; }
  _nearRoom() { let best = 0, bd = Infinity; for (const q of this.rooms) { const d = (q.cx - this.goal.x) ** 2 + (q.cz - this.goal.z) ** 2; if (d < bd) { bd = d; best = q.i; } } return best; }

  _pick(cx, cy) {
    const r = this.canvas.getBoundingClientRect(), rc = new THREE.Raycaster(), hit = new THREE.Vector3(), ray = new THREE.Ray();
    rc.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -(((cy - r.top) / r.height) * 2 - 1)), this.camera);
    let best = -1, bd = Infinity;
    for (const s of this.slots) {
      if (!s.box) continue;
      ray.copy(rc.ray).applyMatrix4(s.inv);
      if (!ray.intersectBox(s.box, hit)) continue;
      // 위에 올린 작은 것(스탠드·미니 서랍장)이 받침 가구보다 먼저 잡히게 조금 당겨 준다
      const d = hit.distanceTo(ray.origin) - (s.p.on || s.p.hung ? 260 : 0);
      if (d < bd) { bd = d; best = s.i; }
    }
    return best;
  }
  _hover(cx, cy) { const i = this._pick(cx, cy); if (i !== this.hover) { this.hover = i; this.canvas.style.cursor = i >= 0 ? 'pointer' : ''; this._emit(); this.invalidate(); } }
  setFocus(i) { if (i !== this.focus) { this.focus = i; this._emit(); this.invalidate(); } }
  _active() { return this.hover >= 0 ? this.hover : this.focus; }
  _emit() { const i = this._active(); this.onFocus(i >= 0 ? this.slots[i].it : null, i >= 0 ? this.slots[i].p.room.name : ''); }

  /** 가로 w, 세로 d 인 바닥 영역이 화면에 들어오는 거리. */
  _fit(w, d) {
    const half = (this.fov * D2R) / 2, asp = this.camera.aspect || 1.6, hh = Math.atan(Math.tan(half) * asp), phi = this.goal.phi;
    return Math.max(w / 2 / Math.tan(hh), (d * Math.cos(phi) + 2400 * Math.sin(phi)) / 2 / Math.tan(half)) * 1.12;
  }
  flyTo(i) {
    const s = this.slots[i]; if (!s) return;
    this._moved = true;
    this.goal.x = s.cx; this.goal.z = s.cz + 200; this.goal.dist = Math.max(this.minDist, Math.max(s.it.dims[0], s.it.dims[1], s.it.dims[2]) * 3.4);
    this.setFocus(i); this.invalidate();
  }
  /** 품목 id 로 날아간다(검색 등에서 호출). */
  flyToItem(id) { const s = this.slotOf.get(id); if (s) this.flyTo(s.i); }
  flyToRoom(i) {
    const q = this.rooms[i]; if (!q) return;
    this._moved = true;
    this.goal.theta = 0; this.goal.phi = this.home.phi;
    this.goal.x = q.cx; this.goal.z = q.def.z + q.def.d * 0.5; this.goal.dist = clamp(this._fit(q.def.w + 500, q.def.d + 700), this.minDist, this.maxDist);
    this.setFocus(-1); this.invalidate();
  }
  reset() { this._moved = false; Object.assign(this.goal, this.home); this.goal.dist = clamp(this.home.dist, this.minDist, this.maxDist); this.setFocus(-1); this.invalidate(); }

  /** 강조된 가구의 머리 위 화면 좌표(라벨 위치). */
  anchor() {
    const i = this._active(); if (i < 0) return null;
    const s = this.slots[i], v = new THREE.Vector3(s.cx, s.top + s.lift + 130, s.cz).project(this.camera);
    if (v.z > 1) return null;
    return { x: ((v.x + 1) / 2) * this.host.clientWidth, y: ((1 - v.y) / 2) * this.host.clientHeight };
  }

  // ------------------------------------------------------------ 루프
  invalidate() { this.dirty = true; if (!this.running && !this.disposed) { this.running = true; this._last = performance.now(); requestAnimationFrame((t) => this._tick(t)); } }

  resize() {
    const w = Math.max(2, this.host.clientWidth), h = Math.max(2, this.host.clientHeight);
    this.renderer.setPixelRatio(this.pr);
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    // 좁은 화면에서는 첫 화면을 조금 더 멀리서
    this.home.dist = clamp(this._fit(w / h < 1 ? 7200 : 15000, 4200), 9000, this.maxDist);
    if (!this._moved) { this.goal.dist = this.home.dist; }
    this.invalidate();
  }

  _labels() {
    const w = this.host.clientWidth, h = this.host.clientHeight, v = new THREE.Vector3(), near = this._nearRoom();
    for (const q of this.rooms) {
      const el = this.chips[q.i];
      v.set(q.cx, q.def.H + 260, q.def.z).project(this.camera);
      const x = ((v.x + 1) / 2) * w, y = ((1 - v.y) / 2) * h, on = v.z < 1 && x > -60 && x < w + 60 && y > 28 && y < h - 20;
      el.style.visibility = on ? 'visible' : 'hidden';
      if (on) { el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; el.classList.toggle('is-near', q.i === near); }
    }
  }

  _tick(now) {
    if (this.disposed) return;
    const raw = (now - this._last) / 1000 || 0.016, dt = Math.min(0.05, raw); this._last = now;
    if (!this.visible) { this.running = false; return; }
    let busy = this.dirty; this.dirty = false;
    // 방과 가구를 조금씩 짓는다(한 프레임에 약 10ms)
    if (this.queue.length) {
      const t0 = performance.now();
      while (this.queue.length && performance.now() - t0 < 10) this.queue.shift()();
      this.onProgress(this.built, this.slots.length); busy = true;
    }
    const c = this.cam, g = this.goal, k = 1 - Math.exp(-dt * 7);
    for (const key of ['theta', 'phi', 'dist', 'x', 'z']) { const d = g[key] - c[key]; if (Math.abs(d) > (key === 'theta' || key === 'phi' ? 0.0004 : 1.5)) { c[key] += d * k; busy = true; } else c[key] = g[key]; }
    const act = this._active();
    for (const s of this.slots) {
      if (!s.group) continue;
      // 받침 가구가 들리면 위에 올린 것도 함께 든다
      const base = s.p.on ? this.slotOf.get(s.p.on) : null, want = s.i === act || (base && base.i === act) ? 150 : 0;
      if (Math.abs(want - s.lift) > 0.5) { s.lift += (want - s.lift) * (1 - Math.exp(-dt * 12)); busy = true; } else s.lift = want;
      s.group.position.y = s.baseY + s.lift;
      if (s.ao) s.ao.position.y = 14 - s.lift;
      if (s.pool) s.pool.position.y = 16 - s.baseY - s.lift;
    }
    const as = act >= 0 ? this.slots[act] : null;
    if (as && as.group && !as.p.y) { this.tile.visible = true; this.tile.position.set(as.cx, 19, as.cz); this.tile.rotation.y = as.p.yaw * D2R; this.tile.scale.set(as.size[0] + 240, 1, as.size[1] + 240); } else this.tile.visible = false;

    // 카메라와 조명
    const sp = Math.sin(c.phi), tgt = new THREE.Vector3(c.x, 0, c.z);
    this.camera.position.set(c.x + c.dist * sp * Math.sin(c.theta), c.dist * Math.cos(c.phi), c.z + c.dist * sp * Math.cos(c.theta));
    this.camera.near = Math.max(60, c.dist * 0.06); this.camera.far = c.dist * 10 + 30000; this.camera.lookAt(tgt); this.camera.updateProjectionMatrix();
    this.scene.fog.near = c.dist * 1.6 + 6000; this.scene.fog.far = c.dist * 5 + 30000;
    const half = clamp(c.dist * 0.95, 5000, 22000), Ld = half * 3;
    this.key.position.copy(tgt).addScaledVector(this.keyDir, Ld); this.key.target.position.copy(tgt);
    const sc = this.key.shadow.camera; sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = Ld - half * 2.2; sc.far = Ld + half * 2.2; sc.updateProjectionMatrix();
    this.key.shadow.normalBias = half * 0.0012;
    this.head.position.copy(this.camera.position); this.head.target.position.copy(tgt);

    // 벽 컷어웨이: 카메라가 벽의 바깥쪽에 있으면 낮춘다
    const cp = this.camera.position, kw = 1 - Math.exp(-dt * 10);
    for (const q of this.rooms) {
      if (!q.group) continue;
      const d = q.def;
      for (const w of q.walls) {
        w.to = (w.name === 'back' ? cp.z > d.z - WALL_T : w.name === 'left' ? cp.x > d.x - WALL_T : cp.x < d.x + d.w + WALL_T) ? 1 : STUB;
        if (Math.abs(w.to - w.h) > 0.004) { w.h += (w.to - w.h) * kw; busy = true; } else w.h = w.to;
        w.holder.scale.y = w.h;
        if (w.decor) w.decor.visible = w.h > 0.9;
      }
    }
    // 핀은 멀리서도 보이게 거리만큼 키운다
    if (this.pins.children.length) { const ps = clamp(c.dist / 7000, 0.8, 4.5); for (const pin of this.pins.children) pin.scale.setScalar(ps); }

    this.renderer.render(this.scene, this.camera);
    this._labels();
    if (this.onFrame) this.onFrame(this);
    // 느린 기기: 계속 버벅이면 해상도를 한 단계 낮춘다
    if (busy && raw > 0.045 && !this.queue.length) { if (++this.slow > 14 && this.pr > 1) { this.pr = Math.max(1, this.pr - 0.25); this.slow = 0; this.resize(); } } else if (raw < 0.03) this.slow = 0;
    if (busy) requestAnimationFrame((t) => this._tick(t)); else this.running = false;
  }

  dispose() {
    this.disposed = true; this._ro.disconnect(); this._io.disconnect();
    this.scene.traverse((o) => { if (o.geometry && o.geometry !== this.quad && o.geometry !== this.pinGeo) o.geometry.dispose(); });
    for (const o of this.groundObjs) for (const m of [].concat(o.material)) m.dispose();
    for (const m of [...this.aoMats, this.glowMat, this.tile.material, this.pinMat]) m.dispose();
    this.quad.dispose(); this.pinGeo.dispose(); this.radTex.dispose(); this.matTex.dispose(); this.lib.dispose(); if (this.assets) this.assets.dispose(); this.envRT.dispose();
    this.renderer.dispose(); this.canvas.remove(); this.labelBox.remove();
  }
}

export { disposeGroup };
