# PENDING_FOLLOWUPS — отложенные хвосты

- [x] **HTTPS решён** (2026-07-12): LE-серт через панель Джино (Домены → SSL → Установить, продление у Джино), редирект по X-Forwarded-Proto в nginx бокса. Письма: …https-jino-443-gotcha.md и …https-solved-jino-ssl.md.

- [x] TLS (Let's Encrypt) — выпущен 2026-07-12 (certbot --nginx, авто-продление стандартным таймером certbot).
- [x] KARMAN-зеркало (ADR-0006) — комната `kazanskayamalmyzh` (id=11), rw-токен, 6 секретов; токен также в `~/.kazanskaya_karman_token` dev-машины.
- [x] Первый админ Payload создан (креды в KARMAN: PAYLOAD_ADMIN_EMAIL/PASSWORD).
- [x] Праздничное оформление (PR #9): орнаментальные шрифты, фото-шапки, 8 свободных фото Commons, /istochniki-foto + imageCredits.
- [ ] **ВК-харвест через SARAFAN — ждёт owner-ключ `GATEWAY_KEY_KAZANSKAYA`** в `/etc/setka/setka.env` на боксе СЕТКА (81.177.6.46) + restart web. Контракт: `../setka/docs/GATEWAY.md`. РЦКД `dk_malmyzh` = group **217788511**, «Первый Малмыжский». Методы photos.get/photos.getAlbums/wall.get. Как ключ будет — событийные фото на сайт с ссылкой на пост-источник.
- [ ] **Логотип праздника** (ярмарка с разноцветной крышей-каруселью + деревья): в открытом вебе не найден → взять из ВК через шлюз или у владельца (оригинал). Шапка/подвал уже готовы принять `<img>`-логотип вместо текстового вензеля.
- [ ] Афиша-2026: мониторить https://malmyzh43.gosuslugi.ru/…/kazanskaya-2026/ и ВК района; занести Events в админку.
- [ ] Темы карнавала 2017–2025 (ВК-харвест) — дополнить YEAR_THEMES в lib/site.ts.
- [ ] pageDecor R7, /llms.txt, Яндекс.Метрика (потом G136).
- [ ] Capacity-probe бокса с двумя жильцами перед пиком 25.07 (#061) — эскалация мозгу при тесноте.
- [ ] SEO/GEO-пакет #051 (JSON-LD Event/FAQ, /llms.txt, robots) — с первого прод-деплоя / в M2.
- [ ] pageDecor R7 (ярмарочная эстетика) — M2.
- [ ] Аналитика: домен в адрес-фильтры счётчиков (G136) — после заведения счётчиков.
- [ ] Автоматизация ВК-конвейера через SARAFAN — после дня X (HITL Этап-2).
