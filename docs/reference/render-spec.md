> 참고 문서: 원본 부스 화면(Copilot Scenario Player)의 번들을 분석해 정리한 렌더링 명세입니다.
> 줄 번호와 짧은 이름은 원본 번들 기준이라 이 저장소에는 없습니다. 클래스 이름·DOM 구조만 참고하세요.
> Office(Word/Excel/PowerPoint) 화면은 §3.5, SharePoint §3.6, Teams §3.7, 에이전트형 앱(Scout) 화면은 §3.4·§4.6·§4.7·§4.11 을 보세요.

# Copilot Scenario Player — Rendering Spec (reverse-engineered)

Source: `index.pretty.js` (Vite/React bundle, mangled identifiers) + `index.pretty.css` (12.9k lines) + `scenarios/*.json` (15 scenarios).
Goal: re-implement every component so the original CSS can be reused **verbatim**. All classNames, data-attributes, element types and nesting below are exact as emitted by the bundle. Korean UI strings are reproduced exactly.

Notation: `el.class1.class2[attr=v] > child` describes DOM. `{cond && ...}` = conditional. Mangled names (e.g. `Ck`) are given so you can look the code up in `index.pretty.js`; line numbers refer to that file.

---

## 0. Bundle map, app root, routing, scaling

| Role | Mangled | Lines |
|---|---|---|
| Fluent icon factory (`z(name, size, paths)`) / icon list | `z`, `Uy`..`Qw` | 9223–9350 |
| Brand paths, product colours, tracks, router, attract screen, config | `ao`,`vf`,`Zw`,`e8`,`I0`,`U0`,`T8`,`F8`,`L8`,`Ie`,`B8` | 9351–9762 |
| Scenario data (`K0 = Object.assign({ "./research/…scenario.json": {default:…}})`) | `K0` | 9764–18200 |
| Validation / loading | `V8`,`U8`,`nc`,`W8`,`q8` | 18206–18316 |
| Home screen | `G8` | 18330 |
| Scenario list (orbit) | `ek` | 18451 |
| Playback engine | `H5`,`nk` | 18764–18847 |
| Text helpers (`re` vars, `sk` block parser, `ke` bold, `Cl` rich text) | | 18912–19013 |
| Scout stream pieces (`Z0` choice, `W5` thought, `q5` tool, `rk` permission) | | 19021–19296 |
| Icon maps `we`, `X`; `Q5` cp-app shell; `ak` titlebar; `K5` tabs; `G5` nav; `X5` history | | 19298–19565 |
| `Me` app icon; file picker `pk`; scroll helpers; `mk` desk; `gk` cowork view; `yk` cowork composer; `wk` panel; `J0`,`kk` steps | | 19566–20162 |
| Doc block renderer `Ds`; cowork mail window `jk`; `Ki` working row; sheet `Ck`; mail `zk`; deck `Ak`; teams `Ek`; doc `_k`; dispatcher `ic` | | 20197–20879 |
| Coach-tip geometry + `Qe` tip, `Pe` bubble, `Jk` options, `e7` spot quiz, `em` permission card, `n7` schedule card | | 20881–21687 |
| Scout answer tools `o7`; `tm` slides; `nm` image gallery; `ld` booth-artifact; `s7` sourced answer; `Gn` message renderer | | 21689–22150 |
| Cowork surface `m7` (huge) | | 22231–23172 |
| `g7` card; `y7` doc tabs; `w7` doc window; `k7` product name; `v7` icon SVG map; `om`; `j7` done doc; `S7` QR; `N7` done screen; `M7` pain fallback | | 23174–23672 |
| Legacy track art `C7`; scene art templates `E7`…`Y7`,`rd`; map `Z7`; scene `tv`; overview `nv`; quiz `lv` | | 23673–24943 |
| Chat chrome `av`,`cv`,`rv`; Scout chrome `uv`,`fv`,`hv`; Office `wv`; SharePoint `vv`; Teams `jv`; dispatcher `Mv` | | 24945–26087 |
| `Av` approve wrapper, `Ev` spot tip, play screen `_v`, root `Pv`, zoom `am` | | 26093–26668 |

