# AGENTS.md — entry point для AI-сессий «Ярмарка Казанская в Малмыже»

Первый файл, который Codex читает в любой новой сессии этого проекта. Подсказывает, **где взять контекст** и **как правильно работать**.

Проект — интерактивный сайт праздника **«Ярмарка Казанская» в Малмыже** (казанская.вмалмыже.рф) по модели Сабантуй Малмыж. **Главенствующий план, стек, инфра и вехи:** [`../brain_matrica/docs/plans/kazanskaya-kickoff.md`](../brain_matrica/docs/plans/kazanskaya-kickoff.md). Реестровая карточка: [`../brain_matrica/projects/KazanskayaMalmyzh.md`](../brain_matrica/projects/KazanskayaMalmyzh.md).

## Language

Финальные сообщения, summary, объяснения — **на русском**. Internal reasoning, commit messages, идентификаторы — English.

---

## 📬 Mailbox check — ДО любой другой работы (asymmetric scheme, ADR-0001 v3)

Проект под управлением meta-репо `brain_matrica` (`../brain_matrica/`). Идеи / директивы / вопросы brain ↔ проект ходят через **асимметричные mailbox'ы**: каждая сторона пишет **только в свой репо**. См. [ADR-0001 v3](../brain_matrica/adr/0001-brain-projects-mailboxes.md).

| Направление | Кто пишет | Где |
|---|---|---|
| `brain → KazanskayaMalmyzh` | brain | `brain_matrica/mailboxes/KazanskayaMalmyzh/from-brain/*.md` (мы только **читаем** через `git pull --ff-only`) |
| `KazanskayaMalmyzh → brain` | мы | **`mailbox/to-brain/*.md`** в этом репо (коммитим в свой через PR) |

### Шаги в начале каждой сессии

1. **Sync brain (read-only):** `cd ../brain_matrica && git pull --ff-only && cd -`
2. **Сканить** `../brain_matrica/mailboxes/KazanskayaMalmyzh/from-brain/*.md` (только корень — не `DRAFTS/`, не `ARCHIVE/`).
3. **Доложить** пользователю списком `[urgency COMPLIANCE] slug — topic` до чтения `docs/SESSION_HANDOFF.md`.

### Реакция по compliance

| compliance | RFC 2119 | Действие |
|---|---|---|
| `mandate` | MUST | Применить безусловно. Технически невозможно → письмо `kind=feedback`, `urgency=high`, конкретный блокер. |
| `recommend` | SHOULD | Применить (можно с адаптацией). Не подходит → письмо с обоснованием отказа. Молчать нельзя. |
| `suggest` | MAY | По усмотрению. Применил — feedback приветствуется. Отложил — молча. |

### Написать brain

Создать `mailbox/to-brain/YYYY-MM-DD-slug.md` **в этом репо** с frontmatter `from: KazanskayaMalmyzh / to: brain / date / topic / kind (+compliance для idea|directive) / urgency`.

## Тактика напрямую, знание через курацию (ADR-0007)

Sibling-репо читаем **read-only напрямую** (пути `../<clone>/`): опыт Сабантуя — `../SabantuyMalmyzh/` (коллекции, CI, деплой — наш донор), знание мозга — `../brain_matrica/cross-project-ideas/` (GOTCHAS по симптому, pool по номеру). Зависимость от **чужого API/сервиса** — оформлять письмом мозгу, не тихим хардкодом.

## Правила работы

