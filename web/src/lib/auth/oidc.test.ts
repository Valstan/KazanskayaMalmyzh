import { createServer, type Server } from 'node:http'

import { exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  ESA_ISSUER,
  ESA_REDIRECT_URI,
  buildAuthorizeUrl,
  exchangeCode,
  extractClaims,
  getDiscovery,
  open,
  openTransaction,
  pkceChallenge,
  randomToken,
  sanitizeNextPath,
  seal,
  verifyIdToken,
  type DiscoveryDoc,
  type EsaConfig,
} from './oidc'

// Проверка входа через ЕСА — RS256, JWKS по `kid`, PKCE (D-095 ч.2, ответ
// Сарафана 11.10 и письмо brain 13.10).
//
// Токены подписываем ЗДЕСЬ настоящей парой RSA и отдаём публичный ключ в
// JWKS: тест на подделке «на глаз» ничего не проверял бы — ровно так и вышло
// с прежней HS256-проверкой, которая проходила любой токен, подписанный тем
// же секретом, что и клиент.
//
// ⚠️ Тесты НЕ ходят в интернет: JWKS и discovery отдаёт локальный сервер.
// Единичный уход в сеть означал бы, что юнит-тест может зеленеть на чужом
// сервисе, а падать — когда ЕСА недоступна с машины сборки.

const ISSUER = 'https://xn--b1ae3a1a.xn--80adkdyec4j.xn--p1ai'
const CLIENT_ID = 'kazanskaya'
const SECRET = 'client-secret-value-for-tests'

let server: Server
let base = ''
let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey']
let publicJwk: JWK

beforeAll(async () => {
  const pair = await generateKeyPair('RS256')
  privateKey = pair.privateKey
  const jwk = await exportJWK(pair.publicKey)
  publicJwk = { ...jwk, kid: 'test-kid-1', alg: 'RS256', use: 'sig' }

  server = createServer((req, res) => {
    const path = req.url ?? ''
    if (path.endsWith('/.well-known/openid-configuration')) {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          issuer: base,
          authorization_endpoint: `${base}/authorize`,
          token_endpoint: `${base}/token`,
          jwks_uri: `${base}/jwks`,
        }),
      )
      return
    }
    if (path.endsWith('/jwks')) {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ keys: [publicJwk] }))
      return
    }
    res.writeHead(404)
    res.end()
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (typeof address === 'string' || address === null) throw new Error('сервер не поднялся')
  base = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

const config: EsaConfig = {
  issuer: ISSUER,
  clientId: CLIENT_ID,
  clientSecret: SECRET,
  redirectUri: ESA_REDIRECT_URI,
}

/** Discovery с локальным JWKS: подписи проверяем против своего ключа. */
const discoveryDoc = (): DiscoveryDoc => ({
  issuer: ISSUER,
  authorization_endpoint: `${base}/authorize`,
  token_endpoint: `${base}/token`,
  jwks_uri: `${base}/jwks`,
})

const signToken = async (
  claims: Record<string, unknown>,
  opts: { kid?: string; alg?: string; key?: typeof privateKey } = {},
): Promise<string> => {
  const builder = new SignJWT(claims)
    .setProtectedHeader({ alg: opts.alg ?? 'RS256', kid: opts.kid ?? 'test-kid-1' })
    .setIssuedAt()
  // Срок берём из полей claims, если он там есть: `.setExpirationTime('1h')`
  // перезаписывает exp ИНАЧЕ, и «просроченный» токен оказывается живым —
  // ровно тот класс, который тест обязан ловить.
  const exp = typeof claims.exp === 'number' ? claims.exp : Math.floor(Date.now() / 1000) + 3600
  return builder.setExpirationTime(exp).sign(opts.key ?? privateKey)
}

const goodClaims = (): Record<string, unknown> => ({
  sub: 'esa-user-123',
  iss: ISSUER,
  aud: CLIENT_ID,
  nonce: 'nonce-1',
})

