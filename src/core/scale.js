// scale.js — 축척과 시판 재료 규격.

export const SCALES = [
  { n: 6, label: '1:6', name: '플레이스케일', note: '패션 인형(약 30cm) 크기. 디테일을 살리기 쉽다.' },
  { n: 12, label: '1:12', name: '돌하우스 표준', note: '1인치 스케일. 재료와 소품을 구하기 가장 쉽다.' },
  { n: 18, label: '1:18', name: '다이캐스트', note: '자동차 모형과 같은 크기.' },
  { n: 24, label: '1:24', name: '하프 스케일', note: '책장 안에 방 하나가 들어간다.' },
  { n: 48, label: '1:48', name: '쿼터 스케일', note: '판재는 종이, 다리는 철사로 바꿔야 한다.' },
];

/** 국내 모형·화방에서 구하기 쉬운 판재 두께(mm). */
export const SHEET_STOCK = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
/** 환봉·각재·황동봉 지름/변(mm). */
export const ROD_STOCK = [0.5, 0.8, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15];

const nearest = (list, x) => {
  let best = list[0], bd = Infinity;
  for (const s of list) {
    const d = Math.abs(Math.log(s / x));
    if (d < bd) { bd = d; best = s; }
  }
  return best;
};

export const snapSheet = (mini) => nearest(SHEET_STOCK, Math.max(mini, 0.01));
export const snapRod = (mini) => nearest(ROD_STOCK, Math.max(mini, 0.01));

export const r1 = (x) => Math.round(x * 10) / 10;
export const r2 = (x) => Math.round(x * 100) / 100;

/** mm 값을 읽기 좋은 문자열로. */
export function fmt(x, digits = 1) {
  const v = Math.round(x * 10 ** digits) / 10 ** digits;
  return Number.isInteger(v) ? String(v) : v.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
}

export const mini = (real, n) => real / n;

/** 실물 치수 → "66.7 × 23.3 × 168.3" */
export function dimsText(dims, n = 1, digits = 1) {
  return dims.map((d) => fmt(d / n, digits)).join(' × ');
}

/** 축척별 제작 난이도 보정: 부품이 얇아질수록 어렵다. */
export function scaleDifficulty(base, n) {
  const adj = n <= 6 ? -0.5 : n <= 12 ? 0 : n <= 18 ? 0.5 : n <= 24 ? 1 : 2;
  return Math.max(1, Math.min(5, Math.round(base + adj)));
}
