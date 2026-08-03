import Link from 'next/link'

import { festivalJsonLd } from '../../lib/seo'
import { HomeHero } from './_components/Hero'

export const revalidate = 3600

const eventJsonLd = festivalJsonLd()

const fairMemories = [
  {
    image: '/decor/oa-03.jpg',
    alt: 'Костюмированное шествие Ярмарки Казанской у Богоявленского собора',
    caption: 'Карнавальное шествие — главная визитная карточка ярмарки',
  },
  {
    image: '/years/y2024-2.jpg',
    alt: 'Гости и участники Ярмарки Казанской 2024 года',
    caption: 'Встреча земляков, соседей и гостей из других районов',
  },
  {
    image: '/decor/oa-06.jpg',
    alt: 'Концерт на главной сцене Ярмарки Казанской',
    caption: 'Музыка, костюмы и ощущение, что весь город стал одной большой сценой',
  },
]

const districtPlaces = [
  {
    image: '/decor/malmyzh-cathedral.jpg',
    alt: 'Богоявленский собор в Малмыже',
    title: 'Исторический Малмыж',
    text: 'Богоявленский собор, старые улицы, купеческие дома, Сибирский тракт и Болтушина гора собираются в неторопливую пешую прогулку.',
  },
  {
    image: '/decor/vyatka-bank.jpg',
    alt: 'Летний берег реки Вятки в Малмыжском районе',
    title: 'Берега Вятки',
    text: 'Юг Кировской области — это вода, высокое небо, поля и леса. Здесь хорошо оставить в расписании время не на «объект», а просто на тишину и свежий воздух.',
  },
  {
    image: '/decor/kurya-backwater.jpg',
    alt: 'Затон Курья с кувшинками в Малмыжском районе',
    title: 'Затоны и лесные дороги',
    text: 'Затон Курья показывает другой темп района: кувшинки, камыши и лес у воды. Для загородных мест лучше заранее уточнять подъезд и состояние дороги.',
  },
  {
    image: '/decor/mitrofanovskaya-church.jpg',
    alt: 'Митрофановская церковь в Малмыже',
    title: 'Тихая архитектура',
    text: 'Митрофановская церковь и историческая застройка напоминают: Малмыж интересен не только в один шумный день, но и в обычное летнее утро.',
  },
]

export default function HomePage() {
  return (
    <main className="page page--home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />

      <HomeHero image="oa-02">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero__logo" src="/decor/logo.png" alt="Логотип Ярмарки Казанской" width={104} height={128} />
        <p className="kicker">Малмыж · вспоминаем ярмарку · ждём 2027 год</p>
        <h1>Ярмарка живёт в памяти. И ждёт нового лета.</h1>
        <p className="hero__meta hero__meta--future">
          В 2026 году праздник не состоялся и перенесён не будет. Дата ярмарки 2027 года пока не объявлена.
        </p>
        <p className="hero__theme">
          А пока — листаем фотолетопись, вспоминаем голоса, костюмы и ремёсла и планируем поездку в Малмыж без спешки.
        </p>
        <div className="hero__cta">
          <Link className="btn btn--lg" href="/years">
            Вспомнить прошлые годы
          </Link>
          <Link className="btn btn--lg btn--outline" href="/history">
            Узнать историю
          </Link>
        </div>
        <figure className="fair-guide fair-guide--hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/decor/guides/years.webp" alt="Скоморох-летописец с фотографиями прошлых ярмарок" />
          <figcaption>Пока нет новой афиши — откроем старые альбомы.</figcaption>
        </figure>
      </HomeHero>

      <div className="wrap home-celebration home-memory">
        <section className="section section--tight home-intro">
          <p className="eyebrow">1584 · купеческая традиция · четыре народа</p>
          <h2>Что такое Ярмарка Казанская</h2>
          <p className="lead">
            Это не просто концерт и не просто торговые ряды. На один день Малмыж собирает вместе карнавальное шествие, мастеров, музыку, кухни и костюмы русских, татар, марийцев и удмуртов. Это день, когда местные показывают свой город таким, каким его любят.
          </p>
          <div className="fair-pillars">
            <article><strong>Шествие</strong><span>Каждому году — своя тема, образы и юмор.</span></article>
            <article><strong>Мастера</strong><span>Ремёсла, ярмарочные ряды и вещи с характером.</span></article>
            <article><strong>Соседство</strong><span>Четыре народа, много гостей и один общий праздник.</span></article>
          </div>
        </section>

        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Из фотолетописи</p>
              <h2>Какой мы её помним</h2>
            </div>
            <Link className="text-link" href="/years">Вся летопись по годам →</Link>
          </div>
          <div className="memory-gallery">
            {fairMemories.map((memory) => (
              <figure className="memory-photo" key={memory.image}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={memory.image} alt={memory.alt} />
                <figcaption>{memory.caption}</figcaption>
              </figure>
            ))}
          </div>
          <p className="memory-note">
            В 2026 году этих сцен не было. Мы не стираем отмену из истории, но и не остаёмся в ней: храним прошлые годы и ждём, когда ярмарочная улица снова зашумит.
          </p>
        </section>

        <div className="flourish" aria-hidden />

        <section className="section section--tight district-section">
          <p className="eyebrow">Приехать не на час, а на два-три дня</p>
          <h2>Ярмарка — повод. Малмыжский район — само путешествие.</h2>
          <p className="lead">
            Когда появится дата 2027 года, не стоит планировать только день праздника. Дайте себе время пройти по старому центру, зайти в музей, увидеть реку и выехать за город — без гонки по точкам.
          </p>
          <div className="district-grid">
            {districtPlaces.map((place) => (
              <article className="district-card" key={place.image}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={place.image} alt={place.alt} />
                <div className="district-card__copy">
                  <h3>{place.title}</h3>
                  <p>{place.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--tight stay-plan" aria-labelledby="stay-plan-title">
          <div>
            <p className="eyebrow">Набросок для будущей поездки</p>
            <h2 id="stay-plan-title">Как провести три дня</h2>
          </div>
          <ol>
            <li><strong>День первый.</strong> Исторический центр, Богоявленский собор, краеведческий музей и вечерняя прогулка.</li>
            <li><strong>День второй.</strong> Ярмарка — когда объявят дату: шествие, мастера, подворья, музыка и торговые ряды.</li>
            <li><strong>День третий.</strong> Выезд к реке или в окрестности. Маршрут, подъезд и доступность мест стоит проверить ближе к поездке.</li>
          </ol>
          <p className="stay-plan__source">
            Малмыжский краеведческий музей проводит городские экскурсионные маршруты и называет среди местных достопримечательностей Богоявленский собор, Болтушину гору, исторический центр и Сибирский тракт.{' '}
            <a href="https://vyatkamuseums.ru/malmyzh/o-muzee.html">Проверить актуальную информацию музея ↗</a>
          </p>
        </section>
      </div>

      <section className="photoband photoband--future" style={{ backgroundImage: 'url(/decor/kurya-backwater.jpg)' }}>
        <div className="photoband__inner">
          <p className="kicker">Лето 2027 — в планы</p>
          <h2>Приезжайте за праздником. Оставайтесь ради Малмыжа.</h2>
          <p>
            Новая дата ещё не объявлена. Когда она появится, мы обновим сайт. А пока можно выбрать любимые годы и набросать маршрут будущей поездки.
          </p>
          <div className="photoband__actions">
            <Link className="btn btn--gold" href="/years">Летопись ярмарок →</Link>
            <Link className="btn btn--outline-light" href="/gallery">Фотогалерея →</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
