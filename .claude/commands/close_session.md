---
description: Закрыть сессию — сохранить состояние в SESSION_HANDOFF и запушить всё через PR-flow, чтобы продолжить без потерь на другой машине
---

# /close_session — финализация сессии «Ярмарка Казанская»

Цель: оставить **explicit pointer** «куда мы шли» в `docs/SESSION_HANDOFF.md` и убедиться, что **всё лежит на `origin`** (handoff + рабочие PR), а brain не тронут — чтобы на другом компьютере хватило `/start` + `git pull --ff-only`.

## Когда вызывать / когда НЕ вызывать

- ✅ В конце рабочей сессии; перед пересадкой на другую машину; после значимого куска (фича/доки/решение).
- ❌ После короткой консультации без правок — просто скажи, что состояние чистое.

## Шаг 1. Собрать контекст

```bash
git branch --show-current
git status --short
git log --oneline -10
gh pr list --state open
```
Плюс TaskList (если велась) и текущий `docs/SESSION_HANDOFF.md`.

## Шаг 2. Уточнить у пользователя (если развилка)

- Какая нитка активна для **следующей** сессии, что считать «следующим шагом»?
- Появились ли решения/ограничения, которых нет в коде/гите (→ в handoff)?

## Шаг 3. Незакоммиченная работа → через PR-flow (НЕ в `main` напрямую)

Если `git status` непустой помимо handoff/доков:
1. **Гейты** (если трогался код): `corepack pnpm -C web typecheck && corepack pnpm -C web lint` (+ `next build` при существенной правке; локальный build — БЕЗ `STANDALONE_BUILD`).
2. **NUL-чек** (грабля харнесса): `git add -A && git diff --cached --stat` — любой исходник как `Bin` → вычистить NUL, пересохранить UTF-8 (см. `/obriv` шаг 3).
3. Ветка `feat/ fix/ chore/ docs/` → коммит → `git push -u origin <ветка>` → `gh pr create` → зелёные гейты → `gh pr merge --squash`.
   - ⚠️ Мерж кода в `main` **авто-деплоит на прод** (`deploy-prod.yml`; `docs/**`, `mailbox/**`, `*.md`, `.github/**`, `.claude/**` — не триггерят).
   - ⚠️ Новые Payload-миграции: применить на прод ВРУЧНУЮ до деплоя (#017-паттерн Казанской: SSH-туннель к PG бокса + `payload migrate` с dev-машины), затем деплой через `gh workflow run deploy-prod.yml` (migration-guard пропускает dispatch).

## Шаг 4. Обновить `docs/PENDING_FOLLOWUPS.md`

Отметить пункты, которые двигались в сессии ([x] / переформулировка), добавить новые хвосты.

## Шаг 4.5. Шеринг находки в brain (условный, pool #009)

Был **переносимый** инсайт (паттерн / обход бага / security-приём)? 3-фильтр: значимость / переносимость / неочевидность. Да → `mailbox/to-brain/YYYY-MM-DD-slug.md` (`kind: idea|feedback`) **в этом репо**. ❌ Никогда не коммитить в `../brain_matrica/`. Тишина = норма.

## Шаг 5. Записать `docs/SESSION_HANDOFF.md`

Абсолютные даты. Секции: **Состояние** (что на проде), **Сделано** (пункт сессии: что/гейты/смоук), **Следующая сессия** (конкретный шаг), **Блокеры (owner)** — если появились.

## Шаг 6. Handoff через docs-PR

```bash
git checkout -b docs/handoff-<slug>
git add docs/
git commit -m "docs: handoff — <резюме>"
git push -u origin docs/handoff-<slug>
gh pr create ... && gh pr merge --squash
git checkout main && git pull --ff-only
```

## Шаг 7. Sync-гейт (жёсткий)

```bash
git status --short                 # пусто
git rev-parse HEAD @{u}            # совпадают
gh pr list --state open            # перечислить
cd ../brain_matrica && git status --short && cd -   # чисто
```

## Шаг 8. Отчёт пользователю

Что закрыто; handoff на origin ✅; открытые PR; что подхватит `/start`.

## Что НЕ делать

- ❌ Прямой push в `main`; `--force`/`reset --hard` по `main`.
- ❌ Коммитить в `../brain_matrica/`.
- ❌ Оставлять незапушенные ветки / stash.
- ❌ Раздувать handoff — это sticky-note, не лог.
