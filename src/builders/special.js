// special.js — 한 제품만의 구조를 가진 가구들과 조명·소품.

import { roundedRect, stripProfile, arcPts } from '../core/geom.js';
import { caster, spread, strut, knob } from './util.js';

/** 3단 철제 카트(RÅSKOG). */
export function raskog(k, s) {
  const { w, d, h } = s, ch = 70, th = 86, r = k.D(16) / 2, wall = k.T(2.5);
  const px = w / 2 - r - 1, ys = [ch + 14, ch + 14 + (h - ch - 150) / 2, h - 150];
  k.ph('tray', '트레이');
  ys.forEach((y, i) => {
    k.ext('트레이 벽', roundedRect(w - 30, d, 34, 6), th, 'xz', [0, y + th / 2, 0], { wall, role: 'body', ex: [0, i - 1, 0], note: '띠를 둥글게 말아 붙임' });
    k.ext('트레이 바닥', roundedRect(w - 32, d - 2, 33, 6), wall, 'xz', [0, y + wall / 2, 0], { role: 'body', ex: [0, i - 1.2, 0] });
  });
  k.ph('frame', '프레임');
  for (const sx of [1, -1]) {
    k.tube('옆 프레임', [[sx * px, ch, d / 2 - 46], [sx * px, h - 12, d / 2 - 46], [sx * px, h - 12, -d / 2 + 46], [sx * px, ch, -d / 2 + 46]], r, { corner: 34, role: 'body', ex: [sx, 0, 0] });
  }
  k.ph('hw', '바퀴');
  for (const x of [px, -px]) for (const z of [d / 2 - 46, -d / 2 + 46]) caster(k, x, z, ch, { phase: 'hw' });
  k.flow([
    ['tray', '트레이 세 개', '둥근 사각 바닥에 띠를 둘러 얕은 트레이 세 개를 만듭니다.', '0.3mm 프라판이나 두꺼운 켄트지가 다루기 쉽습니다.'],
    ['frame', '옆 프레임', '철사를 ㄷ자로 구부린 옆 프레임 두 개에 트레이를 같은 간격으로 붙입니다.', '간격 블록을 끼워 놓고 붙이면 세 단이 평행합니다.', [1, 0, 0]],
    ['hw', '바퀴', '프레임 아래에 바퀴 네 개를 붙입니다.', '', [0, -1, 0]],
  ]);
}

/** 유리 진열장(DETOLF). */
export function detolf(k, s) {
  const { w, d, h } = s, base = 110, cap = 36, g = 4, gh = h - base - cap, rr = k.D(8) / 2;
  k.ph('base', '받침·상판');
  k.box('받침대', [w, base, d], [0, base / 2, 0], { role: 'body', ex: [0, -1, 0], bevel: 2 });
  k.box('상판', [w, cap, d], [0, h - cap / 2, 0], { role: 'body', ex: [0, 1, 0], phase: 'top', bevel: 2 });
  k.ph('glass', '유리');
  k.box('옆 유리', [g, gh, d - 20], [w / 2 - 8, base + gh / 2, 0], { role: 'glass', mx: true, ex: [1, 0, 0] });
  k.box('뒤 유리', [w - 26, gh, g], [0, base + gh / 2, -d / 2 + 10], { role: 'glass', ex: [0, 0, -1] });
  k.ph('shelf', '선반');
  for (const x of [w / 2 - 28, -w / 2 + 28]) for (const z of [d / 2 - 34, -d / 2 + 30]) k.cyl('선반 지지봉', rr, gh, [x, base + gh / 2, z], { role: 'metal', ex: [0, 0, 0] });
  for (const y of spread(3, base + gh * 0.25, base + gh * 0.75)) k.box('유리 선반', [w - 34, g, d - 44], [0, y, -2], { role: 'glass', ex: [0, 0, 1] });
  k.ph('door', '문');
  k.box('유리 문', [w - 22, gh - 6, g], [0, base + gh / 2, d / 2 - 8], { role: 'glass', ex: [0, 0, 1] });
  k.box('문 손잡이', [10, 60, 12], [w / 2 - 40, base + gh * 0.5, d / 2 - 2], { role: 'metal', phase: 'hw', ex: [0, 0, 1.3], group: '철물' });
  k.flow([
    ['base', '받침대', '두꺼운 받침대를 만듭니다. 판재로 낮은 상자를 짜도 됩니다.', ''],
    ['glass', '유리 세우기', '투명판 세 장을 받침대 위에 ㄷ자로 세웁니다.', '투명판은 UV 레진이나 투명 본드로 붙여야 하얗게 뜨지 않습니다.'],
    ['shelf', '선반', '네 모서리에 지지봉을 세우고 유리 선반 세 장을 같은 간격으로 붙입니다.', '지지봉에 선반 위치를 미리 표시해 두세요.', [0, 0, 1]],
    ['top', '상판', '상판을 덮어 유리 윗변을 고정합니다.', '', [0, 1, 0]],
    ['door', '유리 문', '앞면 유리 문을 붙입니다. 한쪽에 테이프 경첩을 달면 열립니다.', '', [0, 0, 1]],
    ['hw', '손잡이', '문 손잡이를 붙입니다.', '', [0, 0, 1]],
  ]);
}

