'use client'

import { useEffect, useState } from 'react'
import { UserProfile } from '@clerk/nextjs'
import AppShell from '../components/AppShell'

interface PlanInfo {
  id: string
  name: string
  monthlyPrice: number
  dailyLimit: number
  maxProspects: number
}

interface UsageInfo { calls: number; limit: number; remaining: number; date: string }

export default function SettingsPage() {
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/plans/me').then(r => r.ok ? r.json() : null).then(setPlan)
    fetch('/api/plans').then(r => r.ok ? r.json() : []).then(setPlans)
    fetch('/api/usage/me').then(r => r.ok ? r.json() : null).then(setUsage)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      setMessage({ type: 'success', text: 'Abonnement actif. Votre plan a été mis à jour.' })
      fetch('/api/plans/me').then(r => r.ok ? r.json() : null).then(setPlan)
      window.history.replaceState({}, '', '/settings')
    } else if (params.get('checkout') === 'cancel') {
      setMessage({ type: 'error', text: 'Paiement annulé.' })
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  async function handleCheckout(planId: string) {
    setLoading(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Erreur lors de la création du paiement.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau.' })
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Erreur lors de l\'ouverture du portail.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau.' })
    } finally {
      setLoading(null)
    }
  }

  const isPaid = plan ? plan.monthlyPrice > 0 : false
  const upgradePlans = plans.filter(p => p.monthlyPrice > 0 && p.id !== plan?.id)

  return (
    <AppShell>
      <div className="anim-fade-in" style={{ padding: '28px 36px', maxWidth: 720 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>
          Paramètres
        </h1>
        <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 32 }}>
          Gérez votre compte et votre abonnement.
        </p>

        {message && (
          <div style={{
            padding: '12px 16px',
            marginBottom: 16,
            borderRadius: 8,
            fontSize: 13,
            background: message.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
            color: message.type === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${message.type === 'success' ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Current plan card */}
          <div style={{
            padding: 20,
            background: 'var(--accent-d)',
            border: '1px solid var(--accent-border)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
                Plan {plan?.name ?? '...'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--t2)' }}>
                {plan ? (plan.monthlyPrice > 0 ? `${plan.monthlyPrice} EUR/mois` : 'Gratuit') : 'Chargement...'}
              </div>
              {usage && (
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
                  Quota : {usage.calls}/{usage.limit} appels aujourd'hui — {usage.remaining} restants
                </div>
              )}
            </div>
            {isPaid && (
              <button
                onClick={handlePortal}
                disabled={loading === 'portal'}
                style={{
                  padding: '8px 14px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 8,
                  cursor: loading === 'portal' ? 'wait' : 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#09090B',
                  opacity: loading === 'portal' ? 0.6 : 1,
                }}
              >
                {loading === 'portal' ? 'Chargement...' : 'Gérer l\'abonnement'}
              </button>
            )}
          </div>

          {/* Upgrade options */}
          {upgradePlans.length > 0 && (
            <div style={{ display: 'flex', gap: 12 }}>
              {upgradePlans.map(p => (
                <div key={p.id} style={{
                  flex: 1,
                  padding: 16,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                    {p.monthlyPrice} EUR<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--t3)' }}>/mois</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                    {p.dailyLimit} recherches/jour — {p.maxProspects.toLocaleString()} prospects
                  </div>
                  <button
                    onClick={() => handleCheckout(p.id)}
                    disabled={loading === p.id}
                    style={{
                      marginTop: 4,
                      padding: '8px 14px',
                      background: 'var(--accent)',
                      border: 'none',
                      borderRadius: 8,
                      cursor: loading === p.id ? 'wait' : 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#09090B',
                      opacity: loading === p.id ? 0.6 : 1,
                    }}
                  >
                    {loading === p.id ? 'Chargement...' : 'Souscrire'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Clerk UserProfile */}
          <UserProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none !border !border-[var(--border)] !rounded-xl !bg-[var(--surface)]',
                navbar: 'hidden',
                pageScrollBox: '!p-0',
              },
            }}
          />
        </div>
      </div>
    </AppShell>
  )
}
