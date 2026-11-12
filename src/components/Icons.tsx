import { SEMANTIC_ICONS } from './semanticIcons';
import {
  MegaphoneLoudFilled, PeopleFilled, MoneyFilled, ScalesFilled, HandshakeFilled, BriefcaseFilled,
  AppsFilled, CodeFilled, FlowFilled, BotFilled,
} from '@fluentui/react-icons';
import {
  Box24Regular, Briefcase24Regular, DataBarVertical24Regular, Megaphone24Regular, People24Regular, Code24Regular,
  Clock24Regular, CalendarCancel24Regular, Scales24Regular, ArrowSplit24Regular, DocumentSearch24Regular,
  Calculator24Regular, Target24Regular, Mail24Regular, Share24Regular, DocumentCheckmark24Regular,
  BuildingFactory24Regular, Money24Regular, Organization24Regular, Warning24Regular, Flash24Regular,
  Options24Regular, Link24Regular, CheckmarkCircle24Regular, Send24Regular, VehicleTruck24Regular,
  ArrowSync24Regular, Gauge24Regular, ShieldCheckmark24Regular,
} from '@fluentui/react-icons';
import type { JSX } from 'react';
import { DRAFT } from '../look';

/** 시안: 의미 아이콘을 Fluent UI System Icons(MIT)로 교체 */
const DRAFT_ICONS: Record<string, JSX.Element> = {
  box: <Box24Regular />, briefcase: <Briefcase24Regular />, chart: <DataBarVertical24Regular />,
  megaphone: <Megaphone24Regular />, people: <People24Regular />, code: <Code24Regular />,
  clock: <Clock24Regular />, calx: <CalendarCancel24Regular />, scales: <Scales24Regular />,
  split: <ArrowSplit24Regular />, docsearch: <DocumentSearch24Regular />, calc: <Calculator24Regular />,
  target: <Target24Regular />, mail: <Mail24Regular />, share: <Share24Regular />,
  checkdoc: <DocumentCheckmark24Regular />, factory: <BuildingFactory24Regular />, coin: <Money24Regular />,
  network: <Organization24Regular />, alert: <Warning24Regular />, bolt: <Flash24Regular />,
  sliders: <Options24Regular />, link: <Link24Regular />, check: <CheckmarkCircle24Regular />,
  send: <Send24Regular />, truck: <VehicleTruck24Regular />, refresh: <ArrowSync24Regular />,
  gauge: <Gauge24Regular />, shield: <ShieldCheckmark24Regular />,
};

/** 상황/흐름/요약에 쓰는 의미 아이콘 (선 아이콘) */
export function SemIcon({ name, className }: { name?: string; className?: string }) {
  if (DRAFT && name && DRAFT_ICONS[name]) return <span className={className} aria-hidden="true">{DRAFT_ICONS[name]}</span>;
  const svg = name ? SEMANTIC_ICONS[name] : undefined;
  if (!svg) return null;
  return <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** 홈 화면 트랙 카드 아이콘 (Fluent 채움 아이콘) */
const TRACK_ICONS: Record<string, JSX.Element> = {
  sales: <MegaphoneLoudFilled />,
  hr: <PeopleFilled />,
  finance: <MoneyFilled />,
  procurement: <ScalesFilled />,
  ops: <HandshakeFilled />,
  dev: <BriefcaseFilled />,
  'm365-apps': <AppsFilled />,
  'copilot-code': <CodeFilled />,
  'power-automate': <FlowFilled />,
  'copilot-studio': <BotFilled />,
};
export function TrackIcon({ id, fallback }: { id: string; fallback?: string }) {
  return TRACK_ICONS[id] ?? <span>{fallback}</span>;
}
