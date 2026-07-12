// Константы сайта. Все внешние URL — строго punycode (G133/G134).
export const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
export const SITE_NAME = 'Ярмарка Казанская в Малмыже'
export const FEST_DATE_ISO = '2026-07-25'
export const FEST_DATE_HUMAN = 'суббота, 25 июля 2026'
export const FEST_THEME = '«Мы Вятские — люди хватские!»'
export const FEST_THEME_NOTE = 'к 90-летию Кировской области'

// Ежегодные темы карнавала (досье kazanskaya-visual-research, 2026-07-12).
// Только подтверждённые: 2011 — слабый источник, отмечено в UI.
export const YEAR_THEMES: { year: number; date?: string; theme: string; note?: string; weak?: boolean }[] = [
  { year: 2026, date: '25 июля', theme: 'Мы Вятские — люди хватские!', note: 'к 90-летию Кировской области' },
  { year: 2025, theme: 'Ярмарка собрала лучших мастеров', note: 'тема шествия уточняется' },
  { year: 2023, date: '22 июля', theme: 'Проведение подтверждено', note: 'тема шествия уточняется' },
  { year: 2016, date: '23 июля', theme: 'Год кино', note: 'персонажи советских и зарубежных фильмов; ~650 участников шествия' },
  { year: 2015, date: '18 июля', theme: 'Писатели шутят…', note: 'Год литературы: литературные и театральные персонажи' },
  { year: 2014, date: '19 июля', theme: 'Культура на все времена!', note: 'Год культуры; 430-летие Малмыжа; впервые «Этногород»' },
  { year: 2013, date: '20 июля', theme: 'ЭкоДом, и мы в нём', note: 'экология; спецпризы за костюмы из вторсырья' },
  { year: 2012, date: '~21 июля', theme: 'Город мастеров', note: 'акцент на ремёсла' },
  { year: 2011, date: '18 июля', theme: '«Умом Россию не понять…»', note: '20-я юбилейная ярмарка', weak: true },
]
