import type { Access } from 'payload'

import { esaConfig, verifyEsaToken, visitorTokenFromRequest } from '../lib/esa'

// Доступ посетителя к своей записи — по `sub` из ПРОВЕРЕННОГО токена ЕСА,
// а не по ролям Payload и не по переданному полю.
//
// Почему не «как у админа» (`adminOrSelf` сверяет id из JWT админки): посетитель
// не администратор, и его запись лежит в отдельной коллекции. Сверять надо то,
// что действительно доказывает личность, — идентификатор ЕСА в подписанном токене.
//
// ⚠️ Аудит #015 (08.10): раньше здесь брался `sub` из НЕПОДПИСАННОГО разбора
// (`visitorSubFromRequest` — он и остался, но только для логов и отладки).
// Самокованная cookie с чужим `esaSub` открывала чужую запись. Теперь подпись
// проверяется `verifyEsaToken`; без настроенной ЕСА (`esaConfig() === null`)
// и при любой негодности токена — отказ, а не фильтр.
//
// Возвращаем ТОЧНОЕ равенство по `esaSub`, а не `contains`/`like`: подстрока в
// фильтре — это ровно тот класс, где фильтр целиком не ловит и запрос молча уходит
// в «ничего не нашлось». Точное равенство сначала проверится на проде (см. PENDING),
// и если КАРМАН/ЕСА отдаст не строку, а список значений, это упадёт сразу.
export const visitorsOwnRecord: Access = ({ req }) => {
  const config = esaConfig()
  if (!config) return false
  const claims = verifyEsaToken(visitorTokenFromRequest(req), config)
  if (!claims) return false
  return {
    esaSub: {
      equals: claims.sub,
    },
  }
}
