import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

import { readSessionFromRequest } from '../../../../lib/auth/session'
import { upsertFact } from '../../../../lib/profile'

// POST /api/profile/facts — записать один факт о себе.
//
// Житель пишет сам, и только недостающее: то, что уже записано, повторно НЕ
// спрашивается (правило «спросить один раз», `lib/facts.ts`). Правка
// существующего факта — по кнопке самого жителя, а не по нашему хотению.
//
// Ответ: 200 с ключом и значением (то, что записали) либо 400 с причиной.
// 401 — «нет сессии»: без входа факты принимать некуда.
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<Response> {
  const session = readSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'нужен вход' }, { status: 401 })
  }

  let body: { key?: unknown; value?: unknown }
  try {
    body = (await req.json()) as { key?: unknown; value?: unknown }
  } catch {
    return NextResponse.json({ error: 'тело запроса не разобрано' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const result = await upsertFact(payload, session.sub, {
    key: typeof body.key === 'string' ? body.key : '',
    value: body.value,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json({ key: result.key, value: result.value })
}
