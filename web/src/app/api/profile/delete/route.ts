import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

import { SESSION_COOKIE, SESSION_COOKIE_ATTRS, readSessionFromRequest } from '../../../../lib/auth/session'
import { deleteProfile } from '../../../../lib/profile'

// POST /api/profile/delete — удалить профиль.
//
// Удаляются ВСЕ факты и запись посетителя. Частичного удаления нет: «удалите
// факты, но оставьте факт существования посетителя» — это не удаление, а
// утечка: по записи посетителя можно понять, что человек тут был.
//
// Сессия гасится тем же набором атрибутов, что и ставилась (иначе браузер
// оставит cookie с прежними атрибутами — префикс `__Host-` требует ровно
// Secure/Path=/, без Domain).
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<Response> {
  const session = readSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'нужен вход' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  await deleteProfile(payload, session.sub)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_ATTRS, maxAge: 0 })
  return res
}
