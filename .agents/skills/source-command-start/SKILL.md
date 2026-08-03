---
name: "source-command-start"
description: "Старт сессии — синхра своего репо + mailbox brain через GitHub API + handoff + re-триаж PENDING"
---

# source-command-start

Use this skill when the user asks to run the migrated source command `start`.

## Command Template

Выполни старт сессии «Ярмарка Казанская» строго по шагам (детали — в `AGENTS.md` §📬 Mailbox check). Порядок жёсткий: **сначала синхронизация только текущего репо, затем mailbox через GitHub, потом session-память** — pool #032.

1. **Sync свой репо — ПЕРВЫМ:** `git fetch`; если working tree чист и есть отставание — `git checkout main && git pull --ff-only`. Незакоммиченное / не-ff — сообщи и не форсируй. Только после этого можно доверять `SESSION_HANDOFF`/`PENDING`.
2. **Не трогай sibling-репо:** не запускай в `../brain_matrica` и других клонах ни `git pull/fetch/status`, ни любые записи.
3. **Скан входящих с GitHub:** через `gh api repos/Valstan/brain_matrica/contents/mailboxes/KazanskayaMalmyzh/from-brain` получи и прочитай `.md`-файлы только из корня (НЕ `DRAFTS/`, НЕ `ARCHIVE/`). Это read-only HTTP/API-операция, она не меняет локальный brain. Если GitHub недоступен, допускается только чтение локального mailbox-снимка с явным предупреждением о возможной неактуальности.
4. **Доложи** пользователю сводку писем ДО чтения handoff, в формате:
   ```
   📬 N писем от brain_matrica:
   - [urgency COMPLIANCE] YYYY-MM-DD-slug — тема
   ```
   `urgency: high` — выдели отдельно даже если письмо одно. Для писем без `compliance`: `kind: directive`→MUST, `kind: idea`→SHOULD.
5. **Прочитай** `docs/SESSION_HANDOFF.md` — статус, текущая нитка, следующий шаг. Если `Обновлено:` старше 14 дней — пометь «handoff может быть неактуален», не доверяй слепо.
6. **Re-триаж отложенного (#033):** прочитай `docs/PENDING_FOLLOWUPS.md`; пункты с возрастом `added` > 30 дней ИЛИ `snoozed` ≥ 3× — **всплыви пользователю** с тремя исходами: возобновить / переформулировать под текущий код / выкинуть (с причиной). Остальные пункты не перечисляй.
7. **Сводка main:** `git log --oneline -5` и `git status` — что нового, есть ли незакоммиченное.
8. Кратко предложи пользователю следующий шаг из handoff.

Не начинай правки кода до завершения шагов 1–5.
