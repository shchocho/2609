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
  - 2026-11-17 다시 확인: 아직 **Frontier 미리 보기**입니다(관리 문서 제목이 "(Frontier)", 2026-10-28 갱신). Copilot Managed Runtime 은 2026-09-25 **공개 미리 보기**로 나왔고, GA 발표는 찾지 못했습니다. 홈의 Copilot Code 카드 설명에 "(Frontier 미리 보기)"를 붙였습니다.
  - https://learn.microsoft.com/en-us/copilot/code/code-admin
  - https://www.microsoft.com/en-us/copilot/blog/copilot-studio/build-where-you-want-run-with-confidence-now-microsoft-hosts-and-manages-the-code-created-by-copilot/
- **Copilot Studio 하네스**: 에이전트를 실행하는 오케스트레이션 방식. GitHub Copilot harness 는 2026-08-03 GA 되었고, 2026-10-28 에 **Microsoft Copilot harness** 로 이름을 바꾼다고 발표했습니다(Foundry 에도 같은 하네스). 제품 화면의 표기는 발표 뒤 몇 주에 걸쳐 바뀌므로, 테넌트에 따라 아직 옛 이름이 보일 수 있습니다. 대화 경로를 직접 그리는 대신 자연어 지침으로 에이전트를 설명하고, 스킬·메모리·MCP 서버/워크플로 도구·훅을 붙입니다. Standard 하네스 에이전트는 코딩 에이전트용 Copilot Studio 플러그인의 `/migrate` 로 옮길 수 있습니다.
  - https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview
  - https://blogs.microsoft.com/blog/2026/10/28/introducing-the-microsoft-copilot-harness-unlocking-the-potential-of-truly-multi-model-agentic-work/
- **Power Automate**: 데스크톱 흐름은 Windows UI 를 조작하는 RPA(커넥터가 없는 레거시 프로그램), 클라우드 흐름은 커넥터·API 기반 프로세스 자동화(DPA). 클라우드 흐름에서 데스크톱 흐름을 호출할 수 있습니다. Copilot 은 클라우드 흐름 생성·수정을 주로 돕고, 데스크톱 흐름 지원은 상대적으로 제한적입니다.
  - https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/power-automate/copilot-power-automate
  - **2026-11-30 지원 종료 (2026-11-17 확인)**: 클라우드 흐름 · 에이전트 흐름 디자이너 안의 Copilot(MC1540258, 2026-11-05 공지)과 설명으로 새 흐름을 만드는 "Describe it to design it"(MC1537406, 2026-11-03 공지). 이미 만든 흐름은 그대로이고, 디자이너에서 직접 만들기 · 템플릿 · 흐름 검사기 · 실행 기록은 계속 씁니다. 말로 만드는 길로는 AI 도우미(GitHub Copilot CLI · Claude Code)의 Power Automate 플러그인, Copilot Studio 의 MCP 연결이 안내돼 있습니다. 두 공지 모두 데스크톱 흐름(Power Automate for desktop)의 Copilot 은 언급하지 않습니다.
    - https://mc.merill.net/message/MC1540258
    - https://mc.merill.net/message/MC1537406
  - 그래서 클라우드 흐름 시나리오 2편(`pa-dpa-expense-approval`, `pa-hybrid-inventory`)은 Copilot 창 대신 캔버스의 **"트리거 추가"** · **"작업 추가"**와 위쪽 명령 막대의 **"저장"** · **"테스트"**를 직접 누르게 바꿨습니다(`cue.target`: `trigger` · `action` · `save` · `test`). 단추 이름은 한국어 Learn 문서(새 디자이너: 실행 취소 · 다시 실행 · 흐름 검사기 · 저장 · 테스트, 빈 흐름의 "트리거 추가" 노드, + 를 누르면 열리는 "작업 추가" 창)를 따랐습니다. 실제 한국어 화면은 아직 보지 못했습니다.
    - https://learn.microsoft.com/ko-kr/power-automate/flows-designer
    - https://learn.microsoft.com/ko-kr/power-automate/get-started-logic-flow
  - 데스크톱 흐름 직접 트리거(RM579975): 2027-01 미리 보기, 2027-03 GA 예정. 그전까지는 지금처럼 클라우드 흐름에서 데스크톱 흐름을 부릅니다.
