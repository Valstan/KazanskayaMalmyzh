import { describe, expect, it } from 'vitest'

import { galleryStories, storyRefCount } from './galleryPhotos'

describe('галерея историями', () => {
  const stories = galleryStories()

  it('каждая ссылка на фото летописи разрешилась — ни один кадр не потерян молча', () => {
    const resolved = stories.reduce((n, s) => n + s.photos.length, 0)
    expect(resolved).toBe(storyRefCount())
  })

  it('у каждой истории есть кадры и у каждого кадра — атрибуция', () => {
    for (const s of stories) {
      expect(s.photos.length).toBeGreaterThan(0)
      for (const p of s.photos) {
        expect(p.src).toMatch(/^\/(decor|years)\/.+\.jpg$/)
        expect(p.credit.label).toBeTruthy()
      }
    }
  })

  it('один и тот же кадр не попадает в две истории', () => {
    const all = stories.flatMap((s) => s.photos.map((p) => p.src))
    expect(new Set(all).size).toBe(all.length)
  })
})
