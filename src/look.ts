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
