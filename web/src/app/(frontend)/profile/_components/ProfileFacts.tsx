'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

// Форма «мои данные» (пилот #386, D-178).
//
// Правило, ради которого всё затевалось: **спросить один раз**. В форме
// показываются только те вопросы, на которые человек ещё не ответил. То, что
// уже записано, лежит рядом отдельной строкой — и переспрашивается только по
// явному «изменить», а не само.
//
// Значение «по васким данным» показываем честно: это заявление человека, а не
// подтверждённый факт, и подтвердить его может только источник (документ,
// ведомство) — на сайте этого пока нет.

export type ProfileFactView = {
  key: string
  valueLabel: string
  provenance: string
}

export type ProfileQuestion = {
  key: string
  label: string
  hint: string
  type: 'choice' | 'number'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
}

export function ProfileFacts({
  questions,
  existing,
}: {
  questions: ProfileQuestion[]
  existing: ProfileFactView[]
}) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'saving' | { error: string }>('idle')

  const known = new Set(existing.map((fact) => fact.key))
  const missing = questions.filter((question) => !known.has(question.key))

  const save = async (key: string, value: string) => {
    if (state === 'saving') return
    setState('saving')
    try {
      const res = await fetch('/api/profile/facts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setState({ error: data?.error ?? 'Не получилось сохранить — попробуйте ещё раз.' })
        return
      }
      setState('idle')
      setAnswers((prev) => ({ ...prev, [key]: '' }))
      setEditing(null)
      router.refresh()
    } catch {
      setState({ error: 'Не получилось сохранить — проверьте соединение.' })
    }
  }

  const removeProfile = async () => {
    // Подтверждение — здесь, а не на сервере: удаление профиля необратимо, и
    // «случайно нажал» — это нормальный сценарий, а не редкий.
    if (!window.confirm('Удалить профиль вместе с указанными данными? Это необратимо.')) return
    try {
      await fetch('/api/profile/delete', { method: 'POST' })
    } finally {
      router.push('/')
      router.refresh()
    }
  }

  const field = (question: ProfileQuestion, value: string, onChange: (v: string) => void) =>
    question.type === 'choice' ? (
      <select aria-label={question.label} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">— выберите —</option>
        {question.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type="number"
        inputMode="numeric"
        min={question.min}
        max={question.max}
        aria-label={question.label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    )

  return (
    <div>
      {missing.length > 0 && (
        <section>
          <h2>Что ещё не сказано</h2>
          <p className="lead">
            Спрашиваем один раз: ответив, вы больше не увидите этот вопрос. Менять ответ можно в
            любой момент — кнопкой «изменить» рядом с ним.
          </p>
          {missing.map((question) => (
            <div key={question.key}>
              <p className="profile-facts__label">{question.label}</p>
              <p className="profile-facts__hint">{question.hint}</p>
              <div className="profile-facts__row">
                {field(question, answers[question.key] ?? '', (v) =>
                  setAnswers((prev) => ({ ...prev, [question.key]: v })),
                )}
                <button
                  type="button"
                  className="btn btn--gold"
                  disabled={state === 'saving' || !(answers[question.key] ?? '')}
                  onClick={() => save(question.key, answers[question.key] ?? '')}
                >
                  {state === 'saving' ? 'Сохраняем…' : 'Сохранить'}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {existing.length > 0 && (
        <section>
          <h2>Что вы уже сказали</h2>
          <ul>
            {existing.map((fact) => {
              const question = questions.find((q) => q.key === fact.key)
              return (
                <li key={fact.key}>
                  <strong>{question?.label ?? fact.key}</strong>: {fact.valueLabel}{' '}
                  <em>({fact.provenance})</em>{' '}
                  {editing === fact.key && question ? (
                    <EditFact
                      question={question}
                      onSave={(value) => save(fact.key, value)}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <button type="button" className="btn" onClick={() => setEditing(fact.key)}>
                      изменить
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {typeof state === 'object' && (
        <p className="profile-facts__status--error" role="alert">
          {state.error}
        </p>
      )}

      <section>
        <h2>Удалить профиль</h2>
        <p>
          Удаляются все указанные данные и запись о посещении. Отменить нельзя. Выйти из аккаунта, не
          удаляя данные, — кнопкой «Выйти» в шапке.
        </p>
        <button type="button" className="btn" onClick={removeProfile}>
          Удалить профиль
        </button>
      </section>
    </div>
  )
}

function EditFact({
  question,
  onSave,
  onCancel,
}: {
  question: ProfileQuestion
  onSave: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState('')
  return (
    <div className="profile-facts__row">
      {question.type === 'choice' ? (
        <select
          aria-label={question.label}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        >
          <option value="">— выберите —</option>
          {question.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          inputMode="numeric"
          min={question.min}
          max={question.max}
          aria-label={question.label}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      )}
      <button type="button" className="btn btn--gold" disabled={!value} onClick={() => onSave(value)}>
        Сохранить
      </button>
      <button type="button" className="btn" onClick={onCancel}>
        Отменить
      </button>
    </div>
  )
}
