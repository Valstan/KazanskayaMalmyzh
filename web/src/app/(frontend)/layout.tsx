import type { Metadata } from 'next'
import React from 'react'

import './globals.css'

// Все внешние URL — строго punycode (G133/G134).
const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Ярмарка Казанская в Малмыже — 25 июля 2026',
  description:
    'Ярмарка Казанская — главный праздник Малмыжского района: карнавальное шествие, Город мастеров, Этногород, торговые ряды. Суббота 25 июля 2026, Малмыж.',
  openGraph: {
    title: 'Ярмарка Казанская в Малмыже — 25 июля 2026',
    description:
      'Карнавальное шествие, Город мастеров, Этногород, торговые ряды и фейерверк. Малмыж, 25 июля 2026.',
    url: SITE_URL,
    locale: 'ru_RU',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
