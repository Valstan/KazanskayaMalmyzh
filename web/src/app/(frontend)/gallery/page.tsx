import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Hero } from '../_components/Hero'
import { VK_CARNIVAL, VK_ALBUM, VK_GROUP, VK_GROUP_NAME } from '../../../lib/vkCredits'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Галерея',
  description: 'Фотографии Ярмарки Казанской в Малмыже: карнавальное шествие 2024 года и не только.',
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
          <h2>Карнавал — Ярмарка Казанская 2024</h2>
          <p>
            Костюмированное шествие — визитная карточка праздника. Несколько кадров с карнавала
            2024 года из паблика Центра культуры и досуга Малмыжа.
          </p>
          <div className="photo-grid">
            {VK_CARNIVAL.map((p) => (
              <a key={p.slug} className="photo-grid__item" href={p.source} target="_blank" rel="noreferrer noopener" title={`${p.caption} — источник в ВКонтакте`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/decor/${p.slug}.jpg`} alt={p.caption} loading="lazy" />
                <span className="photo-grid__cap">{p.caption}</span>
              </a>
            ))}
          </div>
          <p className="muted">
            Фотографии: <a href={VK_GROUP} target="_blank" rel="noreferrer noopener">{VK_GROUP_NAME}</a>,
            альбом <a href={VK_ALBUM} target="_blank" rel="noreferrer noopener">«Ярмарка Казанская 2024 Карнавал»</a>.
            Если вы автор снимка и хотите изменить подпись или убрать фото — напишите оргкомитету.
          </p>
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
              У вас есть фотографии с ярмарок прошлых лет? Мы собираем архив — напишите оргкомитету
              (телефоны внизу страницы).
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
