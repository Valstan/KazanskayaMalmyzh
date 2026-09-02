import { getPayload } from 'payload'

import config from '@payload-config'
import type { Media, Post } from '../payload-types'

// Доступ к новостям для страниц /news и главной. Читает только опубликованное;
// на пустой БД (CI, dev без базы) возвращает пусто, а не падает — страницы
// рендерят заглушку (G203: страницы с данными — force-dynamic).

export const RUBRIC_LABEL: Record<string, string> = {
  festival: 'Праздник',
  prep: 'Подготовка и заявки',
  crafts: 'Ремёсла и мастера',
  culture: 'Культура района',
  history: 'История',
  other: 'Другое',
}

export const POSTS_PER_PAGE = 20

export type PostCard = {
  id: number
  slug: string
  title: string
  date: string | null
  rubric: string | null
  summary: string
  coverUrl: string | null
  sourceUrl: string | null
}

const mediaUrl = (m: unknown): string | null =>
  m && typeof m === 'object' && typeof (m as Media).url === 'string' ? ((m as Media).url as string) : null

// Лид для ленты: summary, иначе первые фразы первого абзаца richText.
const excerpt = (post: Post): string => {
  if (post.summary?.trim()) return post.summary.trim()
  const root = (post.content as { root?: { children?: { type?: string; children?: { text?: string }[] }[] } } | null)
    ?.root
  const firstParagraph = root?.children?.find((n) => n.type === 'paragraph')
  const text = firstParagraph?.children?.map((c) => c.text ?? '').join('') ?? ''
  return text.length > 180 ? `${text.slice(0, 180).trimEnd()}…` : text
}

export const toCard = (post: Post): PostCard => ({
  id: post.id,
  slug: post.slug ?? String(post.id),
  title: post.title,
  date: post.date ?? post.publishedAt ?? null,
  rubric: post.rubric ?? null,
  summary: excerpt(post),
  coverUrl: mediaUrl(post.cover),
  sourceUrl: post.source?.sourceUrl ?? null,
})

export async function findPublishedPosts(limit = POSTS_PER_PAGE): Promise<PostCard[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit,
      depth: 1,
    })
    return res.docs.map(toCard)
  } catch {
    return []
  }
}

export async function findPostBySlug(slug: string): Promise<Post | null> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'posts',
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
      limit: 1,
      depth: 1,
    })
    return res.docs[0] ?? null
  } catch {
    return null
  }
}

// id → url для upload-узлов richText (gallery уже populated с depth 1).
export const mediaMapOf = (post: Post): Record<string, string | undefined> => {
  const map: Record<string, string | undefined> = {}
  for (const m of post.gallery ?? []) {
    if (m && typeof m === 'object') map[String((m as Media).id)] = (m as Media).url ?? undefined
  }
  const cover = post.cover
  if (cover && typeof cover === 'object') map[String((cover as Media).id)] = (cover as Media).url ?? undefined
  return map
}

export const fmtDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' })
