import {
  BarChart2,
  BookOpen,
  Film,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface DashboardNavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  adminOnly?: boolean
  description?: string
}

export const primaryNavItems: DashboardNavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true, description: 'Dashboard summary' },
  { href: '/dashboard/scenarios', label: 'Scenarios', icon: Film, description: 'Create and edit courses' },
  { href: '/dashboard/media', label: 'Media Library', icon: BookOpen, description: 'Manage uploaded assets' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2, description: 'Review learner and course data' },
]

export const adminNavItems: DashboardNavItem[] = [
  { href: '/dashboard/users', label: 'Users', icon: Users, adminOnly: true, description: 'Manage platform users' },
]

export const utilityNavItems: DashboardNavItem[] = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, description: 'Account and platform settings' },
]

export const quickActions: DashboardNavItem[] = [
  { href: '/dashboard/scenarios/new', label: 'New Scenario', icon: PlusCircle, description: 'Start a blank course' },
]

export function isNavItemActive(pathname: string, item: Pick<DashboardNavItem, 'href' | 'exact'>) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function routeTitle(pathname: string) {
  const allItems = [...primaryNavItems, ...adminNavItems, ...utilityNavItems, ...quickActions]
  const exact = allItems.find((item) => pathname === item.href)
  if (exact) return exact.label
  if (pathname.includes('/scenarios/') && pathname.includes('/edit')) return 'Scenario Editor'
  if (pathname === '/dashboard/scenarios/new') return 'New Scenario'
  if (pathname.startsWith('/dashboard/scenarios/')) return 'Scenario Details'
  return 'Dashboard'
}

export function breadcrumbsFor(pathname: string) {
  const crumbs = [{ label: 'Dashboard', href: '/dashboard' }]
  if (pathname === '/dashboard') return crumbs

  const section = [...primaryNavItems, ...adminNavItems, ...utilityNavItems].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )

  if (section) crumbs.push({ label: section.label, href: section.href })
  if (pathname === '/dashboard/scenarios/new') crumbs.push({ label: 'New Scenario', href: pathname })
  if (pathname.includes('/scenarios/') && pathname.includes('/edit')) crumbs.push({ label: 'Editor', href: pathname })

  return crumbs
}
