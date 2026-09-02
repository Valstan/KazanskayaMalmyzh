import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Hero } from '../_components/Hero'
import { galleryStories } from '../../../lib/galleryPhotos'

// Альбомы приходят из БД — по той же причине, что на /program и /map (G203).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Галерея',
  description:
    'Фотографии Ярмарки Казанской в Малмыже историями: карнавальное шествие, сцена и открытие, Город мастеров, награждение — кадры разных лет.',
}

const uniqueCredits = (photos: { credit: { label: string; url: string | null } }[]) => {
  const map = new Map<string, string | null>()
  for (const p of photos) if (!map.has(p.credit.label)) map.set(p.credit.label, p.credit.url)
  return [...map.entries()]
}

export default async function GalleryPage() {
  let albums: {
    id: number | string
    title: string
    description?: string | null
    date?: string | null
  }[] = []
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'gallery',
      where: { _status: { equals: 'published' } },
      sort: '-date',
      limit: 50,
    })
    albums = res.docs
  } catch {
    // пустая БД (CI)
  }

  const stories = galleryStories()

  return (
    <main className="page page--inner page--gallery">
      <Hero
        image="carousel"
        kicker="Фото и видео"
        title="Галерея"
        subtitle="Праздник в лицах и красках"
        decor="gallery"
      />

      <div className="wrap page-shell">
        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          <p className="lead">
            Не по годам, а по событиям: шествие, сцена, мастера, награждение. Кадры из фотоархива оргкомитета и
            публикаций пабликов собраны в истории — год каждого снимка подписан.
          </p>
          <nav className="story-nav" aria-label="Истории галереи">
            {stories.map((s) => (
              <a key={s.slug} href={`#${s.slug}`}>
                {s.title} <span className="story-nav__count">{s.photos.length}</span>
              </a>
            ))}
          </nav>
        </section>

        {stories.map((s) => (
          <section className="section section--tight story" id={s.slug} key={s.slug}>
            <h2 className="story__title">
              {s.title} <span className="story__count">{s.photos.length} фото</span>
            </h2>
            <p className="story__lead">{s.lead}</p>
            <div className="photo-grid story__grid">
              {s.photos.map((p, i) => (
                <figure
                  key={p.src}
                  className={`photo-grid__item photo-grid__item--static${i === 0 ? ' photo-grid__item--lead' : ''}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt} loading={i === 0 ? 'eager' : 'lazy'} />
                  <figcaption className="photo-grid__cap">
                    <span className="photo-grid__year">{p.year}</span> {p.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="muted story__credits">
              Фото:{' '}
              {uniqueCredits(s.photos).map(([label, url], i) => (
                <span key={label}>
                  {i > 0 ? ' · ' : ''}
                  {url ? (
                    <a href={url} rel="nofollow noopener noreferrer" target="_blank">
                      {label}
                    </a>
                  ) : (
                    label
                  )}
                </span>
              ))}
              . Подробнее — <Link href="/istochniki-foto">источники фотографий</Link>.
            </p>
          </section>
        ))}

        {albums.length > 0 ? (
          <section className="section section--tight">
            <h2>Альбомы</h2>
            <div className="cards">
              {albums.map((a) => (
                <div className="card" key={a.id}>
                  <h3>{a.title}</h3>
                  {a.description ? <p>{a.description}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="section section--tight">
            <div className="notice">
              У вас есть фотографии с ярмарок прошлых лет? Мы собираем архив — напишите оргкомитету (телефоны внизу
              страницы).
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
