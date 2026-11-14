# Teams · Copilot 실습 사이트 (고객사 교육용: 사랑의교회)

> 이 브랜치(`customer/sarang`)는 공용 체험 사이트(`claude/busy-wright-7wa9ee`)에서 갈라져 나온 **고객사 교육용 실습 사이트**입니다. 공용 사이트는 그대로 두고 이 브랜치에서만 작업합니다.
> 진행 기록, 고객사 확인 사항, 제품 사실을 확인한 문서 주소는 `docs/customer-sarang/PLAN.md` 에 있습니다.

Teams 기본 기능과 Microsoft Copilot을 **교회 행정·사역 지원 업무** 장면으로 직접 눌러 보며 익히는 실습 사이트입니다.

- 인물·일정·인원 수는 모두 가상입니다. 화면 하단에도 그 안내가 나옵니다. 실존 인물, 연락처, 헌금·재정 수치는 쓰지 않습니다.
- 설교·신앙 내용을 Copilot이 대신 쓰는 장면은 없습니다. 공지, 일정, 자료 공유, 신청 현황, 설문, 메일 같은 행정 업무만 다룹니다.
- 교회 로고와 사진은 쓰지 않았습니다. 고객사가 준 파일이 `docs/customer-sarang/assets/` 에 있을 때만 씁니다.
- 그림(상황 그림, 포스터 시안, 대기 화면)은 모두 이 저장소에서 새로 그린 것입니다.

## 화면 흐름

| 화면 | 주소 | 내용 |
|---|---|---|
| 대기 | `#/` | "실습 시작하기". 아무 곳이나 누르면 홈으로 |
| 홈 | `#/start` | 실습 영역 5개 선택 |
| 시나리오 목록 | `#/t/<영역>` | 카드 회전 보기 / 제품별 보기 |
| 재생 | `#/t/<영역>/<시나리오>` | 상황 → 흐름 → 실습 → 결과 |

- **상황**: 담당자의 고민을 그림과 함께 보여 줍니다.
- **흐름**: 따라 할 단계를 하나씩 열어 봅니다.
- **실습**: Teams·Copilot 앱과 비슷하게 생긴 화면에서 안내 말풍선을 따라 단추를 누르고, 요청을 보내고, 기준을 고르고, 실행을 승인하고, 화면 찾기 퀴즈를 풉니다.
- **결과**: 요약과 함께 **"실제로 해 보기"** 카드가 나옵니다. 실제 Teams·Copilot에서 따라 할 순서입니다.
- 5분 동안 조작이 없으면 대기 화면으로 돌아갑니다. 창이 768×600보다 작으면 "더 큰 화면에서 접속해 주세요" 안내가 나옵니다.

## 시나리오 (16편)

| 영역 | 시나리오 | 화면 |
|---|---|---|
| Teams 기본 | 수련회 준비팀 그룹 채팅방 만들고 첫 공지 보내기 | Teams 채팅 |
| | 교사 모임 일정을 Teams 일정으로 만들고 참석자 초대하기 | Teams 일정 |
| | 사역팀 팀을 만들고 채널 파일에 폴더를 만들어 공유하기 | Teams 팀·채널 |
| Copilot Chat | 주보 광고·공지 문구를 같은 형식으로 다듬기 | Copilot Chat |
| | 시설 대관 규정 문서에서 신청 절차 찾기 | Copilot Chat |
| | 바자회 포스터 이미지 시안 만들기 | Copilot Chat |
| Copilot in 앱 | 지난 수련회 회의록으로 올해 기획안 초안 쓰기 | Word |
| | 기획안으로 조장 설명회 발표자료 만들기 | PowerPoint |
| | 행사 참가 신청 현황을 부서별로 집계하고 차트 만들기 | Excel |
| | 수련회 만족도 설문 만들고 응답 요약하기 | Forms |
| | 협력 기관과 주고받은 긴 메일 요약하고 답장 쓰기 | Outlook |
| | 놓친 사역팀 회의 내용 따라잡고 할 일 정리하기 | Teams 회의 |
| Copilot 에이전트 | 새가족 안내 자료로 질문에 답하는 안내 에이전트 만들기 | Copilot Studio |
| | 봉사자 신청 명단으로 배치표 만들고 안내 메일 보내기 | Copilot Cowork |
| Copilot Code | 봉사 신청 앱을 말로 만들기 | Code 탭 |
| | 소그룹 출석 체크 앱 만들기 | Code 탭 |

