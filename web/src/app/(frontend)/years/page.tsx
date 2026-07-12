import type { Metadata } from 'next'

import { YEAR_THEMES } from '../../../lib/site'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Как это было — темы ярмарки по годам',
  description:
    'Ежегодные темы карнавального шествия Ярмарки Казанской: Год кино, «Писатели шутят…», «ЭкоДом», «Город мастеров» и тема 2026 года «Мы Вятские — люди хватские!».',
}

export default function YearsPage() {
  return (
    <main>
      <div className="wrap">
        <p className="kicker">Архив</p>
        <h1>Как это было</h1>
        <p className="lead">
          У карнавального шествия каждый год — своя тема. Костюмы не повторяются, делегации
          готовятся месяцами, а Король и Королева карнавала возглавляют колонну. Вот темы, которые
          удалось восстановить по репортажам и архивам.
        </p>

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

        <div className="notice">
          Помните темы 2017–2025 годов, сохранились афиши или фотографии? Напишите оргкомитету или
          в паблики района — поможем собрать полную летопись ярмарки.
        </div>
      </div>
    </main>
  )
}
