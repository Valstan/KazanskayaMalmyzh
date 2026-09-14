import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { adminOrSelf } from '../access/adminOrSelf'
import { SITE_URL } from '../lib/site'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Пользователь',
    plural: 'Пользователи',
  },
  access: {
    // Кто может войти в админку: персонал (админ + редактор-организатор).
    admin: ({ req: { user } }) =>
      Boolean(
        user &&
          Array.isArray(user.roles) &&
          (user.roles.includes('admin') || user.roles.includes('editor')),
      ),
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  // `secure` обязателен для `__Host-`-cookie и стоит безусловно, а не «только в
  // проде»: браузеры считают localhost защищённым origin, поэтому dev от этого не
  // страдает, а условие «в проде» — это ровно тот выключатель, который однажды
  // окажется выключен там, где нужен. `domain` не задаём намеренно: у cookie с
  // префиксом `__Host-` этот атрибут запрещён, и его появление здесь тихо сделает
  // cookie невалидной (G339 — вход начнёт крутить на форму входа без строки в логе).
  auth: {
    cookies: {
      secure: true,
      sameSite: 'Lax',
    },
    // Письмо сброса пароля по-русски. Payload по умолчанию шлёт английский
    // текст, а получатель у нас один и русскоязычный — владелец праздника.
    forgotPassword: {
      generateEmailSubject: () => 'Восстановление пароля — Ярмарка Казанская',
      generateEmailHTML: ({ token } = {}) => {
        // Адрес собираем из той же константы, что и весь сайт: относительная
        // ссылка в письме некликабельна, а зашитый домен разъедется с
        // остальным кодом при первом же переезде.
        const url = `${SITE_URL}/admin/reset/${token ?? ''}`
        return [
          '<p>Здравствуйте!</p>',
          '<p>Кто-то запросил восстановление пароля для админки сайта «Ярмарка Казанская».</p>',
          `<p><a href="${url}">Задать новый пароль</a></p>`,
          `<p>Если ссылка не открывается, скопируйте её в адресную строку:<br>${url}</p>`,
          '<p>Ссылка действует один час и срабатывает один раз.</p>',
          '<p>Если вы не запрашивали восстановление — просто не переходите по ссылке, пароль останется прежним.</p>',
        ].join('')
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Имя',
    },
    {
      name: 'roles',
      type: 'select',
      label: 'Роли',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      saveToJWT: true,
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Редактор (организатор)', value: 'editor' },
      ],
      access: {
        // Менять роли может только админ (защита от самоповышения привилегий).
        update: ({ req: { user } }) =>
          Boolean(user && Array.isArray(user.roles) && user.roles.includes('admin')),
      },
    },
  ],
  timestamps: true,
}
