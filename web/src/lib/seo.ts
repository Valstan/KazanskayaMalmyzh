import { SITE_URL, FEST_DATE_ISO, FEST_CANCELLED, FEST_CANCEL_LEAD, FEST_CANCEL_NOTE } from './site'

// SEO/GEO-пакет #051: JSON-LD праздника. Один источник для главной и /program,
// чтобы разметка не расходилась. Факты подтверждены афишей-2026 (пост РЦКД
// -217788511_5327) и газетой района — см. docs/CONTENT_SOURCES.md.

// Праздник идёт с 9 утра субботы до утра воскресенья (МСК).
const FEST_START = `${FEST_DATE_ISO}T09:00:00+03:00`
const FEST_END = '2026-07-26T06:00:00+03:00'

const PLACE = {
  '@type': 'Place',
  name: 'г. Малмыж',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Малмыж',
    addressRegion: 'Кировская область',
    addressCountry: 'RU',
  },
}

export type FestivalSubEvent = {
  title: string
  summary?: string | null
  startDate: string
  endDate?: string | null
  venue?: string | null
}

const DESCRIPTION =
  'Главный праздник Малмыжского района: карнавальное шествие по теме года, «Город мастеров», «Этногород», торговые ряды, вечерняя программа и фейерверк.'

/**
 * Festival Event; subEvents — опубликованные события афиши из Payload.
 * При отмене — `EventCancelled` с сохранённой исходной датой (требование
 * Google для отменённых событий) и без offers: «бесплатный вход» на
 * несостоявшийся праздник — противоречие.
 */
export function festivalJsonLd(subEvents: FestivalSubEvent[] = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Festival',
    name: 'Ярмарка Казанская в Малмыже — 2026',
    startDate: FEST_START,
    endDate: FEST_END,
    eventStatus: FEST_CANCELLED ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: PLACE,
    image: [`${SITE_URL}/decor/afisha-2026.jpg`, `${SITE_URL}/decor/logo.png`],
    description: FEST_CANCELLED ? `${FEST_CANCEL_LEAD} ${FEST_CANCEL_NOTE} ${DESCRIPTION}` : DESCRIPTION,
    url: SITE_URL,
    isAccessibleForFree: true,
    ...(FEST_CANCELLED
      ? {}
      : {
          offers: {
            '@type': 'Offer',
            price: 0,
            priceCurrency: 'RUB',
            availability: 'https://schema.org/InStock',
            url: SITE_URL,
          },
        }),
    organizer: {
      '@type': 'Organization',
      name: 'Оргкомитет «Ярмарки Казанской» (Малмыжский район)',
      url: SITE_URL,
    },
    ...(subEvents.length > 0
      ? {
          subEvent: subEvents.map((e) => ({
            '@type': 'Event',
            name: e.title,
            ...(e.summary ? { description: e.summary } : {}),
            startDate: e.startDate,
            ...(e.endDate ? { endDate: e.endDate } : {}),
            eventStatus: FEST_CANCELLED
              ? 'https://schema.org/EventCancelled'
              : 'https://schema.org/EventScheduled',
            location: e.venue ? { ...PLACE, name: `${e.venue}, г. Малмыж` } : PLACE,
          })),
        }
      : {}),
  }
}

/** FAQ /program — ответы дублируют видимый контент страницы (требование Google). */
export const programFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: FEST_CANCELLED
        ? 'Состоится ли праздник 25 июля 2026?'
        : 'Когда проходит Ярмарка Казанская в 2026 году?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: FEST_CANCELLED
          ? `${FEST_CANCEL_LEAD} ${FEST_CANCEL_NOTE}`
          : 'В субботу 25 июля 2026 года в Малмыже. Праздник начинается в 9 утра и длится до утра воскресенья.',
      },
    },
    {
      '@type': 'Question',
      name: 'Платный ли вход на праздник?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Нет, вход на все площадки праздника свободный.',
      },
    },
    {
      '@type': 'Question',
      name: 'Можно ли проехать в центр Малмыжа в день праздника?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Центр города в день праздника перекрыт для автотранспорта — планируйте дорогу и парковку заранее.',
      },
    },
    {
      '@type': 'Question',
      name: 'Как принять участие в карнавале или торговле?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Через оргкомитет: карнавал и ремесленники — (83347) 2‑22‑28, торговля — (83347) 2‑28‑83.',
      },
    },
  ],
}
