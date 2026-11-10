import type { Track } from './types';

/** 공용(일반 기업) 버전 트랙 — 부서별 업무 영역 */
export const TRACKS: Track[] = [
  {
    id: 'sales',
    name: '영업·마케팅',
    icon: '📣',
    color: '#b11f4b',
    textColor: '#8e183c',
    about: '제안 발표자료, 시장 동향 뉴스레터와 행사 시안을 준비합니다.',
    intro: [{
      tone: 'problem',
      icon: '📣',
      caption: '입찰 마감과 행사 일정이 겹치는데 제안서 표현 기준과 브랜드 가이드를 동시에 챙겨야 합니다.\n지난 자료를 뒤지느라 정작 고객 이야기에 집중할 시간이 부족합니다.',
    }],
  },
  {
    id: 'hr',
    name: '인사',
    icon: '👥',
    color: '#0a6bba',
    textColor: '#0a6bba',
    about: '채용 서류 정리, 신규 입사자 온보딩과 사내 규정 문의를 돕습니다.',
    intro: [{
      tone: 'problem',
      icon: '👥',
      caption: '채용 시즌에는 지원서 검토와 입사자 온보딩, 반복되는 규정 문의가 한꺼번에 몰립니다.\n인사규정과 안내 문서를 일일이 찾아 답하느라 정작 사람을 만날 시간이 줄어듭니다.',
    }],
  },
  {
    id: 'finance',
    name: '재무·회계',
    icon: '🧾',
    color: '#c8951a',
    textColor: '#8a6410',
    about: '부서별 예산 취합, 집행 편차 점검과 분기 마감 보고를 돕습니다.',
    intro: [{
      tone: 'problem',
      icon: '🧾',
      caption: '부서마다 제출하는 지출 내역 양식과 계정과목명이 달라 취합에 시간이 걸립니다.\n분기 마감 때는 편차 원인 확인과 경영회의 보고자료 준비까지 겹칩니다.',
    }],
  },
  {
    id: 'procurement',
    name: '구매·법무',
    icon: '⚖️',
    color: '#6c4bb6',
    textColor: '#5b3ea0',
    about: '견적 비교, 발주 전 계약 조건 검토와 계약서 초안을 준비합니다.',
    intro: [{
      tone: 'problem',
      icon: '⚖️',
      caption: '견적서마다 포함 범위가 다르고, 계약 조건은 여러 이메일과 첨부에 흩어져 있습니다.\n표준 계약 조건과 하나하나 대조하다 보면 발주 일정이 늦어집니다.',
    }],
  },
  {
    id: 'ops',
    name: '운영·소통',
    icon: '🤝',
    color: '#2b8a6e',
    textColor: '#1f6852',
    about: '납기 지연 대응, 고객 기술 문의 답변과 보도자료를 준비합니다.',
    intro: [{
      tone: 'problem',
      icon: '🤝',
      caption: '부품 통관 지연 메일이 오면 재고·소요량·생산 계획을 각각 확인해야 합니다.\n고객 기술 문의와 신제품 보도자료도 매뉴얼과 홍보 기준에 맞춰 다듬어야 합니다.',
    }],
  },
  /* ---------- 제품 기능 체험 (docs/EXPANSION-PLAN.md) ---------- */
  {
    id: 'm365-apps',
    group: 'product',
    products: ['word', 'powerpoint', 'excel'],
    name: 'Copilot in 앱',
    icon: '📝',
    color: '#185abd',
    textColor: '#124078',
    about: 'Word·PowerPoint·Excel 안에서 초안, 발표자료, 데이터 분석을 맡깁니다.',
  },
  {
    id: 'copilot-code',
    group: 'product',
    products: ['code'],
    name: 'Copilot Code',
    icon: '🧩',
    color: '#0f7b6c',
    textColor: '#0b5a4f',
    about: '개발자가 아니어도 말로 설명해 업무용 앱과 자동화를 만듭니다.',
  },
  {
    id: 'power-automate',
    group: 'product',
    products: ['deskflow', 'cloudflow'],
    name: 'Power Automate',
    icon: '⚙️',
    color: '#0066ff',
    textColor: '#0047b3',
    about: '데스크톱 흐름(RPA)과 클라우드 흐름(DPA)으로 반복 업무를 자동화합니다.',
  },
  {
    id: 'copilot-studio',
    group: 'product',
    products: ['studio'],
    name: 'Copilot Studio',
    icon: '🤖',
    color: '#7a5cff',
    textColor: '#5c3d8a',
    about: '하네스를 골라 우리 업무에 맞는 에이전트를 만들고 게시합니다.',
  },
];

export const TRACK_IDS = TRACKS.map(t => t.id);
export const trackById = (id: string) => TRACKS.find(t => t.id === id);

/** 트랙 색을 CSS 변수로 노출 (--track-<id>, --track-<id>-ink) */
export function applyTrackColors(el: HTMLElement = document.documentElement) {
  for (const t of TRACKS) {
    el.style.setProperty(`--track-${t.id}`, t.color);
    el.style.setProperty(`--track-${t.id}-ink`, t.textColor);
  }
}
