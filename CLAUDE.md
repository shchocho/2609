# 작업 규칙

## 배포 안전 기준 (피싱 오탐 방지)

2026-11-19에 `shchocho.github.io` 전체가 Google 세이프 브라우징과 Microsoft SmartScreen에서 '사기성 사이트'로 판정돼 Chrome·Edge에서 차단됐다. 한 페이지가 걸리면 같은 호스트의 프로젝트가 전부 막힌다. 공개 URL로 배포하는 화면에는 아래를 넣지 않는다.

- 비밀번호·로그인 화면: `type="password"`, `autocomplete="current-password"`·`"username"`, "로그인"·"Sign in"·"계정 인증" 문구. 화면 내용을 비밀번호로 암호화해 두는 잠금 페이지도 포함한다. 막아야 하면 진짜 인증이 있는 호스트(Azure Static Web Apps + Entra ID, Cloudflare Access)로 옮긴다.
- 민감정보 입력칸: API 키·앱키·시크릿, 계좌·카드번호, OTP, 지갑 주소·시드 문구.
- 다른 회사 브랜드를 공식처럼 쓰기: title·og:title·헤더·파비콘의 GitHub·Microsoft·IKEA·은행·증권사 이름과 로고, 그 브랜드 고유의 색·UI 복제. 프로젝트 고유 이름을 앞에 두고 '비공식'을 밝힌다.
- 외부로 보내는 동작: 다른 도메인으로 제출하는 form, `meta refresh`·`location.replace`로 외부 이동, 단축 URL, 외부 로그인 페이지를 띄우는 iframe.
- 숨긴 코드: `eval`, `new Function`, `atob`·base64로 감싼 스크립트, 출처 불명 CDN.
- 실행 파일 직접 배포: `.exe` `.msi` `.apk` `.dmg`, 암호 걸린 `.zip`.

배포 전에 이 명령으로 점검하고, 걸린 항목은 고치거나 남기는 이유를 적는다.

```
grep -rniE 'type="password"|current-password|autocomplete="username"|비밀번호|로그인|sign ?in|api.?key|secret|계좌|카드번호|\botp\b|eval\(|new Function|atob\(|http-equiv="refresh"|\.exe|\.msi|\.apk' --exclude-dir=node_modules --exclude-dir=.git .
```

배포 후에는 `https://transparencyreport.google.com/safe-browsing/search?url=<호스트>` 조회와 Edge로 직접 열기로 경고가 없는지 확인한다. 판정을 받으면 원인을 없앤 뒤 Google 세이프 브라우징 오류 신고(또는 Search Console 검토 요청)와 Edge 경고 화면의 '이 사이트에 위협이 없다고 보고'를 각각 제출한다.
