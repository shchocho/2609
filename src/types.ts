/** 시나리오 JSON 스키마 (src/scenarios/<track>/<id>.scenario.json) */

export type AgentKind = 'chat' | 'cowork' | 'scout' | 'office' | 'flow';
export type AppKind = 'excel' | 'word' | 'powerpoint' | 'outlook' | 'teams' | 'onenote';

/** only: 고른 선택지 id(또는 "hunted") 중 하나라도 있을 때만 / not: 하나라도 있으면 숨김 */
export interface Filterable { only?: string[]; not?: string[] }

export interface ScenePoint { icon?: string; scene: string; say: string }
export interface Scene {
  eyebrow?: string;
  art?: string;
  artSlots?: Record<string, string>;
  headline: string;
  sub?: string;
  points: ScenePoint[];
}
export interface OverviewStep { icon?: string; title: string; desc: string }
export interface RecapItem { icon?: string; name: string; desc: string }
export interface QuizItem { text: string; options: string[]; answer: number }
export interface FinishOut { app: string; name: string; note?: string }
export interface Finish { sub?: string; outs?: FinishOut[]; outsBy?: Record<string, FinishOut[]> }

/* ---------- 작업 영역 결과물 ---------- */
export interface SheetRow extends Filterable { cells: string[]; tone?: string; add?: Record<string, string[]> }
export interface SheetPage { head: string[]; num?: number[]; rows: SheetRow[] }
/** 시트에 넣은 막대 차트 (only/not 으로 선택에 따라 고름) */
export interface Chart extends Filterable { title: string; unit?: string; digits?: number; bars: { label: string; value: number; warn?: boolean }[] }
export interface Sheet {
  charts?: Chart[];
  head: string[];
  num?: number[];
  rows: SheetRow[];
  tabs?: string[];
  pages?: Record<string, SheetPage>;
  tabsAdd?: Record<string, string>;
  headAdd?: Record<string, string[]>;
}
export interface Stat { label: string; value: string; warn?: boolean }
export interface DocBlock extends Filterable {
  kind: string;
  title?: string;
  text?: string;
  meta?: string[];
  stats?: Stat[];
  items?: string[];
  ordered?: boolean;
  table?: { head: string[]; rows: string[][] };
  note?: string;
  label?: string;
  value?: string;
  lines?: string[];
  no?: string;
  src?: string;
  textBy?: Record<string, string>;
  tpl?: string;
  q?: string;
  a?: string;
}
export interface DeckVariant { head?: string; sub?: string; body?: string[] }
/** only/not 을 쓰면 선택에 따라 슬라이드가 들어가고 빠지며, 번호(n)는 보이는 순서대로 다시 매긴다 */
export interface DeckSlide extends Filterable {
  n: number;
  head: string;
  sub?: string;
  body?: string[];
  table?: { head: string[]; rows: string[][] };
  by?: Record<string, DeckVariant>;
  over?: boolean;
}
export interface Deck { total?: number; src?: string; slides: DeckSlide[]; rest?: string[] }
/** Power Automate 흐름의 트리거·작업 카드. state·note 는 실행 기록(run)에서만 보인다 */
/**
 * 데스크톱 흐름이 조작하는 대상 프로그램 화면에서의 조작 하나.
 * to: 'menu' · 'save'(단추) · 입력란 id / type: 입력란에 넣는 값 / reset: 새 화면(입력란 비움) / say: 화면 아래 상태 글 / popup: 화면을 가리는 창
 */
export interface FlowAct { to: string; type?: string; reset?: boolean; say?: string; popup?: string }
/** 대상 프로그램 화면(메뉴 · 입력란 · 단추 하나짜리 입력 화면) */
export interface FlowScreen { title: string; menu: string; fields: { id: string; label: string }[]; button: string }
export interface FlowStep extends Filterable {
  icon?: string; title: string; desc?: string; indent?: number; state?: 'ok' | 'fail' | 'skip'; note?: string;
  /** 이 단계가 대상 화면에서 하는 조작들. 있으면 조작 하나가 한 박자로 재생된다 */
  do?: FlowAct[];
}
/** run 이면 실행 기록: 모든 단계를 두고 실행된 곳까지만 결과를 표시한다. screen 이 있으면 흐름 옆에 대상 화면을 띄운다 */
export interface Flow { run?: boolean; screen?: FlowScreen; steps: FlowStep[] }
export interface TeamsPost {
  channel: string;
  team: string;
  author: string;
  at: string;
  title: string;
  body: string[];
  foot?: string;
  reactions?: string[];
}
export interface Artifact {
  app: string;
  kind: 'sheet' | 'doc' | 'deck' | 'mail' | 'teams' | 'flow' | string;
  origin: 'read' | 'made';
  share?: string;
  name: string;
  nameBy?: Record<string, string>;
  where: string;
  note?: string;
  sheet?: Sheet;
  blocks?: DocBlock[];
  deck?: Deck;
  teams?: TeamsPost;
  flow?: Flow;
}
export interface Workbench { task: string; ask?: string; artifacts: Record<string, Artifact> }

