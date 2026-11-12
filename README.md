# Copilot Cowork 체험 사이트 (공용 버전)

Microsoft **Copilot Chat**과 **Copilot Cowork**가 실제 업무를 어떻게 처리하는지 클릭으로 따라가 보는 시연(체험) 사이트입니다.
대학(POSTECH) 행사용으로 만들어진 *Copilot Scenario Player* 부스 화면과 같은 구성·같은 UI를, 특정 기관이 아닌 **일반 기업용**으로 다시 만든 버전입니다.

- 가상의 회사 **누리테크(주)**(산업용 센서·설비 모니터링 SaaS, 약 1,200명)를 배경으로 합니다.
- 회사·인물·고객사·수치는 모두 가상입니다. 화면 하단에도 그 안내가 나옵니다.

## 화면 흐름

| 화면 | 주소 | 내용 |
|---|---|---|
| 대기 | `#/` | 배경 영상과 "체험해보기". 아무 곳이나 누르면 홈으로 |
| 홈 | `#/start` | 업무 영역 5개 · 제품 기능 체험 4개 선택 |
| 시나리오 목록 | `#/t/<영역>` | 카드 회전 보기 / 제품별(Chat·Cowork) 보기 |
| 재생 | `#/t/<영역>/<시나리오>` | 상황 → 흐름 → 체험 → 결과 |

- **상황**: 담당자의 고민을 그림과 함께 보여 줍니다.
- **흐름**: Copilot이 처리할 단계를 하나씩 열어 봅니다.
- **체험**: Copilot 앱과 똑같이 생긴 화면에서 직접 요청을 보내고, 답변을 확인하고, 기준을 고르고, 실행을 승인하고, 기능 찾기 퀴즈를 풉니다. 만들어진 엑셀·워드·메일·PPT·Teams 결과물을 오른쪽 패널에서 열어 봅니다.
- **결과**: 완성된 결과물과 요약을 보여 줍니다.
- 5분 동안 조작이 없으면 대기 화면으로 돌아갑니다. 창이 768×600보다 작으면 "더 큰 화면에서 접속해 주세요" 안내가 나옵니다.

## 시나리오 (15편)

| 영역 | 시나리오 | 제품 |
|---|---|---|
| 영업·마케팅 | 회사 표준 양식에 맞춰 고객사 입찰 제안 발표자료 만들기 | Cowork |
| | 경쟁사·시장 동향을 모아 주간 시장동향 뉴스레터 만들기 | Cowork |
| | 신제품 런칭 쇼케이스 포스터와 스태프 티셔츠 시안 만들기 | Chat |
| 인사 | 경력직 채용 지원서를 직무 요건별로 정리하기 | Cowork |
| | 9월 입사자 온보딩 계획과 첫 2주 일정 준비 | Cowork |
| | 육아휴직·근로시간 단축 사내 규정과 신청 절차 확인 | Chat |
| 재무·회계 | 부서별 예산 집행 현황 한눈에 정리 | Cowork |
| | 부서·프로젝트별 예산 대비 집행 편차 정리 | Cowork |
| | 3분기 마감 실적 보고자료 작성 | Cowork |
| 구매·법무 | SMT 라인 AOI 장비 견적서 비교 | Cowork |
| | 클라우드 서비스 발주 전 계약·SLA·납품 조건 검토 | Cowork |
| | 협력사 메일에서 합의 조건 찾아 공동개발 계약서 초안 만들기 | Cowork |
| 운영·소통 | 핵심 부품 통관 지연에 따른 생산 라인 대응안 | Cowork |
| | 설비 모니터링 SaaS 기술 문의 답변과 고객 안내 자료 준비 | Cowork |
| | 차세대 진동 센서·예지보전 출시 보도자료 초안 | Chat |

### 제품 기능 체험 (15편 · `docs/EXPANSION-PLAN.md`)

