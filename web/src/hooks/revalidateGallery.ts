import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Gallery } from '../payload-types'
import { safeRevalidatePath } from '../lib/safeRevalidate'

const revalidateGalleryPaths = (payload: { logger: { info: (m: string) => void } }) => {
  payload.logger.info('[revalidate] gallery → /gallery')
  safeRevalidatePath('/gallery', 'page')
}

export const revalidateGallery: CollectionAfterChangeHook<Gallery> = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) revalidateGalleryPaths(payload)
  return doc
}

export const revalidateGalleryDelete: CollectionAfterDeleteHook<Gallery> = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) revalidateGalleryPaths(payload)
  return doc
}
