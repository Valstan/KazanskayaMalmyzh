import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import config from '@payload-config'

import { Hero } from '../_components/Hero'
import { ProfileFacts, type ProfileFactView, type ProfileQuestion } from './_components/ProfileFacts'
import { publicProfile, readSessionFromRequest } from '../../../lib/auth/session'
import { FACT_KEYS, FACT_SPECS, factProvenanceLabel, factValueLabel } from '../../../lib/facts'
import { loadFacts } from '../../../lib/profile'

// /profile — «мой профиль» (пилот единого профиля жителя, #386, D-178).
//
// Что здесь происходит: человек входит через ЕСА (один вход на все сервисы
// Малмыжа), один раз отвечает на закрытый набор вопросов, и дальше сервисы
// спрашивают эти данные у нас — по конкретному вопросу, а не копируют профиль.
//
// ⚠️ Почему здесь ПДн, а в KARMAN — нет: общий профиль ЕСА не существует и не
// планируется (письмо Сарафана 04.09, п.4). Роли и атрибуты каждый сервис
// держит у себя по `sub` — здесь именно это, и поэтому удалить всё можно
// одним движением.
//
// Страница динамическая: она читает сессию из cookie и факты из БД. Пререндер
// здесь был бы враньём — человеку показали бы чужой (или пустой) профиль.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: { canonical: '/profile' },
  title: 'Мой профиль',
  description: 'Единый вход и данные, которые вы указали о себе.',
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const h = await headers()
  const session = readSessionFromRequest({ headers: h })
  const params = await searchParams
  const failed = params?.auth === 'failed'
  const unavailable = params?.auth === 'unavailable'

  if (!session) {
    return (
      <main className="page page--inner">
        <Hero image="malmyzh-street" kicker="Профиль" title="Мой профиль" decor="merchant" />
        <div className="wrap page-shell">
          <div className="flourish" aria-hidden />
          <section className="section section--tight">
            {failed && (
              <div className="notice" role="alert">
                Вход не получился. Попробуйте ещё раз — если не выйдет, напишите оргкомитету в
                подвале сайта.
              </div>
            )}
            {unavailable && (
              <div className="notice" role="alert">
                Вход сейчас недоступен: на сервере не настроен ключ доступа к «Сервисам Малмыжа».
                Оргкомитет уже знает об этом — напишите нам, если нужно войти именно сейчас.
              </div>
            )}
            <p className="lead">
              Войдите через «Сервисы Малмыжа» — один вход на все сервисы города. После входа здесь
              можно указать о себе то, что сервисам нужно знать, — один раз, а не при каждом
              обращении.
            </p>
            <p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
              Это не страница, а API-маршрут: он ставит транзакционную cookie и
              уводит на ЕСА. `<Link>` здесь неверен — он ходит по нему из клиента
              и получил бы JSON вместо перехода. */}
              <a className="btn btn--gold" href="/api/auth/esa/login?next=/profile">
                Войти
              </a>
            </p>
          </section>
        </div>
      </main>
    )
  }

  const payload = await getPayload({ config })
  const facts = await loadFacts(payload, session.sub)
  const profile = publicProfile(session)

  const questions: ProfileQuestion[] = FACT_KEYS.map((key) => {
    const spec = FACT_SPECS[key]
    return {
      key,
      label: spec.label,
      hint: spec.hint,
      type: spec.type,
      ...(spec.options ? { options: spec.options } : {}),
      ...(spec.min !== undefined ? { min: spec.min } : {}),
      ...(spec.max !== undefined ? { max: spec.max } : {}),
    }
  })

  const existing: ProfileFactView[] = facts
    .filter((fact) => FACT_KEYS.includes(fact.factKey as (typeof FACT_KEYS)[number]))
    .map((fact) => ({
      key: fact.factKey,
      valueLabel: factValueLabel(
        fact.factKey as (typeof FACT_KEYS)[number],
        fact.value,
      ),
      provenance: factProvenanceLabel(fact),
    }))

  return (
    <main className="page page--inner">
      <Hero image="malmyzh-street" kicker="Профиль" title="Мой профиль" decor="merchant" />
      <div className="wrap page-shell">
        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          <p className="lead">
            Вы вошли как <strong>{profile.name}</strong>
            {profile.email ? ` (${profile.email})` : ''}. Мы не переносим ваш профиль из «Сервисов
            Малмыжа» — храним только то, что вы сами указали здесь, и идентификатор входа.
          </p>
          <p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
            Выход — API-маршрут с редиректом на end_session ЕСА: клиентский
            переход здесь не устроит (нужен настоящий уход со страницы). */}
            <a className="btn" href="/api/auth/esa/logout">
              Выйти
            </a>
          </p>
        </section>

        <ProfileFacts questions={questions} existing={existing} />
      </div>
    </main>
  )
}
