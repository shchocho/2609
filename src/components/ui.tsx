/** 화면 곳곳에서 쓰는 Fluent 아이콘 모음과 앱 아이콘 */
import {
  Add20Regular, Mic20Regular, ArrowUp20Regular, ChevronDown20Regular, Dismiss12Regular,
  ShieldCheckmark20Regular, PanelRightExpand20Regular, MoreHorizontal20Regular, Dismiss20Regular,
  SpinnerIos20Regular, Circle20Regular, CheckmarkCircle20Regular, ChevronRight20Regular, Search20Regular,
  Open20Regular, Send20Regular, ChevronDown12Regular, Copy20Regular, ClockRegular, DocumentText20Regular,
  ArrowUpload20Regular, Cloud20Regular, Briefcase20Regular, ThumbLike20Regular, ThumbDislike20Regular,
  ArrowDown20Regular, ArrowClockwise20Regular, ArrowReply20Regular, ArrowForward20Regular,
  ShieldCheckmark20Filled, Delete20Regular, Open20Regular as Popout20Regular,
} from '@fluentui/react-icons';
import { APP_LOGO, isApp } from '../data';

/** Cowork 입력창 아이콘 */
export const WE = {
  plus: <Add20Regular fontSize={20} />,
  mic: <Mic20Regular fontSize={20} />,
  send: <ArrowUp20Regular fontSize={18} />,
  chevron: <ChevronDown20Regular fontSize={14} />,
  close: <Dismiss12Regular fontSize={12} />,
};

/** 작업 화면 아이콘 */
export const X = {
  shield: <ShieldCheckmark20Regular fontSize={18} />,
  panel: <PanelRightExpand20Regular fontSize={18} />,
  more: <MoreHorizontal20Regular fontSize={18} />,
  x: <Dismiss20Regular fontSize={16} />,
  spin: <SpinnerIos20Regular fontSize={15} className="cwr-spin" />,
  circle: <Circle20Regular fontSize={15} />,
  check2: <CheckmarkCircle20Regular fontSize={15} />,
  chevRight: <ChevronRight20Regular fontSize={16} />,
  search: <Search20Regular fontSize={16} />,
  open: <Open20Regular fontSize={16} />,
  mailSend: <Send20Regular fontSize={16} />,
  caretSm: <ChevronDown12Regular fontSize={14} />,
  copy: <Copy20Regular fontSize={18} />,
  clock: <ClockRegular fontSize={18} />,
  context: <DocumentText20Regular fontSize={20} />,
  upload: <ArrowUpload20Regular fontSize={20} />,
  cloud: <Cloud20Regular fontSize={20} />,
  plugin: <Briefcase20Regular fontSize={20} />,
  thumbUp: <ThumbLike20Regular fontSize={16} />,
  thumbDown: <ThumbDislike20Regular fontSize={16} />,
  down: <ArrowDown20Regular fontSize={18} />,
};

/** Outlook 메일 도구 모음 아이콘 */
export const FT = {
  send: <Send20Regular fontSize={16} />,
  reply: <ArrowReply20Regular fontSize={16} />,
  forward: <ArrowForward20Regular fontSize={16} />,
  caret: <ChevronDown20Regular fontSize={12} />,
  shield: <ShieldCheckmark20Filled fontSize={17} />,
  trash: <Delete20Regular fontSize={17} />,
  popout: <Popout20Regular fontSize={17} />,
};

/** 답변 아래 동작 아이콘 줄 */
export function AnswerActs() {
  return (
    <>
      <Copy20Regular />
      <ThumbLike20Regular />
      <ThumbDislike20Regular />
      <ArrowClockwise20Regular />
      <MoreHorizontal20Regular />
    </>
  );
}

const LETTER: Record<string, [string, string]> = {
  outlook: ['O', 'var(--m365-outlook-bright, #00aee2)'],
  word: ['W', 'var(--m365-word-bright, #0054d3)'],
  excel: ['X', 'var(--m365-excel-bright, #359238)'],
  powerpoint: ['P', 'var(--m365-powerpoint-bright, #ff5900)'],
  onenote: ['N', 'var(--m365-onenote-bright, #de4aff)'],
  teams: ['T', 'var(--m365-teams-bright, #9443ff)'],
  cowork: ['C', 'var(--copilot-black, #242424)'],
  cloudflow: ['▸', '#0066ff'],
  deskflow: ['▸', '#0066ff'],
  studio: ['✦', '#7a5cff'],
  code: ['◇', '#0f7b6c'],
  scout: ['S', 'var(--copilot-black, #242424)'],
};

/** 앱 아이콘 (M365 로고 또는 글자 배지) */
export function AppIcon({ app }: { app: string }) {
  if (app === 'chat') return <img className="wb-fico is-logo" src="logo/copilot/copilot.png" alt="" aria-hidden="true" />;
  if (isApp(app) && app !== 'onenote') return <img className="wb-fico is-logo" src={APP_LOGO[app]} alt="" aria-hidden="true" />;
  const [ch, bg] = LETTER[app] ?? ['•', '#8a8886'];
  return <span className="wb-fico" style={{ background: bg }} aria-hidden="true">{ch}</span>;
}
