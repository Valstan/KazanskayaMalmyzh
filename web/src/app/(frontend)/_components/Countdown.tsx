'use client'

import React, { useEffect, useState } from 'react'

// Обратный отсчёт до открытия праздника (лубок-редизайн, спека §2 «Первый экран»):
// четыре сегмента дни/часы/минуты/секунды. Считается на клиенте после монтирования
// (сервер отдаёт пустой каркас — hydration-mismatch нет). После старта — плашка
// «Праздник идёт!»; спустя сутки после старта блок исчезает совсем.

const SEGMENTS = [
  ['дней', 'дня', 'день'],
  ['часов', 'часа', 'час'],
  ['минут', 'минуты', 'минута'],
  ['секунд', 'секунды', 'секунда'],
] as const

function plural(n: number, [many, few, one]: readonly [string, string, string]): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

export function Countdown({ startIso }: { startIso: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (now === null) return <div className="countdown" aria-hidden />

  const start = new Date(startIso).getTime()
  const diff = start - now

  if (diff <= 0) {
    // Сутки праздника — «идёт», дальше блок не нужен
    if (now - start < 24 * 60 * 60_000) {
      return (
        <p className="countdown--started" role="status">
          🎉 Праздник идёт прямо сейчас!
        </p>
      )
    }
    return null
  }

  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor(diff / 3_600_000) % 24
  const minutes = Math.floor(diff / 60_000) % 60
  const seconds = Math.floor(diff / 1000) % 60
  const values = [days, hours, minutes, seconds]

  return (
    <div className="countdown" role="timer" aria-label={`До начала праздника ${days} ${plural(days, SEGMENTS[0])}`}>
      {values.map((v, i) => (
        <div className="countdown__seg" key={i}>
          <span className="countdown__num">{String(v).padStart(2, '0')}</span>
          <span className="countdown__label">{plural(v, SEGMENTS[i])}</span>
        </div>
      ))}
    </div>
  )
}
