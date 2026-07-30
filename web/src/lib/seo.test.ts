import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { FestivalSubEvent } from './seo'

// Каждый тест берёт модуль заново: festivalJsonLd читает FEST_CANCELLED на уровне
// модуля, поэтому подменять флаг можно только до импорта.
async function loadSeo(cancelled: boolean) {
  vi.resetModules()
  vi.doMock('./site', async () => {
    const actual = await vi.importActual<typeof import('./site')>('./site')
    return { ...actual, FEST_CANCELLED: cancelled }
  })
  return import('./seo')
}

const EVENTS: FestivalSubEvent[] = [
  { title: 'Город мастеров', startDate: '2026-07-25T09:00:00+03:00', endDate: '2026-07-25T15:00:00+03:00', venue: 'Городской парк' },
  { title: 'Карнавальное шествие', startDate: '2026-07-25T11:00:00+03:00', summary: 'От РЦКД к стадиону' },
]

const CANCELLED = 'https://schema.org/EventCancelled'
const SCHEDULED = 'https://schema.org/EventScheduled'

beforeEach(() => vi.resetModules())
afterEach(() => vi.doUnmock('./site'))

describe('festivalJsonLd — сцепка статуса праздника', () => {
  // Баг сессии 8: праздник был помечен отменённым, а события афиши остались
  // EventScheduled — поисковики видели «отменён» и «состоится» одновременно.
  it.each([true, false])('статус subEvent совпадает со статусом праздника (отменён: %s)', async (cancelled) => {
    const { festivalJsonLd } = await loadSeo(cancelled)
    const ld = festivalJsonLd(EVENTS) as { eventStatus: string; subEvent: { eventStatus: string }[] }

    expect(ld.eventStatus).toBe(cancelled ? CANCELLED : SCHEDULED)
    expect(ld.subEvent).toHaveLength(EVENTS.length)
    for (const sub of ld.subEvent) expect(sub.eventStatus).toBe(ld.eventStatus)
  })

  // Бесплатный вход на несостоявшийся праздник — противоречие, за которое
  // Google снимает разметку целиком.
  it.each([true, false])('offers есть тогда и только тогда, когда праздник в силе (отменён: %s)', async (cancelled) => {
    const { festivalJsonLd } = await loadSeo(cancelled)
    const ld = festivalJsonLd() as { eventStatus: string; offers?: unknown }

    expect('offers' in ld).toBe(ld.eventStatus === SCHEDULED)
  })

  it('при отмене описание начинается с сообщения об отмене', async () => {
    const { festivalJsonLd } = await loadSeo(true)
    const ld = festivalJsonLd() as { description: string }

    expect(ld.description).toMatch(/^Ярмарка Казанская.*не состоится\./)
  })
})

describe('festivalJsonLd — структура', () => {
  it('без событий ключа subEvent нет вовсе (пустой массив ломает валидатор)', async () => {
    const { festivalJsonLd } = await loadSeo(true)
    expect('subEvent' in festivalJsonLd()).toBe(false)
  })

  it('даты праздника и событий — ISO со смещением МСК', async () => {
    const { festivalJsonLd } = await loadSeo(true)
    const ld = festivalJsonLd(EVENTS) as {
      startDate: string
      endDate: string
      subEvent: { startDate: string; endDate?: string }[]
    }

    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+03:00$/
    expect(ld.startDate).toMatch(iso)
    expect(ld.endDate).toMatch(iso)
    for (const sub of ld.subEvent) expect(sub.startDate).toMatch(iso)
    // Праздник длится до утра воскресенья — конец обязан быть позже начала.
    expect(new Date(ld.endDate).getTime()).toBeGreaterThan(new Date(ld.startDate).getTime())
  })

  it('событие без venue наследует место праздника, с venue — уточняет его', async () => {
    const { festivalJsonLd } = await loadSeo(true)
    const ld = festivalJsonLd(EVENTS) as { subEvent: { name: string; location: { name: string } }[] }

    const withVenue = ld.subEvent.find((s) => s.name === 'Город мастеров')!
    const withoutVenue = ld.subEvent.find((s) => s.name === 'Карнавальное шествие')!
    expect(withVenue.location.name).toBe('Городской парк, г. Малмыж')
    expect(withoutVenue.location.name).toBe('г. Малмыж')
  })
})

describe('programFaqJsonLd', () => {
  it('ответы непустые — Google требует видимый текст в каждом', async () => {
    const { programFaqJsonLd } = await loadSeo(true)
    const faq = programFaqJsonLd as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] }

    expect(faq.mainEntity.length).toBeGreaterThan(0)
    for (const q of faq.mainEntity) {
      expect(q.name.trim()).not.toBe('')
      expect(q.acceptedAnswer.text.trim()).not.toBe('')
    }
  })

  it('при отмене первый вопрос отвечает «не состоится», а не датой', async () => {
    const { programFaqJsonLd } = await loadSeo(true)
    const faq = programFaqJsonLd as { mainEntity: { acceptedAnswer: { text: string } }[] }

    expect(faq.mainEntity[0].acceptedAnswer.text).toMatch(/не состоится/)
  })
})