/* ---------- 메시지 ---------- */
export interface Source { id: string; label: string; kind: string; detail?: string; url?: string; blocks?: number[] }
export interface ImageRef { src: string; alt: string }
export interface Pick { token: string; query: string; name: string; meta?: string; app?: string }
export interface ApproveRow { label: string; value: string }
export interface ChoiceOption {
  id: string;
  label: string;
  desc?: string;
  meta?: string;
  value?: string;
  say?: string;
  recommended?: boolean;
  reply?: { text: string; at?: string };
}
export interface HuntMenuItem { name: string; desc?: string; wrong?: boolean; files?: { name: string; app: string }[] }

export interface MsgCue extends Filterable { role: 'cue'; text: string; action: string }
export interface MsgUser extends Filterable { role: 'user'; text: string; at?: string; pick?: Pick }
export interface MsgAssistant extends Filterable {
  role: 'assistant'; text: string; at?: string; sources?: Source[]; files?: string[]; images?: ImageRef[]; over?: boolean;
}
export interface MsgTool extends Filterable {
  role: 'tool'; tool: string; delayMs?: number; opens?: string; shows?: string; writes?: string; translate?: boolean;
}
export interface MsgNote extends Filterable { role: 'note'; text: string; delayMs?: number }
export interface MsgApprove extends Filterable {
  role: 'approve';
  what: string;
  kind?: string;
  line?: string;
  rows?: ApproveRow[];
  warn?: string;
  go?: string;
  allowed?: string;
  denied?: string;
  mail?: { to: string; subject: string; body: string[]; sign?: string };
}
export interface MsgChoice extends Filterable {
  role: 'choice'; key: string; tag?: string; text: string; options: ChoiceOption[]; act?: string; builds?: string;
}
export interface MsgHunt extends Filterable {
  role: 'hunt';
  at: 'rail' | 'composer' | string;
  target: string;
  tag?: string;
  text: string;
  hint: string;
  does: string;
  say?: string;
  wrong?: Record<string, string>;
  menu?: { title?: string; note?: string; items: HuntMenuItem[] };
  chip?: string;
}
export interface MsgSpot extends Filterable {
  role: 'spot'; text: string; options: { at: string; label: string }[]; answer: number; does: string; plain?: boolean;
}
export type Message = MsgCue | MsgUser | MsgAssistant | MsgTool | MsgNote | MsgApprove | MsgChoice | MsgHunt | MsgSpot;

export interface ChatArtifact { kind: string; title: string; slides?: string[]; src?: string; note?: string }

export interface Scenario {
  _note?: string;
  id: string;
  track: string;
  order?: number;
  agent: AgentKind;
  surface?: string;
  apps?: string[];
  model: string;
  effort?: string;
  title: string;
  summary: string;
  before?: string;
  hook?: string;
  startedAt?: string;
  anonymized?: boolean;
  scene?: Scene;
  overview?: OverviewStep[];
  workbench?: Workbench;
  messages: Message[];
  recap?: RecapItem[];
  quiz?: QuizItem[];
  finish?: Finish;
  artifact?: ChatArtifact;
}

export interface TrackIntro { tone: string; icon?: string; caption: string }
export interface Track {
  id: string;
  name: string;
  icon: string;
  color: string;
  textColor: string;
  about: string;
  /** 'product' 면 홈의 "제품 기능 체험" 묶음에 놓인다 */
  group?: 'product';
  /** 목록의 제품별 보기에 세울 열 (기본 chat · cowork) */
  products?: string[];
  intro?: TrackIntro[];
}

/** 체험 중 사용자 선택 상태 */
export interface PlayState {
  picks: { key: string; option: ChoiceOption }[];
  model: string | null;
  effort: string | null;
  hunted: string | null;
  allowed: boolean;
  opened: string[];
  tab: string | null;
  writing: string | null;
  rows: number;
  moved: number;
  moving: number;
  over: boolean;
  slide: number;
}
export const INITIAL_STATE: PlayState = {
  picks: [], model: null, effort: null, hunted: null, allowed: false, opened: [], tab: null,
  writing: null, rows: 0, moved: 0, moving: 0, over: false, slide: 1,
};

export interface Vars { model: string; effort: string; picks: Record<string, string>; vals: Record<string, string> }
