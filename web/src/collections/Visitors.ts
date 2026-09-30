import type { Access, CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { payloadServerField } from '../access/payloadServerUser'
import { visitorsOwnRecord } from '../access/visitorsOwnRecord'

// Посетители сайта (D-095, решение владельца 15.09): заявки на участие, фото в
// галерею, подписка на новости, комментарии — все четыре сценария за входом.
//
// ЧТО ЭТО НЕ ЕСТЬ по построению:
//   • **паролей нет вообще.** У коллекции нет `auth`, то есть Payload не создаёт
//     для неё ни формы входа, ни хеша пароля, ни соли. Единственный способ
//     опознать посетителя — предъявленный `sub` от ЕСА (D-072), который кладёт
//     в JWT шаг обмена кода. Своих паролей у сайта не появится ни в каком виде.
//   • **копии профиля ЕСА нет.** Ни имени, ни почты, ни телефона: только
//     `esaSub` — непрозрачный идентификатор. Всё остальное посетитель пишет сам,
//     это его содержимое, и мы не переносим его личные данные без нужды.
//   • **пароль приложения и client_secret — только в окружении**, см. `lib/esa.ts`.
//
// Читать и править свои записи посетитель может только свои. Вход админки Payload
// (`users`) — это отдельная сущность со своими ролями; администратор сайта здесь
// не посетитель и в этот набор не попадает.
export const Visitors: CollectionConfig = {
  slug: 'visitors',
  labels: {
    singular: 'Посетитель',
    plural: 'Посетители',
  },
  admin: {
    defaultColumns: ['esaSub', 'displayName', 'createdAt', 'updatedAt'],
    useAsTitle: 'displayName',
    description:
      'Записи посетителей. Идентификатор — sub ЕСА, паролей у сайта нет. Не правьте esaSub вручную: это ключ связи с входом.',
  },
  access: {
    // Запись создаёт сам сервер в момент обмена кода на токен — то есть
    // посетителю нельзя ни завести себя вручную, ни подделать `sub`.
    create: () => false,
    delete: adminOnly,
    // Свою запись посетитель читает по `sub` из своего токена. Роль payload-юзера
    // тут ни при чём: администратор Payload — не посетитель, и его записи в этой
    // коллекции нет.
    read: visitorsOwnRecord,
    update: visitorsOwnRecord,
  },
  fields: [
    {
      name: 'esaSub',
      type: 'text',
      label: 'Идентификатор ЕСА (sub)',
      required: true,
      unique: true,
      index: true,
      saveToJWT: true,
      admin: {
        readOnly: true,
        description: 'Непрозрачный идентификатор от ЕСА. Приходит только вместе с токеном.',
      },
      access: {
        // Ключ связи с входом: ни посетитель, ни редактор его не переписывают.
        // Иначе можно было бы присвоить себе чужой `sub` и войти как чужой.
        create: payloadServerField,
        update: payloadServerField,
      },
    },
    {
      name: 'displayName',
      type: 'text',
      label: 'Как вас показывать',
      admin: {
        description:
          'Имя, которое посетитель сам вводит для сайта. Мы не переносим имя из профиля ЕСА — это разные вещи.',
      },
    },
    {
      name: 'contacts',
      type: 'group',
      label: 'Контакты для ответа',
      admin: {
        description:
          'Заполняет сам посетитель, если хочет, чтобы ему ответили. Пустое поле — не ошибка.',
      },
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Почта',
          admin: { description: 'Проверяется отправкой письма, а не форматом.' },
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Телефон',
        },
      ],
    },
    {
      name: 'subscribed',
      type: 'checkbox',
      label: 'Подписан на новости',
      defaultValue: false,
      // Согласие на рассылку не выводится из факта входа: подписка и вход — разные
      // вещи, и молчаливый переход одного в другое — самый частый способ испортить
      // отношения с посетителем.
      access: { update: payloadServerField },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      label: 'Отписка',
      admin: {
        readOnly: true,
        description: 'Проставляется сервером, вручную не правится. Ретеншн — 12 месяцев с последнего входа.',
      },
      access: { update: payloadServerField },
    },
    {
      name: 'lastSeenAt',
      type: 'date',
      label: 'Последний вход',
      admin: { readOnly: true },
      access: { update: payloadServerField },
    },
  ],
  timestamps: true,
}
