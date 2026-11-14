/**
 * Word · Excel · PowerPoint 창의 위쪽(제목 표시줄 · 탭 · 리본)과 아래쪽(상태 표시줄).
 * 2026-11-14 한국어 데스크톱 앱(Microsoft 365) 화면을 보고 탭 이름·그룹 이름·명령 배치를 그대로 옮겼다.
 * 명령은 모양만 있고 눌리지 않는다. Copilot 은 리본이 아니라 문서 오른쪽 아래의 둥근 Copilot 단추로 연다(AppWindow 의 .or-fab).
 */
import type { ReactNode } from 'react';
import {
  ClipboardPasteRegular, CutRegular, CopyRegular, PaintBrushRegular, TextBoldRegular, TextItalicRegular, TextUnderlineRegular,
  TextStrikethroughRegular, TextSubscriptRegular, TextSuperscriptRegular, HighlightRegular, TextColorRegular,
  TextBulletListLtrRegular, TextNumberListLtrRegular, TextIndentDecreaseLtrRegular, TextIndentIncreaseLtrRegular,
  TextAlignLeftRegular, TextAlignCenterRegular, TextAlignRightRegular, TextAlignJustifyRegular, TextEffectsRegular,
  SearchRegular, MicRegular, AppsRegular, PenRegular, TextWrapRegular, TableCellsMergeRegular, AutosumRegular,
  ArrowSortRegular, FilterRegular, SlideAddRegular, DesignIdeasRegular, ShapesRegular, SaveRegular, ArrowUndoRegular,
  ArrowRedoRegular, CommentRegular, EditRegular, ShareRegular,
} from '@fluentui/react-icons';

/** 큰 단추: [그림, 이름] */
type Big = [ReactNode, string];
interface Group { name: string; big?: Big[]; boxes?: string[]; rows?: ReactNode[][]; list?: string[] }
interface Real {
  app: string;
  tabs: string[];
  /** 탭 줄 오른쪽 단추. 마지막 것이 색이 칠해진 공유 단추 */
  right: string[];
  groups: Group[];
  status: string[];
  zoom: string;
}

const CLIP: Group = { name: '클립보드', big: [[<ClipboardPasteRegular />, '붙여넣기']], rows: [[<CutRegular />], [<CopyRegular />], [<PaintBrushRegular />]] };
const FONT_ROWS = [
  [<TextBoldRegular />, <TextItalicRegular />, <TextUnderlineRegular />, <TextStrikethroughRegular />, <TextSubscriptRegular />, <TextSuperscriptRegular />],
  [<TextEffectsRegular />, <HighlightRegular />, <TextColorRegular />],
];
const PARA_ROWS = [
  [<TextBulletListLtrRegular />, <TextNumberListLtrRegular />, <TextIndentDecreaseLtrRegular />, <TextIndentIncreaseLtrRegular />],
  [<TextAlignLeftRegular />, <TextAlignCenterRegular />, <TextAlignRightRegular />, <TextAlignJustifyRegular />],
];
const VOICE: Group = { name: '음성', big: [[<MicRegular />, '받아쓰기']] };
const ADDINS: Group = { name: '추가 기능', big: [[<AppsRegular />, '추가 기능']] };