Teams 기본 3편은 Copilot 없이 쓰는 기능입니다. 나머지는 라이선스가 필요합니다(Copilot Chat, 앱 안의 Copilot은 Microsoft 365 Copilot, 에이전트·Code는 관리자 설정). 시나리오마다 결과 화면의 "실제로 해 보기"에 적어 두었습니다.

## 로컬에서 확인하기

### 방법 1. 더블클릭으로 열기 (Node.js 설치 불필요)

1. `npm run build:local` 로 만든 `dist-local/` 폴더를 통째로 복사합니다.
2. 그 폴더의 `index.html` 을 더블클릭합니다. Edge나 Chrome을 권장하며, 인터넷 연결 없이도 동작합니다.
3. F11 키로 전체 화면을 쓰면 부스 화면과 같은 비율로 보입니다.

`dist-local/` 폴더는 아래 명령으로 만듭니다.

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
- **실습 영역(이름, 설명, 색)**: `src/tracks.ts`. 홈 카드 아이콘은 `src/components/Icons.tsx`
- **앱 창 시나리오**: `"agent": "office"` 와 `"surface": "word" | "excel" | "powerpoint" | "outlook" | "teams" | "forms"`, `"agent": "flow"` 와 `"surface": "cloudflow" | "deskflow"`(Power Automate 흐름 디자이너), `"agent": "studio"` 와 `"surface": "studio"`(Copilot Studio 에이전트 화면 — 처음에는 `workbench.ask` 를 담은 만들기 화면이 뜨고, 그 뒤 `app: "studio"` 인 문서 결과물이 설정 카드로 보입니다. `only` 깃발과 `label` 이 있는 section 은 채우기 전까지 빈 카드와 "+ 추가" 단추로 나옵니다), 또는 `"agent": "code"` 와 `"surface": "code"`(Microsoft Copilot 앱의 Code 탭 — 처음에는 "무엇을 만들까요?" 시작 화면이 뜨고, 그 뒤 `app: "code"` 인 문서 결과물이 앱 미리보기로 보이며, 블록 `field`·`button`·`chart` 가 입력란·단추·막대 차트가 됩니다)를 주면 Cowork 화면 대신 앱 창과 오른쪽 창에서 재생합니다. 흐름은 결과물 `kind: "flow"` 의 `flow.steps`(트리거·작업 카드)로 적고, `flow.run` 이 참이면 단계마다 결과(`state`, `note`)가 붙는 실행 기록이 됩니다. `flow.screen`(대상 프로그램의 메뉴·입력란·단추)과 단계의 `do`(화면 조작 목록)를 적으면, 흐름 옆에 그 프로그램 화면이 뜨고 커서가 움직이며 값이 입력되는 모습이 재생됩니다. 가운데 문서는 `workbench.artifacts` 중 그 앱의 결과물입니다(화면: `src/surfaces/AppWindow.tsx`, 스타일: `src/styles/surfaces.css`). 덱 슬라이드에 `only`/`not` 을 쓰면 선택에 따라 슬라이드가 들어가고 빠지며, 시트의 `charts` 는 표 아래에 막대 차트를 넣습니다.
- **Teams 기본 실습 화면**: `"agent": "teams"`, `"surface": "teamsapp"` 와 `teams` 항목(`mode`: `chat` · `calendar` · `files`, 인물·방 이름·일정·팀·폴더 이름)을 주면 Copilot 화면 대신 Teams 앱 모양의 화면에서 재생합니다. 눌러야 할 곳은 `cue` 의 `target`, 화면이 바뀌는 시점은 `tool` 의 `sets` 깃발이며, 쓸 수 있는 이름은 `src/surfaces/TeamsApp.tsx` 맨 위에 적혀 있습니다(스타일: `src/styles/teams-lab.css`).
- **"실제로 해 보기" 카드**: 시나리오에 `practice`(`where`, `steps`, `note`)를 적으면 결과 화면에 실제 Teams·Copilot 에서 따라 할 순서가 나옵니다. `**굵게**` 표시를 쓸 수 있습니다.
- **상황 그림(고객사용)**: `scene.art` 에 `sr-chat` · `sr-calendar` · `sr-files` · `sr-doc` · `sr-chart` · `sr-mail` · `sr-slides` · `sr-form` · `sr-poster` · `sr-agent` · `sr-app` 를 쓰면 새로 그린 그림이 나옵니다(슬롯 이름: `src/play/sceneArtSarang.ts`).
- **시나리오**: `src/scenarios/<영역>/<id>.scenario.json`. 파일을 추가하면 목록에 자동으로 나타납니다. 고친 뒤 검사를 돌리세요.

