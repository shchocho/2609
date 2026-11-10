// util.js — 여러 빌더가 함께 쓰는 작은 부품들. 모두 +Z를 정면으로 만든다.

/** 둥근 손잡이(노브). pos = 붙는 면 위의 점. */
export function knob(k, pos, o = {}) {
  const r = o.r ?? 11, len = o.len ?? 22;
  k.lathe('손잡이', [[0, 0], [r * 0.42, 0], [r * 0.42, len * 0.4], [r * 0.95, len * 0.55], [r, len * 0.78], [r * 0.7, len * 0.97], [0, len]], pos,
    { rot: [90, 0, 0], role: o.role || 'knob', phase: o.phase || 'hw', group: '철물', stock: 'bead', ex: [0, 0, 1], note: '시침핀 머리나 비즈로 대체' });
}

/** 봉 손잡이. */
export function barHandle(k, pos, len, o = {}) {
  const r = o.r ?? 5, out = o.out ?? 26, [x, y, z] = pos, h = len / 2;
  const path = o.vertical
    ? [[x, y - h, z], [x, y - h, z + out], [x, y + h, z + out], [x, y + h, z]]
    : [[x - h, y, z], [x - h, y, z + out], [x + h, y, z + out], [x + h, y, z]];
  k.tube('손잡이', path, r, { corner: out * 0.5, role: o.role || 'knob', phase: o.phase || 'hw', group: '철물', ex: [0, 0, 1], note: '철사를 ㄷ자로 구부려 꽂음' });
}

/** 바퀴. 바닥(y=0)에서 높이 h까지. */
export function caster(k, x, z, h, o = {}) {
  const wr = Math.min(h * 0.42, o.r ?? 24);
  k.cyl('바퀴', wr, o.w ?? wr * 0.8, [x, wr, z], { axis: 'x', role: 'wheel', phase: o.phase || 'base', group: '받침', ex: [0, -1, 0] });
  k.cyl('바퀴 축', Math.min(8, wr * 0.4), h - wr, [x, wr + (h - wr) / 2, z], { role: 'metal', phase: o.phase || 'base', group: '받침', ex: [0, -1, 0] });
}

/** 네 귀퉁이에 같은 부품을 놓는다. fn(x, z, sx, sz) */
export function corners(xh, zh, fn) {
  for (const sx of [1, -1]) for (const sz of [1, -1]) fn(sx * xh, sz * zh, sx, sz);
}

/** a → b 를 잇는 각재(상자). 두 점 사이를 기울어진 막대로 채운다(XY 또는 ZY 평면). */
export function strut(k, name, a, b, sec, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz);
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  // 기본 축은 Y. X회전(앞뒤 기울기) 후 Z회전(좌우 기울기).
  const rx = Math.atan2(dz, dy) * 180 / Math.PI;
  const rz = -Math.atan2(dx, Math.hypot(dy, dz)) * 180 / Math.PI;
  const s = Array.isArray(sec) ? sec : [sec, sec];
  if (o.round) return k.cyl(name, s[0] / 2, len, mid, { ...o, rot: [rx, 0, rz] });
  return k.box(name, [s[0], len, s[1]], mid, { ...o, rot: [rx, 0, rz] });
}

/** 등간격 좌표. */
export function spread(n, a, b) {
  if (n === 1) return [(a + b) / 2];
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
}
