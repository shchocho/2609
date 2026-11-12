/**
 * 이미지 시안 보기 스위치.
 * 주소에 ?look=draft 를 붙이면(예: http://localhost:5173/?look=draft#/start) 원본 부스에서 가져온
 * 이미지 대신 새로 그린 시안 이미지가 나옵니다. 기본 화면은 바뀌지 않습니다.
 */
export const DRAFT = (() => {
  try {
    return new URLSearchParams(window.location.search).get('look') === 'draft';
  } catch {
    return false;
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
