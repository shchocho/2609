import { SEMANTIC_ICONS } from './semanticIcons';
import {
  MegaphoneLoudFilled, PeopleFilled, MoneyFilled, ScalesFilled, HandshakeFilled, BriefcaseFilled,
} from '@fluentui/react-icons';
import type { JSX } from 'react';

/** 상황/흐름/요약에 쓰는 의미 아이콘 (선 아이콘) */
export function SemIcon({ name, className }: { name?: string; className?: string }) {
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
};
export function TrackIcon({ id, fallback }: { id: string; fallback?: string }) {
  return TRACK_ICONS[id] ?? <span>{fallback}</span>;
}
