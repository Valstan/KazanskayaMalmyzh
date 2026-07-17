import Script from 'next/script'
import React from 'react'

// Публичный счётчик LiveInternet (сайт id 8155, тип t11.6 — 88×31, три числа:
// просмотры за 24 ч, посетители за 24 ч и посетители за сегодня). Плейсхолдер —
// прозрачный 1×1 GIF; живую картинку со счётом подставляет скрипт с counter.yadro.ru.
const PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export function LiveInternet() {
  return (
    <a
      href="https://www.liveinternet.ru/click"
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="li-counter"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="licnt8155"
        width={88}
        height={31}
        style={{ border: 0 }}
        src={PLACEHOLDER}
        alt="LiveInternet"
        title="LiveInternet: показано число просмотров за 24 часа, посетителей за 24 часа и за сегодня"
      />
      <Script id="liveinternet" strategy="afterInteractive">
        {`(function(d,s){var e=d.getElementById('licnt8155');if(!e)return;
        e.src='https://counter.yadro.ru/hit?t11.6;r'+escape(d.referrer)+
        ((typeof(s)=='undefined')?'':';s'+s.width+'*'+s.height+'*'+
        (s.colorDepth?s.colorDepth:s.pixelDepth))+';u'+escape(d.URL)+
        ';h'+escape(d.title.substring(0,150))+';'+Math.random()})(document,screen);`}
      </Script>
    </a>
  )
}
