import type { Metadata } from 'next'

import { IMAGE_CREDITS } from '../../../lib/imageCredits'
import { GALLERY_ATTRIBUTION } from '../../../lib/galleryPhotos'
import { Hero } from '../_components/Hero'
import { YEARS } from '../../../lib/years'

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
    <main className="page page--inner page--sources">
      <Hero image="malmyzh-lavka" kicker="Атрибуция" title="Источники фотографий" decor="merchant" />

      <div className="wrap page-shell">
        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          <p className="lead">
            Оформление сайта использует свободные фотографии с Викисклада (Wikimedia Commons). Ниже — авторы, лицензии и
            ссылки на исходные файлы. Уменьшенные и сжатые версии распространяются под теми же лицензиями, что и
            оригиналы.
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

          <h2>Фотографии праздника</h2>
          <p>
            Снимки самого праздника (галерея, часть шапок страниц) — из фотоархива оргкомитета Ярмарки Казанской:{' '}
            <strong>{GALLERY_ATTRIBUTION}</strong>. Логотип праздника предоставлен организаторами.
          </p>

          <h2>Фотолетопись по годам</h2>
          <p>Исторические снимки на страницах летописи взяты из следующих публикаций:</p>
          <ul className="credits-list">
            {YEARS.filter((year) => year.photos.some((photo) => photo.credit.url)).map((year) => {
              const credits = [
                ...new Map(
                  year.photos
                    .filter((photo) => photo.credit.url)
                    .map((photo) => [photo.credit.url, photo.credit] as const),
                ).values(),
              ]
              return (
                <li key={year.year}>
                  <span className="c-title">{year.year} год</span>
                  {credits.map((credit) => (
                    <span className="c-meta" key={credit.url}>
                      <a href={credit.url!} target="_blank" rel="noreferrer noopener">
                        {credit.label} ↗
                      </a>
                    </span>
                  ))}
                </li>
              )
            })}
          </ul>

          <div className="notice">
            Если вы автор снимка и хотите изменить подпись или убрать фото — напишите оргкомитету, мы оперативно
            поправим.
          </div>
        </section>
      </div>
    </main>
  )
}
