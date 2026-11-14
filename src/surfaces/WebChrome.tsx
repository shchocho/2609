/**
 * Outlook · Teams(채팅/모임) · Forms 창의 위쪽 모양.
 * 2026-11-14 한국어 화면(새 Outlook · Teams 데스크톱 앱 · Forms 웹)에서 읽은 이름과 배치를 옮겼다.
 * Outlook 과 Teams 는 위쪽의 Copilot 단추(target 'copilot')로 오른쪽 Copilot 창을 연다.
 * Forms 는 오른쪽 창이 없고, 양식 위의 "Copilot으로 초안 작성" 카드에서 요청한다(AppWindow 가 그린다).
 */
import type { ReactNode } from 'react';
import {
  ArchiveRegular, ArrowForwardRegular, ArrowReplyAllRegular, ArrowReplyRegular, ComposeRegular, DataBarVerticalRegular,
  DeleteRegular, EyeRegular, FlashRegular, FolderArrowRightRegular, MailReadRegular, MoreHorizontalRegular, NavigationRegular,
  PaintBrushRegular, PeopleRegular, SearchRegular, SendRegular, SettingsRegular, SlideLayoutRegular, VideoRegular,
} from '@fluentui/react-icons';

export type WebSurface = 'outlook' | 'teams' | 'forms';
export const isWeb = (x: string): x is WebSurface => x === 'outlook' || x === 'teams' || x === 'forms';

interface Props {
  surface: WebSurface;
  /** 파일(메일 · 모임 · 양식) 이름 */
  name: string;
  /** 리본 영역 표시(화면 찾기 퀴즈) */
  zone: string;
  /** Copilot 단추를 누를 차례인지 */
  hot: boolean;
  onAct: () => void;
}

const Copilot = ({ hot, onAct, className }: { hot: boolean; onAct: () => void; className: string }) => (
  <button type="button" className={`${className}${hot ? ' is-hunt' : ''}`} aria-label="Copilot" {...(hot ? { 'data-act': 'copilot', onClick: onAct } : { tabIndex: -1 })}>
    <img src="logo/copilot/copilot.png" alt="" />
  </button>
);
const Bar = ({ logo, app, search }: { logo?: string; app: string; search?: string }) => (
  <div className="sc-win ww-title">
    {logo && <img className="or-logo" src={logo} alt="" />}
    <span className="sc-win-name">{app}</span>
    {search && <span className="or-search"><SearchRegular />{search}</span>}
    <span className="or-me" aria-hidden="true">나</span>
    <span className="sc-win-btns" aria-hidden="true"><i>─</i><i>▢</i><i>✕</i></span>
  </div>
);
const icons = (list: ReactNode[]) => list.map((x, i) => <i key={i}>{x}</i>);

export function WebTop({ surface, name, zone, hot, onAct }: Props) {
  if (surface === 'outlook') {
    return (
      <>
        <Bar logo="logo/m365/outlook.svg" app="Outlook" search="검색하거나 Copilot에게 질문하기" />
        <div className={`sc-ribbon ww-ribbon ${zone}`}>
          <div className="or-tabs"><span><i><NavigationRegular /></i><i>파일</i><i className="on">홈</i><i>보기</i><i>도움말</i></span></div>
          <div className="ww-cmds">
            <span className="ww-new"><ComposeRegular />새 메일 ⌄</span>
            <span className="ww-ico">{icons([<DeleteRegular />, <ArchiveRegular />, <FolderArrowRightRegular />])}</span>
            <span className="ww-ico">{icons([<ArrowReplyRegular />, <ArrowReplyAllRegular />, <ArrowForwardRegular />])}</span>
            <span className="ww-txt"><FlashRegular />빠른 단계 ⌄</span>
            <span className="ww-txt"><MailReadRegular />모두 읽은 상태로 표시</span>
            <span className="ww-ico">{icons([<MoreHorizontalRegular />])}</span>
            <Copilot hot={hot} onAct={onAct} className="ww-copilot" />
          </div>
        </div>
      </>
    );
  }
  if (surface === 'teams') {
    return (
      <>
        <Bar app="‹  ›" search="검색하거나 Copilot에게 질문하기(Ctrl+E)" />
        <div className={`sc-ribbon ww-ribbon is-teams ${zone}`}>
          <div className="ww-chat">
            <b className="ww-av" aria-hidden="true">{name.slice(0, 1)}</b>
            <strong>{name}</strong>
            <span className="or-tabs"><span><i className="on">채팅</i><i>공유</i><i>노트</i><i>요약</i><i>＋</i></span></span>
            <span className="ww-end">
              <span className="ww-txt"><VideoRegular />참가</span>
              <span className="ww-ico">{icons([<PeopleRegular />])}</span>
              <Copilot hot={hot} onAct={onAct} className="ww-copilot is-small" />
              <span className="ww-ico">{icons([<SearchRegular />, <MoreHorizontalRegular />])}</span>
            </span>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="sc-win ww-title is-forms">
        <span className="sc-win-name"><b>Forms</b></span>
        <span className="ww-doc">{name} - 저장됨 ⌄</span>
        <span className="or-me" aria-hidden="true">나</span>
      </div>
      <div className={`sc-ribbon ww-ribbon is-forms ${zone}`}>
        <div className="ww-cmds is-end">
          <span className="ww-txt"><PaintBrushRegular />스타일</span>
          <span className="ww-txt"><SettingsRegular />설정</span>
          <span className="ww-txt"><EyeRegular />미리 보기</span>
          <span className="ww-pill is-fill"><SendRegular />응답 수집</span>
          <span className="ww-pill"><DataBarVerticalRegular />응답 보기</span>
          <span className="ww-txt"><SlideLayoutRegular />프레젠테이션</span>
          <span className="ww-ico">{icons([<MoreHorizontalRegular />])}</span>
        </div>
      </div>
    </>
  );
}
