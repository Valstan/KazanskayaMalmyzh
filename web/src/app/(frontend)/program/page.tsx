import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Программа праздника',
  description:
    'Программа Ярмарки Казанской — 2026: карнавальное шествие, Город мастеров, Этногород, сцена, торговые ряды и фейерверк. 25 июля 2026, Малмыж.',
}

const fmtTime = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Moscow',
})

export default async function ProgramPage() {
  let events: { id: number | string; title: string; summary?: string | null; startDate: string; location?: string | null; venue?: string | null }[] = []
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'events',
      where: { _status: { equals: 'published' } },
      sort: 'startDate',
      limit: 100,
    })
    events = res.docs
  } catch {
    // CI-сборка против пустой БД / БД недоступна — показываем каркас программы.
  }

  return (
    <main>
      <div className="wrap">
        <p className="kicker">25 июля 2026</p>
        <h1>Программа праздника</h1>

        {events.length > 0 ? (
          <section>
            {events.map((e) => (
              <div className="event" key={e.id}>
                <div className="when">{fmtTime.format(new Date(e.startDate))} — {e.title}</div>
                {e.venue || e.location ? (
                  <div className="where">{[e.venue, e.location].filter(Boolean).join(' · ')}</div>
                ) : null}
                {e.summary ? <p>{e.summary}</p> : null}
              </div>
            ))}
          </section>
        ) : (
          <section>
            <p className="lead">
              Оргкомитет ещё не опубликовал афишу 2026 года — как только она появится, точное
              расписание будет здесь. А устроен праздник из года в год так:
            </p>
            <ul>
              <li><strong>Утро</strong> — открытие, «Город мастеров» и «Этногород» начинают работу, торговые ряды.</li>
              <li><strong>День</strong> — карнавальное шествие по теме года «Мы Вятские — люди хватские!» через центр города к стадиону, представления на стадионе.</li>
              <li><strong>Вторая половина дня</strong> — конкурсы ремёсел и национальных подворий, «Куштымаш», концерты.</li>
              <li><strong>Вечер и ночь</strong> — вечерняя программа, дискотека и фейерверк; праздник длится до утра воскресенья.</li>
            </ul>
            <div className="notice">
              Праздник начинается в 9 утра субботы. Центр города в этот день перекрыт для
              автотранспорта — планируйте дорогу заранее.
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
