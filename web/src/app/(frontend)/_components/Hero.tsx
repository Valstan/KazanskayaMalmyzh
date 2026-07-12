import Link from 'next/link'
import React from 'react'

// Шапка страницы: фото-фон + название поверх (с затемняющим градиентом для
// читаемости). Фон — статический ассет из /public/decor. Ссылка-кредит ведёт на
// страницу источников фото (атрибуция CC — одним местом).
export function Hero({
  image,
  kicker,
  title,
  subtitle,
  children,
}: {
  image: string
  kicker?: string
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <section className="hero" style={{ backgroundImage: `url(/decor/${image}.jpg)` }}>
      <div className="hero__inner">
        {kicker ? <p className="kicker" style={{ color: 'var(--fair-gold-bright)' }}>{kicker}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="hero__subtitle">{subtitle}</p> : null}
        {children}
      </div>
      <Link href="/istochniki-foto" className="hero__credit" aria-label="Источник фотографии">
        фото · источники ↗
      </Link>
    </section>
  )
}

// Фото в тексте с подписью.
export function Figure({
  image,
  alt,
  caption,
  float,
}: {
  image: string
  alt: string
  caption?: string
  float?: boolean
}) {
  return (
    <figure className={float ? 'figure figure--float-right' : 'figure'}>
      {/* Статический ассет — обычный <img> (не next/image): без оптимизации-рантайма,
          уже сжат sharp при сборке набора. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/decor/${image}.jpg`} alt={alt} loading="lazy" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
