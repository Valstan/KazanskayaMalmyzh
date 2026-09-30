import path from 'path'
import { fileURLToPath } from 'url'

import { withPayload } from '@payloadcms/next/withPayload'

// Константы из `src/lib/esa.ts` импортом НЕ берём: конфиг Next читается и на
// этапе, где TypeScript ещё не собран. Дублирование — источник расхождения, а
// потому оно проверяется тестом ниже: при divergence origin в CSP разошёлся бы
// с адресом, на который ЕСА реально отдаёт токен, и вход сломался бы молча.
const ESA_ORIGIN_PUNYCODE = 'https://xn--b1ae3a1a.xn--80adkdyec4j.xn--p1ai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const NEXT_PUBLIC_SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Прод-VPS (Бокс Sabantuy, 1.5 GiB RAM без swap, второй жилец) не тянет
  // `next build` (OOM, G20). Сборка едет в CI, на сервер кладём standalone-артефакт.
  //
  // ⚠️ standalone-сборка мутирует локальный node_modules (outputFileTracing),
  // поэтому включается ТОЛЬКО по флагу STANDALONE_BUILD=1 (его ставит deploy-prod.yml).
  output: process.env.STANDALONE_BUILD === '1' ? 'standalone' : undefined,
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL].map((item) => {
        const url = new URL(item)
        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  // Заголовок `X-Powered-By: Next.js` даром называет стек — снимаем (D-038 по духу:
  // меньше признаков, меньше recon-поверхность).
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Заголовки безопасности на весь сайт (письмо brain 14.09, рецепт портала).
        //
        // CSP намеренно узкая — только три директивы. `script-src` не ставим: админка
        // Payload и счётчик Метрики работают на inline-скриптах, и любая осмысленная
        // политика для скриптов положила бы либо админку, либо счётчик. Директива,
        // которую пришлось бы разрешить до 'unsafe-inline', не защищает ни от чего —
        // лучше её отсутствие, чем видимость защиты.
        //
        // `form-action` — свой origin И origin ЕСА (D-095, вход посетителей). Раньше
        // стояло только `'self'` с пометкой «ЕСА нам n/a с 30.07»; решение владельца
        // 15.09 это отменило. Origin ЕСА в punycode — браузер сравнивает схему,
        // хост и порт, кириллический хост он не примет (G133/G134).
        //
        // `frame-ancestors 'self'`: встраивать сайт в чужую страницу нельзя даже
        // с формой входа — зеркало сайта с формой ЕСА внутри было бы фишингом.
        //
        // HSTS без `includeSubDomains`: соседи по вмалмыже.рф живут своей жизнью, и
        // навязывать им политику с нашего хоста мы не вправе.
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "frame-ancestors 'self'; " +
              `form-action 'self' ${ESA_ORIGIN_PUNYCODE}; ` +
              "base-uri 'self'",
          },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // /decor — контент-стабильные именованные ассеты (фото-шапки, декор). Длинный кэш
        // снимает повторную загрузку под фестивальным пиком (единственный vCPU бокса).
        // Не immutable: при замене файла под тем же именем 7-дневный max-age самозалечивается.
        source: '/decor/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        // Файлы фото годов именуются y<год>-…jpg — HTML-страницы /years/<год> не задевает.
        // Параметр обязан занимать сегмент целиком: начиная с Next 15.5 обновлён
        // path-to-regexp, и прежнее `y:path*` (параметр внутри сегмента) роняет
        // сборку разбором маршрутов. Класс цифр записан как [0-9], а не \d: в
        // обычной строке JS съедает одиночный бэкслэш, и паттерн молча перестаёт
        // совпадать при зелёной сборке.
        source: '/years/:file(y[0-9]{4}-.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ]
  },
  reactStrictMode: true,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
