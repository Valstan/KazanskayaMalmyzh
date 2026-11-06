import { describe, expect, it } from 'vitest'

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
  TX_COOKIE,
  openSession,
  publicProfile,
  readSessionFromRequest,
  sealSession,
  sessionFromClaims,
} from './session'

// Сессия жителя — подписанная cookie. Проверяем ровно те места, где сессия
// может тихо испортиться: подделка, истечение, отсутствие cookie и разные
// формы заголовка (Payload, Next, сырой запрос).

const SECRET = 'payload-secret-for-tests'
const nowS = 1_800_000_000

const claims = { sub: 'esa-user-123', email: 'a@b.c', emailVerified: true, name: 'Иван' }

describe('подпись и срок', () => {
  it('сессия открывается тем же секретом', () => {
    const sealed = sealSession(sessionFromClaims(claims, nowS), SECRET)
    const opened = openSession(sealed, SECRET, nowS)
    expect(opened?.sub).toBe('esa-user-123')
    expect(opened?.email).toBe('a@b.c')
    expect(opened?.name).toBe('Иван')
  })

  it('чужим секретом не открывается', () => {
    const sealed = sealSession(sessionFromClaims(claims, nowS), SECRET)
    expect(openSession(sealed, 'wrong', nowS)).toBeNull()
  })

  it('истёкшая сессия не открывается', () => {
    const sealed = sealSession(sessionFromClaims(claims, nowS), SECRET)
    expect(openSession(sealed, SECRET, nowS + SESSION_MAX_AGE_S + 1)).toBeNull()
  })

  it('подделка счёта exp не проходит: срок подписан', () => {
    const sealed = sealSession({ ...sessionFromClaims(claims, nowS), exp: nowS + 9999 }, SECRET)
    expect(openSession(sealed, SECRET, nowS + SESSION_MAX_AGE_S + 1)).toBeNull()
  })

  it('без cookie — это «не вошёл», а не ошибка', () => {
    expect(openSession(undefined, SECRET, nowS)).toBeNull()
    expect(openSession('', SECRET, nowS)).toBeNull()
  })
})

describe('чтение сессии из запроса', () => {
  const sealed = sealSession(sessionFromClaims(claims, nowS), SECRET)

  it('находит cookie в заголовке', () => {
    const req = {
      headers: { get: (name: string) => (name === 'cookie' ? `other=1; ${SESSION_COOKIE}=${sealed}` : null) },
    }
    process.env.PAYLOAD_SECRET = SECRET
    expect(readSessionFromRequest(req)?.sub).toBe('esa-user-123')
  })

  it('находит cookie, когда её уже разобрал Next', () => {
    process.env.PAYLOAD_SECRET = SECRET
    const jar = { get: (name: string) => (name === SESSION_COOKIE ? sealed : undefined) }
    expect(readSessionFromRequest({ headers: {}, cookies: jar })?.sub).toBe('esa-user-123')
  })

  it('находит cookie, когда лежит plain-объектом (Payload)', () => {
    process.env.PAYLOAD_SECRET = SECRET
    expect(readSessionFromRequest({ headers: {}, cookies: { [SESSION_COOKIE]: sealed } })?.sub).toBe(
      'esa-user-123',
    )
  })

  it('пусто без cookie', () => {
    process.env.PAYLOAD_SECRET = SECRET
    expect(readSessionFromRequest({ headers: { get: () => null } })).toBeNull()
    expect(readSessionFromRequest({ headers: {}, cookies: {} })).toBeNull()
  })
})

describe('имена cookie', () => {
  it('обе с префиксом __Host- (подброс с поддомена невозможен, #285)', () => {
    expect(SESSION_COOKIE.startsWith('__Host-')).toBe(true)
    expect(TX_COOKIE.startsWith('__Host-')).toBe(true)
  })
})

describe('публичный профиль', () => {
  it('не отдаёт наружу sub и exp', () => {
    const s = sessionFromClaims(claims, nowS)
    const pub = publicProfile(s)
    expect(Object.keys(pub).sort()).toEqual(['email', 'name'])
    expect(JSON.stringify(pub)).not.toContain('esa-user-123')
  })

  it('без имени показывает что-то человеческое', () => {
    const s = sessionFromClaims({ ...claims, name: null }, nowS)
    expect(publicProfile(s).name).toBe('a')
  })
})
