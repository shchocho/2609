// materials.js — 재질 라이브러리. t = 종류, c = 대표색, c2 = 나뭇결 어두운 색.
// 3D 렌더(PBR)와 도면 색상이 같은 표를 쓴다.

const wood = (c, c2, sp, extra) => ({ t: 'wood', c, c2, sp, ...extra });
const paint = (c, rough = 0.42) => ({ t: 'paint', c, rough });
const fab = (c, extra) => ({ t: 'fabric', c, ...extra });
const pl = (c, rough = 0.38) => ({ t: 'plastic', c, rough });
const matte = (c) => ({ t: 'matte', c });

export const MATERIALS = {
  // 도장·포일
  white: paint('#f3f2ee'), black: paint('#1d1d1e', 0.4), gray: paint('#9b9d9c'), anthracite: paint('#3b3e42'),
  grayblue: paint('#8ea4a8'), sage: paint('#a3b39c'), beige: paint('#d9cdb7'), red: paint('#b02a22'), blue: paint('#2f5f8a'),
  navy: paint('#243650'), green: paint('#3f6e52'), yellow: paint('#e0b23a'), pink: paint('#e7b5b2'), turq: paint('#3f9aa0'),
  drawerwhite: paint('#eceae4', 0.55),
  // 목재
  birch: wood('#e3cfa8', '#c9b088', 'birch'), pine: wood('#e5c48c', '#c2955a', 'pine'), oak: wood('#c8a56e', '#9d7844', 'oak'),
  oakw: wood('#dcd1bc', '#bcae96', 'oak'), ash: wood('#dac59d', '#b59a6a', 'oak'), walnut: wood('#7b5637', '#52351f', 'walnut'),
  blackbrown: wood('#3b2d25', '#241a15', 'oak'), beech: wood('#dfbe94', '#c39a69', 'beech'), acacia: wood('#a66d3c', '#774720', 'walnut'),
  lightbrown: wood('#b88954', '#8c6033', 'pine'), graystain: wood('#8f8d88', '#6c6a65', 'pine'), blackstain: wood('#2a2726', '#171514', 'pine'),
  whitestain: wood('#eeebe2', '#d9d4c7', 'pine'),
  // 금속
  chrome: { t: 'metal', c: '#dadde0', rough: 0.1 }, steel: { t: 'metal', c: '#b8bbbf', rough: 0.3 }, alu: { t: 'metal', c: '#c8cbcf', rough: 0.36 },
  galv: { t: 'metal', c: '#b3b8bc', rough: 0.46, tex: 'galv' }, brass: { t: 'metal', c: '#c7a049', rough: 0.24 },
  blackmetal: { t: 'coat', c: '#202123', rough: 0.5 }, whitemetal: { t: 'coat', c: '#eeeeea', rough: 0.5 },
  // 유리
  glass: { t: 'glass', c: '#dcefe8' }, smoke: { t: 'glass', c: '#4c5255', op: 0.6 }, mirror: { t: 'mirror', c: '#e6edf0' },
  // 원단
  'fab-beige': fab('#cdbfa7'), 'fab-gray': fab('#9a9b99'), 'fab-dark': fab('#4b4d51'), 'fab-blue': fab('#3f5f86'), 'fab-green': fab('#4e6751'),
  'fab-white': fab('#e8e5dd'), 'fab-yellow': fab('#d8a52c'), 'fab-rust': fab('#a7432f'), 'fab-turq': fab('#5a9aa0'), 'fab-black': fab('#252526'),
  'fab-natural': fab('#d7cbb4'), 'fab-pink': fab('#d9a7a0'), 'leather-black': { t: 'leather', c: '#1f1f20' }, 'leather-brown': { t: 'leather', c: '#8a5a34' },
  mesh: { t: 'mesh', c: '#2b2c2e' }, mattress: fab('#f1efe9', { fine: true }), pillow: fab('#f6f4ef', { fine: true }), duvet: fab('#e6e1d6', { fine: true }),
  // 플라스틱
  'pl-white': pl('#f1f1ed'), 'pl-red': pl('#c8302a'), 'pl-blue': pl('#2c6ba9'), 'pl-green': pl('#6fa84b'), 'pl-yellow': pl('#efc43a'),
  'pl-pink': pl('#e9a7b4'), 'pl-black': pl('#242424'), 'pl-gray': pl('#9c9e9f'), 'pl-beige': pl('#d8cebc'), 'pl-anthracite': pl('#3c3f43'),
  'pl-olive': pl('#747b50'), 'pl-mustard': pl('#c7953a'), 'pl-turq': pl('#4aa3a6'), rubber: pl('#2b2b2c', 0.72),
  // 조명
  paper: { t: 'paper', c: '#f4eedf' }, shadewhite: { t: 'paper', c: '#f0ebe1' }, opal: { t: 'opal', c: '#fbf5e8' },
  // 기타
  pegboard: { t: 'pegboard', c: '#f0efea' }, screen: paint('#121315', 0.12), glow: { t: 'emit', c: '#ff5b3b' },
  // ── 룸 세트·소품(도면·재단표에는 쓰이지 않는다)
  leaf: { t: 'leaf', c: '#4d8748' }, leafdark: { t: 'leaf', c: '#2c643c' }, leaflight: { t: 'leaf', c: '#84a85a' }, leafgray: { t: 'leaf', c: '#7f9a86' },
  terracotta: matte('#b96c45'), soil: matte('#35281f'), stone: matte('#b9b6ae'), cream: matte('#ebe4d4'), kraft: matte('#b99668'),
  ceramic: paint('#ece7dc', 0.22), 'ceramic-blue': paint('#3f5d7d', 0.22), 'ceramic-black': paint('#27282a', 0.3), 'ceramic-sage': paint('#9fb39a', 0.25),
  orange: paint('#de8a2c', 0.5), ochre: paint('#c98f3c', 0.55), rust: paint('#a9512f', 0.55), teal: paint('#2f6b6d', 0.5), plum: paint('#6c4458', 0.5), ink: paint('#1f2a36', 0.5),
  basket: fab('#c3a06d'), jute: fab('#bfa57c'), linen: fab('#e3dccd', { fine: true }), 'fab-ochre': fab('#c9953e'), 'fab-sage': fab('#9fb096'), 'fab-terracotta': fab('#b9684a'),
  'fab-navy': fab('#2c3f5c'), 'fab-cream': fab('#ebe5d6'), 'fab-blush': fab('#e0b9ae'), 'fab-teal': fab('#3d7477'), 'fab-charcoal': fab('#3a3c40'),
  'wall-white': matte('#efebe2'), 'wall-greige': matte('#d3ccbd'), 'wall-sage': matte('#b4c2ab'), 'wall-blue': matte('#a9bdc9'), 'wall-blush': matte('#e4c3b3'),
  'wall-mustard': matte('#dab75f'), 'wall-green': matte('#4b6758'), 'wall-charcoal': matte('#4a4e51'), 'wall-navy': matte('#34485f'), 'wall-terracotta': matte('#c98766'),
  'wall-sky': matte('#c9dde6'), 'wall-yellow': matte('#f0dd9f'), 'wall-pink': matte('#eccfcc'), 'wall-mint': matte('#cfe3d6'),
  'floor-oak': { t: 'floor', c: '#c9a36c', c2: '#a37c48', style: 'plank' }, 'floor-light': { t: 'floor', c: '#dfcba6', c2: '#c4aa7f', style: 'plank' },
  'floor-walnut': { t: 'floor', c: '#8a6340', c2: '#5f4126', style: 'plank' }, 'floor-gray': { t: 'floor', c: '#b9b3a8', c2: '#9a948a', style: 'plank' },
  'floor-parquet': { t: 'floor', c: '#c7a16b', c2: '#a17a47', style: 'parquet' }, 'floor-tile': { t: 'floor', c: '#dcd8cf', c2: '#b4afa5', style: 'tile' },
  'floor-check': { t: 'floor', c: '#ece8df', c2: '#3c4044', style: 'check' }, 'floor-concrete': { t: 'floor', c: '#b7b6b1', c2: '#a3a29d', style: 'concrete' },
  sky: { t: 'emit', c: '#dfeeff', k: 1.25 }, lampglow: { t: 'emit', c: '#ffe2b0', k: 1.5 },
};

