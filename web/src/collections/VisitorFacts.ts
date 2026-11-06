import type { Access, CollectionConfig } from 'payload'

import { payloadServerField } from '../access/payloadServerUser'
import { visitorFactsOwn } from '../access/visitorFactsOwn'

// Факты о жителе (пилот #386, D-178): то, что человек назвал о себе ОДИН раз.
//
// ЧТО ЭТО НЕ ЕСТЬ по построению:
//   • **не профиль ЕСА.** У ЕСА нет «жителя поселения» и не будет (письмо
//     Сарафана 04.09, п.4: общий профиль = общая база ПДн, которую придётся
//     защищать и «забывать» на всех сервисах разом). Роли и атрибуты каждый
//     сервис держит у себя по `sub` — здесь ровно это;
//   • **не источник прав.** Самопровозглашённый факт не даёт обещаний: в
//     пилоте прав из фактов нет вообще (это #387). Подтвердить факт может
//     только источник (документ, ведомство) — и это `verifiedAt`, а не флаг
//     посетителя;
//   • **не черновик «на потом».** Факт без `source` не факт — запись без
//     источника не используется и не показывается.
//
// Идентификатор — `sub` ЕСА, как и в `visitors`. Пишет сервер (маршрут
// `/api/profile/facts`), потому что набор вопросов закрытый и значения
// проверяются по нему: через REST мимо проверки можно было бы записать в
// `children_count` что угодно.
export const VisitorFacts: CollectionConfig = {
  slug: 'visitor-facts',
  labels: {
    singular: 'Факт о жителе',
    plural: 'Факты о жителях',
  },
  admin: {
    defaultColumns: ['esaSub', 'factKey', 'value', 'source', 'updatedAt'],
    useAsTitle: 'factKey',
    description:
      'Что житель назвал о себе. Источник — `self` (сам), `doc:<ref>` или `import:<ref>`. Не правьте source и verifiedAt вручную: подтвердить факт может только источник.',
  },
  access: {
    // Пишет только сервер: набор вопросов и проверка значений живут в
    // `/api/profile/facts`. Через REST мимо проверки в `children_count` можно
    // было бы записать что угодно.
    create: () => false,
    update: () => false,
    delete: () => false,
    // Читать свои факты житель может — это его собственные данные.
    read: visitorFactsOwn,
  },
  fields: [
    {
      name: 'esaSub',
      type: 'text',
      label: 'Идентификатор ЕСА (sub)',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Непрозрачный идентификатор от ЕСА. Приходит только вместе с токеном.',
      },
      access: {
        create: payloadServerField,
        update: payloadServerField,
      },
    },
    {
      name: 'factKey',
      type: 'text',
      label: 'Вопрос',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        description:
          'Ключ из закрытого набора вопросов (см. `lib/facts.ts`). Новый вопрос — это новая строка в реестре, а не произвольный текст.',
      },
      access: {
        create: payloadServerField,
        update: payloadServerField,
      },
    },
    {
      name: 'value',
      type: 'text',
      label: 'Значение',
      required: true,
      admin: {
        description: 'Значение в том виде, в каком его дал житель; смысл разбирает `lib/facts.ts`.',
      },
    },
    {
      name: 'source',
      type: 'text',
      label: 'Источник',
      required: true,
      defaultValue: 'self',
      admin: {
        readOnly: true,
        description: "`self` — житель назвал сам; `doc:<ref>` — документ; `import:<ref>` — ведомство.",
      },
      access: { update: payloadServerField },
    },
    {
      name: 'verifiedAt',
      type: 'date',
      label: 'Подтверждено',
      admin: {
        readOnly: true,
        description:
          'Проставляется источником. Пусто ⇒ факт «по вашим данным»: он меняет формулировку ответа, но не даёт обещаний.',
      },
      access: { update: payloadServerField },
    },
  ],
  timestamps: true,
}
