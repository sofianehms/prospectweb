'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { Establishment, SearchResult, WebsiteStatus } from '@/app/types/establishment'
import { distanceTo, formatDistance } from '@/app/types/establishment'
import { useProspects } from '@/app/hooks/useProspects'

type Tab = 'all' | 'none' | 'outdated' | 'not_added'

const BADGE: Record<WebsiteStatus, { label: string; className: string }> = {
  none:     { label: 'Pas de site',   className: 'bg-red-50 text-red-500' },
  outdated: { label: 'Site vieillot', className: 'bg-orange-50 text-orange-500' },
  ok:       { label: 'Site actif',    className: 'bg-green-50 text-green-600' },
}

const TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurant', cafe: 'Café', bar: 'Bar', pub: 'Bar / Pub',
  bakery: 'Boulangerie', pharmacy: 'Pharmacie', hair_salon: 'Coiffeur',
  clothing_store: 'Boutique', hotel: 'Hôtel', gym: 'Salle de sport',
  real_estate_agency: 'Immobilier', car_repair: 'Garagiste',
  beauty_salon: 'Institut beauté', florist: 'Fleuriste',
  convenience: 'Épicerie', laundry: 'Pressing', locksmith: 'Serrurier',
  supermarket: 'Supermarché', dentist: 'Dentiste', doctor: 'Médecin',
  veterinary: 'Vétérinaire', bank: 'Banque', fast_food: 'Restauration rapide',
}

function typeLabel(type: string) {
  return TYPE_LABELS[type] ?? type.replace(/_/g, ' ')
}

const PAGE_SIZE = 10

export default function ResultsClient({ data }: { data: SearchResult }) {
  const { add, remove, isAdded } = useProspects()
  const [tab, setTab]           = useState<Tab>('all')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [visible, setVisible]   = useState(PAGE_SIZE)

  useEffect(() => {
    sessionStorage.setItem('pw_search_results', JSON.stringify(data))
  }, [data])

  // Comptage des prospects (none + outdated) par type — trié par count desc
  const typeOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of data.establishments) {
      if (e.websiteStatus !== 'ok') {
        counts[e.type] = (counts[e.type] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
  }, [data.establishments])

  // Filtrage combiné : onglet statut + type
  const filtered = useMemo(() => data.establishments.filter(e => {
    const matchTab =
      tab === 'none'      ? e.websiteStatus === 'none' :
      tab === 'outdated'  ? e.websiteStatus === 'outdated' :
      tab === 'not_added' ? !isAdded(e.id) :
      true
    const matchType = typeFilter === null || e.type === typeFilter
    return matchTab && matchType
  }), [data.establishments, tab, typeFilter, isAdded])

  const shown     = filtered.slice(0, visible)
  const remaining = filtered.length - shown.length
  const addedCount = data.establishments.filter(e => isAdded(e.id)).length

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all',       label: 'Tous',         count: data.establishments.length },
    { id: 'none',      label: 'Sans site',     count: data.summary.none },
    { id: 'outdated',  label: 'Site vieillot', count: data.summary.outdated },
    { id: 'not_added', label: 'Pas ajouté',    count: data.establishments.length - addedCount },
  ]

  function handleTab(id: Tab) {
    setTab(id)
    setVisible(PAGE_SIZE)
  }

  function handleType(type: string | null) {
    setTypeFilter(type)
    setVisible(PAGE_SIZE)
  }

  function toggle(e: Establishment) {
    isAdded(e.id) ? remove(e.id) : add(e)
  }

  return (
    <>
      {/* Tabs statut */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => handleTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              tab === t.id
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Filtre par type */}
      {typeOptions.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Type d'établissement
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleType(null)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                typeFilter === null
                  ? 'bg-gray-900 dark:bg-slate-100 border-gray-900 dark:border-slate-100 text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500'
              }`}
            >
              Tous les types
            </button>
            {typeOptions.map(([type, count]) => (
              <button
                key={type}
                onClick={() => handleType(typeFilter === type ? null : type)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                  typeFilter === type
                    ? 'bg-gray-900 dark:bg-slate-100 border-gray-900 dark:border-slate-100 text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500'
                }`}
              >
                {typeLabel(type)} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section title */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold tracking-widest text-gray-400 dark:text-slate-500 uppercase">
          Commerces à prospecter
        </p>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {dist} · {typeLabel(e.type)}
                  {e.rating && (
                    <span className="ml-2 flex items-center gap-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
