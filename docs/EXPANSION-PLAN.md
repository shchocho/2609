# 확장 계획: 제품별 체험 4개 영역 추가

지금 사이트는 업무 영역 5개(영업·인사·재무·구매·운영)에 Copilot Chat·Copilot Cowork 시나리오 15편이 있습니다.
여기에 **제품 기능 자체를 보여 주는 영역 4개**를 같은 화면 흐름(상황 → 흐름 → 체험 → 결과)으로 추가합니다.

| 새 영역 id | 홈 카드 이름 | 보여 줄 제품 | 체험 화면(surface) |
|---|---|---|---|
| `m365-apps` | Copilot in 앱 | Word · PowerPoint · Excel 안의 Copilot | `word` · `powerpoint` · `excel` |
| `copilot-code` | Copilot Code | Microsoft Copilot 앱의 Code 탭 | `code` |
| `power-automate` | Power Automate | 데스크톱 흐름(RPA) · 클라우드 흐름(DPA) | `flow` |
| `copilot-studio` | Copilot Studio | 하네스(Standard · Microsoft Copilot harness) 에이전트 | `studio` |

배경 회사는 기존과 같은 가상 회사 **누리테크(주)** 입니다. 인물·부서·고객사도 기존 시나리오와 맞춥니다.

## 제품 사실 확인 (2026-11 기준, 출시 상태가 자주 바뀌므로 화면 문구 확정 전 다시 확인)

- **Copilot Code**: 2026-09-25 발표된 새 Microsoft Copilot 앱의 Code 탭. 개발자가 아닌 사람이 자연어로 앱·자동화를 만들고, 테넌트 안의 샌드박스에서 실행하며 Copilot Managed Runtime 에 게시합니다. GitHub Copilot 과 같은 기술 기반이고, 사용량(크레딧) 과금이라 관리자가 지출 정책을 만들어야 테넌트에서 동작합니다. Frontier 프로그램으로 먼저 배포됐습니다.
  - https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/
- **Copilot Studio 하네스**: 에이전트를 실행하는 오케스트레이션 방식. GitHub Copilot harness 는 2026-08-03 GA 되었고, 2026-10-28 부터 **Microsoft Copilot harness** 로 이름이 바뀌었습니다(Foundry 에도 같은 하네스). 대화 경로를 직접 그리는 대신 자연어 지침으로 에이전트를 설명하고, 스킬·메모리·MCP 서버/워크플로 도구·훅을 붙입니다. Standard 하네스 에이전트는 코딩 에이전트용 Copilot Studio 플러그인의 `/migrate` 로 옮길 수 있습니다.
  - https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview
  - https://blogs.microsoft.com/blog/2026/10/28/introducing-the-microsoft-copilot-harness-unlocking-the-potential-of-truly-multi-model-agentic-work/
- **Power Automate**: 데스크톱 흐름은 Windows UI 를 조작하는 RPA(커넥터가 없는 레거시 프로그램), 클라우드 흐름은 커넥터·API 기반 프로세스 자동화(DPA). 클라우드 흐름에서 데스크톱 흐름을 호출할 수 있습니다. Copilot 은 클라우드 흐름 생성·수정을 주로 돕고, 데스크톱 흐름 지원은 상대적으로 제한적입니다.
  - https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/power-automate/copilot-power-automate
- **Copilot in Word·PowerPoint·Excel**: 각 앱 리본의 Copilot 단추와 오른쪽 Copilot 창에서 초안 작성·요약·다시 쓰기(Word), 문서로 발표자료 만들기(PowerPoint), 데이터 분석·수식·차트(Excel). Excel·Word 의 에이전트 모드 이름과 범위는 화면 문구 확정 전에 최신 문서로 확인합니다.

> 화면 표기 결정 필요: 하네스 이름을 "Microsoft Copilot harness (구 GitHub Copilot harness)" 로 쓸지, 요청대로 "GitHub Copilot harness" 로 쓸지. 기본값은 앞의 것.

## 영역별 시나리오 초안 (각 3편)

