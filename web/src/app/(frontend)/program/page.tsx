import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import { festivalJsonLd, programFaqJsonLd } from '../../../lib/seo'
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

  // JSON-LD #051: Festival c subEvent из опубликованной афиши + FAQ (ответы
  // дублируют видимый контент страницы).
  const jsonLd = festivalJsonLd(events)

  return (
    <main className="page page--inner page--program">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(programFaqJsonLd) }} />

      <Hero
        image="hero-fair"
        kicker="25 июля 2026"
        title="Программа праздника"
        subtitle="От утреннего шествия до ночного фейерверка"
        decor="program"
      />

      <div className="wrap page-shell">
        <div className="flourish" aria-hidden />

        {events.length > 0 ? (
          <ProgramLive events={events} />
        ) : (
          <section className="section section--tight">
            <p className="lead">
              Расписание по часам временно недоступно — смотрите официальную афишу ниже. А устроен праздник из года в
              год так:
            </p>
            <ul>
              <li>
                <strong>Утро</strong> — открытие, «Город мастеров» и «Этногород» начинают работу, торговые ряды.
              </li>
              <li>
                <strong>День</strong> — карнавальное шествие по теме года «Мы Вятские — люди хватские!» через центр
                города к стадиону, представления на стадионе.
              </li>
              <li>
                <strong>Вторая половина дня</strong> — конкурсы ремёсел и национальных подворий, «Куштымаш», концерты.
              </li>
              <li>
                <strong>Вечер и ночь</strong> — вечерняя программа, дискотека и фейерверк; праздник длится до утра
                воскресенья.
              </li>
            </ul>
            <Figure
              image="fireworks"
              alt="Праздничный фейерверк в ночном небе"
              caption="Финал праздника — фейерверк над Малмыжем"
            />
            <div className="notice">
              Праздник начинается в 9 утра субботы. Центр города в этот день перекрыт для автотранспорта — планируйте
              дорогу заранее.
            </div>
          </section>
        )}

        {/* Официальная афиша оргкомитета — вторична к таймлайну (лубок-редизайн):
            «официальный документ», а не носитель программы. */}
        <section className="section section--tight">
          <h2>Официальная афиша</h2>
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
        </section>

        {/* Видимый дубль FAQ-разметки (#051): Google требует, чтобы ответы FAQPage
            были на странице, а не только в JSON-LD. <details> — контент в DOM. */}
        <section className="section section--tight">
          <h2>Частые вопросы</h2>
          <div className="faq">
            <details className="faq__item" open>
              <summary>Когда проходит праздник?</summary>
              <p className="faq__answer">Суббота 25 июля 2026, с 9 утра — до утра воскресенья.</p>
            </details>
            <details className="faq__item">
              <summary>Вход платный?</summary>
              <p className="faq__answer">Нет, все площадки праздника — со свободным входом.</p>
            </details>
            <details className="faq__item">
              <summary>Можно ли на машине в центр?</summary>
              <p className="faq__answer">
                Центр города в день праздника перекрыт для автотранспорта — планируйте дорогу и парковку заранее.
              </p>
            </details>
            <details className="faq__item">
              <summary>Как участвовать в карнавале или торговле?</summary>
              <p className="faq__answer">
                Оргкомитет: карнавал и ремесленники — (83347) 2‑22‑28, торговля — (83347) 2‑28‑83.
              </p>
            </details>
          </div>
        </section>
      </div>
    </main>
  )
}
