import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { populatePublishedAt } from '../hooks/populatePublishedAt'
import { revalidateEvent, revalidateEventDelete } from '../hooks/revalidateEvent'
import { slugField } from '../fields/slug'

// Программа праздника: время, место, описание, категория.
export const Events: CollectionConfig<'events'> = {
  slug: 'events',
  labels: {
    singular: 'Событие',
    plural: 'Программа',
  },
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: authenticatedOrPublished,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['title', 'startDate', 'category', '_status', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Название',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      label: 'Краткое описание',
    },
    {
      name: 'startDate',
      type: 'date',
      label: 'Начало',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'Окончание',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'location',
      type: 'text',
      label: 'Место проведения',
    },
    {
      name: 'venue',
      type: 'text',
      label: 'Площадка / сцена',
      admin: {
        description: 'Например: Стадион, Город мастеров, Этногород. Группирует программу по площадкам.',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Категория',
      options: [
        { label: 'Шествие', value: 'parade' },
        { label: 'Концерт', value: 'concert' },
        { label: 'Ремёсла', value: 'crafts' },
        { label: 'Подворья / кухня', value: 'ethno' },
        { label: 'Ярмарка / торговля', value: 'trade' },
        { label: 'Детям', value: 'kids' },
        { label: 'Церемония', value: 'ceremony' },
        { label: 'Другое', value: 'other' },
      ],
    },
    {
      name: 'heroImage',
      type: 'upload',
      label: 'Главное изображение',
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Подробное описание',
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
    afterChange: [revalidateEvent],
    afterDelete: [revalidateEventDelete],
  },
  versions: {
    drafts: true,
  },
}
