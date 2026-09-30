import type { Access, FieldAccess } from 'payload'

// Только серверный код: хук обмена кода на токен и запись сессии.
//
// Отдельно от `adminOrEditor`, где достаточно «роль есть». Здесь различие важно:
// роль — это про нашу админку, а эти правила стоят на полях, которые меняет
// серверный путь ЕСА. Посетитель, даже получив доступ к полю, не смог бы подделать
// `sub`, потому что правило всё равно спрашивает «это сервер?».
//
// Реализовано как `overrideAccess: true` в Local API — стандартный и единственный
// путь, которым сервер пишет в коллекцию минуя правила доступа. Проверка самого
// признака — в [`../lib/esa`].
//
// Типы у на уровня коллекции и у поля РАЗНЫЕ (`Access` против `FieldAccess`):
// у поля в `args.id` может прийти строка. Одна функция на оба места не
// подписывается, поэтому здесь два объявления одного правила, а логика одна.

const isServerWrite = (req: unknown): boolean => {
  const context = (req as { context?: { payloadServer?: boolean } } | null)?.context
  return context?.payloadServer === true
}

export const payloadServerUser: Access = ({ req }) => isServerWrite(req)

export const payloadServerField: FieldAccess = ({ req }) => isServerWrite(req)