### 0.1 Root
```
FluentProvider(theme = createLightTheme(brandRamp Kw) + {fontFamilyBase: "var(--booth-font)"}, className="booth-root")
  ├ <main.booth-attract.is-limited>  when viewport fails "(min-width: 768px) and (min-height: 600px)"
  ├ <main.booth-attract>             route "attract"  (#/ or anything unknown)
  ├ <main.booth-home>                route "home"     (#/start)
  ├ <main.booth-list>                route "scenarios"(#/t/{track})
  └ <main.sc>                        route "play"     (#/t/{track}/{scenarioId})
```
FluentProvider injects Fluent v9 tokens as CSS vars (`--borderRadiusCircular`, `--borderRadiusLarge/Medium/XLarge/Small`, `--colorNeutralForeground2`, `--colorNeutralBackground1`, `--colorNeutralStroke2`, `--shadow8`…) which the CSS relies on. Brand ramp `Kw` = {30:#08243a,40:#093352,50:#08426b,60:#065285,70:#04629f,80:#0a6bba,100:#4a93ce,110:#66a7d8,120:#82bbe2,130:#9fcfec,140:#bce0f4,150:#d9effa,160:#eff8fd}.

Hash router `I0`: `#/start`→home; `#/t/<track>`→scenarios (track must be one of research/education/learning/admin/campus); `#/t/<track>/<id>`→play; else attract. Helpers: `jf="#/"`, `Sf="#/start"`, `Qi(t)="#/t/"+t`, `H0(t,id)`.
Idle timer `o8`: after 300 000 ms without pointerdown/keydown/wheel/touchstart (only when viewport OK and not already on attract) → navigate to `#/`.

At boot: `Jw()` sets `--copilot-neutral:#F6F9F0`, `--copilot-black:#242424`, `--copilot-overlap-green:#AEE02F`, `--copilot-overlap-blue:#4DD2E3`, and `--m365-{word|excel|outlook|powerpoint|teams|onenote}-{bright|light|dark}` on `<html>` (values in §6). `t8()` sets `--track-{id}` / `--track-{id}-ink` per track.

### 0.2 Viewport scaling (`am`, called at boot + on resize)
```
portrait  = innerHeight >= innerWidth
zoom      = portrait ? clamp(innerWidth/1080, 1, 2.5)
                     : min(innerWidth/1371, innerHeight/768, 2.5)
html.style.zoom = zoom; html.dataset.orient = portrait?"portrait":"landscape"; html.style.setProperty("--booth-zoom", zoom)
```
Design viewport is therefore **1371×768 (landscape)** / **1080-wide (portrait)**, scaled with CSS `zoom` (never below 1 in portrait). CSS defines `--vh: calc(1vh / var(--booth-zoom,1))` and `--vw` likewise; all fluid sizes use `var(--vh)`/`var(--vw)`. Pointer math divides `clientX` by `--booth-zoom` (resizer). `html[data-kbd]` toggled on Tab (true) / pointerdown,touchstart (false); `html:not([data-kbd]) :focus{outline:none}`.

---

## 1. Shared primitives

### 1.1 Variable substitution `re(text, vars)`
`vars = {model, effort, picks:{key→option.label}, vals:{key→option.value}}`. Replaces `{model}`, `{effort}`, `{pick:KEY}`, `{val:KEY}` (unknown keys left untouched). Applied to assistant/user text, sheet cells, block texts, deck heads/subs/bodies, approve.mail fields, recap desc, card body, hunt.say.

### 1.2 `only` / `not` filtering `St(ids, item)`
`ids = oc(st)` = ids of picked options (`st.picks.map(p=>p.option.id)`) plus the literal `"hunted"` when `st.hunted` is set. An item passes if `!(item.only && !item.only.some(id∈ids)) && !(item.not && item.not.some(id∈ids))`. Used for messages (`Gn` returns null when `m.only` fails), sheet rows, blocks (`sr`), deck slide variants (`by`), `tabsAdd`/`headAdd` keys, `nameBy`, `textBy`, `finish.outsBy`.

### 1.3 Inline bold `ke({text})`
`text.split(/\*\*/)` → odd segments → `<b>{seg}</b>`, even → `<span>{seg}</span>` (keys = index). No other inline markdown.

### 1.4 Rich text `Cl({text, afterParagraph?})` — parser `sk`
Splits on `\n` into blocks:
- line starting with ``` ``` ``` → **code** block until closing fence → `<div.sc-code>` with one `<span><i>{lineNo}</i>{line}</span>` per line.
- lines starting with `>` → **quote** → `<blockquote.sc-quote>{lines joined by \n}</blockquote>` (leading `> ` stripped).
- consecutive lines starting with `"✅ "` → **check** list → `<ul.sc-check>` `<li><span><ke text/></span></li>` (prefix removed).
- blank line ends a paragraph; otherwise accumulate → `<p><ke text={lines.join("\n")}/>{afterParagraph?.(index)}</p>` (paragraphs are `white-space: pre-wrap`).

### 1.5 Blank underline `bk({text})` (clause templates)
`text.split(/(_{3,})/)`: runs of ≥3 underscores → `<u.wb-blank style="min-width:{len*0.5}em">`; others → `<ke>`.

### 1.6 App icon `Me({app})`
- `app==="chat"` → `<img.wb-fico.is-logo src="/logo/copilot/copilot.png" alt="" aria-hidden>`
- `app ∈ vf` (excel/outlook/powerpoint/teams/word) → `<img.wb-fico.is-logo src="/logo/m365/{app}.svg" alt="" aria-hidden>`
- else (onenote/cowork/scout/…) → `<span.wb-fico style="background:{bg}" aria-hidden>{ch}</span>` with `ck`: outlook O `var(--m365-outlook-bright,#00aee2)`, word W, excel X, powerpoint P, onenote N `#de4aff`, teams T, cowork/chat/scout C/C/S `var(--copilot-black,#242424)`.

### 1.7 Artifact display name `on(artifact, ids)`
If `artifact.nameBy` → first `nameBy[id]` for id in `ids` order; else `artifact.name`.

### 1.8 Artifact row count `lk(a, ids)` (typing animation length)
sheet → filtered rows length; teams → `teams.body.length + 2`; deck → `slides.length`; else filtered blocks length.

### 1.9 Icon maps (Fluent UI v9 icons, sizes via `fontSize`)
- `we` (cowork composer): plus=Add20Regular 20, mic=Mic20Regular 20, send=ArrowUp20Regular 18, chevron=ChevronDown20Regular 14, close=Dismiss12Regular 12.
- `X` (cowork/chat misc): shield=ShieldCheckmark20Regular 18, panel=PanelRightExpand20Regular 18, more=MoreHorizontal20Regular 18, x=Dismiss20Regular 16, spin=SpinnerIos20Regular 15 `.cwr-spin`, circle=Circle20Regular 15, check2=CheckmarkCircle20Regular 15, chevRight=ChevronRight20Regular 16, search=Search20Regular 16, open=Open20Regular 16, mailSend=Send20Regular 16, caretSm=ChevronDown12Regular 14, copy=Copy20Regular 18, clock=ClockRegular 18, context=DocumentText20Regular 20, upload=ArrowUpload20Regular 20, cloud=Cloud20Regular 20, plugin=Briefcase20Regular 20, thumbUp=ThumbLike20Regular 16, thumbDown=ThumbDislike20Regular 16, down=ArrowDown20Regular 18.
- `je` (Scout): toggle=PanelLeftContract20Regular 19, back=ChevronLeft20Regular 18, forward=ChevronRight20Regular 18, gear=Settings20Regular 18, feedback=Chat20Regular 17, plus=Add20Regular 22, send=Send20Regular 20, min=Subtract16Regular 11, max=Maximize16Regular 11, close=Dismiss16Regular 11, caret=ChevronDown16Regular 13, up=ArrowUp20Regular 18, branch=BranchFork20Regular 17, shrink=ArrowMinimize20Regular 16, trash=Delete20Regular 16, person=Person20Filled 17, down=ArrowDown20Regular 18.
- `Ft` (Outlook mail bar): send=Send20Regular 16, reply=ArrowReply20Regular 16, forward=ArrowForward20Regular 16, caret=ChevronDown20Regular 12, shield=ShieldCheckmark20Filled 17, trash=Delete20Regular 17, popout=Open20Regular 17.
- Answer actions `lc()` = Copy20Regular, ThumbLike20Regular, ThumbDislike20Regular, ArrowClockwise20Regular, MoreHorizontal20Regular (bare, no fontSize).
- Other icons used: Grid20Regular/CheckboxChecked20Regular/PanelLeftContract20Regular (cp titlebar), Subtract16/Maximize16/Dismiss16 (win ctrls), Wrench20Regular (`pf`, Scout tool heading), Options20Regular (`gw`, tool params), ChevronDown16Regular (`Bs`), CheckmarkCircle16Regular (`Wi`), Checkmark20Regular (`uf`), Save20Regular (`bw`), ArrowLeftRegular (`Vi`, back), ArrowRightRegular (`Ml`, cue/next arrow), ChevronLeft/RightRegular (`Y1`,`Z1` pagers), ArrowCounterclockwiseRegular (`Zy` 처음으로), ArrowPreviousRegular (`Jy` 이전으로), NextRegular (`Qy` 건너뛰기), HomeRegular (`ew` 홈으로), SlideMultipleRegular/ColumnTripleRegular (`Wy`/`qy` list view toggle), ZoomInRegular (`Yy`), DismissRegular (`sw`), QrCode24Regular (`Ww`), Document20Regular/DocumentPdf20Regular/Globe20Regular (`dw`/`uw`/`kw` source marks), BeakerFilled/HatGraduationFilled/LightbulbFilamentFilled/MoneyFilled/MegaphoneLoudFilled/CodeFilled (track icons), AddCircle20Filled/TaskListLtr20Regular/Flash20Regular/BrainCircuit20Regular (cowork nav), Search20Regular/Library20Regular/Code20Regular/Folder20Regular (chat nav), Compose20Regular/History20Regular/Flash20Regular/PeopleTeam20Regular/Apps20Regular (scout nav), Home20Regular/Folder20Regular/People20Regular/Star20Regular/Person20Regular/Calendar20Regular/Image20Regular/MusicNote220Regular/Video20Regular/Info16Regular/Search16Regular/NavigationRegular (file picker).

Fluent icon component renders `<svg fill="currentColor" aria-hidden="true" width height viewBox="0 0 N N" class="fui-Icon-regular/filled …"><path d=…/></svg>`; `fontSize` prop sets width/height.

---

## 2. Artifact viewers (`workbench.artifacts.<key>` and chat-only `doc`)

Dispatcher `ic({a, writing, vars, ids, slide, moved, over, progressive, onSlide})`:
- `a.kind==="sheet" && a.sheet` → `Ck` (key = a.name)
- `"deck"` → `Ak`
- `"teams"` → `Ek`
- `"mail"` → `zk` (Outlook reading/compose pane). In the Cowork side panel, mail artifacts are instead rendered by `jk` (Outlook-styled window `desk-win.is-doc.is-cwmail`).
- otherwise (`"doc"`) → `_k`.

`writing`: `null` = fully rendered; a number N = progressive reveal of first N rows/blocks (typing animation; one more row every 320 ms via `st.rows`), last revealed row gets `is-now` / wrapper `.wb-new.is-now` (blinking caret `::after`).

### 2.1 Sheet — `Ck({sheet, writing, vars, ids})`
Schema: `sheet{head[], num?[], tabs?[], rows[{cells[], tone?, only?, not?, add?{key→cells}}], pages?{tabName→{head, num?, rows}}, tabsAdd?{id→tabName}, headAdd?{id→extraHeads[]}}`.
Logic:
- `tabs = [...sheet.tabs, ...Object.entries(tabsAdd).filter(([id])=>ids.includes(id)).map(([,name])=>name)]`.
- Active tab index `a` = 0 while writing, else state (clamped). Page `c` = `a===0 ? undefined : sheet.pages?.[tabs[a]]` → tab 0 always shows the root `sheet`; other tabs show `pages[name]`; tabs with no page are rendered as non-clickable `<i>`.
- rows = `U5((c ?? sheet).rows, ids)` (only/not filter); shown = `writing==null ? all : min(writing, len)`.
- `headAddKey p` = (no page) first `headAdd` key in ids; heads = `[...(c?.head ?? sheet.head), ...headAdd[p]]`; column letters = `A, B, C…`; `numSet = new Set(c?.num ?? sheet.num ?? [])` (0-based column indexes).
DOM:
```
div.wb-xl
  {writing!=null && p.wb-xl-fx > span.wb-xl-ref.is-live "A{shown+1}" + span.wb-xl-f "fx"}
  div.wb-xl-wrap
    table.wb-xl-grid
      thead > tr > th(empty) + th×{A,B,…}
      tbody
        tr.wb-xl-head > th "1" + td×heads
        rows.slice(0,shown).map((row,y) =>
          tr[class = (row.tone ? "is-"+tone : "") + (writing!=null && y===shown-1 ? " is-now" : "")]
            th "{y+2}"
            cells = [...row.cells, ...(p ? row.add?.[p] ?? [""] : [])]
            td[class = numSet.has(colIdx) ? "num" : ""] > <ke text={re(cell, vars)}/>
  {tabs.length>0 && p.wb-xl-tabs > tabs.map((t,i)=> (i===0 || pages?.[t]) ? button[class= i===a?"on":""] : i[class=i===a?"on":""])}
```
Tones observed in data: `hot` (139), `total` (80), `dim` (2); classes `is-hot`, `is-total`, `is-dim`. **CSS only defines `tr.is-pick td` and `tr.is-now td`** (and `tr.wb-xl-head td`): `is-hot/is-total/is-dim` have no styling in the shipped CSS (rendered plain). `td.num` likewise has **no CSS rule** in the stylesheet (no right-alignment is applied; cells are `text-align:left` by `.wb-xl-grid th, td`). Keep emitting the classes for fidelity.
CSS layout: `.wb-xl{display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:100%}`, tabs bar `.wb-xl-tabs` sticky-ish footer with Excel green active (`#107c41`, inset bottom bar). Column header row sticky.

### 2.2 Document — `_k({a, writing, vars, ids})` + block renderer `Ds({b, vars, ids})`
```
div.wb-wd > div.wb-wd-page > blocks.slice(0,shown).map((b,i)=> div[class = writing!=null && i===shown-1 ? "wb-new is-now" : ""] > <Ds b/>)
```
blocks = `sr(a.blocks, ids)`. `Ds` by `b.kind` (`o()` = `re(·,vars)`):
| kind | DOM |
|---|---|
| `field` {label,value} | `p.wb-ol-f > u{label} + b{o(value)}` |
| `subject` {text} | `p.wb-ol-f > u"제목" + b.wb-ol-subj{o(text)}` |
| `para` {text} | `p.wb-ol-p > ke(o(text))` |
| `badge` {text} | `p.wb-ol-due "🕑 " + o(text)` |
| `sign` {lines[]} | `p.wb-ol-sign > span×lines` |
| `list` {title?, ordered?, items[]} | `div.wb-ol-req[.is-num if ordered] > {title && b} + ol > li×ke(o(item))` (always `<ol>`; `.is-num` only toggles class) |
| `head` {text, meta?[]} | `<>h3.wb-wd-h1{o(text)} + {meta && p.wb-wd-meta > span×o(meta)}</>` |
| `section` {title, text?, items?[], stats?[{label,value,warn?}], table?{head,rows}, note?} | `section.wb-wd-sec > h4{o(title)} + {text && p>ke} + {items && ul>li×ke} + {stats && p.wb-wd-mini > span×(u{label} + b[class=warn?"is-warn":""]{o(value)})} + {table && table.wb-wd-tbl > thead>tr>th×head ; tbody>tr×(td×o(cell))} + {note && em.wb-ct-n{o(note)}}` |
| `clause` {no, title, src?, text?, textBy?{id→text}, tpl?, note?} | `selId = first key of textBy in ids; body = text ?? textBy[selId]; open = !body` → `section.wb-ct[.is-open if open] > p.wb-ct-h > (b{no} + span{title} + {src && i[class = src==="미합의" ? "is-warn" : src==="표준" ? "" : "is-src"]{src}}) + p > (body ? ke(o(body)) : bk(o(tpl ?? ""))) + {open && em.wb-ct-n "[협의 필요] 합의 전이라 채우지 않았습니다."} + {note && em.wb-ct-n{o(note)}}` |
| `qa` {q,a} | `section.wb-ct > p.wb-ct-h>(b"Q"+span{o(q)}) + p>ke(o(a))` |
| `note` {text} | `p.wb-ct-note > ke(o(text))` |
| default | null |
Page look: `.wb-wd{padding:14px;background:#f3f2f1}` grey canvas, `.wb-wd-page{max-width:640px;margin:0 auto;padding:28px 32px 40px;background:#fff;box-shadow:var(--shadow4);line-height:1.85}`; `h3.wb-wd-h1` with 2px bottom rule; stats tiles grid `.wb-wd-mini` (auto-fit 110px), `b.is-warn{color:var(--sc-warn)}`.

### 2.3 Mail (Outlook pane) — `zk({a, writing, vars, ids})`
blocks = `sr(a.blocks, ids)` sliced to `shown`; `fields = kind==="field"`, `subject = find kind==="subject"`, `body = others`; `isRead = a.origin==="read"`; `isSent = a.where.includes("보낸")`.
```
div.wb-ol
  p.wb-ol-bar
    isRead ? [span.wb-ol-act(Ft.reply "답장"), span.wb-ol-act(Ft.reply "모두 답장"), span.wb-ol-act(Ft.forward "전달")]
           : [span.wb-ol-send(Ft.send "보내기"), span.wb-ol-split[aria-hidden](Ft.caret)]
    span.wb-ol-grow
    span.wb-ol-ico.is-shield[aria-hidden](Ft.shield, Ft.caret)  span.wb-ol-ico(Ft.trash)  span.wb-ol-ico(Ft.popout)
  div.wb-ol-fields
    fields.map(Ds)                                   // p.wb-ol-f > u{label} b{value}
    p.wb-ol-subjrow > span.wb-ol-subj{subject ? ke(re(text)) : "제목 추가"} + {!isRead && em{isSent ? "보냄" : "초안 저장됨"}}
  div.wb-ol-body > body.map((b,i)=> div[class = writing!=null && i===last ? "wb-new is-now":""] > Ds)
```
Colours use `var(--track, var(--sc-info))` (Outlook cyan when inside `[data-app=outlook]` window).

### 2.4 Cowork mail window — `jk({a, writing, vars, ids, onClose})` (side-panel variant for `kind==="mail"`)
```
section.desk-win.is-doc.is-cwmail[data-app=outlook]
  header.cwm-bar
    span.cwm-mark[aria-hidden] > Me(outlook)
    b.cwm-subj {subject ? ke(re(subject.text)) : a.name}
    span.cwm-react[aria-hidden] (X.thumbUp, X.thumbDown)
    span.cwm-grow
    span.cwm-open (X.open, "Outlook에서 열기")
    button.cwm-x[aria-label=닫기] (we.close)
  div.cwm-body > article.cwm-letter
      nonField/nonSubject blocks → div[.wb-new.is-now on last while writing] > Ds
      p.cwm-sent "Sent by " span"Copilot Cowork"
```

### 2.5 Deck (PowerPoint) — `Ak({a, vars, ids, slide, moved, over, progressive, onSlide})`
Schema: `deck{total?, slides[{n, head, sub?, body?[], by?{id→{head?,sub?,body?}}, table?{head,rows}, over?}], rest?[], src?}`.
Slide resolver `td(deck, n, moved, ids, vars, progressive)`:
- slide = `slides.find(s.n===n)`; missing → `{head: deck.rest?.[n - slides.length - 1] ?? "", done:false}`.
- `done = !deck.src && (!progressive || moved >= slide.n)`; variant = `done` ? `slide.by[firstIdInIds]` : none; returns `{head: re(variant.head ?? head), sub, body[], done}`.
`progressive` = scenario has a tool message with `translate:true`; `moved` increments every 260 ms while `st.moving`, and `st.slide` follows.
```
div.wb-pp
  div.wb-pp-thumbs
    for m in 1..total: button.wb-pp-th[.on if m===slide][.is-done if done][.is-over if slide.over && done && over]
        u{m}  em > ( s{head} q q )          // s = title clamp, q = fake text lines
  div.wb-pp-stage
    div.wb-pp-slide[.has-table if slide.table]
      span.wb-pp-accent
      b{head}  {sub && i{sub}}
      {table && table.wb-pp-table[aria-label=head] > thead>tr>th[scope=col]×re(head) ; tbody>tr×td×re(cell)}
      {body && ul > li×body}
      span.wb-pp-no "{slide} / {total}"
      {over && span.wb-pp-over "⚠ 글상자를 넘침 · 확인 필요"}
```
Accent colour `#d24726`. `.wb-pp{grid-template-columns:82px 1fr;background:#eeeeec}`; slide `max-width:460px; aspect-ratio:16/9`.

### 2.6 Teams post — `Ek({a, writing})`
Schema `teams{channel, team, author, at, title, body[], foot?, reactions?[]}`. `o = writing ?? body.length+2`.
```
div.wb-tm
  p.wb-tm-head > b{channel} + span{team}
  div.wb-tm-body > div.wb-tm-msg
      span.wb-tm-av[aria-hidden] "C"
      div
        p.wb-tm-mh > b{author} + time{at} + i"초안 · 전송 전"
        {o>0 && p.wb-tm-t{title}}
        body.slice(0, max(0,o-1)).map(p > ke)
        {o > body.length+1 && foot && p.wb-tm-foot{foot}}
        {o > body.length+1 && reactions && p.wb-tm-re > span×reaction}
  p.wb-tm-comp > span"메시지를 입력하세요" + span.wb-tm-send"전송"
```
Teams purple `#5b5fc7`.

### 2.7 Document window chrome — `w7({app, mark, name, badge, state, note, live, tabs, onClose, children})`
Used by the done screen (`j7`) and (conceptually) any app-styled window.
```
section.desk-win.is-doc[data-app={app}][style=--doc-tabs-height:{px}]
  {tabs}                                           // y7 nav.doc-tabs, measured .wb-xl-tabs height → --doc-tabs-height
  {name && header.doc-bar > {mark} + b{name} + {badge && span.doc-from.is-{badge.kind}{badge.text}} + span.doc-grow + {state && span.doc-state[.is-run if state.running]{state.text}} + {onClose && button.doc-x[aria-label=닫기](we.close)}}
  div.doc-body > children
  {(live||note) && p.doc-live[role=status] > span>ke(live ?? note) + {live && i i i}}   // three blinking dots
```
`y7({tabs,onPick})`: `nav.doc-tabs > tabs.map(t => button[class = (t.on?"on ":"") + (t.writing?"is-writing":"")] > {t.mark} + span{t.name})`.
`[data-app]` sets `--track/--track-soft/--track-ink` from the M365 product colours (word/excel/outlook/powerpoint/teams/onenote); `.doc-from.is-made` tinted by `--track`, `.doc-from.is-read` grey.

### 2.8 Done-screen artifact viewer — `j7({made:[{id,a}], st, ids, vars, progressive, madeLabel})`
```
section.sc-done-doc[aria-label=생성된 결과물]
  w7(app=cur.a.app,
     single ? {mark: Me(app), name: on(a,ids), badge:{kind:"made", text: madeLabel}}   // madeLabel = "{Ie[agent].name} 생성"
            : {tabs: y7(made.map(m=>({id, name:on(m.a), mark:Me(m.a.app), on:m.id===cur.id, writing:false})))},
     note: cur.a.note?)
     > ic({a:cur.a, writing:null, vars, ids, slide, moved:st.moved, progressive, over:st.over, onSlide})
```

### 2.9 Chat-only artifact — `ld({artifact, bare})` (top-level `artifact{kind,title,slides|html|src,note}`)
```
section.booth-artifact[aria-label = bare ? title : "결과물"]
  {!bare && h2{title}}
  kind html  → iframe[sandbox=allow-same-origin][srcDoc = html with injected <style>@font-face Pretendard/Segoe Sans + html,body font stack</style>]
  kind pdf   → iframe[src]
  kind image → img[src alt=title]
  kind slides→ tm({slides, title})            // see §4.7
  kind file|link → a.booth-artifact-link[target=_blank rel=noreferrer noopener] "파일 열기" | "링크 열기"
  {note && !bare && p.booth-artifact-note{note}}
```
Only `kind:"slides"` is used by the data (hackathon-poster).

---

## 3. Copilot chrome per surface

`surface = scenario.surface ?? {chat:"chat", cowork:"cowork", scout:"scout"}[agent]`. Zones per surface (`T8`, used for spot-quiz targets): chat `rail,top,stream,actions,composer`; cowork/scout `rail,stream,composer`; word/excel/powerpoint `ribbon,canvas,pane,composer`; teams `rail,top,stream,composer`; sharepoint `rail,top,canvas,pane,composer`.
Zone marking: each chrome component receives `mark(zone)` → string `"zone-{zone} {is-asked?} {is-lit?}"` appended to the element's className next to `sc-zone` (e.g. `className: \`side sc-zone ${mark("rail")}\``). `is-asked` = zone is one of the current spot-quiz options; `is-lit` = user tapped that zone (chat-only surfaces). CSS: `.sc-zone.is-asked` green inset glow, `.sc-zone.is-lit` stronger glow + `sc-lit` animation.

Product names `Ie`: chat `{name:"Copilot Chat"}`, cowork `{name:"Copilot Cowork"}`, scout `{name:"Microsoft Scout"}` (`full` same). Models `F8`: 자동 / GPT 5.5 / Opus 5 / Sonnet 5 / Fable 5.1 (each with `d` description). Efforts `L8`: 낮음 / 보통 / 높음 / 매우 높음.

### 3.1 `.cp-app` shell — `Q5({mode, side, panelOpen, panelResizable, panel, overlay, children, mark})`
```
div.cp-app[data-mode=chat|cowork][data-cwrun="on"|""][data-resizing=true?][style: --cw-doc-main:{100-u}fr; --cw-doc-panel:{u}fr when resizable]
  ak()                                      // title bar: two fragments
  aside.side.sc-zone.{mark("rail")} > side
  main.main > children
  {panelOpen && panel}                      // aside.cwr-panel …
  {panelOpen && panelResizable && div.cwr-resizer[role=separator tabIndex=0 aria-label=결과물 패널 너비 aria-orientation=vertical aria-valuemin=30 aria-valuemax=70 aria-valuenow aria-valuetext="{n}%"]}
  {overlay}                                 // file picker
```
Resizer: pointer capture; `u` (panel %) = `(panelRight - clientX/zoom) / (panelRight - mainLeft) * 100` clamped 30–70, default `110/2.1 ≈ 52.38`; dblclick resets; ArrowLeft/Right ±2, Home 30, End 70.
CSS grid: `.cp-app{display:grid;grid-template-rows:48px 1fr;grid-template-columns:var(--cw-side,228px) 1fr;grid-template-areas:"tbL tbR" "side main"}`; `[data-cwrun=on]` → columns `var(--cw-side) 1fr var(--cwr-panel)` areas `"tbL tbR tbR" "side main panel"`; `[data-cwrun=on]:has(>.cwr-panel.is-doc)` → `var(--cw-side) minmax(0,var(--cw-doc-main,1fr)) minmax(0,var(--cw-doc-panel,1.1fr))`.

Title bar `ak({name="Copilot"})`:
```
div.tb.tb-left > span.wordmark{name} + div.tb-icons > span.ico-btn[aria-hidden]×3 (Grid20Regular 18, CheckboxChecked20Regular 18, PanelLeftContract20Regular 18)
div.tb.tb-right > div.winctrls[aria-hidden] > span.win(Subtract16 11) span.win(Maximize16 11) span.win.close(Dismiss16 11)
```
Rail pieces:
- `K5({active})`: `div.tabs[data-active=chat|cowork] > div.tab-thumb + div.tab[.active]"채팅" + div.tab[.active]"Cowork"` (thumb slides via `[data-active=cowork] .tab-thumb{transform:translate(100%)}`).
- `G5({icon,name,active,extra,onClick})`: `button.nav-item[.active][extra] > span.ic{icon} + name`.
- `X5({label, items})`: `div.scroll > div.section-label{label} + div.hist > items.map((t,i)=> button.hist-item[.active if i===0] > span.t{t})`.
- Chat rail nav `dv`: 새 채팅(AddCircle20Filled), 검색(Search20Regular), 라이브러리(Library20Regular), 에이전트 및 기술(Code20Regular), 전자 필기장(Folder20Regular) — wrapped in `div#chat-nav-group > div.nav + X5("채팅",[title])`, `new` active.
- Cowork rail nav `vk`: new 새 작업(AddCircle20Filled), mine 내 작업(TaskListLtr20Regular), auto 자동화(Flash20Regular), custom 사용자 지정(BrainCircuit20Regular) — `div#cowork-nav-group > div.nav + X5("작업",[workbench.task])`, `new` active; clicking a nav item calls hunt check `Yt(id)`.

### 3.2 Chat surface (`Mv` default branch → `Q5 mode="chat"` + `av` + `cv`)
`av({model, onModel, streamRef, children, composer, mark})`:
```
div.main-top.sc-zone.{mark("top")}
  span.workiq > span.dot[aria-hidden] + "Work IQ"
  div.dd > button.dd-btn[onClick=onModel] {model} + we.chevron
section.view.active
  div.conv.sc-zone.{mark("stream")}[ref=streamRef] > children         // messages
  div.composer-dock > {!atBottom && button.cwr-down[aria-label=맨 아래로](X.down)} + composer
```
`cv({text, filled, onSend, children, mark, pick, pickPhase="done", onPickSelect, note})` (chat composer + slash-pick):
```
div.composer.sc-zone.{mark("composer")}[.has-clip when pick && filled && phase==="done"]
  {has-clip && div.composer-clip > p.cwr-clip > Me(pick.app ?? "word") + span{pick.name}}
  span.round-btn[aria-hidden](we.plus)
  p.ph[.is-filled if filled] {text | split on pick.token: phase done → span.cwr-link{pick.name}; phase type/search/pick → span.wb-slashq "/"+pick.query + i.wb-caret}
  children ?? [ span.round-btn[aria-hidden](we.mic),
                onSend ? button.round-btn.send.is-hunt[aria-label=보내기](we.send) : span.round-btn.send[aria-hidden](we.send) ]
  {pick && filled && phase∈{search,pick} && rv(...)}
p.foot-note {note = "AI 생성 콘텐츠는 정확하지 않을 수 있습니다."}
```
Slash search popup `rv({query,name,meta,app="word",active,onPick})`:
```
div.wb-slash[data-coach=lit]
  ul.wb-slash-tabs[aria-hidden] > li[.on first]×["전체","파일","이메일","채팅","사이트"]
  onPick ? button.wb-slash-row.is-pick[.on if active] : div.wb-slash-row[.on if active]
     > Me(app) + span.wb-slash-name {before + b{match} + after} + {meta && span.wb-slash-meta}
```
Pick phases in `_v`: `"type"` (850 ms, caret typing look) → `"search"` (popup shown, coach tip "검색 목록이 열렸어요…") → click → `"pick"` (460 ms highlighted) → `"done"` (link chip in composer + `composer-clip`). Send button only active (`onSend`) when phase is done.

### 3.3 Cowork surface — `m7` (wraps `mk` desk → `Q5 mode="cowork"`)
`mk({doc, children})`: `div.desk[.has-doc] > div.desk-win.is-app.is-back > children` + `{doc}` (doc slot unused in current code — the artifact panel lives inside `.cp-app` as `.cwr-panel`).
Main area `gk({panelOpen,onTogglePanel,streamRef,children,composer,toast})`:
```
section.view.active[style=--cwr-dock:{composerHeight}px]
  div.cwr-top > div.tr > span.cwr-shield[title=보호됨 aria-hidden](X.shield) + span.ico-btn(X.more) + {!panelOpen && span.sep + button.ico-btn[aria-label=작업 영역](X.panel)}
  div.cwr-stream[ref] > div.cwr-wrap > children
  div.cwr-foot-wrap[ref] > {!atBottom && button.cwr-down[aria-label=맨 아래로](X.down)} + composer
{toast}   // p.wb-toast[.is-warn|.is-good][data-coach=over]{text}, auto-hides after 2600 ms
```
Composer `yk({text, filled, clip, children, menus, note})`:
```
div.cwr-composer
  div.cwr-cbox
    {clip}                                   // p.cwr-clip (Me + span name + button[aria-label=붙인 파일 빼기](we.close)) or div.cwr-clips > (span.cwr-link | p.cwr-clip)*
    p.ph[.is-filled]{text}                   // text = ask (prefilled, re()) when cue pending, else "Copilot Cowork에 메시지 보내기"
    div.crow > children
    {menus}
  p.cwr-foot {note}
```
Cowork `crow` children (`hm()`):
```
button.round-btn[aria-label=첨부](we.plus)                // opens attach menu, hunt check "attach"
button.dd-btn[.is-open if open==="model"] {model} we.chevron
button.dd-btn[.is-open if open==="effort"] {effort} we.chevron
span.spacer
button.round-btn[aria-label=음성](we.mic)                 // Yt("mic")
button.cw-send[.is-hunt when ask prefilled or file clipped][disabled unless (ask || clipped)][aria-label=보내기](we.send)
```
Menus (`pm()`, absolutely positioned inside `.cwr-cbox` via inline `style={left,bottom}` computed from the clicked button; all have `data-coach="lit"` so the coach veil punches a hole):
- Model `div.wb-menu.is-model > models.map((m,i)=> button[.is-on if current] > i[aria-hidden]{"✓"|""} + span{m.v + em{m.d}} ; after first item span.wb-menu-div)`.
- Effort `div.wb-menu.is-effort[style --at:{idx} --last:{n-1}] > p.wb-eff-h "노력 {effort}" + p.wb-eff-ends > span"빠르게" span"더 스마트하게" + div.wb-eff-track > span.wb-eff-fill + efforts.map((e,i)=> button.wb-eff-stop[.is-on][.is-past][aria-label="{v} — {d}"][aria-current] > i) + p.wb-menu-note "더 많은 " b"노력" "을 기울이면 더 철저해지지만, 속도는 더 느려지고 크레딧도 더 많이 소모됩니다."`.
- Attach `div.wb-menu.is-attach > h7.map(item => {item.id==="custom" && span.wb-menu-div} + button.is-row > span.wb-menu-ico{icon} + span{name + em{desc}} + {keys && kbd.wb-menu-keys{keys}})` with items: context "작업 컨텍스트 추가"/"파일, 사람, 모임"/Ctrl+/ (X.context); upload "이미지 및 파일 업로드"/"PDF, Word, Excel, 이미지"/Ctrl+U (X.upload); cloud "클라우드 파일 및 폴더 첨부"/"OneDrive, SharePoint, Teams"/Ctrl+Shift+U (X.cloud); custom "사용자 지정"/"기술 및 플러그인 관리" (X.plugin). upload→local picker, cloud→cloud picker when the hunt provides files; otherwise toast "체험 화면에서는 이 기능이 동작하지 않습니다".
Picking model/effort updates `st.model/st.effort` and toasts "‘{v}’ 으로 바꿨습니다"; hunt resolution toast "미션 완료 — {label}을(를) 찾았습니다" (`is-good`), wrong target → `hunt.wrong[id]` or "이번에 찾을 곳은 여기가 아닙니다" (`is-warn`).

File picker overlay `pk({kind:"cloud"|"local", files, onPick, onClose})`:
```
div.wb-fp-wrap > div.wb-fp-dim[aria-hidden] +
  cloud: div.wb-filepick.is-cloud[role=dialog aria-label=항목 선택 data-coach=lit]
     aside.wb-fp-rail > p.wb-fp-title"항목 선택" + div.wb-fp-places > span.wb-fp-place[.is-on "내 파일"]×[홈,내 파일,공유됨,즐겨찾기](i>icon + name) + p.wb-fp-h"다음을 기준으로 검색" + div.wb-fp-places×[사람,모임,미디어] + p.wb-fp-h "빠른 액세스 " Info16Regular
     div.wb-fp-body > div.wb-fp-top(h3"내 파일" + span.wb-fp-search(Search16 "내 파일에서 검색") + span.wb-fp-view(NavigationRegular 16, ChevronDown12 12)) + div.wb-fp-table > div.wb-fp-hrow(span, "이름","수정된 날짜","수정한 사람") + rows
     footer.wb-fp-foot > button.wb-fp-go[disabled unless selected]"선택" + button.wb-fp-b"취소"
  local: div.wb-filepick.is-local[role=dialog aria-label=열기 data-coach=lit]
     div.wb-fp-bar > span.wb-fp-bt"열기" + span.wb-fp-x(Dismiss12)
     div.wb-fp-nav[aria-hidden] > ChevronLeft20 ChevronRight20 ArrowUp20 + span.wb-fp-crumb(Folder20 " 문서 ›") + span.wb-fp-search(Search16 "문서 검색")
     div.wb-fp-main > aside.wb-fp-places.is-local > span.wb-fp-place[.is-on "문서"]×[홈,갤러리,바탕 화면,다운로드,문서,사진,음악,동영상] + div.wb-fp-table > hrow(span,"이름","수정한 날짜","유형") + rows
     footer.wb-fp-foot.is-local > span.wb-fp-label"파일 이름(N):" + span.wb-fp-input{selected?.name} + span.wb-fp-kind("모든 파일 " ChevronDown12) + div.wb-fp-btns > button.wb-fp-go"열기(O)" + button.wb-fp-b"취소"
row: button.wb-fp-row[.is-on][aria-pressed] > span.wb-fp-ico(Me(app)) + span.wb-fp-name + span.wb-fp-c{at ?? "—"} + span.wb-fp-c{cloud ? by ?? "—" : typeName[app] ?? "파일"}
```
typeName `dk`: word "Microsoft Word 문서", excel "Microsoft Excel 워크시트", powerpoint "Microsoft PowerPoint 프레젠테이션", onenote "Microsoft OneNote 구역", outlook "Outlook 항목". File app inferred from extension (`x7`: xlsx/xls/csv→excel, docx/doc/pdf→word, pptx/ppt→powerpoint, msg/eml→outlook, one→onenote, default word).

Work-area panel (right) — when no artifact is open, `wk({onClose, children})`:
```
aside.cwr-panel
  div.cwr-ptop > h2"작업 영역" + button.x[aria-label=닫기](X.x)
  {steps.length && J0(title="단계", count="{done}/{total}") > kk(steps)}
  {outs.length  && J0(title="출력", count=String(n)) > ul.cwr-outs > li > button > Me(app) + span.on{on(a,ids)} + span[aria-hidden](X.open)}
J0: div.cwr-psec > div.cwr-ph {title} " " {count && span.n{count}} + children
kk: ul.cwr-steps > li[class=state done|active|pending] > span.mk[aria-hidden]{done→X.check2, active→X.spin, pending→X.circle} + span.sx > span.st{name} + {active && span.ss"진행 중"} {pending && span.ss"보류 중"}
```
Steps = every tool message (filtered by ids) with state by position vs `shown`. Outs = `st.opened` artifacts whose `origin==="made"`.
When an artifact is opened (`st.tab`), the panel becomes:
```
aside.cwr-panel.is-doc[.is-reviewing when done or review-pause][tabIndex=-1 aria-label=on(a)]
  kind mail → jk(...)
  else → div.cwr-ptop > h2 > Me(app) + on(a) ; button.x[aria-label=닫기](X.x)
         div.cwr-pdoc > ic({a, writing: st.writing===key ? st.rows : null, vars, ids, slide, moved, progressive, over, onSlide})
```
Artifact references in the stream (`cwr-slots`, placed under the message index where the tool `opens/shows/writes` it or where an assistant message lists `files`):
- read artifacts → `button.cwr-ref[.is-on if st.tab===key] > span.ri[aria-hidden](X.search) + span.rt > b“{name}” + (searching ? " 검색 중" : "") + span.rp > Me(app) "파일" + span.rc[aria-hidden](X.chevRight)`.
- made artifacts → `div.cwr-files > button.cwr-fcard[.is-on][.is-cue when awaiting review] > Me(app) + span.ftx > span.fn{on(a)} span.fk{u7(a)} + span.op[aria-hidden](X.open)`; `u7`: outlook → where includes "보낸" → "보낸 편지함에 저장됨", "임시" → "임시보관함에 저장됨", else `where`; others → `d7[app]` (excel "Excel 스프레드시트", word "Word 문서", powerpoint "PowerPoint 프레젠테이션", onenote "OneNote 전자 필기장", teams "Teams 메시지").
First user message gets `clips` = read artifacts (name has extension or `share==="link"`, not part of a hunt attach menu) rendered as `p.sc-user-clip`/`p.sc-user-link > span.cwr-link` above the bubble; same list appears in the composer as `div.cwr-clips` before the first send.

### 3.4 Scout surface — `uv({user="POSTECH", side, streamRef, children, composer, mark})`
```
div.sct-app
  div.tb > span.tb-btn[aria-hidden](je.back) + span.tb-btn.is-off(je.forward) + div.tb-center > span.brand"Microsoft Scout" + div.tb-right > span.tb-btn(je.toggle) + span.feedback(je.feedback "Send Feedback") + div.winctrls[aria-hidden] > span.win×3 (je.min, je.max, je.close)
  div.body
    aside.side.sc-zone.{mark("rail")} > side + div.acct > span.av[aria-hidden](je.person) + span.who > b{user} em"● Connected" + span.gear(je.gear)
    main.main > section.view > div.conv.sc-zone.{mark("stream")}[ref] > children ; div.dock > {!atBottom && button.sct-down[aria-label=맨 아래로](je.down)} + composer
```
Rail `hv({title, onAutomations, automationSelected})`: `div.nav > pv.map(button.nav-item[data-scout-nav=id][disabled if automations && selected] > span.ic{icon} + name)` with newchat "New chat"(Compose20), activity "Activity"(History20), automations "Automations"(Flash20), cocreate "Co-create"(PeopleTeam20), extensions "Extensions"(Apps20); then `div.chats-head > span.lbl"Chats"`, `div.chat-scroll > button.chat-item.active > span.t{title}`, `button.clear-all (je.trash "Clear all chats")`.
Composer `fv({text, filled, onSend, model})`:
```
div.composer.sc-zone.{mark("composer")}
  p.ph[.is-filled]{text ?? "Describe what you want to do"}
  div.crow > span.round(je.plus) + span.model{model je.caret} + span.round.is-sm(je.branch) + span.grow + span.round.is-sm(je.shrink) + (onSend ? button.round.send.is-hunt[aria-label=보내기](je.up) : span.round.send(je.up))
```
(No scenario in the current data uses `agent:"scout"`, but the code path exists.)

### 3.5 Office surfaces (word/excel/powerpoint) — `wv({surface,title,model,doc,vars,streamRef,ask,onSend,children,mark})`
```
div.sc-shell.is-office
  yv(name = span.sc-save"자동 저장 ●" + (doc?.name ?? title) + " · " + Word|Excel|PowerPoint, right = span.sc-win-search"⌕ 검색")
     → div.sc-win > span.sc-win-name{name} + {right} + span.sc-win-btns[aria-hidden] > i"─" i"▢" i"✕"
  div.sc-ribbon.sc-zone.{mark("ribbon")}
     span.sc-ribbon-tabs > i[.on if index===1]×tabs[surface]
     span.sc-ribbon-groups > groups[surface].map(g => span[.is-copilot if name==="Copilot"] > b[aria-hidden]{ico} + i{name})
  div.sc-office-body
     div.sc-canvas.sc-zone.{mark("canvas")} > {doc && ic({a:doc, writing:null, vars, ids:[], slide:0, moved:0, over:false})}
     div.sc-pane.sc-zone.{mark("pane")} > rm(top = i"≡" i"⛨" i.sc-chip{model " ⌄"} i"⋯" i"✕", head, sub, allow:true, streamRef, children)
  div.sc-composer.is-pane.sc-zone.{mark("composer")} > im(text = ask ?? inputPlaceholder, filled=!!ask, onSend when ask)
  div.sc-status > span{powerpoint ? "슬라이드 1/{total}" : excel ? "준비" : "1/5 페이지"} + span"한국어" + span.sc-status-end"─ ───●─── ＋ 77%"
```
Ribbon tabs `mv`: word 파일 홈 삽입 그리기 디자인 레이아웃 참조 편지 검토 보기; excel 파일 홈 삽입 페이지 레이아웃 수식 데이터 검토 보기 자동화; powerpoint 파일 홈 삽입 그리기 디자인 전환 애니메이션 슬라이드 쇼 검토 보기. Groups `gv` (ico/name): word 📋 클립보드, Ａ 글꼴, ≡ 단락, ▤ 스타일, ⌕ 편집, ◈ Copilot; excel 📋 클립보드, Ａ 글꼴, ≡ 맞춤, % 표시 형식, ⊞ 셀, ⌕ 편집, ◈ Copilot; powerpoint 📋 클립보드, ⊞ 슬라이드, Ａ 글꼴, ≡ 단락, ◳ 그리기, ⌕ 편집, ◈ Copilot.
Pane copy `sm`: word head "문서를 편집해 보겠습니다." sub "무엇을 하고 싶은지 알려주시면, 바로 문서 편집을 시작할 수 있습니다." input "Copilot으로 편집"; excel head "통합 문서 편집" input "Copilot으로 편집"; powerpoint head "프레젠테이션을 편집해 보겠습니다." input "만들거나 편집할 항목 설명"; sharepoint head "POSTECH 구성원님 안녕하세요!" sub "질문하거나 다음 프롬프트 중 하나로 시작해 보세요." input "질문하거나 /를 입력하여 파일 또는 사람을 추가합니다".
`rm({top,head,sub,allow,streamRef,children})`: `span.sc-pane-top{top}` + `b.sc-pane-head{head}` + `{sub && span.sc-pane-sub}` + `{allow && i.sc-pane-allow"편집 허용 ⌄"}` + `div.sc-stream-in[ref] > children`.
`im({text,filled,onSend})`: `b"＋"` + `span[.is-filled]{text}` + `i"🎤"` + `{onSend && button.sc-pane-send.is-hunt[aria-label=보내기]"↑"}`.

### 3.6 SharePoint surface — `vv({title, streamRef, ask, onSend, children, mark})`
```
div.sc-shell.is-sp
  div.sc-sp-top.sc-zone.{mark("top")} > span[aria-hidden]"⠿" + b"Microsoft" + b.sc-sp-app"SharePoint" + span.sc-sp-search"⌕ 이 사이트 검색" + span.sc-sp-icons[aria-hidden]"⚙ ? ◍"
  div.sc-sp-body
    div.sc-rail.is-labels.sc-zone.{mark("rail")} > span.sc-rail-i×["▦ Microsoft","⌕ 검색","✎ 게시","▤ 빌드","☁ OneDrive"]
    div.sc-canvas.sc-zone.{mark("canvas")} > div.sc-sp-site > b{title} + span.sc-sp-meta"비공개 그룹 · Confidential · 구성원 38명" + span.sc-doc-l + span.sc-doc-l.short + span.sc-doc-l
    div.sc-pane.sc-zone.{mark("pane")} > rm(top = b"◈ Copilot" i"⋯" i"✕", head, sub, streamRef, children)
  div.sc-composer.is-pane.sc-zone.{mark("composer")} > im(...)
```

### 3.7 Teams surface — `jv({user, model, streamRef, ask, onSend, children, mark})`
```
div.sc-shell.is-teams
  div.sc-tm-title > span.sc-tm-lead(i"▤" b"MS") + span.sc-tm-nav[aria-hidden]"‹ ›" + span.sc-tm-search(i"⌕" "검색하거나 Copilot에게 질문하기(Ctrl+E)") + span.sc-tm-right(i"⋯" "Microsoft" i.sc-tm-warn"⚠" b{user.slice(0,2)})
  div.sc-tm-left.sc-zone.{mark("rail")}
    span.sc-tm-apps > i×["▦","🔔","💬","☏","☁", i.is-on"◈", "▤","＋","⋯"]
    span.sc-tm-list > b.sc-tm-burger"≡" + span.sc-tm-tabs(i.on"Copilot Chat" i"Copilot Cowork") + span.sc-tm-new(em + "새 채팅") + u"에이전트" + span.sc-tm-row×["리서치 도구","분석가","Surveys","Planner Agent","새 에이전트"] + span.sc-tm-row.is-dim"⋯ 에이전트 더 보기" + u"채팅" + span.sc-tm-row.is-dim"연구실 주간 세미나 준비" + span.sc-tm-row.is-now"국책과제 연구비 집행 현황" + span.sc-tm-row.is-dim"학부 실험실습 일정 조정" + span.sc-tm-row.is-dim"산학협력 협약서 검토 초안"
  div.sc-main
    div.sc-top.is-teams.sc-zone.{mark("top")} > span.sc-tm-scope(i.on"💼" i"🌐") + span.sc-tm-model{model " ⌄"}
    div.sc-body > div.sc-stream.sc-zone.{mark("stream")} > div.sc-stream-in[ref] > children
    div.sc-composer.is-tall.sc-zone.{mark("composer")} > span[.is-filled]{ask ?? "Copilot에 메시지 보내기"} + span.sc-composer-row > b"＋" i.sc-tm-mic"🎤" i.sc-tm-mic"≋" {onSend && ask && button.sc-pane-send.is-hunt"↑"}
    div.sc-tm-chips > span×["추천 항목","파일 인사이트","받은 편지함 분류","사용자 검색","⋯"]
```
Generic `.sc-shell{display:grid;grid-template-columns:178px 1fr}`; office `grid-template-rows:auto auto minmax(0,1fr) auto auto`; sp `auto minmax(0,1fr) auto`; teams `262px minmax(0,1fr)` / rows `auto minmax(0,1fr)`.

### 3.8 Chat-only play container
For non-workbench scenarios the demo step renders: `div.sc-feed > div.desk-win.is-app > Mv(...) + J5(coach tips)`; `Mv` passes `{surface,title,model,effort,doc,streamRef,ask,pick,pickPhase,onPickSelect,onSend,onAutomations,automationSelected,marks,lit,children}`. For workbench scenarios the Cowork surface `m7` is mounted inside `div[style=display:contents|none]` so it persists across steps (keyed by `${scenarioId}:${restartCount}`).

---

## 4. Stream message components

Message roles (`G0`): `user, assistant, tool, note, cue, spot, approve, choice, hunt, card`. Interactive roles (`cue/spot/approve/choice/hunt`) pause playback and are rendered **outside** the normal stream by the coach layer or by dedicated cards; `Gn` returns `null` for them (and for `card`, which `m7` renders via `g7`).

### 4.1 Message renderer `Gn({m, active, ids, extra, scout, date, hold, clips, pick, acts})`
- `m.only` filter via `ids` → null if excluded.
- **note** → `p.sc-note{text}` (also `p.sc-date{startedAt}` is emitted once at top of chat-only streams with the same styling).
- **tool** (non-Scout) →
  ```
  div.sc-act[.is-now if active else .is-done]
    p.sc-act-h > img.sc-act-ico[src=/logo/copilot/copilot.png aria-hidden] + {r7(tool)} + i[aria-hidden]"›"
    p.sc-act-d {tool}
  ```
  `r7` category from the tool text: /검색|찾는|훑는/→"검색", /읽는|보는/→"읽기", /계산|분석|정렬|대조/→"분석", /작성|쓰는|만드는|그리는|채우는/→"생성", /연결|가져오는|불러오는/→"연결", /변환|옮기는/→"변환", /예약|요청|발송|올리는|등록/→"실행", else "확인". In `.cp-app`/`.sct-app` the CSS hides `.sc-act-h` and shows a `::before` ✓ / spinning ring (`cwrsp .9s`) and the text shimmers (`sc-act-shine`) while `.is-now`. `is-done` adds `::after "✓"` (hidden in cp-app/sct-app).
- **tool** (Scout) → `q5` (§4.6).
- **user** →
  ```
  div.sc-user
    {pick && p.sc-user-clip > Me(pick.app ?? "word") + span{pick.name}}
    {clips?.map(c => c.link ? p.sc-user-link > span.cwr-link{name} : p.sc-user-clip > Me(app) + span{name})}
    div.sc-user-box > p { pick ? text.split(pick.token) → [before, span.cwr-link{pick.name}, after] : ke(text) }
  ```
- **assistant** with `sources` → `s7` (§4.2). Otherwise:
  ```
  div.sc-answer[.cwr-hold if hold]
    {scout && W5(thoughtSeconds, thought)}
    scout ? o7({text, at, date}) : div.sc-answer-body > Cl(text) + {images && nm(images)}
    {extra}
    {!scout && div.sc-answer-acts.sc-zone.zone-actions.{acts} > lc()}      // acts = "is-asked"|"is-lit"|""
  ```
  `cwr-hold` marks the message the review-pause is anchored to (outline ring `.cwr-hold{outline:2px solid var(--sc-lit-60)}`); the stream auto-scrolls so its top is 12 px below the viewport top (`Z5`).

### 4.2 Sourced answer `s7({message, extra, hold})` (chat scenarios with `sources[{id,label,kind:pdf|page|doc,detail,url?,blocks[]}]`)
```
div.sc-answer.sc-referenced-answer[.cwr-hold]
  div.sc-answer-body
    Cl(text, afterParagraph=(i)=> sources with blocks.includes(i) → button.sc-citation[title=labels; aria-label="출처 확인: …"; aria-haspopup=dialog; aria-controls=dialogId] > es(first) + {n>1 && span"외 {n-1}개"})
    section.sc-answer-sources[aria-label=Sources] > h3"Sources" + ul > li > button.sc-source-link[aria-haspopup=dialog aria-controls] > span{label} + es(source)
    {images && nm(images)}
  {extra}
  div.sc-answer-acts > lc() + button.sc-reference-trigger[aria-label="참조 {n}개" aria-haspopup=dialog aria-controls] > span.sc-source-stack > es×sources + span"참조"
  dialog.sc-source-dialog[id aria-labelledby="{id}-title"]
    header > h2#{id}-title"참조" + button.sc-source-close[title=닫기 aria-label=참조 닫기](Dismiss20Regular)
    ul > selected.map(li > h3 > es + span{label} ; p{detail} ; url ? a[target=_blank rel=noopener noreferrer](Open20Regular "원문 열기") : p.sc-source-unavailable"원문 링크 미제공")
```
`es({source})` = `span.sc-source-mark.is-{kind}[aria-hidden] > (pdf→DocumentPdf20Regular | page→Globe20Regular | else Document20Regular)`. Dialog opened with `showModal()`; Escape closes.

### 4.3 Image gallery `nm({images[{src,alt}]})` + slides `tm({slides,title,initialIndex,labels})`
```
div.sc-image-gallery[style --image-columns:min(4,n)] > images.map(button.sc-image-thumb[title="{alt} 확대" aria-label] > img[src=B(src) alt] + span{alt + ZoomInRegular})
dialog.sc-image-dialog[aria-label=이미지 확대 보기] > h2"생성된 이미지" + button.sc-image-close[aria-label=확대 보기 닫기 title=닫기](DismissRegular) + {open && tm(slides=srcs, labels=alts, title="생성된 이미지", initialIndex)}
tm: div.sc-slides[onKeyDown ←/→]
      div.sc-slide-view > button.sc-slide-nav[title=이전 이미지 disabled at 0](ChevronLeftRegular) + div.sc-image-stage > img[src=B(slide) alt=labels[i] ?? "{title} {i+1}번째 이미지"] + button.sc-slide-nav[title=다음 이미지](ChevronRightRegular)
      div.sc-slide-bar > span[aria-live=polite] {i+1} " " i"/ {n}"
```
`B(p)` prefixes `/` (paths in JSON are relative like `graphic/event-poster/01-hands.png`).

### 4.4 Scout answer bubble `o7({text, at, date})`
```
div.sc-answer-body.sct-answer-bubble
  Cl(text)
  div.sct-answer-tools[role=group aria-label=답변 도구]
    {dateLabel && span.sct-answer-date[title="{date} · {at}"]{"6 Jul"-style en-GB day+month parsed from "YYYY년 M월 D일", else at}}
    button[aria-label/title = "답변 복사" | "복사됨" | "복사하지 못했습니다. 다시 시도해 주세요."] (copied ? Checkmark20Regular : Copy20Regular)   // navigator.clipboard
    button[aria-label=답변 저장](Save20Regular)   // downloads scout-response.txt
    span.sct-answer-status[role=status]{status text or ""}
```
Thought line `W5({seconds, text})`: label = seconds===undefined ? "Thought" : `Thought for {s}s`; with text → `details.sct-thought > summary(CheckmarkCircle16Regular + label) + p{text}`; without → `div.sct-thought > CheckmarkCircle16Regular + label`; null if neither.

### 4.5 Working / typing indicator `Ki({label="작업 중…", scout})`
```
p.cpw[.cpw-copilot unless scout][aria-live=polite]
  scout ? Mk() : span.cpw-shimmer-mark[style mask-image: url("data:image/svg+xml,<svg viewBox='341 341 400 400'><path d=Sk/><path d=Nk/></svg>") aria-hidden]   // Copilot mark silhouette, shimmer via background-clip:text
  span.cpw-t{label}
Mk({size=24}) = span.cpw-av[style width/height] > img[src=/logo/scout/scout-icon-outline.svg width/height = size*0.7 object-fit:contain aria-hidden]
```
Copilot mark paths: `Sk="M609.124 435.184L605.261 450.65H568.079C540.534 450.65 516.501 469.399 509.83 496.136L476.176 630.787H408.974C369.913 630.787 341.245 594.078 350.724 556.176L384.466 421.227C393.384 385.589 425.405 360.59 462.132 360.59H550.892C589.953 360.59 618.621 397.299 609.141 435.201L609.124 435.184Z"`, `Nk="M472.295 646.234L476.157 630.768H513.34C540.884 630.768 564.918 612.018 571.589 585.281L605.242 450.631H672.445C711.506 450.631 740.174 487.339 730.694 525.242L696.952 660.191C688.034 695.828 656.013 720.827 619.287 720.827H530.526C491.465 720.827 462.797 684.119 472.277 646.217L472.295 646.234Z"`.
Shown when `p.busy` (next message is an assistant and previous wasn't a tool, while playing).

### 4.6 Scout tool card `q5({message, active})`
```
div.sct-tool-flow
  W5(thoughtSeconds, thought)
  active ? [ div.sct-tool-progress > ChevronDown16Regular + "Running tools...",
             p.sct-tool-running[role=status] > span.sct-tool-spinner + "Running {tool}",
             card ]
  : message.expanded ? card
  : details.sct-tool-used > summary(CheckmarkCircle16Regular "Used 1 tool") + card
card = div.sct-tool-card
         div.sct-tool-heading > Wrench20Regular + span{tool} + small.sct-tool-status{active ? "Running" : status ?? "Completed"}
         {input && p.sct-tool-input[title]{input}}
         {!active && output!==undefined && details.sct-tool-output > summary"Output" + pre{output} ; p.sct-tool-output-preview{output}}
```
After a Scout approve is allowed, the approve message is re-rendered as `q5({role:"tool", tool:what, status:"Allowed", expanded:true, input: param lines + rows "label: value"})`.

### 4.7 Scout permission card `rk({a, denied, forSession, onScopeChange, onAllow, onDeny, onBack})`
```
div.sct-tool-flow
  {!denied && div.sct-tool-progress(ChevronDown16 "Running tools...") + p.sct-tool-running[role=status](span.sct-tool-spinner "Running {what}")}
  section.sct-permission[role=region aria-label="{what} permission"]
    div.sct-tool-heading > Wrench20Regular + span{what} + {kind && small{kind}} + button.sct-tool-settings[title=Tool parameters aria-expanded](Options20Regular)
    denied ? p.sct-tool-description[role=status]{a.denied ?? "Denied"} + button.sct-tool-deny"Try again"
    : {line && p.sct-tool-description{line}}
      {paramsOpen && (param|rows ? pre.sct-tool-parameters{[...param, ...rows.map("label: value")].join("\n")}) + (mail && div.sct-tool-mail > p(b"To:" to) p(b"Subject:" subject) body.map(p>ke) {sign && p})}
      {warn && p.sct-tool-warning{warn}}
      div.sct-tool-actions
        div.sct-tool-allow-group > button.sct-tool-allow{"Allow for this session"|"Allow once"} + button.sct-tool-scope[title=Approval options aria-expanded aria-haspopup=menu](ChevronDown16) + {open && div.sct-tool-menu[role=menu] > button[role=menuitemradio aria-checked]×["Allow once","Allow for this session"]}
        button.sct-tool-deny"Deny"
```
Allowed-for-session tools auto-approve on later identical `what`.

### 4.8 Cowork/Chat permission card `em({a, denied, onAllow, onDeny, onBack, note})` (`.wb-perm`)
Approve schema: `{what, kind?, line?, rows?[{label,value}], mail?{to,subject,body[],sign?}, warn?, go?, allowed?, denied?, param?[]}`.
```
pending:
div.wb-perm-box
  div.wb-perm[.is-mail if mail][role=dialog aria-label=Permission]
    div.wb-perm-head > span.wb-perm-ico[aria-hidden]{mail ? Me(outlook) : X.copy} + span.wb-perm-title{what} + {kind && span.wb-perm-kind{kind}}
    {rows && div.wb-perm-rows > rows.map(div.wb-perm-row > span.wb-perm-k{label} + span.wb-perm-v{value})}
    {mail && div.wb-perm-mail > div.wb-perm-rows(row "받는 사람" → span.wb-perm-v > b.wb-perm-to{to}; row "제목" → subject) + div.wb-perm-letter > body.map(p>ke) + {sign && p.wb-perm-sign}}
    div.wb-perm-foot > span.wb-perm-note{line ?? "승인하기 전에 세부 정보를 검토하세요."} + div.wb-perm-btns > button.wb-perm-b"취소" + button.wb-perm-b.is-go > span.wb-perm-bt{go && i.wb-perm-bi(X.mailSend)}{go ?? "승인"} + i.wb-perm-bx[aria-hidden](X.caretSm)
  {note && p.wb-perm-after{note}}          // cowork: span[aria-hidden]"⊙" + " 아래에 메시지를 보내면 편집 내용이 삭제되고 위의 작업이 취소됩니다." ; chat: "⚠ {warn}"
denied:
div.wb-perm.is-denied[role=status]
  div.wb-perm-head > span.wb-perm-ico(X.copy) + span.wb-perm-title{what}
  div.wb-perm-foot > span.wb-perm-note{a.denied ?? "거절하셨습니다. 여기서 멈춥니다."} + div.wb-perm-btns > button.wb-perm-b"다시 보기"
```
Allow → `st.allowed=true`, then `p.act()` after 600 ms. Mail fields are `re()`-substituted before rendering.

### 4.9 Schedule / automation card `n7` (`.wb-task`) — used when `approve.kind` matches `/^(schedule|automation)/`
rows looked up by label: 이름 (fallback rows[0].value ?? what), 반복 (split into cadence + time via `/^(.*?)[\s·]*((?:오전|오후)\s*[\d:시]+)/`), 다음에서 실행 (default "새 대화"), 설명 (default "메시지 입력..."), 지금 한 번 실행 (✓ unless value lacks "체크"); other rows listed plainly.
```
div.wb-task-box
  div.wb-task[role=dialog aria-label=되풀이 작업]
    div.wb-task-head > span.wb-task-ico(X.clock) + span.wb-task-title"되풀이 작업을 만드시겠습니까?"
    div.wb-task-rows
      div.wb-task-row > span.wb-task-k"이름:" + span.wb-task-v.is-plain{name}
      div.wb-task-row > span.wb-task-k"반복:" + span.wb-task-v > i.wb-task-dd{cadence we.chevron} + {time && i.wb-task-dd{time we.chevron}}
      div.wb-task-row > span.wb-task-k"다음에서 실행:" + span.wb-task-v > i.wb-task-dd{where we.chevron}
      extraRows.map(div.wb-task-row > span.wb-task-k"{label}:" + span.wb-task-v.is-plain{value})
    div.wb-task-memo > span.wb-task-k"설명" + p{desc}
    div.wb-task-foot > span.wb-task-once > i[aria-hidden]{"✓"|""} "지금 한 번 실행" + div.wb-task-btns > button.wb-task-b"취소" + button.wb-task-b.is-go > span.wb-task-bt"예약" + i.wb-task-bx(X.caretSm)
  {(warn ?? note) && p.wb-task-after}
denied: div.wb-task.is-denied[role=status] > head(X.clock, "되풀이 작업 만들기") + div.wb-task-foot > span.wb-task-note{a.denied ?? "자동 실행을 예약하지 않았습니다. 필요할 때 직접 실행할 수 있습니다."} + btns > button.wb-task-b"다시 보기"
```

### 4.10 Answer card `g7({c, vars})` (role `card{kind, icon?, body[], sources?[[label, text, tag]], note?}`)
```
div.wb-ans
  p.wb-ans-h > span[aria-hidden]{icon ?? "▤"} + b{kind} + span.wb-grow + i"Copilot Cowork 작성"
  div.wb-ans-b > body.map(p > ke(re(line)))
  {sources && div.wb-ans-src > b"근거" + sources.map(p > u{s[0]} + span{s[1]} + i[.is-new if s[2].includes("개정")]{s[2]})}
  {note && p.wb-ans-note}
```

### 4.11 Scout choice (inline) `Z0({choice, selected, onPick})`
```
section.sct-choice[.is-pending if onPick][aria-label=text]
  Cl(text)
  selected ? p.sct-choice-answer[role=status] > Checkmark20Regular + span"{A|B|C}. {label}"
           : div.sct-choice-options > options.map((o,i)=> button[disabled unless onPick] > span.sct-choice-letter{A+i} + span.sct-choice-copy > span.sct-choice-heading(strong{label} {recommended && span.sct-choice-rec"Recommended"} {meta && small}) + {desc && span.sct-choice-desc})
```
After pick (Scout): user bubble with `re(label)`, then `Ki(scout)` for 1200 ms, then reply as a Scout assistant message.

### 4.12 Coach layer — `J5`, `Qe`, `Pe`, `Jk`, `e7`, `Dt`, `ac`, `Ot`, `Xi`
`J5({children})` = `div.wb-tip-layer` (absolute, covers the app window, `pointer-events:none`, z 60). Inside it, one `Qe` at a time:
```
Qe({zone, dim=true, children})
  {rect && dim && (holes.length || !zone) && div.wb-tip-veil[style clip-path: path(evenodd, "M0 0H99999V99999H0Z <rounded-rect holes>") aria-hidden]}
  div.wb-tip.is-{side|none}[style left top visibility --tail:{px} --wb-tip-max?] > children      // children = Pe(...)
```
Geometry (constants `co=18` gap to target, `Ne=12` edge margin, `Pk=88` bottom offset when no zone, `Kn=30` min tail inset, `Rk=240` min side width, `Jl=6` hole padding, `$k=10` hole corner radius; extra holes always punched for `[data-coach="lit"]` and `.is-hunt`):
1. holes = bounding boxes (clipped by every overflow-hidden ancestor) of elements matching `zone` selectors (comma-separated), padded 6 px, plus lit/hunt elements not inside them; overlapping holes merged.
2. no zone → tip centered horizontally, `top = height - tipH - 88`, side `none`.
3. else try sides in order (`right,left,top,bottom` if target width < 55 % of container, else `top,bottom,right,left`); for left/right the tip width is capped to available width if ≥ 240 px (`--wb-tip-max`); first side whose tip rect overlaps no hole wins; else try the 4 corners; else least-overlapping side. `tail` = offset of the arrow along the tip edge, clamped 30..size-30.
4. when `dim=false` and no zone, sets `--wb-tip-clear: {tipH+16}px` on the app window so the stream bottom padding grows.
5. Target is `scrollIntoView({block: taller-than-scroller ? "start" : "center"})` once per target. Re-measured on ResizeObserver/MutationObserver/scroll.
Bubble `Pe({kind?, q, children})`:
```
div.wb-pick[.is-choice|.is-quiz]
  span.wb-pick-tail[aria-hidden]
  {kind && p.wb-pick-kind > i[aria-hidden]{icon} + say}     // choice: BranchFork20Regular 15, "선택한 기준에 따라 결과물이 달라집니다"; quiz: Target20Regular 15, "Quiz"
  p.wb-pick-q{q}                                             // white-space: pre-line (texts contain \n)
  children
```
Options `Jk({options,onPick})` (choice): `ul.wb-opts > li > button > span.wb-opt-n{i+1} + span.wb-opt-t > b{label} + em{desc + (meta ? " (meta)" : "")} + ArrowRightRegular[aria-hidden]`.
Spot quiz `e7({options, answer, holdMs=2600, onPick, onPass})`: `ul.wb-opts > li > button[class = (passed && i===answer ? "is-right":"") + (wrong===i ? " is-wrong":"")][disabled when passed] > span.wb-opt-n{i+1} + span.wb-opt-t > b{label} + ArrowRightRegular`; wrong pick re-triggers `is-wrong` shake and shows `Dt("다시 찾아 보세요.")`; right pick calls `onPick(option.at)` (lights the zone `.zone-{at}.is-lit`) and `onPass` after holdMs.
`Dt` = `p.wb-hunt-hint{children}`; `ac` = `p.wb-hunt-done "✓ " children`; `Ot({onClick,next,children})` = `button.sc-cue-btn > children + {next && ArrowRightRegular}`; `Xi` = `b.cp-key[aria-hidden]{icon}` (round black key badge used as "⬆ 을 눌러 보내 보세요.").
Coach texts (Cowork): cue → `Pe(q=cue.text, children = ask ? Dt(Xi(we.send) "을 눌러 보내 보세요.") : Ot(cue.action))` anchored to `.cwr-cbox`; review pause → q "Copilot Cowork의 답변입니다.\n내용을 확인한 뒤 이어서 진행해 주세요." (or "선택하신 기준으로 Copilot Cowork이 다시 정리한 내용입니다.\n…") + Ot(next,"이어서 보기") anchored `.cwr-hold`; approve → anchored `.wb-perm` / `.wb-task` with q "실행하기 전에 사람에게 한 번 확인합니다.\n확인하고 이상이 없다면 승인을 눌러주세요." (mail: "Copilot Cowork은 메일 초안까지만 작성합니다.\n내용을 확인하고 이상이 없다면 승인을 눌러주세요."; schedule: "실행 주기와 시점은 사람에게 먼저 확인합니다.\n일정을 확인하고 이상이 없다면 예약을 눌러주세요."); choice → `Pe(kind=choice, q=choice.text, Jk)` anchored `.cwr-hold` (or unanchored); hunt → `Pe(kind=quiz, q=hunt.text)` anchored `.wb-filepick` / `.wb-menu` / `.side` (at=rail) / `.cwr-cbox` (at=composer) with child `ac(hunt.does)` (+ `Ot(next,"이어서 보기")` if a menu is open) when solved, `Dt(Xi(send) "을 눌러 전송해 주세요.")` when a file is clipped, picker hints "첨부할 자료를 선택하고 ‘선택’을 눌러주세요." / "첨부할 파일을 선택하고 ‘열기’를 눌러주세요." / "파일 선택 영역을 눌러 첨부할 문서를 열어 보세요.", else `Dt(hunt.hint)`; made-artifact review → anchored `.cwr-fcard.is-cue` q "결과물이 완성되었습니다. 생성된 문서를 하나씩 열어 확인해 보세요." + Dt("대화창의 파일 카드를 눌러 열어 보세요." + b" {opened} / {total}") / with panel open q "결과물 내용을 확인해 보세요." + Ot("다음 결과물"|"다음 단계") / all seen q "결과물을 확인했습니다. 다음 작업을 이어갈까요?" + Ot("다음 단계"); done → dim=false, q "모든 작업이 완료되었습니다." + Dt("위로 올리면 처음부터 다시 볼 수 있습니다." + " 생성된 결과물은 대화창의 파일 카드를 눌러 다시 확인할 수 있습니다.") + Ot(next,"결과 보기").
Coach texts (chat-only `_v`): review pause q "{Ie[agent].name}의 답변입니다.\n내용을 확인한 뒤 이어서 진행해 주세요." + Ot(next,"이어서 보기"); Scout choice q "Microsoft Scout가 작업 방향을 확인하고 있습니다. 원하는 항목을 골라 주세요." anchored `.sct-choice.is-pending`; approve anchored `.sct-permission`/`.wb-perm`; spot (Scout rail variant) anchored `.sct-app [data-scout-nav='automations']` / `.sct-app .side`; spot generic → `Ev` = `Qe(zone = picked ? ".zone-{lit}" : null, dim = picked) > Pe(kind=quiz, q=spot.text, e7 + {picked && ac(spot.does)})`; slash search q "검색 목록이 열렸어요. 참고할 자료를 골라 붙여 볼까요?" + Dt("검색 목록에서 " b{pick.name} " 를 눌러 붙여 보세요.") anchored `[".wb-slash",".zone-composer"]`; cue anchored `.zone-composer`; done q "모든 작업이 완료되었습니다." + Ot(next,"결과물 보기").

### 4.13 Toast `p.wb-toast[.is-warn|.is-good][data-coach=over]` — fixed bottom-center pill, 2600 ms.

---

## 5. Booth screens

### 5.1 Attract `U0({limited})`
```
main.booth-attract[.is-limited][data-brand-theme=m365-combined][onClick → #/start unless limited]
  limited ? img.booth-attract-art[src=hero poster]
          : video.booth-attract-art[src=motion poster=hero autoPlay muted loop playsInline aria-hidden]   // portrait picks 9x16 assets
  div.booth-attract-say
    limited: img.booth-limited-logo[src=/logo/copilot/copilot-horiz-black.png alt=Copilot] + h1"더 큰 화면에서<br/>접속해 주세요" + p"PC나 태블릿에서 체험해 주세요.<br/>창을 작게 열었다면 크기를 늘려 주세요."
    normal : h1 > span.booth-lockup-hold(img.booth-lockup[src=/logo/copilot/copilot-horiz-black.png alt=Copilot] "과") " " "함께라면, " span"대학의 연구·교육·행정은 어떻게 달라질까요?"
             button.booth-cta"체험해보기"      // pulsing ring ::after
```
Assets `ao`: hero `/brand/hero/copilot-hero-light-16x9.png` | `-9x16.png`; motion `/brand/hero/copilot-hero-motion-light-16x9.mp4` | `-9x16.mp4`.

### 5.2 Home `G8` (#/start)
```
main.booth-home[data-brand-theme=copilot]
  svg.booth-paint-defs[aria-hidden focusable=false] > defs > pattern#copilot-green[patternUnits=userSpaceOnUse width=24 height=24] > image[href=/brand/signiture/copilot-signiture-green.png x=-12 y=-12 width=48 height=48 preserveAspectRatio="xMidYMid slice"]
  header.booth-hero.booth-home-head > div.booth-hero-inner.booth-home-copy
    h1.booth-home-title > span.booth-home-title-line > (span.booth-home-title-product > span.booth-home-lockup > img[src=/logo/copilot/copilot-lockup-horiz.png alt="Microsoft Copilot"] ; span"과") ; span"함께라면," ; span"대학의 연구·교육·행정은 어떻게 달라질까요?"
    p.booth-hero-about > span"캠퍼스 영역을 선택해 보세요." + span"Copilot이 연구·교육·학습·행정을 어떻게 바꾸는지 POSTECH 맞춤 시나리오로 체험해 보세요."
  ul.booth-track-grid > tracks.map(li > button.booth-track-card[data-track=id][disabled if 0 scenarios] > span.booth-track-inner > (t.kv ? img : span.booth-track-icon[aria-hidden]{K8[id] ?? emoji}) + div.booth-track-body > strong{name} + p{about})
  footer.booth-foot > span"© Microsoft 2026" + span.booth-em"POSTECH AI Experience"
```
Tracks `e8` (id/name/icon/color/textColor/about): research 연구 🔬 #b11f4b/#8e183c "국책과제 제안서, 장비 견적 비교와 실험 일정을 검토합니다."; education 교육 🎓 #0a6bba/#0a6bba "수업 문의 답변, 조교·연구생 선발과 온보딩을 준비합니다."; learning 학습 📚 #6c4bb6/#5b3ea0 "논문 요약, 해커톤 포스터와 캡스톤 자료를 만듭니다."; admin 행정 🏛️ #c8951a/#8a6410 "학과별 예산 취합, 연구비 편차 점검과 규정 문의를 돕습니다."; campus 산학·소통 🤝 #2b8a6e/#1f6852 "산학 협약서 초안, 장비 발주 검토와 보도자료를 준비합니다.". Each has `intro[0] = {tone:"problem", image:"/intro/{id}.png", icon, caption}` (used only as fallback caption/icon by `V5`). Track icons `K8`: research BeakerFilled, education HatGraduationFilled, learning LightbulbFilamentFilled, admin MoneyFilled, campus MegaphoneLoudFilled, dev CodeFilled — SVG paths filled with `url(#copilot-green)` pattern (`.booth-track-icon svg path{fill:url(#copilot-green);fill-opacity:.75}`). Card shape = `--booth-frame` SVG mask (rounded parallelogram 329×337).
Home background `.booth-home:before{background:url(/brand/gradient/sky-07.svg) center/cover}`.

### 5.3 Scenario list `ek({track})` (#/t/{track})
```
main.booth-list[data-track][data-expanded=bool][data-browsed=bool][data-brand-theme=copilot]
  style{ ::view-transition-group(scenario-{id}){z-index:{10-dist}; animation-delay:{expanded ? min(i*12,48) : 0}ms} }
  header.booth-hero > img.booth-hero-art[src=/brand/signiture/copilot-signature.png aria-hidden] + div.booth-hero-inner > button.booth-back(ArrowLeftRegular "캠퍼스 영역" → #/start) + h1{track.name} + p.booth-hero-about{track.about}
  {items.length && div.booth-view-bar > button.booth-view-action[aria-expanded] > (expanded ? SlideMultipleRegular : ColumnTripleRegular) + (expanded ? "하나씩 둘러보기" : "제품별 시나리오 보기")}
  expanded ? section#product-view.booth-product-guide[aria-label=제품별 체험] > div.booth-product-board > ["chat","cowork"].map(article[data-agent] > header > h2.sc-overview-product-name(span.sc-overview-copilot-logo > img[src=/logo/copilot/Copilot-logo-horiz-c-gray-rgb%201.png alt=Copilot] " " span.sc-overview-product-suffix{"Chat"|"Cowork"}) ; div.booth-product-body > p{description} + ul > li[style viewTransitionName=scenario-{id}] > button > span(strong{title} + span.booth-product-outcome{hook || summary}) + ArrowRightRegular)
  : items.length===0 ? p.booth-empty"아직 준비된 시나리오가 없습니다."
  : div#scenario-view.booth-orbit-stage[style --fan-k][onPointerDown/Up swipe ≥60px]
      ul.booth-orbit > items.map((it,i)=> li[data-product=madeApp][data-active=bool][data-soon][style --o:{offset} viewTransitionName]
          span.booth-orbit-stack[data-mark=logo aria-hidden] > last-3 apps.map(span[data-product=app] > img[src=/logo/m365/{app}.svg])
          button.booth-orbit-frame[aria-current] > span.booth-orbit-inner
              span.booth-marks > span.booth-skill{badge}                       // badge = Ie[agent].full ("Copilot Chat"/"Copilot Cowork") or "곧 공개"
              span.booth-orbit-text > strong{title} + {(before||hook) && dl.booth-story.booth-orbit-detail > {before && div > dt"AS-IS" dd{before}} {hook && div.is-hook > dt"TO-BE" dd{hook}}}
              scenario ? span.booth-orbit-cta.booth-orbit-detail"체험해보기" : span.booth-orbit-soon.booth-orbit-detail"다음 행사에서 공개합니다"
      nav.booth-orbit-nav[aria-label=체험 탐색] > div.booth-orbit-pager > button[aria-label=이전 시나리오](ChevronLeftRegular) + ol.booth-orbit-dots > li > button[aria-label="{i+1}번째 · {title}" aria-current] + button[aria-label=다음 시나리오](ChevronRightRegular)
  (fallback when no active index) ul.booth-cards > li[data-product][data-soon] > button.booth-card[disabled] > span.booth-skill{badge} + strong{title}
```
Product descriptions `J8`: chat "요약·초안·아이디어가 필요할 때, **대화로 빠르게** 해결합니다."; cowork "목표를 주면 **여러 앱과 파일에 걸친 작업**을 단계별로 실행합니다." (strong = `<strong>`). `--fan-k = round((1-cos(min(floor(n/2),2)·π/4))·1.4, 3)`. `--o` = circular offset of item from active (−⌊n/2⌋..⌊n/2⌋); CSS positions `transform: translate(calc(var(--o)*var(--orbit-step)), arc-y) scale(1 - |o|*.24)`, inactive cards blurred. Apps for the stack = `scenario.apps` or derived from artifacts (read first, then made); `data-product` = first `made` artifact app (`q0`). Model/effort are **not** shown on list cards (only title/badge/AS-IS/TO-BE); apps appear as the logo stack.

### 5.4 Play screen shell `_v({track, scenario})`
Steps `ok`: `["pain"?, "overview"?, "demo", "done"]` (`pain` always present since `V5` always returns a panel; `overview` when `scenario.overview.length`; **the "quiz" step is defined (`Ur.quiz="확인"`, component `lv`) but never pushed** — quiz data is validated but not shown in the current build). Labels `Ur`: pain 상황, overview 흐름, demo 체험, quiz 확인, done 결과.
```
main.sc[data-track][data-scenario][data-brand-theme=copilot]
  header.sc-head
    button.sc-back[aria-label="{track.name} 목록으로 돌아가기"](ArrowLeftRegular)
    div.sc-jump > button.sc-ghost(ArrowCounterclockwiseRegular "처음으로") + button.sc-ghost[disabled unless canBack](ArrowPreviousRegular "이전으로") + (lastStep ? button.sc-ghost(HomeRegular "홈으로" → #/) : button.sc-ghost("건너뛰기" NextRegular))
    div.sc-title > h1{title}
  ol.sc-steps[aria-label=진행 단계][style --n:{steps} --i:{current}] > steps.map(li[.on|.past][aria-current=step] > (past ? button[aria-label="{label} 단계로 돌아가기"]{label} : span{label}))
  step pain    → scenario.scene ? tv(scene) : M7(panel=V5(), title)
  step overview→ nv(agent, overview, hook)
  step quiz    → lv(quiz)
  step done    → N7(s, st, vars, completed=p.done)
  workbench    → div[style display: demo ? "contents" : "none"] > m7(...)      // persists
  demo && !workbench → div.sc-feed > div.desk-win.is-app > Mv(...) + J5(tips)
  {rewindFlash && p.sc-rewind[role=status]"한 걸음 되돌렸습니다"}   // 1600 ms after "이전으로" during demo
```
`.sc{display:grid;grid-template-rows:auto auto auto auto minmax(0,1fr)}` — head row 1, steps row 2; stage/scene/pain/done use `grid-row:4 / -1`, `.sc-feed` `grid-row:-2 / -1`, `.desk` `grid-row:4 / -1`.

### 5.5 Scene (intro) `tv({scene, onNext})` — `scene{eyebrow, art, artSlots{}, headline, sub, points[{icon,scene,say}]}`
**`eyebrow` and `sub` are not rendered.** `headline` is split on `‹‹`/`››`: odd segments → `<mark>`, even → `<span>`.
```
div.sc-scene[.has-photo if J7[art]][onClick=onNext]
  photo ? span.sc-illus[aria-hidden] > img[src]            // J7 is empty → never
        : {svg && span.sc-illus[aria-hidden ref dangerouslySetInnerHTML = A7(template, artSlots)]}
  span.sc-scene-head > strong > segments
  ul.sc-scene-grid > points.map((p,i)=> li[.is-in when i < shown] > i.sc-scene-ico[aria-hidden] > om(p.icon ?? "alert") + b.sc-scene-name{p.scene} + q{p.say})
  span.sc-scene-outro[style --outro-in:{points.length*(900+320)}ms] > span.sc-brandline[aria-hidden]("Work " em"lighter") + button.sc-start("Copilot과 해보기" ArrowRightRegular)
```
Points reveal one every 900+320 = 1220 ms. `A7(tpl, slots)` replaces every `{{name}}` with HTML-escaped `slots[name] ?? ""`. After injecting, direct children of the `<svg>` that are `rect/path/ellipse/circle/polygon` with a fill and bbox width ≥ 98 % of the viewBox width are hidden (`display:none`) — this strips the full-width sky/ground background rects so the art floats on the page gradient. All templates are `<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">`, use `class="il-fade il-d1..il-d6"` groups for staggered fade-in (`il-in .7s`, delays .1/.28/.46/.64/.82/1s) and motion classes `il-belt`, `il-drop`, `il-alert`, `il-ring`, `il-truck`, `il-dash` (dash offset crawl). Text uses `font-weight` 600/700/800 remapped to `--w-label/--w-title/--w-display` by CSS, font = `var(--booth-font)`.

Art template registry `Z7` (name → template var → slots read → what it draws):
| art name | var | slots (in order) | drawing |
|---|---|---|---|
| `quote-compare` | E7 | 업체1 금액1 업체2 금액2 업체3 금액3 배지 | blue-grey sky; three tilted white quote sheets (vendor label + price box) at left; a balance scale with two pans at right (`il-truck` sway); red-outlined pill badge bottom-right |
| `stock-risk` | _7 | 제목 큰수 단위 경고 배지 | warehouse shelving (3 shelves) with brown boxes thinning out downward + red depletion bar (`il-drop`); white KPI card (title, big number, unit, red warning); hourglass; red badge |
| `terms-review` | P7 | 왼쪽 오른쪽 개수 배지 | two documents side by side (left standard, right with pink highlighted lines pulsing `il-alert`); dashed double arrow between; magnifier circle with big red count; red badge |
| `resume-screening` | R7 | 원본제목 원본건수 문서1 문서2 출력제목 항목1 항목2 항목3 제외항목 | header text + big count; two tilted résumé docs (red / blue tab, table sketch); dashed arrow; green Excel-like output table with 3 column headers; bottom chip with excluded item |
| `competitor-newsletter` | $7 | 수집제목 수집건수 수집범위 원본제목 수집항목1..3 필터제목 제외건수 제외내역 결과제목 결과건수 출력제목 열1 열2 회사1 상태1 … 회사4 상태4 후속작업 | stacked source cards (1 check green, 2 red x rows); funnel with check; excluded-count pink box below; green result table (4 company rows, 2 columns); follow-up note |
| `event-poster` | T7 | 시안제목 시안수 시안1..4 선택 브랜드제목 색1 색2 색3 브랜드설명 결과제목 결과수 포스터 티셔츠 일치율 인쇄안내 | 2×2 poster thumbnails (hands / bulb / rocket / whiteboard sketches); brand card with three colour swatches (`fill="{{색1}}"` etc. — slots are used as SVG fill colours); result poster + T-shirt outline using the brand colours; match-rate and print note |
| `policy-inquiry` | F7 | 자료제목 자료시점 문서제목 제도1 기간1 제도2 기간2 예외 답변제목 가정 계산설명 계산식 계산결과 결과범위 확인안내 조회범위 | HR document card (two policy rows + exception); magnifier; answer: blue assumption banner, speech-bubble card with formula and big green result; footer notes |
| `meeting-followup` | L7 | 자료제목 고객 자료시점 보안범위 작업제목 작업1..5 기한1..5 결과제목 결과상태 결과설명 확인안내 | stacked customer doc; task table with 5 rows (task + green due date); mail envelope card with status |
| `attendance-alert` | B7 | 자료제목 대상 자료시점 작업제목 이상건 작업1..4 기한1..4 결과제목 결과상태 결과설명 확인안내 | attendance grid with 3 coloured anomaly cells; task list; envelope + clock badge |
| `budget-variance` | D7 | inputTitle inputDate tableTitle departmentHeader budgetHeader department1..4 budget1..4 totalLabel totalBudget deadlineLabel deadlineDate scopeNote quarterEnd | two tilted input sheets; dashed arrow; large summary table (4 rows + total); deadline card top-right; footer notes (green palette) |
| `server-health` | O7 | dashboardTitle alertCount serverCount trendTitle currentValue threshold startDate endDate riskLabel | dashboard card with 5×5 grid of `<use href="#shServer">` server tiles + green alert pill; trend chart card with dashed red threshold and rising orange line; orange risk pill |
| `log-analysis` | I7 | logTitle accessLabel accessRows appLabel appRows windowLabel thresholdLabel peakLabel timelineLabel conclusionLabel | two log-source cards; big chart with spike line (red) and threshold; timeline bar; conclusion |
| `brand-proposal`, `deck-translation` | rd | title sourceLabel sourceTitle productName sourceCopy resultLabel resultTitle productName resultCopy scope coverage review | source document card (yellow note) → arrow → result card (green note + table grid); footer scope/coverage; review line |
| `incident-runbook` | H7 | title scope catalog primary companion archived otherService otherError unapproved eligible condition appBranch appSource dbBranch dbSource matches excluded boundary | runbook catalog list (2 green eligible, 4 grey excluded) → arrow → two branch cards (green app / blue db) |
| `delay-response` | V7 | 재고라벨 현재고 사용량 지연라벨 기존납기 변경납기 공백라벨 공백설명 대응라벨 대응1 대응2 대응3 | inventory card (big number, red progress bar, boxes); delivery timeline with grey→red dots; pink gap box; response card with 3 option rows |
| `budget-pivot` | U7 | 입력라벨 정리라벨 표제목 열1 열2 행1 값1 행2 값2 행3 값3 마감라벨 | three tilted input slips (gold/green/blue tabs) → arrow → gold-framed pivot table (3 rows) with deadline line (warm palette) |
| `quarter-closing-report` | W7 | 확정라벨 항목열 금액열 항목1 금액1 … 항목3 금액3 확정메모 보고서제목 빈줄안내 기한 | confirmed-figures table with green check → arrow → report page skeleton with blank-line prompt and red deadline |
| `onboarding-plan` | q7 | 달력제목 주차열 내용열 주1 주2 주3 달력메모 계정제목 계정1 계정2 계정상태 일정제목 사람1 사람2 사람3 디데이 입사일 직무 직무메모 | purple weekly calendar table; accounts card; schedule card with 3 people; big D-day circle |
| `contract-draft` | Q7 | 메일라벨 메일1 메일2 메일3 정리라벨 계약서제목 조건1 값1 … 조건3 값3 조건4 미확정 근거메모 | three tilted mails with coloured tag pills → arrow → blue-framed contract card (3 agreed rows + 1 undecided pink pill) |
| `tech-inquiry-reply` | K7 | 문의제목 문의시각 질문1..5 문서1 문서2 답변가능 확인필요 | inquiry card with 5 numbered questions (5th red) → arrow → two reference docs; green "answerable" and red "needs check" pills |
| `receipt-expense` | G7 | 영수증라벨 금액1 금액2 금액3 대조라벨 일정제목 일정1 일정2 일정3 일정메모 중복라벨 중복값 한도라벨 한도값 | three tilted receipts → arrow → schedule card (3 rows + memo); pink duplicate box and amber limit box |
| `press-release-draft` | X7 | 정보제목 정보1..4 정보메모 형식라벨 아카이브 초안제목 확인문구1 확인문구2 초안메모 | info card (orange tab, 4 lines) → arrow → faded archive card behind orange-framed draft card with two pink "check" chips |
| `standup-catchup` | Y7 | 회의제목 회의시간 발언1..5 불참라벨 확정제목 확정1 확정2 미정제목 미정1 미정메모 | meeting transcript card with timeline dots (2 highlighted teal) + pink "absent" pill → arrow → confirmed card (teal frame) and undecided card |
Legacy `C7` (scm/sales/finance/marketing/hr/dev) single-line SVGs are only used when `scene.art` is not in `Z7` (never for current data). Scenario→art mapping in data: policy-inquiry, budget-pivot, budget-variance, terms-review, contract-draft, press-release-draft, tech-inquiry-reply, onboarding-plan, resume-screening, quarter-closing-report, event-poster, competitor-newsletter, brand-proposal, quote-compare, delay-response (one each).

### 5.6 Pain fallback `M7({panel, title, onNext})` (only when `scenario.scene` is absent)
`panel = V5()` = `{tone:"problem", image:"/intro/{track}/{id}.png", icon?, caption: before ?? summary ?? track.intro caption}`.
```
button.sc-pain[aria-label=다음으로]
  image ok ? img[src onError→hide] : span.sc-pain-hold[aria-hidden]{icon ?? "🗂️"}
  span.sc-pain-say > em{title} + strong{caption} + i"화면을 눌러 다음으로"
```

### 5.7 Overview `nv({agent, steps, hook, onNext})` — `overview[{icon,title,desc}]` (**icon not rendered here**)
```
div.sc-stage.sc-stage-sky
  div.sc-stage-head > h2 > (scout ? span.sc-overview-product-name > img.sc-overview-product-mark[src=/logo/scout/scout-symbol-rgb.png] + span.sc-overview-product-suffix"Microsoft Scout" + span.sc-overview-product-particle"와"
                              : span.sc-overview-product-name > span.sc-overview-copilot-logo > img[src=/logo/copilot/Copilot-logo-horiz-c-gray-rgb%201.png alt=Copilot] " " span.sc-overview-product-suffix{"Cowork"|"Chat"} span.sc-overview-product-particle{"와"|"과"}) " " "함께라면?"
                      + {hook && span.sc-hook{hook}}
  ol.sc-flow[.is-tappable until all shown][style --shown --n][onClick=reveal next] > steps.map((s,i)=> li.sc-flow-step[.is-in if i<shown][.is-next if i===shown] > span.sc-flow-no{i+1} + span.sc-flow-body > strong{title} + p{desc})
  div.sc-outro[.is-done when all shown] > done ? p.sc-ready"Ready?" + button.sc-start"지금 시작하기" : button.sc-flow-more > i + ("칸을 눌러 하나씩 열어보세요" | "다음 칸을 눌러 보세요 ({shown} / {n})")
```
`.sc-overview-copilot-logo` crops the horizontal Copilot logo to the symbol (`width: calc(1741em/403)`, img offset).

### 5.8 Quiz `lv({questions, onPass})` (component exists; step not scheduled)
```
div.sc-stage > p.sc-quiz-count("확인 문제 {i+1} " i"/ {n}") + h2.sc-stage-title{text} + ul.sc-choices > li > button.sc-choice[.is-wrong] > span[aria-hidden]{i+1} + option ; {wrong && p.sc-retry"다시 골라 보세요."}
passed: div.sc-stage.sc-pass > span.sc-pass-badge"시나리오 패스" + h2.sc-stage-title"{n}문제 모두 맞히셨습니다" + p.sc-pass-next"결과물을 보여 드립니다…"   // onPass after 1800 ms
```

### 5.9 Finish / recap `N7({s, st, vars, completed})`
Data: `recap[{icon,name,desc}]`, `finish{sub, outs?[{app,name,note}], outsBy?{id→outs}}` (`b7` picks `outsBy[id]` for first id in ids else `outs`). made = opened made artifacts (fallback: all made artifacts); `hasArt` = chat-only with top-level `artifact`; `talk` = no artifacts but outs.
```
div.sc-done.sc-stage-sky[.is-split when made|art|talk][.has-deck-report when doc.kind==="deck" && artifact]
  {made.length && j7(made, madeLabel="{Ie[agent].name} 생성")}
  {hasArt && section.sc-done-doc.is-art[aria-label=생성된 결과물] > ld(artifact, bare)}
  {talk && section.sc-done-doc.is-talk > u"생성된 결과물" + ul.sc-outs > outs.map(li > Me(app) + b{name})}
  div.sc-done-side
    div.sc-done-head > h2 > (completed ? k7(agent) + span{agent==="chat" ? "과 함께" : "와 함께"} : img[src=/logo/copilot/copilot-lockup-horiz.png alt="Microsoft Copilot"] + span"체험 미완료")
                    + p{completed ? finish.sub ?? hook ?? summary : "체험을 끝까지 진행하지 않았습니다."}
    div.sc-done-grid
      {outs && !made && !talk && section.sc-done-sec[aria-label=생성된 결과물] > u"생성된 결과물" + ul.sc-outs > li > Me(app) + b{name}}
      {deck report && section.sc-done-sec.is-art > u"검수 리포트" + ld(artifact)}
      {recap.length && section.sc-done-sec.is-quiet > ul.sc-recap > recap.map(li > span.sc-recap-icon[aria-hidden] > om(icon) + div > strong{name} + p{re(desc)})}
    {completed && S7()}      // QR button
```
`k7({agent, particle})` = same product-name markup as §5.7 without particle. Out cards `.sc-outs li` are white pills with app icon + name (**`note` is not rendered**). QR `S7`: preloads `/industry-summit/copilot-garage-qr.png`; renders `button.sc-done-qr-btn[aria-haspopup=dialog](QrCode24Regular "Copilot Garage QR 확인")` + `dialog.sc-qr-dialog[aria-label="Copilot Garage QR 코드"] > div > button.sc-qr-close(Dismiss20Regular) + h2"Copilot Garage" + img`.

---

## 6. Icon system (`om({name, className})` ↔ map `v7`)

`om` renders `span[className aria-hidden dangerouslySetInnerHTML=v7[name]]` (null when unknown). Used by scene points (`i.sc-scene-ico`, default `"alert"`) and recap (`span.sc-recap-icon`). Overview `icon` values exist in data but are not rendered. Every entry is a 24×24 stroke icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">…</svg>` (check uses stroke-width 2.6). Inner markup:

| name | inner SVG | meaning |
|---|---|---|
| box | `<path d="M21 8.4 12 3.8 3 8.4v7.2L12 20.2l9-4.6Z"/><path d="m3 8.4 9 4.6 9-4.6"/><path d="M12 13v7.2"/>` | package/cube |
| briefcase | `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.6A1.6 1.6 0 0 1 10.1 4h3.8a1.6 1.6 0 0 1 1.6 1.6V7"/><path d="M3 12.2h18"/>` | briefcase |
| chart | `<path d="M3 20.5h18"/><path d="M6.5 20.5v-5.5"/><path d="M11 20.5V8.5"/><path d="M15.5 20.5v-8"/><path d="M20 20.5V5"/>` | bar chart |
| megaphone | `<path d="M3.5 10.5v3a1 1 0 0 0 1 1h2l5.5 4V5.5l-5.5 4h-2a1 1 0 0 0-1 1Z"/><path d="M15.5 8.6a4.4 4.4 0 0 1 0 6.8"/><path d="M18.4 5.8a8 8 0 0 1 0 12.4"/>` | announcement |
| people | `<circle cx="9" cy="8" r="3.1"/><path d="M3.2 20a5.8 5.8 0 0 1 11.6 0"/><path d="M16.2 5.4a3.1 3.1 0 0 1 0 5.9"/><path d="M18.4 20a5.6 5.6 0 0 0-2.8-4.8"/>` | two people |
| code | `<path d="m8.5 8-4.5 4 4.5 4"/><path d="m15.5 8 4.5 4-4.5 4"/><path d="m13.4 5.2-2.8 13.6"/>` | `</>` |
| clock | `<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.2 2"/>` | clock |
| calx | `<rect x="3.4" y="5" width="17.2" height="15.6" rx="2"/><path d="M3.4 9.6h17.2"/><path d="M8 3.2v3.6M16 3.2v3.6"/><path d="m10.2 13.6 3.6 3.6M13.8 13.6l-3.6 3.6"/>` | calendar with X (cancel/deadline) |
| scales | `<path d="M12 4.4v15.2"/><path d="M7.2 19.6h9.6"/><path d="M4.4 8.2h15.2"/><path d="M4.4 8.2 2 13.6h4.8Z"/><path d="M19.6 8.2 17.2 13.6H22Z"/>` | balance scale |
| split | `<path d="M12 3.2v5.6"/><path d="m12 8.8-5.4 4.4"/><path d="m12 8.8 5.4 4.4"/><rect x="1.8" y="13.6" width="8.6" height="6.4" rx="1.6"/><rect x="13.6" y="13.6" width="8.6" height="6.4" rx="1.6"/>` | fork into two boxes |
| docsearch | `<path d="M13.6 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.4Z"/><path d="M13.6 3v5.4H19"/><circle cx="11.4" cy="13.8" r="2.6"/><path d="m13.3 15.7 2 2"/>` | document + magnifier |
| calc | `<rect x="4.2" y="3" width="15.6" height="18" rx="2"/><path d="M8 7.2h8"/><path d="M8.4 12h.01M12 12h.01M15.6 12h.01M8.4 16h.01M12 16h.01M15.6 16h.01"/>` | calculator |
| target | `<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>` | bullseye |
| mail | `<rect x="2.6" y="5" width="18.8" height="14" rx="2"/><path d="m3.2 7 8.8 5.8L20.8 7"/>` | envelope |
| share | `<circle cx="18" cy="5.4" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.6" r="2.5"/><path d="m8.2 10.8 7.6-4.2M8.2 13.2l7.6 4.2"/>` | share nodes |
| checkdoc | `<path d="M19 11.4V8.4L14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.6"/><path d="M14 3v5.4h5"/><path d="m14.4 17.8 2.2 2.2 4.2-4.4"/>` | document with check |
| factory | `<path d="M2.8 20.4h18.4"/><path d="M4.4 20.4V10.2l5 3.4v-3.4l5 3.4v-3.4l5 3.4v6.8"/><path d="M4.4 10.2 5.2 4h3l.6 4.2"/>` | factory |
| coin | `<circle cx="12" cy="12" r="8.6"/><path d="M12 6.8v10.4"/><path d="M14.7 9.6c0-1.1-1.2-1.9-2.7-1.9s-2.7.8-2.7 1.9 1.1 1.7 2.7 2 2.9.9 2.9 2.1-1.3 2-2.9 2-2.9-.9-2.9-2"/>` | dollar coin |
| network | `<circle cx="12" cy="4.8" r="2.3"/><circle cx="5" cy="18.4" r="2.3"/><circle cx="19" cy="18.4" r="2.3"/><path d="M12 7.1v4.6M12 11.7 6.4 16.5M12 11.7l5.6 4.8"/>` | 3-node tree |
| alert | `<path d="M12 4.2 2.6 20.2h18.8Z"/><path d="M12 10v4.2"/><path d="M12 17.2h.01"/>` | warning triangle |
| bolt | `<path d="M13.4 2.8 5 14h6.2l-1 7.2L19 10h-6.2Z"/>` | lightning |
| sliders | `<path d="M3.4 8h9.2M17.2 8h3.4"/><circle cx="15" cy="8" r="2.2"/><path d="M3.4 16h4M11.4 16h9.2"/><circle cx="9.2" cy="16" r="2.2"/>` | two sliders |
| link | `<path d="M10.4 13.6a3.6 3.6 0 0 0 5.2 0l2.8-2.8a3.7 3.7 0 0 0-5.2-5.2l-1.4 1.4"/><path d="M13.6 10.4a3.6 3.6 0 0 0-5.2 0l-2.8 2.8a3.7 3.7 0 0 0 5.2 5.2l1.4-1.4"/>` | chain link |
| check | (stroke-width 2.6) `<path d="m4.8 12.6 4.8 4.8L19.4 7"/>` | check mark |
| send | `<path d="M3.6 11.6 20.4 4l-4 16.4-4.6-6.2Z"/><path d="m11.8 14.2 8.6-10.2"/>` | paper plane |
| truck | `<path d="M2.8 6.6h10.6v10.2H2.8Z"/><path d="M13.4 10h3.4l3 3.2v3.6h-6.4Z"/><circle cx="7" cy="18.6" r="1.9"/><circle cx="17" cy="18.6" r="1.9"/>` | truck |
| refresh | `<path d="M20.2 12a8.2 8.2 0 1 1-2.6-6"/><path d="M20.4 4v5h-5"/>` | refresh arrow |
| gauge | `<path d="M4 17.4a8.6 8.6 0 1 1 16 0"/><path d="m12 13.6 4-3.4"/><circle cx="12" cy="16.4" r="1.4" fill="currentColor" stroke="none"/>` | speedometer |
| shield | `<path d="M12 3.2 4.6 6v5.6c0 4.4 3.1 7.9 7.4 9.2 4.3-1.3 7.4-4.8 7.4-9.2V6Z"/><path d="m9.2 12.2 2 2 3.6-3.8"/>` | shield check |

Icon names actually used in data: docsearch 26, checkdoc 20, calc 16, shield 16, target 15, clock 14, link 13, sliders 13, scales 11, refresh 8, calx 7, split 7, alert 6, people 6, check 5, network 5, megaphone 5, mail 3, chart 2, coin 2, send 1, share 1 (all present in `v7`).

### 6.1 Brand / logo image paths (all served from site root; `B(p)` adds leading `/`)
| path | used where |
|---|---|
| `/logo/copilot/copilot.png` | favicon; `Me("chat")`; `.sc-act-ico` tool-row icon |
| `/logo/copilot/copilot-horiz-black.png` | attract h1 lockup; limited-screen logo |
| `/logo/copilot/copilot-lockup-horiz.png` | home title lockup; done-screen "체험 미완료" header |
| `/logo/copilot/Copilot-logo-horiz-c-gray-rgb%201.png` | `.sc-overview-copilot-logo` (overview head, done head, product board header) |
| `/logo/copilot/copilot-symbol-rbg.svg` | `ao.mark` (defined, unused) |
| `/logo/m365/{excel,outlook,powerpoint,teams,word}.svg` | `Me(app)` everywhere; orbit logo stack |
| `/logo/scout/scout-symbol-rgb.png` | Scout overview/done product mark |
| `/logo/scout/scout-icon-outline.svg` | Scout working avatar `Mk` |
| `/brand/signiture/copilot-signature.png` | list hero art (`.booth-hero-art`); `ao.homeHero` |
| `/brand/signiture/copilot-signiture-green.png` | SVG pattern fill for track icons |
| `/brand/hero/copilot-hero-light-{16x9,9x16}.png`, `/brand/hero/copilot-hero-motion-light-{16x9,9x16}.mp4` | attract |
| `/brand/gradient/sky-07.svg` | home background (CSS) |
| `/brand/gradient/sky-02.svg` | `.sc-stage-sky` background (overview/done; prefetched in index.html) |
| `/brand/m365-icon-gradient/{excel,onenote,outlook,powerpoint,teams,word}.png`, `/graphic/kv-*.png` | referenced (preloaded) but unused |
| `/industry-summit/copilot-garage-qr.png` | done-screen QR dialog |
| `/intro/{track}/{id}.png`, `/intro/{track}.png` | pain fallback image (only when `scene` missing) |
| `/font/PretendardVariable.woff2`, `/font/Segoe-sans.woff2|woff`, `/font/Segoe-sans-Italic.woff2|woff`, `/font/Segoe-Serif.ttf`, `/font/Segoe-Serif-Italic.ttf` | @font-face |
| `graphic/event-poster/0{1..6}-*.png` | scenario images/slides (relative in JSON, prefixed by `B`) |

---

## 7. Typography / theme

### 7.1 Fonts
`@font-face`: "Pretendard Variable" (woff2-variations, weight 45–920), "Segoe Sans" (normal + italic, 100–900), "Segoe Serif" (ttf normal + italic).
`--booth-font: "Segoe Sans","Segoe UI Variable Display","Segoe UI","Pretendard Variable",Pretendard,"Malgun Gothic",system-ui,sans-serif` — used by `body`, booth screens, `.sc` stage/scene/done, scene-art SVG text, and as Fluent `fontFamilyBase`.
`--desk-font: "Segoe UI Variable Display","Segoe UI","Segoe Sans","Pretendard Variable",Pretendard,system-ui,-apple-system,sans-serif` — used by `.desk`, `.cp-app`, `.sct-app`, `.sc-shell.is-*` (the imitation app windows). `.cp-app` also declares its own `--font: "Segoe UI Variable Display","Segoe UI","Malgun Gothic",system-ui,-apple-system,sans-serif` then overrides to `var(--desk-font)` later in the sheet.
Serif accents: `.sc-ready` ("Ready?"), `.sc-brandline` ("Work lighter"), `.booth-em` use `"Segoe Serif", Georgia, "Times New Roman", serif` italic.
Weights via tokens: `--w-display:700`, `--w-title:620`, `--w-label:580`; tracking tokens `--track-display/--track-title/--track-body/--track-label: 0`. Body size `--booth-body:18px` on `.booth-root`. `word-break:keep-all` globally.

### 7.2 Root CSS variables (`:root`, index.pretty.css 2025–2068)
```
--dark-blue:#0a0a2a; --dark-blue-2:#1b1b45; --blue:#0a6bba; --cyan:#4fc3f7; --light-blue:#e7f3fb;
--booth-gutter:clamp(24px,4vw,64px); --hero-inset:var(--booth-gutter); --booth-max:1400px;
--track-cols:3; --card-cols:repeat(auto-fill,minmax(360px,1fr)); --panel-cols:repeat(auto-fit,minmax(300px,1fr));
--copilot-ui-accent:var(--copilot-overlap-blue,#4dd2e3); --copilot-ui-accent-alt:var(--copilot-overlap-green,#aee02f);
--copilot-ink:var(--copilot-black,#242424); --copilot-ink-2:#605e5c; --copilot-ink-3:#8a8886;
--copilot-canvas:var(--copilot-neutral,#f6f9f0); --copilot-surface:#fff; --copilot-line:#deded8;
--sc-warn:#c4314b; --sc-caution:#b7791f; --sc-good:#107c41; --sc-info:#0f6cbd; --sc-miss:#e76740; --sc-miss-ink:#b63c16;
--booth-tile:#eeeeec; --booth-tile-strong:#e7e7e4;
--shadow4:0 2px 4px rgba(36,36,36,.08),0 0 2px rgba(36,36,36,.06); --shadow16:0 8px 16px rgba(36,36,36,.14),0 0 2px rgba(36,36,36,.12);
--copilot-hero-bg:#f6f9f2; --vh:calc(1vh / var(--booth-zoom,1)); --vw:calc(1vw / var(--booth-zoom,1));
--booth-frame:url("data:image/svg+xml,…viewBox='0 0 329 337' rounded-parallelogram path…")   // track-card mask
```
Second `:root` (9956): `--desk-font`. Third (10353): `--cp-primary:#242424; --cp-cue:#4dd2e3; --cp-cue-rgb:77,210,227; --cp-cue-ink:#242424; --cp-pick:#4dd2e3; --cp-pick-ink:#242424`.
Set from JS on `<html>`: `--copilot-neutral`, `--copilot-black`, `--copilot-overlap-green`, `--copilot-overlap-blue`, `--m365-word-{bright:#0054D3,light:#4DACFF,dark:#002866}`, `--m365-excel-{#359238,#C7F5B7,#1B4A1D}`, `--m365-outlook-{#00AEE2,#B1F7FF,#004255}`, `--m365-powerpoint-{#FF5900,#FFD2BE,#662300}`, `--m365-teams-{#9443FF,#C5B7FF,#2C0066}`, `--m365-onenote-{#DE4AFF,#FFA5F0,#530066}`, `--track-{research|education|learning|admin|campus}` and `-ink` (track colours above), `--booth-zoom`.
`.sc` defines the scenario palette aliases: `--sc-canvas/--sc-surface/--sc-line/--sc-ink/--sc-ink-2/--sc-ink-3` (from `--copilot-*`), `--sc-copilot:var(--copilot-black)`, `--sc-cue:#0a6bba` + alpha variants `--sc-cue-14/35/40/50/0`, `--sc-zone:#aee02f` + `--sc-zone-60/45/28/14/8/0`, `--sc-lit:#4dd2e3` + `--sc-lit-60/45/28/0`.
`.cp-app` palette: `--bg:#fff; --text-1:#242424; --text-2:#5d5d5d; --text-3:#707070; --hover:#f5f5f5; --selected:#ededed; --pill:#eaeaea; --pill-stroke:#dcdcdc; --divider:#eaeaea; --stroke:#d6d6d6; --composer-stroke:#dcdcdc; --dark:#242424; --skeleton:#f1f1f1; --brand:linear-gradient(120deg,#2b6be0 0%,#7a5cff 48%,#e0559a 100%)` (overridden to `var(--cp-primary)` = flat #242424 later); `--shadow:0 1px 2px rgba(0,0,0,.06),0 4px 14px rgba(0,0,0,.08); --cw-side:228px`.
`.sct-app` palette: `--main-bg:#fdfcfb; --side-bg:#eae8e4; --hover:#e3e1dd; --selected:#dcdad6; --divider:#e2e0dc; --stroke:#d7d5d1; --text-1:#242424; --text-2:#5c5c5c; --text-3:#8a8a88; --bubble:#e8e6e2; --bubble-ai:#f2f1ee; --sct-side:232px`.
`.desk` defaults `--track:#2b6be0; --track-ink:#2b6be0`; `.desk-win.is-doc[data-app=…]` overrides `--track/--track-soft/--track-ink` with the M365 product colours; `[data-track=…]` on `main.sc`/`.booth-list` sets `--track/--track-ink` to the track colour (used by `.wb-pick`, `.wb-opts`, `.wb-xl-ref.is-live`, `.sc-ribbon-tabs i.on`).
`data-brand-theme` attributes (`copilot`, `m365-combined`) are emitted but **have no CSS rules**.

### 7.3 Layout notes for the fixed 1371×768 design
- Booth screens use `--vh/--vw` clamps so they scale with `zoom`; orientation media queries (`(orientation: landscape|portrait)`) switch grid shapes (e.g. `.sc-stage:has(.sc-flow)` becomes 2-column head/flow in landscape; `.sc-scene` 2-column with art left; `.sc-done.is-split` 2-column).
- `.desk` / `.sc-feed` give the app window a grey `#e6e6e6` desk with `clamp(12px, 1.4vh, 24px)` padding; `.desk-win` is a rounded (`clamp(8px,.7vw,14px)`) white window with shadow; `.desk.has-doc` splits 1.26fr/0.74fr.
- Stream width caps: `.cp-app .conv`, `.cwr-wrap`, `.cwr-cbox`, `.composer-dock` max 820px; `.sct-app .conv` 960px; `.sc-stream` 860px.
- Small-screen fallbacks exist (`max-width:700px` collapses the cowork rail into a top row and makes the panel an overlay; `max-width:620px` single-column booth grids), but the booth is normally scaled instead.

---

## 8. Playback timing constants (for faithful re-implementation)
- `H5(msg)` auto-advance delay: cue/spot/approve/choice/hunt → 0 (they pause); explicit `delayMs` wins; card 1200; note 400; tool 900; user 700; assistant `min(6000, 900 + text.length*42)`. Divided by speed (`st.speed`, default 1). After "이전으로" (`back`) the next delay is at least `tk=1500` ms.
- `p.busy` (working indicator) shows while the next message is an assistant not preceded by a tool.
- Cowork: `i7=1100` ms after a choice pick before the reply/continue; `a7=320` ms per row/block while `writing`; `c7=260` ms per slide while translating (`moving`); approve auto-continue 600 ms after allow; hunt auto-continue 700 ms after solve; review pause (`Y`) after every assistant message in Cowork (and in chat-only surfaces: `F`); toast 2600 ms; attach menu / pickers as described.
- Chat-only: spot hold `hs=2600` ms after a right answer; Scout choice reply after 1200 ms then auto-advance after `max(2600, H5(reply))`; rewind flash `zv=1600` ms; slash pick typing 850 ms, pick highlight 460 ms.
- Scene points `900+320=1220` ms apart; quiz pass `ov=1800` ms; idle → attract `V0=300000` ms.
- Scroll: streams auto-scroll to bottom on each new message (`scrollTo({top:scrollHeight,behavior:"smooth"})`); a "맨 아래로" button (`.cwr-down`/`.sct-down`) appears when more than 40 px from the bottom.