| 영역 | 시나리오 | 제품 |
|---|---|---|
| Copilot in 앱 | 회의 메모와 지난 제안서로 고객 제안서 초안 쓰기 | Copilot in Word |
| | 회사 템플릿에서 Word 제안서로 10장 발표자료 만들기 | Copilot in PowerPoint |
| | 분기 영업 실적 시트에서 원인 분석·수식 열·차트 만들기 | Copilot in Excel |
| | 긴 메일 스레드 요약하고 답장 초안 쓰기 | Copilot in Outlook |
| | 늦게 들어간 회의를 따라잡고 할 일 정리하기 | Copilot in Teams |
| | 교육 만족도 설문을 말로 만들고 응답 요약하기 | Copilot in Forms |
| Power Automate | 레거시 ERP에 발주서 입력하는 데스크톱 흐름(RPA) | 데스크톱 흐름 |
| | 경비 증빙 메일을 승인과 Teams 알림까지 잇는 클라우드 흐름(DPA) | 클라우드 흐름 |
| | 매일 아침 재고 보고: 클라우드 흐름이 데스크톱 흐름 호출 | 클라우드 + 데스크톱 흐름 |
| Copilot Studio | Standard 하네스로 IT 헬프데스크 에이전트 만들기 | Standard 하네스 |
| | Microsoft Copilot harness로 구매 요청 처리 에이전트 만들기 | Microsoft Copilot harness |
| | Standard 에이전트를 Microsoft Copilot harness로 옮기고 결과 비교 | /migrate |
| Copilot Code | 부서 장비 대여 신청 앱을 말로 만들기 | Code 탭 |
| | 설비 점검 체크리스트 앱 만들고 이상은 Teams로 알리기 | Code 탭 |
| | 영업 주간 실적 대시보드 앱 만들기 | Code 탭 |

## 로컬에서 확인하기

### 방법 1. 더블클릭으로 열기 (Node.js 설치 불필요)

1. 로컬 확인용 압축 파일(`copilot-cowork-demo-local.zip`)을 받아 압축을 풉니다.
2. `copilot-cowork-demo` 폴더의 `index.html` 을 더블클릭합니다. Edge나 Chrome을 권장하며, 인터넷 연결 없이도 동작합니다.
3. F11 키로 전체 화면을 쓰면 부스 화면과 같은 비율로 보입니다.

압축 파일은 아래 명령으로 직접 만들 수도 있습니다. 결과는 `dist-local/` 폴더이고, 이 폴더를 통째로 복사해 쓰면 됩니다.

```bash
npm run build:local
```

### 방법 2. 개발 서버로 열기 (Node.js 20 이상)

```bash
npm install
```

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 을 엽니다. 코드나 시나리오를 고치면 화면이 바로 바뀝니다.

## 배포

웹 배포용 빌드는 다음 명령으로 만듭니다. 결과는 `dist/` 폴더입니다.

```bash
npm run build
```

`dist/` 폴더를 정적 호스팅에 올리면 됩니다. 주소는 해시(`#/…`) 방식이고 경로가 모두 상대 경로라, 루트가 아닌 하위 경로에 올려도 서버 설정 없이 동작합니다.
Azure Static Web Apps를 쓸 때는 함께 들어 있는 `staticwebapp.config.json` 이 그대로 적용됩니다(앱 위치 `/`, 출력 위치 `dist`).

## 고쳐 쓰기

- **문구(제목, 안내, 푸터)**: `src/copy.ts`
- **업무 영역(이름, 설명, 색)**: `src/tracks.ts`. 홈 카드 아이콘은 `src/components/Icons.tsx`
- **앱 창 시나리오**: `"agent": "office"` 와 `"surface": "word" | "excel" | "powerpoint" | "outlook" | "teams" | "forms"`, `"agent": "flow"` 와 `"surface": "cloudflow" | "deskflow"`(Power Automate 흐름 디자이너), `"agent": "studio"` 와 `"surface": "studio"`(Copilot Studio 에이전트 화면 — 처음에는 `workbench.ask` 를 담은 만들기 화면이 뜨고, 그 뒤 `app: "studio"` 인 문서 결과물이 설정 카드로 보입니다. `only` 깃발과 `label` 이 있는 section 은 채우기 전까지 빈 카드와 "+ 추가" 단추로 나옵니다), 또는 `"agent": "code"` 와 `"surface": "code"`(Microsoft Copilot 앱의 Code 탭 — 처음에는 "무엇을 만들까요?" 시작 화면이 뜨고, 그 뒤 `app: "code"` 인 문서 결과물이 앱 미리보기로 보이며, 블록 `field`·`button`·`chart` 가 입력란·단추·막대 차트가 됩니다)를 주면 Cowork 화면 대신 앱 창과 오른쪽 창에서 재생합니다. 흐름은 결과물 `kind: "flow"` 의 `flow.steps`(트리거·작업 카드)로 적고, `flow.run` 이 참이면 단계마다 결과(`state`, `note`)가 붙는 실행 기록이 됩니다. `flow.screen`(대상 프로그램의 메뉴·입력란·단추)과 단계의 `do`(화면 조작 목록)를 적으면, 흐름 옆에 그 프로그램 화면이 뜨고 커서가 움직이며 값이 입력되는 모습이 재생됩니다. 가운데 문서는 `workbench.artifacts` 중 그 앱의 결과물입니다(화면: `src/surfaces/AppWindow.tsx`, 스타일: `src/styles/surfaces.css`). 덱 슬라이드에 `only`/`not` 을 쓰면 선택에 따라 슬라이드가 들어가고 빠지며, 시트의 `charts` 는 표 아래에 막대 차트를 넣습니다.
- **시나리오**: `src/scenarios/<영역>/<id>.scenario.json`. 파일을 추가하면 목록에 자동으로 나타납니다. 고친 뒤 검사를 돌리세요.

