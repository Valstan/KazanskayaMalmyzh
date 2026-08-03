import React from 'react'

import {
  FEST_CANCEL_ANNOUNCED,
  FEST_CANCEL_LEAD,
  FEST_CANCEL_NOTE,
  FEST_CANCEL_TITLE,
} from '../../../lib/site'

// Объявление об отмене праздника. Один источник текста на весь сайт: широкая
// сигнальная полоса под шапкой (CancelBanner, на всех страницах) и компактная
// плашка внутри контента (CancelPlate) — на месте обратного отсчёта на главной
// и над программой, чтобы страницы не читались как «всё в силе».

export function CancelBanner() {
  return (
    <aside className="fest-cancel" aria-labelledby="fest-cancel-title">
      <div className="wrap fest-cancel__inner">
        <span className="fest-cancel__sign" aria-hidden>
          27
        </span>
        <div className="fest-cancel__copy">
          <p className="fest-cancel__title" id="fest-cancel-title">
            {FEST_CANCEL_TITLE}
          </p>
          <p className="fest-cancel__text">
            {FEST_CANCEL_LEAD} {FEST_CANCEL_NOTE}
          </p>
          <p className="fest-cancel__meta">Решение о 2026 годе объявлено {FEST_CANCEL_ANNOUNCED}</p>
        </div>
      </div>
    </aside>
  )
}

export function CancelPlate({ children }: { children?: React.ReactNode }) {
  return (
    <p className="cancel-plate">
      <span className="cancel-plate__sign" aria-hidden>
        !
      </span>
      <span>
        {children ?? (
          <>
            {FEST_CANCEL_LEAD} {FEST_CANCEL_NOTE}
          </>
        )}
      </span>
    </p>
  )
}
