import { describe, expect, it } from 'vitest'

import {
  buildContent,
  buildPostData,
  findExistingPost,
  isPublished,
  normalizeRubric,
  normalizeVideos,
  secretMatches,
  type ExistingPost,
  type PostFinder,
} from './ingest'

// Тесты по следам двух багов вМалмыже (03.08), проехавших через зелёные lint и
// typecheck: публикация через `draft:false` и publish у любого держателя ключа.

const base = {
  title: 'Заголовок',
  text: 'Первый абзац.\nВторой абзац.\nТретий абзац.',
  vkPostId: '-1_2',
  sourceUrl: 'https://vk.com/wall-1_2',
  videos: [],
  mediaIds: [],
}

describe('публикация: _status, а не только draft', () => {
  it('publish=true проставляет _status: published', () => {
    expect(buildPostData({ ...base, publish: true })._status).toBe('published')
  })
  it('publish=false не проставляет _status — остаётся черновик', () => {
    expect(buildPostData({ ...base, publish: false })).not.toHaveProperty('_status')
  })
})

describe('право публиковать отделено от права присылать', () => {
  it('пустой или чужой секрет не даёт права', () => {
    expect(secretMatches('', 'настоящий')).toBe(false)
    expect(secretMatches('подделка', 'настоящий')).toBe(false)
  })
  it('ненастроенный секрет на сервере не пускает никого', () => {
    expect(secretMatches('что угодно', undefined)).toBe(false)
    expect(secretMatches('', undefined)).toBe(false)
  })
  it('верный секрет даёт право', () => {
    expect(secretMatches('настоящий', 'настоящий')).toBe(true)
  })
})

describe('даты: публикуем датой оригинала', () => {
  const date = '2026-07-31T09:20:00.000Z'
  it('без publishedAt подставляется дата новости, а не «сейчас»', () => {
    expect(buildPostData({ ...base, publish: true, date }).publishedAt).toBe(date)
  })
})

describe('рубрика', () => {
  it('известный slug принимается, неизвестный — warning и пусто', () => {
    const w: string[] = []
    expect(normalizeRubric('crafts', w)).toBe('crafts')
    expect(normalizeRubric('sport', w)).toBeUndefined()
    expect(w).toEqual(['unknown rubric: sport'])
  })
})

describe('медиа в тексте', () => {
  it('первое медиа — обложка, остальные встраиваются между абзацами узлами upload', () => {
    const content = buildContent(base.text, [], [10, 11, 12])
    const types = content.root.children.map((n) => n.type)
    expect(types.filter((t) => t === 'upload')).toHaveLength(2)
    expect(types[0]).toBe('paragraph')
    const uploads = content.root.children.filter((n) => n.type === 'upload') as unknown as {
      value: number
      relationTo: string
    }[]
    expect(uploads.map((u) => u.value)).toEqual([11, 12])
    expect(uploads[0].relationTo).toBe('media')
  })
  it('без текста, видео и медиа content не строится', () => {
    expect(buildPostData({ ...base, text: '', publish: false }).content).toBeUndefined()
  })
})

describe('видео', () => {
  it('ссылка на плеер становится узлом link в конце', () => {
    const content = buildContent('Текст.', [{ url: 'https://vk.com/video-1_2', title: 'Ролик' }])
    const last = content.root.children.at(-1) as unknown as { children: { type: string; fields?: { url?: string } }[] }
    expect(last.children.find((c) => c.type === 'link')?.fields?.url).toBe('https://vk.com/video-1_2')
  })
  it('мусорные ссылки отбрасываются с warning, лимит 5', () => {
    const w: string[] = []
    const videos = normalizeVideos(['javascript:1', ...Array(6).fill('https://vk.com/video-1_1')], w)
    expect(videos).toHaveLength(5)
    expect(w[0]).toMatch(/invalid url/)
    expect(w.at(-1)).toMatch(/truncated/)
  })
})

describe('поиск принятого поста: читаем запись, а не её версии (G320)', () => {
  // Фейк вместо payload: запоминает аргументы запроса и отдаёт то, что лежало бы
  // в основной таблице. Версии он не знает вовсе — в этом и смысл проверки.
  const finderReturning = (docs: ExistingPost[]) => {
    const calls: Record<string, unknown>[] = []
    return {
      calls,
      payload: {
        find: async (args: Record<string, unknown>) => {
          calls.push(args)
          return { docs }
        },
      } as unknown as PostFinder,
    }
  }

  it('запрос уходит БЕЗ draft — иначе вернутся версии, а не запись', async () => {
    const { calls, payload } = finderReturning([])
    await findExistingPost(payload, '-1_2')

    expect(calls).toHaveLength(1)
    // Именно отсутствие ключа, а не draft: false: с `draft: true` payload читает
    // таблицу версий, и _status приходит от последнего черновика.
    expect('draft' in calls[0]!).toBe(false)
    expect(calls[0]).toMatchObject({
      collection: 'posts',
      where: { 'source.vkPostId': { equals: '-1_2' } },
      limit: 1,
    })
  })

  it('опубликованный пост с черновиком поверх остаётся защищённым', async () => {
    // Ровно та авария: запись опубликована, поверх неё сохранён черновик.
    // Чтение версий отдало бы _status: draft, и приёмник затёр бы публикацию.
    const { payload } = finderReturning([{ id: 7, _status: 'published' }])
    const found = await findExistingPost(payload, '-1_2')

    expect(found?._status).toBe('published')
    expect(isPublished(found!)).toBe(true)
  })

  it('черновик не защищён — его приёмник обновляет', async () => {
    const { payload } = finderReturning([{ id: 8, _status: 'draft' }])
    const found = await findExistingPost(payload, '-1_3')

    expect(isPublished(found!)).toBe(false)
  })

  it('ничего не найдено — undefined, пост будет создан', async () => {
    const { payload } = finderReturning([])
    expect(await findExistingPost(payload, '-1_4')).toBeUndefined()
  })
})
