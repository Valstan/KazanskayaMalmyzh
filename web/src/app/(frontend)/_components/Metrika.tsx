import Script from 'next/script'
import React from 'react'

// Яндекс.Метрика: включается только когда задан NEXT_PUBLIC_YM_ID
// (счётчик заведёт владелец; домен — в адрес-фильтры, G136).
export function Metrika() {
  const id = process.env.NEXT_PUBLIC_YM_ID
  if (!id) return null
  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],
        k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
        ym(${JSON.stringify(Number(id))}, 'init', {clickmap:true, trackLinks:true, accurateTrackBounce:true});`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://mc.yandex.ru/watch/${id}`} style={{ position: 'absolute', left: '-9999px' }} alt="" />
      </noscript>
    </>
  )
}
