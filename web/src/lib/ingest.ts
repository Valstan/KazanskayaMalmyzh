import { randomBytes, timingSafeEqual } from 'crypto'

// Чистая логика приёмника ВК-конвейера, вынесенная из route.ts, чтобы её можно
// было проверить тестами без БД и HTTP. Харвест вМалмыже (их два бага 03.08
// проехали через зелёные lint и typecheck: `draft: false` не публикует —
// состояние берётся из `_status`; флаг publish принимался у любого держателя
// ключа доставки). Ни один не выражается типами — ловится только поведением.

export type LexNode = { [k: string]: unknown; type: string; version: number }

const MAX_VIDEOS = 5

export const RUBRICS = ['festival', 'prep', 'crafts', 'culture', 'history', 'other'] as const
export type Rubric = (typeof RUBRICS)[number]

const textNode = (text: string): LexNode => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  version: 1,
})

const paragraph = (children: LexNode[]): LexNode => ({
  type: 'paragraph',
  direction: null,
  format: '' as const,
  indent: 0,
  version: 1,
  children,
})

// Ссылка на плеер ВК: узел `link` — RichText рендерит его iframe-плеером,
// если URL распознаётся как видео ВКонтакте. Видео не перекладываем (без
// тяжёлых файлов у нас — решение владельца 05.08 для вМалмыже, у нас так же).
const videoParagraph = (url: string, title?: string): LexNode =>
  paragraph([
    textNode('🎬 Видео: '),
    {
      type: 'link',
      direction: null,
      format: '' as const,
      indent: 0,
      version: 3,
      fields: { url, newTab: true, linkType: 'custom' },
      children: [textNode(title?.trim() || 'смотреть во ВКонтакте')],
    },
  ])

// Картинка внутри текста: узел `upload` (схема Payload 3, version 3) —
// ссылается на media-документ, куда приёмник переложил файл из ВК (G230).
const imageNode = (mediaId: number): LexNode => ({
  type: 'upload',
  version: 3,
  format: '' as const,
  id: randomBytes(12).toString('hex'),
  fields: {},
  relationTo: 'media' as const,
  value: mediaId,
})

// Текст + видео + картинки → минимальный lexical richText. Картинки не копятся
// в хвосте, а расставляются между абзацами равномерно; первое медиа — обложка,
// она выводится шапкой поста и в текст не дублируется.
export const buildContent = (text: string, videos: { url: string; title?: string }[], mediaIds: number[] = []) => {
  const paragraphs: LexNode[] = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => paragraph([textNode(line)]))

  const inlineMedia = mediaIds.slice(1)
  const imagesByPos = new Map<number, LexNode[]>()
  if (paragraphs.length && inlineMedia.length) {
    inlineMedia.forEach((id, j) => {
      const pos = Math.min(
        Math.max(Math.ceil(((j + 1) * paragraphs.length) / (inlineMedia.length + 1)) - 1, 0),
        paragraphs.length - 1,
      )
      const bucket = imagesByPos.get(pos) ?? []
      bucket.push(imageNode(id))
      imagesByPos.set(pos, bucket)
    })
  }

  const children: LexNode[] = []
  paragraphs.forEach((p, i) => {
    children.push(p)
    const images = imagesByPos.get(i)
    if (images) children.push(...images)
  })
  for (const video of videos) children.push(videoParagraph(video.url, video.title))

  return {
    root: {
      type: 'root',
      direction: null,
      format: '' as const,
      indent: 0,
      version: 1,
      children,
    },
  }
}

export type IncomingVideo = string | { url: string; title?: string }

export const normalizeVideos = (raw: unknown, warnings: string[]): { url: string; title?: string }[] => {
  if (!Array.isArray(raw)) return []
  const videos: { url: string; title?: string }[] = []
  for (const [index, item] of (raw as IncomingVideo[]).entries()) {
    if (videos.length >= MAX_VIDEOS) {
      warnings.push(`videos truncated to ${MAX_VIDEOS}`)
      break
    }
    const url = typeof item === 'string' ? item : item?.url
    if (!url || !/^https?:\/\//i.test(url)) {
      warnings.push(`video ${index}: invalid url`)
      continue
    }
    videos.push({ url, title: typeof item === 'object' ? item?.title : undefined })
  }
  return videos
}

// Рубрика от классификатора: неизвестный slug — не ошибка (черновик поправит
// редактор), но сигналим в ответе.
export const normalizeRubric = (raw: unknown, warnings: string[]): Rubric | undefined => {
  if (typeof raw !== 'string' || !raw.trim()) return undefined
  const value = raw.trim()
  if ((RUBRICS as readonly string[]).includes(value)) return value as Rubric
  warnings.push(`unknown rubric: ${value}`)
  return undefined
}

// Constant-time сравнение секрета из заголовка с ожидаемым. Пустой env —
// «никого не пускать», а не «пускать всех».
export const secretMatches = (given: string, expected: string | undefined): boolean => {
  if (!expected) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export type PostDataInput = {
  title: string
  text: string
  vkPostId: string
  sourceUrl: string
  publish: boolean
  videos: { url: string; title?: string }[]
  mediaIds: number[]
  date?: string
  publishedAt?: string
  rubric?: Rubric
}

// Тело документа для payload.create/update.
// ⚠️ `_status` — не украшение: при versions.drafts состояние берётся отсюда,
// аргумент `draft` сам по себе не публикует.
export const buildPostData = (input: PostDataInput) => ({
  ...(input.publish ? { _status: 'published' as const } : {}),
  title: input.title,
  date: input.date || undefined,
  // Дата публикации = дата оригинала, если её прислали: иначе хук
  // populatePublishedAt проставит «сегодня», и старая новость выглядела бы свежей.
  publishedAt: input.publishedAt || input.date || undefined,
  rubric: input.rubric,
  content:
    input.text || input.videos.length || input.mediaIds.length
      ? buildContent(input.text, input.videos, input.mediaIds)
      : undefined,
  cover: input.mediaIds[0],
  gallery: input.mediaIds.length ? input.mediaIds : undefined,
  source: { vkPostId: input.vkPostId, sourceUrl: input.sourceUrl },
})
