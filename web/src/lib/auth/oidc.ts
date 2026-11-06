import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'

import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { JWTPayload } from 'jose'

// ── OIDC-клиент ЕСА (Authorization Code + PKCE) ───────────────────────────────
//
// Рецепт — клиент портала вМалмыже.рф (web/src/lib/auth/oidc.ts, read-only,
// ADR-0007); контракт — unified-auth-concept.md §4 и ответ Сарафана 11.10
// («RS256, ключ по kid из JWKS, issuer сверяем punycode-строкой»).
//
// ⚠️ ЧТО ЗДЕСЬ НЕ ДОЛЖНО ПОЯВИТЬСЯ (письмо brain 13.10, §3):
//   • проверки подписи HMAC'ом по `client_secret`. Секрет клиента — это
//     АУТЕНТИФИКАЦИЯ клиента на token_endpoint, а не алгоритм подписи токена.
//     Настоящий токен ЕСА подписан **только RS256**; `alg: none` и `HS256`
//     отвергаются как невалидные, без попытки «подобрать ключ»;
//   • `alg`, отличный от RS256, в списке допустимых: jose проверяет его по
//     списку `algorithms` и отвергает всё прочее;
//   • ключа, зашитого в код или конфиг: ротация ключа ЕСА меняет `kid`, и
//     зашитый ключ ломается МОЛЧА — начнёт отвергать валидные токены. Ключ
//     берётся из JWKS по `kid` (jose дотягивает JWKS при незнакомом `kid`).
//
// Протокольное — стандартными средствами (jose): самодельной крипты здесь нет.

export const ESA_ISSUER = 'https://xn--b1ae3a1a.xn--80adkdyec4j.xn--p1ai'

/** Куда ЕСА возвращает посетителя после входа. Байт в байт, как зарегистрировано. */
export const ESA_REDIRECT_URI = 'https://xn--80aaa0andu6a3j.xn--80adkdyec4j.xn--p1ai/api/auth/esa/callback'

export const ESA_CLIENT_ID = 'kazanskaya'

