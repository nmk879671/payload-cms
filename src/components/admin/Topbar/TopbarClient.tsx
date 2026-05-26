'use client'

import {
  Bell,
  ChevronDown,
  Command,
  Globe,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  User as UserIcon,
} from 'lucide-react'
import { useConfig, useLocale, useNav, useTheme, useTranslation } from '@payloadcms/ui'
import { getTranslation } from '@payloadcms/translations'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  userLabel: string
}

type DropdownKey = 'new' | 'user' | 'locale' | null

export const TopbarClient: React.FC<Props> = ({ userLabel }) => {
  const { theme, setTheme } = useTheme()
  const { navOpen, setNavOpen } = useNav()
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const currentLocale = useLocale() as { code: string; label?: string } | undefined
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openMenu, setOpenMenu] = useState<DropdownKey>(null)

  const searchRef = useRef<HTMLInputElement>(null)
  const newRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const localeRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ⌘K = search, Esc = close menus */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') setOpenMenu(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* Click outside closes the open menu */
  useEffect(() => {
    if (!openMenu) return
    const refs: Record<Exclude<DropdownKey, null>, HTMLDivElement | null> = {
      new: newRef.current,
      user: userRef.current,
      locale: localeRef.current,
    }
    const ref = refs[openMenu]
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref && !ref.contains(target)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openMenu])

  const toggleMobileNav = () => setNavOpen(!navOpen)
  const toggleTheme = () => {
    if (!mounted) return
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }
  const toggleMenu = (key: Exclude<DropdownKey, null>) =>
    setOpenMenu((cur) => (cur === key ? null : key))

  const adminRoute = config?.routes?.admin ?? '/admin'
  const accountHref = `${adminRoute}/account`
  const logoutHref = `${adminRoute}/logout`

  /* Eligible-to-create collections: filter out auth-only / hidden */
  const createOptions = (config?.collections ?? [])
    .filter((c: any) => !c.admin?.hidden && c.admin?.disableCreate !== true)
    .slice(0, 8)
    .map((c: any) => ({
      slug: c.slug,
      label:
        typeof c.labels?.singular === 'string'
          ? c.labels.singular
          : c.labels?.singular
            ? getTranslation(c.labels.singular, i18n)
            : c.slug,
    }))

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = searchRef.current?.value.trim()
    if (!v) return
    /* Lightweight cross-collection search: navigate to first collection
       list with the search term applied. */
    const first = createOptions[0]?.slug
    if (first) router.push(`${adminRoute}/collections/${first}?search=${encodeURIComponent(v)}`)
  }

  /* ---- Content locales (from config.localization) ---- */
  const rawLocales = (config as any)?.localization?.locales
  const contentLocales: { code: string; label: string }[] = Array.isArray(rawLocales)
    ? rawLocales.map((l: any) =>
        typeof l === 'string'
          ? { code: l, label: l }
          : { code: l.code, label: typeof l.label === 'string' ? l.label : l.code },
      )
    : []
  const hasLocales = contentLocales.length > 1
  const activeLocaleCode = currentLocale?.code || contentLocales[0]?.code || 'en'
  const activeLocale =
    contentLocales.find((l) => l.code === activeLocaleCode) || contentLocales[0]

  const switchLocale = (code: string) => {
    if (code === activeLocaleCode) {
      setOpenMenu(null)
      return
    }
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('locale', code)
    router.push(`${pathname}?${params.toString()}`)
    setOpenMenu(null)
  }

  return (
    <div className={`mc-topbar ${scrolled ? 'mc-topbar--scrolled' : ''}`}>
      <div className="mc-topbar__left">
        <button
          type="button"
          className="mc-topbar__menu"
          onClick={toggleMobileNav}
          aria-label="Toggle navigation"
        >
          <Menu size={16} />
        </button>

        <div className="mc-topbar__breadcrumb">
          <span className="mc-topbar__crumb mc-topbar__crumb--muted">
            Winnie CMS
          </span>
          <span className="mc-topbar__crumb-sep" aria-hidden>
            /
          </span>
          <span className="mc-topbar__crumb">Admin</span>
        </div>
      </div>

      <form className="mc-topbar__search" onSubmit={onSearchSubmit}>
        <Search size={14} className="mc-topbar__search-icon" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search everything…"
          className="mc-topbar__search-input"
        />
        <kbd className="mc-topbar__search-kbd" aria-hidden>
          <Command size={10} strokeWidth={2.5} />
          <span>K</span>
        </kbd>
      </form>

      <div className="mc-topbar__right">
        {/* ---- New (dropdown) ---- */}
        <div className="mc-topbar__menu-anchor" ref={newRef}>
          <button
            type="button"
            className="mc-topbar__btn mc-topbar__btn--primary"
            title="Quick create"
            onClick={() => toggleMenu('new')}
            aria-haspopup="menu"
            aria-expanded={openMenu === 'new'}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New</span>
          </button>
          {openMenu === 'new' && createOptions.length > 0 && (
            <div className="mc-topbar__dropdown" role="menu">
              <div className="mc-topbar__dropdown-label">Create new</div>
              {createOptions.map((opt) => (
                <Link
                  key={opt.slug}
                  href={`${adminRoute}/collections/${opt.slug}/create`}
                  className="mc-topbar__dropdown-item"
                  onClick={() => setOpenMenu(null)}
                  role="menuitem"
                >
                  <Plus size={13} strokeWidth={2} />
                  <span>{opt.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ---- Content locale switcher ---- */}
        {hasLocales && (
          <div className="mc-topbar__menu-anchor" ref={localeRef}>
            <button
              type="button"
              className="mc-topbar__btn mc-topbar__btn--locale"
              title="Switch content locale"
              onClick={() => toggleMenu('locale')}
              aria-haspopup="menu"
              aria-expanded={openMenu === 'locale'}
            >
              <Globe size={14} strokeWidth={2} />
              <span className="mc-topbar__locale-code">
                {activeLocaleCode.toUpperCase()}
              </span>
              <ChevronDown size={12} strokeWidth={2.5} />
            </button>
            {openMenu === 'locale' && (
              <div className="mc-topbar__dropdown mc-topbar__dropdown--right" role="menu">
                <div className="mc-topbar__dropdown-label">Content locale</div>
                {contentLocales.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    className={`mc-topbar__dropdown-item ${
                      l.code === activeLocaleCode ? 'is-active' : ''
                    }`}
                    onClick={() => switchLocale(l.code)}
                    role="menuitem"
                  >
                    <Globe size={13} strokeWidth={2} />
                    <span className="mc-topbar__dropdown-item-label">{l.label}</span>
                    <span className="mc-topbar__dropdown-item-meta">{l.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- Notifications (placeholder, no system wired) ---- */}
        <button
          type="button"
          className="mc-topbar__btn mc-topbar__btn--icon"
          aria-label="Notifications"
          title="No new notifications"
          disabled
        >
          <Bell size={15} />
        </button>

        {/* ---- Theme toggle ---- */}
        <button
          type="button"
          className="mc-topbar__btn mc-topbar__btn--icon"
          aria-label="Toggle theme"
          title="Toggle theme"
          onClick={toggleTheme}
        >
          {mounted && theme === 'dark' ? (
            <Sun size={15} />
          ) : (
            <Moon size={15} />
          )}
        </button>

        <div className="mc-topbar__divider" aria-hidden />

        {/* ---- User (dropdown) ---- */}
        <div className="mc-topbar__menu-anchor" ref={userRef}>
          <button
            type="button"
            className="mc-topbar__user"
            title={userLabel}
            onClick={() => toggleMenu('user')}
            aria-haspopup="menu"
            aria-expanded={openMenu === 'user'}
          >
            <span className="mc-topbar__user-avatar" aria-hidden>
              {userLabel.slice(0, 1).toUpperCase()}
            </span>
          </button>
          {openMenu === 'user' && (
            <div className="mc-topbar__dropdown mc-topbar__dropdown--right" role="menu">
              <div className="mc-topbar__dropdown-header">
                <div className="mc-topbar__user-avatar mc-topbar__user-avatar--lg" aria-hidden>
                  {userLabel.slice(0, 1).toUpperCase()}
                </div>
                <div className="mc-topbar__dropdown-user">
                  <div className="mc-topbar__dropdown-name">{userLabel}</div>
                  <div className="mc-topbar__dropdown-sub">Signed in</div>
                </div>
              </div>
              <Link
                href={accountHref}
                className="mc-topbar__dropdown-item"
                onClick={() => setOpenMenu(null)}
                role="menuitem"
              >
                <UserIcon size={14} strokeWidth={2} />
                <span>Account</span>
              </Link>
              <Link
                href={logoutHref}
                className="mc-topbar__dropdown-item mc-topbar__dropdown-item--danger"
                onClick={() => setOpenMenu(null)}
                role="menuitem"
              >
                <LogOut size={14} strokeWidth={2} />
                <span>Log out</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
