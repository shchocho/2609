# 로컬 Claude Code 로 이어서 작업하기

## 먼저 알아 둘 점: 비용

- 클라우드 세션과 로컬 Claude Code 는 **같은 사용량 한도**를 씁니다. 클라우드 컨테이너 자체에 별도 요금은 없습니다. 그래서 로컬로 옮기는 것만으로 크레딧이 크게 줄지는 않습니다.
- 실제로 크게 줄이는 방법은 따로 있습니다.
  1. **새 세션에서 시작하기**: 대화가 길어지면 매 턴마다 앞의 내용 전체를 다시 읽습니다. 이 문서의 짧은 프롬프트로 새로 시작하는 것이 가장 효과가 큽니다.
  2. **영역 하나씩, 끝날 때마다 커밋**하고 세션을 새로 열기.
  3. **병렬 서브에이전트를 쓰지 않기**: 1차 작업 때 시나리오 15편을 5개 에이전트로 동시에 바꾸면서 사용량이 많이 들었습니다.
  4. 시나리오 문장 작성처럼 단순한 작업은 `/model` 로 더 가벼운 모델로 바꾸기.
  5. `/usage` 로 수시 확인.

## 준비 (내 PC)

Git, Node.js 20 이상, Claude Code 가 필요합니다. Claude Code 설치 방법은 공식 문서(https://code.claude.com/docs)를 따르세요.

```bash
git clone https://github.com/shchocho/2609.git
```

```bash
cd 2609
```

```bash
git checkout claude/busy-wright-7wa9ee
```

```bash
npm install
```

```bash
npm run dev
```

브라우저에서 http://localhost:5173 이 열리면 준비 완료입니다. 자동 테스트(e2e)를 쓰려면 Playwright 를 한 번 설치합니다.

```bash
npm i -D playwright
```

```bash
npx playwright install chromium
```

## Claude Code 에 붙여 넣을 프롬프트

저장소 폴더에서 `claude` 를 실행하고 아래 내용을 그대로 붙여 넣으세요. 한 세션에 한 단계만 진행하도록 되어 있습니다.

```text
이 저장소는 Microsoft Copilot 체험(시연) 사이트입니다. React + Vite + TypeScript, 시나리오는 src/scenarios/<영역>/<id>.scenario.json 입니다.
먼저 README.md, docs/EXPANSION-PLAN.md 를 읽고 현재 구조를 파악하세요. 원본 화면의 DOM·클래스 구조가 필요할 때만 docs/reference/ 의 명세를 grep 으로 필요한 절만 찾아 읽으세요(파일 전체를 읽지 마세요).

목표: docs/EXPANSION-PLAN.md 의 "작업 순서" 중 아직 끝나지 않은 첫 단계 하나만 진행합니다. git log 로 어디까지 됐는지 확인하세요.

지켜야 할 것:
- 기존 15편 시나리오와 화면은 깨지면 안 됩니다. 기존 스타일(src/styles/reference.css)은 고치지 말고, 새 화면 스타일은 src/styles/surfaces.css 에 추가하세요.
- 배경 회사는 가상의 누리테크(주)입니다. 실존 기업·인물 이름은 쓰지 마세요. 제품 기능 설명은 docs/EXPANSION-PLAN.md 의 "제품 사실 확인" 범위 안에서만 쓰고, 확실하지 않은 기능은 지어내지 마세요.
- 시나리오 JSON 은 기존 파일(예: src/scenarios/procurement/quote-compare.scenario.json)과 같은 구조로 직접 작성하세요. 서브에이전트를 병렬로 띄우지 마세요.
- 작업이 끝나면 다음을 모두 통과시키세요.
  1) npm run check:scenarios
  2) npm run build
  3) npm run dev 를 띄운 상태에서 새로 만든 시나리오마다: node scripts/e2e.cjs <영역> <id> e2e-out  → 결과가 "done": true, errors 가 빈 배열
  4) 홈·목록·체험·결과 화면 스크린샷을 1600×900 으로 찍어 직접 확인
- 통과하면 커밋하고 claude/busy-wright-7wa9ee 브랜치에 푸시한 뒤, 무엇을 했고 다음 단계가 무엇인지 짧게 알려 주세요.
```

## 단계가 끝날 때마다

1. 결과를 확인하고 세션을 닫습니다.
2. 새 세션을 열고 같은 프롬프트를 다시 붙여 넣으면 다음 단계로 넘어갑니다.
3. 마지막 단계가 끝나면 `npm run build:local` 로 더블클릭용 폴더(`dist-local/`)를 다시 만들 수 있습니다.
