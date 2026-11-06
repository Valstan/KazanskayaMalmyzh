import { NextRequest, NextResponse } from 'next/server'

import { esaEnv } from '../../../../../lib/auth/env'
import { buildEndSessionUrl, getDiscovery } from '../../../../../lib/auth/oidc'
import { SESSION_COOKIE, SESSION_COOKIE_ATTRS } from '../../../../../lib/auth/session'
import { SITE_URL } from '../../../../../lib/site'

// GET /api/auth/esa/logout — выход.
//
// Локальный выход гасит нашу сессию. Сессия ЕСА живёт кукой домена
// .вмалмыже.рф, поэтому после локального выхода ЕСА авторизует снова молча —
// и человек «выходит», а через минуту снова внутри. Поэтому после гашения
// куки уводим на end_session: тогда гаснут все сервисы разом.
//
// ⚠️ end_session берётся из discovery, и его origin обязан совпасть с origin
// issuer'а (см. `buildEndSessionUrl`): это единственный редирект в потоке,
// после которого мы уже ничего не проверяем криптографически.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<Response> {
  const home = new URL('/', SITE_URL)
  const cfg = await esaEnv()
  let out: string | null = null
  if (cfg) {
    try {
      const discovery = await getDiscovery(cfg)
      out = buildEndSessionUrl(cfg, discovery)
    } catch (err) {
      console.error(
        `[auth/logout] end_session недоступен: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  const res = NextResponse.redirect(out ?? home.toString(), 302)
  res.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_ATTRS, maxAge: 0 })
  return res
}
