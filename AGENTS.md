# AGENTS.md — entry point для AI-сессий «Ярмарка Казанская в Малмыже»

Первый файл, который любой AI-агент читает в новой сессии этого проекта. Подсказывает, **где взять контекст** и **как правильно работать**.

Проект — интерактивный сайт праздника **«Ярмарка Казанская» в Малмыже** (казанская.вмалмыже.рф) по модели Сабантуй Малмыж. **Главенствующий план, стек, инфра и вехи:** [`../brain_matrica/docs/plans/kazanskaya-kickoff.md`](../brain_matrica/docs/plans/kazanskaya-kickoff.md). Реестровая карточка: [`../brain_matrica/projects/KazanskayaMalmyzh.md`](../brain_matrica/projects/KazanskayaMalmyzh.md).

## Language

Финальные сообщения, summary, объяснения — **на русском**. Internal reasoning, commit messages, идентификаторы — English.

---

## 📬 Mailbox check — ДО любой другой работы (asymmetric scheme, ADR-0001 v3)

Проект под управлением meta-репо `brain_matrica` (`../brain_matrica/`). Идеи / директивы / вопросы brain ↔ проект ходят через **асимметричные mailbox'ы**: каждая сторона пишет **только в свой репо**. См. [ADR-0001 v3](../brain_matrica/adr/0001-brain-projects-mailboxes.md).

| Направление | Кто пишет | Где |
|---|---|---|
| `brain → KazanskayaMalmyzh` | brain | `brain_matrica/mailboxes/KazanskayaMalmyzh/from-brain/*.md` (читаем **из GitHub API**, не синхронизируя sibling-репо) |
| `KazanskayaMalmyzh → brain` | мы | **`mailbox/to-brain/*.md`** в этом репо (коммитим в свой через PR) |

### Шаги в начале каждой сессии

1. **Sync только этот репозиторий:** `git fetch`; при чистом tree и отставании — `git checkout main && git pull --ff-only`.
2. **Сканить входящие через GitHub Contents API:** `gh api repos/Valstan/brain_matrica/contents/mailboxes/KazanskayaMalmyzh/from-brain`. Читать только `.md`-файлы корня, не `DRAFTS/` и не `ARCHIVE/`; содержимое получать тем же API или через `download_url`.
3. **Не трогать sibling-репозитории:** не выполнять в них `git pull/fetch/status`, не переключать ветки и не менять файлы. Если GitHub API недоступен, можно прочитать локальный mailbox-снимок только как fallback и явно пометить его возможную неактуальность.
4. **Доложить** пользователю списком `[urgency COMPLIANCE] slug — topic` до чтения `docs/SESSION_HANDOFF.md`.

### Реакция по compliance

| compliance | RFC 2119 | Действие |
|---|---|---|
| `mandate` | MUST | Применить безусловно. Технически невозможно → письмо `kind=feedback`, `urgency=high`, конкретный блокер. |
| `recommend` | SHOULD | Применить (можно с адаптацией). Не подходит → письмо с обоснованием отказа. Молчать нельзя. |
| `suggest` | MAY | По усмотрению. Применил — feedback приветствуется. Отложил — молча. |

Осознанное отложение или отказ **объявляются письмом** с триггером возврата; молчание brain читает как «не дошло», а не как «сделано».

### Написать brain

Создать `mailbox/to-brain/YYYY-MM-DD-slug.md` **в этом репо** с frontmatter `from: KazanskayaMalmyzh / to: brain / date / topic / kind (+compliance для idea|directive) / urgency`. В `ref:` — полный slug письма, на которое отвечаем.

## Границы между репозиториями

В этой сессии работаем только с `KazanskayaMalmyzh`. Соседние клоны не синхронизируем и не меняем. Исключение — чтение входящей почты brain через GitHub API. Зависимость от **чужого API/сервиса** оформляем письмом brain, не тихим хардкодом.

## Сосуществование агентов (ADR-0011)

