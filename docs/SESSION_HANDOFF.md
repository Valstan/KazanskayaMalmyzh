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

## ✅ M2-инкремент DONE (та же сессия, PR #4)

- KARMAN: комната `kazanskayamalmyzh` (id=11) + rw-токен (и в `~/.kazanskaya_karman_token`), 6 секретов зазеркалированы. UI /secrets требует MFA — делали серверно (SSH Бокс 1 с dev-машины работает, ключ id_ed25519).
- Прод-БД: initial-миграция (#017) применена через SSH-туннель (`payload migrate` c dev-машины); **новые миграции — тем же способом, деплой после них через workflow_dispatch (гвард)**.
- Первый админ создан (креды в KARMAN). Тема research-first, /history /years /program /map /gallery + JSON-LD/robots/sitemap на проде, все 200.

## ✅ Праздничное оформление DONE (та же сессия, PR #9)

- Шрифты-завитушки (Ruslan Display + Playfair Display + PT Serif, next/font/google), кумачово-золотой декор, вензеля, орнамент-полосы, sticky-шапка.
- Фото-шапки (`_components/Hero.tsx`) на каждой странице: заголовок поверх фото; фото в тексте (`Figure`).
- 8 свободных фото Wikimedia Commons в `web/public/decor/` (ресайз+сжатие sharp, 2.1 МБ); реестр `lib/imageCredits.ts` + страница `/istochniki-foto`. `/decor` — длинный кэш (next.config.js headers).
- Логотип НЕ найден в вебе; шапка/подвал готовы принять `<img>` вместо текстового вензеля.
- Helper для Commons: `scratchpad/commons.mjs` (search/info/dl). Для ВК — паттерн ниже.

## ВК-харвест (готово к запуску, ждёт ключ)

- Канал: шлюз **SARAFAN** (`../setka/docs/GATEWAY.md`), base `https://3931b3fe50ab.vps.myjino.ru`, заголовок `X-API-Key: GATEWAY_KEY_KAZANSKAYA`. **Ключ — owner-действие в env setka на боксе СЕТКА** (SSH-доступа у сессии нет; как GONBA-ключ).
- РЦКД `dk_malmyzh` = **group 217788511** (альбомы 2024+, festival-специфики мало); «Первый Малмыжский» (15k, активнее). Методы: photos.getAlbums/photos.get/wall.get. Фото → сайт с ссылкой на пост-источник (расширять imageCredits/новый реестр VK).
- ВК доступен и залогинен в Chrome владельца, но браузерный обход медленный — использовать шлюз.

## Следующая сессия — добить M2 (≤ 23.07)

- Афиша-2026: пакет района (kazanskaya-2026 на госуслугах) + ВК → занести Events в админку.
- ВК-фото + логотип через SARAFAN (как ключ будет); темы карнавала 2017–2025 → YEAR_THEMES.
- pageDecor R7, /llms.txt, Метрика. Карту-схему территории — от оргкомитета в FestivalMap.
