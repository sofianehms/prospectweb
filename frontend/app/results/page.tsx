import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import type { SearchResult } from '@/app/types/establishment'
import AppShell from '@/app/components/AppShell'
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
    <AppShell>
      <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header bar */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          {/* Location badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{sp.address || 'Résultats'}</span>
          </div>
          {/* Summary badges */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <div style={{ padding: '6px 12px', background: 'var(--accent-d)', border: '1px solid var(--accent-border)', borderRadius: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{data.summary.none} sans site</span>
            </div>
            <div style={{ padding: '6px 12px', background: 'var(--warn-d)', borderRadius: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--warn)' }}>{data.summary.outdated} obsolètes</span>
            </div>
          </div>
        </div>

        {/* Scrollable results area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
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
              <Suspense><RadiusSlider /></Suspense>
              <div className="mb-6"><MapWrapper data={data} /></div>
              <ResultsClient data={data} initialFilters={sp.filters ?? ''} />
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
