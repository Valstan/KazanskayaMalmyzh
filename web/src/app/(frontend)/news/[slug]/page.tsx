import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Hero } from '../../_components/Hero'
import { RichText } from '../../../../lib/RichText'
import { findPostBySlug, fmtDate, mediaMapOf, RUBRIC_LABEL } from '../../../../lib/posts'
import type { Media } from '../../../../payload-types'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const post = await findPostBySlug(decodeURIComponent(slug))
  if (!post) return { title: 'Новость не найдена' }
  const cover = post.cover && typeof post.cover === 'object' ? (post.cover as Media).url : null
  return {
    title: post.title,
    description: post.summary ?? undefined,
    openGraph: cover ? { images: [{ url: cover }] } : undefined,
  }
}

export default async function PostPage({ params }: Args) {
  const { slug } = await params
  const post = await findPostBySlug(decodeURIComponent(slug))
  if (!post) notFound()

  const date = post.date ?? post.publishedAt ?? null
  const cover = post.cover && typeof post.cover === 'object' ? (post.cover as Media) : null
  const gallery = (post.gallery ?? []).filter((m): m is Media => !!m && typeof m === 'object')
  const sourceUrl = post.source?.sourceUrl ?? null

  return (
    <main className="page page--inner page--news page--post">
      <Hero image="malmyzh-lavka" kicker="Новости" title={post.title} decor="chronicle">
        <p className="post__meta">
          {date ? <time dateTime={date}>{fmtDate.format(new Date(date))}</time> : null}
          {post.rubric && RUBRIC_LABEL[post.rubric] ? <span className="post-card__rubric">{RUBRIC_LABEL[post.rubric]}</span> : null}
        </p>
      </Hero>
      <div className="wrap page-shell">
        <div className="flourish" aria-hidden />
        <article className="section section--tight post">
          {cover?.url ? (
            <figure className="post__cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover.url} alt={cover.alt ?? ''} />
              {cover.caption ? <figcaption>{cover.caption}</figcaption> : null}
            </figure>
          ) : null}
          {post.summary ? <p className="lead">{post.summary}</p> : null}
          <div className="post__body">
            <RichText data={post.content} mediaMap={mediaMapOf(post)} />
          </div>
          {gallery.length > 1 ? (
            <div className="photo-grid post__gallery">
              {gallery.map((m) =>
                m.url ? (
                  <a key={m.id} className="photo-grid__item" href={m.url} target="_blank" rel="noopener">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.alt ?? ''} loading="lazy" />
                  </a>
                ) : null,
              )}
            </div>
          ) : null}
          <p className="muted post__source">
            {sourceUrl ? (
              <>
                Источник:{' '}
                <a href={sourceUrl} rel="nofollow noopener noreferrer" target="_blank">
                  публикация во ВКонтакте
                </a>
                .{' '}
              </>
            ) : null}
            <Link href="/news">← Все новости</Link>
          </p>
        </article>
      </div>
    </main>
  )
}
