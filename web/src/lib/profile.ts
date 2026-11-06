import type { Payload } from 'payload'

import { FACT_SOURCE_SELF, isFactKey, validateFactValue, type FactKey } from './facts'

// ── Профиль жителя: чтение и запись фактов ───────────────────────────────────
//
// Факты живут здесь, в проекте (пилот #386, D-178). Правила записи — здесь же,
// потому что «кто и как спрашивает» — это решение проекта, а не коллекции:
// закрытый набор вопросов живёт в `lib/facts.ts`.

export type VisitorFactRow = {
  id: string | number
  esaSub: string
  factKey: string
  value: string
  source?: string | null
  verifiedAt?: string | null
  updatedAt?: string
}

export type FactInput = { key: string; value: unknown }

export type FactWriteResult =
  | { ok: true; key: FactKey; value: string }
  | { ok: false; error: string }

/**
 * Запись факта: серверная, единственная. Значение проверяется по реестру
 * вопросов, источник всегда `self`, `verifiedAt` всегда пуст.
 *
 * ⚠️ Почему при обновлении факта `verifiedAt` обнуляется: подтвердить факт
 * может ИСТОЧНИК, а не житель. Если бы при правке подтверждение сохранялось,
 * житель мог бы отредактировать значение и остаться «подтверждённым» — то
 * есть получить обещание от факта, который никто не проверял.
 */
export const upsertFact = async (
  payload: Payload,
  esaSub: string,
  input: FactInput,
): Promise<FactWriteResult> => {
  if (!isFactKey(input.key)) return { ok: false, error: 'неизвестный вопрос' }
  const checked = validateFactValue(input.key, input.value)
  if (!checked.ok) return { ok: false, error: checked.error }

  const existing = await payload.find({
    collection: 'visitor-facts',
    where: {
      and: [{ esaSub: { equals: esaSub } }, { factKey: { equals: input.key } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  const data = {
    value: checked.value,
    source: FACT_SOURCE_SELF,
    verifiedAt: null,
  }

  const row = existing.docs[0] as VisitorFactRow | undefined
  if (row) {
    await payload.update({
      collection: 'visitor-facts',
      id: row.id,
      data,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'visitor-facts',
      data: {
        esaSub,
        factKey: input.key,
        ...data,
      },
      overrideAccess: true,
    })
  }

  return { ok: true, key: input.key, value: checked.value }
}

/** Все факты жителя — по `sub`, без чужих. */
export const loadFacts = async (payload: Payload, esaSub: string): Promise<VisitorFactRow[]> => {
  const found = await payload.find({
    collection: 'visitor-facts',
    where: { esaSub: { equals: esaSub } },
    limit: 200,
    sort: 'factKey',
    overrideAccess: true,
  })
  return found.docs as VisitorFactRow[]
}

/**
 * Удаление профиля: факты и запись посетителя. Порядок именно такой — сначала
 * факты, потом посетитель: если падение между шагами, останется висящая
 * запись посетителя без фактов (её видно только админу), а не факты без
 * посетителя (их уже никто не найдёт).
 */
export const deleteProfile = async (payload: Payload, esaSub: string): Promise<void> => {
  const facts = await loadFacts(payload, esaSub)
  for (const fact of facts) {
    await payload.delete({
      collection: 'visitor-facts',
      id: fact.id,
      overrideAccess: true,
    })
  }

  const visitors = await payload.find({
    collection: 'visitors',
    where: { esaSub: { equals: esaSub } },
    limit: 1,
    overrideAccess: true,
  })
  const visitor = visitors.docs[0] as { id: string | number } | undefined
  if (visitor) {
    await payload.delete({
      collection: 'visitors',
      id: visitor.id,
      overrideAccess: true,
    })
  }
}
