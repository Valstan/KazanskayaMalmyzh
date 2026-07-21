'use client'

import React, { useEffect, useMemo, useState } from 'react'

// Live-режим программы дня X (M3-минимум, адаптация ScheduleList Сабантуя):
// баннер «Сейчас идёт / Далее» + статусы live/next/past у событий. Статусы
// считаются на клиенте после монтирования (тик раз в минуту) — сервер отдаёт
// нейтральную разметку, hydration-mismatch нет, ISR-staleness не влияет.

export type ProgramEvent = {
  id: number | string
  title: string
  summary?: string | null
  startDate: string
  endDate?: string | null
  location?: string | null
  venue?: string | null
}

type Status = 'live' | 'next' | 'upcoming' | 'past'

type EventVisual = { src: string; alt: string }

function visualForEvent(event: ProgramEvent): EventVisual {
  const text = [event.title, event.summary, event.venue, event.location].filter(Boolean).join(' ').toLocaleLowerCase('ru')

  if (text.includes('фейерверк') || text.includes('дискотек') || text.includes('неонов')) {
    return { src: '/decor/fireworks.jpg', alt: 'Фейерверк над вечерним праздником' }
  }
  if (text.includes('танц')) {
    return { src: '/decor/hero-fair.jpg', alt: 'Народный танец на празднике' }
  }
  if (text.includes('куштымаш') || text.includes('этно') || text.includes('националь')) {
    return { src: '/decor/mari-ensemble.jpg', alt: 'Фольклорный ансамбль в национальных костюмах' }
  }
  if (text.includes('мастер') || text.includes('ремес')) {
    return { src: '/decor/guides/crafts.webp', alt: 'Скоморох приглашает в Город мастеров' }
  }
  if (text.includes('шеств') || text.includes('карнавал')) {
    return { src: '/decor/oa-03.jpg', alt: 'Костюмированное шествие Ярмарки Казанской' }
  }
  if (text.includes('открыт') || text.includes('стадион') || text.includes('концерт')) {
    return { src: '/decor/oa-05.jpg', alt: 'Открытие Ярмарки Казанской на главной сцене' }
  }
  return { src: '/decor/guides/program.webp', alt: 'Скоморох показывает программу праздника' }
}

const fmtTime = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Moscow',
})

function parse(d?: string | null): number | null {
  if (!d) return null
  const t = new Date(d).getTime()
  return Number.isNaN(t) ? null : t
}

// Событие без endDate считаем идущим DEFAULT_DURATION_MS после старта,
// чтобы «Сейчас идёт» не пустовал между точечными пунктами афиши.
const DEFAULT_DURATION_MS = 60 * 60_000

export function ProgramLive({ events }: { events: ProgramEvent[] }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const statusById = useMemo(() => {
    const map = new Map<number | string, Status>()
    if (now === null) return map
    let nextId: number | string | null = null
    let nextStart = Infinity
    for (const e of events) {
      const start = parse(e.startDate)
      if (start === null) continue
      const end = parse(e.endDate) ?? start + DEFAULT_DURATION_MS
      if (start <= now && now <= end) {
        map.set(e.id, 'live')
      } else if (start > now) {
        map.set(e.id, 'upcoming')
        if (start < nextStart) {
          nextStart = start
          nextId = e.id
        }
      } else {
        map.set(e.id, 'past')
      }
    }
    if (nextId !== null) map.set(nextId, 'next')
    return map
  }, [events, now])

  // Live-режим включается только в окрестности дня X (±36 ч) — иначе бейджи
  // «далее» и баннер висели бы неделями до праздника.
  const liveWindow =
    now !== null &&
    events.some((e) => {
      const start = parse(e.startDate)
      return start !== null && Math.abs(start - now) < 36 * 60 * 60_000
    })
  const liveEvents = liveWindow ? events.filter((e) => statusById.get(e.id) === 'live') : []
  const nextEvent = (liveWindow && events.find((e) => statusById.get(e.id) === 'next')) || null

  return (
    <>
      {(liveEvents.length > 0 || nextEvent) && (
        <div className="now-banner" role="status" aria-live="polite">
          {liveEvents.length > 0 ? (
            <>
              <span className="now-banner__label">● Сейчас идёт</span>
              <span className="now-banner__body">{liveEvents.map((e) => e.title).join(' · ')}</span>
            </>
          ) : (
            <>
              <span className="now-banner__label now-banner__label--next">Далее</span>
              <span className="now-banner__body">
                {nextEvent!.title} — {fmtTime.format(new Date(nextEvent!.startDate))}
                {nextEvent!.venue ? ` · ${nextEvent!.venue}` : ''}
              </span>
            </>
          )}
        </div>
      )}

      <section className="section section--tight">
        {events.map((e) => {
          const status = liveWindow ? statusById.get(e.id) : undefined
          const visual = visualForEvent(e)
          return (
            <div
              className={`event${status === 'live' ? ' is-live' : ''}${status === 'next' ? ' is-next' : ''}${status === 'past' ? ' is-past' : ''}`}
              key={e.id}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="event__image" src={visual.src} alt={visual.alt} loading="lazy" />
              <div className="event__content">
                <div className="when">
                  {fmtTime.format(new Date(e.startDate))}
                  {e.endDate ? `–${fmtTime.format(new Date(e.endDate))}` : ''} — {e.title}
                  {status === 'live' && <span className="status-badge status-badge--live">идёт сейчас</span>}
                  {status === 'next' && <span className="status-badge status-badge--next">далее</span>}
                </div>
                {e.venue || e.location ? (
                  <div className="where">{[...new Set([e.venue, e.location].filter(Boolean))].join(' · ')}</div>
                ) : null}
                {e.summary ? <p>{e.summary}</p> : null}
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}
