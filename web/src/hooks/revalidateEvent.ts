import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Event } from '../payload-types'
import { safeRevalidatePath } from '../lib/safeRevalidate'

// Программа показывается на главной и на /program — ревалидируем обе.
const revalidateEventPaths = (payload: { logger: { info: (m: string) => void } }) => {
  payload.logger.info('[revalidate] events → / + /program')
  safeRevalidatePath('/', 'page')
  safeRevalidatePath('/program', 'page')
}

export const revalidateEvent: CollectionAfterChangeHook<Event> = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) revalidateEventPaths(payload)
  return doc
}

export const revalidateEventDelete: CollectionAfterDeleteHook<Event> = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) revalidateEventPaths(payload)
  return doc
}
