'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import {
  adminNavItems,
  isNavItemActive,
  primaryNavItems,
  quickActions,
  utilityNavItems,
  type DashboardNavItem,
} from './navConfig'

interface SidebarProps {
  collapsed: boolean
  mobile?: boolean
  onCloseMobile?: () => void
  onToggleCollapsed?: () => void
}

interface NavLinkProps extends DashboardNavItem {
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}

function NavLink({
  href,
  label,
  icon: Icon,
  description,
  active,
  collapsed,
  onNavigate,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center rounded-xl text-sm font-semibold transition-all duration-150',
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
        active
          ? 'bg-[var(--lux-primary)] text-[var(--lux-text-strong)] shadow-[0_12px_28px_rgba(5,12,14,0.24)]'
          : 'text-[var(--lux-muted)] hover:bg-[var(--lux-primary-soft)] hover:text-[var(--lux-text)]',
      )}
    >
      <Icon size={17} className="flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {active && <ChevronRight size={13} className="opacity-70" />}
        </>
      )}
      {collapsed && (
        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--lux-text)] shadow-lg group-hover:block">
          {description ?? label}
        </span>
      )}
    </Link>
  )
}

function NavSection({
  label,
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  label?: string
  items: DashboardNavItem[]
  pathname: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  if (items.length === 0) return null

  return (
    <div className="space-y-1">
      {label && !collapsed && (
        <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--lux-gold)]">
          {label}
        </p>
      )}
      {items.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          active={isNavItemActive(pathname, item)}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        'flex items-center rounded-xl transition-colors hover:bg-[var(--lux-primary-soft)]',
        collapsed ? 'justify-center p-2' : 'gap-2.5 px-2 py-2',
      )}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--lux-primary)]">
        <BookOpen size={16} className="text-[var(--lux-text-strong)]" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-[var(--lux-text)]">EduScenario</p>
          <p className="truncate text-[11px] font-medium text-[var(--lux-muted-soft)]">Course authoring</p>
        </div>
      )}
    </Link>
  )
}

function IconButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string
  icon: LucideIcon
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-xl text-[var(--lux-muted-soft)] transition-colors hover:bg-[var(--lux-primary-soft)] hover:text-[var(--lux-text)]"
    >
      <Icon size={16} />
    </button>
  )
}

export function Sidebar({
  collapsed,
  mobile = false,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname()
  const { user, isAdmin, logout } = useAuth()
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
  const widthClass = collapsed && !mobile ? 'w-[76px]' : 'w-64'

  const handleNavigate = mobile ? onCloseMobile : undefined

  return (
    <aside
      className={cn(
        'flex h-full flex-shrink-0 flex-col overflow-visible border-r border-[var(--lux-line)] bg-[var(--lux-bg)] transition-[width] duration-200',
        widthClass,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--lux-line)] px-3 py-4">
        <BrandMark collapsed={collapsed && !mobile} />
        {mobile ? (
          <IconButton label="Close navigation" icon={X} onClick={onCloseMobile} />
        ) : (
          <IconButton
            label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            icon={collapsed ? PanelLeftOpen : PanelLeftClose}
            onClick={onToggleCollapsed}
          />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-4">
          <NavSection
            items={quickActions}
            pathname={pathname}
            collapsed={collapsed && !mobile}
            onNavigate={handleNavigate}
          />

          <div className="h-px bg-[var(--lux-line)]" />

          <NavSection
            label="Workspace"
            items={primaryNavItems}
            pathname={pathname}
            collapsed={collapsed && !mobile}
            onNavigate={handleNavigate}
          />

          {isAdmin && (
            <>
              <div className="h-px bg-[var(--lux-line)]" />
              <NavSection
                label="Admin"
                items={adminNavItems}
                pathname={pathname}
                collapsed={collapsed && !mobile}
                onNavigate={handleNavigate}
              />
            </>
          )}

          <div className="h-px bg-[var(--lux-line)]" />

          <NavSection
            items={utilityNavItems}
            pathname={pathname}
            collapsed={collapsed && !mobile}
            onNavigate={handleNavigate}
          />
        </div>
      </nav>

      <div className="border-t border-[var(--lux-line)] px-3 py-3">
        <div
          className={cn(
            'flex items-center rounded-xl',
            collapsed && !mobile ? 'justify-center p-1' : 'gap-3 px-2 py-2',
          )}
        >
          <Avatar firstName={user?.firstName} lastName={user?.lastName} size="sm" />
          {(!collapsed || mobile) && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--lux-text)]">{fullName || user?.email}</p>
                <p className="truncate text-xs capitalize text-[var(--lux-muted-soft)]">{user?.role?.toLowerCase()}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="grid h-8 w-8 place-items-center rounded-lg text-[var(--lux-muted-soft)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
