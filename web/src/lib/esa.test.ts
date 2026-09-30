import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  ESA_ORIGIN_PUNYCODE,
  ESA_REDIRECT_URI,
  esaConfig,
  verifyEsaToken,
  visitorSubFromRequest,
} from './esa'

// Проверка входа через ЕСА (D-072, D-095) — до того, как клиент выдан.
// Токены подписываем здесь же тем же HS256, что ждём от ЕСА: тест на подделке
// чужой подписью ничего не проверял бы.
//
// Все кейсы написаны по следам способа всё испортить, а не по пересказу
// спецификации: подпись, срок, издатель, аудитория, длина подписи, алгоритм.

const SECRET = 'client-secret-value-for-tests'
const ISSUER = 'https://xn--b1ae3a1a.xn--80adkdyec4j.xn--p1ai'
const CLIENT_ID = 'kazanskaya'

const config = {
  issuer: ISSUER,
  clientId: CLIENT_ID,
  clientSecret: SECRET,
  redirectUri: ESA_REDIRECT_URI,
}

const sign = (header: object, payload: object, secret = SECRET): string => {
  const enc = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const data = `${enc(header)}.${enc(payload)}`
  return `${data}.${createHmac('sha256', secret).update(data).digest('base64url')}`
}

const future = () => Math.floor(Date.now() / 1000) + 3600

const goodClaims = () => ({ sub: 'esa-user-123', iss: ISSUER, aud: CLIENT_ID, exp: future() })

describe('redirect_uri зарегистрирован байт в байт', () => {
  it('https, punycode, без завершающего слэша, на наш домен', () => {
    expect(ESA_REDIRECT_URI).toBe(
      'https://xn--80aaa0andu6a3j.xn--80adkdyec4j.xn--p1ai/api/auth/esa/callback',
    )
    expect(ESA_REDIRECT_URI.startsWith('https://')).toBe(true)
    expect(ESA_REDIRECT_URI.endsWith('/')).toBe(false)
  })

  it('callback живёт на нашем домене, а вход в ЕСА — на origin ЕСА, и CSP знает оба', async () => {
    // Два разных адреса, и их легко перепутать: `redirect_uri` — это адрес НАШЕГО
    // сайта, куда ЕСА возвращает посетителя; origin ЕСА — это адрес, КУДА форма
    // входа постит. Проверка, которая бы сравнила их между собой, искала бы ошибку
    // там, где её нет (так и вышло, пока писался этот тест).
    //
    // Что действительно должно быть верно: callback на punycode нашего домена, и
    // origin ЕСА разрешён в `form-action`. Если эти две строки разойдутся, вход
    // сломается молча — ЕСА отдаст токен туда, куда браузер не пустит.
    const SITE_ORIGIN = 'https://xn--80aaa0andu6a3j.xn--80adkdyec4j.xn--p1ai'
    expect(ESA_REDIRECT_URI.startsWith(`${SITE_ORIGIN}/`)).toBe(true)
    expect(ESA_REDIRECT_URI).not.toContain(ESA_ORIGIN_PUNYCODE)
    expect(await cspFormActionSources()).toContain(ESA_ORIGIN_PUNYCODE)
  })
})

type HeaderRule = { source: string; headers: Array<{ key: string; value: string }> }

/**
 * Источники `form-action` из собранной конфигурации Next — как их увидит браузер.
 *
 * Две неочевидности, обе пойманы на живом прогоне, а не выдуманы:
 *   • путь от `src/lib/` до корня `web/` — **три** уровня вверх; на двух уровнях
 *     модуль просто не находится и тест падает «Cannot find module»;
 *   • `headers()` у нас **асинхронная** (её оборачивает `withPayload`), поэтому
 *     возвращает промис. Синхронный разбор дал бы пустой объект и «успешный»
 *     тест, который ничего не проверяет, — самый дорогой вид слепого контроля.
 */
async function cspFormActionSources(): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cfg = require('../../next.config.js') as {
    default?: { headers?: () => Promise<HeaderRule[]> | HeaderRule[] }
  }
  const maybe = cfg.default?.headers?.()
  const rules: HeaderRule[] = Array.isArray(maybe) ? maybe : ((await maybe) ?? [])
  for (const rule of rules) {
    if (rule.source !== '/:path*') continue
    const csp = rule.headers.find((h) => h.key === 'Content-Security-Policy')
    if (!csp) continue
    const parts: string[] = csp.value.split(';').map((part: string) => part.trim())
    const directive = parts.find((part: string) => part.startsWith('form-action'))
    if (!directive) return []
    return directive.replace(/^form-action\s*/, '').split(/\s+/)
  }
  return []
}

