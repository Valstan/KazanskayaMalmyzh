import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { populatePublishedAt } from '../hooks/populatePublishedAt'
import { revalidatePageDoc, revalidatePageDelete } from '../hooks/revalidatePageDoc'
import { slugField } from '../fields/slug'

// Статические разделы: история ярмарки и города, как добраться, народы Малмыжа.
export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  labels: {
    singular: 'Страница',
    plural: 'Страницы',
  },
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: authenticatedOrPublished,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
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
      name: 'content',
      type: 'richText',
      label: 'Содержимое',
    },
    {
      name: 'heroImage',
      type: 'upload',
      label: 'Обложка страницы',
      relationTo: 'media',
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публикации',
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
    afterChange: [revalidatePageDoc],
    afterDelete: [revalidatePageDelete],
  },
  versions: {
    drafts: true,
  },
}
