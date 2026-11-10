> 참고 문서: 원본 부스 화면(Copilot Scenario Player)의 번들을 분석해 정리한 구현 명세입니다.
> 줄 번호와 짧은 이름(예: `m7`, `Gn`)은 원본 번들 기준이라 이 저장소에는 없습니다. 클래스 이름·DOM 구조·동작 규칙만 참고하세요.
> 스타일은 `src/styles/reference.css` 에 그대로 들어 있습니다.

# Copilot Scenario Player — Engine & UI Implementation Spec

Reverse-engineered from `index.pretty.js` (Vite/React bundle, identifiers mangled) and the 15 extracted
`scenarios/*.json`. Minified names are quoted in brackets (e.g. `[nk]`) so claims can be checked
against the bundle. Line numbers refer to `index.pretty.js`.

Component map (minified → meaning):

| Name | Lines | Meaning |
|---|---|---|
| `Pv` | 26626 | Root: router + screen switch + idle timer |
| `I0` / `n8` / `Ut` | 9530–9560 | Hash parser / hash hook / navigate |
| `o8` | 9563 | Idle timer (5 min → attract) |
| `U0` | 9585 | Attract screen (+ "limited" small-screen variant) |
| `G8` | 18330 | Home (`#/start`) — track grid |
| `ek` | 18451 | Scenario list for a track (orbit carousel / product view) |
| `_v` | 26155 | Play screen (phases, header, chat surface, coach layer) |
| `nk` | 18769 | Message playback engine hook |
| `H5` | 18764 | Per-message reveal delay |
| `m7` | 22231 | Cowork **workbench** surface (the big one) |
| `Mv` | 25974 | Surface switcher for non-workbench play (chat/scout/word/excel/ppt/sharepoint/teams shells) |
| `Gn` | 22051 | Message renderer (user/assistant/tool/note) |
| `Qe` / `Pe` / `Ot` / `Dt` / `Xi` / `ac` / `Jk` / `e7` | 21142–21384 | Coach overlay (veil + tip), tip card, tip button, hint, key chip, "✓ done", choice option list, spot option list |
| `em` / `n7` / `rk` | 21386 / 21532 / 19158 | Permission dialog (Cowork) / recurring-task dialog / Scout permission |
| `Av` / `Ev` | 26093 / 26127 | Approve wrapper / spot quiz wrapper (chat surface) |
| `tv` / `M7` / `nv` / `lv` / `N7` | 24701 / 23642 / 24789 / 24881 / 23509 | Scene intro / image pain panel / overview steps / quiz / done screen |
| `ic` → `Ck` `Ak` `Ek` `zk` `_k` | 20852 | Artifact renderer dispatcher → sheet / deck / teams / mail / doc |
| `Ds` | 20197 | Document block renderer (field, subject, para, …) |
| `jk` | 20372 | Outlook reading-pane rendering of a mail artifact in the side panel |
| `j7` / `w7` / `y7` | 23402 / 23237 / 23220 | Done-screen result viewer / doc window chrome / doc tabs |
| `pk` | 19711 | File picker dialog (cloud / local) |
| `re` / `St` / `sr` `U5` / `lk` / `on` / `oc` | 18910–18940 | Template vars / `only`+`not` filter / filtered list / write-length / name-by / ids |
| `V8` / `U8` | 18206 / 18276 | Scenario validation / loading |
| `T8` `F8` `L8` `Ie` `B8` | 9648–9720 | Surface zones / model list / effort list / agent names / app names |
| `e8` | 9456 | Track table |

---

## 1. Boot, global behaviour, routing

### 1.1 Boot sequence (`index.pretty.js` 26641–26670)
1. `Jw()` writes brand CSS variables on `<html>`: `--copilot-neutral #F6F9F0`, `--copilot-black #242424`,
   `--copilot-overlap-green #AEE02F`, `--copilot-overlap-blue #4DD2E3`, and `--m365-{app}-{bright|light|dark}`
   for word/excel/outlook/powerpoint/teams/onenote (values in `kf.product`, line 9380).
2. `t8()` writes `--track-{id}` (track `color`) and `--track-{id}-ink` (track `textColor`) for each track.
3. **Booth zoom** `[am]`: on load and every `resize`:
   ```
   portrait  = innerHeight >= innerWidth
   zoom = portrait ? clamp(innerWidth / 1080, 1, 2.5)
                   : min(innerWidth / 1371, innerHeight / 768, 2.5)   // NOTE: no lower clamp in landscape
   html.style.zoom = zoom
   html.dataset.orient = portrait ? "portrait" : "landscape"
   html.style.setProperty("--booth-zoom", zoom)
   ```
   CSS uses `--booth-zoom` to correct viewport units (`--vh: calc(1vh / var(--booth-zoom,1))`,
   `--vw`, `height: calc(58vh / var(--booth-zoom,1))`). The panel resizer (`Q5`) divides `clientX` by
   `--booth-zoom` to convert pointer coordinates.
4. **Keyboard-focus mode** `[cc]`: a `keydown` of `Tab` (capture) sets `<html data-kbd>`; any `pointerdown`
   or `touchstart` removes it. CSS hides `:focus`/`:focus-visible` rings unless `data-kbd` is present.
5. `createRoot(#root).render(<StrictMode><Pv/></StrictMode>)` inside a Fluent `FluentProvider` (`G1`) with a
   custom brand ramp (`Kw`, blue `#0a6bba` at 80) and `fontFamilyBase: var(--booth-font)`; className `booth-root`.

### 1.2 Hash router `[I0]`
```
"#/"                       → { name: "attract" }
"#/start"                  → { name: "home" }
"#/t/<track>"              → { name: "scenarios", track }   (track must be one of the 5 ids)
"#/t/<track>/<scenario>"   → { name: "play", track, scenario }
anything else              → attract
```
Builders: `jf = "#/"`, `Sf = "#/start"`, `Qi(track) = "#/t/"+track`, `H0(track,id) = "#/t/"+track+"/"+id`.
Navigation is `window.location.hash = …` `[Ut]`; the hook `[n8]` listens to `hashchange`.
There are **no** query-string parameters read anywhere in the app.

### 1.3 Root `[Pv]`
* Media query `ad = "(min-width: 768px) and (min-height: 600px)"`. When it does **not** match, every route
  renders the **limited attract** screen (`U0 limited`) regardless of hash.
* **Idle timer** `[o8]`: active when the viewport is big enough **and** the route is not `attract`.
  `V0 = 300000 ms` (5 min) with no `pointerdown|keydown|wheel|touchstart` → navigate to `#/` (attract).
  The timer is reset on each of those events.
* Screen switch: attract → `U0`; home → `G8`; scenarios → `ek` (keyed by track); play → `_v`.

### 1.4 Attract `[U0]` (`main.booth-attract`, `data-brand-theme="m365-combined"`)
* Normal: full-bleed looping muted `<video>` (`ao.motion.landscape|portrait` chosen by `(orientation: portrait)`
  media query, poster = `ao.hero.*`). Copy: `<h1>` = Copilot horizontal logo + "과" + " 함께라면, " +
  "대학의 연구·교육·행정은 어떻게 달라질까요?"; button `.booth-cta` "체험해보기".
  **Clicking anywhere on `<main>`** navigates to `#/start` (the button has no own handler).
* Limited (`.is-limited`): static hero image, Copilot logo, `<h1>` "더 큰 화면에서<br>접속해 주세요",
  `<p>` "PC나 태블릿에서 체험해 주세요.<br>창을 작게 열었다면 크기를 늘려 주세요.". No click handler.

### 1.5 Home `[G8]` (`main.booth-home`, `data-brand-theme="copilot"`)
* Header: `<h1 class="booth-home-title">` lockup image (alt "Microsoft Copilot") + "과" / "함께라면," /
  "대학의 연구·교육·행정은 어떻게 달라질까요?". `<p class="booth-hero-about">` two spans:
  "캠퍼스 영역을 선택해 보세요." and "Copilot이 연구·교육·학습·행정을 어떻게 바꾸는지 POSTECH 맞춤 시나리오로 체험해 보세요."
* `<ul class="booth-track-grid">` one `<button class="booth-track-card" data-track={id}>` per track in `e8` order:
  icon (Fluent icon per track from `K8`, fallback to `track.icon` emoji), `<strong>{track.name}</strong>`,
  `<p>{track.about}</p>`. `disabled` when the track has 0 loaded scenarios (`Q8` counts). Click → `#/t/{id}`.
* Footer `.booth-foot`: "© Microsoft 2026" and `.booth-em` "POSTECH AI Experience".
* Tracks (`e8`): research 연구 🔬 `#b11f4b`/`#8e183c`; education 교육 🎓 `#0a6bba`; learning 학습 📚 `#6c4bb6`/`#5b3ea0`;
  admin 행정 🏛️ `#c8951a`/`#8a6410`; campus 산학·소통 🤝 `#2b8a6e`/`#1f6852`. Each has `about` (one sentence) and
  `intro[0]` `{tone:"problem", image:"/intro/{id}.png", icon, caption}` (caption only used as a fallback by `V5`).

### 1.6 Scenario list `[ek]` (`main.booth-list`, `data-track`, `data-expanded`, `data-browsed`)
Data: `u` = loaded scenarios of the track (`W8`) mapped to `{id, order (default 99), title, badge: Ie[agent].full, scenario}`
plus "coming soon" placeholders from `X8` (empty array in this build; badge "곧 공개", `scenario: null`), sorted by `order`.

