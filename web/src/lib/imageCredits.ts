// Реестр внешних фотографий сайта — единственный источник правды об авторах и
// лицензиях. Рендерится страницей «Источники фотографий» (/istochniki-foto):
// атрибуция собрана в одном месте (для CC-лицензий это допустимый способ).
//
// Файлы — web/public/decor/<slug>.jpg (ресайз ≤1500px + сжатие sharp; для CC BY-SA
// производные распространяются под той же лицензией). Все свободные — Wikimedia
// Commons. Событийные фото самого праздника из ВК добавляются отдельно (с ссылкой
// на пост-источник) по мере харвеста через шлюз SARAFAN.
export type ImageCredit = {
  /** Базовый slug файла в /decor */
  slug: string
  /** Название файла на Викискладе */
  title: string
  /** Автор (как указан на странице файла) */
  author: string
  /** Короткое имя лицензии */
  license: string
  /** Ссылка на текст лицензии (null — PD/CC0, разрешение не требуется) */
  licenseUrl: string | null
  /** Страница файла-источника */
  sourceUrl: string
  /** Где используется на сайте */
  usage: string
}

export const IMAGE_CREDITS: ImageCredit[] = [
  {
    slug: 'hero-fair',
    title: 'Tatar dance at the Sabantuy festival, Kirov',
    author: 'Ele-chudinovsk',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tatar_dance_at_the_Sabantuy_festival,_Kirov.jpg',
    usage: 'Главная — шапка (фольклорный танец на празднике в Кировской области)',
  },
  {
    slug: 'malmyzh-cathedral',
    title: 'Epiphany Cathedral in Malmyzh, Kirov Oblast',
    author: 'Alx0yago',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Epiphany_Cathedral_in_Malmyzh,_Kirov_Oblast.jpg',
    usage: 'История — шапка (Богоявленский собор в Малмыже)',
  },
  {
    slug: 'malmyzh-lavka',
    title: 'Малмыж, Комсомольская 48, лавка',
    author: 'Ele-chudinovsk',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Малмыж,_Комсомольская48,_лавка.jpg',
    usage: 'История — купеческая лавка XIX века',
  },
  {
    slug: 'malmyzh-street',
    title: 'Малмыж, К. Маркса, 5',
    author: 'Ele-chudinovsk',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Малмыж,_К.Маркса,5.jpg',
    usage: 'Карта — историческая застройка центра Малмыжа',
  },
  {
    slug: 'mari-ensemble',
    title: 'Марийский фольклорный ансамбль в национальных костюмах',
    author: 'Ele-chudinovsk',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Марийский_фольклорный_ансамбль_в_национальных_костюмах3.jpg',
    usage: 'История / Годы — народы Малмыжа (марийский ансамбль)',
  },
  {
    slug: 'folk-crowd',
    title: 'Масленица. Йошкар-Ола, 25 февраля 2017',
    author: 'Petr Vasiliev',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Масленица._Йошкар-Ола3._25_фев._2017.jpg',
    usage: 'Как это было — шапка (народный праздник)',
  },
  {
    slug: 'carousel',
    title: 'Tiovivo — Merry-go-round',
    author: 'Spanish Coches',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tiovivo_-_Merry-go-round_(4463223394).jpg',
    usage: 'Галерея — шапка (карусель)',
  },
  {
    slug: 'fireworks',
    title: 'Celebration Fireworks In The Black Night Sky',
    author: 'Uk2108',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Celebration_Fireworks_In_The_Black_Night_Sky.jpg',
    usage: 'Программа — шапка (вечерний фейерверк)',
  },
]
