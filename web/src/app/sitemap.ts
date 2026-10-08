import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import { entryForPath, type SitemapDates } from '../lib/sitemap'
import { SITE_URL } from '../lib/site'
import { yearsWithPage } from '../lib/years'

/** max updatedAt опубликованной коллекции. БД недоступна — null, а не ложь. */
const maxUpdatedAt = async (collection: 'events' | 'posts'): Promise<Date | null> => {
  try {
    const payload = await getPayload({ config })
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
  } catch {
    return null
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, posts] = await Promise.all([maxUpdatedAt('events'), maxUpdatedAt('posts')])
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
