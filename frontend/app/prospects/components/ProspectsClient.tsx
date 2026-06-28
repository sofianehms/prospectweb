'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useProspects, type CrmStatus, type SavedProspect } from '@/app/hooks/useProspects'
import { typeIcon, typeLabel } from '@/app/lib/typeConfig'
import { track, events } from '@/app/lib/analytics'

// ── Statuts ───────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<CrmStatus, string> = {
  to_contact: 'À contacter',
  contacted:  'Contacté',
  discussing: 'En discussion',
  won:        'Client gagné ✓',
  lost:       'Pas intéressé',
}

const STATUS_STYLE: Record<CrmStatus, React.CSSProperties> = {
  to_contact: { color: 'var(--accent)', borderColor: 'var(--accent-border)', background: 'var(--accent-d)' },
  contacted:  { color: '#3B82F6', borderColor: 'rgba(59,130,246,.35)', background: 'rgba(59,130,246,.08)' },
  discussing: { color: '#7C3AED', borderColor: 'rgba(124,58,237,.3)', background: 'rgba(124,58,237,.08)' },
  won:        { color: 'var(--accent)', borderColor: 'var(--accent-border)', background: 'var(--accent-d)' },
  lost:       { color: 'var(--t3)', borderColor: 'var(--border-b)', background: 'transparent' },
}

const STATUS_ORDER: CrmStatus[] = ['to_contact', 'contacted', 'discussing', 'won', 'lost']

type FilterTab = 'all' | 'to_contact' | 'in_progress' | 'won' | 'lost'

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',         label: 'Tous'        },
  { id: 'to_contact',  label: 'À contacter' },
  { id: 'in_progress', label: 'En cours'    },
  { id: 'won',         label: 'Gagnés'      },
  { id: 'lost',        label: 'Perdus'      },
]

type SortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'status'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc', label: 'Plus récents' },
  { value: 'date_asc',  label: 'Plus anciens' },
  { value: 'name_asc',  label: 'Nom A → Z' },
  { value: 'name_desc', label: 'Nom Z → A' },
  { value: 'status',    label: 'Par statut' },
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
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function sortProspects(list: SavedProspect[], sort: SortKey): SavedProspect[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case 'date_desc': return +new Date(b.addedAt) - +new Date(a.addedAt)
      case 'date_asc':  return +new Date(a.addedAt) - +new Date(b.addedAt)
      case 'name_asc':  return a.name.localeCompare(b.name, 'fr')
      case 'name_desc': return b.name.localeCompare(a.name, 'fr')
      case 'status':    return STATUS_ORDER.indexOf(a.crmStatus) - STATUS_ORDER.indexOf(b.crmStatus)
      default:          return 0
    }
  })
}

