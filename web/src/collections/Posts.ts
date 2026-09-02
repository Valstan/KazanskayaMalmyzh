import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { populatePublishedAt } from '../hooks/populatePublishedAt'
import { revalidatePost, revalidatePostDelete } from '../hooks/revalidatePost'
import { slugField } from '../fields/slug'

// Новости праздника: лента /news и страница /news/<slug>. Наполняется двумя
// путями — руками из админки и приёмником ВК-конвейера Сарафана
// (`/api/ingest/posts`, D-015): сайт — только приёмник, в ВК сам не ходит.
// Посты из конвейера всегда приезжают черновиками; публикует редактор.
export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: {
    singular: 'Новость',
    plural: 'Новости',
  },
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: authenticatedOrPublished,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['title', 'date', 'rubric', '_status', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Заголовок',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      label: 'Дата новости',
      admin: {
        position: 'sidebar',
        description: 'Дата в ленте. Пусто — берётся дата публикации.',
      },
    },
    {
      name: 'rubric',
      type: 'select',
      label: 'Рубрика',
      admin: { position: 'sidebar', description: 'Конвейер проставляет догадку; поле принадлежит редактору.' },
      options: [
        { label: 'Праздник', value: 'festival' },
        { label: 'Подготовка и заявки', value: 'prep' },
        { label: 'Ремёсла и мастера', value: 'crafts' },
        { label: 'Культура района', value: 'culture' },
        { label: 'История', value: 'history' },
        { label: 'Другое', value: 'other' },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      label: 'Лид',
      admin: { description: 'Одна-две фразы для ленты. Пусто — берётся начало текста.' },
    },
    {
      name: 'cover',
      type: 'upload',
      label: 'Обложка',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'upload',
      label: 'Все фото',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'Конвейер перекладывает фото из ВК к нам (ВК-CDN протухает).' },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Текст',
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публикации',
      admin: { position: 'sidebar' },
    },
    slugField(),
    {
      name: 'source',
      type: 'group',
      label: 'Источник (ВК)',
      admin: { position: 'sidebar' },
      fields: [
        {
          name: 'vkPostId',
          type: 'text',
          label: 'VK post ID',
          unique: true,
          index: true,
          admin: { description: 'Ключ идемпотентности приёмника — повторная доставка не создаёт дубль.' },
        },
        {
          name: 'sourceUrl',
          type: 'text',
          label: 'Ссылка на оригинал',
          validate: (
            value: string | null | undefined,
            { siblingData }: { siblingData?: { vkPostId?: string | null } },
          ) => {
            if (siblingData?.vkPostId && !value) return 'Для поста из ВК обязательна ссылка на оригинал.'
            return true
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
    afterChange: [revalidatePost],
    afterDelete: [revalidatePostDelete],
  },
  versions: {
    drafts: true,
  },
}
