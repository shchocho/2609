// 시나리오 하나를 처음부터 결과 화면까지 자동으로 진행한다.
// node e2e.cjs <track> <id> <outdir> [--deny]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const B = process.env.BASE || 'http://localhost:5173/';
const [track, id, OUT = 'e2e'] = process.argv.slice(2);
const DENY_FIRST = process.argv.includes('--deny');
const scen = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'scenarios', track, id + '.scenario.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + String(e).slice(0, 300)));
  let shot = 0;
  const log = [];
  const snap = async tag => { shot++; await page.screenshot({ path: `${OUT}/${id}-${String(shot).padStart(2, '0')}-${tag}.png` }); };
  const vis = async sel => { const l = page.locator(sel); const n = await l.count(); for (let i = 0; i < n; i++) if (await l.nth(i).isVisible()) return l.nth(i); return null; };
  const click = async (sel, tag) => { const el = await vis(sel); if (!el) return false; await el.click({ force: true, timeout: 3000 }); log.push(tag); return true; };
  const unstable = [];

  await page.goto(B + '#/start', { waitUntil: 'networkidle' });
  await page.goto(B + `#/t/${track}/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.sc-scene, .sc-pain');
  await page.waitForTimeout(500);
  for (let i = 0; i < 10; i++) { if (!(await click('.sc-flow-more', 'flow'))) break; await page.waitForTimeout(150); }
  await click('.sc-outro .sc-start', 'start');
  await page.waitForTimeout(1500);


  const hunts = scen.messages.filter(m => m.role === 'hunt');
  let denied = false, spotTry = 0, idle = 0, lastSig = '', done = false, iter = 0, shotEvery = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 600000 && iter < 400) {
    iter++;
    if (await page.locator('.sc-done').count()) { done = true; break; }
    const tipText = (await (await vis('.wb-tip'))?.innerText().catch(() => '')) || '';
    let acted = false;
    // 1) 권한 확인
    if (!acted && await vis('.wb-perm:not(.is-denied) .wb-perm-b.is-go, .wb-task:not(.is-denied) .wb-task-b.is-go')) {
      if (DENY_FIRST && !denied) {
        denied = true;
        acted = await click('.wb-perm:not(.is-denied) .wb-perm-b:not(.is-go), .wb-task:not(.is-denied) .wb-task-b:not(.is-go)', 'deny');
        await page.waitForTimeout(600); await snap('denied');
        acted = await click('.wb-perm.is-denied .wb-perm-b, .wb-task.is-denied .wb-task-b', 'back') || acted;
      } else acted = await click('.wb-perm .wb-perm-b.is-go, .wb-task .wb-task-b.is-go', 'approve');
    }
    // 2) 기능 찾기
    const hunt = hunts.find(h => tipText.includes(h.text.slice(0, 18)));
    if (!acted && hunt && !tipText.includes('✓')) {
      const t = hunt.target;
      if (t === 'model' || t === 'effort') {
        if (!(await vis(`.wb-menu.is-${t}`))) await click(t === 'model' ? '.crow .dd-btn >> nth=0' : '.crow .dd-btn >> nth=1', 'open-' + t);
        await page.waitForTimeout(300);
        acted = await click(t === 'model' ? '.wb-menu.is-model button:not(.is-on)' : '.wb-eff-stop:not(.is-on)', 'pick-' + t);
      } else if (t === 'attach') {
        if (await vis('.cw-send.is-hunt:not([disabled])')) acted = await click('.cw-send.is-hunt', 'send-attach');
        else if (await vis('.wb-filepick')) { await click('.wb-fp-row', 'fp-row'); acted = await click('.wb-fp-go', 'fp-go'); }
        else if (await vis('.wb-menu.is-attach')) acted = await click('.wb-menu.is-attach button.is-row >> nth=2', 'cloud');
        else acted = await click('.round-btn[aria-label="첨부"]', 'attach');
      } else {
        const name = { new: '새 작업', mine: '내 작업', auto: '자동화', custom: '사용자 지정' }[t];
        acted = await click(`.side .nav-item:has-text("${name}")`, 'rail-' + t);
      }
      if (acted) await page.waitForTimeout(500);
    }
    // 3) 말풍선 버튼 (이어서 보기 · 다음 단계 · 결과 보기 · cue)
    if (!acted) acted = await click('.wb-tip .sc-cue-btn', 'cue-btn');
    // 4) 보내기
    if (!acted) acted = await click(".cw-send.is-hunt:not([disabled]), .composer .round-btn.send.is-hunt, .sc-pane-send.is-hunt", "send");
    // 5) "/" 자료 고르기
    if (!acted) acted = await click('.wb-slash-row.is-pick', 'slash');
    // 6) 결과물 검토
    if (!acted) acted = await click('.cwr-fcard.is-cue', 'open-card');
    // 7) 선택지 / 화면 찾기 퀴즈
    if (!acted && await vis('.wb-tip .wb-opts button:not([disabled])')) {
      const isQuiz = tipText.startsWith('Quiz');
      const idx = isQuiz ? spotTry++ % 4 : 0;
      acted = await click(`.wb-tip .wb-opts li >> nth=${idx} >> button`, isQuiz ? 'spot' : 'choice');
      if (!isQuiz && acted && shotEvery++ < 3) { await page.waitForTimeout(300); }
    }
    await page.waitForTimeout(acted ? 700 : 900);
    const sig = (await page.locator('main.sc').innerText().catch(() => '')).length + '|' + tipText.slice(0, 40);
    if (!acted && sig === lastSig) idle++; else idle = 0;
    lastSig = sig;
    if (idle > 25) { await snap('STALL'); break; }
    if (log.length && log.length % 12 === 0 && acted) await snap('progress');
  }
  if (done) { await page.waitForTimeout(1200); await snap('done'); }
  const doneText = done ? (await page.locator('.sc-done-head').innerText()).replace(/\s+/g, ' ') : '';
  console.log(JSON.stringify({ id, done, seconds: Math.round((Date.now() - t0) / 1000), steps: log.length, doneText: doneText.slice(0, 80), errors, unstable, tail: log.slice(-8) }));
  await browser.close();
})();