describe('адрес ЕСА', () => {
  it('только punycode: кириллица в адресе — ловушка посимвольного сравнения (G108)', () => {
    expect(ESA_ISSUER).toBe('https://xn--b1ae3a1a.xn--80adkdyec4j.xn--p1ai')
    expect(/[Ѐ-ӿ]/.test(ESA_ISSUER)).toBe(false)
    expect(ESA_ISSUER).toBe(encodeURI(ESA_ISSUER))
  })
})

describe('redirect_uri и origin', () => {
  it('зарегистрирован байт в байт: https, punycode, без завершающего слэша', () => {
    expect(ESA_REDIRECT_URI).toBe(
      'https://xn--80aaa0andu6a3j.xn--80adkdyec4j.xn--p1ai/api/auth/esa/callback',
    )
    expect(ESA_REDIRECT_URI.startsWith('https://')).toBe(true)
    expect(ESA_REDIRECT_URI.endsWith('/')).toBe(false)
  })

  it('callback — на НАШЕМ домене, а не на origin ЕСА', () => {
    const SITE_ORIGIN = 'https://xn--80aaa0andu6a3j.xn--80adkdyec4j.xn--p1ai'
    expect(ESA_REDIRECT_URI.startsWith(`${SITE_ORIGIN}/`)).toBe(true)
    expect(ESA_REDIRECT_URI).not.toContain(ISSUER)
  })
})

