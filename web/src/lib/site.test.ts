import { generatePayloadCookie } from 'payload'
import { describe, expect, it } from 'vitest'

import { Users } from '../collections/Users'

import { FEST_DATE_ISO, FEST_DATE_HUMAN, FEST_DATE_HUMAN_PREP, SESSION_COOKIE_PREFIX, SITE_URL } from './site'

// Дата праздника живёт в трёх формах: машинной (ISO), именительной (стоит
// отдельной репликой — «суббота, 25 июля 2026 · г. Малмыж») и предложной
// (внутри фразы — «Ярмарка в субботу … не состоялась»). Баг, из-за которого
// появились эти тесты: предложной формы не было вовсе, и в подвал каждой
// страницы подставлялась именительная — «Ярмарка суббота, 25 июля 2026 не
// состоялась». Когда назовут дату 2027 года, править придётся все три строки;
// тесты ловят, если поправили не все.

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

describe('формы даты праздника не расходятся', () => {
  const [year, month, day] = FEST_DATE_ISO.split('-').map(Number)
  const humanDay = `${day} ${MONTHS[month - 1]}`

  it.each([
    ['именительная', FEST_DATE_HUMAN],
    ['предложная', FEST_DATE_HUMAN_PREP],
  ])('%s форма содержит день, месяц и год из FEST_DATE_ISO', (_name, value) => {
    expect(value).toContain(humanDay)
    expect(value).toContain(String(year))
  })

  it('формы называют один и тот же день недели', () => {
    const weekday = new Date(`${FEST_DATE_ISO}T12:00:00+03:00`).toLocaleDateString('ru-RU', {
      weekday: 'long',
      timeZone: 'Europe/Moscow',
    })
    // «суббота» → «суббот», чтобы совпало и с «в субботу» предложной формы.
    const stem = weekday.slice(0, -1)
    expect(FEST_DATE_HUMAN).toContain(stem)
    expect(FEST_DATE_HUMAN_PREP).toContain(stem)
  })

  // Ровно та подстановка, что была сломана: фраза с датой внутри. Проверяем
  // свойство формы, а не конкретный день недели: перенос праздника на другой
  // день не должен красить верный код.
  it('предложная форма встаёт внутрь фразы, именительная — нет', () => {
    expect(`Ярмарка ${FEST_DATE_HUMAN_PREP} не состоялась`).toMatch(/^Ярмарка в \S+ /)
    expect(FEST_DATE_HUMAN.startsWith('в ')).toBe(false)
  })
})

describe('сессионная cookie админки: префикс __Host- (#285)', () => {
  it('префикс начинается с __Host-', () => {
    expect(SESSION_COOKIE_PREFIX.startsWith('__Host-')).toBe(true)
  })

  // Проверяем не намерение, а результат: гоняем настоящий генератор Payload с
  // нашими настройками и смотрим на готовую строку Set-Cookie. Тест краснеет,
  // если кто-то уберёт secure или добавит domain — то есть на обеих формах
  // молчаливой поломки входа из G339.
  it('готовая cookie удовлетворяет всем четырём условиям __Host-', () => {
    const cookie = generatePayloadCookie({
      collectionAuthConfig: Users.auth as never,
      cookiePrefix: SESSION_COOKIE_PREFIX,
      token: 'TEST',
    })

    expect(cookie).toContain('__Host-payload-token=')
    expect(cookie).toMatch(/Path=\/(;|$)/)
    expect(cookie).toContain('Secure')
    // Domain у __Host--cookie запрещён: браузер отвергнет её молча.
    expect(cookie).not.toMatch(/Domain=/i)
  })

  it('в коллекции Users задан secure и не задан domain', () => {
    const cookies = (Users.auth as { cookies?: Record<string, unknown> }).cookies
    expect(cookies?.secure).toBe(true)
    expect(cookies && 'domain' in cookies).toBe(false)
  })
})

describe('письмо восстановления пароля', () => {
  const fp = (Users.auth as {
    forgotPassword?: {
      generateEmailSubject?: () => string
      generateEmailHTML?: (a?: { token?: string }) => string
    }
  }).forgotPassword

  it('тема и текст по-русски', () => {
    expect(fp?.generateEmailSubject?.()).toContain('Восстановление пароля')
    expect(fp?.generateEmailHTML?.({ token: 'T' })).toContain('Задать новый пароль')
  })

  // Ссылка обязана быть абсолютной: относительная в письме некликабельна, а
  // заметить это можно только получив письмо — то есть уже в проде.
  it('ссылка абсолютная, ведёт на /admin/reset/<токен> и содержит сам токен', () => {
    const html = fp?.generateEmailHTML?.({ token: 'ABC123' }) ?? ''
    const href = html.match(/href="([^"]+)"/)?.[1] ?? ''
    expect(href).toMatch(/^https?:\/\//)
    expect(href).toBe(`${SITE_URL}/admin/reset/ABC123`)
  })

  it('без токена не подставляет undefined в адрес', () => {
    const html = fp?.generateEmailHTML?.({}) ?? ''
    expect(html).not.toContain('undefined')
  })
})
