#!/usr/bin/env node
// 로컬 확인용 빌드(dist-local/)에 사용 안내 파일을 넣는다.
import { writeFileSync } from 'node:fs';

const text = `Teams · Copilot 실습 사이트(사랑의교회 교육용) — 로컬 확인용

1. 이 폴더의 index.html 을 더블클릭하세요.
   (Microsoft Edge 또는 Chrome 권장, 인터넷 연결 없이도 동작합니다)
2. 창을 가로 1371 × 세로 768 이상으로 키우면 부스 화면과 같은 비율로 보입니다.
   F11 키로 전체 화면을 쓰면 가장 보기 좋습니다.
3. 첫 화면 아무 곳이나 누르면 실습 영역 선택 화면으로 넘어갑니다.

폴더 안의 파일(logo, brand, graphic 등)은 index.html 과 같은 위치에 그대로 두어야 합니다.
`;
writeFileSync(new URL('../dist-local/사용방법.txt', import.meta.url), text.replace(/\n/g, '\r\n'));
console.log('✓ dist-local/ 준비 완료 — index.html 을 더블클릭해 여세요');
