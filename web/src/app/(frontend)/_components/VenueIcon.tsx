import React from 'react'

import type { VenueIconKey } from '../../../lib/venues'

// Восемь пиктограмм площадок по спеке редизайна (design/inbox/19июля2026
// §3): одноцветный плотный силуэт без тонких штрихов, холст 32×32, оптическое
// поле ~28×28, `fill: currentColor; stroke: none` — цвет берётся у текста
// заголовка площадки. Inline-SVG, а не спрайт: знак резкий на любом экране и
// перекрашивается вместе с темой.
const PATHS: Record<VenueIconKey, React.ReactNode> = {
  // 1. Городской парк / сквер: крона, короткий ствол, скамейка (три горизонтали).
  park: (
    <>
      <circle cx="16" cy="10" r="7" />
      <circle cx="10.5" cy="13" r="4.5" />
      <circle cx="21.5" cy="13" r="4.5" />
      <rect x="14.5" y="15" width="3" height="7" />
      <rect x="4" y="22" width="24" height="2.4" />
      <rect x="4" y="25.6" width="24" height="2.4" />
      <rect x="6" y="28" width="2.4" height="2" />
      <rect x="23.6" y="28" width="2.4" height="2" />
    </>
  ),
  // 2. Центральные улицы: три фасада разной высоты, башенка, окна.
  streets: (
    <path
      fillRule="evenodd"
      d="M3 30V14h8v16H3zm10 0V8h4V4l2-2 2 2v4h4v22H13zm14 0V17h3v13h-3zM5.5 17h3v2.5h-3V17zm0 5h3v2.5h-3V22zm10-9h3v2.5h-3V13zm0 5h3v2.5h-3V18zm0 5h3v2.5h-3V23zm5-10h3v2.5h-3V13zm0 5h3v2.5h-3V18zm0 5h3v2.5h-3V23z"
    />
  ),
  // 3. Стадион: овальная арена, внутреннее поле, маленький флаг.
  stadium: (
    <>
      <path
        fillRule="evenodd"
        d="M16 9C8.8 9 3 13.5 3 19s5.8 10 13 10 13-4.5 13-10S23.2 9 16 9zm0 4c4.4 0 8 2.7 8 6s-3.6 6-8 6-8-2.7-8-6 3.6-6 8-6z"
      />
      <rect x="15" y="1" width="2" height="9" />
      <path d="M17 1h7l-2 2.5L24 6h-7z" />
    </>
  ),
  // 4. Площадка в парке: беседка — крыша-трапеция, четыре стойки, основание.
  pavilion: (
    <>
      <path d="M16 3 2 12h28L16 3z" />
      <rect x="4" y="13.5" width="2.6" height="12" />
      <rect x="11" y="13.5" width="2.6" height="12" />
      <rect x="18.4" y="13.5" width="2.6" height="12" />
      <rect x="25.4" y="13.5" width="2.6" height="12" />
      <rect x="2" y="26" width="28" height="3.5" />
    </>
  ),
  // 5. Главная сцена: портал с верхней балкой, две стойки, прожекторы, занавес.
  stage: (
    <>
      <rect x="2" y="3" width="28" height="3.5" />
      <rect x="3" y="6.5" width="3" height="21" />
      <rect x="26" y="6.5" width="3" height="21" />
      <circle cx="11" cy="9.5" r="2" />
      <circle cx="16" cy="9.5" r="2" />
      <circle cx="21" cy="9.5" r="2" />
      <path d="M7 13h18v2c-1.5 2-2 6-2 11H9c0-5-.5-9-2-11v-2z" />
      <rect x="2" y="27.5" width="28" height="2.5" />
    </>
  ),
  // 6. Торговые ряды: три соседних шатра с полосатыми навесами.
  trade: (
    <>
      <path d="M2 13 7 5h6l5 8H2zm12 0 5-8h6l5 8H14z" />
      <path d="M2 13c0 2.2 1.3 3.5 3 3.5S8 15.2 8 13H2zm6 0c0 2.2 1.3 3.5 3 3.5s3-1.3 3-3.5H8zm6 0c0 2.2 1.3 3.5 3 3.5s3-1.3 3-3.5h-6zm6 0c0 2.2 1.3 3.5 3 3.5s3-1.3 3-3.5h-6z" />
      <rect x="4" y="17.5" width="10" height="11" />
      <rect x="18" y="17.5" width="10" height="11" />
      <rect x="2" y="28.5" width="28" height="1.5" />
    </>
  ),
  // 7. Этногород: глиняный кувшин с геометрическим орнаментом.
  ethno: (
    <path
      fillRule="evenodd"
      d="M12 2h8v3.5c0 1.2-.5 2-1.4 2.6C23.5 9.5 26 13.5 26 18.5c0 6-4.2 10.5-10 10.5S6 24.5 6 18.5c0-5 2.5-9 7.4-10.4C12.5 7.5 12 6.7 12 5.5V2zm-2 16.5 6-3 6 3-6 3-6-3z"
    />
  ),
  // 8. Районный дом культуры: симметричное здание с фронтоном и четырьмя колоннами.
  culture: (
    <>
      <path d="M16 2 1.5 10.5h29L16 2z" />
      <rect x="3" y="11.5" width="26" height="2.5" />
      <rect x="5" y="15" width="3" height="11" />
      <rect x="11.5" y="15" width="3" height="11" />
      <rect x="17.5" y="15" width="3" height="11" />
      <rect x="24" y="15" width="3" height="11" />
      <rect x="2" y="26.5" width="28" height="3.5" />
    </>
  ),
}

export function VenueIcon({ kind, className }: { kind: VenueIconKey; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width={32}
      height={32}
      fill="currentColor"
      stroke="none"
      aria-hidden
      focusable="false"
    >
      {PATHS[kind]}
    </svg>
  )
}
