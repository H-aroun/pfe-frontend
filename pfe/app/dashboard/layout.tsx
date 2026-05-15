'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { PageLoader } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) return <PageLoader />
  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--lux-bg)] text-[var(--lux-text)]">
      {/* Sidebar — fixed height, internal scroll */}
      <Sidebar />

      {/* Right column — scrolls independently */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar — stays at top, does not scroll */}
        <Topbar />

        {/* Page content — scrolls here, not the whole window */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
