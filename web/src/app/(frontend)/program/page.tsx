import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Hero, Figure } from '../_components/Hero'
import { ProgramLive, type ProgramEvent } from '../_components/ProgramLive'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Программа праздника',
  description:
    'Программа Ярмарки Казанской — 2026: карнавальное шествие, Город мастеров, Этногород, сцена, торговые ряды и фейерверк. 25 июля 2026, Малмыж.',
}

export default async function ProgramPage() {
  let events: ProgramEvent[] = []
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
      <Hero image="hero-fair" kicker="25 июля 2026" title="Программа праздника" subtitle="От утреннего шествия до ночного фейерверка" />

      <div className="wrap">
        <div className="flourish" aria-hidden />

        {/* Официальная афиша оргкомитета (пост РЦКД ВКонтакте) — показываем целиком (R7). */}
        <figure className="poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/decor/afisha-2026.jpg"
            alt="Официальная афиша Ярмарки Казанской — 25 июля 2026, Малмыж: программа праздника от «Города мастеров» до ночной дискотеки"
            width={853}
            height={1280}
            loading="lazy"
          />
          <figcaption>
            Официальная афиша праздника ·{' '}
            <a href="https://vk.com/wall-217788511_5327" rel="noopener noreferrer" target="_blank">
              источник: РЦКД Малмыж, ВКонтакте
            </a>
          </figcaption>
        </figure>

        {events.length > 0 ? (
          <ProgramLive events={events} />
        ) : (
          <section className="section section--tight">
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
            <Figure
              image="fireworks"
              alt="Праздничный фейерверк в ночном небе"
              caption="Финал праздника — фейерверк над Малмыжем"
            />
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
