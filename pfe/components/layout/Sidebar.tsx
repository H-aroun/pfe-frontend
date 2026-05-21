'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen, LayoutDashboard, Film, BarChart2,
  Users, LogOut, ChevronRight, Settings,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/scenarios', label: 'Scenarios', icon: Film },
  { href: '/dashboard/media', label: 'Media Library', icon: BookOpen },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
]

const adminItems = [
  { href: '/dashboard/users', label: 'Users', icon: Users },
]

interface NavLinkProps {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  active: boolean
}

function NavLink({ href, label, icon: Icon, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        active
          ? 'bg-[var(--lux-primary)] text-[var(--lux-text-strong)] shadow-[0_12px_28px_rgba(5,12,14,0.24)]'
          : 'text-[var(--lux-muted)] hover:text-[var(--lux-text)] hover:bg-[var(--lux-primary-soft)]'
      )}
    >
      <Icon size={17} className="flex-shrink-0" />
      {label}
      {active && <ChevronRight size={13} className="ml-auto opacity-60" />}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, isAdmin, logout } = useAuth()
  console.log(user);
  

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-[var(--lux-bg)] border-r border-[var(--lux-line)] h-full overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--lux-line)]">
        <div className="h-8 w-8 rounded-lg bg-[var(--lux-primary)] flex items-center justify-center flex-shrink-0">
          <BookOpen size={15} className="text-[var(--lux-text-strong)]" />
        </div>
        <span className="font-bold text-[var(--lux-text)] text-base">EduScenario</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href, item.exact)}
          />
        ))}

        {isAdmin && (
          <>
            <div className="border-t border-[var(--lux-line)] my-3" />
            <p className="text-[10px] uppercase text-[var(--lux-gold)] font-semibold px-3 mb-1">Admin</p>
            {adminItems.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
              />
            ))}
          </>
        )}

        <div className="border-t border-[var(--lux-line)] my-3" />
        <NavLink
          href="/dashboard/settings"
          label="Settings"
          icon={Settings}
          active={isActive('/dashboard/settings')}
        />
      </nav>

      {/* User profile */}
      <div className="px-3 pb-4 border-t border-[var(--lux-line)] pt-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <Avatar firstName={user?.firstName} lastName={user?.lastName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--lux-text)] truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-[var(--lux-muted-soft)] truncate capitalize">
              {user?.role?.name?.toLowerCase()}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-[var(--lux-muted-soft)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
