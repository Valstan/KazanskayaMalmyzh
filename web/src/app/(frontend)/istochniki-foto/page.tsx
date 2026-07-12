import type { Metadata } from 'next'

import { IMAGE_CREDITS } from '../../../lib/imageCredits'
import { VK_CARNIVAL, VK_ALBUM, VK_GROUP, VK_GROUP_NAME } from '../../../lib/vkCredits'
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

          <h2>Фотографии праздника из ВКонтакте</h2>
          <p>
            Событийные снимки Ярмарки Казанской взяты из паблика{' '}
            <a href={VK_GROUP} target="_blank" rel="noreferrer noopener">{VK_GROUP_NAME}</a> — альбом{' '}
            <a href={VK_ALBUM} target="_blank" rel="noreferrer noopener">«Ярмарка Казанская 2024 Карнавал»</a>.
            Каждая фотография ведёт на свой пост-источник.
          </p>
          <ul className="credits-list">
            {VK_CARNIVAL.map((c) => (
              <li key={c.slug}>
                <span className="c-title">{c.caption}</span>
                <span className="c-meta">
                  {VK_GROUP_NAME} ·{' '}
                  <a href={c.source} target="_blank" rel="noreferrer noopener">
                    фото в ВКонтакте ↗
                  </a>
                </span>
              </li>
            ))}
          </ul>

          <div className="notice">
            Если вы автор снимка и хотите изменить подпись или убрать фото — напишите оргкомитету,
            мы оперативно поправим.
          </div>
        </section>
      </div>
    </main>
  )
}
