import type { Access } from 'payload'

import { readSessionFromRequest } from '../lib/auth/session'

// Доступ жителя к своим фактам — по `sub` из подписанной сессии.
//
// Почему не по токену ЕСА в cookie: токен живёт минуты и проверяется на
// каждом запросе — значит, либо сеть в критическом пути каждой страницы,
// либо кэш JWKS в процессе, который на холодном старте роняет сайт на паузе.
// Сессия длиннее и проверяется локально (HMAC), а токен ЕСА проверяется
// РОВНО ОДИН раз — на входе.
//
// Возвращаем ТОЧНОЕ равенство по `esaSub`, а не `contains`/`like`: подстрока в
// фильтре — это ровно тот класс, где фильтр целиком не ловит и запрос молча
// уходит в «ничего не нашлось».
export const visitorFactsOwn: Access = ({ req }) => {
  const session = readSessionFromRequest(req)
  if (!session) return false
  return {
    esaSub: {
      equals: session.sub,
    },
  }
}
