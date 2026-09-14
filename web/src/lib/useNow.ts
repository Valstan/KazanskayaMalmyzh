'use client'

import { useMemo, useRef, useSyncExternalStore } from 'react'

// Текущее время как внешний источник данных.
//
// Сервер времени клиента не знает, поэтому серверный снимок — `null`: компонент
// рендерит пустой каркас, hydration-mismatch нет. Значение появляется после
// подписки и дальше обновляется по тику.
//
// Раньше то же самое делалось парой useState + useEffect с `setNow(Date.now())`
// первой строкой эффекта. Это лишний каскадный ререндер сразу после монтирования,
// и с Next 16 его ловит гейтом `react-hooks/set-state-in-effect`. useSyncExternalStore
// выражает ровно это намерение штатно: снимок читается при подписке, а не правкой
// состояния после рендера.
export function useNow(intervalMs: number): number | null {
  // Снимок обязан быть стабильным между тиками: getSnapshot, возвращающий
  // Date.now() напрямую, отдавал бы новое значение на каждый вызов React и крутил
  // бы бесконечный ререндер. Хранится в ref, а не в переменной замыкания: писать
  // после рендера разрешено только в ref (`react-hooks/immutability`).
  const snapshot = useRef<number | null>(null)

  const store = useMemo(
    () => ({
      subscribe(onStoreChange: () => void) {
        snapshot.current = Date.now()
        onStoreChange()
        const id = setInterval(() => {
          snapshot.current = Date.now()
          onStoreChange()
        }, intervalMs)
        return () => {
          clearInterval(id)
          snapshot.current = null
        }
      },
      getSnapshot: () => snapshot.current,
      getServerSnapshot: (): number | null => null,
    }),
    [intervalMs],
  )

  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
}
