import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { SearchResult } from '@/app/types/establishment'
import AppShell from '@/app/components/AppShell'
import ResultsClient from './components/ResultsClient'
import { typeLabel } from '@/app/lib/typeConfig'
import { backendHeaders } from '@/app/lib/auth'

async function fetchResults(sp: Record<string, string>): Promise<SearchResult> {
  const params = new URLSearchParams({ radius: sp.radius })
  if (sp.types) params.set('types', sp.types)
  if (sp.lat && sp.lng) { params.set('lat', sp.lat); params.set('lng', sp.lng) }
  else params.set('address', sp.address)

  const url = `${process.env.BACKEND_URL ?? 'http://localhost:4000'}/api/search?${params}`
  const res  = await fetch(url, {
    cache: 'no-store',
    headers: await backendHeaders(),
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

  let data: SearchResult | null = null
  let fetchError = ''

  try {
    data = await fetchResults(sp)
  } catch (err) {
    fetchError = (err as Error).message
  }

  const radiusKm   = Math.round(Number(sp.radius) / 1000)
  const typesLabel = sp.types
    ? sp.types.split(',').map(t => typeLabel(t.trim())).filter(Boolean).join(', ')
    : 'Tous les types'

  return (
    <AppShell>
      {fetchError || !data ? (
        <div style={{ padding: '24px 28px' }}>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4 space-y-2">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {fetchError.includes('indisponible') ? 'Service temporairement indisponible' : 'Erreur lors de la recherche'}
            </p>
            <p className="text-sm text-red-600 dark:text-red-300">{fetchError}</p>
            <Link href="/search" className="inline-block text-sm text-emerald-600 underline mt-1">Modifier la recherche et réessayer</Link>
          </div>
        </div>
      ) : (
        <ResultsClient
          data={data}
          address={sp.address || 'Résultats'}
          radiusKm={radiusKm}
          typesLabel={typesLabel}
          initialFilters={sp.filters ?? ''}
        />
      )}
    </AppShell>
  )
}
