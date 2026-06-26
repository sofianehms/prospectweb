'use client'

import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'

interface OpsData {
  timestamp: string
  circuitBreaker: {
    isOpen: boolean
    consecutiveFailures: number
    openUntil: string | null
  }
  googleQuota: {
    date: string
    places: number
    geocoding: number
    total: number
    limit: number
  }
  usageByPlan: Record<string, { users: number; totalCalls: number }>
  period: { from: string; to: string }
  activeUsers: number
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: ok ? '#22C55E' : '#EF4444',
      marginRight: 8,
      flexShrink: 0,
    }} />
  )
}

export default function OpsPage() {
  const [data, setData] = useState<OpsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    fetch('/api/ops')
      .then(r => {
        if (r.status === 403) throw new Error('Acces reserve aux administrateurs.')
        if (!r.ok) throw new Error(`Erreur ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (error) {
    return (
      <AppShell>
        <div style={{ padding: '48px 36px', textAlign: 'center' }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Tableau de bord ops
          </h1>
          <p style={{ color: '#EF4444', fontSize: 14 }}>{error}</p>
        </div>
      </AppShell>
    )
  }

  const quotaPercent = data ? Math.round((data.googleQuota.total / data.googleQuota.limit) * 100) : 0
  const quotaOk = quotaPercent < 80

  return (
    <AppShell>
      <div className="anim-fade-in" style={{ padding: '28px 36px', maxWidth: 860 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>
              Tableau de bord ops
            </h1>
            <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 2 }}>
              {data ? `Mis a jour : ${new Date(data.timestamp).toLocaleTimeString('fr-FR')}` : 'Chargement...'}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1,
              color: 'var(--t1)',
            }}
          >
            {loading ? 'Chargement...' : 'Rafraichir'}
          </button>
        </div>

        {loading && !data ? (
          <p style={{ color: 'var(--t3)', fontSize: 14 }}>Chargement...</p>
        ) : data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Santé fournisseurs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}>
              <div style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: data.circuitBreaker.isOpen ? '#FEF2F2' : 'var(--surface)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <StatusDot ok={!data.circuitBreaker.isOpen} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Google Places</span>
                </div>
                <p className="font-display" style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: data.circuitBreaker.isOpen ? '#EF4444' : '#22C55E',
                  letterSpacing: '-0.03em',
                }}>
                  {data.circuitBreaker.isOpen ? 'Coupe' : 'OK'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
                  {data.circuitBreaker.consecutiveFailures} echec{data.circuitBreaker.consecutiveFailures !== 1 ? 's' : ''} consecutif{data.circuitBreaker.consecutiveFailures !== 1 ? 's' : ''}
                  {data.circuitBreaker.openUntil && ` — retabli a ${new Date(data.circuitBreaker.openUntil).toLocaleTimeString('fr-FR')}`}
                </p>
              </div>

              <div style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: !quotaOk ? '#FFFBEB' : 'var(--surface)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <StatusDot ok={quotaOk} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Quota Google</span>
                </div>
                <p className="font-display" style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: quotaPercent >= 100 ? '#EF4444' : quotaPercent >= 80 ? '#F59E0B' : 'var(--t1)',
                  letterSpacing: '-0.03em',
                }}>
                  {quotaPercent}%
                </p>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
                  {data.googleQuota.total} / {data.googleQuota.limit} appels (places: {data.googleQuota.places}, geocoding: {data.googleQuota.geocoding})
                </p>
              </div>

              <div style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <StatusDot ok={true} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Utilisateurs actifs</span>
                </div>
                <p className="font-display" style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--t1)',
                  letterSpacing: '-0.03em',
                }}>
                  {data.activeUsers}
                </p>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
                  ce mois ({data.period.from} → {data.period.to})
                </p>
              </div>
            </div>

            {/* Barre de quota visuelle */}
            <div style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Quota Google du jour</span>
                <span style={{ fontSize: 13, color: 'var(--t3)' }}>
                  {data.googleQuota.total} / {data.googleQuota.limit}
                </span>
              </div>
              <div style={{
                height: 8,
                borderRadius: 4,
                background: 'var(--border)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(quotaPercent, 100)}%`,
                  borderRadius: 4,
                  background: quotaPercent >= 100 ? '#EF4444' : quotaPercent >= 80 ? '#F59E0B' : '#22C55E',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>

            {/* Usage par plan */}
            <div style={{
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Usage par plan (ce mois)</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                {Object.entries(data.usageByPlan).length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--t3)' }}>
                    Aucune donnee ce mois.
                  </p>
                ) : (
                  Object.entries(data.usageByPlan)
                    .sort(([, a], [, b]) => b.totalCalls - a.totalCalls)
                    .map(([plan, info]) => (
                      <div key={plan} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 22px',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            background: plan === 'free' ? 'var(--border)' : 'var(--accent-d)',
                            color: plan === 'free' ? 'var(--t2)' : 'var(--accent)',
                            textTransform: 'capitalize',
                          }}>
                            {plan}
                          </span>
                          <span style={{ fontSize: 13, color: 'var(--t2)' }}>
                            {info.users} utilisateur{info.users !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
                          {info.totalCalls.toLocaleString('fr-FR')} appels
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
