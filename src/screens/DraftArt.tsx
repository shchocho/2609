/**
 * 이미지 시안(?look=draft)에서 쓰는 새 그래픽.
 * 원본 부스의 대기 화면 영상·목록 상단 그래픽 대신, 코드로 그린 그래픽을 씁니다.
 * 제품 로고(Copilot, Microsoft 365 앱 아이콘)는 제품 UI의 일부라 그대로 씁니다.
 */
import type { CSSProperties, ReactNode } from 'react';

type CardProps = { cls: string; app?: string; style: CSSProperties; children: ReactNode };

function Card({ cls, app, style, children }: CardProps) {
  return (
    <div className={`dh-card ${cls}`} style={style}>
      {app && <img className="dh-badge" src={`logo/m365/${app}.svg`} alt="" />}
      {children}
    </div>
  );
}

/** 대기 화면: 업무 카드들이 Copilot 주위에 떠 있는 장면 */
export function DraftHero() {
  return (
    <div className="booth-attract-art draft-hero" aria-hidden="true">
      <svg className="dh-links" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M50 50 C 40 44, 30 38, 24 34" />
        <path d="M50 50 C 60 42, 70 34, 84 30" />
        <path d="M50 50 C 42 60, 36 66, 30 72" />
        <path d="M50 50 C 60 58, 68 62, 76 66" />
        <path d="M50 50 C 54 40, 58 32, 63 26" />
      </svg>

      <Card cls="is-sheet" app="excel" style={{ left: '7%', top: '17%', '--r': '-6deg', '--d': '0s' } as CSSProperties}>
        <i className="dh-head"><b /><s /></i>
        <span className="dh-grid">
          {Array.from({ length: 16 }, (_, i) => <em key={i} className={[5, 6, 10].includes(i) ? 'on' : ''} />)}
        </span>
      </Card>

      <Card cls="is-chat" app="teams" style={{ left: '57%', top: '13%', '--r': '3deg', '--d': '-2.2s' } as CSSProperties}>
        <span className="dh-bubble" /><span className="dh-bubble is-me" /><span className="dh-bubble is-short" />
      </Card>

      <Card cls="is-doc" app="word" style={{ right: '7%', top: '14%', '--r': '5deg', '--d': '-1.1s' } as CSSProperties}>
        <i className="dh-head"><b /></i>
        <span className="dh-lines"><s /><s /><s /><s /><s /></span>
      </Card>

      <Card cls="is-slide" app="powerpoint" style={{ left: '15%', top: '55%', '--r': '4deg', '--d': '-3.4s' } as CSSProperties}>
        <span className="dh-bars"><s style={{ height: '38%' }} /><s style={{ height: '62%' }} /><s style={{ height: '48%' }} /><s style={{ height: '84%' }} /></span>
      </Card>

      <Card cls="is-mail" app="outlook" style={{ right: '13%', top: '54%', '--r': '-4deg', '--d': '-0.6s' } as CSSProperties}>
        <span className="dh-mail"><i /><span><s /><s /></span></span>
        <span className="dh-mail"><i /><span><s /><s /></span></span>
      </Card>

      <div className="dh-core">
        <span className="dh-orbit" />
        <span className="dh-glow" />
        <img src="logo/copilot/copilot.png" alt="" />
        <i className="dh-spark is-a" /><i className="dh-spark is-b" /><i className="dh-spark is-c" />
      </div>
    </div>
  );
}

/** 목록 화면 상단: 영역 색으로 칠한 둥근 카드 묶음 */
export function DraftTrackArt() {
  return (
    <svg className="booth-hero-art draft-track-art" viewBox="0 0 360 240" aria-hidden="true">
      <defs>
        <linearGradient id="dtaA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--track, #6c4bb6)" stopOpacity=".55" />
          <stop offset="1" stopColor="var(--track, #6c4bb6)" stopOpacity=".12" />
        </linearGradient>
        <linearGradient id="dtaB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe3ff" />
          <stop offset="1" stopColor="#e8defc" />
        </linearGradient>
      </defs>
      <rect x="150" y="18" width="150" height="150" rx="36" fill="url(#dtaB)" transform="rotate(12 225 93)" />
      <rect x="70" y="70" width="170" height="170" rx="40" fill="url(#dtaA)" transform="rotate(-8 155 155)" />
      <circle cx="292" cy="190" r="34" fill="#fff" fillOpacity=".7" />
      <path d="M292 172l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="var(--track, #6c4bb6)" fillOpacity=".8" />
    </svg>
  );
}
