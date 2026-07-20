import type { Metadata } from 'next'
import Image from 'next/image'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Hero } from '../_components/Hero'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Карта праздника',
  description:
    'Карта Ярмарки Казанской: площадки, сцены, маршрут карнавального шествия, торговые ряды. Малмыж, 25 июля 2026.',
}

const TYPE_LABEL: Record<string, string> = {
  stage: 'Сцена',
  food: 'Еда',
  entrance: 'Вход',
  parking: 'Парковка',
  wc: 'Туалеты',
  medical: 'Медпункт',
  other: '',
}

const fmtTime = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Moscow',
})

type VenueGroup = { name: string; items: { time: string; title: string }[] }

// Площадки собираются из официальной афиши (опубликованные Events): группируем по
// location, порядок групп — по времени первого события. Схемы территории от
// оргкомитета в 2026 году нет, поэтому «карта» = где что происходит и когда.
function groupByVenue(
  events: {
    title: string
    startDate: string
    endDate?: string | null
    venue?: string | null
    location?: string | null
  }[],
): VenueGroup[] {
  const groups = new Map<string, VenueGroup>()
  for (const e of events) {
    const name = (e.location || e.venue || '').trim()
    if (!name) continue
    const start = new Date(e.startDate)
    if (Number.isNaN(start.getTime())) continue
    const time = e.endDate ? `${fmtTime.format(start)}–${fmtTime.format(new Date(e.endDate))}` : fmtTime.format(start)
    if (!groups.has(name)) groups.set(name, { name, items: [] })
    groups.get(name)!.items.push({ time, title: e.title })
  }
  return [...groups.values()]
}

export default async function MapPage() {
  let planUrl: string | null = null
  let intro: string | null = null
  let points: { label: string; type?: string | null; note?: string | null }[] = []
  let venues: VenueGroup[] = []
  try {
    const payload = await getPayload({ config })
    const map = await payload.findGlobal({ slug: 'festival-map' })
    intro = map.intro ?? null
    points = (map.points ?? []).map((p) => ({
      label: p.label,
      type: p.type,
      note: p.note,
    }))
    if (map.planImage && typeof map.planImage === 'object' && map.planImage.url) {
      planUrl = map.planImage.url
    }

    const res = await payload.find({
      collection: 'events',
      where: { _status: { equals: 'published' } },
      sort: 'startDate',
      limit: 100,
    })
    venues = groupByVenue(res.docs)
  } catch {
    // пустая БД (CI) — покажем маршрут шествия статикой
  }

  return (
    <main className="page page--inner page--map">
      <Hero
        image="malmyzh-street"
        kicker="Где что"
        title="Карта праздника"
        subtitle="Площадки, сцены и маршрут шествия"
        decor="map"
      />

      <div className="wrap page-shell">
        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          {intro ? <p className="lead">{intro}</p> : null}

          {planUrl ? (
            <p>
              <Image
                src={planUrl}
                alt="План территории праздника"
                width={1600}
                height={1100}
                style={{ width: '100%', height: 'auto', borderRadius: 12 }}
              />
            </p>
          ) : null}

          {venues.length > 0 ? (
            <>
              <h2>Площадки праздника</h2>
              <p>
                Всё происходит в центре города: в городском парке и сквере, на центральных улицах, на стадионе и в РЦКД.
                Вот что и во сколько идёт на каждой площадке.
              </p>
              <div className="venues">
                {venues.map((v) => (
                  <div className="venue" key={v.name}>
                    <h3>{v.name}</h3>
                    <ul className="venue__list">
                      {v.items.map((it, i) => (
                        <li key={i}>
                          <span className="venue__time">{it.time}</span> {it.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="lead">
              Расписание по площадкам временно недоступно — смотрите <a href="/program">программу праздника</a>.
            </p>
          )}

          {points.length > 0 ? (
            <>
              <h2>Объекты на территории</h2>
              <ul>
                {points.map((p, i) => (
                  <li key={i}>
                    <strong>{p.label}</strong>
                    {p.type && TYPE_LABEL[p.type] ? ` — ${TYPE_LABEL[p.type]}` : ''}
                    {p.note ? ` (${p.note})` : ''}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h2>Маршрут карнавального шествия</h2>
          <p>
            Традиционный маршрут: от Центра культуры и досуга по улице Чернышевского → Комсомольская → Урицкого → Ленина
            → Карла Маркса → стадион.
          </p>
          <div className="notice notice--important">
            В день праздника центр Малмыжа перекрыт для автомобилей. Парковки — на подъездах к центру; учитывайте это,
            если едете из другого города.
          </div>
        </section>
      </div>
    </main>
  )
}
