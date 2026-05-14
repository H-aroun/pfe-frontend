'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Target, Activity, BarChart2, Film, ChevronRight } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Cell,
} from 'recharts'
import { analyticsApi } from '@/lib/api'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { AnalyticsDashboard, ScenarioStat } from '@/types'

const tooltipStyle = {
  backgroundColor: '#182420',
  border: '1px solid rgba(246,240,230,0.12)',
  borderRadius: '0.75rem',
  color: '#F6F0E6',
  fontSize: 12,
}

const dateRanges = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

const mockTrend = [
  { date: 'Apr 1', completions: 8, attempts: 14 },
  { date: 'Apr 15', completions: 18, attempts: 30 },
  { date: 'Apr 29', completions: 22, attempts: 35 },
  { date: 'May 6', completions: 28, attempts: 40 },
  { date: 'May 13', completions: 32, attempts: 48 },
]

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase mb-0.5">{label}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(30)
  const [drillDown, setDrillDown] = useState<ScenarioStat | null>(null)

  const { data, isLoading } = useQuery<AnalyticsDashboard>({
    queryKey: ['analytics-full', range],
    queryFn: () => analyticsApi.getDashboard().then(r => r.data),
  })

  const stats = (data ?? {}) as AnalyticsDashboard

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform-wide performance overview</p>
        </div>
        <div className="flex gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
          {dateRanges.map(r => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${range === r.value ? 'bg-[#0F6B4A] text-[#FFF8EC]' : 'text-slate-400 hover:text-slate-200'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Film} label="Total Scenarios" value={stats.totalScenarios ?? '—'} color="bg-[#0F6B4A]/18 text-[#83BFA1]" />
            <KpiCard icon={Target} label="Avg Completion" value={`${stats.avgCompletionRate ?? 0}%`} sub="across all scenarios" color="bg-[#0F6B4A]/18 text-[#83BFA1]" />
            <KpiCard icon={Activity} label="Total Attempts" value={stats.totalAttempts ?? '—'} color="bg-[#C6A765]/12 text-[#C6A765]" />
            <KpiCard icon={TrendingUp} label="Avg Score" value={`${stats.avgScore ?? 0}%`} color="bg-[#0F6B4A]/18 text-[#83BFA1]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-200">Completions Over Time</h3>
                <BarChart2 size={15} className="text-slate-500" />
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={mockTrend}>
                    <defs>
                      <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F6B4A" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#0F6B4A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(246,240,230,0.07)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#8E9C93', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#8E9C93', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="completions" stroke="#0F6B4A" fill="url(#compGrad)" strokeWidth={2} dot={false} name="Completions" />
                    <Area type="monotone" dataKey="attempts" stroke="#C6A765" fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Attempts" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-200">Score Distribution</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { range: '0–20', count: 3 }, { range: '21–40', count: 7 },
                    { range: '41–60', count: 12 }, { range: '61–80', count: 18 },
                    { range: '81–100', count: 24 },
                  ]}>
                    <XAxis dataKey="range" tick={{ fill: '#8E9C93', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#8E9C93', fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Learners">
                      {[3, 7, 12, 18, 24].map((_, i) => (
                        <Cell key={i} fill={i >= 3 ? '#0F6B4A' : '#8E9C93'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-200">Per-Scenario Performance</h3>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/6">
                      {['Scenario', 'Status', 'Completions', 'Avg Score', ''].map((h, i) => (
                        <th key={i} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(stats.topScenarios ?? []).map((s: ScenarioStat) => (
                      <tr key={s.id} className="hover:bg-white/2 cursor-pointer group" onClick={() => setDrillDown(s)}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <Film size={13} className="text-[#83BFA1] flex-shrink-0" />
                            <span className="text-slate-200 font-medium truncate max-w-[200px]">{s.title}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4"><StatusBadge status={s.status} /></td>
                        <td className="py-3 pr-4 text-slate-300">{s.completions}</td>
                        <td className="py-3 pr-4">
                          <span className={s.avgScore >= 70 ? 'text-green-400' : 'text-amber-400'}>{s.avgScore}%</span>
                        </td>
                        <td className="py-3 opacity-0 group-hover:opacity-100">
                          <ChevronRight size={14} className="text-slate-500" />
                        </td>
                      </tr>
                    ))}
                    {!stats.topScenarios?.length && (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-600 text-xs">No data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {drillDown && (
        <Modal open onClose={() => setDrillDown(null)} title={drillDown.title} size="md">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Completions', value: drillDown.completions },
              { label: 'Avg Score', value: `${drillDown.avgScore}%` },
              { label: 'Avg Time', value: drillDown.avgTime ? `${drillDown.avgTime}m` : '—' },
              { label: 'Status', value: <StatusBadge status={drillDown.status} /> },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/4 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-200">{value as React.ReactNode}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
