// Приёмка доступа посетителя к своей записи (D-095, аудит #015, пилот #386).
//
// История файла — это история дыры. Первая версия принимала `sub` из
// НЕПОДПИСАННОГО разбора cookie, и тест «самокованная cookie даёт доступ» был
// зелёным. Аудит 08.10 закрыл дыру через токен ЕСА. Пилот единого профиля
// (06.11, D-178) закрыл её окончательно: токен ЕСА проверяется РОВНО ОДИН
// раз — при входе, подписью RS256 по ключу из JWKS; дальше живёт подписанная
// сессия в httpOnly-cookie с префиксом `__Host-`.
//
// ГЛАВНОЕ, что этот файл теперь сторожит:
//
//   • **самокованная сессия не даёт доступа.** Подпись HMAC'ом (PAYLOAD_SECRET)
//     проверяется при каждом чтении, а cookie лежит с `__Host-` — подбросить
//     её с поддомена нельзя (браузер не примет `__Host-` без Secure/Path=/
//     и без Domain);
//   • **старая уязвимая cookie `esa_session` не работает** — имя изменено,
//     и это не переименование ради переименования: старое имя нельзя
//     оставить, иначе рядом с новой останется старая, чья подпись не
//     проверяется;
//   • **пустой фильтр — это «разрешить всё».** Отказ должен быть `false`.
//
// Остальные проверки держат построение: точное равенство (не `contains`).
import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SESSION_COOKIE, sealSession, sessionFromClaims } from '../lib/auth/session'
import { visitorsOwnRecord } from './visitorsOwnRecord'

const PAYLOAD_SECRET = 'access-test-payload-secret'
const ISSUER = 'https://xn--b1ae3a1a.xn--80adkdyec4j.xn--p1ai'
const CLIENT_ID = 'kazanskaya'

const nowS = () => Math.floor(Date.now() / 1000)

const goodSession = (sub = 'esa-user-123', secret = PAYLOAD_SECRET): string =>
  sealSession(
    {
      sub,
      email: 'a@b.c',
      name: 'Иван',
      exp: nowS() + 3600,
    },
    secret,
  )

const req = (cookie: string | null) => ({
  headers: {
    get: (name: string) => (name === 'cookie' && cookie ? cookie : null),
  },
})

const cookieReq = (cookie: string) => req(`other=1; ${SESSION_COOKIE}=${cookie}; x=2`)

const asFilter = (result: ReturnType<typeof visitorsOwnRecord>) => {
  expect(typeof result).toBe('object')
  const filter = result as { esaSub?: { equals?: unknown } }
  expect(filter.esaSub).toBeDefined()
  return filter.esaSub!.equals
}

describe('посетитель читает и правит только свою запись', () => {
  const savedSecret = process.env.PAYLOAD_SECRET

  beforeEach(() => {
    process.env.PAYLOAD_SECRET = PAYLOAD_SECRET
  })

  afterEach(() => {
    // `Reflect.deleteProperty` вместо `delete process.env.X`: типы Node не дают
    // удалять свойство индексируемого окружения, а по смыслу это ровно то же
    // самое (unset, а не строка "undefined").
    if (savedSecret === undefined) Reflect.deleteProperty(process.env, 'PAYLOAD_SECRET')
    else process.env.PAYLOAD_SECRET = savedSecret
  })

  it('даёт ТОЧНОЕ равенство по esaSub из подписанной сессии', () => {
    expect(asFilter(visitorsOwnRecord({ req: cookieReq(goodSession()) } as never))).toBe('esa-user-123')
  })

  it('самокованная сессия с чужим sub отклоняется — дыра #015 не вернулась', () => {
    const forged = goodSession('esa-user-999', 'wrong-secret')
    expect(visitorsOwnRecord({ req: cookieReq(forged) } as never)).toBe(false)
  })

  it('подменённая полезная нагрузка сессии отклоняется', () => {
    const sealed = goodSession()
    const [data] = sealed.split('.')
    expect(visitorsOwnRecord({ req: cookieReq(`${data}.подпись`) } as never)).toBe(false)
  })

  it('старая уязвимая cookie esa_session не даёт доступа', () => {
    // Раньше подделанная `esa_session` открывала чужую запись. Имя изменено
    // намеренно: рядом с новой сессией старая не должна оставаться рабочей.
    const payload = Buffer.from(JSON.stringify({ sub: 'esa-user-123' })).toString('base64url')
    expect(visitorsOwnRecord({ req: req(`esa_session=h.${payload}.s`) } as never)).toBe(false)
  })

  it('старый формат самоковки h.<payload>.s отклоняется', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'esa-user-123' })).toString('base64url')
    expect(visitorsOwnRecord({ req: cookieReq(`h.${payload}.s`) } as never)).toBe(false)
  })

  it('просроченная сессия отклоняется', () => {
    const expired = sealSession(
      { sub: 'esa-user-123', email: null, name: null, exp: nowS() - 60 },
      PAYLOAD_SECRET,
    )
    expect(visitorsOwnRecord({ req: cookieReq(expired) } as never)).toBe(false)
  })

  it('без входа доступа нет вовсе — именно false, а не пустой фильтр', () => {
    // Пустой объект Payload трактует как «разрешить всё, что не запрещено».
    expect(visitorsOwnRecord({ req: req(null) } as never)).toBe(false)
    expect(visitorsOwnRecord({ req: req('other=1') } as never)).toBe(false)
    expect(visitorsOwnRecord({ req: req(`${SESSION_COOKIE}=`) } as never)).toBe(false)
  })

  it('без PAYLOAD_SECRET — отказ, а не «пускать всех»', () => {
    Reflect.deleteProperty(process.env, 'PAYLOAD_SECRET')
    expect(visitorsOwnRecord({ req: cookieReq(goodSession()) } as never)).toBe(false)
  })

  it('роль администратора Payload не даёт доступа к чужим записям', () => {
    const reqWithAdminRole = {
      ...cookieReq(goodSession()),
      user: { id: 1, roles: ['admin'] },
    }
    expect(asFilter(visitorsOwnRecord({ req: reqWithAdminRole } as never))).toBe('esa-user-123')
    const forged = goodSession('esa-user-999', 'wrong-secret')
    expect(
      visitorsOwnRecord({ req: { ...cookieReq(forged), user: { id: 1, roles: ['admin'] } } as never }),
    ).toBe(false)
  })

  it('подпись сессии — HMAC по PAYLOAD_SECRET, а не по секрету клиента', async () => {
    // Секрет клиента ЕСА в подписи сессии не участвует: иначе подпись была бы
    // проверяемой тем же секретом, что и обмен кода.
    const enc = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
    const data = enc({ sub: 'esa-user-123', exp: nowS() + 3600 })
    const withClientSecret = `${data}.${createHmac('sha256', CLIENT_ID).update(data).digest('base64url')}`
    expect(visitorsOwnRecord({ req: cookieReq(withClientSecret) } as never)).toBe(false)
  })

  it('сессия, собранная из чужих claims, не проходит подпись', () => {
    const claims = sessionFromClaims(
      { sub: 'esa-user-999', email: null, emailVerified: false, name: null },
      nowS(),
    )
    expect(visitorsOwnRecord({ req: cookieReq(sealSession(claims, 'wrong-secret')) } as never)).toBe(
      false,
    )
  })
})
