import Link from 'next/link'
import type { SearchResult } from '@/app/types/establishment'
import AppShell from '@/app/components/AppShell'
import ResultsClient from './components/ResultsClient'
import SearchHistory from './components/SearchHistory'
import { typeLabel } from '@/app/lib/typeConfig'
import { backendHeaders } from '@/app/lib/auth'

async function fetchResults(sp: Record<string, string>): Promise<SearchResult> {
  const params = new URLSearchParams({ radius: sp.radius })
  if (sp.types) params.set('types', sp.types)
  if (sp.lat && sp.lng) { params.set('lat', sp.lat); params.set('lng', sp.lng); if (sp.address) params.set('address', sp.address) }
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

async function fetchHistoryRecord(id: string): Promise<{ record: { address: string; radius: number; types: string }; results: SearchResult } | null> {
  const url = `${process.env.BACKEND_URL ?? 'http://localhost:4000'}/api/history/${id}`
  const res = await fetch(url, {
    cache: 'no-store',
    headers: await backendHeaders(),
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.results) return null
  return { record: data, results: data.results }
}

export default async function ResultsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams

  // Mode consultation d'une recherche sauvegardée
  if (sp.historyId) {
    const saved = await fetchHistoryRecord(sp.historyId)
    if (!saved) {
      return (
        <AppShell>
          <div style={{ padding: '24px 28px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', marginBottom: 6 }}>Recherche introuvable</p>
              <p style={{ fontSize: 13, color: 'var(--t4)', marginBottom: 20 }}>Les résultats de cette recherche ne sont plus disponibles.</p>
              <Link href="/search" className="inline-flex items-center gap-1.5 btn-accent" style={{ padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700 }}>
                Lancer une nouvelle recherche
              </Link>
            </div>
          </div>
        </AppShell>
      )
    }

    const radiusKm = Math.round(saved.record.radius / 1000)
    const typesLabel = saved.record.types
      ? saved.record.types.split(',').map((t: string) => typeLabel(t.trim())).filter(Boolean).join(', ')
      : 'Tous les types'

    return (
      <AppShell>
        <ResultsClient
          data={saved.results}
          address={saved.record.address || 'Résultats'}
          radiusKm={radiusKm}
          typesLabel={typesLabel}
          initialFilters={sp.filters ?? ''}
        />
      </AppShell>
    )
  }

  const hasSearchParams = sp.radius && (sp.address || (sp.lat && sp.lng))

  if (!hasSearchParams) {
    return (
      <AppShell>
        <SearchHistory />
      </AppShell>
    )
  }

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
