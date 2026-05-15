import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/context/Providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'EduScenario — Pedagogical Platform',
  description: 'Create, manage, and analyze educational scenarios for your learners.',
  keywords: ['education', 'scenarios', 'pedagogy', 'e-learning', 'SCORM'],
}

const themeScript = `
try {
  const theme = localStorage.getItem('edu_theme')
  if (theme === 'dark' || theme === 'light') {
    document.documentElement.dataset.theme = theme
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
} catch {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} antialiased`} cz-shortcut-listen="true">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
