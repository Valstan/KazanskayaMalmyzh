# SESSION_HANDOFF — sticky-note между сессиями (pool #003)

**Обновлено:** 2026-07-12 (сессия 1)

## Состояние

- **Fast-track подтверждён:** праздник — **сб 25.07.2026**, тема «Мы Вятские — люди хватские!». M1 ≤ 16.07, M2 ≤ 23.07 (директива 2026-07-12).
- **M1 scaffold готов (PR #1):** Next 15.4.11 + Payload 3.75 + PG, pnpm 10.15. Харвест из `../SabantuyMalmyzh`: Pages/Events/Gallery/Media/Users + глобал FestivalMap, access/hooks/slug, standalone-сборка в CI, деплой-workflow, systemd-юнит (порт 3001, MemoryMax=768M), заглушка-лендинг с контент-маркером «Ярмарка Казанская».
- Локализация НЕ включена сознательно (kickoff §3).
- typecheck + lint зелёные локально; сборка — только в CI (G20).

## ✅ M1 DONE (2026-07-12, та же сессия)

- Владелец делегировал ключ сессии → сгенерирован `~/.ssh/id_ed25519_kazanskaya` (dev-машина), pubkey в authorized_keys бокса, приватная часть в secrets.SSH_PRIVATE_KEY; vars DEPLOY_SSH_HOST/PORT/NEXT_PUBLIC_SERVER_URL заданы.
- Бокс подготовлен по SSH с dev-машины (ключ sabantuy, sudo NOPASSWD): БД `kazanskaya`+роль (пароль только в `/etc/kazanskaya/kazanskaya.env`), юнит, nginx-vhost казанская → :3001.
- PR #2 — фикс `mkdir -p $REL/public` (в артефакте нет public/, пока нет web/public).
- Деплой зелёный, смоук #011 прошёл; TLS выпущен certbot; **https://казанская.вмалмыже.рф/ = 200 + маркер**.
- ⚠️ SSH на бокс с dev-машины РАБОТАЕТ (G8 не подтверждён для SSH); HTTP с dev-машины глохнет (G147 DPI) — проверять сайт с бокса или по DNS 8.8.8.8.

## Блокер-хвост (owner)

- KARMAN-зеркало (ADR-0006): завести комнату `kazanskayamalmyzh` + rw-токен в KARMAN → /secrets; зеркалировать deploy-ключ, DATABASE_URL, PAYLOAD_SECRET.

## Следующая сессия — M2 (≤ 23.07)

- Research-first дизайн: перечитать `../brain_matrica/docs/plans/kazanskaya-visual-research.md` + history-research; палитра/разделы из духа праздника, pageDecor R7.
- Страницы истории, программа-2026, карта (FestivalMap), галерея, темы по годам («Как это было»), SEO #051.
- Снять пакет документов «Ярмарка Казанская-2026»: https://malmyzh43.gosuslugi.ru/deyatelnost/napravleniya-deyatelnosti/sabantuy-kazanskaya-yarmarka/kazanskaya-2026/
- Создать первого админа Payload (сейчас /admin предлагает регистрацию первого пользователя — сделать при старте M2, логин сохранить в KARMAN).
