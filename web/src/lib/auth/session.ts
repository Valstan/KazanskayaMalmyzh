import type { EsaClaims } from './oidc'
import { open, seal } from './oidc'

// ── Сессия жителя ─────────────────────────────────────────────────────────────
//
// Что получает вошедший житель — открытый продуктовый вопрос владельца
// (письмо brain 26.07). До решения сессия — «вход и узнавание»: подписанная
// httpOnly-cookie без записи в БД (нет коллекции — нет миграции, нет мины с
// падением ЕСА: cookie живёт своим сроком, ЕСА нужна только на входе).
// Persist-слой (коллекция фактов) появился вместе с первой фичей за входом.
//
// ⚠️ ПОЧЕМУ НЕ «ТОКЕН ЕСА В COOKIE» (а было именно так в старой `lib/esa.ts`):
// токен ЕСА живёт минуты, и его пришлось бы проверять на КАЖДОМ запросе —
// значит, либо сеть в критическом пути каждой страницы, либо кэш JWKS в
// процессе, который при холодном старте роняет сайт на паузе. Сессия здесь
// длиннее токена и проверяется локально (HMAC), а токен проверяется РОВНО
// ОДИН раз — на входе.
//
// Имя с префиксом `__Host-` (#285, письмо brain 05.09): любой сосед под
// вмалмыже.рф может выставить cookie с `Domain=.вмалмыже.рф`, и при двух cookie
// с одним именем побеждает подброшенная. Браузер принимает `__Host-` только с
// `Secure`, `Path=/` и без `Domain` — подбросить её с поддомена нельзя.
export const SESSION_COOKIE = '__Host-kazanskaya_session'
export const SESSION_MAX_AGE_S = 30 * 24 * 3600

// Транзакционная cookie (state/nonce/verifier) живёт между /login и /callback.
// Короткая: десять минут — вход человека занимает секунды, а висящая транзакция
// это ровно то, чем пользуется подделка ответа.
export const TX_COOKIE = '__Host-kazanskaya_esa_tx'
export const TX_MAX_AGE_S = 10 * 60

// Атрибуты cookie — единым набором: ставим и гасим одними и теми же.
// `secure` всегда, не «в проде»: без него префикс браузер отвергнет молча,
// а localhost современные браузеры считают secure-контекстом и по http.
export const SESSION_COOKIE_ATTRS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
  path: '/',
} as const

/**
 * Значение cookie — в Next 15+ это ОБЪЕКТ `{ name, value }`, а не строка.
 *
 * Раньше `cookies().get()` отдавал строку, и код (и его тесты) ждали именно
 * строку. На проде это стоило 500 при сохранении факта: `TypeError: e.lastIndexOf
 * is not a function` (замерено 06.11) — значение уходило в `open()` объектом.
 * Тесты проходили, потому что заглушка `jar.get()` возвращала строку, то есть
 * проверяли не то, что отдаёт настоящий Next.
 */
const cookieValue = (raw: unknown): string | undefined => {
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object') {
    const value = (raw as { value?: unknown }).value
    if (typeof value === 'string') return value
  }
  return undefined
}

export const readSessionCookie = (get: (name: string) => unknown): string | undefined =>
  cookieValue(get(SESSION_COOKIE))

/**
 * Сессия из запроса. Формы cookie-объекта разные: Next отдаёт `cookies.get`,
 * Payload кладёт plain-объект, а в тестах и в raw-запросах остаётся заголовок.
 * Разбираем все три: иначе «вошёл» и «не вошёл» зависят от того, кто задал
 * запрос, — а это ровно тот класс, где access-правило молча открывает или
 * молча закрывает чужие записи.
 */
export const readSessionFromRequest = (req: {
  headers: { get?: (name: string) => string | null }
  cookies?: unknown
}): ResidentSession | null => {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return null

  const jar = req.cookies as
    | { get?: (name: string) => unknown; [key: string]: unknown }
    | undefined
  let raw: string | undefined
  if (jar) {
    if (typeof jar.get === 'function') raw = cookieValue(jar.get(SESSION_COOKIE))
    else raw = cookieValue(jar[SESSION_COOKIE])
  }
  if (!raw) {
    const header = req.headers.get?.('cookie') ?? ''
    raw = header
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1)
  }
  if (!raw) return null
  return openSession(raw, secret, Math.floor(Date.now() / 1000))
}

export type ResidentSession = {
  sub: string
  email: string | null
  name: string | null
  // unix seconds — истечение сверяем сами: у cookie срок не подписан.
  exp: number
}

export const sessionFromClaims = (claims: EsaClaims, nowS: number): ResidentSession => ({
  sub: claims.sub,
  // Неподтверждённый email не показываем и не храним: узнавание по нему
  // запрещено (анти-захват) — а раз не используем, то и не тянем.
  email: claims.emailVerified ? claims.email : null,
  name: claims.name,
  exp: nowS + SESSION_MAX_AGE_S,
})

export const sealSession = (session: ResidentSession, secret: string): string =>
  seal(session, secret)

export const openSession = (
  sealed: string | undefined | null,
  secret: string,
  nowS: number,
): ResidentSession | null => {
  if (!sealed || typeof sealed !== 'string') return null
  const p = open(sealed, secret) as Partial<ResidentSession> | null
  if (!p || typeof p.sub !== 'string' || !p.sub || typeof p.exp !== 'number') return null
  if (p.exp <= nowS) return null
  return {
    sub: p.sub,
    email: typeof p.email === 'string' ? p.email : null,
    name: typeof p.name === 'string' ? p.name : null,
    exp: p.exp,
  }
}

// Что уходит в браузер: без sub (внутренний идентификатор ЕСА наружу не нужен)
// и без exp.
export const publicProfile = (s: ResidentSession): { name: string; email: string | null } => ({
  name: s.name || (s.email ? s.email.split('@')[0] : 'Житель'),
  email: s.email,
})