/** 철제 유리 진열장(FABRIKÖR). */
export function metalVitrine(k, s) {
  const { w, d, h } = s, leg = 130, t = k.D(26), top = 40, bh = h - leg, g = 4;
  const px = w / 2 - t / 2, pz = d / 2 - t / 2;
  k.ph('frame', '프레임');
  k.rbox('기둥', [t, bh, t], [px, leg + bh / 2, pz], 7, { role: 'body', mx: true, mz: true, stock: 'stick' });
  k.ext('상판', roundedRect(w, d, 16, 5), top, 'xz', [0, h - top / 2, 0], { role: 'body', ex: [0, 1, 0], bevel: 3 });
  k.ext('바닥판', roundedRect(w, d, 16, 5), top, 'xz', [0, leg + top / 2, 0], { role: 'body', ex: [0, -0.4, 0], bevel: 3 });
  k.ph('legs', '다리');
  k.cyl('다리', 11, leg, [px - 14, leg / 2, pz - 14], { r2: 16, role: 'body', mx: true, mz: true, ex: [0, -1, 0] });
  k.ph('glass', '유리');
  const gh = bh - 2 * top;
  k.box('옆 유리', [g, gh, d - 2 * t], [px, leg + bh / 2, 0], { role: 'glass', mx: true, ex: [1, 0, 0] });
  k.box('뒤판', [w - 2 * t, gh, k.T(3)], [0, leg + bh / 2, -pz], { role: 'body', ex: [0, 0, -1] });
  k.ph('shelf', '선반');
  for (const y of spread(s.shelves ?? 3, leg + top + gh * 0.25, leg + top + gh * 0.75)) k.box('유리 선반', [w - 2 * t - 6, g, d - 2 * t - 10], [0, y, 0], { role: 'glass', ex: [0, 0, 1] });
  k.ph('door', '문');
  const dw = w - 2 * t - 4, f = 30;
  k.ext('문 틀', roundedRect(dw, gh - 4, 10, 4), k.T(16), 'xy', [0, leg + bh / 2, pz + 2], { wall: f, role: 'body', ex: [0, 0, 1] });
  k.box('문 유리', [dw - 2 * f + 10, gh - 2 * f + 6, g], [0, leg + bh / 2, pz + 2], { role: 'glass', ex: [0, 0, 1] });
  k.cyl('잠금 손잡이', 9, 16, [dw / 2 - f / 2, leg + bh / 2, pz + 18], { axis: 'z', role: 'metal', phase: 'hw', group: '철물', stock: 'bead', ex: [0, 0, 1] });
  k.flow([
    ['frame', '철제 프레임', '기둥 네 개를 상판·바닥판 사이에 세웁니다.', '각재 모서리를 둥글리면 프레스 강판 느낌이 납니다.'],
    ['legs', '다리', '바닥판 아래에 짧은 다리 네 개를 붙입니다.', '', [0, -1, 0]],
    ['glass', '옆 유리·뒤판', '옆면에 투명판을, 뒷면에 얇은 판을 붙입니다.', ''],
    ['shelf', '선반', '유리 선반을 붙입니다.', '', [0, 0, 1]],
    ['door', '유리 문', '고리 모양 문 틀 뒤에 투명판을 붙여 문을 만듭니다.', '', [0, 0, 1]],
    ['hw', '손잡이', '잠금 손잡이를 붙입니다.', '', [0, 0, 1]],
  ]);
}

