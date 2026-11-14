import type { Track } from './types';

/** 고객사(사랑의교회) 교육용 실습 영역 5개 — docs/customer-sarang/PLAN.md */
export const TRACKS: Track[] = [
  {
    id: 'teams-basics',
    products: ['teamsapp'],
    name: 'Teams 기본',
    icon: '💬',
    color: '#5b5fc7',
    textColor: '#3d3e78',
    about: '그룹 채팅, 일정, 팀·채널 파일 공유를 순서대로 눌러 보며 익힙니다.',
  },
  {
    id: 'copilot-chat',
    products: ['chat'],
    name: 'Copilot Chat',
    icon: '✨',
    color: '#0a6bba',
    textColor: '#0a6bba',
    about: '공지 문구 다듬기, 규정 문서에서 답 찾기, 행사 포스터 시안을 대화로 해결합니다.',
  },
  {
    id: 'm365-apps',
    products: ['word', 'powerpoint', 'excel', 'outlook', 'teams', 'forms'],
    name: 'Copilot in 앱',
    icon: '📝',
    color: '#185abd',
    textColor: '#124078',
    about: 'Word, Excel, PowerPoint, Outlook, Teams, Forms 안에서 바로 Copilot에 맡깁니다.',
  },
  {
    id: 'copilot-agent',
    products: ['studio', 'cowork'],
    name: 'Copilot 에이전트',
    icon: '🤖',
    color: '#7a5cff',
    textColor: '#5c3d8a',
    about: '안내 자료로 답하는 에이전트를 만들고, 여러 단계의 일을 맡겨 봅니다.',
  },
  {
    id: 'copilot-code',
    products: ['code'],
    name: 'Copilot Code',
    icon: '🧩',
    color: '#0f7b6c',
    textColor: '#0b5a4f',
    about: '개발자가 아니어도 말로 설명해 사역에 쓸 작은 앱을 만듭니다.',
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