/** 마감에 역할이 지정되지 않았을 때의 대체 순서. '=' 는 다른 역할을 따라간다는 뜻. */
const FALLBACK = {
  body: 'white', front: '=body', top: '=body', back: '=body', leg: '=body', frame: '=body', accent: '=body', accent2: '=accent',
  drawer: 'drawerwhite', slat: 'birch', knob: 'steel', metal: 'chrome', glass: 'glass', mirror: 'mirror', smoke: 'smoke',
  fabric: 'fab-gray', cushion: '=fabric', seat: '=fabric', mattress: 'mattress', pillow: 'pillow', duvet: 'duvet',
  plastic: 'pl-white', wheel: 'rubber', shade: 'shadewhite', paper: 'paper', opal: 'opal', mesh: 'mesh',
  pegboard: 'pegboard', screen: 'screen', glow: 'glow',
};

export function materialKey(role, finish) {
  const map = (finish && finish.map) || {};
  let r = role;
  for (let i = 0; i < 5; i++) {
    if (map[r]) return map[r];
    const fb = FALLBACK[r];
    if (!fb) return 'white';
    if (fb[0] !== '=') return fb;
    r = fb.slice(1);
  }
  return 'white';
}

export function materialOf(role, finish) {
  const key = materialKey(role, finish);
  return { key, ...(MATERIALS[key] || MATERIALS.white) };
}

export const MATERIAL_NAMES = {
  wood: '원목·무늬목', paint: '도장', metal: '금속', coat: '분체 도장 금속', glass: '유리', mirror: '거울', fabric: '원단', leather: '가죽',
  mesh: '망사', plastic: '플라스틱', paper: '종이', opal: '유백 유리', pegboard: '타공판', emit: '발광', leaf: '잎', matte: '무광 도장', floor: '바닥재',
};
