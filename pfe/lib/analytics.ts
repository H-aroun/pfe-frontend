import type { ActivityPoint, AnalyticsDashboard, ScenarioStat, ScenarioStatus } from '@/types'

type RawObject = Record<string, unknown>

const statusValues: ScenarioStatus[] = [
  'BROUILLON',
  'EN_COURS_VALIDATION',
  'APPROUVE',
  'EXPORTE',
  'ARCHIVE',
]

const statusAliases: Record<string, ScenarioStatus> = {
  DRAFT: 'BROUILLON',
  PUBLISHED: 'APPROUVE',
  ARCHIVED: 'ARCHIVE',
  brouillon: 'BROUILLON',
  en_cours_validation: 'EN_COURS_VALIDATION',
  approuve: 'APPROUVE',
  exporte: 'EXPORTE',
  archive: 'ARCHIVE',
}

function isObject(value: unknown): value is RawObject {
  return typeof value === 'object' && value !== null
}

function numberFrom(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function optionalNumberFrom(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function stringFrom(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function statusFrom(value: unknown): ScenarioStatus {
  const raw = stringFrom(value)
  const status = (statusAliases[raw] ?? raw.toUpperCase()) as ScenarioStatus
  return statusValues.includes(status) ? status : 'BROUILLON'
}

function arrayFrom(value: unknown): RawObject[] {
  return Array.isArray(value) ? value.filter(isObject) : []
}

function activityPointsFrom(value: unknown): ActivityPoint[] {
  return arrayFrom(value).map((item) => ({
    date: stringFrom(item.date ?? item.day ?? item.label),
    count: numberFrom(item.count ?? item.completions ?? item.attempts),
    completions: optionalNumberFrom(item.completions),
  }))
}

function scenarioStatsFrom(value: unknown): ScenarioStat[] {
  return arrayFrom(value).map((item) => ({
    id: stringFrom(item.id ?? item.scenarioId),
    title: stringFrom(item.title ?? item.titre ?? item.scenarioTitre, 'Untitled scenario'),
    attempts: optionalNumberFrom(item.attempts ?? item.totalAttempts ?? item.totalRapports),
    completions: numberFrom(item.completions ?? item.completed),
    completionRate: optionalNumberFrom(item.completionRate),
    avgScore: numberFrom(item.avgScore ?? item.averageScore),
    avgTime: optionalNumberFrom(item.avgTime ?? item.averageTime ?? item.avgDuration),
    status: statusFrom(item.status ?? item.statut),
    successRate: optionalNumberFrom(item.successRate),
  }))
}

export function normalizeAnalyticsDashboard(data: unknown): AnalyticsDashboard {
  const raw = isObject(data) ? data : {}
  const global = isObject(raw.global) ? raw.global : {}
  const scenariosByStatus = isObject(raw.scenariosByStatus)
    ? raw.scenariosByStatus
    : isObject(global.scenariosByStatus)
      ? global.scenariosByStatus
      : {}

  const readyCount =
    numberFrom(scenariosByStatus.approuve) +
    numberFrom(scenariosByStatus.exporte)
  const draftCount = numberFrom(scenariosByStatus.brouillon)
  const archivedCount = numberFrom(scenariosByStatus.archive)

  return {
    totalScenarios: numberFrom(raw.totalScenarios ?? global.totalScenarios ?? raw.scenariosCount ?? raw.totalScenario),
    publishedScenarios: numberFrom(raw.publishedScenarios ?? raw.publishedCount, readyCount),
    draftScenarios: numberFrom(raw.draftScenarios ?? raw.draftCount, draftCount),
    archivedScenarios: numberFrom(raw.archivedScenarios ?? raw.archivedCount, archivedCount),
    totalUsers: typeof raw.totalUsers === 'number'
      ? raw.totalUsers
      : typeof global.totalUsers === 'number'
        ? global.totalUsers
        : undefined,
    avgCompletionRate: numberFrom(raw.avgCompletionRate ?? raw.completionRate),
    totalAttempts: numberFrom(raw.totalAttempts ?? raw.attempts ?? raw.totalRapports ?? global.totalRapports),
    avgScore: numberFrom(raw.avgScore ?? raw.averageScore ?? global.averageScore),
    recentActivity: activityPointsFrom(raw.recentActivity ?? raw.activity ?? raw.activityTrend ?? raw.recentRapports),
    topScenarios: scenarioStatsFrom(raw.topScenarios ?? raw.scenarioStats ?? raw.scenarios),
  }
}

export function filterActivityByRange(points: ActivityPoint[] = [], days: number) {
  const datedPoints = points.filter((point) => !Number.isNaN(new Date(point.date).getTime()))

  if (!datedPoints.length) return points

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return datedPoints.filter((point) => new Date(point.date).getTime() >= cutoff)
}

export function getScoreDistribution(scenarios: ScenarioStat[] = []) {
  const bins = [
    { range: '0-20', min: 0, max: 20 },
    { range: '21-40', min: 21, max: 40 },
    { range: '41-60', min: 41, max: 60 },
    { range: '61-80', min: 61, max: 80 },
    { range: '81-100', min: 81, max: 100 },
  ]

  return bins.map((bin) => ({
    range: bin.range,
    count: scenarios.filter((scenario) => scenario.avgScore >= bin.min && scenario.avgScore <= bin.max).length,
  }))
}
