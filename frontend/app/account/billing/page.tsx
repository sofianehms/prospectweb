'use client'

import { useEffect, useState } from 'react'
import AppShell from '../../components/AppShell'
import { track, events } from '@/app/lib/analytics'

interface PlanInfo {
  id: string
  name: string
  monthlyPrice: number
  dailyLimit: number
  maxProspects: number
  subscriptionStatus?: string | null
}

interface SubscriptionInfo {
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

interface Invoice {
  id: string
  date: string
  amount: number
  currency: string
  status: string
  invoiceUrl: string | null
  invoicePdf: string | null
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  trialing: 'Essai',
  past_due: 'Paiement en retard',
  unpaid: 'Impaye',
  canceled: 'Annule',
  incomplete: 'Incomplet',
  none: 'Aucun abonnement',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}

export default function BillingPage() {
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/plans/me').then(r => r.ok ? r.json() : null),
      fetch('/api/billing/subscription').then(r => r.ok ? r.json() : null),
      fetch('/api/billing/invoices').then(r => r.ok ? r.json() : []),
    ]).then(([p, s, inv]) => {
      setPlan(p)
      setSubscription(s)
      setInvoices(Array.isArray(inv) ? inv : [])
    }).finally(() => setLoading(false))
  }, [])

  async function handlePortal() {
    setPortalLoading(true)
    track(events.BILLING_PORTAL, { plan: plan?.id })
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.url) {
        globalThis.location.assign(data.url)
      }
    } catch { /* ignore */ } finally {
      setPortalLoading(false)
    }
  }

  const isPaid = plan ? plan.monthlyPrice > 0 : false
  const statusLabel = STATUS_LABELS[subscription?.status ?? 'none'] ?? subscription?.status ?? 'Inconnu'
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return (
    <AppShell>
      <div className="anim-fade-in" style={{ padding: '28px 36px', maxWidth: 720 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>
          Facturation
        </h1>
        <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 32 }}>
          Gerez votre abonnement et consultez vos factures.
        </p>

        {loading ? (
          <p style={{ color: 'var(--t3)', fontSize: 14 }}>Chargement...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Subscription status card */}
            <div style={{
              padding: 20,
              background: 'var(--accent-d)',
              border: '1px solid var(--accent-border)',
              borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
                    Plan {plan?.name ?? 'Free'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--t2)' }}>
                    {isPaid ? `${plan!.monthlyPrice} EUR/mois` : 'Gratuit'}
                  </div>
                </div>
                {isPaid && (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--accent)',
                      border: 'none',
                      borderRadius: 8,
                      cursor: portalLoading ? 'wait' : 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--on-accent)',
                      opacity: portalLoading ? 0.6 : 1,
                    }}
                  >
                    {portalLoading ? 'Chargement...' : "Gerer l'abonnement"}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--t3)' }}>Statut : </span>
                  <span style={{
                    fontWeight: 600,
                    color: isActive ? 'var(--accent)' : subscription?.status === 'past_due' ? 'var(--warn)' : 'var(--t2)',
                  }}>
                    {statusLabel}
                  </span>
                </div>
                {subscription?.currentPeriodEnd && (
                  <div>
                    <span style={{ color: 'var(--t3)' }}>
                      {subscription.cancelAtPeriodEnd ? 'Fin le : ' : 'Prochaine echeance : '}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--t2)' }}>
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                )}
              </div>
              {subscription?.cancelAtPeriodEnd && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  background: 'var(--error-d)',
                  color: 'var(--error)',
                  border: '1px solid var(--error-border)',
                }}>
                  Votre abonnement sera annule a la fin de la periode en cours.
                </div>
              )}
            </div>

            {/* Invoices */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Historique des factures</span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                {invoices.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--t3)' }}>
                    Aucune facture pour le moment.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {invoices.map(inv => (
                      <div key={inv.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: 'var(--surface2)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600 }}>
                              {formatDate(inv.date)}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
                              {inv.status === 'paid' ? 'Payee' : inv.status === 'open' ? 'En attente' : inv.status}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>
                            {formatAmount(inv.amount, inv.currency)}
                          </span>
                          {inv.invoiceUrl && (
                            <a
                              href={inv.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                padding: '5px 14px',
                                borderRadius: 7,
                                background: 'var(--accent-d)',
                                color: 'var(--accent)',
                                textDecoration: 'none',
                              }}
                            >
                              Voir
                            </a>
                          )}
                          {inv.invoicePdf && (
                            <a
                              href={inv.invoicePdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                padding: '5px 14px',
                                borderRadius: 7,
                                border: '1px solid var(--border)',
                                color: 'var(--t2)',
                                textDecoration: 'none',
                              }}
                            >
                              PDF
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
