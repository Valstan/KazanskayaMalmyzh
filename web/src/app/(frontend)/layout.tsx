import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import { Yeseva_One, Nunito_Sans, PT_Sans } from 'next/font/google'

import { SITE_URL, SITE_NAME, FEST_DATE_HUMAN, FEST_CANCELLED } from '../../lib/site'
import { CancelBanner } from './_components/CancelNotice'
import { Metrika } from './_components/Metrika'
import { MetrikaInformer } from './_components/MetrikaInformer'
import { SiteNav } from './_components/SiteNav'
import './globals.css'
import './festive.css'

// Шрифты темы «Ярмарочный лубок» (спека design/inbox/19июля2026): декоративный
// дисплей только для крупных заголовков + спокойные читаемые гротески интерфейса.
const display = Yeseva_One({ subsets: ['cyrillic', 'latin'], weight: '400', variable: '--font-display', display: 'swap' })
const heading = Nunito_Sans({ subsets: ['cyrillic', 'latin'], weight: ['600', '700', '800'], variable: '--font-heading', display: 'swap' })
const body = PT_Sans({ subsets: ['cyrillic', 'latin'], weight: ['400', '700'], variable: '--font-body', display: 'swap' })

// Пока праздник отменён, титул и описания говорят об этом прямо: выдача
// поисковиков — первое место, где человек проверяет «а состоится ли».
const TITLE = FEST_CANCELLED ? `${SITE_NAME} — вспоминаем ярмарку и ждём 2027 год` : `${SITE_NAME} — 25 июля 2026`
const DESCRIPTION = FEST_CANCELLED
  ? 'История и фотолетопись Ярмарки Казанской, атмосфера Малмыжа и идеи для поездки на два-три дня. Ждём новостей о празднике 2027 года.'
  : 'Ярмарка Казанская — главный праздник Малмыжского района: карнавальное шествие, Город мастеров, Этногород, торговые ряды. Суббота 25 июля 2026, Малмыж.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: FEST_CANCELLED
      ? 'Вспоминаем прошлые ярмарки, открываем Малмыжский район и ждём 2027 год.'
      : 'Карнавальное шествие, Город мастеров, Этногород, торговые ряды и фейерверк. Малмыж, 25 июля 2026.',
    url: SITE_URL,
    locale: 'ru_RU',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${heading.variable} ${body.variable}`}>
      <body>
        <header className="site-header">
          <div className="wrap site-header__inner">
            <Link href="/" className="brand" aria-label="Ярмарка Казанская — на главную">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="brand__logo" src="/decor/logo.png" alt="" width={44} height={54} />
              <span className="brand__text">Ярмарка&nbsp;Казанская</span>
            </Link>
            <SiteNav />
          </div>
          <div className="ornament" aria-hidden />
        </header>

        {FEST_CANCELLED && <CancelBanner />}

        {children}

        <footer className="site-footer">
          <div className="ornament ornament--gold" aria-hidden />
          <div className="wrap site-footer__inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="site-footer__logo" src="/decor/logo.png" alt="Логотип Ярмарки Казанской" width={96} height={118} />
            <p className="site-footer__brand">Ярмарка&nbsp;Казанская</p>
            <p>
              {FEST_CANCELLED ? (
                <>
                  г. Малмыж, Кировская область. Ярмарка {FEST_DATE_HUMAN} не состоялась;
                  ждём новостей о 2027 годе.
                </>
              ) : (
                <>
                  {FEST_DATE_HUMAN} · г. Малмыж, Кировская область. С девяти утра субботы — до утра
                  воскресенья.
                </>
              )}
            </p>
            <p>
              Оргкомитет: карнавал и ремесленники — (83347) 2‑22‑28, торговля — (83347) 2‑28‑83.
            </p>
            <p className="site-footer__links">
              <Link href="/istochniki-foto">Источники фотографий</Link>
            </p>
            <p>
              Разработка —{' '}
              <a
                href="https://xn--80adkmnnb2b.xn--80adkdyec4j.xn--p1ai/"
                rel="author"
              >
                Валентин Савиных
              </a>
            </p>
            <div className="site-footer__counters" aria-label="Посещаемость сайта">
              <MetrikaInformer />
            </div>
          </div>
        </footer>
        <Metrika />
      </body>
    </html>
  )
}
