'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Command,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { cn } from '@/lib/utils'
import {
  adminNavItems,
  breadcrumbsFor,
  primaryNavItems,
  quickActions,
  routeTitle,
  utilityNavItems,
} from './navConfig'

interface TopbarProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onOpenMobileMenu: () => void
}

export function Topbar({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileMenu,
}: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAdmin, logout } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
  const title = routeTitle(pathname)
  const breadcrumbs = breadcrumbsFor(pathname)
  const searchItems = useMemo(
    () => [
      ...quickActions,
      ...primaryNavItems,
      ...(isAdmin ? adminNavItems : []),
      ...utilityNavItems,
    ],
    [isAdmin],
  )
  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return searchItems
    return searchItems.filter((item) =>
      item.label.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term),
    )
  }, [query, searchItems])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setNotificationsOpen(false)
        setAccountOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const goTo = (href: string) => {
    setSearchOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--lux-line)] bg-[var(--lux-bg)]/95 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--lux-muted)] transition-colors hover:bg-[var(--lux-primary-soft)] hover:text-[var(--lux-text)] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-9 w-9 place-items-center rounded-full text-[var(--lux-muted)] transition-colors hover:bg-[var(--lux-primary-soft)] hover:text-[var(--lux-text)] lg:grid"
          aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-bold text-[var(--lux-text)]">{title}</h2>
          <nav className="mt-0.5 hidden items-center gap-1 text-xs text-[var(--lux-muted-soft)] sm:flex">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.href}-${index}`} className="inline-flex items-center gap-1">
                {index > 0 && <ChevronRight size={12} />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="max-w-40 truncate text-[var(--lux-muted)]">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="max-w-32 truncate hover:text-[var(--lux-text)]">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden h-9 items-center gap-2 rounded-full border border-[var(--lux-line)] bg-[var(--lux-surface-soft)] px-3 text-xs text-[var(--lux-muted-soft)] transition-colors hover:bg-[var(--lux-elevated)] hover:text-[var(--lux-text)] md:flex"
        >
          <Search size={13} />
          <span>Search</span>
          <kbd className="ml-1 rounded border border-[var(--lux-line)] bg-[var(--lux-overlay)] px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl K
          </kbd>
        </button>

        <Link
          href="/dashboard/scenarios/new"
          className="hidden h-9 items-center gap-2 rounded-full bg-[var(--lux-primary)] px-3 text-xs font-bold text-[var(--lux-text-strong)] transition-colors hover:bg-[var(--lux-primary-hover)] sm:flex"
        >
          <Plus size={14} />
          New
        </Link>

        <ThemeToggle compact />

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((current) => !current)
              setAccountOpen(false)
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--lux-muted)] transition-colors hover:bg-[var(--lux-primary-soft)] hover:text-[var(--lux-text)]"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--lux-gold)]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-surface)] p-3 shadow-[var(--lux-shadow)]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--lux-text)]">Notifications</p>
                <span className="rounded-full bg-[var(--lux-primary-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--lux-primary-muted)]">Live</span>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl border border-[var(--lux-line)] bg-[var(--lux-overlay)] p-3">
                  <p className="text-sm font-semibold text-[var(--lux-text)]">Autosave is active</p>
                  <p className="mt-0.5 text-xs text-[var(--lux-muted-soft)]">Your scenario edits are saved continuously.</p>
                </div>
                <div className="rounded-xl border border-[var(--lux-line)] bg-[var(--lux-overlay)] p-3">
                  <p className="text-sm font-semibold text-[var(--lux-text)]">SCORM settings ready</p>
                  <p className="mt-0.5 text-xs text-[var(--lux-muted-soft)]">Export options are available from each scenario editor.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setAccountOpen((current) => !current)
              setNotificationsOpen(false)
            }}
            className={cn(
              'flex h-9 items-center rounded-full transition-colors hover:bg-[var(--lux-primary-soft)]',
              accountOpen && 'bg-[var(--lux-primary-soft)]',
            )}
            aria-label="Account menu"
          >
            <Avatar firstName={user?.firstName} lastName={user?.lastName} name={fullName} size="sm" />
          </button>

          {accountOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-surface)] p-2 shadow-[var(--lux-shadow)]">
              <div className="border-b border-[var(--lux-line)] px-3 py-3">
                <p className="truncate text-sm font-bold text-[var(--lux-text)]">{fullName || user?.email}</p>
                <p className="truncate text-xs text-[var(--lux-muted-soft)]">{user?.email}</p>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setAccountOpen(false)}
                className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--lux-muted)] hover:bg-[var(--lux-primary-soft)] hover:text-[var(--lux-text)]"
              >
                <Settings size={15} />
                Settings
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--lux-muted)] hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto mt-16 max-w-xl overflow-hidden rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-surface)] shadow-[var(--lux-shadow)]">
            <div className="flex items-center gap-3 border-b border-[var(--lux-line)] px-4 py-3">
              <Command size={17} className="text-[var(--lux-muted-soft)]" />
              <input
                value={query}
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages and actions"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--lux-text)] outline-none placeholder:text-[var(--lux-muted-soft)]"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-[var(--lux-muted-soft)] hover:bg-[var(--lux-primary-soft)] hover:text-[var(--lux-text)]"
                aria-label="Close search"
              >
                <X size={15} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-[var(--lux-muted-soft)]">No matches found.</p>
              ) : (
                filteredItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => goTo(item.href)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--lux-primary-soft)]"
                    >
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-[var(--lux-primary-soft)] text-[var(--lux-primary-muted)]">
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-[var(--lux-text)]">{item.label}</span>
                        {item.description && (
                          <span className="mt-0.5 block truncate text-xs text-[var(--lux-muted-soft)]">{item.description}</span>
                        )}
                      </span>
                      {pathname === item.href && <CheckCircle2 size={16} className="text-[var(--lux-primary-muted)]" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
