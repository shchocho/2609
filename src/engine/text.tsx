import type { ReactNode } from 'react';
import type { Artifact, Filterable, PlayState, Vars } from '../types';

/** {model} {effort} {pick:KEY} {val:KEY} 치환 */
export function fill(text: string, v: Vars): string {
  return text
    .replace(/\{model\}/g, v.model)
    .replace(/\{effort\}/g, v.effort)
    .replace(/\{pick:([^}]+)\}/g, (m, k: string) => v.picks[k] ?? m)
    .replace(/\{val:([^}]+)\}/g, (m, k: string) => v.vals[k] ?? m);
}

/** 고른 선택지 id 목록 (+ 기능 찾기 성공 시 "hunted") */
export const pickIds = (st: PlayState) => {
  const ids = st.picks.map(p => p.option.id);
  return st.hunted ? [...ids, 'hunted'] : ids;
};

export function passes(ids: string[], item?: Filterable | null): boolean {
  if (!item) return true;
  if (item.only && !item.only.some(id => ids.includes(id))) return false;
  if (item.not && item.not.some(id => ids.includes(id))) return false;
  return true;
}
export const filterBy = <T extends Filterable>(list: T[], ids: string[]) => list.filter(x => passes(ids, x));

export function makeVars(st: PlayState, model: string, effort?: string): Vars {
  return {
    model: st.model ?? model,
    effort: st.effort ?? effort ?? '보통',
    picks: Object.fromEntries(st.picks.map(p => [p.key, p.option.label])),
    vals: Object.fromEntries(st.picks.filter(p => p.option.value).map(p => [p.key, p.option.value as string])),
  };
}

/** 결과물 표시 이름 (선택에 따라 달라지는 nameBy) */
export function artifactName(a: Artifact, ids: string[]): string {
  if (!a.nameBy) return a.name;
  for (const id of ids) if (a.nameBy[id]) return a.nameBy[id];
  return a.name;
}

/** 작성 애니메이션 길이(행/블록 수) */
export function writeLength(a: Artifact, ids: string[]): number {
  if (a.kind === 'sheet') return a.sheet ? filterBy(a.sheet.rows, ids).length : 0;
  if (a.kind === 'teams') return a.teams ? a.teams.body.length + 2 : 0;
  if (a.kind === 'deck') return a.deck ? a.deck.slides.length : 0;
  return a.blocks ? filterBy(a.blocks, ids).length : 0;
}

/** **굵게** */
export function Bold({ text }: { text: string }) {
  return <>{text.split(/\*\*/).map((t, i) => (i % 2 ? <b key={i}>{t}</b> : <span key={i}>{t}</span>))}</>;
}

type Block = { kind: 'p' | 'code' | 'quote'; lines: string[] } | { kind: 'check'; items: string[] };
function parseBlocks(text: string): Block[] {
  const out: Block[] = [];
  const lines = text.split('\n');
  const para: string[] = [];
  const flush = () => { if (para.length) out.push({ kind: 'p', lines: [...para] }); para.length = 0; };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (line.trim().startsWith('```')) {
      flush();
      const code: string[] = [];
      for (i++; i < lines.length && !(lines[i] ?? '').trim().startsWith('```'); i++) code.push(lines[i] ?? '');
      i++;
      out.push({ kind: 'code', lines: code });
      continue;
    }
    if (line.startsWith('>')) {
      flush();
      const q: string[] = [];
      for (; i < lines.length && (lines[i] ?? '').startsWith('>'); i++) q.push((lines[i] ?? '').replace(/^>\s?/, ''));
      out.push({ kind: 'quote', lines: q });
      continue;
    }
    if (line.startsWith('✅ ')) {
      flush();
      const items: string[] = [];
      for (; i < lines.length && (lines[i] ?? '').startsWith('✅ '); i++) items.push((lines[i] ?? '').slice(2).trim());
      out.push({ kind: 'check', items });
      continue;
    }
    if (line.trim() === '') { flush(); i++; continue; }
    para.push(line);
    i++;
  }
  flush();
  return out;
}

/** 답변 본문: 문단 · ✅ 체크 목록 · > 인용 · ``` 코드 */
export function Rich({ text, afterParagraph }: { text: string; afterParagraph?: (i: number) => ReactNode }) {
  return (
    <>
      {parseBlocks(text).map((b, i) =>
        b.kind === 'quote' ? <blockquote key={i} className="sc-quote">{b.lines.join('\n')}</blockquote>
        : b.kind === 'code' ? <div key={i} className="sc-code">{b.lines.map((l, j) => <span key={j}><i>{j + 1}</i>{l}</span>)}</div>
        : b.kind === 'check' ? <ul key={i} className="sc-check">{b.items.map((t, j) => <li key={j}><span><Bold text={t} /></span></li>)}</ul>
        : <p key={i}><Bold text={b.lines.join('\n')} />{afterParagraph?.(i)}</p>,
      )}
    </>
  );
}

/** 계약서 조항 템플릿의 빈칸 (___) */
export function Blanks({ text }: { text: string }) {
  return (
    <>
      {text.split(/(_{3,})/).map((t, i) =>
        /^_{3,}$/.test(t)
          ? <u key={i} className="wb-blank" style={{ minWidth: `${t.length * 0.5}em` }} />
          : <Bold key={i} text={t} />,
      )}
    </>
  );
}

/** 마지막 글자 받침에 맞는 목적격 조사 */
export function objParticle(word: string): string {
  const c = (word.trim().at(-1) ?? '').charCodeAt(0) - 44032;
  return c < 0 || c > 11171 ? '을(를)' : c % 28 === 0 ? '를' : '을';
}

/** 파일 확장자로 앱 추정 */
const EXT: Record<string, string> = {
  xlsx: 'excel', xls: 'excel', csv: 'excel', docx: 'word', doc: 'word', pdf: 'word',
  pptx: 'powerpoint', ppt: 'powerpoint', msg: 'outlook', eml: 'outlook', one: 'onenote',
};
export const appFromName = (name: string) => EXT[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'word';

/** 공개 폴더 기준 경로 */
export const asset = (p: string) => p.replace(/^\//, '');