/** 파이프 행거(MULIG). */
export function clothesRack(k, s) {
  const { w, d, h } = s, r = k.D(25) / 2, x = w / 2 - r;
  k.ph('sides', '옆 프레임');
  for (const sx of [1, -1]) {
    k.tube('발 받침', [[sx * x, r, -d / 2 + r], [sx * x, r, d / 2 - r]], r, { role: 'body', ex: [sx, 0, 0] });
    k.tube('세로 기둥', [[sx * x, r, 0], [sx * x, h - r, 0]], r, { role: 'body', ex: [sx, 0, 0] });
  }
  k.ph('rails', '가로 봉');
  k.tube('옷걸이 봉', [[-x, h - r, 0], [x, h - r, 0]], r, { role: 'body', ex: [0, 1, 0] });
  k.tube('아래 선반 봉', [[-x, 150, -d * 0.3], [x, 150, -d * 0.3]], r * 0.8, { role: 'body' });
  k.tube('아래 선반 봉', [[-x, 150, d * 0.3], [x, 150, d * 0.3]], r * 0.8, { role: 'body' });
  for (const sx of [1, -1]) k.tube('선반 받침', [[sx * (x - 2), 150, -d * 0.3], [sx * (x - 2), 150, d * 0.3]], r * 0.8, { role: 'body' });
  k.ph('hw', '마감');
  for (const sx of [1, -1]) for (const sz of [1, -1]) k.cyl('발 캡', r + 2, 16, [sx * x, r, sz * (d / 2 - 8)], { axis: 'z', role: 'wheel', ex: [0, 0, sz] });
  k.flow([
    ['sides', '옆 프레임', '바닥 발 받침 가운데에 세로 기둥을 세워 ㅗ자 프레임 두 개를 만듭니다.', '황동 파이프나 대나무 꼬치를 씁니다.'],
    ['rails', '가로 봉 연결', '위쪽 옷걸이 봉과 아래 선반 봉으로 좌우 프레임을 연결합니다.', '', [0, 1, 0]],
    ['hw', '발 캡', '발 받침 끝에 캡을 끼웁니다.', '', [0, 0, 1]],
  ]);
}

/** 계단형 장난감 수납(TROFAST). */
export function trofast(k, s) {
  const { w, d, h } = s, t = k.T(16), n = 3, cw = (w - (n + 1) * t) / n, hs = [h, h * 0.66, h * 0.33];
  const xs = Array.from({ length: n + 1 }, (_, i) => -w / 2 + t / 2 + i * (cw + t));
  k.ph('carcass', '본체');
  xs.forEach((x, i) => {
    const ph = hs[Math.max(0, i - 1)];
    k.box('세로판', [t, ph, d], [x, ph / 2, 0], { role: 'body', ex: [i < 2 ? -1 : 1, 0, 0] });
  });
  hs.forEach((ph, i) => {
    const cx = (xs[i] + xs[i + 1]) / 2;
    k.box('덮개판', [cw, t, d], [cx, ph - t / 2, 0], { role: 'body', ex: [0, 1, 0] });
    k.box('걸레받이', [cw, 60, t], [cx, 30, d / 2 - 30], { role: 'body' });
    k.box('뒤 보강대', [cw, 80, k.T(10)], [cx, ph - t - 40, -d / 2 + 8], { role: 'body', ex: [0, 0, -1] });
  });
  k.ph('bin', '수납통');
  const colors = ['plastic', 'accent', 'accent2'];
  hs.forEach((ph, i) => {
    const cx = (xs[i] + xs[i + 1]) / 2, rows = Math.max(1, Math.floor((ph - t - 70) / 240 + 0.25));
    for (let r = 0; r < rows; r++) {
      const bh = 205, y = ph - t - 14 - r * 240 - bh / 2;
      k.ext('수납통 둘레', roundedRect(cw - 12, d - 26, 30, 5), bh, 'xz', [cx, y, 4], { wall: 3, role: colors[(i + r) % 3], ex: [0, 0, 1] });
      k.ext('수납통 바닥', roundedRect(cw - 16, d - 30, 28, 5), 3, 'xz', [cx, y - bh / 2 + 2, 4], { role: colors[(i + r) % 3], ex: [0, 0, 1] });
      k.box('레일', [k.T(6), 10, d - 40], [cx - cw / 2 + 3, y + bh / 2 - 10, 0], { role: 'body', phase: 'carcass' });
      k.box('레일', [k.T(6), 10, d - 40], [cx + cw / 2 - 3, y + bh / 2 - 10, 0], { role: 'body', phase: 'carcass' });
    }
  });
  k.flow([
    ['carcass', '계단형 본체', '높이가 다른 세로판 네 장을 세우고 칸마다 덮개판·걸레받이·뒤 보강대를 붙입니다.', '수납통이 걸릴 레일을 세로판 안쪽에 미리 붙여 두세요.'],
    ['bin', '수납통', '띠를 둥근 사각형으로 말아 수납통을 만들고 레일에 걸칩니다.', '색지를 쓰면 칠하지 않아도 됩니다.', [0, 0, 1]],
  ]);
}

