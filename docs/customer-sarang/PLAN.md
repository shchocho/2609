# 고객사 교육용 실습 사이트: 사랑의교회

지금의 체험 사이트(누리테크 기준, 영역 9개·시나리오 30편)는 **그대로 두고**, 같은 엔진으로 사랑의교회 교육용 실습 사이트를 따로 만듭니다.

## 진행 방향

### 1. 분리 방법: 같은 저장소의 새 브랜치

| 브랜치 | 용도 |
|---|---|
| `claude/busy-wright-7wa9ee` | 지금 체험 사이트(공용). 고객사 작업으로는 건드리지 않음 |
| `customer/sarang` | 사랑의교회 실습 사이트. `claude/busy-wright-7wa9ee` 에서 갈라져 나옴 |

- 공용 사이트의 엔진 개선(버그 수정 등)은 나중에 `customer/sarang` 으로 합쳐(merge) 가져올 수 있습니다.
- 배포도 따로 합니다. Azure Static Web Apps 리소스를 하나 더 만들고 배포 브랜치를 `customer/sarang` 으로 지정하면 주소가 따로 생깁니다.
- 코드를 고객사에 넘기거나 접근 권한을 완전히 나눠야 하면, 브랜치 대신 저장소를 하나 복사해 쓰는 방법도 있습니다.

### 2. 사이트 구성: 영역 5개 (홈 카드가 5열이라 한 줄에 딱 맞음)

| 새 영역 id | 홈 카드 이름 | 가져오는 곳 | 시나리오 |
|---|---|---|---|
| `teams-basics` | Teams 기본 | **새로 만듦** (Copilot이 아닌 Teams 기본 기능 실습 화면) | 3편 |
| `copilot-chat` | Copilot Chat | 지금의 Chat 시나리오 3편(인사·영업·운영 영역에 흩어져 있음) | 3편 |
| `m365-apps` | Copilot in 앱 | 지금의 `m365-apps` 6편(Word·PowerPoint·Excel·Forms·Outlook·Teams) | 6편 |
| `copilot-agent` | Copilot 에이전트 | 지금의 `copilot-studio` 3편 + Cowork 시나리오 중 1편 | 2~3편 |
| `copilot-code` | Copilot Code | 지금의 `copilot-code` 3편 | 2~3편 |

- **뺄 것**: 업무 영역 5개(영업·인사·재무·구매·운영)의 Cowork 시나리오, Power Automate 영역.
- **화면·엔진은 그대로 쓰고, 시나리오 내용만 교회 업무로 다시 씁니다.** 새로 만드는 화면은 Teams 기본 실습 하나입니다.

### 3. 시나리오 초안 (교회 행정·사역 지원 중심, 고객사와 조정)

| 영역 | id | 제목(초안) |
|---|---|---|
| Teams 기본 | `teams-group-chat` | 수련회 준비팀 그룹 채팅방 만들고 첫 공지 보내기 |
| | `teams-event` | 교사 모임 일정을 Teams 일정으로 만들고 참석자 초대하기 |
| | `teams-team-files` | 사역팀 팀을 만들고 채널 파일에 폴더를 만들어 공유하기 |
| Copilot Chat | `chat-notice` | 주보 광고·공지 문구를 같은 형식으로 다듬기 |
| | `chat-policy-qa` | 시설 대관 규정 문서에서 신청 절차 찾기(출처 표시) |
| | `chat-event-poster` | 바자회 포스터 이미지 시안 만들기 |
| Copilot in 앱 | `word-retreat-plan` | Word: 지난 수련회 회의록으로 올해 기획안 초안 쓰기 |
| | `ppt-briefing` | PowerPoint: 기획안으로 교사 설명회 발표자료 만들기 |
| | `excel-signup` | Excel: 행사 참가 신청 현황을 부서별로 집계하고 차트 만들기 |
| | `forms-survey` | Forms: 수련회 만족도 설문 만들고 응답 요약하기 |
| | `outlook-reply` | Outlook: 협력 기관과 주고받은 긴 메일 요약하고 답장 쓰기 |
| | `teams-catchup` | Teams: 놓친 사역팀 회의 내용 따라잡고 할 일 정리하기 |
| Copilot 에이전트 | `agent-newcomer` | 새가족 안내 자료로 질문에 답하는 안내 에이전트 만들기 |
| | `agent-volunteer` | (Cowork) 봉사자 신청 명단으로 배치표 만들고 안내 메일 보내기 |
| Copilot Code | `code-volunteer-signup` | 봉사 신청 앱을 말로 만들기 |
| | `code-attendance` | 소그룹 출석 체크 앱 만들기 |

