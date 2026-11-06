import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

import { esaEnv } from '../../../../../lib/auth/env'
import {
  exchangeCode,
  getDiscovery,
  openTransaction,
  verifyIdToken,
} from '../../../../../lib/auth/oidc'
import {
  SESSION_COOKIE,
  SESSION_COOKIE_ATTRS,
  SESSION_MAX_AGE_S,
  TX_COOKIE,
  sealSession,
  sessionFromClaims,
} from '../../../../../lib/auth/session'
import { SITE_URL } from '../../../../../lib/site'

// GET /api/auth/esa/callback — возврат из ЕСА.
//
// state против подписанной cookie (CSRF) → code → токены (PKCE-verifier +
// client_secret) → проверка id_token (подпись JWKS/RS256, iss, aud, exp,
// nonce) → запись посетителя → сессия жителя → назад на сайт.
//
// Любой отказ — мягкий редирект на /profile?auth=failed: сайт цел, деталей
// отказа наружу не раскрываем (в лог — да). Отказ здесь безопаснее, чем
// «попробуем ещё раз»: половина причин отказа — подделанный state или
// истёкшая транзакция, и второй круг их не исправит.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<Response> {
  const cfg = await esaEnv()
  const secret = process.env.PAYLOAD_SECRET
  if (!cfg || !secret) return new Response('Not Found', { status: 404 })

  const fail = (reason: string): Response => {
    console.error(`[auth/callback] отказ: ${reason}`)
    const res = NextResponse.redirect(new URL('/profile?auth=failed', SITE_URL), 302)
    res.cookies.delete(TX_COOKIE)
    return res
  }

  const params = req.nextUrl.searchParams
  if (params.get('error')) return fail(`ЕСА вернула error=${params.get('error')}`)

  const code = params.get('code')
  const state = params.get('state')
  if (!code || !state) return fail('нет code/state в callback')

  const tx = openTransaction(req.cookies.get(TX_COOKIE)?.value ?? '', secret)
  if (!tx) return fail('транзакционная cookie отсутствует или не прошла подпись')
  if (tx.state !== state) return fail('state не совпал (CSRF?)')

  try {
    const discovery = await getDiscovery(cfg)
    const { idToken } = await exchangeCode(cfg, discovery, code, tx.verifier)
    const claims = await verifyIdToken(cfg, discovery, idToken, tx.nonce)

    // Ни адреса, ни имени в журнал не пишем: только факт наличия. Иначе журнал
    // становится второй копией ПДн, а он публичен.
    console.log(
      `[auth/callback] claims: email=${claims.email ? 'есть' : 'нет'}` +
        ` email_verified=${claims.emailVerified} name=${claims.name ? 'есть' : 'нет'}`,
    )

    const payload = await getPayload({ config })

    // Запись посетителя: создаём при первом входе, дальше только «последний
    // вход». Имя из ЕСА НЕ переносим — «как вас показывать» посетитель
    // пишет сам (см. `collections/Visitors.ts`), это разные вещи.
    const found = await payload.find({
      collection: 'visitors',
      where: { esaSub: { equals: claims.sub } },
      limit: 1,
      overrideAccess: true,
    })
    const visitor = found.docs[0] as { id: string | number } | undefined
    const now = new Date().toISOString()
    if (visitor) {
      await payload.update({
        collection: 'visitors',
        id: visitor.id,
        data: { lastSeenAt: now },
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'visitors',
        data: { esaSub: claims.sub, lastSeenAt: now },
        overrideAccess: true,
      })
    }

    const session = sessionFromClaims(claims, Math.floor(Date.now() / 1000))
    const res = NextResponse.redirect(new URL(tx.next ?? '/profile', SITE_URL), 302)
    res.cookies.delete(TX_COOKIE)
    res.cookies.set(SESSION_COOKIE, sealSession(session, secret), {
      ...SESSION_COOKIE_ATTRS,
      maxAge: SESSION_MAX_AGE_S,
    })
    return res
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err))
  }
}
