import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import config from '@payload-config'
import {
  buildConfirmEmail,
  clientIp,
  hashToken,
  HONEYPOT_FIELD,
  mintToken,
  normalizeEmail,
  takeThrottleSlot,
  type ThrottleStore,
} from '../../../../lib/notify'
import { SITE_URL } from '../../../../lib/site'

// POST /api/notify/subscribe — «позовите меня на дату 2027» (вскрытие 08.10).
// Тело: { email, [company] }. `company` — honeypot: бот заполняет, человек нет.
//
// Модель: формат+honeypot+троттлинг на входе, double opt-in письмом, в БД —
// только хэш токена. Ответ всегда `{ok:true}` при принятии (включая повтор и
// honeypot) — оракула «есть ли адрес в списке» нет. `overrideAccess` здесь
// явный и осознанный: сервер уже проверил вход, коллекция `create: () => false`
// закрыта для всех остальных (аудит #015).
const slots: ThrottleStore = new Map()

export async function POST(request: Request): Promise<NextResponse> {
  let body: { email?: unknown; [key: string]: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }

  const email = normalizeEmail(body.email)
  if (!email) return NextResponse.json({ error: 'invalid-email' }, { status: 400 })

  // Бот в ловушке — отвечаем как успехом, письмо никому не уходит.
  if (typeof body[HONEYPOT_FIELD] === 'string' && body[HONEYPOT_FIELD] !== '') {
    return NextResponse.json({ ok: true })
  }

  const ip = clientIp(request.headers.get('x-forwarded-for'))
  if (!takeThrottleSlot(slots, ip, Date.now())) {
    return NextResponse.json({ error: 'too-many' }, { status: 429 })
  }

  const payload = await getPayload({ config })
  const token = mintToken()
  const tokenHash = hashToken(token)

  const existing = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  const row = existing.docs[0] as { id: string | number; status?: string } | undefined

  if (row?.status === 'confirmed') return NextResponse.json({ ok: true })

  let createdId: string | number | null = null
  if (row) {
    await payload.update({
      collection: 'subscribers',
      id: row.id,
      data: { tokenHash },
      overrideAccess: true,
    })
  } else {
    const created = await payload.create({
      collection: 'subscribers',
      data: { email, status: 'pending', tokenHash, source: 'site-form' },
      overrideAccess: true,
    })
    createdId = created.id
  }

  try {
    await payload.sendEmail({
      to: email,
      ...buildConfirmEmail(SITE_URL, token),
    })
  } catch {
    // Письмо не ушло — свежесозданную строку откатываем, чтобы не копить
    // неподтверждаемые заявки; прежнюю pending-строку оставляем (повтор
    // заявки повернёт токен заново).
    if (createdId !== null) {
      await payload.delete({ collection: 'subscribers', id: createdId, overrideAccess: true })
    }
    return NextResponse.json({ error: 'mail-failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
