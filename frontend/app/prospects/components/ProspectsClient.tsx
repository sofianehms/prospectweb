'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProspects, type CrmStatus, type SavedProspect } from '@/app/hooks/useProspects'
import { track, events } from '@/app/lib/analytics'

// ── Statuts ───────────────────────────────────────────────────────────────────
const STATUS_META: Record<CrmStatus, { label: string; className: string }> = {
  to_contact: { label: 'À contacter',    className: 'border border-emerald-400 text-emerald-600 bg-white' },
  contacted:  { label: 'Contacté',       className: 'border border-blue-300 text-blue-500 bg-white' },
  discussing: { label: 'En discussion',  className: 'border border-blue-400 text-blue-600 bg-blue-50' },
  won:        { label: 'Client gagné ✓', className: 'border border-emerald-500 text-emerald-700 bg-emerald-50' },
  lost:       { label: 'Pas intéressé',  className: 'border border-gray-300 text-gray-400 bg-white' },
}

type FilterTab = 'all' | 'to_contact' | 'in_progress' | 'won' | 'lost'

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',         label: 'Tous'        },
  { id: 'to_contact',  label: 'À contacter' },
  { id: 'in_progress', label: 'En cours'    },
  { id: 'won',         label: 'Gagnés'      },
  { id: 'lost',        label: 'Perdus'      },
]

function matchTab(p: SavedProspect, tab: FilterTab): boolean {
  if (tab === 'all')         return true
  if (tab === 'to_contact')  return p.crmStatus === 'to_contact'
  if (tab === 'in_progress') return p.crmStatus === 'contacted' || p.crmStatus === 'discussing'
  if (tab === 'won')         return p.crmStatus === 'won'
  if (tab === 'lost')        return p.crmStatus === 'lost'
  return true
}

function tabCount(prospects: SavedProspect[], tab: FilterTab): number {
  return prospects.filter(p => matchTab(p, tab)).length
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

function extractCity(address: string): string {
  const parts = address.split(',')
  return parts[parts.length - 1]?.trim() ?? address
}

// ── Composant ─────────────────────────────────────────────────────────────────
export default function ProspectsClient() {
  const { prospects, ready, remove, setStatus, exportCsv } = useProspects()
  const [tab, setTab] = useState<FilterTab>('all')

  if (!ready) {
    return <div className="py-16 text-center text-sm text-gray-400 dark:text-slate-500">Chargement…</div>
  }

  const filtered = prospects.filter(p => matchTab(p, tab))

  return (
    <>
      {/* Titre + export */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Mes prospects</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{prospects.length} contact{prospects.length !== 1 ? 's' : ''} enregistré{prospects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { track(events.EXPORT_CSV, { count: prospects.length }); exportCsv() }}
          disabled={prospects.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exporter CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => {
          const count = tabCount(prospects, t.id)
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                active
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-400'
              }`}
            >
              {t.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            {prospects.length === 0
              ? 'Aucun prospect enregistré. Lancez une recherche et ajoutez des commerces.'
              : 'Aucun prospect dans cette catégorie.'}
          </p>
          {prospects.length === 0 && (
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              Lancer une recherche
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(p => {
            const meta = STATUS_META[p.crmStatus]
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-sm transition"
              >
                {/* Infos */}
                <Link href={`/results/${p.id}`} className="min-w-0 flex-1 group">
                  <p className="font-semibold text-gray-900 dark:text-slate-100 text-[15px] group-hover:text-emerald-600 transition truncate">
                    {p.name}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Ajouté le {formatDate(p.addedAt)} · {extractCity(p.address)}
                  </p>
                </Link>

                {/* Statut + actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={p.crmStatus}
                    onChange={e => setStatus(p.id, e.target.value as CrmStatus)}
                    className={`max-w-[120px] sm:max-w-none px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition ${meta.className}`}
                  >
                    <option value="to_contact">À contacter</option>
                    <option value="contacted">Contacté</option>
                    <option value="discussing">En discussion</option>
                    <option value="won">Client gagné ✓</option>
                    <option value="lost">Pas intéressé</option>
                  </select>

                  <button
                    onClick={() => remove(p.id)}
                    className="p-1.5 text-gray-300 dark:text-slate-600 hover:text-red-400 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="Supprimer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
