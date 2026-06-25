import type { Metadata } from 'next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import { cookies } from 'next/headers'
import RouteChrome from './components/RouteChrome'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: 'Nosite — Trouvez vos prochains clients',
  description: 'Repérez les commerces sans site web autour de vous, prêts à être prospectés.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const theme = store.get('pw_theme')?.value ?? 'dark'
  const isDark = theme === 'dark'

  return (
    <html
      lang="fr"
      className={`${dmSans.className} ${spaceGrotesk.variable}${isDark ? ' dark' : ''}`}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
        {children}
        <RouteChrome />
      </body>
    </html>
  )
}
