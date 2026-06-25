import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import type { SearchResult } from '@/app/types/establishment'
import AppHeader from '@/app/components/AppHeader'
import ResultsClient from './components/ResultsClient'
import RadiusSlider from './components/RadiusSlider'
import MapWrapper from './components/MapWrapper'

async function fetchResults(sp: Record<string, string>): Promise<SearchResult> {
  const params = new URLSearchParams({ radius: sp.radius })
  if (sp.types) params.set('types', sp.types)
  if (sp.lat && sp.lng) { params.set('lat', sp.lat); params.set('lng', sp.lng) }
  else params.set('address', sp.address)

  const store = await cookies()
  const token = store.get('pw_token')?.value ?? ''

  const url = `${process.env.BACKEND_URL ?? 'http://localhost:4000'}/api/search?${params}`
  const res  = await fetch(url, {
    cache: 'no-store',
    headers: {
      'x-internal-secret': process.env.BACKEND_SECRET ?? '',
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Erreur ${res.status}`)
  }
  return res.json()
}

export default async function ResultsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams
  if (!sp.radius || (!sp.address && (!sp.lat || !sp.lng))) redirect('/search')

  let data: SearchResult
  let fetchError = ''

  try {
    data = await fetchResults(sp)
  } catch (err) {
    fetchError = (err as Error).message
    data = { center: { lat: 0, lng: 0 }, radius: 0, summary: { total: 0, none: 0, unreachable: 0, outdated: 0, active: 0 }, establishments: [] }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">

      <AppHeader>
        <Link href="/prospects" className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Mes prospects
        </Link>
      </AppHeader>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Modifier la recherche
        </Link>

        {fetchError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4 space-y-2">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {fetchError.includes('indisponible') ? 'Service temporairement indisponible' : 'Erreur lors de la recherche'}
            </p>
            <p className="text-sm text-red-600 dark:text-red-300">{fetchError}</p>
            <Link href="/search" className="inline-block text-sm text-emerald-600 underline mt-1">Modifier la recherche et réessayer</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-2 sm:px-4 py-4 sm:py-5 text-center">
                <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">{data.summary.total}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mt-1 leading-tight">Résultats</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-2 sm:px-4 py-4 sm:py-5 text-center">
                <p className="text-xl sm:text-3xl font-bold text-orange-500">{data.summary.none}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mt-1 leading-tight">Sans site</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-2 sm:px-4 py-4 sm:py-5 text-center">
                <p className="text-xl sm:text-3xl font-bold text-amber-500">{data.summary.outdated}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mt-1 leading-tight">Obsolète</p>
              </div>
            </div>

            <Suspense><RadiusSlider /></Suspense>
            <div className="mb-6"><MapWrapper data={data} /></div>
            <ResultsClient data={data} initialFilters={sp.filters ?? ''} />
          </>
        )}
      </main>
    </div>
  )
}
