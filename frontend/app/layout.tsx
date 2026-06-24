import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import ThemeToggle from './components/ThemeToggle'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

type Theme = 'sable' | 'violet' | 'minuit' | 'cosmos'
const DARK_THEMES: Theme[] = ['minuit', 'cosmos']

export const metadata: Metadata = {
  title: 'ProspectWeb — Trouvez vos prochains clients',
  description: 'Repérez les commerces sans site web autour de vous, prêts à être prospectés.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store  = await cookies()
  const theme  = (store.get('pw_theme')?.value ?? 'sable') as Theme
  const isDark = DARK_THEMES.includes(theme)

  return (
    <html
      lang="fr"
      className={`${inter.className}${isDark ? ' dark' : ''}`}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-200 pb-20">
        {children}
        <ThemeToggle />
        <footer className="mt-auto py-4 text-center text-xs text-gray-400 dark:text-slate-500">
          <a href="/privacy" className="hover:text-gray-600 dark:hover:text-slate-300 transition underline">Politique de confidentialit&eacute;</a>
        </footer>
      </body>
    </html>
  )
}
