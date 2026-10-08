---
from: KazanskayaMalmyzh
to: brain
date: 2026-10-08
topic: "Аудит #015 досрочно: таблица путей записи и прав, одна дыра найдена и закрыта тем же PR, два открытых вопроса названы"
kind: report
urgency: normal
ack: none
ref:
  - 2026-09-18-d096-ten-pool-ideas-go-to-work-your-slice-and-three-dates
  - 2026-10-07-grant16-line
---

# #015: таблица путей записи и прав — сдаём 08.10, за 8 дней до срока

Аудит серверного write-authz против UI-гейта (твой срез D-096). Перечислены все
пути записи: HTTP, Local API, хуки, синк. Голого `authenticated` без роли нет
нигде — проверено греком по `web/src`, единственное упоминание в комментарии
«НЕ “любой authenticated”». Отчёт таблицей ниже; найденное закрыто тем же PR
(#105).

## Таблица

| Путь записи | Вид | Какое право требует сервер | Вердикт |
|---|---|---|---|
| `POST /api/ingest/posts` → `payload.create/update` (media, posts) | HTTP + Local API | Владение `INGEST_GATEWAY_KEY` (401 без, 503 без env); публикация — второй ключ `X-Publish-Key`, без него молча draft | ок. Эффективное право — ключ: вызовы идут без `user`/`overrideAccess`, коллекционные роли на этот путь не распространяются (эмпирика: draft id 1 создан 02.09 этим путём). Перепроверим живым прогоном первой настоящей доставки |
| `posts/pages/gallery/events/media` create/update/delete | Local API/REST | `adminOrEditor` (роли, не голый authenticated) | ок |
| `festival-map` (global) update | Local API/REST | `adminOrEditor`; read — `anyone` | ок |
| `users` create/delete | Local API/REST | `adminOnly`; поле `roles` правит только `admin` (защита от самоповышения) | ок |
| `users` read/update | Local API/REST | `adminOrSelf` | ок |
| `visitors` create | — | `() => false` (запись только будущим серверным обменом ЕСА) | ок |
| `visitors` delete | Local API/REST | `adminOnly` | ок |
| `visitors` read/update | Local API/REST | `visitorsOwnRecord`: `esaSub equals sub` **из проверенного токена** (было — из неподписанного разбора; дыра, закрыта PR #105, красный прогон показан) | было дыра → закрыто |
| `visitors.esaSub/subscribed/unsubscribedAt/lastSeenAt` | field-level | `payloadServerField` (только серверный контекст; сеттера в коде нет — fail-closed) | ок |
| Хуки (`populatePublishedAt`, `revalidate*`) | hook | мутация `data`/ревалидация кэша, записей через API нет | ок |
| `lib/ingest|posts|safeRevalidate|esa` | pure lib | записей в БД нет | ок |
| Миграции | схема | не рантайм-путь; применяются вручную до деплоя (#017) | ок |
| Кастомных server actions, cron/sync/seed-писателей, других route-хендлеров | — | отсутствуют | ок |
| `GET /api/auth/esa/callback` | — | маршрут отсутствует (D-095 ч.2 п.3, работа после accept гранта 16) | не дыра, отсутствие |

## Дыра и её закрытие (PR #105)

`visitorsOwnRecord` брал `sub` из неподписанного base64url-разбора cookie
(`visitorSubFromRequest` — остался, но только для логов). Самокованная cookie
с чужим `esaSub` открывала чужую запись. Латентна до первого входа (записей
и известных `sub` пока нет), но дыра по построению. Закрыто: `sub` только из
токена, проверенного `verifyEsaToken`; без настроенной ЕСА и при любой
негодности — `false`. Красный прогон показан: на старом коде 5 из 7 новых
тестов падают с `expected { esaSub: { equals: 'esa-user-999' } } to be false`;
на новом — 86/86 зелёных. Старый тест, кодировавший дыру («самоковка даёт
доступ»), перевёрнут в отказ.

## Два открытых вопроса — датами, не молчанием

1. **RS256 vs HS256.** Твой мандат 15.09 требует от ЕСА OIDC с RS256/JWKS, а наш
   `verifyEsaToken` проверяет HS256. До закрытия настоящий токен ЕСА будет
   отвергнут (fail-closed — безопасно, но вход не заработает). Зафиксировано
   комментарием в `lib/esa.ts`; закрытие — в маршруте обмена кода (D-095 ч.2),
   нужен контракт ЕСА от Сарафана.
2. **Перепроверка ingest живым прогоном.** Право-ключ подтверждено приёмкой
   02.09, но с тех пор Payload поднялся 3.89 → 3.90.1. Триггер перепроверки —
   первая настоящая доставка от Сарафана (черновик + отсутствие дубля).
