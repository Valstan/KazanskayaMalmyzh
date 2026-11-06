import { NextRequest, NextResponse } from 'next/server'

import { esaEnv } from '../../../../../lib/auth/env'
import {
  buildAuthorizeUrl,
  getDiscovery,
  randomToken,
  sanitizeNextPath,
  seal,
} from '../../../../../lib/auth/oidc'
import { SESSION_COOKIE_ATTRS, TX_COOKIE, TX_MAX_AGE_S } from '../../../../../lib/auth/session'
import { SITE_URL } from '../../../../../lib/site'

// GET /api/auth/esa/login — начало входа через ЕСА.
//
// Транзакция (state/nonce/verifier) едет в подписанной httpOnly-cookie: она
// переживает «ушёл на ЕСА → вернулся», а подпись HMAC'ом делает подброшенную
// cookie бесполезной — state проверяется на callback'е, а не на доверии.
export const dynamic = 'force-dynamic'

export const GET = async (req: NextRequest): Promise<Response> => {
  const cfg = await esaEnv()
  const secret = process.env.PAYLOAD_SECRET
  if (!cfg || !secret) {
    // Входа нет (нет client_secret) — это не «ошибка входа», это отсутствие
    // входа. Человека отправляем на страницу профиля с честным объяснением,
    // а не в 404: ссылка «Войти» на живой странице должна вести куда-то
    // осмысленное.
    console.error('[auth/login] ЕСА не настроен: нет client_secret или PAYLOAD_SECRET')
    return NextResponse.redirect(new URL('/profile?auth=unavailable', SITE_URL), 302)
  }

  const next = sanitizeNextPath(req.nextUrl.searchParams.get('next'))
  const tx = {
    state: randomToken(),
    nonce: randomToken(),
    verifier: randomToken(),
    ...(next ? { next } : {}),
  }

  let discovery
  try {
    discovery = await getDiscovery(cfg)
  } catch (err) {
    console.error(
      `[auth/login] discovery не прочитан: ${err instanceof Error ? err.message : String(err)}`,
    )
    return new Response('Service Unavailable', { status: 503 })
  }

  const res = NextResponse.redirect(buildAuthorizeUrl(cfg, discovery, tx), 302)
  res.cookies.set(TX_COOKIE, seal(tx, secret), {
    ...SESSION_COOKIE_ATTRS,
    maxAge: TX_MAX_AGE_S,
  })
  return res
}
