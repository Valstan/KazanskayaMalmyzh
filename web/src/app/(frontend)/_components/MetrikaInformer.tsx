import React from 'react'

// Видимый информер Яндекс.Метрики в подвале (D-017: владелец хочет видеть цифру
// посещаемости на самом сайте; D-025: единственный счётчик экосистемы — Метрика,
// LiveInternet снят). Разметка — штатная из кабинета Метрики (класс
// ym-advanced-informer), вариант 3_1: три числа — просмотры, визиты, посетители за сегодня.
//
// Грабли приёмки (G237): informer.yandex.ru отдаёт 403 на чужой Referer — на
// локальном превью картинка сломана всегда; на проде первые часы после включения
// отдаётся валидный PNG со всеми нулями. Проверять — по картинке с прода спустя
// несколько часов, не по коду ответа и не сразу после выката.
export function MetrikaInformer() {
  const id = process.env.NEXT_PUBLIC_YM_ID
  if (!id) return null
  return (
    <a
      href={`https://metrika.yandex.ru/stat/?id=${id}&from=informer`}
      target="_blank"
      rel="nofollow noopener noreferrer"
      className="ym-informer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://informer.yandex.ru/informer/${id}/3_1_FFFFFFFF_EFEFEFFF_0_pageviews`}
        style={{ width: 88, height: 31, border: 0 }}
        width={88}
        height={31}
        alt="Яндекс.Метрика"
        title="Яндекс.Метрика: данные за сегодня (просмотры, визиты и уникальные посетители)"
        className="ym-advanced-informer"
        data-cid={id}
        data-lang="ru"
      />
    </a>
  )
}
