import path from 'path'
import { fileURLToPath } from 'url'

import { withPayload } from '@payloadcms/next/withPayload'

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
  // /decor — контент-стабильные именованные ассеты (фото-шапки, декор). Длинный кэш
  // снимает повторную загрузку под фестивальным пиком (единственный vCPU бокса).
  // Не immutable: при замене файла под тем же именем 7-дневный max-age самозалечивается.
  async headers() {
    return [
      {
        source: '/decor/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ]
  },
  reactStrictMode: true,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
