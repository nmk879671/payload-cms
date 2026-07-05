'use client'

import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  LayoutGrid,
  LogOut,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Table as TableIcon,
  User as UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNav, useTheme } from '@payloadcms/ui'

import { dashboardIcon, iconForGroup, iconForSlug } from './iconMap'

export type NavEntitySerializable = {
  slug: string
  type: 'collection' | 'global'
  label: string
}

export type NavSubgroupSerializable = {
  label: string
  entities: NavEntitySerializable[]
}

export type NavGroupSerializable = {
  label: string
  entities: NavEntitySerializable[]
  subgroups: NavSubgroupSerializable[]
}

type Props = {
  adminRoute: string
  groups: NavGroupSerializable[]
  userLabel: string
  canReview?: boolean
}

const STORAGE_KEY_COLLAPSED = 'mc-nav-collapsed'
const STORAGE_KEY_OPEN_GROUPS = 'mc-nav-open-groups'

const subKey = (group: string, sub: string) => `${group}::${sub}`

const isPathActive = (pathname: string, href: string) =>
  pathname === href ||
  (pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length]))

export const NavClient: React.FC<Props> = ({
  adminRoute,
  groups,
  userLabel,
  canReview = false,
}) => {
  const pathname = usePathname() || '/admin'
  const router = useRouter()
  const { navOpen, setNavOpen } = useNav()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [brandMenuOpen, setBrandMenuOpen] = useState(false)
  const [themeMounted, setThemeMounted] = useState(false)
  const brandRef = useRef<HTMLDivElement>(null)
  const [hydrated, setHydrated] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    groups.forEach((g) => {
      init[g.label] = true
      g.subgroups?.forEach((sub) => {
        init[subKey(g.label, sub.label)] = true
      })
    })
    return init
  })
  const [search, setSearch] = useState('')
  const [isMac, setIsMac] = useState(true)
  const searchRef = useRef<HTMLInputElement>(null)

  /* OS detection for keyboard shortcut hint (⌘ on macOS, Ctrl elsewhere).
     Defaults to mac so SSR + first-paint shows ⌘; corrected on mount. */
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform))
    }
  }, [])

  const modKey = isMac ? '⌘' : 'Ctrl'
  const modKeyDisplay = isMac ? '⌘' : 'Ctrl+'

  /* ---- persistence ---- */
  useEffect(() => {
    try {
      const c = localStorage.getItem(STORAGE_KEY_COLLAPSED)
      if (c) setCollapsed(c === '1')
      const o = localStorage.getItem(STORAGE_KEY_OPEN_GROUPS)
      if (o) {
        const parsed = JSON.parse(o) as Record<string, boolean>
        setOpenGroups((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      /* noop */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, collapsed ? '1' : '0')
    } catch {
      /* noop */
    }
    document.body.classList.toggle('mc-nav-collapsed', collapsed)
  }, [collapsed, hydrated])

  useEffect(() => {
    if (hydrated) {
      document.body.classList.toggle('mc-nav-collapsed', collapsed)
    }
    return () => document.body.classList.remove('mc-nav-collapsed')
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY_OPEN_GROUPS, JSON.stringify(openGroups))
    } catch {
      /* noop */
    }
  }, [openGroups, hydrated])

  /* ---- keyboard: ⌘K to focus search, ⌘B to collapse ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCollapsed(false)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (meta && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setCollapsed((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const dashboardHref = adminRoute
  const dashboardActive = pathname === dashboardHref

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups
    const q = search.trim().toLowerCase()
    const match = (e: NavEntitySerializable) =>
      e.label.toLowerCase().includes(q) || e.slug.toLowerCase().includes(q)

    return groups
      .map((g) => {
        const entities = g.entities.filter(match)
        const subgroups = (g.subgroups || [])
          .map((sub) => ({ ...sub, entities: sub.entities.filter(match) }))
          .filter((sub) => sub.entities.length > 0)
        return { ...g, entities, subgroups }
      })
      .filter((g) => g.entities.length > 0 || g.subgroups.length > 0)
  }, [groups, search])

  const toggleGroup = useCallback((label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }, [])

  const onEntityClick = useCallback(
    (href: string) => {
      router.push(href)
      setNavOpen(false)
    },
    [router, setNavOpen],
  )

  /* Auto-close drawer when route changes (clicking links inside subgroups,
     dashboard pin, etc — those don't go through onEntityClick). */
  useEffect(() => {
    setNavOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  /* Esc closes the drawer on narrow viewports. */
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen, setNavOpen])

  /* Brand quick-menu: click outside / Esc closes */
  useEffect(() => {
    if (!brandMenuOpen) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (brandRef.current && !brandRef.current.contains(target)) {
        setBrandMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBrandMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [brandMenuOpen])

  /* Mark theme as mounted so we render the correct icon (avoids
     hydration-mismatch where SSR doesn't know user's saved theme). */
  useEffect(() => setThemeMounted(true), [])

  const accountHref = `${adminRoute}/account`
  const logoutHref = `${adminRoute}/logout`

  const toggleTheme = () => {
    if (!themeMounted) return
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const renderEntity = (entity: NavEntitySerializable) => {
    const href =
      entity.type === 'collection'
        ? `${adminRoute}/collections/${entity.slug}`
        : `${adminRoute}/globals/${entity.slug}`
    const active = isPathActive(pathname, href)
    const Icon = iconForSlug(entity.slug)
    return (
      <NavLinkRow
        key={entity.slug}
        collapsed={collapsed}
        href={href}
        active={active}
        icon={Icon}
        label={entity.label}
        onNavigate={() => onEntityClick(href)}
      />
    )
  }

  return (
    <>
      {/* Backdrop — only rendered when drawer is open on narrow viewports.
         CSS hides it at >=1200px so it never interferes with desktop. */}
      {navOpen && (
        <div
          className="mc-sidebar__backdrop"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}
      <aside
      className={`mc-sidebar ${collapsed ? 'mc-sidebar--collapsed' : ''} ${navOpen ? 'mc-sidebar--open' : ''}`}
      data-hydrated={hydrated ? 'true' : 'false'}
      aria-label="Primary navigation"
    >
      {/* Brand / workspace + quick menu */}
      <div className="mc-sidebar__brand" ref={brandRef}>
        <div className="mc-sidebar__brand-mark" aria-hidden>
          <Sparkles size={16} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="mc-sidebar__brand-text">
            <div className="mc-sidebar__brand-name">Winnie CMS</div>
            <div className="mc-sidebar__brand-sub">Workspace</div>
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            className={`mc-sidebar__brand-switch ${brandMenuOpen ? 'is-open' : ''}`}
            aria-label="Open quick menu"
            aria-haspopup="menu"
            aria-expanded={brandMenuOpen}
            onClick={() => setBrandMenuOpen((v) => !v)}
          >
            <ChevronDown size={14} />
          </button>
        )}

        {brandMenuOpen && (
          <div className="mc-sidebar__brand-menu" role="menu">
            <div className="mc-sidebar__brand-menu-label">Quick actions</div>

            <button
              type="button"
              className="mc-sidebar__brand-menu-item"
              onClick={() => {
                toggleTheme()
              }}
              role="menuitem"
            >
              {themeMounted && theme === 'dark' ? (
                <Sun size={14} strokeWidth={2} />
              ) : (
                <Moon size={14} strokeWidth={2} />
              )}
              <span className="mc-sidebar__brand-menu-item-label">
                {themeMounted && theme === 'dark' ? 'Light theme' : 'Dark theme'}
              </span>
            </button>

            <Link
              href={accountHref}
              className="mc-sidebar__brand-menu-item"
              onClick={() => setBrandMenuOpen(false)}
              role="menuitem"
            >
              <UserIcon size={14} strokeWidth={2} />
              <span className="mc-sidebar__brand-menu-item-label">Account</span>
            </Link>

            <Link
              href={accountHref}
              className="mc-sidebar__brand-menu-item"
              onClick={() => setBrandMenuOpen(false)}
              role="menuitem"
            >
              <Settings size={14} strokeWidth={2} />
              <span className="mc-sidebar__brand-menu-item-label">Admin UI language</span>
              <span className="mc-sidebar__brand-menu-item-meta">
                set in account
              </span>
            </Link>

            <div className="mc-sidebar__brand-menu-divider" aria-hidden />

            <Link
              href={logoutHref}
              className="mc-sidebar__brand-menu-item mc-sidebar__brand-menu-item--danger"
              onClick={() => setBrandMenuOpen(false)}
              role="menuitem"
            >
              <LogOut size={14} strokeWidth={2} />
              <span className="mc-sidebar__brand-menu-item-label">Sign out</span>
            </Link>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="mc-sidebar__search">
          <Search size={14} className="mc-sidebar__search-icon" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mc-sidebar__search-input"
          />
          <kbd className="mc-sidebar__search-kbd">{modKeyDisplay}K</kbd>
        </div>
      )}

      {/* Scrollable nav body */}
      <div className="mc-sidebar__body">
        {/* Dashboard pinned */}
        <NavLinkRow
          collapsed={collapsed}
          href={dashboardHref}
          active={dashboardActive}
          icon={dashboardIcon}
          label="Dashboard"
        />

        {/* Review Board — three design variants for PM to compare.
           Flat top-level paths so Payload's router doesn't greedy-match
           the cards path against /review-board-table etc. */}
        {canReview && (
          <>
            <NavLinkRow
              collapsed={collapsed}
              href={`${adminRoute}/review-board`}
              active={isPathActive(pathname, `${adminRoute}/review-board`)}
              icon={LayoutGrid}
              label="Review · Cards"
            />
            <NavLinkRow
              collapsed={collapsed}
              href={`${adminRoute}/review-board-table`}
              active={isPathActive(pathname, `${adminRoute}/review-board-table`)}
              icon={TableIcon}
              label="Review · Table"
            />
            <NavLinkRow
              collapsed={collapsed}
              href={`${adminRoute}/review-board-inbox`}
              active={isPathActive(pathname, `${adminRoute}/review-board-inbox`)}
              icon={Inbox}
              label="Review · Inbox"
            />
          </>
        )}

        {/* Groups */}
        {filteredGroups.map((group) => {
          const GroupIcon = iconForGroup(group.label)
          const isOpen = openGroups[group.label] ?? true
          return (
            <div key={group.label} className="mc-group">
              {!collapsed ? (
                <button
                  type="button"
                  className="mc-group__header"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isOpen}
                >
                  <GroupIcon
                    size={13}
                    className="mc-group__header-icon"
                    strokeWidth={2}
                  />
                  <span className="mc-group__header-label">{group.label}</span>
                  <ChevronDown
                    size={13}
                    className={`mc-group__header-chevron ${
                      isOpen ? 'is-open' : ''
                    }`}
                  />
                </button>
              ) : (
                <div
                  className="mc-group__divider"
                  title={group.label}
                  aria-hidden
                />
              )}

              <AnimatePresence initial={false}>
                {(isOpen || collapsed) && (
                  <motion.div
                    key="content"
                    initial={collapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="mc-group__items">
                      {/* Direct entities (no sub-group) */}
                      {group.entities.map(renderEntity)}

                      {/* Sub-groups */}
                      {group.subgroups.map((sub) => {
                        const sk = subKey(group.label, sub.label)
                        const subOpen = openGroups[sk] ?? true
                        return (
                          <div key={sub.label} className="mc-subgroup">
                            {!collapsed ? (
                              <button
                                type="button"
                                className="mc-subgroup__header"
                                onClick={() => toggleGroup(sk)}
                                aria-expanded={subOpen}
                              >
                                <span className="mc-subgroup__header-label">
                                  {sub.label}
                                </span>
                                <ChevronDown
                                  size={11}
                                  className={`mc-subgroup__header-chevron ${
                                    subOpen ? 'is-open' : ''
                                  }`}
                                />
                              </button>
                            ) : (
                              <div
                                className="mc-subgroup__divider"
                                title={sub.label}
                                aria-hidden
                              />
                            )}
                            <AnimatePresence initial={false}>
                              {(subOpen || collapsed) && (
                                <motion.div
                                  key="sub-content"
                                  initial={
                                    collapsed
                                      ? false
                                      : { height: 0, opacity: 0 }
                                  }
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.2,
                                    ease: [0.22, 1, 0.36, 1],
                                  }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div className="mc-subgroup__items">
                                    {sub.entities.map(renderEntity)}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Footer: user + collapse */}
      <div className="mc-sidebar__footer">
        <Link
          href={`${adminRoute}/account`}
          className="mc-sidebar__user"
          title={userLabel}
        >
          <div className="mc-sidebar__user-avatar" aria-hidden>
            {userLabel.slice(0, 1).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="mc-sidebar__user-meta">
              <div className="mc-sidebar__user-name">{userLabel}</div>
              <div className="mc-sidebar__user-role">Account</div>
            </div>
          )}
        </Link>
        <button
          type="button"
          className="mc-sidebar__collapse"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={`${collapsed ? 'Expand' : 'Collapse'} (${modKey}+B)`}
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        </button>
      </div>
    </aside>
    </>
  )
}

/* ============================================================
   Nav link row — shared between Dashboard pin and group items
   ============================================================ */
type RowProps = {
  collapsed: boolean
  href: string
  active: boolean
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
  onNavigate?: () => void
}

const NavLinkRow: React.FC<RowProps> = ({
  collapsed,
  href,
  active,
  icon: Icon,
  label,
  onNavigate,
}) => {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      prefetch={false}
      className={`mc-link ${active ? 'mc-link--active' : ''} ${
        collapsed ? 'mc-link--collapsed' : ''
      }`}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <span className="mc-link__icon" aria-hidden>
        <Icon size={16} strokeWidth={2} />
      </span>
      {!collapsed && <span className="mc-link__label">{label}</span>}
      {active && <span className="mc-link__indicator" aria-hidden />}
    </Link>
  )
}
