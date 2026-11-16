#!/usr/bin/env node
/**
 * GitHub Pages 배포용 빌드: 파일 하나로 묶은 빌드(dist-local/index.html)를 비밀번호로 암호화해 dist-pages/ 를 만듭니다.
 * - 비밀번호는 환경 변수 PAGE_PASSWORD 로만 받습니다. 저장소에는 적지 않습니다.
 * - 암호화: PBKDF2(SHA-256) 로 비밀번호에서 키를 만들고 AES-GCM 으로 암호화. 비밀번호 없이는 화면 내용을 읽을 수 없습니다.
 * - 맞는 비밀번호를 넣으면 그 탭(세션) 동안만 열립니다. 탭이나 브라우저를 닫으면 다시 잠깁니다.
 * - 이미지·영상·로고 파일은 암호화하지 않고 따로 둡니다(첫 로딩 속도 때문).
 */
import { webcrypto as crypto } from 'node:crypto';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const password = process.env.PAGE_PASSWORD;
if (!password) {
  console.error('PAGE_PASSWORD 환경 변수에 비밀번호를 넣어 실행하세요.');
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'dist-local');
const out = join(root, 'dist-pages');
const ITERATIONS = 600000;
const SKIP = new Set(['index.html', '사용방법.txt', '시안 보기.html']);

const html = readFileSync(join(src, 'index.html'));
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
  base,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt'],
);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, html));
const b64 = u8 => Buffer.from(u8).toString('base64');
const payload = JSON.stringify({ salt: b64(salt), iv: b64(iv), iterations: ITERATIONS, data: b64(data) });

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const name of readdirSync(src)) {
  if (!SKIP.has(name)) cpSync(join(src, name), join(out, name), { recursive: true });
}
writeFileSync(join(out, '.nojekyll'), '');
writeFileSync(join(out, 'index.html'), gatePage(payload));
// /start 로 들어와도 열리게 한다 (화면 주소는 #/start 형식이라 Pages 에서는 폴더가 있어야 404 가 나지 않는다)
mkdirSync(join(out, 'start'));
writeFileSync(join(out, 'start', 'index.html'), '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><meta http-equiv="refresh" content="0;url=../#/start"><title>Teams · Copilot 실습</title><a href="../#/start">실습 사이트 열기</a>');
console.log(`✓ dist-pages/ 준비 완료 — 암호화한 화면 ${(html.length / 1048576).toFixed(1)}MB`);

function gatePage(json) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Teams · Copilot 실습</title>
<link rel="icon" href="logo/copilot/copilot.png">
<style>
  :root { color-scheme: light; --ink: #1b1a19; --ink-2: #5a6b8c; --line: #d6deea; --accent: #0f6cbd; --bad: #c4314b; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    display: grid; place-items: center; padding: 16px;
    font-family: "Pretendard Variable", Pretendard, -apple-system, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
    color: var(--ink);
    background:
      radial-gradient(60% 70% at 8% 12%, #e4d9ff 0%, transparent 60%),
      radial-gradient(55% 65% at 88% 6%, #9fd0ff 0%, transparent 62%),
      radial-gradient(50% 60% at 78% 92%, #c4f0df 0%, transparent 64%),
      linear-gradient(160deg, #eef3ff 0%, #e6efff 48%, #eaf6f3 100%);
  }
  .gate {
    width: min(420px, 100%); padding: 40px 32px 28px; border-radius: 24px; text-align: center;
    background: rgba(255, 255, 255, .82); border: 1px solid rgba(255, 255, 255, .9);
    box-shadow: 0 24px 48px -20px rgba(40, 60, 110, .28);
  }
  .gate img { width: 56px; height: 56px; }
  h1 { margin: 14px 0 6px; font-size: 24px; }
  p { margin: 0; color: var(--ink-2); font-size: 15px; }
  form { display: grid; gap: 10px; margin-top: 24px; }
  input {
    height: 48px; padding: 0 16px; border-radius: 12px; border: 1.5px solid var(--line);
    font: inherit; font-size: 16px; background: #fff; color: var(--ink);
  }
  input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(15, 108, 189, .18); }
  button {
    height: 48px; border: 0; border-radius: 999px; background: #242424; color: #fff;
    font: inherit; font-size: 16px; font-weight: 700; cursor: pointer;
  }
  button:disabled { opacity: .6; cursor: progress; }
  .msg { min-height: 22px; margin-top: 12px; color: var(--bad); font-size: 14px; }
  .note { margin-top: 6px; font-size: 13px; }
  body.is-checking .gate { visibility: hidden; }
</style>
</head>
<body class="is-checking">
<main class="gate">
  <img src="logo/copilot/copilot.png" alt="">
  <h1>Teams · Copilot 실습</h1>
  <p>비밀번호를 입력해 주세요.</p>
  <form id="gate-form">
    <input id="gate-pw" type="password" autocomplete="current-password" aria-label="비밀번호" placeholder="비밀번호" required>
    <button id="gate-btn" type="submit">열기</button>
  </form>
  <p id="gate-msg" class="msg" role="alert"></p>
  <p class="note">창을 닫으면 다시 잠깁니다.</p>
</main>
<script type="application/json" id="gate-data">${json}</script>
<script>
(function () {
  var STORE = 'sarang-practice:key';
  var P = JSON.parse(document.getElementById('gate-data').textContent);
  var form = document.getElementById('gate-form');
  var input = document.getElementById('gate-pw');
  var btn = document.getElementById('gate-btn');
  var msg = document.getElementById('gate-msg');
  function bytes(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function text(u) { var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function show() { document.body.classList.remove('is-checking'); input.focus(); }
  function decrypt(key) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(P.iv) }, key, bytes(P.data))
      .then(function (buf) { return new TextDecoder().decode(buf); });
  }
  function render(html) {
    // 페이지를 다 불러온 뒤에 바꿔야 잠금 화면 위에 덧붙지 않고 통째로 바뀝니다
    if (document.readyState !== 'complete') { window.addEventListener('load', function () { render(html); }, { once: true }); return; }
    document.open(); document.write(html); document.close();
  }
  function save(key) {
    return crypto.subtle.exportKey('raw', key).then(function (raw) {
      try { sessionStorage.setItem(STORE, text(new Uint8Array(raw))); } catch (e) {}
    });
  }
  if (!window.crypto || !crypto.subtle) {
    msg.textContent = '이 브라우저에서는 열 수 없습니다. 최신 Edge나 Chrome으로 열어 주세요.';
    show();
    return;
  }
  var stored = null;
  try { stored = sessionStorage.getItem(STORE); } catch (e) {}
  if (stored) {
    crypto.subtle.importKey('raw', bytes(stored), 'AES-GCM', true, ['decrypt'])
      .then(decrypt)
      .then(render)
      .catch(function () { try { sessionStorage.removeItem(STORE); } catch (e) {} show(); });
  } else {
    show();
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    btn.disabled = true; btn.textContent = '여는 중…'; msg.textContent = '';
    var key;
    crypto.subtle.importKey('raw', new TextEncoder().encode(input.value), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: bytes(P.salt), iterations: P.iterations, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
      })
      .then(function (k) { key = k; return decrypt(k); })
      .then(function (html) { return save(key).then(function () { render(html); }); })
      .catch(function () {
        btn.disabled = false; btn.textContent = '열기';
        msg.textContent = '비밀번호가 맞지 않습니다.';
        input.select();
      });
  });
})();
</script>
</body>
</html>
`;
}