- Один агент — одна задача — своя ветка. Параллельные пишущие агенты работают только в отдельных `git worktree`.
- Незнакомые изменения в дереве считаются чужими: не удалять, не форматировать и не `stash`-ить.
- Межмодельная память живёт только в Git/PR, `docs/SESSION_HANDOFF.md` и mailbox. Чат одной модели не является источником истины для другой.
- В памятках `allowed-tools` — только подсказка к инструменту; `/команда` означает «выполни шаги файла». Упомянутый UI-инструмент вроде `AskUserQuestion` можно заменить любой доступной формой вопроса, но сам шаг и ожидание явного ответа обязательны.

## Правила работы

- **PR-flow** (ADR-0002): ветка → PR → merge; прямых пушей в `main` нет. Обеспечено механически: branch protection с обязательной проверкой `build` и `enforce_admins`.
- **Секреты вне репо** (#008): боевые значения — в env-файле на боксе, в git — только `.env.example`.
- **Публичный репозиторий — recon-поверхность** (D-038, #189). Хостнеймы и IP боксов, порты, пути на сервере, имена пользователей и SSH-ключей, состав жильцов боксов, имя хостера и внутренние URL **не кладём в отслеживаемые файлы вообще** — ни в код, ни в docs, ни в комментарии workflow. Это свойство репозитория, а не витрины: правило действует и для файлов, которые «никуда не уезжают». Логи GitHub Actions — тоже публичны: признаки бокса в workflow берём из `secrets` (маскируются), не из `vars` (печатаются раскрытыми); диагностика при падении — извлечённые поля, не дампы (#223, #265). Процедуры доступа — в [`docs/BOX_ACCESS.md`](docs/BOX_ACCESS.md), значения — в KARMAN и `~/.ssh/config` dev-машины.
- **Текст не сочиняется в командной строке** (D-046). Heredoc, многострочные `-m`/`--body`, кириллица и `$`/backtick/кавычки внутри аргументов команды — запрещены: содержимое пишется инструментом записи файлов, команде отдаётся путь (`git commit -F msg.txt`, `gh pr create --body-file body.md`, `psql -f q.sql`, `curl --data-binary @body.json`). Однострочные ASCII-команды без кавычек внутри — можно.
- **Сборка строго в CI** ([G20](../brain_matrica/cross-project-ideas/GOTCHAS.md)): бокс swapless, on-box `next build` = OOM. Бокс делим с соседями — см. kickoff §4 (MemoryMax, probe перед пиком).
- **Смоук после деплоя** — контент-маркер из БД (#011, ревизия #104), медиа — `curl /api/media/file/* = 200` (G146), сиды — артефакт, не exit-код (G145).
- **Домены/URL — punycode** во всех конфигах и исходящих ссылках (G133/G134): `казанская.вмалмыже.рф` = `xn--80aaa0andu6a3j.xn--80adkdyec4j.xn--p1ai`. Исключение — адрес-фильтр Метрики: туда только кириллица, punycode Метрика нормализует сама (G136).

## Скилы сессии (`.claude/commands/`, зеркало для Codex — `.agents/skills/`)

- **`/start`** — старт сессии: синхра только этого репо, mailbox-check brain через GitHub API, handoff, re-триаж PENDING.
- **`/close_session`** — финализация: handoff → docs-PR, sync-гейт (всё на origin).
- **`/obriv`** — восстановление после обрыва связи (ground-truth реконструкция, NUL-чек).

## Экосистема: сервисы и секреты (карта интеграций)

| Что нужно | Куда идти | Как |
|---|---|---|
| **Секреты проекта** (восстановление/зеркало, ADR-0006) | **KARMAN**, комната `kazanskayamalmyzh` | rw-токен в `~/.kazanskaya_karman_token` dev-машины; адрес API — алиас `karman` в `~/.ssh/config` / комната KARMAN. Прод читает из env-файла на боксе (#008) — KARMAN только зеркало. **Новый секрет → сразу зеркалить.** |
| **ВК-данные/фото** | **шлюз SARAFAN** (setka, #062) | `X-API-Key: GATEWAY_KEY_KAZANSKAYA` (значение — в KARMAN), контракт `../setka/docs/GATEWAY.md`. ⚠️ с dev-машины шлюз недостижим (DPI) — звать с бокса; порядок — [`docs/BOX_ACCESS.md`](docs/BOX_ACCESS.md). |
| **Прод-бокс** (общий с соседями) | алиасы `sabantuy`/`kazanskaya` в `~/.ssh/config` dev-машины | Наш юнит — `kazanskaya` (systemd, MemoryMax), nginx-конфиг юнита в `conf.d`. SSH на бокс — только через jump-host (`-o ProxyJump=GONBA`), напрямую с dev-машины не проходит (DPI, G147). Подробно — [`docs/BOX_ACCESS.md`](docs/BOX_ACCESS.md). |
| **Проверка прода** | только с бокса или с jump-host'а | HTTP с dev-машины глохнет (G147 DPI). На боксе 443 не слушает никто (TLS у прокси хостера) — смотреть через nginx: `curl -s -H "Host: <punycode>" http://127.0.0.1/<путь>`; внешняя https-проверка — с jump-host'а. |
| **HTTPS** | панель хостера → Домены → SSL | LE-серт и продление на стороне хостера (его прокси терминирует 80/443 → наш :80 c X-Forwarded-Proto). certbot на боксе для внешнего 443 бесполезен; редирект — только по XFP (G150). |
| **Payload-миграции** | вручную ДО деплоя (#017) | SSH-туннель к PG бокса + `payload migrate` с dev-машины; затем `gh workflow run deploy-prod.yml` (guard пропускает dispatch). |
| **Деплой** | merge кода в `main` = авто-деплой | `docs/**`, `mailbox/**`, `design/**`, `**.md`, `.github/**`, `.claude/**` не триггерят (`.agents/**` — только `.md`-файлы, т.е. фактически весь каталог); ручной — `gh workflow run deploy-prod.yml`. Смоук #011 в workflow (200 + маркеры данных из БД). |
| **Аналитика** | Яндекс.Метрика **110809380** — единственный счётчик (D-025) | id — в GH-переменной `NEXT_PUBLIC_YM_ID`, инлайнится в `next build`; видимый информер в подвале — `MetrikaInformer` (D-017). Приёмка — визиты в кабинете и картинка информера с прода спустя часы (G237), не код ответа. |

Заметки о доступе к боксу и helper-скрипты VK-через-SARAFAN — [`docs/BOX_ACCESS.md`](docs/BOX_ACCESS.md).

## Источники правды проекта

- `docs/SESSION_HANDOFF.md` — sticky-note между сессиями (pool #003).
- `docs/CONTENT_SOURCES.md` — источники фактов истории ярмарки (верификация ≥2 источника).
- `docs/PENDING_FOLLOWUPS.md` — отложенные хвосты.
- `docs/BOX_ACCESS.md` — процедуры доступа к боксу и проверки прода (без адресов).
- `web/src/lib/imageCredits.ts` (Commons) + `web/src/lib/galleryPhotos.ts` (фотоархив оргкомитета) — реестры фото; страница `/istochniki-foto`.

## Режим сайта

Флаг `FEST_CANCELLED` в `web/src/lib/site.ts` гасит обратный отсчёт и live-режим `/program`, включает полосу-алерт и переводит JSON-LD в `EventCancelled`; дата праздника — `FEST_DATE_*` там же. Тесты `seo.test.ts` держат обе ветки флага. Текущий статус праздника и вехи — только в `docs/SESSION_HANDOFF.md`.

**Возврат праздника, когда владелец назовёт дату:** `FEST_DATE_ISO`/`FEST_DATE_HUMAN` (+ тема в `FEST_THEME*` и в `lib/years.ts`), `FEST_CANCELLED = false`; афишу занести в Events под новую дату; проверить на проде возврат отсчёта на главной, live-режима `/program` и `EventScheduled` в JSON-LD. Тексты «в прошедшем времени» на главной, `/program` и `/map` вернутся сами — они под тем же флагом.