/** 놀이 주방(DUKTIG). */
export function playKitchen(k, s) {
  const { w, d, h } = s, t = k.T(12), ps = k.D(34), ch = s.counterH ?? 560, leg = 70, px = w / 2 - ps / 2, pz = d / 2 - ps / 2;
  k.ph('carcass', '하부장');
  k.box('기둥', [ps, h, ps], [px, h / 2, -pz], { role: 'frame', mx: true });
  k.box('앞 다리', [ps, ch - 20, ps], [px, (ch - 20) / 2, pz], { role: 'frame', mx: true });
  k.box('측판', [t, ch - leg - 20, d - 2 * ps], [px, leg + (ch - leg - 20) / 2, 0], { role: 'body', mx: true, ex: [1, 0, 0] });
  k.box('바닥판', [w - 2 * ps, t, d - ps], [0, leg + t / 2, 0], { role: 'body' });
  k.box('칸막이', [t, ch - leg - 20 - t, d - ps - 10], [0, leg + t + (ch - leg - 20 - t) / 2, 0], { role: 'body' });
  k.box('뒤판', [w - 2 * ps, ch - leg - 20, k.T(3)], [0, leg + (ch - leg - 20) / 2, -pz], { role: 'body', phase: 'back', ex: [0, 0, -1] });
  k.ph('top', '조리대');
  k.box('조리대 상판', [w, 20, d], [0, ch - 10, 0], { role: 'top', ex: [0, 1, 0] });
  k.lathe('싱크볼', [[0, -70], [78, -70], [108, 0], [118, 0], [118, 4], [104, 4], [76, -66], [0, -66]], [-w / 4, ch + 1, 10], { role: 'metal', ex: [0, 1.4, 0], stock: 'cone', note: '병뚜껑이나 알루미늄 접시로 대체' });
  k.tube('수전', [[-w / 4, ch, -d / 2 + 70], [-w / 4, ch + 150, -d / 2 + 70], [-w / 4, ch + 150, -d / 2 + 150], [-w / 4, ch + 110, -d / 2 + 150]], 9, { corner: 36, role: 'metal', ex: [0, 1.6, 0] });
  k.box('인덕션', [w / 2 - 40, 6, d - 90], [w / 4, ch + 3, 0], { role: 'screen', ex: [0, 1.4, 0], bevel: 2 });
  for (const z of [70, -70]) k.cyl('화구', 62, 2, [w / 4, ch + 7, z], { role: 'glow', ex: [0, 1.8, 0], stock: 'disc' });
  k.ph('door', '문');
  const dw = (w - 2 * ps) / 2 - 4, dh = ch - leg - 26;
  k.box('문짝', [dw, dh, t], [dw / 2 + 2, leg + dh / 2, pz - t / 2 + 4], { role: 'front', mx: true, ex: [0, 0, 1] });
  for (const sx of [1, -1]) k.tube('문 손잡이', [[sx * 26, leg + dh - 60, pz + 4], [sx * 26, leg + dh - 60, pz + 24], [sx * 26, leg + dh - 180, pz + 24], [sx * 26, leg + dh - 180, pz + 4]], 5, { corner: 10, role: 'metal', phase: 'hw', group: '철물', ex: [0, 0, 1] });
  k.ph('upper', '상부장');
  const uy = h - 240;
  k.box('상부 바닥', [w - 2 * ps, t, d * 0.58], [0, uy, -pz + d * 0.29], { role: 'body', ex: [0, 0.6, 0] });
  k.box('상부 상판', [w, t + 4, d * 0.62], [0, h - 8, -pz + d * 0.29], { role: 'body', ex: [0, 1, 0] });
  k.box('상부 측판', [t, 240 - 16, d * 0.58], [px, uy + 112, -pz + d * 0.29], { role: 'body', mx: true, ex: [1, 0.6, 0] });
  k.box('상부 칸막이', [t, 240 - 22, d * 0.56], [w * 0.1, uy + 114, -pz + d * 0.29], { role: 'body', ex: [0, 0.6, 0] });
  k.box('전자레인지 문', [w * 0.6 - ps - 4, 200, t], [w * 0.1 - (w * 0.6 - ps) / 2 - 2, uy + 114, -pz + d * 0.58 - 2], { role: 'smoke', ex: [0, 0.6, 1] });
  k.tube('걸이 봉', [[-w / 2 + ps, uy - 70, -pz + 34], [w / 2 - ps, uy - 70, -pz + 34]], 6, { role: 'metal', phase: 'hw', group: '철물' });
  for (const x of spread(3, -w * 0.2, w * 0.2)) k.tube('후크', [[x, uy - 70, -pz + 34], [x, uy - 110, -pz + 34], [x, uy - 122, -pz + 48]], 2.5, { corner: 8, role: 'metal', phase: 'hw', group: '철물' });
  k.flow([
    ['carcass', '하부장 짜기', '뒤 기둥(천장까지)과 앞 다리 사이에 측판·바닥판·칸막이를 붙입니다.', '기둥 네 개가 수직인지 확인하세요.'],
    ['back', '뒤판', '하부장 뒤판을 붙입니다.', '', [0, 0, -1]],
    ['top', '조리대', '상판을 올리고 싱크볼·수전·인덕션을 붙입니다.', '싱크볼 자리는 상판에 구멍을 내고 얕은 그릇을 끼우면 더 실감 납니다.', [0, 1, 0]],
    ['door', '하부장 문', '문 두 짝을 붙입니다.', '', [0, 0, 1]],
    ['upper', '상부장', '뒤 기둥 위쪽에 상부장을 짜고 전자레인지 문을 답니다.', '문에 반투명 필름을 쓰면 실물과 닮습니다.'],
    ['hw', '손잡이와 걸이', '문 손잡이, 걸이 봉, 후크를 붙입니다.', '', [0, 0, 1]],
  ]);
}

