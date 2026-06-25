'use client'

import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'

interface UserInfo { id: string; email: string; firstName?: string; lastName?: string }
interface PlanInfo { id: string; name: string; monthlyPrice: number }

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [plan, setPlan] = useState<PlanInfo | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/plans/me').then(r => r.ok ? r.json() : null),
    ]).then(([u, p]) => { setUser(u); setPlan(p) })
  }, [])

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : user?.email?.split('@')[0] ?? '…'

  return (
    <AppShell>
      <div className="anim-fade-in" style={{ padding: '28px 36px', maxWidth: 640 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>
          Paramètres
        </h1>
        <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 32 }}>
          Gérez votre compte et votre abonnement.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* User info card */}
          <div style={{
            padding: 20,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{displayName}</div>
              <div style={{ fontSize: 13, color: 'var(--t3)' }}>{user?.email ?? '…'}</div>
            </div>
            <button style={{
              padding: '8px 14px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--t1)',
            }}>Modifier</button>
          </div>

          {/* Plan card */}
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
                Plan {plan?.name ?? '…'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--t2)' }}>
                {plan?.monthlyPrice ? `${plan.monthlyPrice}€/mois` : 'Chargement…'}
              </div>
            </div>
            <button style={{
              padding: '8px 14px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: '#09090B',
            }}>Gérer</button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
