import type { Metadata } from 'next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import { cookies } from 'next/headers'
import { ClerkProvider } from '@clerk/nextjs'
import { frFR } from '@clerk/localizations'
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
        <ClerkProvider
          localization={frFR}
          appearance={{
            variables: {
              colorPrimary: '#16A34A',
              colorText: isDark ? '#FAFAFA' : '#09090B',
              colorTextSecondary: isDark ? '#A1A1AA' : '#71717A',
              colorBackground: isDark ? '#111115' : '#FFFFFF',
              colorInputBackground: isDark ? '#1C1C22' : '#FFFFFF',
              colorInputText: isDark ? '#FAFAFA' : '#09090B',
              borderRadius: '10px',
              fontFamily: '"DM Sans", sans-serif',
              fontFamilyButtons: '"DM Sans", sans-serif',
            },
            elements: {
              card: 'shadow-xl border border-gray-200 dark:border-slate-700 !bg-white dark:!bg-[#111115]',
              headerTitle: 'font-display !font-bold !tracking-tight',
              headerSubtitle: '!text-gray-500 dark:!text-slate-400',
              socialButtonsBlockButton: '!border-gray-200 dark:!border-slate-700 !rounded-[9px] hover:!bg-gray-50 dark:hover:!bg-slate-800',
              formButtonPrimary: '!rounded-[9px] !font-semibold !shadow-none hover:!opacity-90',
              formFieldInput: '!border-gray-200 dark:!border-slate-700 !rounded-[9px] focus:!border-[var(--accent)] focus:!ring-1 focus:!ring-[var(--accent)]',
              formFieldLabel: '!text-gray-700 dark:!text-slate-300 !font-medium',
              footerActionLink: '!font-semibold',
              dividerLine: '!bg-gray-200 dark:!bg-slate-700',
              dividerText: '!text-gray-400 dark:!text-slate-500',
              identityPreview: '!border-gray-200 dark:!border-slate-700 !rounded-[9px]',
              formFieldSuccessText: '!text-emerald-600',
              alert: '!border-amber-200 dark:!border-amber-700/30 !rounded-xl',
            },
          }}
        >
          {children}
          <RouteChrome />
        </ClerkProvider>
      </body>
    </html>
  )
}