### 4. 교육용으로 바꿀 점

- **"체험" → "실습"**: 문구를 실습 기준으로 바꿉니다(`src/copy.ts`).
- **"실제로 해 보기" 카드**: 결과 화면에 실제 Teams·Copilot에서 따라 할 순서를 번호로 보여 줍니다. 시나리오 JSON에 `practice` 항목을 추가해 시나리오마다 적습니다. 시뮬레이션으로 익힌 뒤 실제 계정으로 바로 해 볼 수 있게 하는 장치입니다.
- **이미지**: 원본 부스 이미지 대신 새로 그린 이미지(`docs/design-draft/`)를 기본값으로 씁니다. 새 시나리오의 상황 그림은 새로 그립니다.
- **푸터·안내문**: "© Microsoft 2026" 은 교육 주관 쪽 이름으로 바꾸거나 지웁니다. 안내문은 "이 실습의 인물·수치는 모두 가상의 예시입니다."

### 5. 지켜야 할 것

- 실존 교인·교역자 이름, 연락처, 헌금·재정 실제 수치는 쓰지 않습니다. 인물·수치는 가상입니다.
- 교회 이름·로고는 고객사 허락을 받은 범위에서만 씁니다. 로고 파일은 고객사에게 받아 `docs/customer-sarang/assets/` 에 넣고, 인터넷에서 가져오지 않습니다.
- 설교·신앙 내용을 Copilot이 대신 쓰는 장면은 만들지 않습니다. 행정·사역 지원 업무만 다룹니다.

## 고객사 확인 사항 (작업 전에 채우기)

| 항목 | 기본값(답이 없을 때) | 고객사 답 |
|---|---|---|
| "Teams 방 생성" 의 뜻 | 그룹 채팅방 만들기 | |
| "Copilot Agent" 로 보여 줄 제품 | Copilot Studio 안내 에이전트 1편 + Cowork 1편 | |
| 교육 대상 | 교역자·사무 직원(개발자 아님) | |
| 교회 이름·로고 사용 | 이름만 사용, 로고 없음 | |
| 쓰는 용어(부서·사역팀·소그룹 이름) | 일반 용어(교구, 사역팀, 소그룹) | |
| 실제 실습 환경 | 시뮬레이션만, "실제로 해 보기" 카드는 안내용 | |
| 라이선스 | Copilot Chat만 확인됨. Microsoft 365 Copilot(앱 안 Copilot)·Copilot Studio·Copilot Code 사용 가능 여부는 고객사 관리자 확인 | |
| 배포 | 별도 주소(Azure Static Web Apps) + 더블클릭 폴더 | |

## 제품 사실 확인

- **Copilot Code, Copilot Studio 하네스, Copilot in 앱**: `docs/EXPANSION-PLAN.md` 의 "제품 사실 확인" 범위 안에서만 씁니다. Copilot Code는 관리자가 사용량(크레딧) 지출 정책을 만들어야 테넌트에서 동작하므로, 고객사 테넌트에서 바로 실습이 안 될 수 있습니다.
- **Teams 기본 기능**(그룹 채팅, 일정, 팀·채널, 채널 파일 공유): 2단계를 시작할 때 Microsoft 지원 문서·Microsoft Learn에서 현재 화면 순서와 단추 이름을 확인하고, 확인한 주소를 아래에 적습니다.
  - (확인한 주소 적기)
- **Copilot 에이전트**: 고객사 답에 맞춰 5단계를 시작할 때 확인하고 주소를 적습니다.
  - (확인한 주소 적기)

## 작업 순서 (단계 하나 = 세션 하나, 끝날 때마다 커밋)

- [x] 1. **기반 정리**: `customer/sarang` 브랜치 만들기. 영역 5개로 바꾸기(`src/tracks.ts`, `scripts/check-scenarios.mjs` 의 `TRACKS`, 홈 카드 아이콘). Chat 시나리오 3편과 에이전트용 Cowork 1편을 새 영역 폴더로 옮기고, 쓰지 않는 시나리오·영역 삭제. 문구·푸터·안내문 교체. 이미지 시안을 기본값으로(`?look=draft` 없이도 새 이미지). 이 단계에서는 시나리오 내용은 아직 그대로 둠.
- [ ] 2. **Teams 기본 실습 화면 + 3편**: Teams 앱 모양의 화면(채팅 목록, 일정, 팀·채널, 파일 탭)을 `src/surfaces/` 에 추가. 화면 찾기(spot)와 단추 안내(cue)로 순서대로 눌러 보게 함. 결과 화면 "실제로 해 보기" 카드(`practice`) 추가.
- [ ] 3. **Copilot Chat 3편**: 교회 업무로 다시 쓰기. 포스터 이미지는 새로 그림.
- [ ] 4. **Copilot in 앱 6편**: 교회 업무로 다시 쓰기.
- [ ] 5. **Copilot 에이전트 2~3편**: 고객사 답에 맞춰 다시 쓰기.
- [ ] 6. **Copilot Code 2~3편**: 교회 업무로 다시 쓰기.
- [ ] 7. **전체 점검**: 모든 시나리오 e2e, 1600×900·1371×768 스크린샷, `npm run build:local` 더블클릭 폴더, (선택) 배포.

