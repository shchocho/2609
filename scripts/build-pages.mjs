#!/usr/bin/env node
/**
 * GitHub Pages 배포용 빌드: 파일 하나로 묶은 빌드(dist-local/)를 공개용 dist-pages/ 로 옮깁니다.
 *
 * 2026-11-19: 비밀번호 잠금(AES-GCM 암호화 + 비밀번호 입력 화면)을 없앴습니다.
 * shchocho.github.io 전체가 Google 세이프 브라우징·Microsoft SmartScreen에서 '사기성 사이트'로 판정됐고,
 * 'Copilot 이름·로고 + 비밀번호 칸 + 암호화된 내용' 조합이 피싱 페이지와 똑같아 보이는 것이 유력한 원인이었습니다.
 * 이 사이트는 가상 인물·가상 데이터만 쓰는 공용 체험(시연) 사이트라 공개로 바꿨습니다.
 * 다시 막아야 하면 github.io 가 아니라 진짜 인증이 있는 호스트(Azure Static Web Apps + Entra ID 등)로 옮기세요.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'dist-local');
const out = join(root, 'dist-pages');
// 로컬 실행용 안내 파일과 시안 보기 바로가기는 배포하지 않습니다.
const SKIP = new Set(['사용방법.txt', '시안 보기.html']);

if (!existsSync(join(src, 'index.html'))) {
  console.error('dist-local/index.html 이 없습니다. npm run build:local 을 먼저 실행하세요.');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const name of readdirSync(src)) {
  if (!SKIP.has(name)) cpSync(join(src, name), join(out, name), { recursive: true });
}
writeFileSync(join(out, '.nojekyll'), '');
console.log(`✓ dist-pages/ 준비 완료 — 화면 ${(statSync(join(out, 'index.html')).size / 1048576).toFixed(1)}MB (공개, 잠금 없음)`);
