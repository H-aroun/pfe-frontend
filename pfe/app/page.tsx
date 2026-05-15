'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Check,
  CheckCircle,
  Layers,
  Library,
  Shield,
  Users,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

const theme = {
  page: 'var(--lux-bg)',
  pageAlt: 'var(--lux-bg-alt)',
  surface: 'var(--lux-surface)',
  surfaceSoft: 'var(--lux-surface-soft)',
  elevated: 'var(--lux-elevated)',
  text: 'var(--lux-text)',
  textStrong: 'var(--lux-text-strong)',
  muted: 'var(--lux-muted)',
  mutedSoft: 'var(--lux-muted-soft)',
  line: 'var(--lux-line)',
  lineStrong: 'var(--lux-line-strong)',
  primary: 'var(--lux-primary)',
  primaryHover: 'var(--lux-primary-hover)',
  primarySoft: 'var(--lux-primary-soft)',
  primaryMuted: 'var(--lux-primary-muted)',
  gold: 'var(--lux-gold)',
  goldSoft: 'var(--lux-gold-soft)',
  shadow: 'var(--lux-shadow)',
} as const

type Theme = typeof theme

const features = [
  {
    icon: Layers,
    title: 'Scenario authoring',
    desc: 'Compose modules, sequences, activities, and evaluations in a clear visual structure.',
  },
  {
    icon: BarChart2,
    title: 'Measured learning',
    desc: 'Follow completion, engagement, and outcomes without leaving the teaching workflow.',
  },
  {
    icon: Users,
    title: 'Collaborative review',
    desc: 'Invite colleagues with precise permissions and keep every scenario moving through approval.',
  },
  {
    icon: Shield,
    title: 'LMS-ready export',
    desc: 'Prepare polished scenarios for SCORM delivery and institutional deployment.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Outline the learning path',
    desc: 'Start with a structured scenario, then shape the sequence around your pedagogy.',
  },
  {
    n: '02',
    title: 'Layer in activities',
    desc: 'Add content, quizzes, files, and supporting resources with a calm editing rhythm.',
  },
  {
    n: '03',
    title: 'Publish with confidence',
    desc: 'Review, share, measure, and export the final learning experience when it is ready.',
  },
]

const metrics = [
  { value: '500+', label: 'Active educators' },
  { value: '12k+', label: 'Scenarios published' },
  { value: '98%', label: 'Satisfaction rate' },
  { value: '40+', label: 'LMS integrations' },
]

