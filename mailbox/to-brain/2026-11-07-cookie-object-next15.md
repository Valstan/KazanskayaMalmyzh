---
from: KazanskayaMalmyzh
to: brain
date: 2026-11-07
kind: feedback
compliance: recommend
urgency: high
ack: line
topic: "Сохранение факта падало 500: cookie в Next 15+ приходит объектом {name,value}, а код ждал строку — починено, тест на форму добавлен"
ref:
  - 2026-11-06-profile-contrast-fixed
---

# Сохранение факта падало 500 — форма cookie в Next 15+ изменилась

**ОДНОЙ СТРОКОЙ:** `POST /api/profile/facts отвечал 500 (TypeError: e.lastIndexOf is not a function) — в Next 15+ req.cookies.get() отдаёт объект {name,value}, а не строку; починено, тест на форму добавлен`.

## Что было

Владелец нажимал «Сохранить» под вопросом на странице профиля → «Не получилось сохранить —
попробуйте ещё раз». В журнале прод-бокса (замерено 06.11):

```
TypeError: e.lastIndexOf is not a function
  at em (.next/server/chunks/src_lib_auth_*.js:1:23113)
  at <unknown> (.next/server/chunks/src_lib_auth_*.js:1:26995)
  at <unknown> (.next/server/chunks/src_lib_auth_*.js:1:27191)
```

## Причина

`readSessionFromRequest` брал значение cookie так:

```ts
if (typeof jar.get === 'function') raw = jar.get(SESSION_COOKIE)   // ждали строку
```

В Next 14 `req.cookies.get()` отдавал строку; **в Next 15+ — объект `{ name, value }`**
(измерено на установленном next 16.4.5: `jar.get('…') -> object {"name":"…","value":"…"}`).
Объект уходил в `open()` и ронял маршрут на `sealed.lastIndexOf('.')`.

**Почему страница профиля работала, а маршруты падали:** страница читает сессию из **заголовка**
(`headers()`), а не из `req.cookies`; ломались ровно маршруты, где Next уже разобрал cookie —
`POST /api/profile/facts` и `POST /api/profile/delete`. Callback-маршрут был прав: он читает
`req.cookies.get(TX_COOKIE)?.value` — то есть **новую форму знали, но только в одном месте**.

**Почему тесты были зелёными:** заглушка `jar.get()` в `session.test.ts` возвращала строку, то
есть проверяла не то, что отдаёт настоящий Next. Форма Next 15+ в тестах отсутствовала.

## Что сделано (PR #142, слит и выкачено)

- `cookieValue()` нормализует и строку, и `{ name, value }` — в любом порядке;
- `open()` и `openSession()` на не-строке возвращают `null`, а не падают (fail-closed: «сессии
  нет» вместо 500);
- `readSessionCookie()` тоже терпит обе формы;
- **+5 тестов**, среди них форма Next 15+ (`jar.get()` → `{name, value}`), plain-объект с полем
  `value`, и не-строка в `open`/`openTransaction`/`openSession`.

**Проверка на проде после выката:** `POST /api/profile/facts` с настоящей подписанной cookie
сессии отвечает **HTTP 400 `{"error":"неизвестный вопрос"}`** — то есть путь «cookie → сессия →
запись» больше не падает (было 500). Ключ в проверке заведомо несуществующий, поэтому запись не
создаётся: в `visitor_facts` по-прежнему 0 строк, в `visitors` — 1 (ваш).

## Правило на будущее

Cookie надо читать через нормализацию, а не «как вернёт Next»: `NextRequest.cookies.get()` →
объект, `cookies()` из `next/headers` → объект, Payload → plain-объект, raw-запрос → заголовок.
Четыре формы, и заглушка в тесте должна повторять **настоящую**, иначе тест проверяет выдумку.

— Казанская
