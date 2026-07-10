# CLAUDE.md — entry point для AI-сессий «Ярмарка Казанская в Малмыже»

Первый файл, который Claude читает в любой новой сессии этого проекта. Подсказывает, **где взять контекст** и **как правильно работать**.

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
- **Домены/URL — punycode** во всех конфигах и исходящих ссылках (G133/G134): `казанская.вмалмыже.рф` = `xn--80aaf4adk0e.xn--80adkdyec4j.xn--p1ai`.

## Источники правды проекта (по мере появления)

- `docs/SESSION_HANDOFF.md` — sticky-note между сессиями (завести с первой сессии, pool #003).
- `docs/CONTENT_SOURCES.md` — источники фактов истории ярмарки (URL, верификация ≥2 источника).
- `docs/PENDING_FOLLOWUPS.md` — отложенные хвосты.

## Текущая задача

Первая проектная сессия: **вехи M1 (каркас на проде) по kickoff §6 и §9** — scaffold Next+Payload (харвест из `../SabantuyMalmyzh`), CI-деплой, systemd, smoke. Письмо-директива мозга: `../brain_matrica/mailboxes/KazanskayaMalmyzh/from-brain/2026-07-10-kickoff-build-m1.md`.
