import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../payload.config'

import { FACT_SOURCE_SELF, missingFactKeys } from './facts'
import { deleteProfile, loadFacts, upsertFact } from './profile'

// Интеграционная проверка сбора фактов (пилот #386, шаг 2).
//
// Пока нет DATABASE_URL — набор пропускается: в CI сервис Postgres есть, а на
// машине разработчика тест без базы запускаться не должен (обычные `pnpm test`
// идут без базы и проверяют чистую логику).
//
// ЧТО ПРОВЕРЯЕМ (всё, что нельзя увидеть в юнит-тестах):
//   • запись факта реально создаёт строку в БД и повторный запись того же
//     ключа **обновляет**, а не плодит дубли (иначе «спросили один раз»
//     превратится в «спросили и записали дважды»);
//   • `source` всегда `self`, `verifiedAt` всегда пуст — житель не может
//     сам назначить своему факту подтверждение;
//   • значение проверяется по реестру вопросов (в БД не попадает мусор);
//   • удаление профиля убирает **и факты, и запись посетителя**;
//   • вопрос, на который уже есть ответ, повторно не задаётся.
const DB = process.env.DATABASE_URL

describe.skipIf(!DB)('сбор фактов о жителе — против настоящей БД', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>
  const SUB = 'test-sub-facts-1'

  beforeAll(async () => {
    payload = await getPayload({ config })
    // Чистая подложка: коллекция новая, но вдруг осталась от прошлого прогона.
    await deleteProfile(payload, SUB)
  }, 120_000)

  afterAll(async () => {
    await deleteProfile(payload, SUB)
    await payload.destroy?.()
  }, 60_000)

  it('записывает факт и создаёт строку', async () => {
    const res = await upsertFact(payload, SUB, { key: 'benefit_category', value: 'veteran' })
    expect(res.ok).toBe(true)

    const facts = await loadFacts(payload, SUB)
    expect(facts).toHaveLength(1)
    expect(facts[0]!.factKey).toBe('benefit_category')
    expect(facts[0]!.value).toBe('veteran')
    expect(facts[0]!.source).toBe(FACT_SOURCE_SELF)
    expect(facts[0]!.verifiedAt ?? null).toBeNull()
  }, 30_000)

  it('повторный ответ того же вопроса обновляет, а не добавляет', async () => {
    await upsertFact(payload, SUB, { key: 'benefit_category', value: 'none' })
    const facts = await loadFacts(payload, SUB)
    expect(facts).toHaveLength(1)
    expect(facts[0]!.value).toBe('none')
  }, 30_000)

  it('мусор в значении не попадает в БД', async () => {
    const res = await upsertFact(payload, SUB, { key: 'children_count', value: 'много' })
    expect(res.ok).toBe(false)
    const facts = await loadFacts(payload, SUB)
    expect(facts.map((f) => f.factKey)).toEqual(['benefit_category'])
  }, 30_000)

  it('неизвестный вопрос не принимается', async () => {
    const res = await upsertFact(payload, SUB, { key: 'зарплата', value: '100' })
    expect(res.ok).toBe(false)
  }, 30_000)

  it('на заданный вопрос повторно не спрашиваем', async () => {
    const facts = await loadFacts(payload, SUB)
    const missing = missingFactKeys(facts)
    expect(missing).not.toContain('benefit_category')
    expect(missing).toContain('children_count')
  })

  it('удаление профиля убирает и факты, и запись посетителя', async () => {
    await payload.create({
      collection: 'visitors',
      data: { esaSub: SUB },
      overrideAccess: true,
    })

    await deleteProfile(payload, SUB)

    expect(await loadFacts(payload, SUB)).toHaveLength(0)
    const visitors = await payload.find({
      collection: 'visitors',
      where: { esaSub: { equals: SUB } },
      limit: 1,
      overrideAccess: true,
    })
    expect(visitors.docs).toHaveLength(0)
  }, 30_000)
})
