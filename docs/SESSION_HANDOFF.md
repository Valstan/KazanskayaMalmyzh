# SESSION_HANDOFF — sticky-note между сессиями (pool #003)

**Обновлено:** 2026-07-12 (сессия 1)

## Состояние

- **Fast-track подтверждён:** праздник — **сб 25.07.2026**, тема «Мы Вятские — люди хватские!». M1 ≤ 16.07, M2 ≤ 23.07 (директива 2026-07-12).
- **M1 scaffold готов (PR #1):** Next 15.4.11 + Payload 3.75 + PG, pnpm 10.15. Харвест из `../SabantuyMalmyzh`: Pages/Events/Gallery/Media/Users + глобал FestivalMap, access/hooks/slug, standalone-сборка в CI, деплой-workflow, systemd-юнит (порт 3001, MemoryMax=768M), заглушка-лендинг с контент-маркером «Ярмарка Казанская».
- Локализация НЕ включена сознательно (kickoff §3).
- typecheck + lint зелёные локально; сборка — только в CI (G20).

## Блокеры (owner)

1. **Deploy-ключ #001 (изолированный, НЕ сабантуевский)** — запрошен в отчёте сессии 1 (R14-паттерн). Нужно: secrets.SSH_PRIVATE_KEY + vars.DEPLOY_SSH_HOST/DEPLOY_SSH_PORT/NEXT_PUBLIC_SERVER_URL в репо GitHub. После выдачи — зеркало в KARMAN (ADR-0006).
2. На боксе перед первым деплоем (owner/сессия с доступом): создать БД `kazanskaya` + роль `kazanskaya_app`, `/etc/kazanskaya/kazanskaya.env` (по `deploy/kazanskaya.env.example`), установить юнит, добавить pubkey в authorized_keys, sudoers-правило для `systemctl restart kazanskaya`, TLS (Let's Encrypt) после первого деплоя.

## Следующая сессия

- Если ключ выдан: прогнать деплой, DoD M1 (https://казанская.вмалмыже.рф/ = 200 + маркер), TLS.
- Затем M2 research-first: перечитать `../brain_matrica/docs/plans/kazanskaya-visual-research.md` + history-research; страницы истории, программа, карта, темы по годам, SEO #051.
- Снять пакет документов «Ярмарка Казанская-2026»: https://malmyzh43.gosuslugi.ru/deyatelnost/napravleniya-deyatelnosti/sabantuy-kazanskaya-yarmarka/kazanskaya-2026/
