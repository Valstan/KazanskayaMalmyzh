import type { MetadataRoute } from 'next'

import { SITE_URL } from '../lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return ['/', '/program', '/history', '/years', '/map', '/gallery'].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '/' || path === '/program' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }))
}
