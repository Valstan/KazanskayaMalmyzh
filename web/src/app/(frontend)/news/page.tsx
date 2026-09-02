import type { Metadata } from 'next'
import Link from 'next/link'

import { Hero } from '../_components/Hero'
import { PostCardList } from '../_components/PostCardList'
import { findPublishedPosts } from '../../../lib/posts'

// Лента читает БД — force-dynamic, как /program и /map (G203).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Новости',
  description:
    'Новости Ярмарки Казанской и Малмыжского района: подготовка праздника, мастера, культура — из официальных пабликов с указанием источника.',
}

export default async function NewsPage() {
  const posts = await findPublishedPosts()
  return (
    <main className="page page--inner page--news">
      <Hero image="malmyzh-lavka" kicker="Что нового" title="Новости" subtitle="Праздник и район — из первых рук" decor="chronicle" />
      <div className="wrap page-shell">
        <div className="flourish" aria-hidden />
        <section className="section section--tight">
          {posts.length > 0 ? (
            <PostCardList posts={posts} />
          ) : (
            <p className="lead">
              Новостей пока нет. Пока их нет — загляните в <Link href="/years">летопись прошлых ярмарок</Link>.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
