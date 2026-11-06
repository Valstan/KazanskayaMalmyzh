// ── Факты о жителе ────────────────────────────────────────────────────────────
//
// Пилота единого профиля жителя (#386, D-178): факты живут здесь, в проекте —
// в Казанской. ПДн в vault не кладутся, KARMAN выдаёт личность и права.
//
// ТРИ ПРАВИЛА, которые здесь и зафиксированы (план `docs/plans/profident-zhitelya.md`):
//
// 1. **Факт без `source` не факт.** У каждого факта есть источник: `self`
//    (житель назвал сам), `doc:<ref>` (документ), `import:<ref>` (ведомство).
//    Запись без источника не используется и не показывается.
// 2. **Самопровозглашённый факт не даёт обещаний.** `source = self` ⇒
//    `verifiedAt = null` ⇒ в ответах он помечен «по вашим данным». Права из
//    фактов не выводятся — прав в пилоте нет вообще (это #387).
// 3. **Спросить один раз.** Набор вопросов закрытый и известный заранее:
//    посетитель заполняет недостающее один раз, и при следующем заходе мы
//    недостающее НЕ спрашиваем снова — иначе «один раз» превращается в «каждый
//    визит», и человек перестаёт отвечать.
//
// Закрытый набор — не «на всякий случай», а граница: ассистент Сарафана
// спрашивает сервис-владельца по конкретному вопросу, и он должен знать,
// какие вопросы вообще бывают. Новый факт = новая строка в реестре + миграция
// словаря у ассистента.

export const FACT_SOURCE_SELF = 'self'

export type FactKey = 'benefit_category' | 'children_count'

export type FactType = 'choice' | 'number'

export type FactOption = { value: string; label: string }

export type FactSpec = {
  key: FactKey
  /** Вопрос в формулировке «как его задают жителю». */
  label: string
  type: FactType
  options?: FactOption[]
  min?: number
  max?: number
  /** Подсказка под полем: зачем это спрашивают. */
  hint: string
}

export const FACT_SPECS: Record<FactKey, FactSpec> = {
  benefit_category: {
    key: 'benefit_category',
    label: 'Есть ли у вас льготная категория?',
    type: 'choice',
    options: [
      { value: 'none', label: 'Нет' },
      { value: 'veteran', label: 'Ветеран' },
      { value: 'disability', label: 'Инвалидность' },
      { value: 'large_family', label: 'Многодетная семья' },
      { value: 'low_income', label: 'Малоимущий / нуждающийся' },
    ],
    hint: 'Отвечаем по-разному, поэтому и спрашиваем. Это пока ваше заявление, не подтверждение.',
  },
  children_count: {
    key: 'children_count',
    label: 'Сколько у вас детей до 18 лет?',
    type: 'number',
    min: 0,
    max: 20,
    hint: 'Чтобы предложить то, что семье, а не всем подряд.',
  },
}

export const FACT_KEYS: FactKey[] = Object.keys(FACT_SPECS) as FactKey[]

export const isFactKey = (raw: unknown): raw is FactKey =>
  typeof raw === 'string' && Object.prototype.hasOwnProperty.call(FACT_SPECS, raw)

export type FactValueCheck = { ok: true; value: string } | { ok: false; error: string }

/**
 * Проверка значения по типу факта. Закрытый список значений для choice —
 * не «на ваше усмотрение»: ассистент должен уметь отвечать по факту, а
 * свободный текст нечем превратить в ответ.
 */
export const validateFactValue = (key: FactKey, value: unknown): FactValueCheck => {
  const spec = FACT_SPECS[key]
  if (!spec) return { ok: false, error: 'неизвестный факт' }

  if (spec.type === 'choice') {
    if (typeof value !== 'string' || !value) {
      return { ok: false, error: 'выберите вариант из списка' }
    }
    const allowed = spec.options ?? []
    if (!allowed.some((o) => o.value === value)) {
      return { ok: false, error: 'значение не из списка' }
    }
    return { ok: true, value }
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return { ok: false, error: 'ожидалось число' }
  }
  const raw = String(value).trim()
  if (!/^\d+$/.test(raw)) return { ok: false, error: 'ожидалось целое число' }
  const n = Number(raw)
  if (spec.min !== undefined && n < spec.min) {
    return { ok: false, error: `минимум ${spec.min}` }
  }
  if (spec.max !== undefined && n > spec.max) {
    return { ok: false, error: `максимум ${spec.max}` }
  }
  return { ok: true, value: raw }
}

/** Человекочитаемое значение факта (для показа в профиле и в ответе ассистента). */
export const factValueLabel = (key: FactKey, value: string): string => {
  const spec = FACT_SPECS[key]
  if (!spec) return value
  if (spec.type === 'choice') {
    return spec.options?.find((o) => o.value === value)?.label ?? value
  }
  return value
}

/**
 * Помечается ли факт как подтверждённый. Подтвердить может только источник
 * (документ, ведомство) — то есть НЕ сам житель. Пока источник не подтвердил,
 * факт остаётся «по вашим данным».
 */
export const factIsVerified = (fact: { source?: string | null; verifiedAt?: string | null }): boolean =>
  Boolean(fact.verifiedAt) && Boolean(fact.source) && fact.source !== FACT_SOURCE_SELF

/** Подпись под фактом в интерфейсе: «по вашим данным» / «подтверждено». */
export const factProvenanceLabel = (fact: {
  source?: string | null
  verifiedAt?: string | null
}): string => {
  if (factIsVerified(fact)) return 'подтверждено'
  if (fact.source === FACT_SOURCE_SELF) return 'по вашим данным'
  return 'источник не указан'
}

/**
 * Какие вопросы ещё не заданы. Ровно этот список показывается в форме при
 * первом заходе; всё, что уже есть, — не переспрашивается (правило 3).
 */
export const missingFactKeys = (existing: { factKey: string }[]): FactKey[] => {
  const have = new Set(existing.map((f) => f.factKey))
  return FACT_KEYS.filter((k) => !have.has(k))
}
