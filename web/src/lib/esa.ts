// Единая точка правды про вход через ЕСА (D-072, D-095).
//
// Чего этот модуль НЕ делает и почему:
//   • **не хранит client_secret** — он приходит grant'ом в комнату КАРМАНА и живёт
//     только в env-файле юнита (#008). В репозитории его нет и не будет;
//   • **не хранит токены посетителей** — подписанный JWT лежит в httpOnly-cookie,
//     недоступной из JS. На диске у нас только `esaSub`, чтобы админка видела список;
//   • **не проверяет пароли** — паролей у сайта нет вообще, ни своих, ни чужих.
//     Если где-то появится ветка «а если пароль…» — это уже другой продукт и другое
//     решение владельца.
//
// Проверка токена — по подписи и сроку, локально, без обращения к ЕСА на каждый
// запрос: держать третью сторону в критическом пути каждой страницы нельзя, а
// секрет тогда лежит в памяти процесса постоянно. Отзыв токена раньше срока — не
// поддерживается осознанно; срок короткий, а потеря доступа для посетителя
// безобидна. Если понадобится мгновенный отзыв — это отдельное решение с
// blacklist'ом и его ценой, не молчаливая подмена проверки.

const ESA_ORIGIN = 'https://xn--b1ae3a1a.xn--80adkdyec4j.xn--p1ai'

/** Куда ЕСА возвращает посетителя после входа. Байт в байт, как зарегистрировано. */
export const ESA_REDIRECT_URI = 'https://xn--80aaa0andu6a3j.xn--80adkdyec4j.xn--p1ai/api/auth/esa/callback'

export const ESA_ORIGIN_PUNYCODE = ESA_ORIGIN

export type EsaConfig = {
  issuer: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

export const esaConfigured = (): boolean =>
  Boolean(process.env.ESA_CLIENT_ID && process.env.ESA_CLIENT_SECRET)

export const esaConfig = (): EsaConfig | null => {
  const clientId = process.env.ESA_CLIENT_ID
  const clientSecret = process.env.ESA_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return {
    // Без явного issuer ЕСА не выдаёт: адрес берём из окружения, а не угадываем.
    issuer: process.env.ESA_ISSUER || ESA_ORIGIN,
    clientId,
    clientSecret,
    redirectUri: ESA_REDIRECT_URI,
  }
}

/** Часть токена до первой точки — base64url, и в браузере, и в Node. */
const decodeSegment = (segment: string): Record<string, unknown> | null => {
  try {
    const json = Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const parsed: unknown = JSON.parse(json)
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export type EsaClaims = {
  sub: string
  iss: string
  exp: number
  aud: string | string[] | undefined
}

/**
 * Разбирает и проверяет подпись JWT. Возвращает `null` при любой негодности —
 * вызывающий обязан трактовать это как «не вошёл», а не как «возможно, вошёл».
 */
export const verifyEsaToken = (token: string | undefined | null, config: EsaConfig): EsaClaims | null => {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [rawHeader, rawPayload, signature] = parts
  const header = decodeSegment(rawHeader)
  const payload = decodeSegment(rawPayload)
  if (!header || !payload) return null
  if (header.alg !== 'HS256') return null

  const sub = typeof payload.sub === 'string' ? payload.sub : ''
  const iss = typeof payload.iss === 'string' ? payload.iss : ''
  const exp = typeof payload.exp === 'number' ? payload.exp : 0
  if (!sub || !iss || !exp) return null

  // Время жизни и издатель проверяем ДО подписи: подпись защищает целостность,
  // а «кто выдал и когда» — это смысл токена, и подпись его не заменяет.
  if (iss !== config.issuer) return null
  if (Date.now() / 1000 >= exp) return null

  const audience = payload.aud
  const audMatches =
    audience === config.clientId ||
    (Array.isArray(audience) && audience.includes(config.clientId))
  if (!audMatches) return null

  const expected = sign(`${rawHeader}.${rawPayload}`, config.clientSecret)
  // Сравнение постоянного времени: сравнение строк на `===` останавливается на
  // первом различии и сама по себе leaks длину общего префикса подписи.
  if (!timingSafeEqual(expected, signature)) return null

  return { sub, iss, exp, aud: audience }
}

const sign = (data: string, secret: string): string => {
  // Секрет из окружения, путь к нему в репозитории не пишем (D-038).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('node:crypto') as typeof import('node:crypto')
  return crypto.createHmac('sha256', secret).update(data).digest('base64url')
}

const timingSafeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('node:crypto') as typeof import('node:crypto')
  if (bufA.length !== bufB.length) {
    // Длины разной разные — сравниваем с заполнителем той же длины, чтобы
    // функция не текла и сам факт расхождения длин.
    crypto.timingSafeEqual(bufA, bufA)
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

export const esaCookieName = 'esa_session'

/** Достаёт `sub` из токена в запросе, не проверяя подпись — только для логов и отладки. */
export const visitorSubFromRequest = (req: {
  headers: { get?: (name: string) => string | null }
  cookies?: Record<string, string | undefined>
}): string | null => {
  const raw =
    req.cookies?.[esaCookieName] ??
    (req.headers.get?.('cookie') ?? '')
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${esaCookieName}=`))
      ?.slice(esaCookieName.length + 1) ??
    null
  if (!raw) return null
  const decoded = decodeSegment(raw.split('.')[1] ?? '')
  const sub = decoded?.sub
  return typeof sub === 'string' && sub.length > 0 ? sub : null
}
