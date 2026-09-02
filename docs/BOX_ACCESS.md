# BOX_ACCESS — как добраться до бокса и проверить прод

Процедуры, не адреса. Репозиторий публичный (D-038): хостнеймы, IP, порты, пути на сервере, имена пользователей и ключей здесь **не пишем** — они живут в `~/.ssh/config` dev-машины, в GitHub `secrets` и в комнате KARMAN `kazanskayamalmyzh`. Исторические записи в `SESSION_HANDOFF.md` и отправленных письмах не переписываем — это записи о том, что было.

## SSH на прод-бокс

- Алиасы в `~/.ssh/config` dev-машины: `sabantuy` / `kazanskaya` (один бокс, общий с соседями), `GONBA` (jump-host).
- Напрямую с dev-машины SSH не проходит: TCP открывается, дальше `Connection timed out during banner exchange` (DPI, родня G147). Рабочий обход — прыжок через jump-host:

```bash
ssh -o ProxyJump=GONBA sabantuy '<команда>'
```

- Пользователь на боксе — с `sudo NOPASSWD`. Наш юнит — `kazanskaya` (systemd, `MemoryMax`, `EnvironmentFile` с боевыми секретами, #008). Релизы — в домашнем каталоге пользователя: `kazanskaya/releases/<sha>`, симлинк `kazanskaya/current`, персистентное медиа — `kazanskaya/shared/media` (G146).
- CI-деплой ходит **своим** изолированным ключом (#001); его приватная часть — `secrets.SSH_PRIVATE_KEY`, ключ хоста — `secrets.DEPLOY_SSH_KNOWN_HOSTS` (строгая проверка, без `ssh-keyscan`).

## Проверка прода

- HTTP наружу с dev-машины глушится DPI (G147) — проверяем **с бокса** или **с jump-host'а**.
- На боксе внешний 443 не слушает никто: TLS терминирует прокси хостера и проксирует на наш `:80` с `X-Forwarded-Proto`. Смотреть через nginx:

```bash
curl -s -H "Host: xn--80aaa0andu6a3j.xn--80adkdyec4j.xn--p1ai" http://127.0.0.1/program | grep -c event__content
```

- Приложение слушает локальный порт за nginx (`proxy_pass` в `conf.d/kazanskaya.conf`); смоук в `deploy-prod.yml` бьёт в него напрямую, мимо nginx.
- Внешняя https-проверка (сертификат, редирект http→https) — с jump-host'а.
- Длительность рестарта юнита: `sudo journalctl -u kazanskaya -o short-iso | grep -E 'Stopping|Stopped'` — разница отметок и есть простой.

## Payload-миграции (#017)

Применяются вручную **до** деплоя: SSH-туннель к PostgreSQL бокса через тот же jump-host, затем `payload migrate` с dev-машины; после — `gh workflow run deploy-prod.yml` (migration-guard пропускает dispatch). Приёмка ручной миграции обязана включать **обновление** уже существующего документа, не только создание (G231).

## Скриншоты прода с dev-машины

Browser-pane к localhost не подключается, headless-Chrome не пишет в `d:\`. Рабочая связка — SSH-туннель к порту приложения + `puppeteer-core` из scratchpad с системным Chrome, `setViewport` 1280/390 и request-interception на `mc.yandex.ru` — без него `networkidle2` висит на DPI.

## VK-данные через SARAFAN (#062)

Шлюз недостижим с dev-машины (DPI) — звать с бокса:

```bash
ssh -o ProxyJump=GONBA sabantuy 'curl -s -H "X-API-Key: $GATEWAY_KEY_KAZANSKAYA" "<url шлюза>/api/..."'
```

- Ключ `GATEWAY_KEY_KAZANSKAYA` и адрес шлюза — в KARMAN; контракт — `../setka/docs/GATEWAY.md`.
- Идентификаторы найденных VK-постов фотолетописи (по годам) — в `docs/CONTENT_SOURCES.md` и `web/src/lib/galleryPhotos.ts`; страница `/istochniki-foto` держит ссылки на публикации.
- Темы шествий 2012, 2014, 2017–2018, 2020–2021 в открытых пабликах не найдены — запрос владельцу в `docs/owner-requests/`.
