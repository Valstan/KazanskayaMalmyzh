import { describe, expect, it } from 'vitest'

import { YEARS, getYearInfo, yearsWithPage } from './years'

describe('летопись годов', () => {
  // Реальный баг сессии 4: в сыром массиве 2019 стоял между 2012 и 2011, из-за
  // чего ломалась и сетка, и навигация «предыдущий/следующий» на страницах годов.
  it('годы идут строго по убыванию', () => {
    const years = YEARS.map((y) => y.year)
    expect(years).toEqual([...years].sort((a, b) => b - a))
  })

  it('год не повторяется', () => {
    const years = YEARS.map((y) => y.year)
    expect(new Set(years).size).toBe(years.length)
  })

  it('у каждого года есть непустая тема', () => {
    for (const y of YEARS) expect(y.theme.trim()).not.toBe('')
  })

  it('yearsWithPage возвращает ровно годы с абзацами и в том же порядке', () => {
    expect(yearsWithPage()).toEqual(YEARS.filter((y) => y.paragraphs.length > 0).map((y) => y.year))
  })

  it('getYearInfo находит любой год из списка и молчит про чужой', () => {
    for (const y of YEARS) expect(getYearInfo(y.year)?.year).toBe(y.year)
    expect(getYearInfo(1899)).toBeUndefined()
  })

  // Страница года собирается из paragraphs; фото без страницы показать негде,
  // а подпись без источника нарушает наш же порядок атрибуции (/istochniki-foto).
  it('фотографии есть только у годов со страницей и всегда с подписью', () => {
    const withPage = new Set(yearsWithPage())
    for (const y of YEARS) {
      if (!y.photos?.length) continue
      expect(withPage.has(y.year)).toBe(true)
      for (const photo of y.photos) {
        expect(photo.src.trim()).not.toBe('')
        expect(photo.alt.trim()).not.toBe('')
      }
    }
  })
})