### 1. Copilot in 앱 (`m365-apps`)
| id | 제목 | 화면 | 핵심 체험 |
|---|---|---|---|
| `word-proposal-draft` | 회의 메모와 지난 제안서로 고객 제안서 초안 쓰기 | `word` | `/` 로 파일 참조 → 초안이 문서에 한 단락씩 작성 → 어조 바꾸기 선택(choice) |
| `ppt-from-doc` | Word 제안서로 10장 발표자료 만들고 회사 템플릿 적용 | `powerpoint` | 파일에서 프레젠테이션 만들기 → 슬라이드 추가·요약 → "Copilot 단추는 어디?" 화면 찾기(spot: ribbon) |
| `excel-sales-analysis` | 분기 영업 실적 시트에서 원인 분석·수식 열·차트 만들기 | `excel` | 데이터 질문 → 수식 열 제안 → 차트 삽입 → 결과 시트 |

### 2. Copilot Code (`copilot-code`)
| id | 제목 | 핵심 체험 |
|---|---|---|
| `code-equipment-rental` | 부서 장비 대여 신청 앱을 말로 만들기 | 요청 → 계획(화면·데이터·권한) 승인 → 만드는 과정(작업 단계) → 미리보기에서 직접 신청해 보기 → Copilot Managed Runtime 게시 승인 |
| `code-inspection-checklist` | 설비 점검 체크리스트 앱 + 이상 시 Teams 알림 | 데이터 원본(SharePoint 목록) 연결 → 수정 요청("사진 첨부 칸 추가") → 다시 만들기 |
| `code-sales-dashboard` | 영업 주간 실적 대시보드 앱 | Excel 데이터 연결 → 필터·차트 → 공유 범위 선택(choice) |

### 3. Power Automate (`power-automate`)
| id | 제목 | 화면 | 핵심 체험 |
|---|---|---|---|
| `pa-rpa-erp-entry` | 레거시 ERP 에 발주서 입력하는 데스크톱 흐름(RPA) | 데스크톱 흐름 디자이너 | 녹화기로 동작 기록 → UI 요소·변수 → 시험 실행 → 오류 시 스크린샷·재시도 |
| `pa-dpa-expense-approval` | 경비 증빙 메일 → 문서 처리 → 승인 → Teams 알림 클라우드 흐름(DPA) | 클라우드 흐름 디자이너 | Copilot 에 자연어로 흐름 만들기 → 트리거·작업 카드 생성 → 연결 확인(approve) → 실행 기록 |
| `pa-hybrid-inventory` | 매일 아침 재고 보고: 클라우드 흐름이 데스크톱 흐름 호출 | 두 디자이너 | 예약 트리거 → 데스크톱 흐름 호출 → 결과 메일 |

### 4. Copilot Studio (`copilot-studio`)
| id | 제목 | 핵심 체험 |
|---|---|---|
| `studio-standard-helpdesk` | Standard 하네스로 IT 헬프데스크 에이전트 만들기 | 지식 원본 추가 → 토픽·트리거 문구 → 테스트 창 대화 → Teams 게시 |
| `studio-copilot-harness-purchase` | Microsoft Copilot harness 로 구매 요청 처리 에이전트 만들기 | 자연어 지침 → 스킬·MCP 도구·훅 추가 → 테스트 창에서 도구 실행 권한 확인 → 다단계 처리 |
| `studio-migrate` | Standard 에이전트를 Copilot harness 로 옮기고 결과 비교 | 같은 질문을 두 하네스로 테스트(choice) → `/migrate` → 차이 확인 → 게시 |

## 엔진 변경 사항

1. **영역 추가**: `src/tracks.ts`, `scripts/check-scenarios.mjs` 의 `TRACKS`, 홈 카드 아이콘(`src/components/Icons.tsx`).
   홈 그리드는 5열 고정(`.booth-track-grid { grid-template-columns: repeat(5, 1fr) }`)이므로, "업무 영역" 5개와 "제품 기능 체험" 4개를 **두 줄·두 묶음**으로 나눠 보여 줍니다(묶음 제목 추가, 두 번째 줄은 4열).
