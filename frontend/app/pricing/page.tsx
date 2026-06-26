'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '../components/AppShell'
import { track, events } from '@/app/lib/analytics'

interface PlanInfo {
  id: string
  name: string
  monthlyPrice: number
  dailyLimit: number
  maxProspects: number
}

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    '50 recherches / jour',
    '100 prospects en base',
    'CRM basique',
    'Export CSV',
  ],
  pro: [
    '300 recherches / jour',
    '1 000 prospects en base',
    'CRM Kanban complet',
    'Export CSV & Sheets',
    'Score IA avance',
    'Support prioritaire',
  ],
  business: [
    '1 000 recherches / jour',
    '10 000 prospects en base',
    'Tout le plan Pro inclus',
    'Multi-utilisateurs',
    'Acces API',
    'Onboarding personnalise',
  ],
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/plans').then(r => r.ok ? r.json() : []).then(setPlans)
    fetch('/api/plans/me').then(r => r.ok ? r.json() : null).then(setCurrentPlan).catch(() => {})
  }, [])

  async function handleCheckout(planId: string) {
    setLoading(planId)
    track(events.PLAN_UPGRADE_CLICK, { planId })
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (data.url) {
        globalThis.location.assign(data.url)
      }
    } catch { /* ignore */ } finally {
      setLoading(null)
    }
  }

  const isCurrentPlan = (planId: string) => currentPlan?.id === planId

  return (
    <AppShell>
      <div className="anim-fade-in" style={{ padding: '48px 36px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 className="font-display" style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            marginBottom: 8,
          }}>
            Tarifs
          </h1>
          <p style={{ fontSize: 15, color: 'var(--t3)', maxWidth: 480, margin: '0 auto' }}>
            Commencez gratuitement. Passez au plan suivant quand vous etes pret.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
        }}>
          {plans.map(plan => {
            const isPro = plan.id === 'pro'
            const isCurrent = isCurrentPlan(plan.id)
            const isPaid = plan.monthlyPrice > 0
            const features = PLAN_FEATURES[plan.id] ?? []

            return (
              <div key={plan.id} style={{
                padding: 32,
                borderRadius: 16,
                border: isPro ? 'none' : '1px solid var(--border)',
                background: isPro ? 'var(--accent)' : 'var(--surface)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {isPro && (
                  <div style={{
                    position: 'absolute',
                    top: -13,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 14px',
                    borderRadius: 20,
                    background: 'var(--surface)',
                    border: '1px solid var(--accent)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--accent)',
                    whiteSpace: 'nowrap',
                  }}>
                    Le plus populaire
                  </div>
                )}

                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: isPro ? 'color-mix(in srgb, var(--on-accent) 55%, transparent)' : 'var(--t3)',
                  marginBottom: 10,
                }}>
                  {plan.name}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span className="font-display" style={{
                    fontSize: 42,
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    color: isPro ? 'var(--on-accent)' : 'var(--t1)',
                  }}>
                    {plan.monthlyPrice === 0 ? '0' : plan.monthlyPrice}
                  </span>
                  <span style={{
                    fontSize: 14,
                    color: isPro ? 'color-mix(in srgb, var(--on-accent) 55%, transparent)' : 'var(--t3)',
                  }}>
                    EUR/mois
                  </span>
                </div>

                <p style={{
                  fontSize: 13,
                  color: isPro ? 'color-mix(in srgb, var(--on-accent) 60%, transparent)' : 'var(--t3)',
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}>
                  {plan.dailyLimit} recherches/jour — {plan.maxProspects.toLocaleString()} prospects max
                </p>

                {isCurrent ? (
                  <div style={{
                    padding: '12px 0',
                    textAlign: 'center',
                    borderRadius: 9,
                    fontSize: 14,
                    fontWeight: 700,
                    border: isPro ? '2px solid #09090B' : '2px solid var(--accent)',
                    color: isPro ? 'var(--on-accent)' : 'var(--accent)',
                    marginBottom: 24,
                  }}>
                    Plan actuel
                  </div>
                ) : isPaid ? (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading === plan.id}
                    style={{
                      padding: '12px 0',
                      textAlign: 'center',
                      borderRadius: 9,
                      fontSize: 14,
                      fontWeight: 700,
                      border: 'none',
                      cursor: loading === plan.id ? 'wait' : 'pointer',
                      opacity: loading === plan.id ? 0.6 : 1,
                      background: isPro ? 'var(--on-accent)' : 'var(--accent)',
                      color: isPro ? 'var(--accent)' : 'var(--on-accent)',
                      marginBottom: 24,
                    }}
                  >
                    {loading === plan.id ? 'Chargement...' : `Passer a ${plan.name}`}
                  </button>
                ) : (
                  <Link
                    href="/search"
                    style={{
                      display: 'block',
                      padding: '12px 0',
                      textAlign: 'center',
                      borderRadius: 9,
                      fontSize: 14,
                      fontWeight: 600,
                      border: '1px solid var(--border)',
                      color: 'var(--t1)',
                      textDecoration: 'none',
                      marginBottom: 24,
                    }}
                  >
                    Commencer gratuitement
                  </Link>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3 3 7-7" stroke={isPro ? 'var(--on-accent)' : 'var(--accent)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{
                        fontSize: 14,
                        color: isPro ? 'color-mix(in srgb, var(--on-accent) 78%, transparent)' : 'var(--t2)',
                      }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