export const REAL: Record<string, Real> = {
  word: {
    app: 'Word',
    tabs: ['파일', '홈', '삽입', '그리기', '디자인', '레이아웃', '참조', '편지', '검토', '보기', '도움말'],
    right: ['메모', '편집', '공유'],
    groups: [
      CLIP,
      { name: '글꼴', boxes: ['맑은 고딕(본문 한글)', '11'], rows: FONT_ROWS },
      { name: '단락', rows: PARA_ROWS },
      { name: '스타일', big: [[<TextEffectsRegular />, '스타일']] },
      { name: '편집', big: [[<SearchRegular />, '편집']] },
      VOICE,
      { name: '편집기', big: [[<PenRegular />, '편집기']] },
      ADDINS,
    ],
    status: ['1/1 페이지', '한국어', '접근성: 계속 진행 가능'],
    zoom: '100%',
  },
  excel: {
    app: 'Excel',
    tabs: ['파일', '홈', '삽입', '그리기', '페이지 레이아웃', '수식', '데이터', '검토', '보기', '자동화', '도움말'],
    right: ['메모', '공유'],
    groups: [
      CLIP,
      { name: '글꼴', boxes: ['맑은 고딕', '11'], rows: [[<TextBoldRegular />, <TextItalicRegular />, <TextUnderlineRegular />], [<HighlightRegular />, <TextColorRegular />]] },
      { name: '맞춤', rows: [[<TextAlignLeftRegular />, <TextAlignCenterRegular />, <TextAlignRightRegular />, <TextWrapRegular />], [<TextIndentDecreaseLtrRegular />, <TextIndentIncreaseLtrRegular />, <TableCellsMergeRegular />]] },
      { name: '표시 형식', boxes: ['일반'], rows: [['%', ',', '.0', '.00']] },
      { name: '스타일', list: ['조건부 서식', '표 서식', '셀 스타일'] },
      { name: '셀', list: ['삽입', '삭제', '서식'] },
      { name: '편집', rows: [[<AutosumRegular />, <ArrowSortRegular />], [<FilterRegular />, <SearchRegular />]] },
      ADDINS,
    ],
    status: ['준비', '접근성: 계속 진행 가능'],
    zoom: '100%',
  },
  powerpoint: {
    app: 'PowerPoint',
    tabs: ['파일', '홈', '삽입', '그리기', '디자인', '전환', '애니메이션', '슬라이드 쇼', '녹음/녹화', '검토', '보기', '도움말'],
    right: ['Teams에서 프레젠테이션', '공유'],
    groups: [
      CLIP,
      { name: '슬라이드', big: [[<SlideAddRegular />, '새 슬라이드'], [<DesignIdeasRegular />, 'Copilot을 사용하여 새 슬라이드 만들기']] },
      { name: '글꼴', boxes: ['', ''], rows: FONT_ROWS },
      { name: '단락', rows: PARA_ROWS },
      { name: '그리기', big: [[<ShapesRegular />, '그리기']] },
      { name: '편집', big: [[<SearchRegular />, '편집']] },
      VOICE,
      ADDINS,
      { name: 'Copilot', big: [[<DesignIdeasRegular />, '디자인 제안']] },
    ],
    status: ['한국어', '접근성: 계속 진행 가능'],
    zoom: '70%',
  },
};

const RIGHT_ICON: Record<string, ReactNode> = { 메모: <CommentRegular />, 편집: <EditRegular />, 공유: <ShareRegular /> };

/** 제목 표시줄: 앱 아이콘 · 자동 저장 · 파일 이름 - 앱 · 검색 · 계정 · 창 단추 */
export function OfficeTitle({ r, surface, name, me }: { r: Real; surface: string; name: string; me: string }) {
  return (
    <div className="sc-win or-title">
      <img className="or-logo" src={`logo/m365/${surface}.svg`} alt="" />
      <span className="or-auto">자동 저장 <i>켬</i></span>
      <span className="or-quick" aria-hidden="true"><SaveRegular /><ArrowUndoRegular /><ArrowRedoRegular /></span>
      <span className="sc-win-name">{name} - {r.app}</span>
      <span className="or-search"><SearchRegular />검색</span>
      <span className="or-me" aria-hidden="true">{me}</span>
      <span className="sc-win-btns" aria-hidden="true"><i>─</i><i>▢</i><i>✕</i></span>
    </div>
  );
}

/** 탭 줄 + 리본(홈 탭). extra 는 리본 아래에 붙는 줄(Excel 수식 입력줄) */
export function OfficeRibbon({ r, className, extra }: { r: Real; className: string; extra?: ReactNode }) {
  return (
    <div className={`sc-ribbon or-ribbon ${className}`}>
      <div className="or-tabs">
        <span>{r.tabs.map((t, i) => <i key={t} className={i === 1 ? 'on' : undefined}>{t}</i>)}</span>
        <span className="or-tabs-end">
          {r.right.map((t, i) => <i key={t} className={i === r.right.length - 1 ? 'is-share' : undefined}>{RIGHT_ICON[t]}{t}</i>)}
        </span>
      </div>
      <div className="or-groups" aria-hidden="true">
        {r.groups.map(g => (
          <span key={g.name} className="or-g">
            <span className="or-g-body">
              {g.big?.map(([ico, label]) => <span key={label} className="or-big">{ico}<em>{label}</em></span>)}
              {(g.boxes || g.rows) && (
                <span className="or-rows">
                  {g.boxes && <span className="or-boxes">{g.boxes.map((b, i) => <i key={i}>{b}</i>)}</span>}
                  {g.rows?.map((row, i) => <span key={i} className="or-row">{row.map((c, j) => <i key={j}>{c}</i>)}</span>)}
                </span>
              )}
              {g.list && <span className="or-list">{g.list.map(x => <i key={x}>{x} ⌄</i>)}</span>}
            </span>
            <i className="or-g-name">{g.name}</i>
          </span>
        ))}
      </div>
      {extra}
    </div>
  );
}

/** 상태 표시줄 */
export function OfficeStatus({ r, lead }: { r: Real; lead?: string }) {
  return (
    <div className="sc-status or-status">
      {lead && <span>{lead}</span>}
      {r.status.map(x => <span key={x}>{x}</span>)}
      <span className="sc-status-end">─────●───── ＋ {r.zoom}</span>
    </div>
  );
}
