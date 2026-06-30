'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SearchRecord {
  id: string
  address: string
  lat: number
  lng: number
  radius: number
  types: string
  resultCount: number
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hier'
  return `Il y a ${days} jours`
}

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

export default function SearchHistory() {
  const [history, setHistory] = useState<SearchRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.ok ? r.json() : [])
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const allSelected = history.length > 0 && selectedIds.length === history.length

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : history.map(h => h.id))
  }

  async function deleteSelected() {
    if (selectedIds.length === 0) return
    setDeleting(true)
    try {
      const res = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (res.ok) {
        setHistory(prev => prev.filter(h => !selectedIds.includes(h.id)))
        setSelectedIds([])
      }
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Résultats</h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>Vos recherches récentes</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', height: 64 }} />
          ))}
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Résultats</h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>Vos recherches récentes</p>
        </div>
        <div style={{ textAlign: 'center', padding: '64px 32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface2)', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="9" cy="9" r="6" stroke="var(--t3)" strokeWidth="1.5" /><path d="M19 19l-3-3" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', marginBottom: 6 }}>
            Aucune recherche effectuée
          </p>
          <p style={{ fontSize: 13, color: 'var(--t4)', marginBottom: 20 }}>
            Lancez une recherche pour trouver des commerces à prospecter.
          </p>
          <Link href="/search" className="inline-flex items-center gap-1.5 btn-accent" style={{ padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700 }}>
            Lancer une recherche
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Résultats</h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>Vos recherches récentes</p>
        </div>
        <Link
          href="/search"
          className="btn-accent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            fontSize: 14,
            borderRadius: 9,
            textDecoration: 'none',
          }}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 14l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Nouvelle recherche
        </Link>
      </div>

      {/* Select all */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 12px' }}>
        <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }} aria-label="Tout sélectionner">
          <Checkbox checked={allSelected} />
        </button>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>
          {allSelected ? 'Tout désélectionner' : `Sélectionner ${history.length === 1 ? 'la recherche' : `les ${history.length} recherches`}`}
        </span>
      </div>

      <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {history.map(h => {
          const radiusLabel = h.radius / 1000 >= 1 ? `${h.radius / 1000} km` : `${h.radius} m`
          const typesLabel = h.types.split(',').map(t => t.trim()).slice(0, 2).join(', ')
          const searchUrl = `/results?historyId=${h.id}`
          const selected = selectedIds.includes(h.id)

          return (
            <div
              key={h.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                borderRadius: 12,
                background: selected ? 'var(--accent-s)' : 'var(--surface)',
                border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border)'}`,
                transition: 'border-color .15s, background .1s',
              }}
            >
              <button onClick={() => toggleSelect(h.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexShrink: 0 }} aria-label={selected ? 'Désélectionner' : 'Sélectionner'}>
                <Checkbox checked={selected} />
              </button>
              <Link
                href={searchUrl}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flex: 1,
                  minWidth: 0,
                  textDecoration: 'none',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--t1)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {h.address} &middot; {radiusLabel} &middot; {typesLabel}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>
                    {timeAgo(h.createdAt)}
                  </p>
                </div>
                <span style={{
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'var(--accent-d)',
                  color: 'var(--accent)',
                  marginLeft: 12,
                }}>
                  {h.resultCount} opp.
                </span>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--t1)', color: 'var(--bg)', borderRadius: 14,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,.28)', zIndex: 100, whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 13, opacity: .7 }}>{selectedIds.length} sélectionnée(s)</span>
          <div style={{ width: 1, height: 16, background: 'color-mix(in srgb, var(--bg) 20%, transparent)' }} />
          <button
            onClick={deleteSelected}
            disabled={deleting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: 'var(--error)', color: 'white',
              fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              opacity: deleting ? 0.6 : 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 2h3M6 6v5M8 6v5M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
          <button onClick={() => setSelectedIds([])} style={{
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid color-mix(in srgb, var(--bg) 20%, transparent)',
            background: 'transparent', color: 'var(--bg)', opacity: .7,
            fontSize: 13, cursor: 'pointer',
          }}>
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}
