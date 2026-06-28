'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Establishment, SearchResult } from '@/app/types/establishment'
import AppShell from '@/app/components/AppShell'
import DetailClient from './components/DetailClient'

export default function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      let base: Establishment | null = null

      try {
        const raw = sessionStorage.getItem('pw_search_results')
        if (raw) {
          const data: SearchResult = JSON.parse(raw)
          base = data.establishments.find(e => e.id === id) ?? null
        }
      } catch { /* corrupted storage */ }

      if (!base) {
        try {
          const res = await fetch(`/api/establishment/${encodeURIComponent(id)}`)
          if (res.ok) {
            base = await res.json()
          } else {
            const data = await res.json().catch(() => ({}))
            setError(data.error ?? 'Établissement introuvable.')
            setLoading(false)
            return
          }
        } catch {
          setError('Erreur réseau. Vérifiez votre connexion.')
          setLoading(false)
          return
        }
      }

      if (!base) {
        setError('Établissement introuvable.')
        setLoading(false)
        return
      }

      setEstablishment(base)
      setLoading(false)

      if (base.phone === null && base.rating === null) {
        try {
          const res = await fetch(`/api/establishment/${encodeURIComponent(id)}?details=1`)
          if (res.ok) {
            const details = await res.json()
            setEstablishment(prev => prev ? { ...prev, ...details } : prev)
          }
        } catch { /* non-blocking */ }
      }
    })()
  }, [id])

  return (
    <AppShell>
      <div className="anim-slide-right">
        {/* Back bar */}
        <div className="pw-detail-back" style={{
          padding: '14px 32px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}>
          <Link
            href="/results"
            className="detail-back-link"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 500, color: 'var(--t3)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour aux résultats
          </Link>
        </div>

        {/* Content */}
        <div className="pw-detail-content anim-fade-in" style={{ padding: '28px 36px', overflowY: 'auto' }}>
          {error && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 24, textAlign: 'center',
              color: 'var(--t3)', fontSize: 13,
            }}>
              {error}{' '}
              <Link href="/search" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Lancer une recherche</Link>
            </div>
          )}

          {loading && !error && (
            <div className="animate-pulse">
              <div className="flex items-start gap-4 mb-6">
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface2)' }} />
                <div className="flex-1">
                  <div style={{ width: 180, height: 16, borderRadius: 4, background: 'var(--surface2)', marginBottom: 8 }} />
                  <div style={{ width: 120, height: 12, borderRadius: 4, background: 'var(--surface2)', marginBottom: 8 }} />
                  <div style={{ width: 80, height: 20, borderRadius: 10, background: 'var(--surface2)' }} />
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />
              {[1,2,3].map(i => (
                <div key={i} style={{ width: `${70 - i * 15}%`, height: 12, borderRadius: 4, background: 'var(--surface2)', marginBottom: 12 }} />
              ))}
            </div>
          )}

          {establishment && <DetailClient e={establishment} />}
        </div>
      </div>
    </AppShell>
  )
}
