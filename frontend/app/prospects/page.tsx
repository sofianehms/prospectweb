import Link from 'next/link'
import AppHeader from '@/app/components/AppHeader'
import ProspectsClient from './components/ProspectsClient'

export default function ProspectsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">

      <AppHeader>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          Nouvelle recherche
        </Link>
      </AppHeader>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <ProspectsClient />
      </main>

    </div>
  )
}
