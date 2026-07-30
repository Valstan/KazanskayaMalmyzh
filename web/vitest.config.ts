import { defineConfig } from 'vitest/config'

// Тесты — на чистую логику (JSON-LD, летопись годов). Рендер страниц и работа с
// Payload сюда не входят: они требуют БД и проверяются смоуком после деплоя.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