- **Copilot in Word·PowerPoint·Excel**: 각 앱 리본의 Copilot 단추와 오른쪽 Copilot 창에서 초안 작성·요약·다시 쓰기(Word), 문서로 발표자료 만들기(PowerPoint), 데이터 분석·수식·차트(Excel). Excel·Word 의 에이전트 모드 이름과 범위는 화면 문구 확정 전에 최신 문서로 확인합니다.

> 화면 표기 결정 필요: 하네스 이름을 "Microsoft Copilot harness (구 GitHub Copilot harness)" 로 쓸지, 요청대로 "GitHub Copilot harness" 로 쓸지. 기본값은 앞의 것.

- **Copilot in 앱의 화면 (2026-11-14, 한국어 데스크톱 앱 · Forms 웹의 실제 화면에서 확인)**: 창 위쪽 모양과 단추 이름을 실제 화면대로 옮겼습니다(`src/surfaces/OfficeChrome.tsx` · `WebChrome.tsx` · `src/styles/office-real.css`). 위 항목의 "리본의 Copilot 단추"는 지금 화면과 다릅니다.
  - Word · Excel · PowerPoint: Copilot 은 리본이 아니라 **문서 오른쪽 아래의 둥근 Copilot 단추**로 엽니다. Copilot 창은 모델("자동") · 닫기, "편집 허용", 입력란("Copilot으로 편집"), "M365 Copilot(프리미엄)" 순서입니다.
  - Outlook(새 Outlook): **리본 오른쪽 끝의 Copilot 단추**로 창을 엽니다. 메일 위에 "이 이메일 요약" 줄, 창의 제안은 "이 이메일 요약" · "이 이메일 요약 및 회신", 입력란은 "Copilot에 메시지 보내기". https://support.microsoft.com/ko-kr/outlook/copilot-pages/summarize-an-email-thread-with-copilot-in-outlook
  - Teams: 모임 채팅 머리글(채팅 · 공유 · 노트 · 요약)의 **오른쪽 위 Copilot 아이콘**. 회의 중에는 모임 컨트롤의 Copilot 이고, 회의 뒤 요약과 질문에는 대화 내용 기록이 필요합니다. https://support.microsoft.com/ko-kr/teams/copilot/catch-up-on-meetings-with-microsoft-365-copilot-in-teams
  - Forms: 새 양식 위의 **"Copilot으로 초안 작성"** 상자 → 생성 → 유지 → 오른쪽 아래 Copilot 단추로 채팅, 결과는 위쪽 도구 모음의 **응답 보기**. https://support.microsoft.com/ko-kr/forms/welcome-to-copilot-in-forms
  - 실제 화면을 보지 못한 곳: Teams 회의 중 창, Forms 의 생성 뒤 화면 · 채팅 창 · 응답 보기 화면, Outlook 작성 창 안의 Copilot 상자. 이 부분은 지원 문서의 순서만 따랐습니다.
- **Teams 기본 (`teams-basics`, 2026-11-14 한국어 Teams 데스크톱 앱의 실제 화면에서 확인)**: Copilot 이 아닌 Teams 기본 기능을 눌러 보는 영역입니다. 화면은 `src/surfaces/TeamsApp.tsx`, 인물·일정은 모두 가상입니다.
  - 앱 바: 활동 · 채팅 · Teams · 일정 · OneDrive · 통화 · 앱. 채팅 목록 위 연필 아이콘이 **새 메시지**, 받는 사람 줄은 **"대상:"**, 그 오른쪽 끝 화살표로 **"그룹 이름:"** 칸을 엽니다. https://support.microsoft.com/ko-kr/office/microsoft-teams%EC%9D%98-%EA%B7%B8%EB%A3%B9-%EC%B1%84%ED%8C%85%EC%97%90-%EB%8C%80%ED%95%B4-%EC%95%8C%EC%95%84%EC%95%BC-%ED%95%A0-%EC%B2%AB-%EB%B2%88%EC%A7%B8-%EC%82%AC%ED%95%AD-d563174d-ca98-440c-ade1-69176512122d
  - 일정: **"신규"** → 창 제목 "새 이벤트", "제목 추가" · "필수 참석자 초대" · "스케줄러" · "Microsoft Teams 모임" 토글 · **"저장"**. https://support.microsoft.com/ko-kr/teams/meetings/schedule-a-meeting-in-microsoft-teams
  - 팀과 파일: Teams 목록의 새 항목 → **새 팀** → 창 제목 "팀 만들기"(팀 이름 · 설명 · 팀 유형 · 첫 번째 채널 이름). 채널의 **공유** 탭 오른쪽 **"만들기 또는 업로드"** 안에 폴더 · 파일 업로드가 있습니다. https://support.microsoft.com/ko-KR/teams/files/share-files-in-microsoft-teams
  - 테넌트 설정(채팅과 채널을 합쳐 보기 등)에 따라 앱 바와 새 항목 메뉴가 다를 수 있습니다.
