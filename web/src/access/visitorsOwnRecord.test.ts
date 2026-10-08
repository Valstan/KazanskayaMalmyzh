// Приёмка доступа посетителя к своей записи (D-095, аудит #015).
//
// История файла — это история дыры: первая версия принимала `sub` из
// НЕПОДПИСАННОГО разбора cookie, и тест «самокованная cookie даёт доступ» был
// зелёным. Аудит 08.10 закрыл: теперь `sub` берётся только из токена, чью
// подпись проверил `verifyEsaToken`. Ключевая проверка — самокованный токен
// с чужим `esaSub` даёт `false`, а не фильтр.
//
// Остальные проверки держат построение: точное равенство (не `contains`),
// отказ без токена — именно `false`, а не `{}`, роли Payload игнорируются.
import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { visitorsOwnRecord } from './visitorsOwnRecord'

const SECRET = 'access-test-client-secret'
const ISSUER = 'https://xn--b1ae3a1a.xn--80adkdyec4j.xn--p1ai'
const CLIENT_ID = 'kazanskaya'

const future = () => Math.floor(Date.now() / 1000) + 3600

const mint = (payload: object, secret = SECRET): string => {
  const enc = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const data = `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc(payload)}`
  return `${data}.${createHmac('sha256', secret).update(data).digest('base64url')}`
}

const goodToken = (sub = 'esa-user-123') =>
  mint({ sub, iss: ISSUER, aud: CLIENT_ID, exp: future() })

const req = (cookie: string | null) => ({
  headers: {
    get: (name: string) => (name === 'cookie' && cookie ? cookie : null),
  },
})

const cookieReq = (token: string) => req(`other=1; esa_session=${token}; x=2`)

const asFilter = (result: ReturnType<typeof visitorsOwnRecord>) => {
  expect(typeof result).toBe('object')
  const filter = result as { esaSub?: { equals?: unknown } }
  expect(filter.esaSub).toBeDefined()
  return filter.esaSub!.equals
}

describe('посетитель читает и правит только свою запись', () => {
  const savedId = process.env.ESA_CLIENT_ID
  const savedSecret = process.env.ESA_CLIENT_SECRET
  const savedIssuer = process.env.ESA_ISSUER

  beforeEach(() => {
    process.env.ESA_CLIENT_ID = CLIENT_ID
    process.env.ESA_CLIENT_SECRET = SECRET
    process.env.ESA_ISSUER = ISSUER
  })

  afterEach(() => {
    if (savedId === undefined) delete process.env.ESA_CLIENT_ID
    else process.env.ESA_CLIENT_ID = savedId
    if (savedSecret === undefined) delete process.env.ESA_CLIENT_SECRET
    else process.env.ESA_CLIENT_SECRET = savedSecret
    if (savedIssuer === undefined) delete process.env.ESA_ISSUER
    else process.env.ESA_ISSUER = savedIssuer
  })

  it('даёт ТОЧНОЕ равенство по esaSub из проверенного токена', () => {
    expect(asFilter(visitorsOwnRecord({ req: cookieReq(goodToken()) } as never))).toBe(
      'esa-user-123',
    )
  })

  it('самокованный токен с чужим sub отклоняется — это и была дыра #015', () => {
    // Токен, подписанный НЕ нашим секретом: разбор показывает чужой sub,
    // подпись не сходится — доступа нет.
    const forged = mint({ sub: 'esa-user-999', iss: ISSUER, aud: CLIENT_ID, exp: future() }, 'wrong-secret')
    expect(visitorsOwnRecord({ req: cookieReq(forged) } as never)).toBe(false)
  })

  it('старый формат самоковки h.<payload>.s отклоняется', () => {
    // Именно такая cookie проходила до аудита: разобранный sub без проверки.
    const payload = Buffer.from(JSON.stringify({ sub: 'esa-user-123' })).toString('base64url')
    expect(visitorsOwnRecord({ req: cookieReq(`h.${payload}.s`) } as never)).toBe(false)
  })

  it('просроченный токен отклоняется', () => {
    const expired = mint({ sub: 'esa-user-123', iss: ISSUER, aud: CLIENT_ID, exp: future() - 7200 })
    expect(visitorsOwnRecord({ req: cookieReq(expired) } as never)).toBe(false)
  })

  it('без входа доступа нет вовсе — именно false, а не пустой фильтр', () => {
    // Пустой объект Payload трактует как «разрешить всё, что не запрещено».
    expect(visitorsOwnRecord({ req: req(null) } as never)).toBe(false)
    expect(visitorsOwnRecord({ req: req('other=1') } as never)).toBe(false)
    expect(visitorsOwnRecord({ req: req('esa_session=') } as never)).toBe(false)
  })

  it('без настроенной ЕСА — отказ, а не «пускать всех»', () => {
    delete process.env.ESA_CLIENT_ID
    delete process.env.ESA_CLIENT_SECRET
    expect(visitorsOwnRecord({ req: cookieReq(goodToken()) } as never)).toBe(false)
  })

  it('роль администратора Payload не даёт доступа к чужим записям', () => {
    const reqWithAdminRole = {
      ...cookieReq(goodToken()),
      user: { id: 1, roles: ['admin'] },
    }
    expect(asFilter(visitorsOwnRecord({ req: reqWithAdminRole } as never))).toBe('esa-user-123')
    const forged = mint({ sub: 'esa-user-999', iss: ISSUER, aud: CLIENT_ID, exp: future() }, 'wrong-secret')
    expect(
      visitorsOwnRecord({ req: { ...cookieReq(forged), user: { id: 1, roles: ['admin'] } } as never }),
    ).toBe(false)
  })
})
