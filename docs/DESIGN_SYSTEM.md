# 디자인 시스템 — "작업대"

화면 전체가 1cm 눈금이 그려진 커팅 매트 위의 작업대입니다. 패널은 작업대에 놓인 물체처럼 그림자를 드리우고, 버튼은 실제로 내려앉으며, 사진(3D)은 포인터를 따라 기울어집니다. 토큰과 컴포넌트는 모두 `styles/app.css` 에 있습니다.

## 토큰

| 범주 | 토큰 | 뜻 |
| --- | --- | --- |
| 색 | `--bg` `--surface` `--surface-2` `--sunk` | 작업대 → 올려놓은 판 → 가장 위 → 파인 홈 |
| | `--ink` `--ink-2` `--ink-3` `--line` | 본문 → 보조 → 흐린 글자, 경계선 |
| | `--mat` `--on-mat` | 브랜드: 커팅 매트 초록 |
| | `--tape` `--on-tape` | 강조: 마스킹 테이프 노랑(선택·주목 하나에만) |
| | `--ok` `--warn` `--bad` | 상태색(강조색과 분리) |
| 글자 | `--f-display` Archivo(폭 확장) | 제품명·숫자 표제 |
| | `--f-body` IBM Plex Sans KR | 본문 |
| | `--f-mono` IBM Plex Mono | 치수·순번·계측 표시 |
| 크기 | `--t-xs` … `--t-3xl` | 0.72rem → 최대 4.9rem |
| 간격 | `--s1` … `--s8` | 4px 기준 |
| 모서리 | `--r1` … `--r4` | 5 · 9 · 14 · 22px |
| 높이 | `--e1` `--e2` `--e3` `--well` | 놓임 → 떠 있음 → 사진 프레임, 파인 홈 |
| 움직임 | `--d1` `--d2` `--d3`, `--ease` `--spring` | 120 · 240 · 520ms |

라이트·다크 두 테마를 토큰 수준에서 정의합니다(`prefers-color-scheme` + `data-theme`). 다크는 "밤의 커팅 매트"입니다.

## 컴포넌트

| 컴포넌트 | 변형 | 상태 | 접근성 |
| --- | --- | --- | --- |
| `.btn` 키캡 버튼 | `--mat` `--tape` `--ghost` `--icon` `--sm` `--lg` | hover(뜸) · active(내려앉음) · `aria-pressed` · disabled | 최소 40px(작은 것 32px), 포커스 링 노랑 |
| `.seg` 세그먼트 | `--mono` | `aria-pressed` | `role="group"` + 레이블 |
| `.tabs` / `.tabpanel` | | `aria-selected` | `role="tablist"`/`tab`/`tabpanel` |
| `.switch` | | checked · focus | 실제 `checkbox` |
| `.range` | | `--p` 로 채움 표시 | `aria-label` |
| `.card` 가구 카드 | | 포인터 틸트(`--rx` `--ry`), 빛 반사(`--gx` `--gy`) | 링크 하나, 터치·동작 줄이기에서는 틸트 끔 |
| `.panel` / `.well` / `.field` | `--flat` | | |
| `.tape` 테이프 라벨 | | | 장식이 아니라 분류·순번 표시에만 |
| `.hud` 계측 표시 | `--tl` `--tr` `--bl` `--br` `--c` | | 3D 위 보조 정보, `pointer-events: none` |
| `.viewer` 3D·도면 뷰어 | 전체 화면 | | 캔버스 `role="img"`, 같은 정보가 표·탭에 있음 |
| `.t` 표 | | 행 hover·`is-on` | `scope="col"`, 행은 키보드로 선택 |
| `.step` 조립 단계 | `is-done` | `aria-current="step"` | 완료 버튼 `aria-pressed` |
| `.toast` | | | `role="status"` |

## 원칙

1. **3D가 주인공**: 사진 프레임은 한 화면에 하나. 나머지는 조용하게.
2. **강조는 테이프 하나**: 노랑은 선택·현재 단계·치수 라벨에만 씁니다.
3. **숫자는 계측기처럼**: 치수와 순번은 고정폭, 바뀔 때는 굴러가며 바뀝니다.
4. **눌리는 것은 눌린다**: 높이(그림자)가 상태를 말합니다.
5. **동작 줄이기 존중**: `prefers-reduced-motion` 에서 틸트·전환을 끕니다.
