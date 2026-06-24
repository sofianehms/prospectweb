import Link from 'next/link'
import AppHeader from '@/app/components/AppHeader'

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className}`} />
}

export default function ResultsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <AppHeader>
        <Link href="/prospects" className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400">
          Mes prospects
        </Link>
      </AppHeader>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Modifier la recherche
        </div>

        {/* Summary cards skeleton */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-2 sm:px-4 py-4 sm:py-5 text-center">
              <Pulse className="h-8 w-16 mx-auto mb-2" />
              <Pulse className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>

        {/* Map skeleton */}
        <Pulse className="w-full h-64 rounded-xl mb-6" />

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-3 py-8">
          <svg className="animate-spin text-emerald-500" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span className="text-sm text-gray-500 dark:text-slate-400">Recherche en cours, veuillez patienter...</span>
        </div>

        {/* Results list skeleton */}
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-start gap-3">
                <Pulse className="w-10 h-10 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Pulse className="h-4 w-48" />
                  <Pulse className="h-3 w-64" />
                  <Pulse className="h-3 w-32" />
                </div>
                <Pulse className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
