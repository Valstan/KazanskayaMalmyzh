import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { YEARS, getYearInfo, yearsWithPage } from '../../../../lib/years'
import { Hero } from '../../_components/Hero'

export const dynamicParams = false

export function generateStaticParams() {
  return yearsWithPage().map((year) => ({ year: String(year) }))
}

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await params
  const info = getYearInfo(Number(year))
  if (!info) return {}
  return {
    title: `Ярмарка Казанская — ${info.year}: ${info.theme}`,
    description: info.paragraphs[0]?.slice(0, 160),
  }
}

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  const info = getYearInfo(Number(year))
  if (!info || info.paragraphs.length === 0) notFound()

  const idx = YEARS.findIndex((y) => y.year === info.year)
  const withPage = new Set(yearsWithPage())
  const prev = YEARS.slice(idx + 1).find((y) => withPage.has(y.year)) ?? null
  const next = [...YEARS.slice(0, idx)].reverse().find((y) => withPage.has(y.year)) ?? null

  return (
    <main className="page page--inner page--years page--year">
      <Hero
        image={info.heroImage ?? 'oa-01'}
        kicker={info.date ? `${info.date} ${info.year}` : String(info.year)}
        title={info.theme}
        subtitle={info.note}
        decor="chronicle"
      />

      <div className="wrap page-shell">
        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          {info.weak ? <div className="notice">Сведения об этом годе — по неподтверждённым данным.</div> : null}

          {info.paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? 'lead' : undefined}>
              {p}
            </p>
          ))}

          {info.facts && info.facts.length > 0 ? (
            <ul>
              {info.facts.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : null}

          {info.photos.map((ph) => (
            <figure className="figure" key={ph.src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/years/${ph.src}.jpg`} alt={ph.alt} loading="lazy" />
              <figcaption>
                {ph.caption ? `${ph.caption} · ` : ''}
                {ph.credit.url ? (
                  <a href={ph.credit.url} rel="noopener noreferrer" target="_blank">
                    {ph.credit.label}
                  </a>
                ) : (
                  ph.credit.label
                )}
              </figcaption>
            </figure>
          ))}

          {info.sources.length > 0 ? (
            <>
              <h2>Источники</h2>
              <ul>
                {info.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} rel="noopener noreferrer" target="_blank">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <p className="year-nav">
            {prev ? <Link href={`/years/${prev.year}`}>← {prev.year}</Link> : <span />}
            <Link href="/years">Все годы</Link>
            {next ? <Link href={`/years/${next.year}`}>{next.year} →</Link> : <span />}
          </p>
        </section>
      </div>
    </main>
  )
}
