import type { Metadata } from 'next'
import Link from 'next/link'

import { YEARS, yearsWithPage } from '../../../lib/years'
import { Hero } from '../_components/Hero'

export const metadata: Metadata = {
  title: 'Как это было — темы ярмарки по годам',
  description:
    'Летопись Ярмарки Казанской: ежегодные темы карнавального шествия с фотографиями и подробностями — от «Города мастеров» 2012 года до «Мы Вятские — люди хватские!» 2026 года.',
}

export default function YearsPage() {
  const withPage = new Set(yearsWithPage())
  return (
    <main>
      <Hero image="oa-01" kicker="Архив" title="Как это было" subtitle="Летопись карнавала по годам" />

      <div className="wrap">
        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          <p className="lead">
            У карнавального шествия каждый год — своя тема. Костюмы не повторяются, делегации
            готовятся месяцами, а Король и Королева карнавала возглавляют колонну. Вот летопись,
            которую удалось восстановить по репортажам, архивам и пабликам района — у годов со
            стрелкой есть отдельная страница с подробностями и фотографиями.
          </p>

          <div className="year-cards">
            {YEARS.map((y) => {
              const hasPage = withPage.has(y.year)
              const thumb = y.photos[0]
              const body = (
                <>
                  {thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img className="year-card__thumb" src={`/years/${thumb.src}.jpg`} alt={thumb.alt} loading="lazy" />
                  ) : null}
                  <div className="year-card__body">
                    <div className="year-card__head">
                      <span className="year-card__year">{y.year}</span>
                      {y.date ? <span className="year-card__date">{y.date}</span> : null}
                    </div>
                    <div className="year-card__theme">{y.theme}</div>
                    {y.note ? <div className="year-card__note">{y.note}</div> : null}
                    {y.weak ? <div className="year-card__note">по неподтверждённым данным</div> : null}
                    {hasPage ? <div className="year-card__more">Подробнее →</div> : null}
                  </div>
                </>
              )
              return hasPage ? (
                <Link className="year-card year-card--link" href={`/years/${y.year}`} key={y.year}>
                  {body}
                </Link>
              ) : (
                <div className="year-card" key={y.year}>
                  {body}
                </div>
              )
            })}
          </div>

          <div className="notice">
            Помните темы 2017–2021 годов, сохранились афиши или фотографии? Напишите оргкомитету или
            в паблики района — поможем собрать полную летопись ярмарки.
          </div>
        </section>
      </div>
    </main>
  )
}
