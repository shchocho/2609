import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles/reference.css';
import './styles/overrides.css';
import { App } from './App';
import { applyTrackColors } from './tracks';

/** 브랜드 색 변수 */
const BRAND: Record<string, string> = {
  '--copilot-neutral': '#F6F9F0',
  '--copilot-black': '#242424',
  '--copilot-overlap-green': '#AEE02F',
  '--copilot-overlap-blue': '#4DD2E3',
};
const PRODUCT: Record<string, [string, string, string]> = {
  word: ['#0054D3', '#4DACFF', '#002866'],
  excel: ['#359238', '#C7F5B7', '#1B4A1D'],
  outlook: ['#00AEE2', '#B1F7FF', '#004255'],
  powerpoint: ['#FF5900', '#FFD2BE', '#662300'],
  teams: ['#9443FF', '#C5B7FF', '#2C0066'],
  onenote: ['#DE4AFF', '#FFA5F0', '#530066'],
};
const root = document.documentElement;
for (const [k, v] of Object.entries(BRAND)) root.style.setProperty(k, v);
for (const [app, [bright, light, dark]] of Object.entries(PRODUCT)) {
  root.style.setProperty(`--m365-${app}-bright`, bright);
  root.style.setProperty(`--m365-${app}-light`, light);
  root.style.setProperty(`--m365-${app}-dark`, dark);
}
applyTrackColors();

/** 부스 화면 배율: 1371×768(가로) / 1080 폭(세로) 기준으로 확대 */
function fitZoom() {
  const portrait = window.innerHeight >= window.innerWidth;
  const z = portrait
    ? Math.min(Math.max(window.innerWidth / 1080, 1), 2.5)
    : Math.min(window.innerWidth / 1371, window.innerHeight / 768, 2.5);
  root.style.zoom = String(z);
  root.dataset.orient = portrait ? 'portrait' : 'landscape';
  root.style.setProperty('--booth-zoom', String(z));
}
fitZoom();
window.addEventListener('resize', fitZoom);

/** 키보드로 이동할 때만 포커스 테두리 표시 */
const kbd = (on: boolean) => () => root.toggleAttribute('data-kbd', on);
window.addEventListener('keydown', e => { if (e.key === 'Tab') kbd(true)(); }, true);
window.addEventListener('pointerdown', kbd(false), true);
window.addEventListener('touchstart', kbd(false), true);

const el = document.getElementById('root');
if (el) createRoot(el).render(<StrictMode><App /></StrictMode>);
