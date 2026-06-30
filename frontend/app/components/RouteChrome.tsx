'use client'

import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

const APP_ROUTES = ['/dashboard', '/search', '/results', '/prospects', '/settings']

export default function RouteChrome() {
  const pathname = usePathname()
  const isAppPage = APP_ROUTES.some(r => pathname.startsWith(r))

  if (isAppPage) return null

  return (
    <>
      <ThemeToggle />
      <footer className="mt-auto py-4 text-center text-xs text-gray-400 dark:text-slate-500">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a href="/privacy" className="underline transition hover:text-gray-600 dark:hover:text-slate-300">Confidentialité</a>
          <a href="/cgu" className="underline transition hover:text-gray-600 dark:hover:text-slate-300">CGU</a>
          <a href="/cgv" className="underline transition hover:text-gray-600 dark:hover:text-slate-300">CGV</a>
          <a href="/mentions-legales" className="underline transition hover:text-gray-600 dark:hover:text-slate-300">Mentions légales</a>
        </nav>
      </footer>
    </>
  )
}
