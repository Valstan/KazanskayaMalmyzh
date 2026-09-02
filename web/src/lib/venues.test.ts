import { describe, expect, it } from 'vitest'

import { compareVenueItems, venueIconFor, type VenueItem } from './venues'

const t = (h: number, m = 0) => Date.UTC(2026, 6, 25, h - 3, m) // Europe/Moscow

describe('порядок событий внутри площадки', () => {
  // Баг из PENDING: при одинаковом startDate «09:00–15:00 Этнопарк» шёл перед
  // «09:00 Город мастеров» — порядок зависел от ответа БД.
  it('точечное событие идёт перед длящимся при равном начале', () => {
    const items: VenueItem[] = [
      { title: 'Этнопарк', start: t(9), end: t(15) },
      { title: 'Город мастеров', start: t(9), end: null },
    ]
    expect([...items].sort(compareVenueItems).map((i) => i.title)).toEqual(['Город мастеров', 'Этнопарк'])
  })

  it('раньше начало — раньше в списке, независимо от длительности', () => {
    const items: VenueItem[] = [
      { title: 'Концерт', start: t(20), end: null },
      { title: 'Ярмарка', start: t(9), end: t(23) },
    ]
    expect([...items].sort(compareVenueItems).map((i) => i.title)).toEqual(['Ярмарка', 'Концерт'])
  })

  it('при равном начале короткое перед долгим, затем по названию', () => {
    const items: VenueItem[] = [
      { title: 'Б', start: t(11), end: t(13) },
      { title: 'А', start: t(11), end: t(13) },
      { title: 'В', start: t(11), end: t(12) },
    ]
    expect([...items].sort(compareVenueItems).map((i) => i.title)).toEqual(['В', 'А', 'Б'])
  })
})

describe('пиктограмма по названию площадки', () => {
  it.each([
    ['Городской парк и сквер', 'park'],
    ['Площадка в городском парке', 'pavilion'],
    ['Сцена в парке', 'stage'],
    ['Центральные улицы города', 'streets'],
    ['Стадион', 'stadium'],
    ['РЦКД', 'culture'],
    ['Районный дом культуры', 'culture'],
    ['Этногород', 'ethno'],
    ['Торговые ряды', 'trade'],
    ['Неизвестное место', null],
  ])('%s → %s', (name, key) => {
    expect(venueIconFor(name)).toBe(key)
  })
})
