import { describe, expect, it } from 'vitest'

import {
  FACT_KEYS,
  FACT_SOURCE_SELF,
  factIsVerified,
  factProvenanceLabel,
  factValueLabel,
  isFactKey,
  missingFactKeys,
  validateFactValue,
} from './facts'

// Факты о жителе (пилот #386, D-178). Три правила проверяются здесь как
// функции: «факт без источника не факт», «самопровозглашённое не даёт
// обещаний», «спросить один раз».

describe('набор вопросов', () => {
  it('закрытый и непустой', () => {
    expect(FACT_KEYS.length).toBeGreaterThan(0)
    expect(new Set(FACT_KEYS).size).toBe(FACT_KEYS.length)
  })

  it('чужий ключ не проходит', () => {
    expect(isFactKey('benefit_category')).toBe(true)
    expect(isFactKey('__proto__')).toBe(false)
    expect(isFactKey('constructor')).toBe(false)
    expect(isFactKey('')).toBe(false)
    expect(isFactKey(null)).toBe(false)
  })
})

describe('проверка значения', () => {
  it('выбор принимает только значение из списка', () => {
    expect(validateFactValue('benefit_category', 'none').ok).toBe(true)
    expect(validateFactValue('benefit_category', 'veteran').ok).toBe(true)
    expect(validateFactValue('benefit_category', 'свой вариант').ok).toBe(false)
    expect(validateFactValue('benefit_category', '').ok).toBe(false)
    expect(validateFactValue('benefit_category', 42).ok).toBe(false)
  })

  it('число принимает только целое в диапазоне', () => {
    expect(validateFactValue('children_count', '3').ok).toBe(true)
    expect(validateFactValue('children_count', 0).ok).toBe(true)
    expect(validateFactValue('children_count', '-1').ok).toBe(false)
    expect(validateFactValue('children_count', '2.5').ok).toBe(false)
    expect(validateFactValue('children_count', 'много').ok).toBe(false)
    expect(validateFactValue('children_count', 21).ok).toBe(false)
  })

  it('ошибка объясняет, что не так, а не просто «нет»', () => {
    const bad = validateFactValue('children_count', 'много')
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error.length).toBeGreaterThan(0)
  })
})

describe('подпись под фактом', () => {
  it('самопровозглашённый факт — «по вашим данным» и без обещаний', () => {
    const fact = { source: FACT_SOURCE_SELF, verifiedAt: null }
    expect(factIsVerified(fact)).toBe(false)
    expect(factProvenanceLabel(fact)).toBe('по вашим данным')
  })

  it('подтверждённый источником факт помечен подтверждённым', () => {
    const fact = { source: 'doc:справка-12.03', verifiedAt: '2026-03-12T00:00:00.000Z' }
    expect(factIsVerified(fact)).toBe(true)
    expect(factProvenanceLabel(fact)).toBe('подтверждено')
  })

  it('факт без источника не подтверждён, даже если проставлена дата', () => {
    expect(factIsVerified({ source: null, verifiedAt: '2026-03-12T00:00:00.000Z' })).toBe(false)
    expect(factProvenanceLabel({ source: null, verifiedAt: null })).toBe('источник не указан')
  })

  it('самопровозглашённый факт не может стать подтверждённым по дате', () => {
    expect(
      factIsVerified({ source: FACT_SOURCE_SELF, verifiedAt: '2026-03-12T00:00:00.000Z' }),
    ).toBe(false)
  })
})

describe('спросить один раз', () => {
  it('в форме только то, чего ещё нет', () => {
    const missing = missingFactKeys([{ factKey: 'benefit_category' }])
    expect(missing).not.toContain('benefit_category')
    expect(missing).toContain('children_count')
  })

  it('если всё спрошено — вопросов нет', () => {
    const missing = missingFactKeys(FACT_KEYS.map((factKey) => ({ factKey })))
    expect(missing).toEqual([])
  })

  it('чужая запись не считается нашим фактом', () => {
    expect(missingFactKeys([{ factKey: 'что-то' }])).toEqual(FACT_KEYS)
  })
})

describe('показ значения', () => {
  it('значение-список показывается словами, а не кодом', () => {
    expect(factValueLabel('benefit_category', 'veteran')).toBe('Ветеран')
    expect(factValueLabel('children_count', '3')).toBe('3')
  })
})
