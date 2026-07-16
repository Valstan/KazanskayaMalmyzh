// Константы сайта. Все внешние URL — строго punycode (G133/G134).
export const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
export const SITE_NAME = 'Ярмарка Казанская в Малмыже'
export const FEST_DATE_ISO = '2026-07-25'
export const FEST_DATE_HUMAN = 'суббота, 25 июля 2026'
export const FEST_THEME = '«Мы Вятские — люди хватские!»'
export const FEST_THEME_NOTE = 'к 90-летию Кировской области'

// Ежегодные темы карнавала переехали в lib/years.ts (летопись с абзацами,
// фото и источниками — данные /years и /years/<год>).
