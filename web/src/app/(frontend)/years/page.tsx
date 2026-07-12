import type { Metadata } from 'next'

import { YEAR_THEMES } from '../../../lib/site'
import { Hero } from '../_components/Hero'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Как это было — темы ярмарки по годам',
  description:
    'Ежегодные темы карнавального шествия Ярмарки Казанской: Год кино, «Писатели шутят…», «ЭкоДом», «Город мастеров» и тема 2026 года «Мы Вятские — люди хватские!».',
}

export default function YearsPage() {
  return (
    <main>
      <Hero image="oa-01" kicker="Архив" title="Как это было" subtitle="Темы карнавала по годам" />

      <div className="wrap">
        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          <p className="lead">
            У карнавального шествия каждый год — своя тема. Костюмы не повторяются, делегации
            готовятся месяцами, а Король и Королева карнавала возглавляют колонну. Вот темы, которые
            удалось восстановить по репортажам и архивам.
          </p>

          <div className="years-wrap">
            <table className="years">
              <thead>
                <tr>
                  <th>Год</th>
                  <th>Тема</th>
                  <th>Подробности</th>
                </tr>
              </thead>
              <tbody>
                {YEAR_THEMES.map((y) => (
                  <tr key={y.year}>
                    <td className="y">
                      {y.year}
                      {y.date ? <div className="muted">{y.date}</div> : null}
                    </td>
                    <td>
                      <strong>{y.theme}</strong>
                      {y.weak ? <div className="muted">по неподтверждённым данным</div> : null}
                    </td>
                    <td>{y.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="notice">
            Помните темы 2017–2025 годов, сохранились афиши или фотографии? Напишите оргкомитету или
            в паблики района — поможем собрать полную летопись ярмарки.
          </div>
        </section>
      </div>
    </main>
  )
}
