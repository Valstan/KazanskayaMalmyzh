import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Hero } from '../_components/Hero'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Галерея',
  description: 'Фотографии и видео Ярмарки Казанской в Малмыже по годам.',
}

export default async function GalleryPage() {
  let albums: { id: number | string; title: string; description?: string | null; date?: string | null }[] = []
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
    <main>
      <Hero image="carousel" kicker="Фото и видео" title="Галерея" subtitle="Праздник в лицах и красках" />

      <div className="wrap">
        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          {albums.length > 0 ? (
            <div className="cards">
              {albums.map((a) => (
                <div className="card" key={a.id}>
                  <h3>{a.title}</h3>
                  {a.description ? <p>{a.description}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="lead">
                Альбомы прошлых лет и фотографии праздника 2026 года появятся здесь.
              </p>
              <div className="notice">
                У вас есть фотографии с ярмарок прошлых лет? Мы собираем архив — напишите оргкомитету
                (телефоны внизу страницы).
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
