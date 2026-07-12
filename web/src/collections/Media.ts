import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { adminOrEditor } from '../access/adminOrEditor'
import { anyone } from '../access/anyone'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Медиафайл',
    plural: 'Медиа',
  },
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: anyone,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Описание (alt)',
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Подпись',
    },
  ],
  upload: {
    // ⚠️ G146: в standalone-сборке относительный staticDir «запекается» в абсолютный
    // путь СБОРОЧНОЙ машины и на проде файлы не находятся. На проде задаём MEDIA_DIR
    // (персистентный каталог вне релиз-директории) в /etc/kazanskaya/kazanskaya.env.
    // Локально env нет → относительный путь.
    staticDir: process.env.MEDIA_DIR || path.resolve(dirname, '../../public/media'),
    focalPoint: true,
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 768 },
      { name: 'wide', width: 1920 },
    ],
  },
}