```bash
npm run check:scenarios
```

시나리오 JSON의 주요 구성은 다음과 같습니다.

- `scene`: 상황 화면. `art` 는 `src/play/sceneArt.ts` 의 그림 이름, `artSlots` 는 그림 속 글자, `headline` 의 `‹‹ ››` 사이는 강조 표시.
- `overview`: 흐름 화면의 단계 카드.
- `workbench`: Cowork 시나리오의 작업 이름(`task`)과 결과물(`artifacts`: 엑셀 `sheet`, 워드 `doc`, 메일 `mail`, PPT `deck`, Teams `teams`).
- `messages`: 체험 화면에서 순서대로 재생되는 대화.
  - `cue` 입력창 안내 → 다음 `user` 메시지가 입력창에 미리 채워짐. 앱 창 시나리오에서 `target` 을 주면 말풍선 버튼 대신 화면 안의 그 단추(`create` 시작 화면의 만들기 · `publish` 위쪽 게시 · 설정 카드의 깃발 이름 · 앱 미리보기 `button` 블록의 `label`)를 직접 누르게 합니다. 뒤에 `user` 메시지가 오면 그 글이 시작 화면에 보이고, 단추를 누르면 대화에 올라갑니다
  - `assistant` 답변(`files` 로 결과물 카드, `sources` 로 출처, `images` 로 생성 이미지)
  - `tool` 작업 단계(`opens`·`shows` 열기, `writes` 한 줄씩 작성, 앱 창 시나리오에서는 `sets` 로 깃발을 켜 `only`/`not` 이 걸린 블록을 단계마다 나타나게 함)
  - `approve` 실행 전 권한 확인, `choice` 기준 고르기(`only`/`not` 으로 선택별 내용 분기), `hunt` 기능 찾기 퀴즈, `spot` 화면 영역 찾기 퀴즈
- `recap`, `finish`: 결과 화면의 요약.

## 문서

- `docs/EXPANSION-PLAN.md`: Copilot in 앱(Word·PowerPoint·Excel), Copilot Code, Power Automate, Copilot Studio 영역을 추가하는 계획
- `docs/LOCAL-HANDOFF.md`: 내 PC 의 Claude Code 로 이어서 작업하는 방법과 붙여 넣을 프롬프트
- `docs/design-draft/`: 원본 부스 이미지를 새로 그린 이미지로 바꾸는 시안(주소에 `?look=draft` 를 붙이면 보임)과 비교 이미지
- `docs/reference/`: 원본 부스 화면을 분석한 엔진·렌더링 명세(필요한 절만 찾아 읽기)
- `scripts/e2e.cjs`: 시나리오 하나를 결과 화면까지 자동 진행하는 테스트(Playwright 필요)
- `npm run e2e:all`: 개발 서버를 띄운 채 모든 시나리오를 차례로 돌려 통과 여부를 한 줄씩 보여 줍니다(`npm run e2e:all -- <영역>` 으로 한 영역만)

## 참고

- 화면 구성과 스타일은 원본 부스 화면을 기준으로 다시 구현했습니다(`src/styles/reference.css`).
- Copilot·Microsoft 365 로고, 대기 화면 영상 등 브랜드 자산은 `public/` 에 있습니다. 외부에 공개할 때는 Microsoft 브랜드 사용 지침을 확인하세요.
- 글꼴은 Pretendard(OFL)를 사용합니다.
