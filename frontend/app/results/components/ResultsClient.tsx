'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import type { Establishment, SearchResult, WebsiteStatus } from '@/app/types/establishment'
import { distanceTo, formatDistance } from '@/app/types/establishment'
import { useProspects } from '@/app/hooks/useProspects'

type StatusFilter = 'none' | 'unreachable' | 'outdated' | 'active' | 'not_added'
type SortBy = 'relevance' | 'distance' | 'rating' | 'reviews' | 'alpha'

const SORT_OPTIONS: { id: SortBy; label: string }[] = [
  { id: 'relevance', label: 'Pertinence' },
  { id: 'distance',  label: 'Distance'   },
  { id: 'rating',    label: 'Note Google' },
  { id: 'reviews',   label: 'Popularité'  },
  { id: 'alpha',     label: 'Alphabétique'},
]

const STATUS_SCORE: Record<WebsiteStatus, number> = { none: 0, unreachable: 1, outdated: 2, active: 3 }

const BADGE: Record<WebsiteStatus, { label: string; className: string }> = {
  none:        { label: 'Pas de site',      className: 'bg-red-50 text-red-500' },
  unreachable: { label: 'Site injoignable', className: 'bg-gray-50 text-gray-500' },
  outdated:    { label: 'Site obsolète',    className: 'bg-orange-50 text-orange-500' },
  active:      { label: 'Site actif',       className: 'bg-green-50 text-green-600' },
}

import { typeLabel } from '@/app/lib/typeConfig'

const PAGE_SIZE = 10

// websiteStatus filters use OR logic between them; not_added is AND on top
function applyStatusFilters(
  establishments: Establishment[],
  filters: Set<StatusFilter>,
  isAdded: (id: string) => boolean,
): Establishment[] {
  if (filters.size === 0) return establishments
  const statusPart = new Set(
    [...filters].filter((f): f is WebsiteStatus => f !== 'not_added')
  )
  const hasNotAdded = filters.has('not_added')
  return establishments.filter(e => {
    const matchStatus   = statusPart.size === 0 || statusPart.has(e.websiteStatus)
    const matchNotAdded = !hasNotAdded || !isAdded(e.id)
    return matchStatus && matchNotAdded
  })
}

function parseInitialFilters(raw: string): Set<StatusFilter> {
  if (!raw) return new Set()
  const mapping: Record<string, StatusFilter> = { no_website: 'none', outdated: 'outdated' }
  const set = new Set<StatusFilter>()
  for (const f of raw.split(',')) {
    const mapped = mapping[f.trim()]
    if (mapped) set.add(mapped)
  }
  return set
}

