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
        <a href="/privacy" className="underline transition hover:text-gray-600 dark:hover:text-slate-300">
          Politique de confidentialit&eacute;
        </a>
      </footer>
    </>
  )
}