## 새 세션에 붙여 넣을 프롬프트

클라우드 세션이든 내 PC의 Claude Code든 같은 프롬프트를 씁니다. 단계마다 새 세션을 열고 같은 프롬프트를 다시 붙여 넣으면 다음 단계로 넘어갑니다.

```text
이 저장소는 Microsoft Copilot 체험(시연) 사이트입니다. React + Vite + TypeScript, 시나리오는 src/scenarios/<영역>/<id>.scenario.json 입니다.
지금 할 일은 이 사이트를 바탕으로 고객사(사랑의교회) 교육용 실습 사이트를 따로 만드는 것입니다. 기존 체험 사이트는 그대로 둡니다.

브랜치:
- 작업 브랜치는 customer/sarang 입니다. 원격에 있으면 받아서 이어서 하고, 없으면 origin/claude/busy-wright-7wa9ee 에서 새로 만드세요.
- claude/busy-wright-7wa9ee 에는 커밋하거나 푸시하지 마세요. 푸시는 customer/sarang 에만 합니다.

먼저 읽을 것: docs/customer-sarang/PLAN.md(진행 방향, 작업 순서, 고객사 확인 사항), README.md. 원본 화면 구조가 필요할 때만 docs/reference/ 에서 필요한 절을 grep 으로 찾아 읽으세요(파일 전체를 읽지 마세요).

목표: PLAN.md 의 "작업 순서" 중 아직 끝나지 않은 첫 단계 하나만 진행합니다. git log 와 PLAN.md 의 체크 표시로 어디까지 됐는지 확인하세요.

지켜야 할 것:
- 실존 교인·교역자 이름, 연락처, 헌금·재정 수치 같은 실제 정보는 쓰지 마세요. 인물·수치는 가상으로 만듭니다.
- 교회 로고·사진은 docs/customer-sarang/assets/ 에 고객사가 준 파일이 있을 때만 씁니다. 인터넷에서 가져오지 마세요.
- 설교·신앙 내용을 Copilot이 대신 쓰는 장면은 만들지 말고 행정·사역 지원 업무를 다룹니다.
- 고객사 확인 사항에 답이 없으면 표의 기본값으로 진행하고, 그렇게 했다고 마지막에 알려 주세요.
- 제품 기능은 PLAN.md 의 "제품 사실 확인" 범위 안에서만 씁니다. 새로 다루는 기능은 Microsoft 지원 문서·Microsoft Learn 에서 현재 화면 순서와 단추 이름을 확인하고, 확인한 주소를 PLAN.md 에 적으세요. 확실하지 않은 기능은 지어내지 마세요.
- 기존 스타일(src/styles/reference.css)은 고치지 말고 새 스타일은 별도 CSS 파일에 추가합니다. 시나리오 JSON 은 기존 파일과 같은 구조로 직접 쓰고, 서브에이전트를 병렬로 띄우지 마세요.
- 끝나면 모두 통과시키세요.
  1) npm run check:scenarios
  2) npm run build
  3) npm run dev 를 띄운 상태에서 새로 만들거나 고친 시나리오마다 node scripts/e2e.cjs <영역> <id> e2e-out → "done": true, errors 빈 배열 (Playwright 를 못 찾으면 앞에 NODE_PATH=$(npm root -g) 를 붙여 실행)
  4) 홈·목록·실습·결과 화면을 1600×900 스크린샷으로 찍어 직접 확인
- 통과하면 PLAN.md 의 해당 단계에 [x] 표시를 하고 customer/sarang 에 커밋·푸시한 뒤, 한 일, 다음 단계, 고객사에 확인할 것을 짧게 알려 주세요.
```

## 비용 줄이기

- 단계 하나가 끝나면 세션을 닫고 새 세션에서 같은 프롬프트로 시작합니다. 긴 대화를 이어가는 것보다 훨씬 적게 듭니다.
- 고객사 확인 사항을 먼저 채워 두면 다시 고치는 일이 줄어듭니다.
