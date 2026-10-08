import { createHash, randomBytes } from 'node:crypto'

// Чистая логика списка «позвать на дату» (вскрытие 08.10): без БД и SMTP,
// всё внешнее инжектится — поэтому тестируется без поднятия сервера.
// Маршруты в `web/src/app/api/notify/*` — тонкие обёртки над этим модулем.

// Ловушка для ботов: человек поле не видит и не заполняет, бот — заполняет.
export const HONEYPOT_FIELD = 'company'

const EMAIL_MAX_LENGTH = 254

/** Нормализует адрес или возвращает `null`: формат, длина, пробелы. */
export const normalizeEmail = (input: unknown): string | null => {
  if (typeof input !== 'string') return null
  const email = input.trim().toLowerCase()
  if (email.length < 3 || email.length > EMAIL_MAX_LENGTH) return null
  // Один @, точка в домене, без пробелов. Юникод разрешён (IDN-адреса живые).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email)) return null
  return email
}

/** Троттлинг в памяти процесса (рестарт обнуляет — задокументировано). */
export type ThrottleStore = Map<string, number[]>

export const SUBSCRIBE_LIMIT = 5
export const WINDOW_MS = 60 * 60 * 1000

/**
 * Возвращает `true`, если попытка влезает в лимит, и фиксирует её.
 * `now` инжектится ради тестов; в проде — `Date.now()`.
 */
export const takeThrottleSlot = (
  store: ThrottleStore,
  key: string,
  now: number,
  limit: number = SUBSCRIBE_LIMIT,
  windowMs: number = WINDOW_MS,
): boolean => {
  const fresh = (store.get(key) ?? []).filter((ts) => now - ts < windowMs)
  if (fresh.length >= limit) {
    store.set(key, fresh)
    return false
  }
  fresh.push(now)
  store.set(key, fresh)
  return true
}

/** Токен подтверждения/отписки: 256 бит, в письмах — открыто, в БД — только хэш. */
export const mintToken = (): string => randomBytes(32).toString('hex')

export const hashToken = (token: string): string =>
  createHash('sha256').update(token, 'utf8').digest('hex')

/** IP для троттлинга: первый из X-Forwarded-For, иначе общая корзина. */
export const clientIp = (forwardedFor: string | null): string => {
  const first = (forwardedFor ?? '').split(',')[0]?.trim() ?? ''
  if (!first || first.length > 64) return 'unknown'
  return first
}

export const confirmUrl = (siteUrl: string, token: string): string =>
  `${siteUrl}/api/notify/confirm?token=${token}`

export const unsubscribeUrl = (siteUrl: string, token: string): string =>
  `${siteUrl}/api/notify/unsubscribe?token=${token}`

export const buildConfirmEmail = (
  siteUrl: string,
  token: string,
): { subject: string; text: string } => ({
  subject: 'Подтвердите: позвать вас на Ярмарку Казанскую — 2027',
  text: [
    'Вы оставили эту почту на сайте Ярмарки Казанской, чтобы мы позвали вас,',
    'когда объявят дату праздника 2027 года. Письмо будет одно.',
    '',
    `Подтвердить: ${confirmUrl(siteUrl, token)}`,
    '',
    'Если это были не вы — ничего не делать: неподтверждённая заявка удалится',
    'через 7 дней. Удалить сразу:',
    unsubscribeUrl(siteUrl, token),
  ].join('\n'),
})