// ── Composant ─────────────────────────────────────────────────────────────────
export default function ProspectsClient() {
  const router = useRouter()
  const { prospects, ready, remove, setStatus, exportCsv } = useProspects()
  const [tab, setTab] = useState<FilterTab>('all')
  const [searchQ, setSearchQ] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('date_desc')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  function confirmDelete(p: SavedProspect) {
    remove(p.id)
    setDeletingId(null)
    showToast(`« ${p.name} » supprimé`)
  }

  const q = searchQ.trim().toLowerCase()
  const filtered = sortProspects(prospects, sortBy)
    .filter(p => matchTab(p, tab))
    .filter(p => !q || p.name.toLowerCase().includes(q))

  const isEmpty = filtered.length === 0
  const noProspects = prospects.length === 0

  return (
    <>
      {/* Toast */}
      {toast && <div className="toast-notif" role="status">{toast}</div>}

      {/* Header */}
      <div
        className="pw-page-header flex items-center justify-between gap-4 flex-wrap shrink-0"
        style={{ padding: '22px 32px 18px', borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>
            Mes prospects
          </h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>
            {prospects.length} contact{prospects.length !== 1 ? 's' : ''} enregistré{prospects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { track(events.EXPORT_CSV, { count: prospects.length }); exportCsv() }}
          disabled={prospects.length === 0}
          className="inline-flex items-center gap-2 shrink-0 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border-b)',
            background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--t2)', cursor: 'pointer',
          }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--surface2)' }}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M12 9v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9M7 1v8M4.5 6.5L7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Exporter CSV
        </button>
      </div>

      {/* Controls : tabs + view toggle + search + sort */}
      <div
        className="pw-prospects-controls flex items-center justify-between gap-3 flex-wrap shrink-0"
        style={{ padding: '14px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              className="pw-tab"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label} ({tabCount(prospects, t.id)})
            </button>
          ))}
        </div>

        <div className="pw-prospects-tools flex items-center gap-2">
          {/* View toggle */}
          <div className="flex" style={{ border: '1px solid var(--border-b)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)' }}>
            <button
              onClick={() => setViewMode('list')}
              title="Vue liste"
              aria-pressed={viewMode === 'list'}
              className="flex items-center transition-all duration-150"
              style={{
                padding: '8px 11px', border: 'none', cursor: 'pointer', borderRight: '1px solid var(--border)',
                background: viewMode === 'list' ? 'var(--accent-d)' : 'transparent',
                color: viewMode === 'list' ? 'var(--accent)' : 'var(--t3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Vue grille"
              aria-pressed={viewMode === 'grid'}
              className="flex items-center transition-all duration-150"
              style={{
                padding: '8px 11px', border: 'none', cursor: 'pointer',
                background: viewMode === 'grid' ? 'var(--accent-d)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--accent)' : 'var(--t3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="pointer-events-none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)' }}>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M12 12l-2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              className="pw-search"
              placeholder="Rechercher un prospect…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              aria-label="Rechercher un prospect"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              className="pw-sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              aria-label="Trier les prospects"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="pointer-events-none" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)' }}>
              <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pw-prospects-content flex-1" style={{ padding: '16px 32px 36px' }}>

        {/* Loading skeleton */}
        {!ready ? (
          <div className="flex flex-col gap-[7px]">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 16px' }}>
                <div className="flex-1">
                  <div style={{ width: 160, height: 14, borderRadius: 4, background: 'var(--surface2)', marginBottom: 8 }} />
                  <div style={{ width: 100, height: 10, borderRadius: 4, background: 'var(--surface2)' }} />
                </div>
                <div style={{ width: 90, height: 28, borderRadius: 20, background: 'var(--surface2)' }} />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '64px 32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface2)', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="9" cy="9" r="6" stroke="var(--t3)" strokeWidth="1.5"/><path d="M19 19l-3-3" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', marginBottom: 6 }}>
              {noProspects ? 'Aucun prospect enregistré' : 'Aucun résultat'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--t4)', marginBottom: 20 }}>
              {noProspects
                ? 'Lancez une recherche et ajoutez des commerces.'
                : q
                  ? `Aucun prospect ne correspond à « ${searchQ} ».`
                  : 'Changez de filtre.'}
            </p>
            {noProspects && (
              <Link href="/search" className="inline-flex items-center gap-1.5 btn-accent" style={{ padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700 }}>
                Lancer une recherche
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid view */
          <div className="anim-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
            {filtered.map(p => (
              <div
                key={p.id}
                className="flex flex-col gap-3 transition-colors duration-150"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-b)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 26 }}>{typeIcon(p.type)}</span>
                  <StatusPill p={p} onChange={s => setStatus(p.id, s)} />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 3, lineHeight: 1.3 }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--t4)' }}>Ajouté le {formatDate(p.addedAt)} · {typeLabel(p.type)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => router.push(`/results/${p.id}`)}
                    className="transition-all duration-150"
                    style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--surface2)', border: '1px solid var(--border-b)', color: 'var(--t2)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-d)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border-b)'; e.currentTarget.style.color = 'var(--t2)' }}
                  >
                    Voir
                  </button>
                  <DeleteButton onClick={() => setDeletingId(p.id)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="anim-fade-in flex flex-col gap-[7px]">
            {filtered.map(p => (
              <div key={p.id} className="pw-prospect-row" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {deletingId === p.id ? (
                  /* Inline delete confirm */
                  <div className="flex items-center justify-between gap-3" style={{ padding: '13px 16px', background: 'var(--error-d)', borderLeft: '3px solid var(--error)' }}>
                    <div className="flex items-center gap-[10px] min-w-0">
                      <span style={{ fontSize: 18 }}>{typeIcon(p.type)}</span>
                      <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)' }}>Supprimer « {p.name} » ?</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => confirmDelete(p)} style={{ padding: '6px 14px', borderRadius: 7, background: 'var(--error)', color: 'white', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Supprimer</button>
                      <button onClick={() => setDeletingId(null)} style={{ padding: '6px 14px', borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border-b)', color: 'var(--t2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  /* Normal row */
                  <div className="pw-prospect-row-inner flex items-center gap-3" style={{ padding: '13px 16px' }}>
                    <button
                      onClick={() => router.push(`/results/${p.id}`)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <span className="shrink-0" style={{ fontSize: 20 }}>{typeIcon(p.type)}</span>
                      <div className="min-w-0">
                        <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 1 }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--t4)' }}>Ajouté le {formatDate(p.addedAt)} · {typeLabel(p.type)}</p>
                      </div>
                    </button>
                    <div className="pw-prospect-row-actions flex items-center gap-[10px] shrink-0">
                      <StatusPill p={p} onChange={s => setStatus(p.id, s)} />
                      <DeleteButton onClick={() => setDeletingId(p.id)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Sous-composants ───────────────────────────────────────────────────────────
function StatusPill({ p, onChange }: { p: SavedProspect; onChange: (s: CrmStatus) => void }) {
  return (
    <select
      className="pw-pill"
      style={STATUS_STYLE[p.crmStatus]}
      value={p.crmStatus}
      onChange={e => onChange(e.target.value as CrmStatus)}
      aria-label={`Statut CRM pour ${p.name}`}
    >
      {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
    </select>
  )
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Supprimer"
      aria-label="Supprimer"
      className="flex items-center transition-all duration-150"
      style={{ padding: 7, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t4)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-d)'; e.currentTarget.style.color = 'var(--error)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t4)' }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 2h3M6 6v5M8 6v5M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  )
}
