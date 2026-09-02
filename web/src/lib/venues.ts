// Площадки праздника на /map: порядок событий внутри площадки и подбор
// пиктограммы по названию площадки (спека редизайна design/inbox/19июля2026,
// §3 «Пиктограммы площадок» — восемь знаков).

export type VenueItem = {
  title: string
  /** Начало, ms since epoch */
  start: number
  /** Окончание, ms since epoch; null — точечное событие без длительности */
  end: number | null
}

// Внутри площадки события с одинаковым startDate шли в произвольном порядке
// (в парке «09:00–15:00 Этнопарк» стоял перед «09:00 Город мастеров»).
// Правило: раньше начало → раньше; при равном начале точечное событие
// (открытие, старт) идёт перед длящимся, короткое — перед долгим; остаток —
// по названию, чтобы порядок был устойчив между рендерами.
export function compareVenueItems(a: VenueItem, b: VenueItem): number {
  if (a.start !== b.start) return a.start - b.start
  if ((a.end === null) !== (b.end === null)) return a.end === null ? -1 : 1
  if (a.end !== null && b.end !== null && a.end !== b.end) return a.end - b.end
  return a.title.localeCompare(b.title, 'ru')
}

export type VenueIconKey =
  | 'park'
  | 'streets'
  | 'stadium'
  | 'pavilion'
  | 'stage'
  | 'trade'
  | 'ethno'
  | 'culture'

// Подбор знака по названию площадки из афиши. Порядок правил важен: «площадка
// в парке» — беседка, а не парк; «сцена в парке» — сцена. Ничего не подошло →
// null, площадка рендерится без пиктограммы.
const RULES: { key: VenueIconKey; test: RegExp }[] = [
  { key: 'stage', test: /сцен|эстрад/i },
  { key: 'culture', test: /рцкд|дом[ае]? культуры|центр культуры|дк\b/i },
  { key: 'stadium', test: /стадион/i },
  { key: 'ethno', test: /этно|подворь/i },
  { key: 'trade', test: /торгов|ряд|ярмарочн|лавк/i },
  { key: 'pavilion', test: /площадк.*парк|беседк|ротонд/i },
  { key: 'park', test: /парк|сквер/i },
  { key: 'streets', test: /улиц|центр города|площадь/i },
]

export function venueIconFor(name: string): VenueIconKey | null {
  for (const rule of RULES) if (rule.test.test(name)) return rule.key
  return null
}
