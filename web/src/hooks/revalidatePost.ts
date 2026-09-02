import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../payload-types'
import { safeRevalidatePath } from '../lib/safeRevalidate'

// Новости показываются в ленте /news и на своей странице; главная берёт
// последние — ревалидируем все три.
const revalidatePostPaths = (payload: { logger: { info: (m: string) => void } }, slug?: string | null) => {
  payload.logger.info(`[revalidate] posts → / + /news${slug ? ` + /news/${slug}` : ''}`)
  safeRevalidatePath('/', 'page')
  safeRevalidatePath('/news', 'page')
  if (slug) safeRevalidatePath(`/news/${slug}`, 'page')
}

export const revalidatePost: CollectionAfterChangeHook<Post> = ({ doc, previousDoc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    revalidatePostPaths(payload, doc.slug)
    if (previousDoc?.slug && previousDoc.slug !== doc.slug) safeRevalidatePath(`/news/${previousDoc.slug}`, 'page')
  }
  return doc
}

export const revalidatePostDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) revalidatePostPaths(payload, doc.slug)
  return doc
}
