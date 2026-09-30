// Приёмка доступа посетителя к своей записи (D-095). Ловит класс «фильтр целиком
// не ловит», то есть запрос молча уходит в «ничего не нашлось» и правило доступа
// выглядит работающим.
//
// Ключевая проверка — ПЕРВАЯ, без неё остальные бессмысленны: правило обязано
// отдавать точное равенство по `esaSub`, а не «contains». Подстрока в фильтре
// — это ровно тот случай, где проверка зеленеет при настоящей дыре.
import { describe, expect, it } from 'vitest'

import { visitorsOwnRecord } from './visitorsOwnRecord'

const req = (sub: string | null) => ({
  headers: {
    get: (name: string) => {
      if (name !== 'cookie') return null
      if (!sub) return null
      const payload = Buffer.from(JSON.stringify({ sub })).toString('base64url')
      return `esa_session=h.${payload}.s`
    },
  },
})

const asFilter = (result: ReturnType<typeof visitorsOwnRecord>) => {
  expect(typeof result).toBe('object')
  const filter = result as { esaSub?: { equals?: unknown } }
  expect(filter.esaSub).toBeDefined()
  return filter.esaSub!.equals
}

describe('посетитель читает и правит только свою запись', () => {
  it('даёт ТОЧНОЕ равенство по esaSub, а не вхождение подстроки', () => {
    expect(asFilter(visitorsOwnRecord({ req: req('esa-user-123') } as never))).toBe('esa-user-123')
  })

  it('без входа доступа нет вовсе — даже пустой фильтр не «всё разрешить»', () => {
    // Здесь важно, что возвращается `false`, а не `{}`: пустой объект в доступе
    // Payload трактует как «разрешить всё, что не запрещено», то есть аноним прошёл бы.
    expect(visitorsOwnRecord({ req: req(null) } as never)).toBe(false)
  })

  it('не выдаёт запись, даже если подделан мусорный cookie', () => {
    expect(visitorsOwnRecord({ req: req('') } as never)).toBe(false)
  })

  it('роль администратора Payload не даёт доступа к чужим записям', () => {
    // Админка и посетители — разные сущности. Если бы правило смотрело на роли,
    // редактор получил бы все записи посетителей, а это данные людей.
    const reqWithAdminRole = {
      ...req('esa-user-123'),
      user: { id: 1, roles: ['admin'] },
    }
    expect(asFilter(visitorsOwnRecord({ req: reqWithAdminRole } as never))).toBe('esa-user-123')
  })
})