```bash
npm run check:scenarios
```

시나리오 JSON의 주요 구성은 다음과 같습니다.

- `scene`: 상황 화면. `art` 는 `src/play/sceneArt.ts` 의 그림 이름, `artSlots` 는 그림 속 글자, `headline` 의 `‹‹ ››` 사이는 강조 표시.
- `overview`: 흐름 화면의 단계 카드.
- `workbench`: Cowork 시나리오의 작업 이름(`task`)과 결과물(`artifacts`: 엑셀 `sheet`, 워드 `doc`, 메일 `mail`, PPT `deck`, Teams `teams`).
- `messages`: 실습 화면에서 순서대로 재생되는 대화.
  - `cue` 입력창 안내 → 다음 `user` 메시지가 입력창에 미리 채워짐. 앱 창 시나리오에서 `target` 을 주면 말풍선 버튼 대신 화면 안의 그 단추(`create` 시작 화면의 만들기 · `publish` 위쪽 게시 · 설정 카드의 깃발 이름 · 앱 미리보기 `button` 블록의 `label`)를 직접 누르게 합니다. 뒤에 `user` 메시지가 오면 그 글이 시작 화면에 보이고, 단추를 누르면 대화에 올라갑니다
  - `assistant` 답변(`files` 로 결과물 카드, `sources` 로 출처, `images` 로 생성 이미지)
  - `tool` 작업 단계(`opens`·`shows` 열기, `writes` 한 줄씩 작성, 앱 창 시나리오에서는 `sets` 로 깃발을 켜 `only`/`not` 이 걸린 블록을 단계마다 나타나게 함)
  - `approve` 실행 전 권한 확인, `choice` 기준 고르기(`only`/`not` 으로 선택별 내용 분기), `hunt` 기능 찾기 퀴즈, `spot` 화면 영역 찾기 퀴즈
- `recap`, `finish`: 결과 화면의 요약.

## 문서

- `docs/EXPANSION-PLAN.md`: Copilot in 앱(Word·PowerPoint·Excel), Copilot Code, Power Automate, Copilot Studio 영역을 추가하는 계획
- `docs/LOCAL-HANDOFF.md`: 내 PC 의 Claude Code 로 이어서 작업하는 방법과 붙여 넣을 프롬프트
- `docs/customer-sarang/PLAN.md`: 이 사이트를 바탕으로 고객사(사랑의교회) 교육용 실습 사이트를 별도 브랜치로 만드는 계획과 새 세션용 프롬프트
- `docs/design-draft/`: 원본 부스 이미지를 새로 그린 이미지로 바꾼 시안 기록. 이 브랜치는 새 이미지만 씁니다
- `docs/customer-sarang/poster-src/`: 바자회 포스터 시안 6장의 SVG 원본(구운 이미지는 `public/sarang/poster/`)
- `docs/reference/`: 원본 부스 화면을 분석한 엔진·렌더링 명세(필요한 절만 찾아 읽기)
- `scripts/e2e.cjs`: 시나리오 하나를 결과 화면까지 자동 진행하는 테스트(Playwright 필요)
- `npm run e2e:all`: 개발 서버를 띄운 채 모든 시나리오를 차례로 돌려 통과 여부를 한 줄씩 보여 줍니다(`npm run e2e:all -- <영역>` 으로 한 영역만)

## 참고

- 화면 구성과 스타일은 원본 부스 화면을 기준으로 다시 구현했습니다(`src/styles/reference.css`).
- Copilot·Microsoft 365 로고는 `public/logo/` 에 있습니다. 원본 부스의 대기 화면 영상과 그래픽은 이 브랜치에서 지웠습니다. 외부에 공개할 때는 Microsoft 브랜드 사용 지침을 확인하세요.
- 글꼴은 Pretendard(OFL)를 사용합니다.
