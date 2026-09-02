import { YEARS, type YearPhoto } from './years'

// Фотографии праздника из фотоархива оргкомитета Ярмарки Казанской (предоставлены
// владельцем сайта). Это собственные снимки организаторов — публикуются с общей
// подписью-атрибуцией. Файлы — web/public/decor/oa-*.jpg (ресайз+сжатие sharp).
export const GALLERY_ATTRIBUTION = 'Фотоархив оргкомитета Ярмарки Казанской'

export type GalleryPhoto = { slug: string; caption: string }

export const GALLERY_2024: GalleryPhoto[] = [
  { slug: 'oa-03', caption: 'Костюмированное шествие у Богоявленского собора' },
  { slug: 'oa-04', caption: 'Делегации с транспарантами на сцене' },
  { slug: 'oa-05', caption: 'Открытие праздника: муфтий и благочинный' },
  { slug: 'oa-07', caption: 'Церемония на сцене с символикой ярмарки' },
  { slug: 'oa-06', caption: 'Концерт на главной сцене' },
  { slug: 'oa-12', caption: 'Чествование лучших — вручение наград' },
  { slug: 'oa-09', caption: 'Организаторы и почётные гости' },
  { slug: 'oa-13', caption: 'Молодёжь Малмыжа на сцене' },
]

// ---------- Галерея историями ----------
// Спека редизайна (design/inbox/19июля2026, §Галерея): «не сеткой, а большими
// историями — люди чаще ищут событие, чем год». История = событие праздника,
// кадры собраны из разных лет: фотоархив оргкомитета (oa-*) + фото летописи
// /years (реестр — lib/years.ts, атрибуция берётся оттуда, не дублируется).

export type StoryPhoto = {
  /** Путь к файлу относительно /public */
  src: string
  alt: string
  caption: string
  year: number
  credit: YearPhoto['credit']
}

export type GalleryStory = {
  slug: string
  title: string
  lead: string
  photos: StoryPhoto[]
}

type StoryRef = { oa: string; caption: string; year: number } | { year: number; src: string }

const STORIES_RAW: { slug: string; title: string; lead: string; refs: StoryRef[] }[] = [
  {
    slug: 'shestvie',
    title: 'Карнавальное шествие',
    lead:
      'Главное действие ярмарки: делегации сёл, школ, предприятий и клубов идут по центральным улицам к стадиону — каждый год под своей темой.',
    refs: [
      { oa: 'oa-03', caption: 'Шествие у Богоявленского собора', year: 2024 },
      { year: 2025, src: 'y2025-1' },
      { year: 2025, src: 'y2025-2' },
      { year: 2023, src: 'y2023-1' },
      { year: 2022, src: 'y2022-1' },
      { year: 2022, src: 'y2022-2' },
      { year: 2016, src: 'y2016-1' },
      { year: 2015, src: 'y2015-1' },
      { year: 2015, src: 'y2015-2' },
      { year: 2011, src: 'y2011-2' },
      { year: 2010, src: 'y2010-1' },
      { year: 2010, src: 'y2010-2' },
    ],
  },
  {
    slug: 'scena',
    title: 'Сцена и открытие',
    lead: 'Открытие на стадионе, приветствия гостей, концерт — то, ради чего шествие приходит к сцене.',
    refs: [
      { oa: 'oa-05', caption: 'Открытие праздника: муфтий и благочинный', year: 2024 },
      { oa: 'oa-07', caption: 'Церемония на сцене с символикой ярмарки', year: 2024 },
      { oa: 'oa-04', caption: 'Делегации с транспарантами на сцене', year: 2024 },
      { oa: 'oa-06', caption: 'Концерт на главной сцене', year: 2024 },
      { oa: 'oa-13', caption: 'Молодёжь Малмыжа на сцене', year: 2024 },
      { year: 2016, src: 'y2016-2' },
      { year: 2011, src: 'y2011-1' },
    ],
  },
  {
    slug: 'mastera',
    title: 'Город мастеров и Этногород',
    lead: 'Ремёсла, подворья, куклы и выставки — тихая половина праздника в парке, куда приходят с детьми.',
    refs: [
      { year: 2013, src: 'y2013-1' },
      { year: 2019, src: 'y2019-1' },
      { year: 2019, src: 'y2019-2' },
      { year: 2013, src: 'y2013-2' },
    ],
  },
  {
    slug: 'nagrady',
    title: 'Награждение и гости',
    lead: 'Итоги карнавала, гран-при делегациям, почётные гости и зрители с плакатами.',
    refs: [
      { oa: 'oa-12', caption: 'Чествование лучших — вручение наград', year: 2024 },
      { oa: 'oa-09', caption: 'Организаторы и почётные гости', year: 2024 },
      { year: 2023, src: 'y2023-2' },
    ],
  },
]

function resolveRef(ref: StoryRef): StoryPhoto | null {
  if ('oa' in ref) {
    return {
      src: `/decor/${ref.oa}.jpg`,
      alt: ref.caption,
      caption: ref.caption,
      year: ref.year,
      credit: { label: GALLERY_ATTRIBUTION, url: null },
    }
  }
  const photo = YEARS.find((y) => y.year === ref.year)?.photos.find((p) => p.src === ref.src)
  if (!photo) return null
  return {
    src: `/years/${photo.src}.jpg`,
    alt: photo.alt,
    caption: photo.caption ?? photo.alt,
    year: ref.year,
    credit: photo.credit,
  }
}

// Ссылки на несуществующие в летописи фото молча выпадают — тест
// galleryPhotos.test.ts проверяет, что таких нет.
export function galleryStories(): GalleryStory[] {
  return STORIES_RAW.map((s) => ({
    slug: s.slug,
    title: s.title,
    lead: s.lead,
    photos: s.refs.map(resolveRef).filter((p): p is StoryPhoto => p !== null),
  }))
}

export function storyRefCount(): number {
  return STORIES_RAW.reduce((n, s) => n + s.refs.length, 0)
}