/** 접이식 야외 테이블과 의자(TÄRNÖ). */
export function bistroSet(k, s) {
  const { w, d, h } = s, r = k.D(16) / 2;
  const tableAt = () => {
    k.ph('legs', '테이블');
    const a = w / 2 - 30, z = d / 2 - 40;
    k.tube('테이블 다리 프레임', [[-a, 0, z], [-a + 10, h - 30, -z + 60], [a - 10, h - 30, -z + 60], [a, 0, z]], r, { corner: 26, role: 'frame' });
    k.tube('테이블 다리 프레임', [[-a + 22, 0, -z], [-a + 30, h - 44, z - 60], [a - 30, h - 44, z - 60], [a - 22, 0, -z]], r, { corner: 26, role: 'frame' });
    k.ph('top', '테이블');
    for (const sx of [1, -1]) k.box('상판 받침', [28, 20, d - 60], [sx * (w / 2 - 90), h - 24, 0], { role: 'frame' });
    for (const z of spread(8, -d / 2 + 32, d / 2 - 32)) k.box('상판 살', [w, k.T(14), 60], [0, h - 7, z], { role: 'body', ex: [0, 1, 0] });
  };
  const chairAt = () => {
    const cw = 390, cd = 400, ch = 790, sh = 450, a = cw / 2 - r;
    k.tube('의자 긴 프레임', [[-a, 0, cd / 2], [-a, sh + 20, -cd * 0.12], [-a + 6, ch, -cd / 2], [a - 6, ch, -cd / 2], [a, sh + 20, -cd * 0.12], [a, 0, cd / 2]], r, { corner: 30, role: 'frame' });
    k.tube('의자 짧은 프레임', [[-a + 2 * r + 3, 0, -cd / 2 + 10], [-a + 2 * r + 3, sh - 14, cd * 0.22], [a - 2 * r - 3, sh - 14, cd * 0.22], [a - 2 * r - 3, 0, -cd / 2 + 10]], r, { corner: 26, role: 'frame' });
    for (const z of spread(4, -cd * 0.16, cd * 0.3)) k.box('의자 좌판 살', [cw - 30, k.T(12), 58], [0, sh, z], { role: 'body', ex: [0, 1, 0] });
    for (const y of [ch - 60, ch - 150]) k.box('의자 등받이 살', [cw - 36, 56, k.T(12)], [0, y, -cd / 2 + 14 + (ch - y) * 0.16], { role: 'body', rot: [-9, 0, 0], ex: [0, 0.3, 1] });
  };
  tableAt();
  k.ph('set', '의자');
  k.at([0, 0, d / 2 + 330], 180, chairAt);
  k.at([0, 0, -d / 2 - 330], 0, chairAt);
  k.flow([
    ['legs', '테이블 다리', '철사 두 가닥을 ㄷ자로 구부려 X자로 겹칩니다.', '교차점에 핀을 꽂으면 실제로 접힙니다.'],
    ['top', '테이블 상판', '받침 두 개 위에 살 여덟 장을 일정한 간격으로 붙입니다.', '살 사이에 1mm 스페이서를 끼우세요.', [0, 1, 0]],
    ['set', '접이식 의자 두 개', '긴 프레임(등받이)과 짧은 프레임을 X자로 겹치고 좌판·등받이 살을 붙입니다.', '의자 두 개를 나란히 놓고 같이 만들면 모양이 같아집니다.'],
  ]);
}

