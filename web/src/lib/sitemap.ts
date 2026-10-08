// Чистое правило записей sitemap (вскрытие 08.10, пачка «потом»): lastmod —
// только там, где есть честный сигнал свежести (max updatedAt из БД).
// Для страниц на коде сигнала нет — поле опускаем, а не врём «сейчас»:
// краулер отсутствие lastmod переживает спокойно, а ложь про «всё изменилось
// только что» учит его нам не верить.

export type SitemapDates = {
  /** max updatedAt опубликованных событий (для /program и /map) */
  events: Date | null
  /** max updatedAt опубликованных новостей (для /news) */
  posts: Date | null
}

export type SitemapEntry = {
  path: string
  lastModified?: Date
  changeFrequency: 'daily' | 'weekly'
  priority: number
}

/** Одна запись по пути и датам из БД. Чистая — тестируется без базы. */
export const entryForPath = (path: string, dates: SitemapDates): SitemapEntry => {
  const changeFrequency: 'daily' | 'weekly' = path === '/' || path === '/program' ? 'daily' : 'weekly'
  const base: SitemapEntry = {
    path,
    changeFrequency,
    priority: path === '/' ? 1 : 0.7,
  }
  if (path === '/program' || path === '/map') {
    return dates.events ? { ...base, lastModified: dates.events } : base
  }
  if (path === '/news') {
    return dates.posts ? { ...base, lastModified: dates.posts } : base
  }
  return base
}
