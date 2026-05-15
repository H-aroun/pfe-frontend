'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Film, CheckCircle, Users, TrendingUp,
  Plus, ArrowRight, BarChart2,
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { analyticsApi, scenariosApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { normalizeAnalyticsDashboard } from '@/lib/analytics'
import type { Scenario, AnalyticsDashboard } from '@/types'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
  iconBg: string
}

function StatCard({ icon: Icon, label, value, sub, color, iconBg }: StatCardProps) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}

const customTooltipStyle = {
  backgroundColor: 'var(--lux-surface)',
  border: '1px solid var(--lux-line)',
  borderRadius: '0.75rem',
  color: 'var(--lux-text)',
  fontSize: 12,
}

export default function DashboardPage() {
  const { isAdmin } = useAuth()
  
  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics-dashboard', isAdmin ? 'admin' : 'me'],
    queryFn: () =>
      (isAdmin ? analyticsApi.getDashboard() : analyticsApi.getMyStats())
        .then((r) => normalizeAnalyticsDashboard(r.data)),
  })

  const { data: scenariosData, isLoading: loadingScenarios } = useQuery({
    queryKey: ['scenarios-recent'],
    queryFn: () => scenariosApi.getAll({ limit: 5 }).then((r) => r.data as Scenario[]),
  })

  const stats = analyticsData ?? normalizeAnalyticsDashboard(null)
  const activityData = stats.recentActivity ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back — here&apos;s what&apos;s happening</p>
        </div>
        <Link href="/dashboard/scenarios">
          <Button size="sm" variant="secondary" className="gap-1.5">
            <Plus size={14} /> New Scenario
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      {loadingAnalytics ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Film}
            label="Total Scenarios"
            value={(stats as AnalyticsDashboard).totalScenarios ?? '—'}
            sub={`${(stats as AnalyticsDashboard).publishedScenarios ?? 0} published`}
            color="text-[#83BFA1]"
            iconBg="bg-[#0F6B4A]/18"
          />
          <StatCard
            icon={CheckCircle}
            label="Published"
            value={(stats as AnalyticsDashboard).publishedScenarios ?? '—'}
            sub={`${(stats as AnalyticsDashboard).draftScenarios ?? 0} drafts`}
            color="text-[#83BFA1]"
            iconBg="bg-[#0F6B4A]/18"
          />
          <StatCard
            icon={Users}
            label="Total Users"
            value={(stats as AnalyticsDashboard).totalUsers ?? '—'}
            color="text-[#C6A765]"
            iconBg="bg-[#C6A765]/12"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Completion"
            value={`${(stats as AnalyticsDashboard).avgCompletionRate ?? 0}%`}
            sub={`${(stats as AnalyticsDashboard).totalAttempts ?? 0} total attempts`}
            color="text-[#83BFA1]"
            iconBg="bg-[#0F6B4A]/18"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-200">Activity This Week</h3>
            <BarChart2 size={15} className="text-slate-500" />
          </CardHeader>
          <CardBody>
            {activityData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--lux-primary)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--lux-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'var(--lux-muted-soft)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--lux-muted-soft)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={customTooltipStyle} cursor={{ stroke: 'var(--lux-primary)', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="count" stroke="var(--lux-primary)" fill="url(#actGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-xs text-slate-600">
                No activity data yet
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-200">Scenarios by Status</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { name: 'Draft', value: (stats as AnalyticsDashboard).draftScenarios ?? 0, fill: 'var(--lux-gold)' },
                  { name: 'Published', value: (stats as AnalyticsDashboard).publishedScenarios ?? 0, fill: 'var(--lux-primary)' },
                  { name: 'Archived', value: (stats as AnalyticsDashboard).archivedScenarios ?? 0, fill: 'var(--lux-muted-soft)' },
                ]}
              >
                <XAxis dataKey="name" tick={{ fill: 'var(--lux-muted-soft)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--lux-muted-soft)', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {['var(--lux-gold)', 'var(--lux-primary)', 'var(--lux-muted-soft)'].map((fill, index) => (
                    <Cell key={`cell-${index}`} fill={fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Recent scenarios */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-200">Recent Scenarios</h3>
          <Link href="/dashboard/scenarios" className="flex items-center gap-1 text-xs text-[#83BFA1] hover:text-[#83BFA1] transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        </CardHeader>
        <CardBody className="pt-0">
          {loadingScenarios ? (
            <div className="flex justify-center py-6"><Spinner size="sm" /></div>
          ) : (
            <div className="divide-y divide-white/5">
              {(scenariosData ?? []).slice(0, 5).map((s: Scenario) => (
                <div key={s.id} className="flex items-center justify-between py-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-[#0F6B4A]/18 flex items-center justify-center flex-shrink-0">
                      <Film size={14} className="text-[#83BFA1]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{s.titre ?? s.title}</p>
                      <p className="text-xs text-slate-500">{formatDate(s.dateCreation ?? s.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <StatusBadge status={s.status} />
                    <Link
                      href={`/dashboard/scenarios/${s.id}/edit`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#83BFA1] hover:text-[#83BFA1]"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
              {(!scenariosData || scenariosData.length === 0) && (
                <p className="text-sm text-slate-500 py-6 text-center">No scenarios yet.</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