/** 어린이 테이블 + 의자 2개(LÄTT). */
export function kidsSet(k, s, tableFn, chairFn) {
  tableFn();
  k.ph('set', '의자');
  k.at([-s.w * 0.24, 0, s.d / 2 + 190], 180, chairFn);
  k.at([s.w * 0.24, 0, -s.d / 2 - 190], 0, chairFn);
}

// ---------------------------------------------------------------- 조명·거울

const LAMP_FLOW = [
  ['base', '받침 만들기', '무게가 실리는 받침을 만듭니다.', '받침 안에 와셔나 동전을 넣으면 넘어지지 않습니다.'],
  ['stem', '기둥 세우기', '받침 중심에 기둥을 수직으로 세웁니다.', '핀바이스로 구멍을 내고 꽂아 붙이세요.'],
  ['shade', '갓 씌우기', '전개도를 말아 갓을 만들어 씌웁니다.', '트레이싱지나 한지를 쓰면 빛이 은은하게 비칩니다. 3mm LED를 넣으면 실제로 켤 수 있습니다.', [0, 1, 0]],
  ['hw', '디테일', '스위치·줄 같은 작은 부품을 더합니다.', ''],
];

/** 유리 구 스탠드(FADO). */
export function globeLamp(k, s) {
  const r = s.w / 2, bh = 34;
  k.ph('base', '받침');
  k.lathe('받침', [[0, 0], [r * 0.5, 0], [r * 0.5, bh * 0.4], [r * 0.4, bh], [0, bh]], [0, 0, 0], { role: 'frame' });
  k.ph('shade', '갓');
  k.sph('유리 구', r, [0, bh + r * 0.72, 0], { role: 'opal', ex: [0, 1, 0], glow: 1, note: '탁구공·반투명 구슬에 LED를 넣음' });
  k.flow(LAMP_FLOW);
}

