import type { Metadata } from 'next'
import Image from 'next/image'
import { getPayload } from 'payload'

import config from '@payload-config'

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

export default async function MapPage() {
  let planUrl: string | null = null
  let intro: string | null = null
  let points: { label: string; type?: string | null; note?: string | null }[] = []
  try {
    const payload = await getPayload({ config })
    const map = await payload.findGlobal({ slug: 'festival-map' })
    intro = map.intro ?? null
    points = (map.points ?? []).map((p) => ({ label: p.label, type: p.type, note: p.note }))
    if (map.planImage && typeof map.planImage === 'object' && map.planImage.url) {
      planUrl = map.planImage.url
    }
  } catch {
    // пустая БД (CI) — покажем маршрут шествия статикой
  }

  return (
    <main>
      <div className="wrap">
        <p className="kicker">Где что</p>
        <h1>Карта праздника</h1>
        {intro ? <p className="lead">{intro}</p> : null}

        {planUrl ? (
          <p>
            <Image src={planUrl} alt="План территории праздника" width={1600} height={1100} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
          </p>
        ) : (
          <p className="lead">
            Схема площадок 2026 года появится здесь ближе к празднику.
          </p>
        )}

        {points.length > 0 ? (
          <section>
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
          </section>
        ) : null}

        <section>
          <h2>Маршрут карнавального шествия</h2>
          <p>
            Традиционный маршрут: от Центра культуры и досуга по улице Чернышевского →
            Комсомольская → Урицкого → Ленина → Карла Маркса → стадион.
          </p>
          <div className="notice">
            В день праздника центр Малмыжа перекрыт для автомобилей. Парковки — на подъездах к
            центру; учитывайте это, если едете из другого города.
          </div>
        </section>
      </div>
    </main>
  )
}
