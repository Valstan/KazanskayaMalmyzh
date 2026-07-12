import type { GlobalAfterChangeHook } from 'payload'

import { safeRevalidatePath } from '../lib/safeRevalidate'

export const revalidateFestivalMap: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('[revalidate] festival-map → /map')
    safeRevalidatePath('/map', 'page')
  }
  return doc
}
