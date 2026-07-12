import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { SITE_URL, SITE_NAME, FEST_DATE_HUMAN } from '../../lib/site'
import './globals.css'

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
    <html lang="ru">
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand">
              Ярмарка Казанская
            </Link>
            <nav className="site-nav">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className="ornament" />
        {children}
        <footer className="site-footer">
          <div className="wrap">
            <p>
              Ярмарка Казанская — {FEST_DATE_HUMAN}, г. Малмыж, Кировская область.
              Оргкомитет: карнавал и ремесленники — (83347) 2‑22‑28, торговля — (83347) 2‑28‑83.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
