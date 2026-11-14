/**
 * 이미지 시안 보기 스위치.
 * 고객사 실습 사이트는 새로 그린 시안 이미지가 기본값입니다. 주소에 ?look=original 을 붙이면 원본 부스에서 가져온
 * 이미지로 되돌려 볼 수 있습니다.
 */
export const DRAFT = (() => {
  try {
    return new URLSearchParams(window.location.search).get('look') !== 'original';
  } catch {
    return true;
  }
})();

/** 시안 모드에서 바꿔 끼울 이미지 경로 */
export const DRAFT_ASSETS: Record<string, string> = {
  'graphic/event-poster/01-hands.jpg': 'draft/poster/01-hands.jpg',
  'graphic/event-poster/02-bulb.jpg': 'draft/poster/02-bulb.jpg',
  'graphic/event-poster/03-tools.jpg': 'draft/poster/03-tools.jpg',
  'graphic/event-poster/04-whiteboard.jpg': 'draft/poster/04-whiteboard.jpg',
  'graphic/event-poster/05-brand-poster.jpg': 'draft/poster/05-brand-poster.jpg',
  'graphic/event-poster/06-tshirt.png': 'draft/poster/06-tshirt.png',
};