/** 원뿔 받침 + 원뿔 갓(LAMPAN). */
export function coneLamp(k, s) {
  const { w, h } = s, r = w / 2, bh = h * 0.56, sh = h - bh + 8;
  k.ph('base', '받침');
  k.lathe('받침', [[0, 0], [r * 0.74, 0], [r * 0.3, bh], [0, bh]], [0, 0, 0], { role: 'plastic', stock: 'cone' });
  k.ph('shade', '갓');
  k.lathe('갓', [[r, 0], [r * 0.55, sh], [r * 0.55 - 2.5, sh], [r - 2.5, 0]], [0, bh - 8, 0], { closed: true, role: 'shade', ex: [0, 1, 0], glow: 0.9 });
  k.flow(LAMP_FLOW);
}

/** 플로어 스탠드: 원판 받침 + 기둥 + 머리. head: bowl | dome | drum | cylinder */
export function floorLamp(k, s) {
  const { h } = s, br = s.baseR, pr = k.D(s.pole ?? 16) / 2, bt = s.baseT ?? 22;
  k.ph('stem', '기둥');
  if (s.head === 'cylinder') {
    // 종이 원통 스탠드(HOLMÖ): 받침 다리 + 철사 링 + 종이 갓
    const r = s.shadeR, y0 = 70;
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; k.cyl('다리', 5, y0, [Math.cos(a) * r * 0.82, y0 / 2, Math.sin(a) * r * 0.82], { role: 'frame' }); }
    for (const y of [y0, h - 4]) k.lathe('철사 링', [[r - 3, -3], [r, 0], [r - 3, 3], [r - 6, 0]], [0, y, 0], { closed: true, role: 'frame', stock: 'wire' });
    k.cyl('전구 기둥', 6, h * 0.5, [0, y0 + h * 0.25, 0], { role: 'frame', opt: true, inner: true });
    k.ph('shade', '갓');
    k.lathe('종이 갓', [[r, 0], [r, h - y0 - 4], [r - 1.5, h - y0 - 4], [r - 1.5, 0]], [0, y0, 0], { closed: true, role: 'paper', ex: [0, 1, 0], glow: 0.8 });
    k.flow(LAMP_FLOW);
    return;
  }
  const hy = s.headY ?? h - (s.headH ?? 160), tilt = s.tilt ?? 0;
  k.cyl('받침', br, bt, [0, bt / 2, 0], { role: 'frame', bevel: 4, phase: 'base' });
  k.cyl('기둥', pr, hy - bt, [0, bt + (hy - bt) / 2, 0], { role: 'frame' });
  if (s.arm) {
    k.tube('목', [[0, hy - 6, 0], [0, hy + s.arm * 0.4, 0], [0, hy + s.arm * 0.5, s.arm]], pr * 0.8, { corner: s.arm * 0.4, role: 'frame' });
  }
  k.ph('shade', '갓');
  const hz = s.arm ? s.arm : 0, hyy = s.arm ? hy + s.arm * 0.5 : hy, hr = s.headR;
  if (s.head === 'dome') {
    // 큼직한 반구형 머리(HEKTAR)
    k.lathe('갓', [[hr * 0.24, hr * 0.92], [hr * 0.6, hr * 0.74], [hr * 0.9, hr * 0.36], [hr, 0], [hr - 3, 0], [hr * 0.87, hr * 0.34], [hr * 0.57, hr * 0.7], [hr * 0.22, hr * 0.86]], [0, hyy - hr * 0.2, hz], { closed: true, role: 'frame', rot: [tilt, 0, 0], ex: [0, 1, 0.5], stock: 'cone' });
    k.cyl('갓 꼭지', hr * 0.26, hr * 0.3, [0, hyy + hr * 0.78, hz - Math.sin((tilt * Math.PI) / 180) * hr * 0.9], { role: 'frame', rot: [tilt, 0, 0], ex: [0, 1, 0.5] });
    k.sph('전구', hr * 0.3, [0, hyy + hr * 0.12, hz + (tilt ? hr * 0.16 : 0)], { role: 'opal', glow: 1, opt: true, inner: true });
  } else if (s.head === 'bowl') {
    // 작은 원뿔 갓(LERSTA)
    k.lathe('갓', [[hr * 0.3, hr * 1.1], [hr, 0], [hr - 2.5, 0], [hr * 0.3 - 2.5, hr * 1.06]], [0, hyy - hr * 0.3, hz], { closed: true, role: 'metal', rot: [tilt, 0, 0], ex: [0, 1, 0.5], stock: 'cone' });
    k.cyl('소켓', hr * 0.32, hr * 0.5, [0, hyy + hr * 0.8, hz - Math.sin((tilt * Math.PI) / 180) * hr], { role: 'frame', rot: [tilt, 0, 0] });
    k.sph('전구', hr * 0.34, [0, hyy + hr * 0.1, hz + (tilt ? hr * 0.2 : 0)], { role: 'opal', glow: 1, opt: true, inner: true });
  }
  k.flow(LAMP_FLOW);
}

