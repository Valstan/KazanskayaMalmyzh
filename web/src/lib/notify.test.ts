// Приёмка списка «позвать на дату»: валидация, honeypot-форма,
// троттлинг, токены, текст письма. Красный прогон обязателен для каждого
// правила, которое стоит между ботом и базой.
import { describe, expect, it } from 'vitest'

import {
  buildConfirmEmail,
  clientIp,
  confirmUrl,
  hashToken,
  HONEYPOT_FIELD,
  mintToken,
  normalizeEmail,
  takeThrottleSlot,
  unsubscribeUrl,
  WINDOW_MS,
} from './notify'

describe('normalizeEmail', () => {
  it('принимает обычный адрес, режет пробелы и регистр', () => {
    expect(normalizeEmail('  Ivan@Primer.RU ')).toBe('ivan@primer.ru')
  })

  it('отклоняет мусор', () => {
    expect(normalizeEmail('')).toBeNull()
    expect(normalizeEmail(null)).toBeNull()
    expect(normalizeEmail(42)).toBeNull()
    expect(normalizeEmail('без-собаки')).toBeNull()
    expect(normalizeEmail('a@b')).toBeNull()
    expect(normalizeEmail('две@@собаки.ru')).toBeNull()
    expect(normalizeEmail('пробел @внутри.ru')).toBeNull()
    expect(normalizeEmail('x'.repeat(300))).toBeNull()
  })

  it('принимает IDN-адрес', () => {
    expect(normalizeEmail('иван@вмалмыже.рф')).toBe('иван@вмалмыже.рф')
  })
})

describe('honeypot', () => {
  it('имя поля стабильно и документировано', () => {
    expect(HONEYPOT_FIELD).toBe('company')
  })
})

describe('takeThrottleSlot', () => {
  it('пускает до лимита и режет после', () => {
    const store = new Map<string, number[]>()
    for (let i = 0; i < 5; i++) expect(takeThrottleSlot(store, 'ip', i * 1000)).toBe(true)
    expect(takeThrottleSlot(store, 'ip', 5000)).toBe(false)
  })

  it('окно уезжает — слоты возвращаются', () => {
    const store = new Map<string, number[]>()
    for (let i = 0; i < 5; i++) takeThrottleSlot(store, 'ip', 0)
    expect(takeThrottleSlot(store, 'ip', WINDOW_MS + 1)).toBe(true)
  })

  it('ведра по ключам независимы', () => {
    const store = new Map<string, number[]>()
    for (let i = 0; i < 5; i++) takeThrottleSlot(store, 'a', 0)
    expect(takeThrottleSlot(store, 'b', 0)).toBe(true)
    expect(takeThrottleSlot(store, 'a', 0)).toBe(false)
  })
})

describe('tokens', () => {
  it('токены уникальны и длинные', () => {
    const tokens = new Set([mintToken(), mintToken(), mintToken()])
    expect(tokens.size).toBe(3)
    for (const token of tokens) expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('хэш детерминирован и не содержит токен', () => {
    const token = mintToken()
    expect(hashToken(token)).toBe(hashToken(token))
    expect(hashToken(token)).not.toContain(token.slice(0, 8))
    expect(hashToken(token)).toHaveLength(64)
  })
})

describe('clientIp', () => {
  it('берёт первый адрес из цепочки', () => {
    expect(clientIp('1.2.3.4, 5.6.7.8')).toBe('1.2.3.4')
  })

  it('пусто и мусор — общая корзина', () => {
    expect(clientIp(null)).toBe('unknown')
    expect(clientIp('')).toBe('unknown')
    expect(clientIp('x'.repeat(100))).toBe('unknown')
  })
})

describe('buildConfirmEmail', () => {
  it('письмо содержит обе ссылки и обещание одного письма', () => {
    const token = 'abc123'
    const { subject, text } = buildConfirmEmail('https://example.invalid', token)
    expect(subject).not.toBe('')
    expect(text).toContain(confirmUrl('https://example.invalid', token))
    expect(text).toContain(unsubscribeUrl('https://example.invalid', token))
    expect(text).toContain('Письмо будет одно')
    expect(text).toContain('7 дней')
  })
})
