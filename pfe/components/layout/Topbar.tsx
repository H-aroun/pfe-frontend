'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

const titleMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/scenarios': 'Scenarios',
  '/dashboard/media': 'Media Library',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/users': 'User Management',
  '/dashboard/settings': 'Settings',
}

export function Topbar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const getTitle = () => {
    for (const [key, label] of Object.entries(titleMap)) {
      if (pathname === key) return label
    }
    if (pathname.includes('/scenarios/') && pathname.includes('/edit')) return 'Scenario Editor'
    return 'Dashboard'
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--lux-line)] bg-[var(--lux-bg)] backdrop-blur-sm sticky top-0 z-30">
      <h2 className="font-semibold text-[var(--lux-text)] text-[15px]">{getTitle()}</h2>

      <div className="flex items-center gap-2">
        {/* Search hint */}
        <button className="hidden md:flex items-center gap-2 text-xs text-[var(--lux-muted-soft)] bg-[var(--lux-surface-soft)] border border-[var(--lux-line)] rounded-full px-3 h-9 hover:bg-[var(--lux-elevated)] transition-colors">
          <Search size={13} />
          <span>Search…</span>
          <kbd className="ml-1 px-1 py-0.5 rounded text-[10px] bg-white/8 border border-white/10 font-mono">⌘K</kbd>
        </button>

        <ThemeToggle compact />

        {/* Notifications */}
        <button className="h-9 w-9 rounded-full flex items-center justify-center text-[var(--lux-muted)] hover:text-[var(--lux-text)] hover:bg-[var(--lux-primary-soft)] transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--lux-gold)] rounded-full" />
        </button>

        {/* Avatar */}
        <div className="h-8 w-8 rounded-lg overflow-hidden">
          <Avatar firstName={user?.name} size="sm" />
        </div>
      </div>
    </header>
  )
}
