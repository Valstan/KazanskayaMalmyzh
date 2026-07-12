// Реестр фотографий, взятых из ВК-пабликов Малмыжского района (через шлюз SARAFAN,
// pool #062). В отличие от свободных фото Commons (lib/imageCredits.ts), это
// событийные снимки самого праздника — публикуем с прямой ссылкой на пост-источник
// и указанием паблика-автора. По запросу автора подпись меняем / фото убираем.
//
// Источник: МБУК «Малмыжский районный Центр культуры и досуга» (РЦКД), ВКонтакте,
// альбом «Ярмарка Казанская 2024 Карнавал».
export type VkCredit = {
  slug: string
  caption: string
  /** Прямая ссылка на фото в ВК */
  source: string
}

export const VK_ALBUM = 'https://vk.com/album-217788511_303714758'
export const VK_GROUP = 'https://vk.com/dk_malmyzh'
export const VK_GROUP_NAME = 'РЦКД Малмыж (ВКонтакте)'

export const VK_CARNIVAL: VkCredit[] = [
  { slug: 'vk-karnaval-01', caption: 'Костюмированное шествие делегаций', source: 'https://vk.com/photo-217788511_457242339' },
  { slug: 'vk-karnaval-05', caption: 'Танец у памятника в центре города', source: 'https://vk.com/photo-217788511_457242335' },
  { slug: 'vk-karnaval-06', caption: 'Народные костюмы и платки', source: 'https://vk.com/photo-217788511_457242329' },
  { slug: 'vk-karnaval-07', caption: 'Театрализованное представление', source: 'https://vk.com/photo-217788511_457242322' },
  { slug: 'vk-karnaval-04', caption: 'Делегации на стадионе', source: 'https://vk.com/photo-217788511_457242337' },
  { slug: 'vk-karnaval-08', caption: 'Карнавальные образы', source: 'https://vk.com/photo-217788511_457242316' },
  { slug: 'vk-karnaval-09', caption: 'Участники шествия', source: 'https://vk.com/photo-217788511_457242311' },
  { slug: 'vk-karnaval-10', caption: 'Тема «Пушкинская карта» — литературные образы', source: 'https://vk.com/photo-217788511_457242300' },
]
