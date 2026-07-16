import type { MetadataRoute } from 'next'

import { SITE_URL } from '../lib/site'
import { yearsWithPage } from '../lib/years'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const paths = [
    '/',
    '/program',
    '/history',
    '/years',
    '/map',
    '/gallery',
    ...yearsWithPage().map((y) => `/years/${y}`),
  ]
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '/' || path === '/program' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }))
}
