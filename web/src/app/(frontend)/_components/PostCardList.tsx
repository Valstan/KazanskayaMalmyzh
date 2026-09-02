import Link from 'next/link'
import React from 'react'

import { fmtDate, RUBRIC_LABEL, type PostCard } from '../../../lib/posts'

// Карточки новостей: лента /news и блок «Новости» на главной.
export function PostCardList({ posts, heading = 'h2' }: { posts: PostCard[]; heading?: 'h2' | 'h3' }) {
  const H = heading
  return (
    <div className="post-list">
      {posts.map((p) => (
        <article className="post-card" key={p.id}>
          {p.coverUrl ? (
            <Link href={`/news/${encodeURIComponent(p.slug)}`} className="post-card__cover" aria-hidden tabIndex={-1}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.coverUrl} alt="" loading="lazy" />
            </Link>
          ) : null}
          <div className="post-card__body">
            <p className="post-card__meta">
              {p.date ? <time dateTime={p.date}>{fmtDate.format(new Date(p.date))}</time> : null}
              {p.rubric && RUBRIC_LABEL[p.rubric] ? <span className="post-card__rubric">{RUBRIC_LABEL[p.rubric]}</span> : null}
            </p>
            <H className="post-card__title">
              <Link href={`/news/${encodeURIComponent(p.slug)}`}>{p.title}</Link>
            </H>
            {p.summary ? <p className="post-card__summary">{p.summary}</p> : null}
          </div>
        </article>
      ))}
    </div>
  )
}