- **실제 화면에서 다시 확인할 것 (2026-11-17, 외부 정리 글 · Learn "What's new" 기준이라 아직 고치지 않음)**:
  - Copilot 앱 왼쪽 메뉴(`src/components/chrome.tsx`): "에이전트 및 기술" 단추가 **"플러그인"**으로 바뀌는 중(2026-10 말 ~ 11 말 배포). "전자 필기장"(Notebooks)은 **Copilot Workspaces**로 바뀌는 중(Frontier 먼저, 일반 배포 2027-01 예정).
  - Cowork 모델 목록(`src/data.ts` 의 GPT 5.5 · Opus 5 · Sonnet 5 · Fable 5.1): Learn "What's new in Copilot Cowork"(2026-11-16 갱신)에 GPT 6 Astra(9월), GPT 6.1 Sol(10월, GPT 6 Sol 대체), Grok 4.7(10월)이 추가돼 있습니다. 실제 모델 선택 목록과 설명 문구를 보고 맞춥니다. https://learn.microsoft.com/en-us/copilot/cowork/whats-new
  - Cowork 새 기능(아직 시나리오에 없음): Planner 플러그인 · OneNote 지원(11월), Projects · 홈의 Chat/Cowork 전환(10월, Frontier).
  - Scout 는 **Autopilot** 으로 이름이 바뀌었습니다. `src/data.ts` 의 `scout`(Microsoft Scout)는 원본 부스에서 남은 값이고 쓰는 시나리오는 없습니다.
  - Microsoft Ignite 2026(2026-11-17 ~ 20) 발표 뒤 이름 · 출시 상태를 한 번 더 확인합니다.

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
3. **(완료)** `power-automate` 화면 + 3편 — `agent: "flow"`, `surface: "cloudflow" | "deskflow"`, 결과물 `kind: "flow"` (화면은 `src/surfaces/AppWindow.tsx` 를 같이 씀)
4. **(완료)** `copilot-studio` 화면 + 3편 — `agent: "studio"`, `surface: "studio"`. 에이전트 설정은 새 결과물 종류 대신 문서 블록(`kind: "doc"`, `app: "studio"`)을 카드처럼 보이게 했고, 단계마다 설정이 늘어나는 것은 도구 메시지의 `sets` 로 처리. 말풍선 버튼이 아니라 메인 화면의 만들기 · "+ 추가" · 게시 단추를 직접 누르게 함(`cue.target`)
5. **(완료)** `copilot-code` 화면 + 3편 — `agent: "code"`, `surface: "code"`. 앱 미리보기도 문서 블록(`app: "code"`)으로 그리고 `button`·`chart` 블록을 더함. Copilot Studio 와 같이 메인 화면의 시작 화면 · 앱 안의 단추 · 위쪽 게시 단추를 직접 누르게 함
5-1. **(완료 · 계획에 없던 추가)** `m365-apps` 에 Outlook(`outlook-thread-reply`) · Teams(`teams-meeting-catchup`) · Forms(`forms-training-survey`) 한 편씩 추가
6. 전체 점검: `npm run check:scenarios`, `npm run build`, `npm run build:local`, e2e 로 새 시나리오 전부 결과 화면까지
7. **(완료 · 2026-11-17)** Power Automate 클라우드 흐름 2편을 디자이너에서 직접 만들기로 변경(디자이너 Copilot 2026-11-30 지원 종료). 흐름 화면에 "트리거 추가" · "작업 추가" 단추(`src/components/artifacts.tsx` 의 `FlowView`)와 명령 막대의 저장 · 테스트 단추를 더함

## 완료 기준

- 새 시나리오 12편이 모두 결과 화면까지 진행되고 콘솔 오류가 없음(`scripts/e2e.cjs`).
- 홈에서 9개 카드가 겹치거나 잘리지 않음(1600×900, 1371×768 스크린샷 확인).
- `npm run build:local` 결과를 더블클릭으로 열어도 동작.