- **PR-flow с первого коммита** (ADR-0002): ветка → PR → merge; прямых пушей в `main` нет (кроме этого bootstrap-коммита).
- **Секреты вне репо** (#008): `/etc/kazanskaya/kazanskaya.env`, в git — только `.env.example`.
- **Сборка строго в CI** ([G20](../brain_matrica/cross-project-ideas/GOTCHAS.md)): бокс 1.5 ГБ swapless, on-box `next build` = OOM. Бокс делим с Сабантуем — см. kickoff §4 (MemoryMax, probe перед пиком).
- **Смоук после деплоя** — контент-маркер (#011), медиа — `curl /api/media/file/* = 200` (G146), сиды — артефакт, не exit-код (G145).
- **Домены/URL — punycode** во всех конфигах и исходящих ссылках (G133/G134): `казанская.вмалмыже.рф` = `xn--80aaa0andu6a3j.xn--80adkdyec4j.xn--p1ai`.

## Скилы сессии (`.claude/commands/`, зеркало для Codex — `.agents/skills/`)

- **`/start`** — старт сессии: синхра репо + brain, mailbox-check, handoff, re-триаж PENDING.
- **`/close_session`** — финализация: handoff → docs-PR, sync-гейт (всё на origin).
- **`/obriv`** — восстановление после обрыва связи (ground-truth реконструкция, NUL-чек).

## Экосистема: сервисы и секреты (карта интеграций)

| Что нужно | Куда идти | Как |
|---|---|---|
| **Секреты проекта** (восстановление/зеркало, ADR-0006) | **KARMAN**, комната `kazanskayamalmyzh` | rw-токен в `~/.kazanskaya_karman_token` dev-машины; API `https://831d0ce99bdf.vps.myjino.ru/api/secrets` (Bearer). Прод читает из `/etc/kazanskaya/kazanskaya.env` (#008) — KARMAN только зеркало. **Новый секрет → сразу зеркалить.** |
| **ВК-данные/фото** | **шлюз SARAFAN** (setka, #062) | `X-API-Key: GATEWAY_KEY_KAZANSKAYA` (значение — в KARMAN), контракт `../setka/docs/GATEWAY.md`. ⚠️ с dev-машины шлюз недостижим (DPI) — звать с бокса Sabantuy; helper-скрипты в memory `vk-via-sarafan`. |
| **Прод-бокс** (общий с Сабантуем) | `1942c6fc87be.vps.myjino.ru` SSH :49338, user valstan, sudo NOPASSWD | ключ `~/.ssh/id_ed25519_sabantuy` (admin) / `id_ed25519_kazanskaya` (CI-деплой). Наш юнит `kazanskaya` (:3001, MemoryMax=768M), nginx `/etc/nginx/conf.d/kazanskaya.conf`. |
| **Проверка прода** | только с бокса или с Бокса 1 | HTTP с dev-машины глохнет (G147 DPI). На боксе 443 не слушает никто (TLS у прокси Джино) — смотреть через nginx: `curl -s -H "Host: <punycode>" http://127.0.0.1/<путь>`; внешняя https-проверка — с Бокса 1. Прямой SSH на бокс с dev-машины с 25.07.2026 не проходит — прыжок через Бокс 1 (`-o ProxyCommand=…`). |
| **HTTPS** | панель Джино → Домены → SSL | LE-серт и продление на стороне Джино (их прокси терминирует 80/443 → наш :80 c X-Forwarded-Proto). certbot на боксе для внешнего 443 бесполезен; редирект — только по XFP. |
| **Payload-миграции** | вручную ДО деплоя (#017) | SSH-туннель к PG бокса + `payload migrate` с dev-машины; затем `gh workflow run deploy-prod.yml` (guard пропускает dispatch). |
| **Деплой** | merge кода в `main` = авто-деплой | `docs/**`, `mailbox/**`, `design/**`, `**.md`, `.github/**`, `.claude/**` не триггерят (`.agents/**` — только `.md`-файлы, т.е. фактически весь каталог); ручной — `gh workflow run deploy-prod.yml`. Смоук #011 в workflow (200 + маркер «Ярмарка Казанская»). |

Долговременная память сессий Claude — `C:\Users\Valstan\.claude\projects\D--PROGRAMMING-KazanskayaMalmyzh\memory\` (box-access-and-checks, vk-via-sarafan).

## Источники правды проекта

- `docs/SESSION_HANDOFF.md` — sticky-note между сессиями (pool #003).
- `docs/CONTENT_SOURCES.md` — источники фактов истории ярмарки (верификация ≥2 источника).
- `docs/PENDING_FOLLOWUPS.md` — отложенные хвосты.
- `web/src/lib/imageCredits.ts` (Commons) + `web/src/lib/galleryPhotos.ts` (фотоархив оргкомитета) — реестры фото; страница `/istochniki-foto`.

## Текущая задача

**Праздник 25.07.2026 отменён** (объявлено 24.07, новая дата не назначена). M1–M3 закрыты, редизайн на проде; M3 (день X) и M4 (пост-обзор) сняты. Сайт в режиме объявления: флаг `FEST_CANCELLED` в `web/src/lib/site.ts` гасит обратный отсчёт и live-режим `/program`, включает полосу-алерт и переводит JSON-LD в `EventCancelled`. Назовут новую дату — правим `FEST_DATE_*` и ставим флаг в `false`. Статус — в `docs/SESSION_HANDOFF.md`.
