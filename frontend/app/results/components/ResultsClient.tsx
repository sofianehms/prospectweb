'use client'

import { useState, useMemo, useEffect, type CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Establishment, SearchResult, WebsiteStatus } from '@/app/types/establishment'
import { distanceTo } from '@/app/types/establishment'
import { typeLabel, typeIcon } from '@/app/lib/typeConfig'
import { useProspects } from '@/app/hooks/useProspects'
import MapWrapper from './MapWrapper'

type ViewMode = 'list' | 'grid' | 'map'
type TabId = 'all' | WebsiteStatus

const STATUS_SCORE: Record<WebsiteStatus, number> = { none: 0, unreachable: 1, outdated: 2, blocked: 3, active: 4 }

const STATUS_META: Record<WebsiteStatus, { short: string; badge: CSSProperties; marker: string }> = {
  none:        { short: 'Pas de site',   marker: 'var(--accent)', badge: { background: 'var(--accent-d)', color: 'var(--accent)', border: '1px solid var(--accent-border)' } },
  outdated:    { short: 'Site obsolète', marker: 'var(--warn)',   badge: { background: 'var(--warn-d)', color: 'var(--warn)', border: '1px solid rgba(217,119,6,.25)' } },
  unreachable: { short: 'Injoignable',   marker: 'var(--t3)',     badge: { background: 'var(--surface2)', color: 'var(--t3)', border: '1px solid var(--border-b)' } },
  blocked:     { short: 'Bloqué',        marker: 'var(--t3)',     badge: { background: 'var(--surface2)', color: 'var(--t3)', border: '1px solid var(--border-b)' } },
  active:      { short: 'Site actif',    marker: 'var(--t3)',     badge: { background: 'var(--surface2)', color: 'var(--t3)', border: '1px solid var(--border-b)' } },
}

const TAB_ORDER: WebsiteStatus[] = ['none', 'outdated', 'unreachable', 'blocked', 'active']

const badgeBase: CSSProperties = {
  display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
}

const PAGE_SIZE = 20

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: checked ? '1.5px solid var(--accent)' : '1.5px solid var(--border-b)',
        background: checked ? 'var(--accent)' : 'var(--surface)',
        transition: 'all .15s',
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </div>
  )
}

function MetaLine({ e }: { e: Establishment }) {
  return (
    <p style={{ fontSize: 12, color: 'var(--t3)' }}>
      {e.rating != null && <>⭐ {e.rating.toFixed(1)}{e.ratingCount != null && ` · ${e.ratingCount} avis`} · </>}
      {typeLabel(e.type)}
    </p>
  )
}

