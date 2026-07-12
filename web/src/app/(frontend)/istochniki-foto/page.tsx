import type { Metadata } from 'next'

import { IMAGE_CREDITS } from '../../../lib/imageCredits'
import { Hero } from '../_components/Hero'

// /istochniki-foto — атрибуция свободных фотографий (Wikimedia Commons) одной
// страницей. Полностью статична (данные — const в lib/imageCredits.ts). Для
// CC-лицензий сбор атрибуции в одном месте допустим («reasonable to the medium»).
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Источники фотографий',
  description: 'Авторы и лицензии фотографий, использованных на сайте Ярмарки Казанской.',
}

export default function CreditsPage() {
  return (
    <main>
      <Hero image="malmyzh-lavka" kicker="Атрибуция" title="Источники фотографий" />

      <div className="wrap">
        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          <p className="lead">
            Оформление сайта использует свободные фотографии с Викисклада (Wikimedia Commons).
            Ниже — авторы, лицензии и ссылки на исходные файлы. Уменьшенные и сжатые версии
            распространяются под теми же лицензиями, что и оригиналы.
          </p>

          <ul className="credits-list">
            {IMAGE_CREDITS.map((c) => (
              <li key={c.slug}>
                <span className="c-title">{c.title}</span>
                <span className="c-meta">
                  Автор: {c.author} ·{' '}
                  {c.licenseUrl ? (
                    <a href={c.licenseUrl} target="_blank" rel="noreferrer noopener">
                      {c.license}
                    </a>
                  ) : (
                    c.license
                  )}{' '}
                  ·{' '}
                  <a href={c.sourceUrl} target="_blank" rel="noreferrer noopener">
                    файл-источник ↗
                  </a>
                </span>
                <span className="c-meta">{c.usage}</span>
              </li>
            ))}
          </ul>

          <div className="notice">
            Фотографии самого праздника из пабликов Малмыжского района публикуются с указанием
            источника по мере сбора. Если вы автор снимка и хотите изменить подпись или убрать
            фото — напишите оргкомитету, мы оперативно поправим.
          </div>
        </section>
      </div>
    </main>
  )
}
