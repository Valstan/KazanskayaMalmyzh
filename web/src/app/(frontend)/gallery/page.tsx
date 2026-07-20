import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Hero } from '../_components/Hero'
import { GALLERY_2024, GALLERY_ATTRIBUTION } from '../../../lib/galleryPhotos'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Галерея',
  description: 'Фотографии Ярмарки Казанской в Малмыже: карнавальное шествие, сцена, награждения — праздник 2024 года.',
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
          <h2>Ярмарка Казанская — 2024</h2>
          <p>
            Костюмированное шествие, открытие на главной сцене, награждения и гости праздника — несколько кадров с
            ярмарки 2024 года.
          </p>
          <div className="photo-grid">
            {GALLERY_2024.map((p) => (
              <figure key={p.slug} className="photo-grid__item photo-grid__item--static">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/decor/${p.slug}.jpg`} alt={p.caption} loading="lazy" />
                <figcaption className="photo-grid__cap">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
          <p className="muted">{GALLERY_ATTRIBUTION}.</p>
        </section>

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