* Header `.booth-hero`: signature art, back button `.booth-back` "캠퍼스 영역" → `#/start`, `<h1>{track.name}</h1>`,
  `<p class="booth-hero-about">{track.about}</p>`.
* View toggle `.booth-view-action` (only when `u.length>0`): label "제품별 시나리오 보기" when collapsed,
  "하나씩 둘러보기" when expanded (`aria-expanded`). Toggling uses `document.startViewTransition` when available and
  reduced-motion is off (`view-transition-name: scenario-{id}` on cards; a `<style>` block sets per-card z-index and
  `animation-delay: min(i*12,48)ms`). After the first toggle `data-browsed="true"`.
* **Orbit view** (default; `#scenario-view .booth-orbit-stage`, CSS var `--fan-k`): `<ul class="booth-orbit">` with one
  `<li>` per entry; `--o` = signed circular offset from the active index; `data-active`; `data-product` = made app
  (`q0(scenario)` → first `origin:"made"` artifact whose `app` is an M365 app) for theming; `data-soon` for placeholders.
  Each li shows a stack of up to 3 app icons (`H8(scenario)` = `scenario.apps` or derived from artifacts, read-origin
  first; last 3 shown) and a `<button class="booth-orbit-frame">`: badge (`.booth-skill` = "Copilot Chat"/"Copilot Cowork"),
  `<strong>{title}</strong>`, and a `<dl class="booth-story">` with `AS-IS → scenario.before` and `TO-BE → scenario.hook`
  (each only if present), then CTA `.booth-orbit-cta` "체험해보기" (or `.booth-orbit-soon` "다음 행사에서 공개합니다").
  Click on the **active** card → `#/t/{track}/{id}`; click on another card → make it active.
  Swipe: pointerdown/up with |dx| ≥ 60 and |dx| > |dy| → next/prev (and suppresses the click).
  Pager `<nav class="booth-orbit-nav" aria-label="체험 탐색">`: prev ("이전 시나리오"), dots (`aria-label="{i+1}번째 · {title}"`,
  `aria-current`), next ("다음 시나리오"). Index wraps around.
  Initial active = first entry that has a scenario.
* **Product view** (`#product-view .booth-product-guide`, `aria-label="제품별 체험"`): one `<article data-agent>` per
  entry of `J8`: Chat — "요약·초안·아이디어가 필요할 때, **대화로 빠르게** 해결합니다."; Cowork — "목표를 주면
  **여러 앱과 파일에 걸친 작업**을 단계별로 실행합니다.". Header = Copilot grey logo + "Chat"/"Cowork". Lists that
  agent's scenarios as buttons: `<strong>{title}</strong>` + `.booth-product-outcome` = `hook || summary` + chevron → play.
* Empty track: `<p class="booth-empty">아직 준비된 시나리오가 없습니다.</p>`. (A `.booth-cards` grid fallback exists for
  the `m === null` case, i.e. no playable entry.)

---

## 2. Scenario loading & validation

`U8` reads two `import.meta.glob` maps: `Q0` (`.ts/.js` scenarios — empty) and `K0` (`./<track>/<id>.scenario.json`).
The folder name is the track (`Vr`); files whose folder is not a known track are skipped (`console.info` count).
JSON scenarios pass `V8` validation (invalid → `console.error("[scenarios] <path> — <reason>. 이 시나리오는 빠집니다.")`
and dropped). Duplicated ids and folder/track mismatches are logged. Result sorted by `(order ?? 99)` then `title`
(`localeCompare('ko')`). `W8(track)` filters, `q8(id)` finds.

Validation rules (`V8`) — a re-implementation should keep them as authoring lint:
* required non-empty strings: `id, track, agent, model, title, summary`; `track ∈ tracks`; `agent ∈ {chat, cowork, scout}`.
* `messages` non-empty array; each has `role ∈ {user, assistant, tool, note, cue, spot, approve, choice, hunt, card}`.
* `tool` needs `tool`; `cue` needs `text` + `action`; `approve` needs `what`, `param` (if present) must be an array,
  and is only allowed when `workbench` exists or surface is scout; `spot` needs `text`, `does`, ≥2 `options` each with
  `at ∈ T8[surface]` and `label`, numeric `answer` in range; `choice` needs `workbench` or scout, `key`, `text`, ≥2 options
  with `id` + `label`, at most one `recommended`; `hunt` needs `text`, `hint`, `does`, `at ∈ {composer, rail}`,
  `target ∈ {model, effort, attach, new, mine, auto, custom}`; `card` needs `kind` + non-empty `body`; every other role needs `text`.
* `quiz` (if present) must have exactly 3 questions, each `text`, ≥2 `options`, `answer` in range.

Surface resolution `Ye(s) = s.surface ?? {chat:"chat", cowork:"cowork", scout:"scout"}[s.agent]`. All 15 shipped
scenarios are `chat` (3) or `cowork` (12); none sets `surface`.

---

## 3. Play screen `[_v]` — phases and chrome

`<main class="sc" data-track data-scenario data-brand-theme="copilot">`.

### 3.1 Phase list
`ok(scenario)` builds the ordered phase array:
```
["pain", ("overview" if scenario.overview?.length), "demo", "done"]
```
`"pain"` is always pushed (`V5` always returns an object). **`"quiz"` is never pushed**, so the quiz component `lv`
(§3.6) and the step label 확인 are unreachable in this build even though 12 scenarios carry `quiz` data.
Labels `Ur = {pain:"상황", overview:"흐름", demo:"체험", quiz:"확인", done:"결과"}`.

Phase index `m` (state). `b` = current phase name. Effects: entering `demo` → `engine.play()`, any other phase →
`engine.pause()`.

### 3.2 Header `.sc-head`
* `.sc-back` (icon only, `aria-label="{track.name} 목록으로 돌아가기"`) → `#/t/{track}`.
* `.sc-jump` ghost buttons:
  * "처음으로" → full restart (`ut`: restart counter `v++` which remounts the workbench, clears lit/hold/picks/state/approvals/denied,
    `engine.restart()`) and phase 0.
  * "이전으로" (disabled unless `(demo && engine.canBack) || m > 0`): in demo with history → clears transient UI
    (lit zone, hold, scout reply, denied), shows rewind toast `.sc-rewind` "한 걸음 되돌렸습니다" for `zv = 1600 ms`, and
    `engine.back()`; otherwise `engine.pause()` and phase − 1.
  * If on the last phase: "홈으로" → `engine.pause()`, navigate `#/`. Else "건너뛰기" → clear lit zone, `engine.pause()`,
    jump to the **last** phase (done) — the done screen then shows the "체험 미완료" variant because `engine.done` is false.
* `.sc-title > h1` = `scenario.title`.
* `<ol class="sc-steps" aria-label="진행 단계" style="--n: {count}; --i: {m}">`: one `<li>` per phase, class `on` /
  `past`, `aria-current="step"` on the current; past steps are `<button aria-label="{label} 단계로 돌아가기">` that jump
  back (also clears the lit zone); current/future are plain `<span>`.
* Missing scenario id: `<p class="booth-empty">시나리오를 찾을 수 없습니다.</p>` + `.booth-back` "목록으로".

