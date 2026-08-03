// Константы сайта. Все внешние URL — строго punycode (G133/G134).
export const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
export const SITE_NAME = 'Ярмарка Казанская в Малмыже'
export const FEST_DATE_ISO = '2026-07-25'
export const FEST_DATE_HUMAN = 'суббота, 25 июля 2026'
export const FEST_THEME = '«Мы Вятские — люди хватские!»'
export const FEST_THEME_NOTE = 'к 90-летию Кировской области'

// Отмена праздника (объявлено 24.07.2026, новая дата не назначена). Один флаг на
// весь сайт: гасит обратный отсчёт на главной и live-режим программы, переводит
// JSON-LD в EventCancelled, включает объявление в шапке. Назначат новую дату —
// правим FEST_DATE_* и ставим false, остальное подтянется само.
// Тип boolean задан явно: иначе TS сузит константу до литерала `true` и ветки
// «праздник в силе» станут для него мёртвым кодом (Countdown, live-режим).
export const FEST_CANCELLED: boolean = true
export const FEST_CANCEL_TITLE = 'Смотрим вперёд — к 2027 году'
export const FEST_CANCEL_LEAD =
  'Ярмарка Казанская, запланированная на 25 июля 2026 года, не состоится.'
export const FEST_CANCEL_NOTE = 'Праздник 2026 года не будет перенесён; ждём новостей о Ярмарке 2027 года.'
export const FEST_CANCEL_ANNOUNCED = '24 июля 2026'

// Каталог сервисов Малмыжа (единая точка входа экосистемы, директива brain от
// 2026-07-26). Домен вход.вмалмыже.рф — только в punycode (G133/G134).
export const SERVICES_CATALOG_URL = 'https://xn--b1ae3a1a.xn--80adkdyec4j.xn--p1ai/services'

// Ежегодные темы карнавала переехали в lib/years.ts (летопись с абзацами,
// фото и источниками — данные /years и /years/<год>).