describe('проверка токена ЕСА', () => {
  it('принимает корректный токен и отдаёт sub', () => {
    const claims = verifyEsaToken(sign({ alg: 'HS256', typ: 'JWT' }, goodClaims()), config)
    expect(claims?.sub).toBe('esa-user-123')
  })

  it('отвергает токен, подписанный чужим секретом', () => {
    const forged = sign({ alg: 'HS256', typ: 'JWT' }, goodClaims(), 'wrong-secret')
    expect(verifyEsaToken(forged, config)).toBeNull()
  })

  it('отвергает просроченный', () => {
    const claims = { ...goodClaims(), exp: Math.floor(Date.now() / 1000) - 1 }
    expect(verifyEsaToken(sign({ alg: 'HS256', typ: 'JWT' }, claims), config)).toBeNull()
  })

  it('отвергает истёкший ровно сейчас, а не «почти»', () => {
    const claims = { ...goodClaims(), exp: Math.floor(Date.now() / 1000) }
    expect(verifyEsaToken(sign({ alg: 'HS256', typ: 'JWT' }, claims), config)).toBeNull()
  })

  it('отвергает чужого издателя', () => {
    const claims = { ...goodClaims(), iss: 'https://example.invalid' }
    expect(verifyEsaToken(sign({ alg: 'HS256', typ: 'JWT' }, claims), config)).toBeNull()
  })

  it('отвергает аудиторию, в которую токен выдан не нам', () => {
    const claims = { ...goodClaims(), aud: 'somebody-else' }
    expect(verifyEsaToken(sign({ alg: 'HS256', typ: 'JWT' }, claims), config)).toBeNull()
  })

  it('принимает aud массивом, где наш client_id есть', () => {
    const claims = { ...goodClaims(), aud: ['other', CLIENT_ID] }
    expect(verifyEsaToken(sign({ alg: 'HS256', typ: 'JWT' }, claims), config)?.sub).toBe(
      'esa-user-123',
    )
  })

  it('отвергает alg=none — подпись не нужна, а полезная нагрузка под нами', () => {
    const data = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(goodClaims())).toString('base64url')}.`
    expect(verifyEsaToken(data, config)).toBeNull()
  })

  it('отвергает подменённую полезную нагрузку при живой подписи', () => {
    const good = sign({ alg: 'HS256', typ: 'JWT' }, goodClaims())
    const [, , sig] = good.split('.')
    const evil = Buffer.from(JSON.stringify({ ...goodClaims(), sub: 'someone-else' })).toString(
      'base64url',
    )
    const forged = `${good.split('.')[0]}.${evil}.${sig}`
    expect(verifyEsaToken(forged, config)).toBeNull()
  })

  it('отвергает обрезанную подпись другой длины без исключения', () => {
    const token = sign({ alg: 'HS256', typ: 'JWT' }, goodClaims())
    const [h, p, s] = token.split('.')
    expect(verifyEsaToken(`${h}.${p}.${s!.slice(0, 10)}`, config)).toBeNull()
  })

  it('отвергает мусор вместо токена', () => {
    for (const junk of ['', 'abc', 'a.b', 'a.b.c.d', 'не-base64.не-json.не-подпись']) {
      expect(verifyEsaToken(junk, config)).toBeNull()
    }
    expect(verifyEsaToken(undefined, config)).toBeNull()
    expect(verifyEsaToken(null, config)).toBeNull()
  })

  it('отвергает токен без sub — нечего предъявлять', () => {
    const claims: Record<string, unknown> = { ...goodClaims() }
    delete claims.sub
    expect(verifyEsaToken(sign({ alg: 'HS256', typ: 'JWT' }, claims), config)).toBeNull()
  })
})

describe('конфиг ЕСА', () => {
  it('не собирается без секрета — фича выключена, а не сломана', () => {
    const savedId = process.env.ESA_CLIENT_ID
    const savedSecret = process.env.ESA_CLIENT_SECRET
    delete process.env.ESA_CLIENT_ID
    delete process.env.ESA_CLIENT_SECRET
    expect(esaConfig()).toBeNull()
    if (savedId !== undefined) process.env.ESA_CLIENT_ID = savedId
    if (savedSecret !== undefined) process.env.ESA_CLIENT_SECRET = savedSecret
  })

  it('берёт redirect_uri из константы, а не из окружения', () => {
    const savedId = process.env.ESA_CLIENT_ID
    const savedSecret = process.env.ESA_CLIENT_SECRET
    process.env.ESA_CLIENT_ID = CLIENT_ID
    process.env.ESA_CLIENT_SECRET = SECRET
    expect(esaConfig()?.redirectUri).toBe(ESA_REDIRECT_URI)
    if (savedId !== undefined) process.env.ESA_CLIENT_ID = savedId
    else delete process.env.ESA_CLIENT_ID
    if (savedSecret !== undefined) process.env.ESA_CLIENT_SECRET = savedSecret
    else delete process.env.ESA_CLIENT_SECRET
  })
})

describe('чтение cookie входа', () => {
  const req = (cookie?: string) => ({
    headers: { get: (name: string) => (name === 'cookie' ? (cookie ?? null) : null) },
  })

  it('находит sub в разобранных cookies', () => {
    const token = sign({ alg: 'HS256', typ: 'JWT' }, goodClaims())
    expect(visitorSubFromRequest(req(`other=1; esa_session=${token}; x=2`))).toBe('esa-user-123')
  })

  it('находит sub, когда Next уже разобрал cookie', () => {
    const token = sign({ alg: 'HS256', typ: 'JWT' }, goodClaims())
    expect(visitorSubFromRequest({ headers: {}, cookies: { esa_session: token } })).toBe(
      'esa-user-123',
    )
  })

  it('пусто без cookie — это «не вошёл», а не ошибка', () => {
    expect(visitorSubFromRequest(req())).toBeNull()
    expect(visitorSubFromRequest(req('other=1'))).toBeNull()
    expect(visitorSubFromRequest(req('esa_session='))).toBeNull()
  })
})