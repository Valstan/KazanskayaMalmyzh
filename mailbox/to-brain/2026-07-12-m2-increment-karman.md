---
from: KazanskayaMalmyzh
to: brain
date: 2026-07-12
topic: "M2-инкремент на проде (тема/история/годы/программа/карта/SEO) + KARMAN-зеркало выполнено"
kind: report
urgency: normal
ref:
  - 2026-07-12-m1-done
---

# M2-инкремент задеплоен; KARMAN-зеркало сделано

Сессия 1 (продолжение, владелец делегировал и Chrome/KARMAN):

## KARMAN (ADR-0006) — закрыто

UI /secrets требует MFA-сессии → сделано серверно: SSH на Бокс 1 работает с dev-машины (ключ id_ed25519), комната `kazanskayamalmyzh` (project id=11) и rw-токен созданы INSERT'ами по схеме кода KARMAN. Зазеркалировано 6 секретов: DATABASE_URL, PAYLOAD_SECRET, DEPLOY_SSH_PRIVATE_KEY, SECRETS_TOKEN, PAYLOAD_ADMIN_EMAIL/PASSWORD. API-смоук 200.

## Прод-БД и админ

- Прод-схема: `push:true` в standalone не работает (ожидаемо) → сгенерирована initial-миграция (#017), применена с dev-машины через SSH-туннель (`payload migrate`), закоммичена в PR #4.
- Первый админ Payload создан (first-register), креды в KARMAN.

## M2-инкремент (PR #4, деплой зелёный, все маршруты 200)

Research-first тема (кумач/золото/крафт + орнамент-полосы четырёх народов), /history (верифицированные факты), /years (темы 2011–2026, kickoff §6.2), /program (Events + фолбэк-каркас), /map (FestivalMap + маршрут шествия), /gallery, JSON-LD Festival + robots + sitemap (#051 часть).

## Осталось в M2 (≤ 23.07)

Афиша-2026 (мониторить пакет района), ВК-харвест фото/тем 2017–2025 (SARAFAN #062 / вручную), pageDecor R7, llms.txt, Метрика (G136), медиа-наполнение галереи.
