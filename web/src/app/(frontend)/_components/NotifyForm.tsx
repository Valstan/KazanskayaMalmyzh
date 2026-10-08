'use client'

import Link from 'next/link'
import React, { useState } from 'react'

// Форма «позовите меня на дату 2027» (вскрытие 08.10): единственный механизм
// захвата на сайте. Сервер (POST /api/notify/subscribe) валидирует, троттлит
// и шлёт double opt-in; здесь только сбор адреса и честные статусы.
// Honeypot-поле `company` человек не видит (CSS уводит за экран) — бот заполняет.
export function NotifyForm() {
  const [email, setEmail] = useState('')
  const [trap, setTrap] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | { error: string }>('idle')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/notify/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, company: trap }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: true; error?: string } | null
      if (res.ok && data?.ok) {
        setState('done')
        setEmail('')
        return
      }
      setState({
        error:
          data?.error === 'invalid-email'
            ? 'Похоже, в адресе опечатка — проверьте и попробуйте снова.'
            : data?.error === 'too-many'
              ? 'Слишком много попыток — попробуйте через час.'
              : 'Письмо не ушло — попробуйте позже.',
      })
    } catch {
      setState({ error: 'Не получилось отправить — проверьте соединение и попробуйте снова.' })
    }
  }

  if (state === 'done') {
    return (
      <p className="notify-form__status" role="status">
        Проверьте почту: отправили ссылку для подтверждения. Без него ничего не сохранится.
      </p>
    )
  }

  return (
    <form className="notify-form" onSubmit={submit}>
      <label className="notify-form__label" htmlFor="notify-email">
        Позвать меня на дату 2027 года
      </label>
      <div className="notify-form__row">
        <input
          id="notify-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="ваша@почта.ru"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={state === 'sending'}
        />
        <input
          className="notify-form__trap"
          name="company"
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          value={trap}
          onChange={(event) => setTrap(event.target.value)}
        />
        <button className="btn btn--gold" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Отправляем…' : 'Позвать меня'}
        </button>
      </div>
      {typeof state === 'object' && (
        <p className="notify-form__status notify-form__status--error" role="alert">
          {state.error}
        </p>
      )}
      <p className="notify-form__note">
        Одно письмо, когда объявят дату. Отписка — ссылкой в письме.{' '}
        <Link href="/privacy">Как храним почту</Link>
      </p>
    </form>
  )
}