export default function ResultsClient({ data, initialFilters = '' }: { data: SearchResult; initialFilters?: string }) {
  const { add, remove, isAdded } = useProspects()
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(() => parseInitialFilters(initialFilters))
  const [sortBy, setSortBy]               = useState<SortBy>('relevance')
  const [visible, setVisible]             = useState(PAGE_SIZE)

  useEffect(() => {
    sessionStorage.setItem('pw_search_results', JSON.stringify(data))
  }, [data])

  // After status filters, before type filter — used to compute dynamic type counts
  const statusFiltered = useMemo(
    () => applyStatusFilters(data.establishments, statusFilters, isAdded),
    [data.establishments, statusFilters, isAdded]
  )

  const filtered = statusFiltered

  // Sort
  const sorted = useMemo(() => {
    const arr  = [...filtered]
    const dist = (e: Establishment) => distanceTo(data.center, { lat: e.lat, lng: e.lng })
    switch (sortBy) {
      case 'distance': return arr.sort((a, b) => dist(a) - dist(b))
      case 'rating':   return arr.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
      case 'reviews':  return arr.sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0))
      case 'alpha':    return arr.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
      case 'relevance':
      default:
        return arr.sort((a, b) => {
          const s = STATUS_SCORE[a.websiteStatus] - STATUS_SCORE[b.websiteStatus]
          return s !== 0 ? s : dist(a) - dist(b)
        })
    }
  }, [filtered, sortBy, data.center])

  const shown      = sorted.slice(0, visible)
  const remaining  = sorted.length - shown.length
  const addedCount = data.establishments.filter(e => isAdded(e.id)).length

  const STATUS_TABS: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'none',        label: 'Sans site',       count: data.summary.none },
    { id: 'unreachable', label: 'Injoignable',     count: data.summary.unreachable },
    { id: 'outdated',    label: 'Site obsolète',    count: data.summary.outdated },
    { id: 'active',      label: 'Site actif',       count: data.summary.active },
    { id: 'not_added',   label: 'Pas ajouté',       count: data.establishments.length - addedCount },
  ]

  function toggleStatus(f: StatusFilter) {
    setStatusFilters(prev => {
      const next = new Set(prev)
      if (next.has(f)) { next.delete(f) } else { next.add(f) }
      return next
    })
    setVisible(PAGE_SIZE)
  }

  function clearStatus() {
    setStatusFilters(new Set())
    setVisible(PAGE_SIZE)
  }

  function handleSort(s: SortBy) {
    setSortBy(s)
    setVisible(PAGE_SIZE)
  }

  function toggle(e: Establishment) {
    if (isAdded(e.id)) { remove(e.id) } else { add(e) }
  }

  const isAllActive = statusFilters.size === 0

  return (
    <>
      {/* Partial results warning */}
      {data.meta?.partial && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-4 text-sm">
          <p className="font-medium text-amber-700 dark:text-amber-400">Résultats potentiellement incomplets</p>
          <p className="text-amber-600 dark:text-amber-300 mt-1">
            {data.meta.cappedTypes.length > 0 && (
              <>Certains types ont atteint le plafond de résultats ({data.meta.cappedTypes.join(', ')}). </>
            )}
            {data.meta.failedTypes.length > 0 && (
              <>Certains types n&apos;ont pas pu être chargés ({data.meta.failedTypes.join(', ')}). </>
            )}
            Affinez la zone ou sélectionnez des types spécifiques pour une couverture plus complète.
          </p>
        </div>
      )}

      {/* Status filters — multi-select, "Tous" deselects all */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={clearStatus}
          aria-pressed={isAllActive}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
            isAllActive
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500'
          }`}
        >
          Tous ({data.establishments.length})
        </button>
        {STATUS_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => toggleStatus(t.id)}
            aria-pressed={statusFilters.has(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              statusFilters.has(t.id)
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Count + sort */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-xs font-semibold tracking-widest text-gray-400 dark:text-slate-500 uppercase flex-shrink-0">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M3 6h18M7 12h10M11 18h2"/>
          </svg>
          <select
            value={sortBy}
            onChange={e => handleSort(e.target.value as SortBy)}
            aria-label="Trier les résultats"
            className="bg-transparent border-none outline-none text-xs text-gray-600 dark:text-slate-300 cursor-pointer font-medium"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {shown.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm">
            Aucun résultat pour ces filtres.
          </div>
        )}

        {shown.map(e => {
          const dist  = formatDistance(distanceTo(data.center, { lat: e.lat, lng: e.lng }))
          const badge = BADGE[e.websiteStatus]
          const added = isAdded(e.id)

          return (
            <div
              key={e.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-sm transition"
            >
              <Link href={`/results/${e.id}`} className="min-w-0 flex-1 group">
                <p className="font-semibold text-gray-900 dark:text-slate-100 text-[14px] sm:text-[15px] truncate group-hover:text-emerald-600 transition">
                  {e.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 flex items-center gap-1">
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {dist} · {typeLabel(e.type)}
                  {e.rating && (
                    <span className="ml-2 flex items-center gap-0.5">
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      {e.rating.toFixed(1)}
                    </span>
                  )}
                </p>
              </Link>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`hidden sm:inline px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
                <span className="sr-only sm:hidden">{badge.label}</span>
                <button
                  onClick={() => toggle(e)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition ${
                    added
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-gray-400'
                  }`}
                >
                  {added ? '✓ Ajouté' : '+ Ajouter'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load more */}
      {remaining > 0 && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-400 dark:text-slate-500">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
            </svg>
          </div>
          <button
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
          >
            Afficher {remaining} autre{remaining > 1 ? 's' : ''} résultat{remaining > 1 ? 's' : ''} →
          </button>
        </div>
      )}
    </>
  )
}