### 3.3 Phase "pain" — scene intro `[tv]` (used when `scenario.scene` exists; all 15 do)
`div.sc-scene` (`.has-photo` if a photo exists for the art key — `J7` is empty so never). Clicking **anywhere** on it →
next phase (the "Copilot과 해보기" button has no handler of its own).
* Illustration: `scene.art` selects an inline SVG template from `Z7` (keys: brand-proposal, delay-response, budget-pivot,
  quarter-closing-report, onboarding-plan, contract-draft, tech-inquiry-reply, receipt-expense, press-release-draft,
  standup-catchup, incident-runbook, deck-translation, log-analysis, budget-variance, quote-compare, stock-risk,
  terms-review, resume-screening, competitor-newsletter, event-poster, policy-inquiry, meeting-followup,
  attendance-alert, server-health). `A7` substitutes `{{slot}}` placeholders with `scene.artSlots[slot]` (HTML-escaped,
  missing → ""). After mount, any direct child `rect|path|ellipse|circle|polygon` (with a fill) whose bbox width ≥ 98% of
  the viewBox is hidden (removes the template's own sky background so the page background shows).
* Headline: `scene.headline` split on `‹‹ … ››` → the inner part rendered as `<mark>`.
* Points: `<ul class="sc-scene-grid">`; each `scene.points[i]` = `{icon, scene, say}` → `om(icon ?? "alert")` inline icon,
  `<b>{scene}</b>`, `<q>{say}</q>`. Points fade in one by one every `900 + id(320) = 1220 ms` (`is-in`).
* Outro `.sc-scene-outro` with `--outro-in: {points.length * 1220}ms`: brand line "Work *lighter*" and button
  `.sc-start` "Copilot과 해보기" + chevron. `scene.eyebrow` and `scene.sub` are **not rendered** by `tv`.

Fallback (no `scene`): `[M7]` — `<button class="sc-pain" aria-label="다음으로">` with `V5` panel: image
`/intro/{track}/{id}.png` (falls back to `icon` emoji on error), `<em>{title}</em>`, `<strong>{caption}</strong>` where
caption = `before ?? summary ?? track.intro[0].caption`, and `<i>화면을 눌러 다음으로</i>`.

### 3.4 Phase "overview" `[nv]`
`div.sc-stage.sc-stage-sky`. Head `<h2>`: product name (`k7`-like: Copilot grey logo + "Cowork"/"Chat", or Scout mark +
"Microsoft Scout") + particle ("와" for cowork/scout, "과" for chat) + " 함께라면?"; `.sc-hook` = `scenario.hook`.
`<ol class="sc-flow" style="--shown; --n">` lists `scenario.overview[]` (`{icon, title, desc}` — `icon` is **not** rendered
here; number `i+1`, `<strong>{title}</strong>`, `<p>{desc}</p>`). Steps reveal one at a time: clicking the list (while not
all shown; class `is-tappable`) or the `.sc-flow-more` button ("칸을 눌러 하나씩 열어보세요" when 0 shown, else
"다음 칸을 눌러 보세요 ({shown} / {n})") increments. When all are shown: `.sc-outro.is-done` with `<p class="sc-ready">Ready?</p>`
and `.sc-start` "지금 시작하기" → next phase.

### 3.5 Phase "demo"
* `scenario.workbench` present → the workbench `m7` is **always mounted** (so its state survives phase changes) inside a
  `<div style="display: contents|none">`, keyed `${scenarioId}:${restartCounter}`, with `active = (phase === demo)`.
* Otherwise → `.sc-feed > .desk-win.is-app` containing `Mv` (surface shell) + the coach layer `J5`. See §7.

### 3.6 Phase "quiz" `[lv]` (unreachable, documented for completeness)
Shows "확인 문제 {i+1} / {n}", question text, numbered `.sc-choice` buttons; a wrong pick flashes `is-wrong` and shows
"다시 골라 보세요."; a right pick advances; after the last → pass screen "시나리오 패스" / "{n}문제 모두 맞히셨습니다" /
"결과물을 보여 드립니다…" and `onPass` after `ov = 1800 ms`.

### 3.7 Phase "done" `[N7]` — see §8.

---

## 4. Playback engine `[nk]`

`nk(messages, skip, autoplay = true)` where `skip(m) = !St(ids, m)` (message filtered out by `only`/`not`, §6.1).

State: `shown` (number of messages revealed; the stream renders `messages.slice(0, shown)`), `playing`, `speed` (always 1;
`setSpeed` exists but nothing calls it). When the `messages` array identity changes → `shown = 0`, `playing = autoplay`.

Derived each render:
```
done     = shown >= messages.length
cur      = messages[shown]; if skip(cur) treat as "no gate" (cur := undefined)
pending  = cur.role === "cue"     ? cur : null
spot     = cur.role === "spot"    ? cur : null
approve  = cur.role === "approve" ? cur : null
choice   = cur.role === "choice"  ? cur : null
hunt     = cur.role === "hunt"    ? cur : null
card     = cur.role === "card"    ? cur : null       // informational only, card does NOT gate
gate     = pending || spot || approve || choice || hunt
busy     = playing && !done && !gate && cur.role === "assistant" && messages[shown-1]?.role !== "tool"
ask      = pending && messages[shown+1]?.role === "user" ? messages[shown+1].text : null
playing' = playing && !done && !gate          // the exposed `playing`
```
Timer effect (deps: messages, shown, playing, done, gate): clear previous timer; if `!playing || done || gate` do nothing.
Otherwise let `Q = messages[shown]`; delay = `skip(Q) ? 0 : max(afterBack ? 1500 : 0, H5(Q) / speed)`; after the delay
`shown += 1`. (`afterBack` is a one-shot flag set by `back()`; `tk = 1500`.) So **`H5(Q)` is the pre-reveal delay of the
message about to be shown**, measured from when the previous message appeared. Filtered-out messages are skipped instantly.

`H5(m)`:
```
cue/spot/approve/choice/hunt → 0 (irrelevant; they gate)
m.delayMs != null            → m.delayMs
card → 1200 · note → 400 · tool → 900 · user → 700
assistant (default)          → min(6000, 900 + 42 * text.length)
```
There is **no character-by-character typing/streaming**; a message appears whole after its delay. The "working" shimmer
(`Ki`, default label "작업 중…") is shown while `busy`; a `tool` message that is the latest revealed one and `playing` is
rendered in its "running" state (`active` prop) instead.

Controls returned: `play`, `pause`, `toggle`, `restart` (shown=0, playing), `skip` (shown=total, paused; unused by UI),
`back` (jump `shown` to the nearest earlier index whose message is not filtered; sets afterBack; playing=true),
`canBack = shown > 0`, `act` (if nothing changed since render: `shown = min(shown+1, total)`; playing = true — this is how a
gate message is consumed: the gate message itself becomes "shown"/counted, then the timer reveals the next one after its
`H5` delay).

---

## 5. Message roles — rendering & advancement

Rendering in the stream is done by `Gn` (chat surface and workbench). It returns `null` for gate roles
(`cue/spot/approve/choice/hunt`) and `card` (the workbench renders `card` separately via `g7`), and for a message whose
`only` does not intersect the current ids.

| Role | Rendered as | How it advances |
|---|---|---|
| `user` | `.sc-user` → optional `.sc-user-clip` chips (`clips` on the first user message = workbench read files, §7.5; or the `pick` clip), `.sc-user-box > p` text with `**bold**` (`ke`). If `pick` is given the `pick.token` substring is replaced by a `.cwr-link` chip with `pick.name`. `at` is **not** rendered. | auto, after `H5` (700 ms default) |
| `assistant` | `.sc-answer` (`.cwr-hold` when it is the hold anchor). Body `Cl` markdown-lite (§5.1) + optional image gallery (`images`) + actions row `.sc-answer-acts.sc-zone.zone-actions` with copy/👍/👎/share/more icons (`lc`). With `sources` → `s7` cited answer (§6.8). | auto after `H5`; but on the **chat surface and in the workbench every revealed assistant message pauses playback** (hold) until the user presses "이어서 보기" (§7.2, §7.4) |
| `tool` (chat) | `.sc-act.is-now|is-done`: header Copilot icon + category word `r7(tool)` + "›", then `<p class="sc-act-d">{tool}</p>`. `r7` picks 검색/읽기/분석/생성/연결/변환/실행/확인 by regex on the tool text (검색|찾는|훑는 → 검색; 읽는|보는 → 읽기; 계산|분석|정렬|대조 → 분석; 작성|쓰는|만드는|그리는|채우는 → 생성; 연결|가져오는|불러오는 → 연결; 변환|옮기는 → 변환; 예약|요청|발송|올리는|등록 → 실행; else 확인). | auto after `H5` (900 ms default or `delayMs`). In the workbench it also drives artifact side effects (§6.4) |
| `tool` (scout) | `q5` tool card: "Running tools..." / "Running {tool}" while active; else `<details>` "Used 1 tool" (or expanded) with status (`status ?? "Completed"`), optional `input`, `output` ("Output" details + preview), optional thought `W5` ("Thought"/"Thought for {n}s"). | auto |
| `note` | `<p class="sc-note">{text}</p>` | auto (400 ms) |
| `card` (workbench) | `g7` `.wb-ans`: header `icon ?? "▤"` + `<b>{kind}</b>` + "Copilot Cowork 작성"; body paragraphs (templated); `sources` as `[label, text, tag]` triples under "근거" (tag containing "개정" → `is-new`); `note`. | auto (1200 ms) |
| `cue` | not in stream. Coach tip anchored to the composer with `q = cue.text`; if the next message is a `user` message (`ask`), the composer is **prefilled** with that text and the tip shows "[send icon]을 눌러 보내 보세요."; otherwise the tip shows a button labelled `cue.action`. | user presses the composer **send** button (or the `cue.action` button) → `engine.act()` |
| `spot` | not in stream; quiz-style tip (§6.9) | correct answer → zone lit for 2600 ms → `act()` |
| `approve` | permission dialog in the stream (§6.6) | 승인/예약 (or Scout Allow) → `act()` (after 600 ms in workbench). 취소/Deny → denied state; **does not** advance |
| `choice` | coach tip with numbered options (workbench) or inline card `Z0` (scout) (§6.3) | pick → after 1100 ms `act()` |
| `hunt` | coach tip "find the feature" (§6.5) | click the right UI target (+ pick/attach/send for `attach`) → after 700 ms `act()` |

### 5.1 Text formatting (`Cl` / `sk` / `ke`)
`sk(text)` splits on blank lines into blocks: fenced ``` code ``` → `.sc-code` with line numbers; lines starting with `>` →
`<blockquote class="sc-quote">`; consecutive lines starting with `"✅ "` → `<ul class="sc-check">` items (prefix stripped);
everything else → `<p>` (line breaks preserved inside). Inline `**bold**` → `<b>` (`ke`). No other markdown. The citation
renderer may append a button after paragraph *i* (`afterParagraph(i)`).
Workbench clause templates additionally turn runs of `___` (3+) into `<u class="wb-blank">` (`bk`).

### 5.2 Template variables `re(text, vars)`
`{model}`, `{effort}`, `{pick:KEY}` → label of the option picked for choice `KEY`, `{val:KEY}` → that option's `value`.
`vars = {model: st.model ?? scenario.model, effort: st.effort ?? scenario.effort ?? "보통", picks, vals}`.
Applied to: user/assistant text in the stream, choice option labels/replies, injected hunt "say", artifact cells/blocks/
slides, recap `desc`, mail approve fields (`to`, `subject`, `body`), composer prefill (`ask`).

---

## 6. Interaction semantics

### 6.1 `only` / `not` filtering (`St`, `sr`, `U5`)
`ids = oc(st) = [...picks.map(p => p.option.id), ...(st.hunted ? ["hunted"] : [])]`.
`St(ids, item) = !(item.only && !item.only.some(id ∈ ids)) && !(item.not && item.not.some(id ∈ ids))`.
* Applies to **messages** (engine skip predicate; filtered messages are never shown and cost 0 ms), to **sheet rows**, to
  **document blocks**, and (via `by`/`textBy`/`nameBy`/`tabsAdd`/`headAdd`/`outsBy` lookups) to variant selection.
* Because picks are appended in order, "first matching key wins" lookups (`on`, `td`, clause `textBy`, `b7`) resolve by
  the order ids appear in `ids`.
* The pseudo-id `"hunted"` becomes true once a hunt succeeds, so messages/rows can be `only: ["hunted"]`.

### 6.2 `user.pick` (chat surface only; 1 scenario)
`{token, query, name, meta, app}`. Only the **first** user message's `pick` is used. Sequence while the cue before it is
pending (`ask` set):
1. phase `"type"` (composer shows text with `/query` and a caret) — skipped under `prefers-reduced-motion` →
2. after 850 ms `"search"`: a slash-search dropdown `rv` (`.wb-slash`, tabs 전체/파일/이메일/채팅/사이트, one result row:
   app icon, name with the query part bolded, meta) appears above the composer; coach tip on `[".wb-slash", ".zone-composer"]`:
   "검색 목록이 열렸어요. 참고할 자료를 골라 붙여 볼까요?" + hint "검색 목록에서 **{name}** 를 눌러 붙여 보세요.";
   the send button is disabled (`onSend` undefined) until done.
3. user clicks the row → `"pick"` (row highlighted) → after 460 ms `"done"`: the token in the composer text becomes a
   `.cwr-link` chip, a `.composer-clip` chip (icon + name) appears, send becomes active, and the normal cue tip shows.
4. The sent user message renders the token as a link chip and a `.sc-user-clip`.

### 6.3 `choice` — `key`, `options[]`, `act`, `builds`, option `{id,label,desc,meta,say,value,reply,recommended}`
Workbench (`m7`): coach tip (kind `choice` → header icon + "선택한 기준에 따라 결과물이 달라집니다", `q = choice.text`) anchored to
the `.cwr-hold` element (the last assistant message) or unanchored; options list `Jk` (`.wb-opts`: number, `<b>label</b>`,
`<em>desc (meta)</em>`). On pick (`um`), if the key is not already picked:
* an injected **user bubble** with `option.label` is added under the current index (`h[shown].say`);
* `st.picks += {key, option}`; `st.agent = choice.act ?? "선택하신 내용을 반영하는 중"` — **note: `st.agent` is written in several
  places but never read/rendered in this build** (dead state; the visible effect of a choice is the artifact rewrite below);
* if `choice.builds` (an artifact id): that artifact is opened (`opened += builds`), `writing = builds`, `rows = 0` → the
  artifact is **re-written progressively** (§6.4) now that `ids` include the new option id (rows/blocks with `only` appear).
* Engine effect: 1100 ms later, if `!builds` → `agent = null`; if `option.reply` → an injected assistant reply
  (`h[shown].reply`, templated) is appended and the stream **holds** (coach "선택하신 기준으로 Copilot Cowork이 다시 정리한
  내용입니다.\n내용을 확인한 뒤 이어서 진행해 주세요." + "이어서 보기"); then `engine.act()`.
* `option.say` and `option.value` are not rendered directly; `value` feeds `{val:key}`, `label` feeds `{pick:key}`.
* `tag` ("선택 1 / 2") is **never rendered**. `recommended` renders a "Recommended" pill only in the Scout card.

Scout (`_v`, no shipped data): inline `Z0` card with lettered options (A./B.…), "Recommended" pill, `meta`, `desc`;
after pick shows "✓ A. label", an injected user bubble, a shimmer, then after 1200 ms the `reply` as a Scout answer, and
`act()` after `1200 + max(2600, H5(reply))` ms.

### 6.4 `tool.opens` / `shows` / `writes` / `translate` (workbench only)
When a tool message becomes the latest revealed message (`shown-1`), `m7` applies (in this order):
* `opens` **or** `shows` (same handling; `opens ?? shows`) → `st.agent = tool`, `st.opened += id` (if new).
* `writes` → `st.agent = tool`, `opened += id`, `st.writing = id`, `st.rows = 0`. Then every **320 ms** (`a7`) `rows += 1`
  until `rows >= lk(artifact, ids)` where `lk` = filtered sheet rows count | `teams.body.length + 2` | `deck.slides.length` |
  filtered blocks count; then `writing = null`, `agent = null`. While writing, the renderer receives `writing = rows` and
  shows only the first `rows` rows/blocks, the newest one marked `is-now`/`.wb-new`; the sheet shows a live formula bar
  "A{rows+1} fx". (Only applies when the artifact is the one open in the panel: `writing = st.writing === openId ? rows : null`.)
* `translate: true` → `st.agent = tool`, `moved = 0`, `moving = 1`; every **260 ms** (`c7`) `moved += 1`, `moving = moved+2`,
  `slide = moved+1` (the panel follows the slide being "moved") until `moved >= deck.slides.length` → `moving = 0`, `agent = null`.
  Targets the first artifact whose `deck` exists and has no `deck.src`. In `progressive` mode a slide counts as done only
  when `moved >= slide.n`, so `by[id]` variants (and the `over` warning) appear slide by slide.
* none of the above → `st.agent = tool`.
* An **assistant** message resets `st.agent = null` and, if it has `over: true`, sets `st.over = true` (enables the deck
  "⚠ 글상자를 넘침 · 확인 필요" badge on slides flagged `over`). (`st.agent` itself is never rendered — see §6.3.)

**Slots** (`Wn`): where artifact cards appear in the stream. `opens`/`shows` → card under the tool message itself;
`writes` → card under the **next** assistant message that passes the filter (or under the tool if none);
`assistant.files[]` → cards under that assistant message. Each artifact id is slotted only at its first occurrence.
Read-origin artifacts render as a `.cwr-ref` "search" row (“name” + " 검색 중" while that message is active, app icon + "파일");
made artifacts render as a `.cwr-fcard` file card (icon, name via `on()`, kind label via `u7`: outlook →
"보낸 편지함에 저장됨" if `where` contains "보낸", "임시보관함에 저장됨" if it contains "임시", else `where`; other apps →
"Excel 스프레드시트" / "Word 문서" / "PowerPoint 프레젠테이션" / "OneNote 전자 필기장" / "Teams 메시지"). Clicking either opens it
in the side panel (`Un`). Cards for not-yet-reviewed made artifacts get `.is-cue` (pulsing) during review.

**Review gate** (`Ue`): when the latest slot index that contains a *made* artifact (`El`) is greater than the last
acknowledged index (`F`) and the engine is not done, the workbench **pauses** playback and enters review:
* tip anchored to `.cwr-fcard.is-cue` (if unopened made cards remain) "결과물이 완성되었습니다. 생성된 문서를 하나씩 열어
  확인해 보세요." + hint "대화창의 파일 카드를 눌러 열어 보세요." + " {opened}/{total}" when >1; or anchored to
  `.cwr-fcard.is-on` "결과물을 확인했습니다. 다음 작업을 이어갈까요?" + button "다음 단계";
* with the panel open: tip on `.cwr-panel.is-doc` "결과물 내용을 확인해 보세요." + button "다음 결과물" (if more unopened) /
  "다음 단계". "다음 결과물" opens the next unopened made artifact; "다음 단계" closes the panel, acknowledges (`F = El`),
  and `engine.play()`. Composer send is disabled during review.

### 6.5 `hunt` — `at`, `target`, `text`, `hint`, `does`, `say`, `wrong{}`, `menu{}`, `chip`, `tag`
Workbench only. Coach tip (kind `quiz` header "Quiz") with `q = hunt.text` anchored to `.side` (rail hunts), `.cwr-cbox`
(composer hunts), `.wb-menu` while a composer menu is open, or `.wb-filepick` while the picker is open. Body:
* not found yet: hint = `hunt.hint`; if a file chip is attached: "[send]을 눌러 전송해 주세요."; if the attach picker is open:
  "첨부할 자료를 선택하고 ‘선택’을 눌러주세요." (cloud) / "첨부할 파일을 선택하고 ‘열기’를 눌러주세요." (local) /
  "파일 선택 영역을 눌러 첨부할 문서를 열어 보세요.".
* found: "✓ {hunt.does}" and, if a menu is still open, button "이어서 보기" (closes the menu).

Targets and the UI element that satisfies them (`Yt(target, value?, clip?)`):
| target | element | notes |
|---|---|---|
| `model` | model dropdown in composer → pick an entry | opening the menu alone does nothing; picking sets `st.model` |
| `effort` | effort dropdown → pick a stop | sets `st.effort` |
| `attach` | "+" attach button (and optionally menu → picker → file → send) | see below |
| `new` / `mine` / `auto` / `custom` | rail nav items 새 작업 / 내 작업 / 자동화 / 사용자 지정 | |
| (`mic`) | microphone button — never a valid target, only a wrong answer | |

Wrong element clicked → toast (`.wb-toast.is-warn`, 2600 ms): `hunt.wrong[target] ?? "이번에 찾을 곳은 여기가 아닙니다"`.
Clicking model/effort/attach/rail/mic when there is **no** pending hunt (or already hunted) → neutral toast
"‘{value}’ 으로 바꿨습니다" (model/effort pick) or "체험 화면에서는 이 기능이 동작하지 않습니다".
Correct → `st.hunted = hunt.chip ?? value ?? sd[target] ?? target` (string; truthiness adds `"hunted"` to ids), toast
`.is-good` "미션 완료 — {sd[target] ?? target}을/를 찾았습니다" (Korean particle chosen by `f7` from the last syllable;
`sd = {model:"모델 선택", effort:"노력 수준", attach:"첨부", new:"새 작업", mine:"내 작업", auto:"자동화", custom:"사용자 지정"}`),
and an injected **user bubble** under the current index with `say` (templated; `{effort}` = the picked value) falling back
to `does`, plus the attached file as a clip if any. 700 ms later (and once no menu is open) → `engine.act()`.
`chip` is thus only used as the `hunted` value (never displayed). `tag` is never rendered.

Attach flow details: `_o` = files offered by the hunt = `menu.items.find(i => !i.wrong)` → its `files[]` (`{name, app}`) or
`[{name, app: byExtension(name)}]` if the item name has a 3–4 letter extension. Clicking "+" toggles the attach menu
(`h7`: 작업 컨텍스트 추가 (Ctrl+/) / 이미지 및 파일 업로드 (Ctrl+U) / 클라우드 파일 및 폴더 첨부 (Ctrl+Shift+U) / 사용자 지정).
If `_o` is empty the "+" click itself completes the hunt. Otherwise 업로드 → local picker, 클라우드 → cloud picker (`pk`)
listing `_o`; selecting a row + "선택"/"열기(O)" (or double-click) closes the picker and puts a removable **clip** in the
composer (`g`); pressing send with a clip and no prefilled ask → `Yt("attach", clipName, clipName)` completes the hunt.
`menu.title`, `menu.note`, item `desc`/`wrong` are **not** rendered by the engine (the picker shows name/app/date columns only).
File names in attach menus are excluded from the initial composer clips (§7.5).

### 6.6 `approve` — `what`, `kind`, `line`, `rows[]`, `warn`, `mail{}`, `param[]`, `go`, `allowed`, `denied`
Rendered in the stream (not as a coach tip) when it is the gate, with a coach tip beside it.
* **Cowork permission** `em` (`.wb-perm-box > .wb-perm[role=dialog aria-label=Permission]`): header icon (copy icon, or Outlook
  icon when `mail`), `what`, `kind` pill; `rows` as label/value lines; `mail` → "받는 사람" (bold `to`), "제목", then letter
  body paragraphs (`**bold**`) and `sign`; footer note `line ?? "승인하기 전에 세부 정보를 검토하세요."`; buttons "취소" and
  `go ?? "승인"` (with a send icon when `go` is set) + caret. Under the dialog (`.wb-perm-after`): in the workbench always
  "⊙ 아래에 메시지를 보내면 편집 내용이 삭제되고 위의 작업이 취소됩니다."; on the chat surface `"⚠ " + warn` if `warn`.
  Coach tip on `.wb-perm`: `mail` → "Copilot Cowork은 메일 초안까지만 작성합니다.\n내용을 확인하고 이상이 없다면 승인을 눌러주세요.";
  else "실행하기 전에 사람에게 한 번 확인합니다.\n확인하고 이상이 없다면 승인을 눌러주세요.".
* **Recurring task** `n7` when `kind` matches `/^(schedule|automation)/` (`.wb-task` dialog "되풀이 작업을 만드시겠습니까?"):
  rows are looked up by label — "이름" (fallback first row / `what`), "반복" (split into period and time, e.g. "주간" + "오전 9:00",
  shown as two dropdown chips), "다음에서 실행" (default "새 대화"), "설명" (memo, default "메시지 입력..."), "지금 한 번 실행"
  (checkbox checked unless the value contains no "체크" — i.e. checked for "체크됨", unchecked for "아니요"); any other rows
  are listed plainly. Buttons "취소" / "예약". Below: `warn` (or note). Coach tip on `.wb-task`:
  "실행 주기와 시점은 사람에게 먼저 확인합니다.\n일정을 확인하고 이상이 없다면 예약을 눌러주세요.".
* **Approve** → `st.allowed = true` and the approve index is recorded; 600 ms later `engine.act()`. (Chat surface: `act()` immediately.)
* **Deny** ("취소") → the dialog is replaced by the denied card (`.wb-perm.is-denied` / `.wb-task.is-denied`): title `what`
  ("되풀이 작업 만들기" for tasks) and text `denied ?? "거절하셨습니다. 여기서 멈춥니다."` (task default: "자동 실행을 예약하지
  않았습니다. 필요할 때 직접 실행할 수 있습니다.") with a single button "다시 보기" that restores the dialog.
  **The scenario does not end or branch on deny**; playback simply stays gated until approved (the header's 건너뛰기/이전으로
  remain available). `allowed` (text) is declared in all approve messages but **never rendered**. `param` is only used by the
  Scout dialog.
* **Scout permission** `rk` (`.sct-permission`): "Running tools..." / "Running {what}" progress, header with gear "Tool parameters"
  toggling a `<pre>` of `param` lines + `rows` as `label: value`, optional `mail` (To/Subject/body/sign), `line`, `warn`;
  buttons "Allow for this session" (default) with a scope menu ("Allow once" / "Allow for this session") and "Deny". Allow →
  `act()`; if scope is session the tool name is remembered and later approves of the same `what` auto-approve (`act()`
  immediately) and render as a `q5` tool card with status "Allowed". Deny → denied text (`denied ?? "Denied"`) + "Try again".

### 6.7 `assistant.files` / `assistant.images` / `assistant.sources`
* `files: [artifactId]` (workbench) → file cards slotted under that assistant message (§6.4).
* `images: [{src, alt}]` → `nm` gallery `.sc-image-gallery` (`--image-columns: min(4, n)`) of thumbnails (`title/aria-label =
  "{alt} 확대"`, caption = alt + zoom icon). Clicking opens a `<dialog class="sc-image-dialog">` ("생성된 이미지", close
  "확대 보기 닫기") with the slide viewer `tm` (prev/next "이전 이미지"/"다음 이미지", counter "n / total", ←/→ keys). `src`
  is resolved with `B()` (prefixes "/").
* `sources: [{id, label, kind: pdf|page|doc, detail, url?, blocks: [paragraphIndex…]}]` → `s7` cited answer: after each
  paragraph index listed in a source's `blocks`, a `.sc-citation` button (source-kind icon; "외 {n-1}개" when several sources
  cite the same paragraph; `aria-label="출처 확인: {labels}"`) opens the sources dialog filtered to those sources. Below the
  body a "Sources" section lists every source as a `.sc-source-link` (label + icon). The actions row adds a
  `.sc-reference-trigger` (stacked icons + "참조", `aria-label="참조 {n}개"`) that opens the dialog with all sources.
  Dialog `.sc-source-dialog` header "참조" (close "참조 닫기"); each item: icon + label, `detail`, and `url` → link "원문 열기"
  else `<p class="sc-source-unavailable">원문 링크 미제공</p>`. Esc closes.

### 6.8 `spot` — `text`, `options[{at, label}]`, `answer`, `does`, `plain`
Chat surface only (shipped). `Ev` renders a coach tip (kind `quiz` → "Quiz" header) with `q = spot.text` and `e7` options
(`.wb-opts`, numbered, label only). Unless `plain`, every option's `at` zone gets the `is-asked` outline (glow ring; the option
numbers are computed but **not** displayed). A wrong pick flashes `is-wrong` on that option and shows the hint "다시 찾아 보세요."
(re-triggerable). The right pick: option gets `is-right`, options disable, the answer's zone is **lit** (`is-lit`), the veil dims
everything except that zone (`zone: .zone-{at}`), "✓ {does}" is appended, and after `hs = 2600 ms` the zone un-lights and
`engine.act()`. `plain: true` only suppresses the `is-asked` zone marks beforehand.
Scout special case: if the correct option's `at` is `"rail"` the tip is anchored to the Automations nav
(`.sct-app [data-scout-nav='automations']`) and the user must click that nav item; it lights for 2600 ms then `act()`.

### 6.9 `cue` — `text`, `action`
See §5 table. Tip zone: `.zone-composer` (chat shells) or `.cwr-cbox` (workbench). The composer placeholder/prefill:
chat "Copilot에 메시지 보내기", cowork "Copilot Cowork에 메시지 보내기", scout "Describe what you want to do", office pane
`sm[surface].input`, teams "Copilot에 메시지 보내기"; when `ask` the text is `re(ask, vars)` and `is-filled`, and the send
button gets `.is-hunt` (pulsing) and becomes clickable → `act()`.

---

## 7. Surfaces

### 7.1 Zones `T8` and the `mark()` helper
```
chat:       ["rail","top","stream","actions","composer"]
cowork:     ["rail","stream","composer"]
scout:      ["rail","stream","composer"]
word/excel/powerpoint: ["ribbon","canvas","pane","composer"]
teams:      ["rail","top","stream","composer"]
sharepoint: ["rail","top","canvas","pane","composer"]
```
`Mv` gives each shell a `mark(zone)` → class string `zone-{zone} [is-asked] [is-lit]` applied to elements that also carry
`.sc-zone`. Spot options must reference zones of the scenario's surface (validated). The `actions` zone is the per-answer
actions row (so every `.sc-answer-acts` lights).

### 7.2 Chat surface (non-workbench demo; `Mv` → `Q5 mode="chat"`)
Shell `.cp-app[data-mode=chat]`: title bar `ak` (wordmark "Copilot", three icon placeholders, window controls); rail
(`aside.side.sc-zone zone-rail`): tabs `K5` "채팅" (active) / "Cowork"; nav `dv` 새 채팅 (active) / 검색 / 라이브러리 /
에이전트 및 기술 / 전자 필기장; history list `X5` label "채팅" with one item = scenario title. Main `av`: top bar
(`.main-top.sc-zone zone-top`): "Work IQ" dot label and a model dropdown button showing `scenario.model` (click does nothing);
stream `.conv.sc-zone zone-stream`; dock with "맨 아래로" scroll button (shown when not at bottom) and composer `cv`
(`.composer.sc-zone zone-composer`: + button, placeholder/prefill, mic, send; foot note "AI 생성 콘텐츠는 정확하지 않을 수 있습니다.").
Stream content: `<p class="sc-date">{startedAt}</p>` then messages (§5), approve dialog, busy shimmer.
**Hold behaviour**: after each assistant message is revealed the engine pauses and a tip anchored to that message
(`.cwr-hold`) says "{Copilot Chat|Copilot Cowork}의 답변입니다.\n내용을 확인한 뒤 이어서 진행해 주세요." with "이어서 보기".
Finish: when the engine is done a non-dimming tip "모든 작업이 완료되었습니다." + "결과물 보기" → done phase.
Scroll: the stream auto-scrolls to the bottom on every change; on hold it scrolls the held message into view (`Z5`, 12 px margin).

### 7.3 Cowork workbench surface (`m7`, `Q5 mode="cowork"`)
Rail: tabs "채팅" / "Cowork" (active); nav `vk` 새 작업 (active) / 내 작업 / 자동화 / 사용자 지정 (click → hunt attempt `fm`);
history label "작업" with one item = `workbench.task`.
Main `gk`: top bar with shield (title "보호됨"), more icon, and — when the panel is closed — a "작업 영역" toggle; stream
`.cwr-stream`; footer with "맨 아래로" + composer `yk`; toast `.wb-toast` (`data-coach="over"`).
**Side panel** (`Fe`, open by default when `(min-width: 701px)`): when no artifact is open → `wk` "작업 영역" with sections
`J0`: "단계" (count "done/total") listing every tool message as a step (`kk`: done ✓ / active spinner "진행 중" / pending ○
"보류 중") and "출력" (count) listing opened made artifacts (click → open). When an artifact is open → `.cwr-panel.is-doc`
(`.is-reviewing` during review/done; resizable 30–70 %, default 110/2.1 ≈ 52.4 %, double-click resets, ←/→/Home/End keys,
`aria-label="결과물 패널 너비"`): header icon + name + close "닫기", body = artifact renderer (§9); mail artifacts use the
Outlook reading pane `jk` (subject bar, thumbs, "Outlook에서 열기", body, "Sent by Copilot Cowork").
**Composer** (`hm`): placeholder "Copilot Cowork에 메시지 보내기" or prefilled `ask`; clips (initial read files at `shown===0`, or
the attached hunt file with a remove button "붙인 파일 빼기"); buttons: "+" (aria 첨부), model dropdown (`st.model ?? scenario.model`),
effort dropdown (`st.effort ?? scenario.effort ?? "보통"`), spacer, mic (aria 음성), send `.cw-send` (aria 보내기; `.is-hunt`
when prefilled or a clip is attached; disabled during review or when nothing to send). Foot note "AI 생성 콘텐츠는 정확하지
않을 수 있습니다.". Menus (`pm`, positioned under the opening button, `data-coach="lit"` so they stay un-dimmed):
* model menu `.wb-menu.is-model`: `F8` entries (✓ on current; divider after the first): 자동 "작업에 가장 적합한 모델"; GPT 5.5
  "중간 수준 추론에 적합한 모델"; Opus 5 "복잡하고 중요한 작업에 적합"; Sonnet 5 "일상 작업에 효율적"; Fable 5.1 "야심 찬
  프로젝트를 위한 가장 뛰어난 모델".
* effort menu `.wb-menu.is-effort`: header "노력 {current}", ends "빠르게" / "더 스마트하게", a 4-stop slider (`L8`: 낮음 "짧고
  빠르게 답합니다", 보통 "일반적인 업무에 적당합니다", 높음 "조건이 여러 개일 때 사용합니다", 매우 높음 "가장 꼼꼼하게 비교합니다";
  `--at`, `--last`), note "더 많은 **노력**을 기울이면 더 철저해지지만, 속도는 더 느려지고 크레딧도 더 많이 소모됩니다.".
* attach menu `.wb-menu.is-attach`: `h7` rows with icon, name, desc, `<kbd>` shortcut (§6.5).
Model/effort pickers exist **only** in the workbench; the chat shell shows the model name read-only in its top bar; office
panes show it as a chip; Scout shows a "Claude Opus 4.8" default chip.
Stream content per revealed message: `Gn` (templated), `card` → `g7`, artifact slots (`.cwr-slots`, hidden while that index is
held), injected user bubble (`h[i].say` + clip), injected reply (`h[i].reply`); then approve dialog (hidden during review/hold),
busy shimmer (hidden during review). The last assistant message is wrapped in `.cwr-hold` while held or while a choice is pending.
Scroll: scroll `.cwr-fcard.is-cue` to center if present and not done; otherwise to bottom; on hold scroll the held message
into view. Focus moves to the panel when it opens, back to the opener when it closes; Esc is not handled.
Done: non-dimming tip "모든 작업이 완료되었습니다." + hint "위로 올리면 처음부터 다시 볼 수 있습니다." (+ " 생성된 결과물은 대화창의
파일 카드를 눌러 다시 확인할 수 있습니다." when unopened made cards remain) + "결과 보기" → close panel → done phase.
Rewind: when `engine.shown` decreases, menus close, hold clears; at `shown === 0` review bookkeeping resets.

### 7.4 Coach overlay mechanics (`Qe`)
A tip layer `J5 .wb-tip-layer` sits over the surface. `Qe({zone, dim=true})`: finds elements matching `zone` (selector or list)
inside the surface, computes "holes" (their rects, padded 6 px, clipped to scroll parents) plus extra holes for
`[data-coach="lit"]` and `.is-hunt` elements, and renders a `.wb-tip-veil` with `clip-path: path(evenodd, …)` cutting those
holes (only when `dim` and there is a hole or no zone). The tip card `.wb-tip.is-{top|bottom|left|right|none}` is placed on
the side with the least overlap (right/left preferred when the hole is narrower than 55 % of the surface; min 240 px width),
with a tail (`--tail`) pointing at the hole; it falls back to corners, then bottom-center (88 px up). The first zone element
is scrolled into view (`block: start` if taller than its scroller else `center`). Wheel events on the veil are blocked.
When undimmed and unanchored, the tip height + 16 px is published as `--wb-tip-clear` so streams add bottom padding.
`Pe` card: tail, optional kind line (`choice` → "선택한 기준에 따라 결과물이 달라집니다", `quiz` → "Quiz"), question `q`, children.

### 7.5 Initial composer clips (workbench)
`$` = read-origin artifacts (`origin:"read"`) whose `share === "link"` **or** whose name ends in a 3–4 char extension,
excluding names that appear in any hunt `menu.items`. Rendered in the composer at `shown === 0` (`.cwr-clips`: link → bare
`.cwr-link` text; file → `.cwr-clip` icon + name) and attached to the first user message as `.sc-user-clip`/`.sc-user-link`.

### 7.6 Scout shell (`uv`/`hv`/`fv`; engine support only)
Title bar "Microsoft Scout", "Send Feedback", window controls; rail nav New chat / Activity / Automations / Co-create /
Extensions (`data-scout-nav`), "Chats" with the scenario title, "Clear all chats", account "POSTECH" "● Connected"; composer
"Describe what you want to do", model chip "Claude Opus 4.8". Scout answers (`o7`) show a date (parsed from `startedAt`
"YYYY년 M월 D일" → en-GB "7 Sep", else `at`), copy ("답변 복사" → "복사됨" / error text) and save ("답변 저장" → downloads
`scout-response.txt`) buttons.

### 7.7 Office / SharePoint / Teams shells (`wv`, `vv`, `jv`; engine support only, used via `surface`)
Word/Excel/PowerPoint: window title "자동 저장 ● {doc.name ?? title} · Word|Excel|PowerPoint", "⌕ 검색"; ribbon tabs `mv` and groups `gv`
(zone ribbon); canvas (zone canvas) renders `scenario.doc` via `ic`; Copilot pane (zone pane) with `sm[surface]` head/sub,
"편집 허용 ⌄", model chip; pane composer (zone composer) `sm[surface].input`; status bar ("슬라이드 1/{n}" | "준비" | "1/5 페이지",
"한국어", "─ ───●─── ＋ 77%"). SharePoint: top bar, rail labels, site card "비공개 그룹 · Confidential · 구성원 38명", pane head
"POSTECH 구성원님 안녕하세요!" / "질문하거나 다음 프롬프트 중 하나로 시작해 보세요." / input "질문하거나 /를 입력하여 파일 또는 사람을
추가합니다". Teams: title bar search "검색하거나 Copilot에게 질문하기(Ctrl+E)", left app strip + chat list (agents 리서치 도구 /
분석가 / Surveys / Planner Agent / 새 에이전트, chats …), top scope + model, stream, tall composer "Copilot에 메시지 보내기",
chips 추천 항목 / 파일 인사이트 / 받은 편지함 분류 / 사용자 검색.

---

## 8. Done screen `[N7]` (`.sc-done.sc-stage-sky[.is-split][.has-deck-report]`)
`completed = engine.done`.
* Result viewer (left, `j7`) when there are made artifacts: workbench → artifacts the user **opened** (`st.opened`, in order)
  filtered to `origin:"made"`; if none were opened, **all** made artifacts. One artifact → `w7` doc window with icon, name
  (`on()`), badge "{Copilot Chat|Copilot Cowork} 생성"; several → `y7` tabs. Body = `ic` renderer (fully written; deck slide
  nav; `progressive` if any tool had `translate`). `artifact.note` shown as `.doc-live` status text.
* Else if `scenario.artifact` (chat scenarios) → `ld` bare: `kind` `html` (sandboxed iframe with injected fonts) | `pdf` |
  `image` | `slides` (slide viewer `tm`) | `file`/`link` ("파일 열기"/"링크 열기"); `note` shown only in non-bare mode.
* Else if `outs` non-empty → `.sc-done-doc.is-talk` "생성된 결과물" list (app icon + name).
* Side: head — completed: product name (`k7`) + "과 함께" (chat) / "와 함께" (cowork/scout), `<p>` = `finish.sub ?? hook ?? summary`;
  not completed: Copilot lockup + "체험 미완료", `<p>` "체험을 끝까지 진행하지 않았습니다.". Grid: "생성된 결과물" outs list (only
  when outs exist, no made viewer and not already shown left); "검수 리포트" (`ld artifact`) for the deck-report combination;
  recap list (`recap[] = {icon, name, desc}`; `om(icon)`; `desc` templated) — only when completed. QR button `S7`
  "Copilot Garage QR 확인" → dialog with the Copilot Garage QR image (only when completed and the image loads).
* `outs = finish.outsBy[firstMatchingId] ?? finish.outs ?? []` (`b7`); entries `{app, name, note}` — `note` is **not** rendered.
  Outs are therefore a *summary list* independent of the live artifacts; when made artifacts exist the viewer replaces the list.

---

## 9. Artifact renderers (`ic`) and document blocks (`Ds`)
Artifact object (workbench `artifacts[id]`, also `scenario.doc`): `{app, kind: sheet|deck|teams|mail|doc, origin: read|made,
share?: "link", name, nameBy?{id: name}, where, note, sheet?, deck?, teams?, blocks?}`. `name` is chosen by `on(a, ids)`
(first `nameBy` key present in ids, else `name`).
* **sheet** (`Ck`): `{head[], tabs[], tabsAdd?{id: tabName}, pages?{tabName: {head, rows, num}}, headAdd?{id: [col…]}, num?[colIdx…],
  rows[{cells[], only?, not?, tone?, add?{id: [cell…]}}]}`. Column letters A… and row numbers; header row; `tone` → `is-{tone}`
  class (e.g. total/warn); `num` columns right-aligned; `headAdd/add` append extra columns for a chosen id; tabs: first tab and
  tabs with `pages` are clickable, others inert; while writing the first tab is forced and a formula bar shows.
* **deck** (`Ak`): `{total?, src?, slides[{n, head, sub?, body?[], table?{head,rows}, by?{id: {head?,sub?,body?}}, over?}], rest?[]}`.
  Thumbnail rail (numbers + heads; `is-done`, `is-over`), stage with accent, head, sub, table, bullets, "n / total". `src` decks
  (sources) never show variants.
* **teams** (`Ek`): `{channel, team, author, at, title, body[], foot?, reactions?[]}` → channel header, message with "초안 · 전송 전",
  composer "메시지를 입력하세요" / "전송".
* **mail** (`zk`): `blocks` with `field` (보낸 사람/받는 사람/참조…), `subject`, body blocks. Toolbar: read → 답장 / 모두 답장 / 전달;
  made → 보내기; subject row with "제목 추가" placeholder and status "보냄" (if `where` contains "보낸") or "초안 저장됨".
* **doc** (`_k`): `.wb-wd-page` of blocks.
* Block kinds (`Ds`): `field{label,value}`, `subject{text}`, `para{text}`, `badge{text}` (🕑 prefix), `sign{lines[]}`,
  `list{title?, items[], ordered?}`, `head{text, meta?[]}`, `section{title, text?, items?, stats?[{label,value,warn?}], table?{head,rows}, note?}`,
  `clause{no, title, src?, text?, textBy?{id: text}, tpl?, note?}` (`src` "미합의" → warn style, "표준" → plain, other → source style;
  without resolved text the template `tpl` renders with blanks and "[협의 필요] 합의 전이라 채우지 않았습니다."), `qa{q, a}`, `note{text}`.
  All strings pass through `re()` and `**bold**`. Blocks support `only`/`not`.

---

## 10. Hidden / debug features, storage, constants
* **No** URL query parameters, **no** `localStorage`/`sessionStorage`/IndexedDB, **no** keyboard shortcuts for skip/autoplay/reset
  (the only global key handler is Tab → `data-kbd`). Dialog Esc handling and arrow keys exist only inside components
  (image viewer ←/→, panel resizer ←/→/Home/End, Scout scope menu Esc, `<dialog>` Esc).
* Console diagnostics only: `[scenarios] …` errors/warnings/info during load.
* `engine.setSpeed` / `skip` / `toggle` are implemented but not wired to any UI. Workbench state `st.agent` and `st.allowed` are
  written but never read (`st.tab` marks the currently open artifact's card `.is-on`; `opened`, `writing/rows`, `moved/moving/slide`,
  `over`, `picks`, `hunted`, `model`, `effort` drive rendering).
* Timing constants: idle 300 000; after-back floor 1 500; assistant `min(6000, 900+42·len)`; user 700; tool 900; note 400; card 1 200;
  scene point interval 1 220 (= 900 + 320); choice→act 1 100; write row 320; translate slide 260; workbench approve→act 600;
  hunt→act 700; spot/zone hold 2 600; toast 2 600; rewind toast 1 600; quiz pass 1 800; pick type→search 850; pick→done 460;
  Scout choice reply 1 200 then `max(2600, H5(reply))`.
* Media queries: app usable `(min-width: 768px) and (min-height: 600px)`; panel default open `(min-width: 701px)`; narrow
  (auto-close panel) `(max-width: 700px)`; `prefers-reduced-motion` skips the pick typing phase and view transitions.
* Assets: all paths pass through `B(p) = "/" + p.replace(/^\//,"")`. Logos under `/logo/copilot/*`, `/logo/m365/{excel,outlook,
  powerpoint,teams,word}.svg`, `/logo/scout/*`; hero `/brand/hero/copilot-hero-{light-16x9,light-9x16}.png` and
  `copilot-hero-motion-light-{16x9,9x16}.mp4`; signature `/brand/signiture/copilot-signature.png`; QR
  `/industry-summit/copilot-garage-qr.png` ("Copilot Garage"); intro fallbacks `/intro/{track}/{id}.png`; fonts `/font/*`.

---

## 11. UI string catalogue (verbatim)
**Attract / limited**: "체험해보기" · "더 큰 화면에서" / "접속해 주세요" · "PC나 태블릿에서 체험해 주세요." / "창을 작게 열었다면 크기를 늘려 주세요." ·
"과" "함께라면, " "대학의 연구·교육·행정은 어떻게 달라질까요?"
**Home**: "함께라면," · "캠퍼스 영역을 선택해 보세요." · "Copilot이 연구·교육·학습·행정을 어떻게 바꾸는지 POSTECH 맞춤 시나리오로 체험해 보세요." ·
"© Microsoft 2026" · "POSTECH AI Experience"
**List**: "캠퍼스 영역" · "제품별 시나리오 보기" / "하나씩 둘러보기" · "체험 탐색" · "이전 시나리오" · "다음 시나리오" · "{n}번째 · {title}" · "AS-IS" · "TO-BE" ·
"체험해보기" · "다음 행사에서 공개합니다" · "곧 공개" · "아직 준비된 시나리오가 없습니다." · "제품별 체험" · "Copilot Chat" · "Copilot Cowork" · "Microsoft Scout"
**Play header**: "{track} 목록으로 돌아가기" · "처음으로" · "이전으로" · "건너뛰기" · "홈으로" · "진행 단계" · "상황" "흐름" "체험" "확인" "결과" ·
"{단계} 단계로 돌아가기" · "한 걸음 되돌렸습니다" · "시나리오를 찾을 수 없습니다." · "목록으로"
**Scene / overview / quiz**: "Work lighter" · "Copilot과 해보기" · "다음으로" · "화면을 눌러 다음으로" · "함께라면?" · "칸을 눌러 하나씩 열어보세요" ·
"다음 칸을 눌러 보세요 ({s} / {n})" · "Ready?" · "지금 시작하기" · "확인 문제 {i} / {n}" · "다시 골라 보세요." · "시나리오 패스" · "{n}문제 모두 맞히셨습니다" · "결과물을 보여 드립니다…"
**Done**: "생성된 결과물" · "{agent} 생성" · "과 함께" / "와 함께" · "체험 미완료" · "체험을 끝까지 진행하지 않았습니다." · "검수 리포트" · "Copilot Garage QR 확인" ·
"{label} QR 코드" · "결과물" · "파일 열기" · "링크 열기"
**Coach**: "선택한 기준에 따라 결과물이 달라집니다" · "Quiz" · "이어서 보기" · "결과물 보기" · "결과 보기" · "다음 결과물" · "다음 단계" ·
"{agent}의 답변입니다.\n내용을 확인한 뒤 이어서 진행해 주세요." · "선택하신 기준으로 Copilot Cowork이 다시 정리한 내용입니다.\n내용을 확인한 뒤 이어서 진행해 주세요." ·
"실행하기 전에 사람에게 한 번 확인합니다.\n확인하고 이상이 없다면 승인을 눌러주세요." · "실행 주기와 시점은 사람에게 먼저 확인합니다.\n일정을 확인하고 이상이 없다면 예약을 눌러주세요." ·
"Copilot Cowork은 메일 초안까지만 작성합니다.\n내용을 확인하고 이상이 없다면 승인을 눌러주세요." · "Microsoft Scout가 작업 방향을 확인하고 있습니다. 원하는 항목을 골라 주세요." ·
"검색 목록이 열렸어요. 참고할 자료를 골라 붙여 볼까요?" · "검색 목록에서 {name} 를 눌러 붙여 보세요." · "을 눌러 보내 보세요." · "을 눌러 전송해 주세요." ·
"첨부할 자료를 선택하고 ‘선택’을 눌러주세요." · "첨부할 파일을 선택하고 ‘열기’를 눌러주세요." · "파일 선택 영역을 눌러 첨부할 문서를 열어 보세요." ·
"결과물 내용을 확인해 보세요." · "결과물을 확인했습니다. 다음 작업을 이어갈까요?" · "결과물이 완성되었습니다. 생성된 문서를 하나씩 열어 확인해 보세요." ·
"대화창의 파일 카드를 눌러 열어 보세요." · "모든 작업이 완료되었습니다." · "위로 올리면 처음부터 다시 볼 수 있습니다." · " 생성된 결과물은 대화창의 파일 카드를 눌러 다시 확인할 수 있습니다." ·
"다시 찾아 보세요." · "✓ {does}"
**Toasts**: "‘{v}’ 으로 바꿨습니다" · "체험 화면에서는 이 기능이 동작하지 않습니다" · "이번에 찾을 곳은 여기가 아닙니다" · "미션 완료 — {name}을/를 찾았습니다" ·
hunt labels "모델 선택" "노력 수준" "첨부" "새 작업" "내 작업" "자동화" "사용자 지정"
**Permission / task**: "Permission" · "받는 사람" · "제목" · "승인하기 전에 세부 정보를 검토하세요." · "취소" · "승인" · "거절하셨습니다. 여기서 멈춥니다." · "다시 보기" ·
"⊙ 아래에 메시지를 보내면 편집 내용이 삭제되고 위의 작업이 취소됩니다." · "되풀이 작업을 만드시겠습니까?" · "되풀이 작업 만들기" · "이름:" "반복:" "다음에서 실행:" "새 대화" "설명" "메시지 입력..." ·
"지금 한 번 실행" · "예약" · "자동 실행을 예약하지 않았습니다. 필요할 때 직접 실행할 수 있습니다."
**Scout**: "Running tools..." · "Running {x}" · "Tool parameters" · "Allow for this session" · "Allow once" · "Approval options" · "Deny" · "Denied" · "Try again" ·
"Completed" · "Allowed" · "Output" · "Used 1 tool" · "Thought" / "Thought for {n}s" · "Recommended" · "답변 복사" "복사됨" "복사하지 못했습니다. 다시 시도해 주세요." "답변 저장" "답변 도구" ·
"Send Feedback" · "● Connected" · "Chats" · "Clear all chats" · "New chat" "Activity" "Automations" "Co-create" "Extensions" · "Describe what you want to do"
**Chat shell**: "채팅" · "Cowork" · "새 채팅" "검색" "라이브러리" "에이전트 및 기술" "전자 필기장" · "Work IQ" · "Copilot에 메시지 보내기" ·
"AI 생성 콘텐츠는 정확하지 않을 수 있습니다." · "맨 아래로" · "보내기" · slash tabs "전체" "파일" "이메일" "채팅" "사이트" · "Sources" · "참조" · "출처 확인: {…}" ·
"외 {n}개" · "참조 {n}개" · "원문 열기" · "원문 링크 미제공" · "참조 닫기" · "닫기" · "{alt} 확대" · "생성된 이미지" · "확대 보기 닫기" · "이전 이미지" "다음 이미지" · "이미지 확대 보기" ·
tool categories "검색" "읽기" "분석" "생성" "연결" "변환" "실행" "확인" · shimmer "작업 중…"
**Cowork shell**: "새 작업" "내 작업" "자동화" "사용자 지정" · "작업" · "보호됨" · "작업 영역" · "단계" · "출력" · "진행 중" "보류 중" · "결과물 패널 너비" ·
"Copilot Cowork에 메시지 보내기" · "첨부" "음성" "보내기" · "붙인 파일 빼기" · "Excel 스프레드시트" "Word 문서" "PowerPoint 프레젠테이션" "OneNote 전자 필기장" "Teams 메시지" ·
"보낸 편지함에 저장됨" "임시보관함에 저장됨" · "“{name}” 검색 중" · "파일" · "Copilot Cowork 작성" · "근거" · "Outlook에서 열기" · "Sent by Copilot Cowork" ·
effort menu "노력 {x}" "빠르게" "더 스마트하게" "더 많은 노력을 기울이면 더 철저해지지만, 속도는 더 느려지고 크레딧도 더 많이 소모됩니다." ·
attach menu "작업 컨텍스트 추가" "파일, 사람, 모임" "Ctrl+/" · "이미지 및 파일 업로드" "PDF, Word, Excel, 이미지" "Ctrl+U" · "클라우드 파일 및 폴더 첨부" "OneDrive, SharePoint, Teams" "Ctrl+Shift+U" · "사용자 지정" "기술 및 플러그인 관리"
**File picker**: cloud "항목 선택" · places "홈" "내 파일" "공유됨" "즐겨찾기" · "다음을 기준으로 검색" · "사람" "모임" "미디어" · "빠른 액세스" · "내 파일에서 검색" · columns "이름" "수정된 날짜" "수정한 사람" · "선택" "취소";
local "열기" · crumb "문서 ›" · "문서 검색" · places "홈" "갤러리" "바탕 화면" "다운로드" "문서" "사진" "음악" "동영상" · columns "이름" "수정한 날짜" "유형" · "파일 이름(N):" · "모든 파일" · "열기(O)" "취소" ·
type labels "Microsoft Word 문서" "Microsoft Excel 워크시트" "Microsoft PowerPoint 프레젠테이션" "Microsoft OneNote 구역" "Outlook 항목" "파일"
**Artifacts**: sheet "fx" · mail "답장" "모두 답장" "전달" "보내기" "제목 추가" "보냄" "초안 저장됨" · teams "초안 · 전송 전" "메시지를 입력하세요" "전송" · deck "⚠ 글상자를 넘침 · 확인 필요" ·
clause "[협의 필요] 합의 전이라 채우지 않았습니다." · badge prefix "🕑 "
**Office shells**: "자동 저장 ●" · "⌕ 검색" · Word tabs 파일 홈 삽입 그리기 디자인 레이아웃 참조 편지 검토 보기 · Excel 파일 홈 삽입 페이지 레이아웃 수식 데이터 검토 보기 자동화 ·
PowerPoint 파일 홈 삽입 그리기 디자인 전환 애니메이션 슬라이드 쇼 검토 보기 · pane heads "문서를 편집해 보겠습니다." / "무엇을 하고 싶은지 알려주시면, 바로 문서 편집을 시작할 수 있습니다." / "Copilot으로 편집" ·
"통합 문서 편집" · "프레젠테이션을 편집해 보겠습니다." / "만들거나 편집할 항목 설명" · "편집 허용 ⌄" · "슬라이드 1/{n}" "준비" "1/5 페이지" "한국어" "─ ───●─── ＋ 77%" ·
SharePoint "⌕ 이 사이트 검색" "▦ Microsoft" "⌕ 검색" "✎ 게시" "▤ 빌드" "☁ OneDrive" "비공개 그룹 · Confidential · 구성원 38명" "POSTECH 구성원님 안녕하세요!" "질문하거나 다음 프롬프트 중 하나로 시작해 보세요." "질문하거나 /를 입력하여 파일 또는 사람을 추가합니다" ·
Teams "검색하거나 Copilot에게 질문하기(Ctrl+E)" "새 채팅" "에이전트" "리서치 도구" "분석가" "Surveys" "Planner Agent" "새 에이전트" "⋯ 에이전트 더 보기" "채팅" "Copilot에 메시지 보내기" "추천 항목" "파일 인사이트" "받은 편지함 분류" "사용자 검색"

---

## 12. Scenario schema as consumed (summary of which keys the engine reads)
Top level: `id, track, order, agent (chat|cowork|scout), surface?, apps?[] (orbit icon stack), model, effort?, title, summary,
before (AS-IS; pain caption fallback), hook (TO-BE; overview hook; done sub fallback), startedAt (chat stream date; Scout date),
scene{eyebrow✗, art, artSlots, headline, sub✗, points[{icon, scene, say}]}, overview[{icon✗, title, desc}], workbench{task, ask✗, artifacts{}},
messages[], recap[{icon, name, desc}], quiz[] (✗ unreachable), finish{sub, outs[{app,name,note✗}], outsBy{id: outs}}, artifact{kind,title,slides|src|html,note},
doc? (office/non-workbench canvas), anonymized✗, _note✗`. (✗ = present in data but not read by the UI.)
Note `workbench.ask` is **not** used: the composer prefill comes from the `user` message that follows a `cue` (`engine.ask`).
Messages: see §5–§6. Unused message keys: `user.at`, `assistant.at` (non-Scout), `choice.tag`, `hunt.tag`, `hunt.menu.title/note`,
`menu.items[].desc/wrong`, `approve.allowed`, option `say`.
