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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
