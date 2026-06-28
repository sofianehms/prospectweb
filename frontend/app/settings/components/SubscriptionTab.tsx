'use client'

import { useEffect, useState } from 'react'
import { track, events } from '@/app/lib/analytics'

interface PlanInfo {
  id: string
  name: string
  monthlyPrice: number
  dailyLimit: number
  maxProspects: number
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

interface UsageInfo { calls: number; limit: number; remaining: number; date: string }

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif', trialing: 'Essai', past_due: 'Paiement en retard',
  unpaid: 'Impayé', canceled: 'Annulé', incomplete: 'Incomplet', none: 'Aucun',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: currency.toUpperCase() })
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: 'color-mix(in srgb, var(--surface) 55%, transparent)', borderRadius: 9, padding: 12 }}>
      <p style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--t1)' }}>{value}</p>
    </div>
  )
}

export default function SubscriptionTab({ toast }: { toast: (msg: string) => void }) {
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/plans/me').then(r => r.ok ? r.json() : null),
      fetch('/api/plans').then(r => r.ok ? r.json() : []),
      fetch('/api/billing/subscription').then(r => r.ok ? r.json() : null),
      fetch('/api/billing/invoices').then(r => r.ok ? r.json() : []),
      fetch('/api/usage/me').then(r => r.ok ? r.json() : null),
    ]).then(([p, pl, s, inv, u]) => {
      setPlan(p)
      setPlans(Array.isArray(pl) ? pl : [])
      setSubscription(s)
      setInvoices(Array.isArray(inv) ? inv : [])
      setUsage(u)
    }).finally(() => setLoading(false))
  }, [])

  async function handlePortal() {
    setBusy('portal')
    track(events.BILLING_PORTAL, { plan: plan?.id })
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      if (data.url) globalThis.location.assign(data.url)
      else toast(data.error ?? "Erreur lors de l'ouverture du portail.")
    } catch {
      toast('Erreur réseau.')
    } finally {
      setBusy(null)
    }
  }

  async function handleCheckout(planId: string) {
    setBusy(planId)
    track(events.PLAN_UPGRADE_CLICK, { plan: planId })
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId }) })
      const data = await res.json()
      if (data.url) globalThis.location.assign(data.url)
      else toast(data.error ?? 'Erreur lors de la création du paiement.')
    } catch {
      toast('Erreur réseau.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ background: 'var(--surface2)', borderRadius: 14, height: 160 }} />
        <div style={{ background: 'var(--surface2)', borderRadius: 14, height: 180 }} />
      </div>
    )
  }

  const isPaid = plan ? plan.monthlyPrice > 0 : false
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const statusLabel = STATUS_LABELS[subscription?.status ?? 'none'] ?? subscription?.status ?? (isPaid ? 'Actif' : 'Gratuit')
  const upgradePlans = plans.filter(p => p.monthlyPrice > 0 && p.id !== plan?.id)

  const renewalLine = subscription?.currentPeriodEnd
    ? `${isPaid ? `${plan!.monthlyPrice} € / mois` : 'Gratuit'} · ${subscription.cancelAtPeriodEnd ? 'Fin le' : 'Renouvellement le'} ${formatDate(subscription.currentPeriodEnd)}`
    : (isPaid ? `${plan!.monthlyPrice} € / mois` : 'Gratuit')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Plan card */}
      <div style={{ padding: 22, background: 'var(--accent-d)', border: '1px solid var(--accent-border)', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>Plan {plan?.name ?? 'Free'}</p>
            <p style={{ fontSize: 14, color: 'var(--t2)' }}>{renewalLine}</p>
          </div>
          {isPaid && (
            <button onClick={handlePortal} disabled={busy === 'portal'} className="btn-save" style={{ padding: '9px 18px', borderRadius: 9, fontSize: 13 }}>
              {busy === 'portal' ? 'Chargement…' : "Gérer l'abonnement"}
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Stat label="Statut" value={statusLabel} accent={isActive || (!isPaid)} />
          <Stat label="Recherches / jour" value={plan ? String(plan.dailyLimit) : '—'} />
          <Stat label="Prospects" value={plan ? `${plan.maxProspects.toLocaleString('fr-FR')} max` : '—'} />
          <Stat label="Utilisé aujourd'hui" value={usage ? `${usage.calls} / ${usage.limit}` : '—'} />
        </div>
      </div>

      {/* Upgrade options (free plan) */}
      {!isPaid && upgradePlans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(upgradePlans.length, 2)}, 1fr)`, gap: 12 }}>
          {upgradePlans.map(p => (
            <div key={p.id} className="set-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{p.name}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{p.monthlyPrice} €<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--t3)' }}>/mois</span></div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>{p.dailyLimit} recherches/jour · {p.maxProspects.toLocaleString('fr-FR')} prospects</div>
              <button onClick={() => handleCheckout(p.id)} disabled={busy === p.id} className="btn-save" style={{ marginTop: 4 }}>
                {busy === p.id ? 'Chargement…' : 'Souscrire'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation notice */}
      {subscription?.cancelAtPeriodEnd && (
        <div style={{ padding: '12px 16px', borderRadius: 10, fontSize: 13, background: 'var(--error-d)', color: 'var(--error)', border: '1px solid var(--error-border)' }}>
          Votre abonnement sera annulé à la fin de la période en cours.
        </div>
      )}

      {/* Invoices */}
      <div className="set-card">
        <div className="set-card-header"><p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Historique des factures</p></div>
        {invoices.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '28px 0', fontSize: 13, color: 'var(--t3)' }}>Aucune facture pour le moment.</p>
        ) : (
          invoices.map(inv => (
            <div key={inv.id} className="set-row">
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{formatDate(inv.date)}</p>
                <p style={{ fontSize: 12, color: 'var(--t4)' }}>{inv.status === 'paid' ? 'Payée' : inv.status === 'open' ? 'En attente' : inv.status}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{formatAmount(inv.amount, inv.currency)}</span>
                {inv.invoiceUrl && <a className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }} href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer">Voir</a>}
                {inv.invoicePdf && <a className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }} href={inv.invoicePdf} target="_blank" rel="noopener noreferrer">PDF</a>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
