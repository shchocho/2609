import type { Scenario } from './types';
import { TRACK_IDS } from './tracks';

const modules = import.meta.glob<{ default: Scenario }>('./scenarios/*/*.scenario.json', { eager: true });

function load(): Scenario[] {
  const list: Scenario[] = [];
  const seen = new Set<string>();
  for (const [path, mod] of Object.entries(modules)) {
    const s = mod.default;
    const folder = path.split('/')[2];
    if (s.track && folder !== s.track) console.warn(`[scenarios] ${path} — 폴더는 ${folder} 인데 track 은 ${s.track} 입니다.`);
    if (!TRACK_IDS.includes(s.track)) { console.info(`[scenarios] 트랙에 없는 시나리오를 빼 둡니다: ${s.id}`); continue; }
    if (seen.has(s.id)) console.error(`[scenarios] 아이디가 겹칩니다: ${s.id}`);
    seen.add(s.id);
    list.push(s);
  }
  return list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title, 'ko'));
}

export const SCENARIOS: Scenario[] = load();
export const scenariosOf = (track: string) => SCENARIOS.filter(s => s.track === track);
export const scenarioById = (id: string) => SCENARIOS.find(s => s.id === id);
export function countByTrack(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of TRACK_IDS) out[t] = 0;
  for (const s of SCENARIOS) out[s.track] = (out[s.track] ?? 0) + 1;
  return out;
}

/* ---------- 제품/앱 이름, 화면 구성 ---------- */
export const AGENTS = {
  chat: { name: 'Copilot Chat', full: 'Copilot Chat' },
  cowork: { name: 'Copilot Cowork', full: 'Copilot Cowork' },
  scout: { name: 'Microsoft Scout', full: 'Microsoft Scout' },
  office: { name: 'Copilot', full: 'Microsoft 365 Copilot' },
  flow: { name: 'Copilot', full: 'Power Automate' },
  studio: { name: '에이전트', full: 'Copilot Studio' },
  code: { name: 'Copilot', full: 'Copilot Code' },
} as const;

export const APPS = {
  excel: { name: 'Excel', full: 'Microsoft Excel' },
  onenote: { name: 'OneNote', full: 'Microsoft OneNote' },
  outlook: { name: 'Outlook', full: 'Microsoft Outlook' },
  powerpoint: { name: 'PowerPoint', full: 'Microsoft PowerPoint' },
  teams: { name: 'Teams', full: 'Microsoft Teams' },
  word: { name: 'Word', full: 'Microsoft Word' },
} as const;
export type AppId = keyof typeof APPS;
export const isApp = (x: string): x is AppId => x in APPS;

/** 화면에 보일 제품 이름 — Office 앱 안의 Copilot 은 "Copilot in Word" 처럼 앱 이름을 붙인다 */
export const productName = (s: Scenario) =>
  s.agent === 'office' && s.surface && isApp(s.surface) ? `Copilot in ${APPS[s.surface].name}` : AGENTS[s.agent].full;

export const MODELS = [
  { v: '자동', d: '작업에 가장 적합한 모델' },
  { v: 'GPT 5.5', d: '중간 수준 추론에 적합한 모델' },
  { v: 'Opus 5', d: '복잡하고 중요한 작업에 적합' },
  { v: 'Sonnet 5', d: '일상 작업에 효율적' },
  { v: 'Fable 5.1', d: '야심 찬 프로젝트를 위한 가장 뛰어난 모델' },
];
export const EFFORTS = [
  { v: '낮음', d: '짧고 빠르게 답합니다' },
  { v: '보통', d: '일반적인 업무에 적당합니다' },
  { v: '높음', d: '조건이 여러 개일 때 사용합니다' },
  { v: '매우 높음', d: '가장 꼼꼼하게 비교합니다' },
];

export const APP_LOGO: Record<AppId, string> = {
  excel: 'logo/m365/excel.svg',
  word: 'logo/m365/word.svg',
  powerpoint: 'logo/m365/powerpoint.svg',
  outlook: 'logo/m365/outlook.svg',
  teams: 'logo/m365/teams.svg',
  onenote: 'brand/m365-icon-gradient/onenote.png',
};

/** 시나리오에 등장하는 앱 목록 (apps 가 없으면 workbench 아티팩트에서 유추) */
export function appsOf(s: Scenario): AppId[] {
  if (s.apps) return s.apps.filter(isApp);
  const list: { app: AppId; made: boolean }[] = [];
  for (const a of Object.values(s.workbench?.artifacts ?? {})) {
    if (isApp(a.app) && !list.some(x => x.app === a.app)) list.push({ app: a.app, made: a.origin === 'made' });
  }
  return list.sort((a, b) => Number(a.made) - Number(b.made)).map(x => x.app);
}
export function madeAppOf(s: Scenario): AppId | undefined {
  for (const a of Object.values(s.workbench?.artifacts ?? {})) if (a.origin === 'made' && isApp(a.app)) return a.app;
  return undefined;
}
