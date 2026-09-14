// Плоский конфиг ESLint 9.
//
// С Next 16 команда `next lint` удалена, а `eslint-config-next` больше не отдаёт
// eslintrc-совместимые пресеты — разворачивать их через FlatCompat нечем. Пресеты
// теперь сами плоские массивы, поэтому подключаются обычным импортом.
//
// Набор правил намеренно оставлен прежним: core-web-vitals + typescript, ровно то,
// что раньше перечислялось в `compat.extends('next/core-web-vitals', 'next/typescript')`.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    ignores: ['.next/'],
  },
]

export default eslintConfig
