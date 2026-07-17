import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import { Ruslan_Display, Playfair_Display, PT_Serif } from 'next/font/google'

import { SITE_URL, SITE_NAME, FEST_DATE_HUMAN } from '../../lib/site'
import { Metrika } from './_components/Metrika'
import { LiveInternet } from './_components/LiveInternet'
import './globals.css'

// Праздничные шрифты (research-first): орнаментальный дисплей в духе старинных
// ярмарочных вывесок + нарядный заголовочный серив + читаемый книжный серив тела.
const display = Ruslan_Display({ subsets: ['cyrillic', 'latin'], weight: '400', variable: '--font-display', display: 'swap' })
const heading = Playfair_Display({ subsets: ['cyrillic', 'latin'], weight: ['600', '700', '800'], variable: '--font-heading', display: 'swap' })
const body = PT_Serif({ subsets: ['cyrillic', 'latin'], weight: ['400', '700'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 25 июля 2026`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    'Ярмарка Казанская — главный праздник Малмыжского района: карнавальное шествие, Город мастеров, Этногород, торговые ряды. Суббота 25 июля 2026, Малмыж.',
  openGraph: {
    title: `${SITE_NAME} — 25 июля 2026`,
    description:
      'Карнавальное шествие, Город мастеров, Этногород, торговые ряды и фейерверк. Малмыж, 25 июля 2026.',
    url: SITE_URL,
    locale: 'ru_RU',
    type: 'website',
  },
}

const NAV = [
  { href: '/', label: 'Главная' },
  { href: '/program', label: 'Программа' },
  { href: '/history', label: 'История' },
  { href: '/years', label: 'Как это было' },
  { href: '/map', label: 'Карта' },
  { href: '/gallery', label: 'Галерея' },
]

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
            <nav className="site-nav">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="ornament" aria-hidden />
        </header>

        {children}

        <footer className="site-footer">
          <div className="ornament ornament--gold" aria-hidden />
          <div className="wrap site-footer__inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="site-footer__logo" src="/decor/logo.png" alt="Логотип Ярмарки Казанской" width={96} height={118} />
            <p className="site-footer__brand">Ярмарка&nbsp;Казанская</p>
            <p>
              {FEST_DATE_HUMAN} · г. Малмыж, Кировская область. С девяти утра субботы — до утра
              воскресенья.
            </p>
            <p>
              Оргкомитет: карнавал и ремесленники — (83347) 2‑22‑28, торговля — (83347) 2‑28‑83.
            </p>
            <p className="site-footer__links">
              <Link href="/istochniki-foto">Источники фотографий</Link>
            </p>
            <div className="site-footer__counters" aria-label="Счётчики посещаемости">
              <LiveInternet />
            </div>
          </div>
        </footer>
        <Metrika />
      </body>
    </html>
  )
}
