import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { adminOrEditor } from '../access/adminOrEditor'

// Список «позвать на дату» (вскрытие 08.10): посетитель оставляет почту, чтобы
// получить ОДНО письмо, когда объявят дату Ярмарки 2027 года.
//
// Модель доверия:
//   • создать запись через API нельзя никому (`create: () => false`) — пишет
//     только серверный роут `/api/notify/*` после проверок (формат, honeypot,
//     троттлинг) и double opt-in;
//   • читать могут admin/editor (готовить рассылку), править/удалять — только
//     admin;
//   • токен подтверждения/отписки лежит ХЭШЕМ: утечка базы не отдаёт готовые
//     ссылки;
//   • ретеншн — процедурой, не автоматикой (крона нет): неподтверждённые старше
//     7 дней и весь список через 3 месяца после письма о дате удаляются вручную
//     при рассылке. Формулировка — в `/privacy`, напоминание — в PENDING.
export const Subscribers: CollectionConfig<'subscribers'> = {
  slug: 'subscribers',
  labels: {
    singular: 'Подписчик на дату',
    plural: 'Позвать на дату',
  },
  admin: {
    defaultColumns: ['email', 'status', 'createdAt'],
    useAsTitle: 'email',
    description:
      'Почты для одного письма о дате Ярмарки 2027 года. Рассылка — вручную; после неё список удаляется.',
  },
  access: {
    create: () => false,
    read: adminOrEditor,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'Почта',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'pending',
      options: [
        { label: 'Ждёт подтверждения', value: 'pending' },
        { label: 'Подтверждена', value: 'confirmed' },
      ],
      admin: { readOnly: true, description: 'Меняется только ссылками из писем.' },
    },
    {
      name: 'tokenHash',
      type: 'text',
      label: 'Хэш токена',
      required: true,
      admin: {
        readOnly: true,
        description: 'SHA-256 токена из письма. Сам токен нигде не хранится.',
      },
    },
    {
      name: 'source',
      type: 'text',
      label: 'Откуда пришли',
      admin: { readOnly: true, description: 'Место формы, например home-photoband.' },
    },
  ],
  timestamps: true,
}
