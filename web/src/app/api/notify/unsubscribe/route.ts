import { getPayload } from 'payload'

import config from '@payload-config'
import { clientIp, hashToken, takeThrottleSlot, type ThrottleStore } from '../../../../lib/notify'

// GET /api/notify/unsubscribe?token=… — удаление заявки (ссылка из письма).
// Нашли по хэшу — удалили; не нашли — та же страница без подробностей.
const slots: ThrottleStore = new Map()

const page = (title: string, text: string): Response => {
  const html = [
    '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title}</title></head><body><main style="max-width:40rem;margin:4rem auto;padding:0 1rem;font-family:sans-serif">`,
    `<h1>${title}</h1><p>${text}</p><p><a href="/">На главную</a></p>`,
    '</main></body></html>',
  ].join('')
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

export async function GET(request: Request): Promise<Response> {
  const ip = clientIp(request.headers.get('x-forwarded-for'))
  if (!takeThrottleSlot(slots, ip, Date.now(), 30)) {
    return page('Слишком много попыток', 'Подождите час и попробуйте снова.')
  }

  const token = new URL(request.url).searchParams.get('token') ?? ''
  if (/^[0-9a-f]{64}$/.test(token)) {
    const payload = await getPayload({ config })
    const found = await payload.find({
      collection: 'subscribers',
      where: { tokenHash: { equals: hashToken(token) } },
      limit: 1,
      overrideAccess: true,
    })
    const row = found.docs[0] as { id: string | number } | undefined
    if (row) {
      await payload.delete({ collection: 'subscribers', id: row.id, overrideAccess: true })
    }
  }
  return page(
    'Адрес удалён из списка',
    'Этой почты больше нет в списке «позвать на дату». Если передумаете — форма на главной странице.',
  )
}