export default function ResultsClient({
  data, address, radiusKm, typesLabel, initialFilters = '',
}: {
  data: SearchResult
  address: string
  radiusKm: number
  typesLabel: string
  initialFilters?: string
}) {
  const router = useRouter()
  const { add, remove, isAdded } = useProspects()

  const initialTab: TabId =
    initialFilters.includes('no_website') ? 'none'
    : initialFilters.includes('outdated') ? 'outdated'
    : 'all'

  const [activeTab, setActiveTab]   = useState<TabId>(initialTab)
  const [viewMode, setViewMode]     = useState<ViewMode>('list')
  const [selectedIds, setSelected]  = useState<string[]>([])
  const [visible, setVisible]       = useState(PAGE_SIZE)

  useEffect(() => {
    sessionStorage.setItem('pw_search_results', JSON.stringify(data))
  }, [data])

  const counts = useMemo(() => {
    const c = { none: 0, unreachable: 0, outdated: 0, blocked: 0, active: 0 } as Record<WebsiteStatus, number>
    for (const e of data.establishments) c[e.websiteStatus]++
    return c
  }, [data.establishments])

  const total = data.establishments.length

  const sorted = useMemo(() => {
    return [...data.establishments].sort((a, b) => {
      const s = STATUS_SCORE[a.websiteStatus] - STATUS_SCORE[b.websiteStatus]
      if (s !== 0) return s
      return distanceTo(data.center, { lat: a.lat, lng: a.lng }) - distanceTo(data.center, { lat: b.lat, lng: b.lng })
    })
  }, [data.establishments, data.center])

  const filtered = useMemo(
    () => (activeTab === 'all' ? sorted : sorted.filter(e => e.websiteStatus === activeTab)),
    [sorted, activeTab],
  )

  const shown     = filtered.slice(0, visible)
  const remaining = filtered.length - shown.length

  const filteredIds   = filtered.map(e => e.id)
  const selInFiltered = selectedIds.filter(id => filteredIds.includes(id))
  const allSelected   = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id))

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: `Tous (${total})` },
    ...TAB_ORDER.filter(s => counts[s] > 0).map(s => ({ id: s, label: `${STATUS_META[s].short} (${counts[s]})` })),
  ]

  function selectTab(id: TabId) {
    setActiveTab(id)
    setSelected([])
    setVisible(PAGE_SIZE)
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleSelectAll() {
    setSelected(allSelected ? [] : filteredIds)
  }

  function toggleAdd(e: Establishment) {
    if (isAdded(e.id)) remove(e.id)
    else add(e)
  }

  function bulkAdd() {
    for (const id of selInFiltered) {
      const e = data.establishments.find(x => x.id === id)
      if (e && !isAdded(e.id)) add(e)
    }
    setSelected([])
  }

  function goToDetail(id: string) {
    router.push(`/results/${id}`)
  }

  const viewToggle: { id: ViewMode; title: string; icon: React.ReactNode }[] = [
    { id: 'list', title: 'Vue liste', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg> },
    { id: 'grid', title: 'Vue grille', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /></svg> },
    { id: 'map', title: 'Vue carte', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1C5.07 1 3.5 2.57 3.5 4.5 3.5 7.5 7 12 7 12S10.5 7.5 10.5 4.5C10.5 2.57 8.93 1 7 1z" stroke="currentColor" strokeWidth="1.3" /><circle cx="7" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" /></svg> },
  ]

  return (
    <div className="pw-results" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="pw-results-header" style={{ padding: '18px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1C5.07 1 3.5 2.57 3.5 4.5 3.5 7.5 7 12 7 12S10.5 7.5 10.5 4.5C10.5 2.57 8.93 1 7 1z" fill="var(--accent)" opacity=".8" /><circle cx="7" cy="4.5" r="1.8" fill="var(--surface)" /></svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{address} · {radiusKm} km</span>
            <span style={{ color: 'var(--t4)' }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--t3)' }}>{typesLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{counts.none} sans site</span>
            <span style={{ color: 'var(--t4)' }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn)' }}>{counts.outdated} obsolètes</span>
            <span style={{ color: 'var(--t4)' }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--t3)' }}>{total} au total</span>
          </div>
        </div>
        <div className="pw-results-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-b)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)' }}>
            {viewToggle.map((v, i) => {
              const on = viewMode === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  title={v.title}
                  aria-label={v.title}
                  aria-pressed={on}
                  style={{
                    padding: '8px 11px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    transition: 'all .15s', borderRight: i < viewToggle.length - 1 ? '1px solid var(--border)' : 'none',
                    background: on ? 'var(--accent-d)' : 'transparent',
                    color: on ? 'var(--accent)' : 'var(--t3)',
                  }}
                >
                  {v.icon}
                </button>
              )
            })}
          </div>
          <Link href="/results" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border-b)', color: 'var(--t2)', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all .15s' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M2 6.5h9M2 10h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            Recherches récentes
          </Link>
          <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 13, fontWeight: 700 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="var(--on-accent)" strokeWidth="1.4" /><path d="M12 12l-2-2" stroke="var(--on-accent)" strokeWidth="1.4" strokeLinecap="round" /></svg>
            Modifier la recherche
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="pw-results-filters" style={{ padding: '12px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tabs.map(t => {
            const on = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => selectTab(t.id)}
                aria-pressed={on}
                style={{
                  padding: '7px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                  fontWeight: on ? 600 : 500,
                  border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border-b)'}`,
                  background: on ? 'var(--accent-d)' : 'var(--surface)',
                  color: on ? 'var(--accent)' : 'var(--t3)',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        {selInFiltered.length > 0 && (
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>{selInFiltered.length} sélectionné(s)</span>
        )}
      </div>

      {/* Partial results warning */}
      {data.meta?.partial && viewMode !== 'map' && (
        <div style={{ margin: '12px 28px 0', padding: '12px 14px', borderRadius: 12, fontSize: 13, background: 'var(--warn-d)', border: '1px solid rgba(217,119,6,.25)', color: 'var(--warn)' }}>
          <p style={{ fontWeight: 600 }}>Résultats potentiellement incomplets</p>
          <p style={{ marginTop: 4, opacity: .9 }}>Affinez la zone ou sélectionnez des types spécifiques pour une couverture plus complète.</p>
        </div>
      )}

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapWrapper data={data} establishments={filtered} fullHeight />
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="pw-results-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 80px' }}>
          <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {/* Select all */}
            {filtered.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 8px' }}>
                <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }} aria-label="Tout sélectionner">
                  <Checkbox checked={allSelected} />
                </button>
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                  {allSelected ? 'Tout désélectionner' : `Sélectionner les ${filtered.length} résultats`}
                </span>
              </div>
            )}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--t4)', fontSize: 14 }}>Aucun résultat pour ce filtre.</div>
            )}

            {shown.map(e => {
              const sel = selectedIds.includes(e.id)
              const added = isAdded(e.id)
              const meta = STATUS_META[e.websiteStatus]
              return (
                <div
                  key={e.id}
                  className="pw-result-row"
                  style={{
                    background: sel ? 'var(--accent-s)' : 'var(--surface)',
                    border: `1px solid ${sel ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'border-color .15s, background .1s',
                  }}
                >
                  <button onClick={() => toggleSelect(e.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }} aria-label={sel ? 'Désélectionner' : 'Sélectionner'}>
                    <Checkbox checked={sel} />
                  </button>
                  <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>{typeIcon(e.type)}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{e.name}</p>
                    <MetaLine e={e} />
                    <p style={{ fontSize: 12, color: 'var(--t4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.address}</p>
                  </div>
                  <div className="pw-result-row-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ ...badgeBase, ...meta.badge }} className="hidden sm:inline-flex">{meta.short}</span>
                    <button onClick={() => goToDetail(e.id)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--surface2)', border: '1px solid var(--border-b)', color: 'var(--t2)', whiteSpace: 'nowrap', transition: 'all .15s' }}>Voir</button>
                    <button onClick={() => toggleAdd(e)} style={addBtnStyle(added)}>{added ? '✓ Ajouté' : '+ Ajouter'}</button>
                  </div>
                </div>
              )
            })}

            {remaining > 0 && (
              <button onClick={() => setVisible(v => v + PAGE_SIZE)} style={{ marginTop: 16, alignSelf: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
                Afficher {remaining} autre{remaining > 1 ? 's' : ''} résultat{remaining > 1 ? 's' : ''} →
              </button>
            )}
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="pw-results-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 80px' }}>
          <div className="anim-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: 'var(--t4)', fontSize: 14 }}>Aucun résultat pour ce filtre.</div>
            )}
            {shown.map(e => {
              const added = isAdded(e.id)
              const meta = STATUS_META[e.websiteStatus]
              return (
                <div key={e.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{typeIcon(e.type)}</div>
                    <span style={{ ...badgeBase, ...meta.badge }}>{meta.short}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 3, lineHeight: 1.3 }}>{e.name}</p>
                    <div style={{ marginBottom: 2 }}><MetaLine e={e} /></div>
                    <p style={{ fontSize: 12, color: 'var(--t4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.address}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => goToDetail(e.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--surface2)', border: '1px solid var(--border-b)', color: 'var(--t2)', transition: 'all .15s' }}>Voir</button>
                    <button onClick={() => toggleAdd(e)} style={{ ...addBtnStyle(added), flex: 1, textAlign: 'center' }}>{added ? '✓ Ajouté' : '+ Ajouter'}</button>
                  </div>
                </div>
              )
            })}
            {remaining > 0 && (
              <button onClick={() => setVisible(v => v + PAGE_SIZE)} style={{ gridColumn: '1 / -1', marginTop: 4, justifySelf: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
                Afficher {remaining} autre{remaining > 1 ? 's' : ''} résultat{remaining > 1 ? 's' : ''} →
              </button>
            )}
          </div>
        </div>
      )}

      {/* BULK ACTION BAR */}
      {selInFiltered.length > 0 && (
        <div className="pw-bulk-bar" style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--t1)', color: 'var(--bg)', borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,.28)', zIndex: 100, whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 13, opacity: .7 }}>{selInFiltered.length} sélectionné(s)</span>
          <div style={{ width: 1, height: 16, background: 'color-mix(in srgb, var(--bg) 20%, transparent)' }} />
          <button onClick={bulkAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6" cy="6" r="4.5" stroke="var(--on-accent)" strokeWidth="1.4" /><path d="M6 4v4M4 6h4" stroke="var(--on-accent)" strokeWidth="1.4" strokeLinecap="round" /></svg>
            Ajouter la sélection
          </button>
          <button onClick={() => setSelected([])} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--bg) 20%, transparent)', background: 'transparent', color: 'var(--bg)', opacity: .7, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
        </div>
      )}
    </div>
  )
}

function addBtnStyle(added: boolean): CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
    background: added ? 'var(--accent-d)' : 'var(--surface2)',
    border: `1px solid ${added ? 'var(--accent-border)' : 'var(--border-b)'}`,
    color: added ? 'var(--accent)' : 'var(--t2)',
  }
}
