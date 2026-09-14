import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
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
import { SESSION_COOKIE_PREFIX, SITE_NAME, SITE_URL } from './lib/site'
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
  // Адрес сайта. Без него `serverURL` пуст по умолчанию, и ссылка в письме
  // сброса пароля собирается относительной — то есть письмо приходит с
  // неработающей ссылкой, а понять это можно только получив письмо.
  serverURL: SITE_URL,
  // Почта. Пока SMTP_HOST не задан, адаптера нет вовсе и Payload ведёт себя
  // как раньше: пишет в журнал «Email attempted without being configured».
  // Так dev и CI не требуют почтового сервера, а прод получает настоящую
  // отправку, как только переменные появятся в окружении.
  //
  // `skipVerify` осознанно: по умолчанию адаптер проверяет связь с SMTP при
  // старте, и недоступный почтовый сервер не дал бы подняться САЙТУ. Письма
  // второстепенны, доступность сайта — нет; сбой доставки увидим в журнале.
  //
  // Ключ задаётся ТОЛЬКО когда SMTP настроен — через спред, а не `: undefined`.
  // Разница не косметическая: явный `email: undefined` снимает и встроенную
  // заглушку Payload, после чего `sendEmail` падает внутри транзакции
  // `forgotPassword`, она откатывается вместе с токеном, а наружу уходит
  // «Success». Кнопка «Забыли пароль?» отвечает успехом и молча ничего не
  // делает. Поймано на проде 14.09 по тому, что токен перестал появляться в БД.
  ...(process.env.SMTP_HOST
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.SMTP_FROM || process.env.SMTP_USER || '',
          defaultFromName: SITE_NAME,
          skipVerify: true,
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            // 465 — SMTPS (шифрование сразу), 587 — STARTTLS (после приветствия).
            // Перепутанная пара порт/режим даёт зависание, а не внятную ошибку,
            // поэтому режим выводится из порта, а не задаётся отдельной
            // переменной, которую можно рассогласовать.
            secure: Number(process.env.SMTP_PORT || 587) === 465,
            auth: {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || '',
            },
          },
        }),
      }
    : {}),
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
