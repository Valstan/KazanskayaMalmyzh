import type { MetadataRoute } from 'next'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'
import { entryForPath, type SitemapDates } from '../lib/sitemap'
import { SITE_URL } from '../lib/site'
import { yearsWithPage } from '../lib/years'

// Даты берутся из живой БД — значит, роут обязан быть динамическим, иначе
// Next запечёт sitemap один раз при сборке (против пустой сборочной БД —
// класс G203) и будет отдавать окаменелость. Часового окна свежести достаточно:
// афиша меняется не чаще, а каждый хит краулера в БД не ходит.
export const revalidate = 3600

/** max updatedAt опубликованной коллекции. БД недоступна — null, а не ложь. */
const maxUpdatedAt = async (
  payload: Payload,
  collection: 'events' | 'posts',
): Promise<Date | null> => {
  try {
    const res = await payload.find({
      collection,
      where: { _status: { equals: 'published' } },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const updatedAt = res.docs[0]?.updatedAt
    return typeof updatedAt === 'string' ? new Date(updatedAt) : null
  } catch (error) {
    // Молчать здесь — ровно класс «403 без тела»: отказ неотличим от «данных
    // нет». Путь редкий (только когда БД недоступна), в журнале — одна строка.
    console.warn('[sitemap] maxUpdatedAt failed:', error instanceof Error ? error.message : error)
    return null
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Один getPayload на роут: параллельная инициализация Payload из двух
  // мест — гонка, после которой оба вызова лежат (наблюдали пустые даты
  // при Promise.all двух инициализаций 08.10).
  const payload = await getPayload({ config })
  const [events, posts] = await Promise.all([
    maxUpdatedAt(payload, 'events'),
    maxUpdatedAt(payload, 'posts'),
  ])
  const dates: SitemapDates = { events, posts }
  const paths = [
    '/',
    '/program',
    '/history',
    '/years',
    '/map',
    '/gallery',
    '/news',
    '/istochniki-foto',
    '/privacy',
    ...yearsWithPage().map((y) => `/years/${y}`),
  ]
  return paths.map((path) => {
    const entry = entryForPath(path, dates)
    return {
      url: `${SITE_URL}${path}`,
      ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    }
  })
}
