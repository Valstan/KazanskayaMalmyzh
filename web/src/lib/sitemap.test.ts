// Приёмка честного lastmod: даты из БД попадают в свои пути, остальным —
// никакого lastmod (не «сейчас»). Красный контроль: naive-вариант,
// ставящий `new Date()` всем, этот тест проваливает построением.
import { describe, expect, it } from 'vitest'

import { entryForPath } from './sitemap'

const DATES = { events: new Date('2026-09-30T10:00:00.000Z'), posts: null }

describe('entryForPath', () => {
  it('/program и /map несут дату событий', () => {
    expect(entryForPath('/program', DATES).lastModified).toEqual(DATES.events)
    expect(entryForPath('/map', DATES).lastModified).toEqual(DATES.events)
  })

  it('/news без новостей — без lastmod, а не с «сейчас»', () => {
    expect(entryForPath('/news', DATES).lastModified).toBeUndefined()
  })

  it('/news с новостями несёт дату постов', () => {
    const posts = new Date('2026-10-01T10:00:00.000Z')
    expect(entryForPath('/news', { events: null, posts }).lastModified).toEqual(posts)
  })

  it('страницы на коде — без lastmod', () => {
    for (const path of ['/', '/history', '/years', '/years/2024', '/gallery', '/privacy']) {
      expect(entryForPath(path, DATES).lastModified).toBeUndefined()
    }
  })

  it('частота и приоритет как раньше', () => {
    expect(entryForPath('/', DATES)).toMatchObject({ changeFrequency: 'daily', priority: 1 })
    expect(entryForPath('/program', DATES)).toMatchObject({ changeFrequency: 'daily', priority: 0.7 })
    expect(entryForPath('/map', DATES)).toMatchObject({ changeFrequency: 'weekly', priority: 0.7 })
  })
})
