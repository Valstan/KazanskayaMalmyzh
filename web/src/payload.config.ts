import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Pages } from './collections/Pages'
import { Events } from './collections/Events'
import { Gallery } from './collections/Gallery'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { SESSION_COOKIE_PREFIX } from './lib/site'
import { FestivalMap } from './globals/FestivalMap'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Ярмарка Казанская в Малмыже',
    },
  },
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // MVP/greenfield: push автосинхронизирует схему в dev/CI. Прод-миграции —
    // вручную на этапе деплоя (паттерн Sabantuy, #017).
    push: true,
  }),
  collections: [Pages, Events, Gallery, Posts, Media, Users],
  globals: [FestivalMap],
  cors: [process.env.NEXT_PUBLIC_SERVER_URL || ''].filter(Boolean),
  // Имя сессионной cookie с префиксом `__Host-` (#285, письмо brain 05.09).
  // Payload собирает имя как `<cookiePrefix>-token`, то есть отсюда получается
  // `__Host-payload-token`, и тем же префиксом cookie читается (extractJWT).
  //
  // Зачем: у соседей по `вмалмыже.рф` есть право выставить cookie с
  // `Domain=.вмалмыже.рф`, и она приедет к нам под тем же именем. При двух cookie
  // с одним именем побеждает подброшенная. Префикс `__Host-` — единственное, что
  // это исключает: браузер принимает такую cookie только от точного хоста, только
  // по HTTPS, только с `Path=/` и запрещает у неё атрибут `Domain`.
  //
  // Остальные три условия Payload выполняет сам: `path: '/'` задан жёстко,
  // `domain` не ставится, пока не задан в коллекции (мы его не задаём), а
  // `secure` включён в `auth.cookies` коллекции Users.
  cookiePrefix: SESSION_COOKIE_PREFIX,
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  // Локализация НЕ включена сознательно (kickoff §3): Казанская — русскоязычный
  // праздник; у Sabantuy tt-версия пустует.
  i18n: {
    fallbackLanguage: 'ru',
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
