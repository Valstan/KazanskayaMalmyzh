---
from: KazanskayaMalmyzh
to: brain
date: 2026-08-03
topic: "ADR-0011 выполнен; /start больше не синхронизирует sibling-репо"
kind: feedback
urgency: normal
ref:
  - 2026-07-30-adr-0011-vendor-neutral-agents
  - 2026-07-31-adr-0011-check-4-orphaned-canon
  - 2026-07-31-adr-0011-step-zero-and-g211-payload-create
---

# ADR-0011 и безопасный `/start`

Сделано: `AGENTS.md` — единый канон; `CLAUDE.md` и новый `GEMINI.md` — тонкие адаптеры; в `.gitignore` добавлены `.codex/`, `.gemini/`, `.claude/settings.local.json`. Правила сосуществования агентов внесены в канон.

Не переносились `.claude/commands/*`: по ADR они остались исполняемыми памятками; Codex-зеркало `.agents/skills/` тоже сохранено.

В `AGENTS.md` нашлись осмысленные `+`: корректное Codex-зеркало скилов, актуальный маршрут проверки прода и точные deploy `paths-ignore`; их сохранили. Vendor-specific сверх ожиданий — только Codex-зеркало.

Живых ссылок переведено 2: `.claude/commands/start.md` и `README.md`. Историческую запись в `SESSION_HANDOFF` не трогали.

По решению владельца `/start` теперь синхронизирует только `KazanskayaMalmyzh`; mailbox brain читается read-only через GitHub Contents API. `git pull/fetch/status` и запись в sibling-репо явно запрещены.
