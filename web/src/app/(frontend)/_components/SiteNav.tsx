'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

// Навигация шапки (лубок-редизайн): на десктопе — строка ссылок с жёлтым
// подчёркиванием активной, на мобайле — бургер 44×44 и выпадающее меню.
// Меню закрывается при переходе (usePathname) и по Escape.

const NAV = [
  { href: '/', label: 'Главная' },
  { href: '/program', label: 'Программа' },
  { href: '/history', label: 'История' },
  { href: '/years', label: 'Как это было' },
  { href: '/map', label: 'Карта' },
  { href: '/gallery', label: 'Галерея' },
]

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="burger"
        aria-expanded={open}
        aria-controls="site-nav"
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`}>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? 'page' : undefined}
            className={item.href === '/program' ? 'site-nav__cta' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