/** 주름 갓 탁상 스탠드(ÅRSTID). */
export function tableLamp(k, s) {
  const { w, h } = s, r = w / 2, sh = h * 0.32, bt = 16;
  k.ph('base', '받침');
  k.lathe('받침', [[0, 0], [r * 0.64, 0], [r * 0.64, 6], [r * 0.5, bt], [r * 0.12, bt + 8], [0, bt + 8]], [0, 0, 0], { role: 'metal' });
  k.ph('stem', '기둥');
  k.cyl('기둥', k.D(12) / 2, h - sh - bt, [0, bt + (h - sh - bt) / 2, 0], { role: 'metal' });
  k.sph('기둥 마디', 13, [0, h - sh - 20, 0], { role: 'metal' });
  k.tube('당김 줄', [[r * 0.2, h - sh + 10, 0], [r * 0.2, h - sh - 90, 0]], 1.2, { role: 'metal', phase: 'hw', group: '철물', opt: true });
  k.ph('shade', '갓');
  k.lathe('갓', [[r, 0], [r * 0.8, sh], [r * 0.8 - 2, sh], [r - 2, 0]], [0, h - sh, 0], { closed: true, role: 'shade', ex: [0, 1, 0], glow: 0.7 });
  k.sph('전구', r * 0.22, [0, h - sh * 0.55, 0], { role: 'opal', glow: 1, opt: true, inner: true });
  k.flow(LAMP_FLOW);
}

/** 스탠딩 거울(ISFJORDEN). */
export function standingMirror(k, s) {
  const { w, h } = s, f = k.D(30), lean = 9, t = k.T(22);
  const tan = Math.tan((lean * Math.PI) / 180), cy = h / 2, zc = (h / 2) * tan;
  k.ph('frame', '프레임');
  k.ext('거울 프레임', roundedRect(w, h / Math.cos((lean * Math.PI) / 180), 26, 6), t, 'xy', [0, cy, zc - s.d / 2 + t], { wall: f, role: 'body', rot: [-lean, 0, 0], ex: [0, 0, 1] });
  k.ext('거울', roundedRect(w - 2 * f + 8, h / Math.cos((lean * Math.PI) / 180) - 2 * f + 8, 10, 4), 3, 'xy', [0, cy, zc - s.d / 2 + t - 3], { role: 'mirror', rot: [-lean, 0, 0], ex: [0, 0, 1.6] });
  k.ext('뒤판', roundedRect(w - f, h / Math.cos((lean * Math.PI) / 180) - f, 16, 4), k.T(3), 'xy', [0, cy, zc - s.d / 2 + t - 8], { role: 'back', rot: [-lean, 0, 0], ex: [0, 0, -0.6], phase: 'back' });
  k.ph('stand', '받침 다리');
  const zt = 0.34 * h * tan - s.d / 2 + t - 14;
  strut(k, '받침 다리', [0, 0, -s.d / 2 + 16], [0, h * 0.66, zt - 4], [k.D(34), k.D(22)], { role: 'body', ex: [0, 0, -1] });
  k.flow([
    ['frame', '프레임', '고리 모양 프레임을 판재에서 오려 냅니다.', '안쪽을 먼저 도려낸 다음 바깥을 자르면 깨지지 않습니다.'],
    ['back', '거울과 뒤판', '프레임 뒤에 거울 시트를 붙이고 뒤판으로 덮습니다.', '거울은 미러 아크릴이나 미러 시트지를 씁니다.', [0, 0, -1]],
    ['stand', '받침 다리', '뒷면 위쪽에 받침 다리를 달아 비스듬히 세웁니다.', '천 테이프로 경첩을 만들면 각도를 조절할 수 있습니다.', [0, 0, -1]],
  ]);
}

export { stripProfile, arcPts, knob };
