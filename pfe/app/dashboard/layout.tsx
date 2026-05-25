'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { PageLoader } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('dashboard-sidebar') === 'collapsed'
  })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    window.localStorage.setItem('dashboard-sidebar', sidebarCollapsed ? 'collapsed' : 'expanded')
  }, [sidebarCollapsed])

  if (isLoading) return <PageLoader />
  if (!user) return null

  const isScenarioAuthoring =
    pathname === '/dashboard/scenarios/new' ||
    (pathname.startsWith('/dashboard/scenarios/') && pathname.endsWith('/edit'))

  if (isScenarioAuthoring) {
    return (
      <div className="h-screen overflow-hidden bg-white text-black">
        <main className="h-full overflow-y-auto">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--lux-bg)] text-[var(--lux-text)]">
      {/* Sidebar — fixed height, internal scroll */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar
              collapsed={false}
              mobile
              onCloseMobile={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Right column — scrolls independently */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar — stays at top, does not scroll */}
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
          onOpenMobileMenu={() => setMobileNavOpen(true)}
        />

        {/* Page content — scrolls here, not the whole window */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
