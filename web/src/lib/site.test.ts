import { describe, expect, it } from 'vitest'

import { FEST_DATE_ISO, FEST_DATE_HUMAN, FEST_DATE_HUMAN_PREP } from './site'

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