2. **제품 이름**: `src/data.ts` 의 `AGENTS` 에 `office`, `code`, `flow`, `studio` 추가. 목록 카드 배지는 surface 에 따라 "Copilot in Word" 등으로 표시.
3. **체험 화면 선택**: `src/play/Play.tsx` 에서 `agent` 가 `office` 면 `scenario.surface`(word · excel · powerpoint)의 앱 화면, 그 밖에는 `workbench` 가 있으면 Cowork, 없으면 Chat 화면을 고릅니다. Office 시나리오도 결과물은 `workbench.artifacts` 에 두고(가운데 문서 = 그 앱의 결과물), 대화·선택지·화면 찾기·"/" 자료 붙이기는 Chat 화면과 같은 코드를 씁니다. 나머지 화면(code · flow · studio)도 같은 자리에 분기를 더하면 됩니다. 새 화면은 `src/surfaces/` 에 하나씩 만듭니다.
   - `word` · `excel` · `powerpoint`: 원본에 있던 Office 화면을 그대로 재현합니다. 구조는 `docs/reference/render-spec.md` §3.5, 스타일은 이미 `reference.css` 의 `.sc-shell.is-office`, `.sc-ribbon`, `.sc-canvas`, `.sc-pane` 에 있습니다. 화면 찾기 퀴즈 영역은 `ribbon · canvas · pane · composer`.
   - `code` · `flow` · `studio`: 원본에 없는 화면이라 새 CSS(`src/styles/surfaces.css`)를 만듭니다. 색·글꼴·둥근 모서리는 기존 토큰(`--copilot-*`, `--desk-font`, `--borderRadius*`)을 씁니다. 에이전트가 도구를 실행하는 장면은 원본의 Scout 화면 부품(`.sct-tool-card`, `.sct-permission` — render-spec §4.6·§4.7, 스타일은 reference.css 에 있음)을 재사용할 수 있습니다.
4. **새 결과물 종류**(`src/components/artifacts.tsx`): `flow`(트리거·작업 카드 목록), `app`(앱 미리보기 화면·폼), `agent`(지침·지식·도구·스킬 설정 카드). 기존 `sheet`·`doc`·`deck`·`mail` 은 Office 캔버스에서 그대로 씁니다.
5. **장면 그림**: 아직 안 쓴 템플릿을 먼저 재사용합니다. `deck-translation`(PowerPoint), `log-analysis`·`server-health`(Code), `receipt-expense`·`attendance-alert`(Power Automate), `incident-runbook`·`standup-catchup`(Copilot Studio), `meeting-followup`, `stock-risk`. 슬롯 이름은 render-spec §5.5 표에 있습니다. 맞는 그림이 없으면 같은 형식(800×450 SVG, `il-fade il-d1~d6`)으로 `src/play/sceneArt.ts` 에 추가합니다.

## 작업 순서 (영역 하나 끝날 때마다 커밋)

1. **(완료)** 엔진: 영역 4개 등록, 홈 두 묶음, `Play.tsx` 의 surface 분기, Office 화면 → `m365-apps` 시나리오 1편(`word-proposal-draft`)으로 확인
2. **(완료)** `m365-apps` 나머지 2편(`ppt-from-doc`, `excel-sales-analysis`)
3. `power-automate` 화면 + 3편
4. `copilot-studio` 화면 + 3편
5. `copilot-code` 화면 + 3편
6. 전체 점검: `npm run check:scenarios`, `npm run build`, `npm run build:local`, e2e 로 새 시나리오 전부 결과 화면까지

## 완료 기준

- 새 시나리오 12편이 모두 결과 화면까지 진행되고 콘솔 오류가 없음(`scripts/e2e.cjs`).
- 홈에서 9개 카드가 겹치거나 잘리지 않음(1600×900, 1371×768 스크린샷 확인).
- `npm run build:local` 결과를 더블클릭으로 열어도 동작.
