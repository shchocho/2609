// 모든 시나리오(또는 인자로 준 영역만)를 e2e.cjs 로 차례로 돌리고 한 줄씩 결과를 낸다.
// 개발 서버(npm run dev)가 떠 있어야 한다.  npm run e2e:all  /  npm run e2e:all -- <영역>
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'scenarios');
const only = process.argv[2];
let total = 0, bad = 0;
for (const track of fs.readdirSync(root)) {
  if (only && track !== only) continue;
  for (const f of fs.readdirSync(path.join(root, track)).filter(x => x.endsWith('.scenario.json'))) {
    const id = f.replace('.scenario.json', '');
    const r = spawnSync(process.execPath, [path.join(__dirname, 'e2e.cjs'), track, id, 'e2e-out'], { encoding: 'utf8' });
    let j = null;
    try { j = JSON.parse(r.stdout.trim().split('\n').pop()); } catch { /* e2e.cjs 가 결과를 내기 전에 죽음 */ }
    const ok = !!j && j.done && j.errors.length === 0;
    total++;
    if (!ok) bad++;
    const why = j
      ? `${JSON.stringify(j.errors).slice(0, 200)} tail=${j.tail.join(',')}`
      : `${r.stderr}${r.stdout}`.split('\n').filter(l => l.trim() && !/^\s+at /.test(l)).slice(-6).join(' | ').slice(0, 400);
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${track}/${id}${j ? ` ${j.seconds}s` : ''}${ok ? '' : ` :: ${why}`}`);
  }
}
console.log(`${total - bad}/${total} 통과`);
process.exit(bad ? 1 : 0);