export type EsaConfig = {
  issuer: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

/**
 * Конфиг клиента. `client_secret` — единственный секрет в контуре входа; он
 * приезжает либо из окружения, либо до-тягом из комнаты КАРМАНа (см.
 * `lib/auth/vault.ts`). Если его нет — входа нет, и это честно: fail-closed.
 *
 * ⚠️ ИМЯ ПЕРЕМЕННОЙ — РОВНО ТО, ПОД КОТОРЫМ КОМНАТА ОТДАЁТ ЗНАЧЕНИЕ:
 * `ensureSecret('ESA_CLIENT_SECRET_KAZANSKAYA')` кладёт значение в
 * `process.env.ESA_CLIENT_SECRET_KAZANSKAYA` — под тем же именем, под которым
 * ключ лежит в комнате (свойство 6 спеки: имя ключа переносится как есть).
 * Прежнее чтение `process.env.ESA_CLIENT_SECRET` — это переменная, которую
 * никто никогда не заполняет: до-тяг наполняет `..._KAZANSKAYA`, и значение
 * терялось по дороге, а вход отвечал «auth=unavailable» (замерено 06.11).
 * Старое имя оставлено как запасной путь для оператора, который задал секрет
 * руками. ⚠️ И это НЕ меняет проверку подписи: `client_secret` — аутентификация
 * клиента на token_endpoint, а id_token проверяется только по JWKS/RS256
 * (`verifyIdToken` ниже). Наличие секрета в окружении подпись не трогает.
 */
export const esaConfig = (): EsaConfig | null => {
  const clientId = process.env.ESA_CLIENT_ID || ESA_CLIENT_ID
  const clientSecret =
    process.env.ESA_CLIENT_SECRET_KAZANSKAYA || process.env.ESA_CLIENT_SECRET
  if (!clientSecret) return null
  return {
    // Без явного issuer ЕСА не выдаёт: адрес берём из окружения, а не угадываем.
    // Хвостовой слэш режем — конфиг ЕСА тоже режет, и сравнение должно быть
    // посимвольным (G108: кириллический вид для сравнения `iss` не годится).
    issuer: (process.env.ESA_ISSUER || ESA_ISSUER).replace(/\/$/, ''),
    clientId,
    clientSecret,
    redirectUri: ESA_REDIRECT_URI,
  }
}

// ── Discovery (/.well-known/openid-configuration) ────────────────────────────

export type DiscoveryDoc = {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
  // RP-initiated logout появился у ЕСА 04.09.2026 — поле необязательное: старый
  // документ (или кэш до передеплоя) не должен ломать выход, он деградирует
  // до локального.
  end_session_endpoint?: string
}

// Кэш discovery на процесс: документ меняется только при передеплое ЕСА.
const DISCOVERY_TTL_MS = 60 * 60_000
let discoveryCache: { issuer: string; doc: DiscoveryDoc; fetchedAt: number } | null = null

/**
 * Issuer сравнивается ПОСИМВОЛЬНО (письмо brain 13.10, §3.3): в discovery и в
 * конфиге клиента должна стоять одна и та же punycode-строка. Нормализация
 * «хвостовой слэш» здесь единственная — подмена схемы или хоста молча
 * превратила бы проверку в «почти равно».
 */
const sameIssuer = (a: string, b: string): boolean => a.replace(/\/$/, '') === b.replace(/\/$/, '')

export const getDiscovery = async (cfg: EsaConfig): Promise<DiscoveryDoc> => {
  const now = Date.now()
  if (
    discoveryCache &&
    discoveryCache.issuer === cfg.issuer &&
    now - discoveryCache.fetchedAt < DISCOVERY_TTL_MS
  ) {
    return discoveryCache.doc
  }

  const res = await fetch(`${cfg.issuer}/.well-known/openid-configuration`, {
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`ESA discovery failed: HTTP ${res.status}`)
  const doc = (await res.json()) as Partial<DiscoveryDoc>

  if (
    typeof doc.issuer !== 'string' ||
    !sameIssuer(doc.issuer, cfg.issuer) ||
    !doc.authorization_endpoint ||
    !doc.token_endpoint ||
    !doc.jwks_uri
  ) {
    throw new Error('ESA discovery document is malformed or issuer mismatch')
  }

  const full = doc as DiscoveryDoc
  discoveryCache = { issuer: cfg.issuer, doc: full, fetchedAt: now }
  return full
}

// Один remote-JWKS на процесс: jose кэширует ключи и дотягивает при незнакомом
// kid — ротация ключа ЕСА подхватывается без рестарта. Недоступность JWKS
// роняет только вход, не сайт (деградация — MUST контракта).
let jwksCache: { uri: string; jwks: ReturnType<typeof createRemoteJWKSet> } | null = null

const jwksFor = (uri: string): ReturnType<typeof createRemoteJWKSet> => {
  if (!jwksCache || jwksCache.uri !== uri) {
    jwksCache = { uri, jwks: createRemoteJWKSet(new URL(uri)) }
  }
  return jwksCache.jwks
}

// ── PKCE + транзакционная cookie (state/nonce/verifier между start и callback) ─

export const randomToken = (): string => randomBytes(32).toString('base64url')

// S256: challenge = base64url(sha256(verifier)) — RFC 7636.
export const pkceChallenge = (verifier: string): string =>
  createHash('sha256').update(verifier).digest('base64url')

export type OidcTransaction = { state: string; nonce: string; verifier: string; next?: string }

// Гард open-redirect: только внутренний абсолютный путь ('/x…', не '//host',
// не 'https://…'), разумной длины. Всё прочее → null (вернём на профиль).
export const sanitizeNextPath = (raw: string | null | undefined): string | null => {
  if (typeof raw !== 'string') return null
  if (raw.length < 2 || raw.length > 512) return null
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null
  return raw
}

// Транзакция живёт в httpOnly-cookie между /login и /callback. Подписываем
// HMAC'ом (PAYLOAD_SECRET): подброшенная cookie не пройдёт state-проверку молча.
const hmac = (data: string, secret: string): string =>
  createHmac('sha256', secret).update(data).digest('base64url')

export const seal = (value: unknown, secret: string): string => {
  const data = Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${data}.${hmac(data, secret)}`
}

export const open = (sealed: string, secret: string): unknown | null => {
  const dot = sealed.lastIndexOf('.')
  if (dot <= 0) return null
  const data = sealed.slice(0, dot)
  const sig = Buffer.from(sealed.slice(dot + 1))
  const expected = Buffer.from(hmac(data, secret))
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString()) as unknown
  } catch {
    return null
  }
}

export const openTransaction = (sealed: string, secret: string): OidcTransaction | null => {
  const parsed = open(sealed, secret) as Partial<OidcTransaction> | null
  if (
    !parsed ||
    typeof parsed.state !== 'string' ||
    typeof parsed.nonce !== 'string' ||
    typeof parsed.verifier !== 'string' ||
    !parsed.state ||
    !parsed.nonce ||
    !parsed.verifier
  ) {
    return null
  }
  const next = sanitizeNextPath(parsed.next)
  return {
    state: parsed.state,
    nonce: parsed.nonce,
    verifier: parsed.verifier,
    ...(next ? { next } : {}),
  }
}

// ── Authorize URL / обмен кода / валидация id_token ──────────────────────────

export const buildAuthorizeUrl = (
  cfg: EsaConfig,
  discovery: DiscoveryDoc,
  tx: OidcTransaction,
): string => {
  const u = new URL(discovery.authorization_endpoint)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('client_id', cfg.clientId)
  u.searchParams.set('redirect_uri', cfg.redirectUri)
  // scope: name и email нужны, чтобы узнать жителя (не «общий профиль ЕСА» —
  // его нет и не будет: письмо Сарафана 04.09, п.4).
  u.searchParams.set('scope', 'openid profile email')
  u.searchParams.set('state', tx.state)
  u.searchParams.set('nonce', tx.nonce)
  u.searchParams.set('code_challenge', pkceChallenge(tx.verifier))
  u.searchParams.set('code_challenge_method', 'S256')
  return u.toString()
}

// ── RP-initiated logout (OIDC RP-Initiated Logout 1.0) ───────────────────────
//
// Сессия ЕСА живёт кукой домена .вмалмыже.рф: наш POST /logout гасит только
// сайт, и следующий authorize молча авторизует снова. После локального выхода
// уводим человека на end_session, тогда гаснут все сервисы разом.
//
// Адрес — из discovery, не литералом. Но документ приходит из сети, а этот
// редирект единственный в потоке, после которого мы уже ничего не проверяем
// криптографически: чужой end_session_endpoint превратил бы кнопку «Выйти» в
// открытый редиректор. Поэтому origin эндпойнта обязан совпасть с origin
// issuer'а.
export const buildEndSessionUrl = (cfg: EsaConfig, discovery: DiscoveryDoc): string | null => {
  if (!discovery.end_session_endpoint) return null
  try {
    const u = new URL(discovery.end_session_endpoint)
    if (u.origin !== new URL(discovery.issuer).origin) return null
    u.searchParams.set('client_id', cfg.clientId)
    u.searchParams.set('post_logout_redirect_uri', `${new URL(cfg.redirectUri).origin}/`)
    return u.toString()
  } catch {
    return null
  }
}

// code → токены. Аутентификация клиента — client_secret_post (без граблей
// url-кодирования basic-заголовка).
export const exchangeCode = async (
  cfg: EsaConfig,
  discovery: DiscoveryDoc,
  code: string,
  verifier: string,
): Promise<{ idToken: string }> => {
  const res = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: cfg.redirectUri,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`ESA token endpoint: HTTP ${res.status}`)
  const json = (await res.json()) as { id_token?: unknown }
  if (typeof json.id_token !== 'string' || !json.id_token) {
    throw new Error('ESA token response has no id_token')
  }
  return { idToken: json.id_token }
}

// Личность, которую удостоверила ЕСА. Минимизация claims: берём только то, что
// нужно для узнавания. email — только строка с '@' в нижнем регистре;
// emailVerified строго boolean true.
export type EsaClaims = {
  sub: string
  email: string | null
  emailVerified: boolean
  name: string | null
}

export const extractClaims = (payload: JWTPayload): EsaClaims => {
  const sub = typeof payload.sub === 'string' ? payload.sub.trim() : ''
  if (!sub) throw new Error('id_token has no sub')

  const emailRaw = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const email = emailRaw.includes('@') ? emailRaw : null
  const nameRaw = typeof payload.name === 'string' ? payload.name.trim() : ''

  return {
    sub,
    email,
    emailVerified: payload.email_verified === true,
    name: nameRaw || null,
  }
}

// Полная проверка id_token: подпись по JWKS ЕСА (RS256, ключ по `kid`) +
// iss + aud + exp (jose) + nonce (replay).
export const verifyIdToken = async (
  cfg: EsaConfig,
  discovery: DiscoveryDoc,
  idToken: string,
  nonce: string,
): Promise<EsaClaims> => {
  const { payload } = await jwtVerify(idToken, jwksFor(discovery.jwks_uri), {
    issuer: discovery.issuer,
    audience: cfg.clientId,
    algorithms: ['RS256'],
  })
  if (payload.nonce !== nonce) throw new Error('id_token nonce mismatch')
  return extractClaims(payload)
}
