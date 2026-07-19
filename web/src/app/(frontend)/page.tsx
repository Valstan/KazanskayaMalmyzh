import Link from 'next/link'

import { FEST_THEME, FEST_THEME_NOTE } from '../../lib/site'
import { festivalJsonLd } from '../../lib/seo'
import { HomeHero, Figure } from './_components/Hero'
import { Countdown } from './_components/Countdown'

export const revalidate = 3600

// JSON-LD Event (SEO-пакет #051) — общий билдер lib/seo.ts, на /program тот же
// Event дополнен subEvent из афиши.
const eventJsonLd = festivalJsonLd()

export default function HomePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />

      <HomeHero image="oa-02">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero__logo" src="/decor/logo.png" alt="Логотип Ярмарки Казанской" width={104} height={128} />
        <p className="kicker">Малмыж · Кировская область</p>
        <h1>Ярмарка Казанская</h1>
        <p className="hero__meta">Суббота, 25 июля 2026 · с 9 утра до утра воскресенья</p>
        <p className="hero__theme">
          Тема года — <strong>{FEST_THEME}</strong> · {FEST_THEME_NOTE}
        </p>
        {/* Открытие площадок — 9:00 МСК дня праздника */}
        <Countdown startIso="2026-07-25T09:00:00+03:00" />
        <div className="hero__cta">
          <Link className="btn btn--lg" href="/program">
            Программа праздника
          </Link>
          <Link className="btn btn--lg btn--outline" href="/map">
            Как добраться
          </Link>
        </div>
      </HomeHero>

      <div className="wrap">
        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          <h2>Заходи, честной народ, к нам на ярмаНку!</h2>
          <p className="lead">
            Главный праздник Малмыжского района и день города Малмыжа: с девяти утра субботы до
            утра воскресенья. Карнавальное шествие по теме года, ремёсла, подворья и кухни четырёх
            народов, торговые ряды, вечерняя программа и фейерверк.
          </p>
          <div className="cards">
            <Link className="card" href="/program">
              <h3>Программа</h3>
              <p>Шествие, «Город мастеров», «Этногород», сцена и фейерверк — по часам.</p>
            </Link>
            <Link className="card" href="/history">
              <h3>История</h3>
              <p>Малмыж с 1584 года, Сибирский тракт, купеческие лавки и престольная традиция.</p>
            </Link>
            <Link className="card" href="/years">
              <h3>Как это было</h3>
              <p>Темы карнавала по годам: от «Города мастеров» до «Мы Вятские — люди хватские!».</p>
            </Link>
            <Link className="card" href="/map">
              <h3>Карта праздника</h3>
              <p>Площадки, сцены, маршрут шествия, торговые ряды и парковки.</p>
            </Link>
          </div>
        </section>

        <div className="flourish" aria-hidden />

        <section className="section section--tight">
          <h2>Что вас ждёт</h2>
          <Figure
            image="mari-ensemble"
            alt="Фольклорный ансамбль в национальных костюмах"
            caption="«Этногород»: подворья и костюмы четырёх народов Малмыжа"
            float
          />
          <ul>
            <li>Карнавальное шествие по теме года — визитная карточка праздника.</li>
            <li>«Город мастеров» — выставка-конкурс ремёсел со всей округи и из других регионов.</li>
            <li>«Этногород» — русское, татарское, марийское и удмуртское подворья и национальные кухни.</li>
            <li>«Куштымаш» — марийский фольклорный праздник в программе.</li>
            <li>Торговые ряды — наследие престольной ярмарки.</li>
            <li>Вечерняя программа, ночная дискотека и фейерверк.</li>
          </ul>
          <div className="notice">
            Официальная афиша 2026 года опубликована — расписание по часам на{' '}
            <Link href="/program">странице программы</Link>. Хотите участвовать в карнавале или
            торговле? Телефоны оргкомитета — внизу страницы.
          </div>
        </section>
      </div>

      {/* Полноширинная лента-фон: сцена праздника — логотип на рушниках четырёх народов */}
      <section className="photoband" style={{ backgroundImage: 'url(/decor/etnogorod-banner.jpg)' }}>
        <div className="photoband__inner">
          <p className="kicker">Четыре народа — один праздник</p>
          <h2>Русские · Татары · Марийцы · Удмурты</h2>
          <p>
            Символ ярмарки — на рушниках четырёх народов Малмыжской земли. В «Этногороде» их
            подворья, костюмы и кухни встречаются на одной поляне.
          </p>
          <Link className="btn btn--gold" href="/map">
            Карта праздника →
          </Link>
        </div>
      </section>
    </main>
  )
}
