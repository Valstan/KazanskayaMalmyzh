import Link from 'next/link'
import React from 'react'

// Шапки страниц (лубок-редизайн, спека design/inbox/19июля2026).
// HomeHero — первый экран главной: «сначала информация, потом эмоция» —
// на десктопе фото под светлым градиентом слева, на мобайле фото-полоса
// сверху и светлая панель под ней. HeroPage — компактная фото-плашка
// внутренних страниц (замечание ChatGPT: не повторять огромный hero везде).

export function HomeHero({ image, children }: { image: string; children?: React.ReactNode }) {
  const bg = `url(/decor/${image}.jpg)`
  return (
    <section className="hero hero--home" style={{ backgroundImage: bg }}>
      {/* Мобайл: та же фотография отдельной полосой над светлой панелью */}
      <div className="hero__photo-mobile" style={{ backgroundImage: bg }} aria-hidden />
      <div className="hero__inner">
        <div className="hero__content">{children}</div>
      </div>
      <Link href="/istochniki-foto" className="hero__credit" aria-label="Источник фотографии">
        фото · источники ↗
      </Link>
    </section>
  )
}

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
    <section className="hero hero--page" style={{ backgroundImage: `url(/decor/${image}.jpg)` }}>
      <div className="hero__inner">
        {kicker ? <p className="kicker">{kicker}</p> : null}
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