describe('PKCE и транзакция', () => {
  it('challenge — это base64url(sha256(verifier)), а не сам verifier', () => {
    const verifier = randomToken()
    const challenge = pkceChallenge(verifier)
    expect(challenge).not.toBe(verifier)
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('одинаковый verifier даёт один challenge, разный — разный', () => {
    expect(pkceChallenge('abc')).toBe(pkceChallenge('abc'))
    expect(pkceChallenge('abc')).not.toBe(pkceChallenge('abd'))
  })

  it('authorize несёт code_challenge S256, state и nonce', () => {
    const tx = { state: 'st', nonce: 'no', verifier: 've' }
    const url = new URL(buildAuthorizeUrl(config, discoveryDoc(), tx))
    expect(url.searchParams.get('code_challenge')).toBe(pkceChallenge('ve'))
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('state')).toBe('st')
    expect(url.searchParams.get('nonce')).toBe('no')
    expect(url.searchParams.get('client_id')).toBe(CLIENT_ID)
    expect(url.searchParams.get('redirect_uri')).toBe(ESA_REDIRECT_URI)
  })

  it('подписанная транзакция открывается, подделанная — нет', () => {
    const tx = { state: 'st', nonce: 'no', verifier: 've' }
    const sealed = seal(tx, SECRET)
    expect(openTransaction(sealed, SECRET)?.state).toBe('st')
    expect(openTransaction(sealed, 'wrong-secret')).toBeNull()
    expect(openTransaction('мусор', SECRET)).toBeNull()
  })

  it('транзакция без обязательных полей не открывается', () => {
    expect(openTransaction(seal({ state: 'st' }, SECRET), SECRET)).toBeNull()
    expect(openTransaction(seal({ state: '', nonce: 'no', verifier: 've' }, SECRET), SECRET)).toBeNull()
  })

  it('open отвергает подменённую полезную нагрузку', () => {
    const sealed = seal({ sub: 'a' }, SECRET)
    const [data] = sealed.split('.')
    expect(open(`${data}.подпись`, SECRET)).toBeNull()
  })

  it('next — только внутренний путь', () => {
    expect(sanitizeNextPath('/profile')).toBe('/profile')
    expect(sanitizeNextPath('//evil.example')).toBeNull()
    expect(sanitizeNextPath('https://evil.example')).toBeNull()
    expect(sanitizeNextPath('/\\evil')).toBeNull()
    expect(sanitizeNextPath(null)).toBeNull()
    expect(sanitizeNextPath('')).toBeNull()
  })
})

describe('проверка id_token (RS256, ключ по kid)', () => {
  it('принимает корректный токен и отдаёт sub', async () => {
    const token = await signToken(goodClaims())
    const claims = await verifyIdToken(config, discoveryDoc(), token, 'nonce-1')
    expect(claims.sub).toBe('esa-user-123')
  })

  it('отвергает токен, подписанный чужим ключом', async () => {
    const other = await generateKeyPair('RS256')
    const token = await signToken(goodClaims(), { key: other.privateKey })
    await expect(verifyIdToken(config, discoveryDoc(), token, 'nonce-1')).rejects.toThrow()
  })

  it('отвергает alg=HS256 — секрет клиента не является ключом подписи', async () => {
    const token = await new SignJWT(goodClaims())
      .setProtectedHeader({ alg: 'HS256', kid: 'test-kid-1' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(new TextEncoder().encode(SECRET))
    await expect(verifyIdToken(config, discoveryDoc(), token, 'nonce-1')).rejects.toThrow()
  })

  it('отвергает чужого издателя', async () => {
    const token = await signToken({ ...goodClaims(), iss: 'https://example.invalid' })
    await expect(verifyIdToken(config, discoveryDoc(), token, 'nonce-1')).rejects.toThrow()
  })

  it('отвергает аудиторию, в которую токен выдан не нам', async () => {
    const token = await signToken({ ...goodClaims(), aud: 'somebody-else' })
    await expect(verifyIdToken(config, discoveryDoc(), token, 'nonce-1')).rejects.toThrow()
  })

  it('отвергает просроченный токен', async () => {
    const token = await signToken({
      ...goodClaims(),
      exp: Math.floor(Date.now() / 1000) - 60,
    })
    await expect(verifyIdToken(config, discoveryDoc(), token, 'nonce-1')).rejects.toThrow()
  })

  it('отвергает чужой nonce — это переигровка ответа', async () => {
    const token = await signToken(goodClaims())
    await expect(verifyIdToken(config, discoveryDoc(), token, 'nonce-другой')).rejects.toThrow()
  })

  it('отвергает мусор вместо токена', async () => {
    for (const junk of ['', 'abc', 'a.b', 'a.b.c.d', 'не-base64.не-json.не-подпись']) {
      await expect(verifyIdToken(config, discoveryDoc(), junk, 'nonce-1')).rejects.toThrow()
    }
  })

  it('extractClaims минимизирует claims и не путает неподтверждённый email с отсутствующим', () => {
    const claims = extractClaims({
      sub: 'esa-user-123',
      email: 'Person@Example.COM',
      email_verified: true,
      name: '  Иван  ',
    } as never)
    expect(claims.email).toBe('person@example.com')
    expect(claims.emailVerified).toBe(true)
    expect(claims.name).toBe('Иван')

    const unverified = extractClaims({ sub: 'x', email: 'a@b.c', email_verified: false } as never)
    expect(unverified.emailVerified).toBe(false)

    const broken = extractClaims({ sub: 'x', email: 'не-почта' } as never)
    expect(broken.email).toBeNull()
  })

  it('токен без sub не годится — нечего предъявлять', () => {
    expect(() => extractClaims({ iss: ISSUER } as never)).toThrow()
  })
})

describe('discovery', () => {
  it('читается у эмитента и issuer сверяется посимвольно', async () => {
    const local: EsaConfig = { ...config, issuer: base }
    const doc = await getDiscovery(local)
    expect(doc.issuer).toBe(base)
    expect(doc.jwks_uri).toBe(`${base}/jwks`)
  })

  it('discovery с чужим issuer не принимается', async () => {
    const wrong: EsaConfig = { ...config, issuer: `${base}/wrong` }
    await expect(getDiscovery(wrong)).rejects.toThrow()
  })
})

describe('обмен кода', () => {
  it('уходит PKCE-verifier и client_secret, а ответ без id_token — ошибка', async () => {
    await expect(exchangeCode(config, discoveryDoc(), 'code', 'verifier')).rejects.toThrow()
  })
})