function ProductPreview({ theme }: { theme: Theme }) {
  const modules = [
    { label: 'Module 01', active: true },
    { label: 'Sequence A', active: false },
    { label: 'Activity brief', active: false },
    { label: 'Assessment', active: false },
  ]

  return (
    <div
      className="mx-auto w-full max-w-6xl overflow-hidden rounded-[28px] border"
      style={{ backgroundColor: theme.surface, borderColor: theme.line, boxShadow: theme.shadow }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3 sm:px-6"
        style={{ borderColor: theme.line, backgroundColor: theme.surfaceSoft }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.primaryMuted }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.gold }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.primary }} />
        </div>
        <div
          className="hidden h-7 min-w-65 items-center justify-center rounded-full border px-5 text-[11px] sm:flex"
          style={{ borderColor: theme.line, backgroundColor: theme.pageAlt, color: theme.muted }}
        >
          eduscenario.app/dashboard/scenarios
        </div>
        <div className="h-2 w-14 rounded-full" style={{ backgroundColor: theme.line }} />
      </div>

      <div className="grid min-h-90 grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-b p-6 md:border-b-0 md:border-r" style={{ borderColor: theme.line }}>
          <div className="mb-8 flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: theme.primary, color: theme.textStrong }}
            >
              <BookOpen size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: theme.textStrong }}>EduScenario</p>
              <p className="text-xs" style={{ color: theme.muted }}>Course workspace</p>
            </div>
          </div>

          <div className="space-y-3">
            {modules.map(({ label, active }) => (
              <div
                key={label}
                className="min-w-0 items-center gap-3 rounded-xl border px-3 py-3 sm:flex"
                style={{
                  borderColor: active ? theme.primary : theme.line,
                  backgroundColor: active ? theme.primarySoft : theme.surfaceSoft,
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: active ? theme.gold : theme.lineStrong }}
                  />
                  <span className="min-w-0 text-xs font-medium" style={{ color: active ? theme.textStrong : theme.muted }}>
                    {label}
                  </span>
                </div>
                <span className="mt-3 block h-1.5 rounded-full sm:ml-auto sm:mt-0 sm:w-20" style={{ backgroundColor: theme.line }} />
              </div>
            ))}
          </div>
        </aside>

        <div className="p-6 sm:p-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase" style={{ color: theme.gold }}>
                Scenario design
              </p>
              <h3 className="text-2xl font-semibold" style={{ color: theme.textStrong }}>
                Foundations of active learning
              </h3>
            </div>
            <div
              className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
              style={{ borderColor: theme.lineStrong, color: theme.textStrong, backgroundColor: theme.goldSoft }}
            >
              <CheckCircle size={13} style={{ color: theme.gold }} />
              Ready for review
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="rounded-2xl border p-5" style={{ borderColor: theme.line, backgroundColor: theme.pageAlt }}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: theme.textStrong }}>Learning flow</p>
                  <p className="text-xs" style={{ color: theme.muted }}>Four connected activities</p>
                </div>
                <Library size={18} style={{ color: theme.gold }} />
              </div>
              <div className="space-y-4">
                {['Context briefing', 'Collaborative analysis', 'Knowledge check', 'Reflection'].map((item, index) => (
                  <div key={item} className="flex items-center gap-4">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: index === 0 ? theme.primary : theme.elevated,
                        color: index === 0 ? theme.textStrong : theme.muted,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" style={{ color: theme.textStrong }}>{item}</p>
                      <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: theme.line }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${86 - index * 13}%`, backgroundColor: index === 0 ? theme.primary : theme.mutedSoft }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ borderColor: theme.line, backgroundColor: theme.pageAlt }}>
              <p className="mb-4 text-sm font-semibold" style={{ color: theme.textStrong }}>Performance</p>
              <div className="flex h-32 items-end gap-2">
                {[42, 56, 48, 72, 64, 88, 76].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-full"
                    style={{ height: `${height}%`, backgroundColor: index === 5 ? theme.primary : theme.elevated }}
                  />
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-semibold" style={{ color: theme.textStrong }}>73%</p>
                  <p className="text-xs" style={{ color: theme.muted }}>Completion</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold" style={{ color: theme.textStrong }}>4.8</p>
                  <p className="text-xs" style={{ color: theme.muted }}>Avg score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: theme.page, color: theme.text }}
    >
      <header className="relative z-30 border-b transition-colors duration-300" style={{ borderColor: theme.line }}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: theme.primary, color: theme.textStrong }}
            >
              <BookOpen size={17} />
            </div>
            <span className="truncate text-base font-semibold" style={{ color: theme.textStrong }}>
              EduScenario
            </span>
          </Link>

          <nav className="hidden items-center gap-10 text-sm md:flex" style={{ color: theme.muted }}>
            <a href="#features" className="transition-colors" style={{ color: theme.gold }}>Features</a>
            <a href="#method" className="transition-colors hover:opacity-80">Method</a>
            <a href="#outcomes" className="transition-colors hover:opacity-80">Outcomes</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium transition-colors hover:opacity-80 sm:block"
              style={{ color: theme.textStrong }}
            >
              Log in
            </Link>
            <ThemeToggle />
            <Link
              href="/auth/register"
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-[0_12px_30px_rgba(5,12,14,0.22)] transition-colors sm:px-5"
              style={{ backgroundColor: theme.primary, color: theme.textStrong }}
              onMouseEnter={event => { event.currentTarget.style.backgroundColor = theme.primaryHover }}
              onMouseLeave={event => { event.currentTarget.style.backgroundColor = theme.primary }}
            >
              Register <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-6 pb-24 pt-24 sm:pb-32 sm:pt-28 lg:px-10 lg:pb-40">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <div
                className="mb-8 inline-flex max-w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-center text-xs font-semibold leading-5"
                style={{ borderColor: theme.lineStrong, color: theme.textStrong, backgroundColor: theme.goldSoft }}
              >
                <Check size={13} style={{ color: theme.gold }} />
                SCORM export and analytics for modern course teams
              </div>

              <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.08] sm:text-6xl sm:leading-[1.04] lg:text-7xl" style={{ color: theme.textStrong }}>
                Sophisticated learning scenarios, designed with calm precision.
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-lg leading-8" style={{ color: theme.muted }}>
                EduScenario gives educators a refined workspace to plan, publish, and measure structured learning journeys without visual noise.
              </p>

              <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold shadow-[0_14px_36px_rgba(5,12,14,0.24)] transition-colors sm:w-auto"
                  style={{ backgroundColor: theme.primary, color: theme.textStrong }}
                  onMouseEnter={event => { event.currentTarget.style.backgroundColor = theme.primaryHover }}
                  onMouseLeave={event => { event.currentTarget.style.backgroundColor = theme.primary }}
                >
                  Register <ArrowRight size={17} />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex w-full items-center justify-center rounded-full border px-7 py-3.5 text-base font-semibold transition-colors hover:opacity-80 sm:w-auto"
                  style={{ borderColor: theme.line, color: theme.textStrong, backgroundColor: theme.surfaceSoft }}
                >
                  Log in
                </Link>
              </div>
            </div>

            <div className="mt-24">
              <ProductPreview theme={theme} />
            </div>
          </div>
        </section>

        <section id="outcomes" className="px-6 py-28 lg:px-10" style={{ backgroundColor: theme.pageAlt }}>
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 border-y py-14 md:grid-cols-4" style={{ borderColor: theme.line }}>
              {metrics.map(({ value, label }) => (
                <div key={label} className="text-center md:text-left">
                  <p className="text-4xl font-semibold" style={{ color: theme.textStrong }}>{value}</p>
                  <p className="mt-3 text-sm" style={{ color: theme.muted }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-32 sm:py-40 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="mb-5 text-sm font-semibold" style={{ color: theme.gold }}>Features</p>
                <h2 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl" style={{ color: theme.textStrong }}>
                  A restrained workspace for serious learning design.
                </h2>
                <p className="mt-7 max-w-md text-base leading-8" style={{ color: theme.muted }}>
                  Every surface is composed to help teams focus on structure, quality, and measurable learner progress.
                </p>
              </div>

              <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
                {features.map(({ icon: Icon, title, desc }) => (
                  <article key={title} className="border-t pt-7" style={{ borderColor: theme.line }}>
                    <div
                      className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border"
                      style={{ borderColor: theme.primary, color: theme.primaryMuted, backgroundColor: theme.primarySoft }}
                    >
                      <Icon size={18} />
                    </div>
                    <h3 className="text-lg font-semibold" style={{ color: theme.textStrong }}>{title}</h3>
                    <p className="mt-4 text-sm leading-7" style={{ color: theme.muted }}>{desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="method" className="px-6 py-32 sm:py-40 lg:px-10" style={{ backgroundColor: theme.surface }}>
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-5 text-sm font-semibold" style={{ color: theme.gold }}>
                Method
              </p>
              <h2 className="text-4xl font-semibold leading-tight sm:text-5xl" style={{ color: theme.textStrong }}>
                From idea to polished course in three deliberate steps.
              </h2>
            </div>

            <div className="mt-20 grid gap-8 md:grid-cols-3">
              {steps.map(({ n, title, desc }) => (
                <div key={n} className="border-t pt-8" style={{ borderColor: theme.line }}>
                  <p className="mb-10 text-sm font-semibold" style={{ color: theme.gold }}>{n}</p>
                  <h3 className="text-xl font-semibold" style={{ color: theme.textStrong }}>{title}</h3>
                  <p className="mt-5 text-sm leading-7" style={{ color: theme.muted }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-32 sm:py-40 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="mb-8 flex gap-1" aria-label="Five star rating">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} style={{ color: theme.gold }}>
                    <CheckCircle size={18} />
                  </span>
                ))}
              </div>
              <blockquote className="text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: theme.textStrong }}>
                &ldquo;EduScenario made our course design process feel composed, reviewable, and institution-ready.&rdquo;
              </blockquote>
            </div>
            <div className="max-w-xl lg:justify-self-end">
              <p className="text-base leading-8" style={{ color: theme.muted }}>
                The platform brings scenario planning, collaboration, analytics, and export into one elegant workflow for educators who care about clarity.
              </p>
              <div className="mt-10 flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ backgroundColor: theme.primary, color: theme.textStrong }}
                >
                  SD
                </div>
                <div>
                  <p className="font-semibold" style={{ color: theme.textStrong }}>Sarah Dupont</p>
                  <p className="mt-1 text-sm" style={{ color: theme.muted }}>Professor of Education, University of Lyon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-32 lg:px-10">
          <div
            className="mx-auto max-w-7xl rounded-[32px] border px-8 py-16 text-center sm:px-12 sm:py-20"
            style={{ borderColor: theme.line, backgroundColor: theme.surfaceSoft }}
          >
            <h2 className="mx-auto max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl" style={{ color: theme.textStrong }}>
              Build your next learning scenario with more space to think.
            </h2>
            <p className="mx-auto mt-7 max-w-xl text-base leading-8" style={{ color: theme.muted }}>
              Start with a refined authoring workspace and grow into analytics, collaboration, and export when your course is ready.
            </p>
            <Link
              href="/auth/register"
              className="mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold shadow-[0_14px_36px_rgba(5,12,14,0.24)] transition-colors"
              style={{ backgroundColor: theme.primary, color: theme.textStrong }}
              onMouseEnter={event => { event.currentTarget.style.backgroundColor = theme.primaryHover }}
              onMouseLeave={event => { event.currentTarget.style.backgroundColor = theme.primary }}
            >
              Register <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 lg:px-10" style={{ borderColor: theme.line }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 py-10 md:flex-row">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: theme.primary, color: theme.textStrong }}
            >
              <BookOpen size={14} />
            </div>
            <span className="text-sm font-semibold" style={{ color: theme.textStrong }}>EduScenario</span>
          </div>
          <p className="text-xs" style={{ color: theme.muted }}>
            &copy; 2026 EduScenario. Built for educators, by educators.
          </p>
          <div className="flex gap-6 text-xs" style={{ color: theme.muted }}>
            <a href="#" className="transition-colors hover:opacity-80">Privacy</a>
            <a href="#" className="transition-colors hover:opacity-80">Terms</a>
            <a href="#" className="transition-colors hover:opacity-80">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
