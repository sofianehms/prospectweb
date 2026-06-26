'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { identify } from '@/app/lib/analytics'

interface UserInfo { id: string; email: string }
interface PlanInfo { id: string; name: string; dailyLimit: number; monthlyPrice: number; maxProspects: number }
interface UsageInfo { calls: number; limit: number; remaining: number; date: string }
interface Prospect {
  id: string; name: string; address: string; type: string;
  phone: string | null; rating: number | null; ratingCount: number | null;
  websiteStatus: string; crmStatus: string; notes: string; addedAt: string;
}
interface UsageHistoryEntry { date: string; calls: number; plan: string }
interface SearchRecord {
  id: string; address: string; radius: number; types: string;
  resultCount: number; createdAt: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
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

function extractFirstName(email: string): string {
  const local = email.split('@')[0]
  const name = local.split(/[._-]/)[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const CRM_LABELS: Record<string, string> = {
  to_contact: 'À contacter',
  contacted: 'Contacté',
  discussing: 'En discussion',
  won: 'Signés ✓',
  lost: 'Perdus',
}
const CRM_ORDER = ['to_contact', 'contacted', 'discussing', 'won', 'lost'] as const

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [usageHistory, setUsageHistory] = useState<UsageHistoryEntry[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [history, setHistory] = useState<SearchRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/plans/me').then(r => r.ok ? r.json() : null),
      fetch('/api/prospects').then(r => r.ok ? r.json() : []),
      fetch('/api/history').then(r => r.ok ? r.json() : []),
      fetch('/api/usage/me').then(r => r.ok ? r.json() : null),
      fetch('/api/usage/me/history?days=7').then(r => r.ok ? r.json() : []),
    ]).then(([u, p, pr, h, usg, uh]) => {
      setUser(u)
      setPlan(p)
      setProspects(Array.isArray(pr) ? pr : [])
      setHistory(Array.isArray(h) ? h : [])
      setUsage(usg)
      setUsageHistory(Array.isArray(uh) ? uh : [])
      if (u?.id) identify(u.id, p?.name)
    }).finally(() => setLoading(false))
  }, [])

  const toContact = prospects.filter(p => p.crmStatus === 'to_contact')
  const won = prospects.filter(p => p.crmStatus === 'won')
  const today = new Date()
  const thisMonth = today.getMonth()
  const thisYear = today.getFullYear()
  const wonThisMonth = won.filter(p => {
    const d = new Date(p.addedAt)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  })

  const firstName = user ? extractFirstName(user.email) : '…'

  // CRM counts
  const crmCounts: Record<string, number> = {}
  for (const s of CRM_ORDER) crmCounts[s] = 0
  for (const p of prospects) {
    if (crmCounts[p.crmStatus] !== undefined) crmCounts[p.crmStatus]++
  }

  const contactEmojis = ['📞', '✉️', '💬']

  return (
    <AppShell>
      <div className="anim-fade-in">
        {/* Header */}
        <div style={{
          padding: '28px 36px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>
              Bonjour, {loading ? '…' : firstName} 👋
            </h1>
            <p style={{ fontSize: 14, color: 'var(--t3)' }}>
              {formatDate(today)} · {prospects.length} opportunit&eacute;{prospects.length !== 1 ? 's' : ''} en base
            </p>
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
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 14l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Nouvelle recherche
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <p style={{ color: 'var(--t3)', fontSize: 14 }}>Chargement…</p>
          </div>
        ) : (
          <div style={{ padding: '24px 36px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Opportunités', value: toContact.length, sub: `sur ${prospects.length} prospects`, accent: true },
                { label: 'Prospects actifs', value: prospects.length, sub: 'en base', accent: false },
                { label: 'Signés ce mois', value: wonThisMonth.length, sub: `${won.length} au total`, accent: true },
                { label: 'Quota du jour', value: usage?.remaining ?? 0, sub: usage ? `${usage.calls}/${usage.limit} utilisés — ${plan?.name ?? 'Free'}` : 'Chargement...', accent: false },
              ].map((card) => (
                <div key={card.label} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 24,
                }}>
                  <p style={{
                    textTransform: 'uppercase',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--t3)',
                    letterSpacing: '0.08em',
                    marginBottom: 8,
                  }}>
                    {card.label}
                  </p>
                  <p className="font-display" style={{
                    fontSize: 36,
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    color: card.accent && card.value > 0 ? 'var(--accent)' : 'var(--t1)',
                  }}>
                    {card.value}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 6 }}>
                    {card.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Usage history (7 derniers jours) */}
            {usageHistory.length > 0 && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Consommation (7 derniers jours)</span>
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                    Total : {usageHistory.reduce((s, d) => s + d.calls, 0)} appels
                  </span>
                </div>
                <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                  {(() => {
                    const max = Math.max(...usageHistory.map(d => d.calls), 1)
                    const last7 = [...usageHistory].reverse().slice(-7)
                    return last7.map((d, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: 40,
                            height: Math.max(4, (d.calls / max) * 60),
                            background: 'var(--accent)',
                            borderRadius: 4,
                            opacity: d.calls > 0 ? 1 : 0.2,
                          }}
                          title={`${d.date}: ${d.calls} appels`}
                        />
                        <span style={{ fontSize: 10, color: 'var(--t3)' }}>
                          {new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)}
                        </span>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}

            {/* Two column grid: À contacter + Recherches récentes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* À contacter */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                    }} />
                    <span style={{ fontSize: 15, fontWeight: 600 }}>À contacter</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: 'var(--accent-d)',
                      color: 'var(--accent)',
                    }}>
                      {toContact.length} sans site
                    </span>
                  </div>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  {toContact.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--t3)' }}>
                      Aucun prospect à contacter pour le moment.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {toContact.slice(0, 3).map((p, i) => (
                        <div key={p.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: 'var(--surface2)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: 18 }}>{contactEmojis[i % contactEmojis.length]}</span>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.name}
                              </p>
                              <p style={{ fontSize: 12, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.ratingCount ? `${p.ratingCount} avis` : p.type}{p.websiteStatus === 'none' ? ', zéro site web' : `, ${p.websiteStatus}`}
                              </p>
                            </div>
                          </div>
                          {p.phone ? (
                            <a href={`tel:${p.phone}`} style={{
                              flexShrink: 0,
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '5px 14px',
                              borderRadius: 7,
                              background: 'var(--accent-d)',
                              color: 'var(--accent)',
                              textDecoration: 'none',
                            }}>
                              Appeler
                            </a>
                          ) : (
                            <span style={{
                              flexShrink: 0,
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '5px 14px',
                              borderRadius: 7,
                              border: '1px solid var(--border)',
                              color: 'var(--t3)',
                            }}>
                              Email
                            </span>
                          )}
                        </div>
                      ))}
                      {toContact.length > 3 && (
                        <Link href="/prospects" style={{
                          display: 'block',
                          textAlign: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--accent)',
                          padding: '8px 0 4px',
                          textDecoration: 'none',
                        }}>
                          + {toContact.length - 3} autres &rarr;
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Recherches récentes */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Recherches récentes</span>
                  <Link href="/search" style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    textDecoration: 'none',
                  }}>
                    + Nouvelle
                  </Link>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  {history.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--t3)' }}>
                      Aucune recherche pour le moment.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {history.slice(0, 5).map(h => (
                        <div key={h.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: 'var(--surface2)',
                        }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{
                              fontSize: 13,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {h.address} &middot; {h.radius / 1000 >= 1 ? `${h.radius / 1000} km` : `${h.radius} m`} &middot; {h.types.split(',').map(t => t.trim()).slice(0, 2).join(', ')}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pipeline CRM */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Pipeline CRM</span>
                <Link href="/prospects" style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  textDecoration: 'none',
                }}>
                  Voir tout &rarr;
                </Link>
              </div>
              <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {CRM_ORDER.map((status) => {
                  const isActive = crmCounts[status] > 0 && (status === 'won' || status === 'discussing')
                  return (
                    <div key={status} style={{
                      background: isActive ? 'var(--accent-d)' : 'var(--surface2)',
                      borderRadius: 10,
                      padding: '18px 12px',
                      textAlign: 'center',
                    }}>
                      <p className="font-display" style={{
                        fontSize: 22,
                        fontWeight: 700,
                        letterSpacing: '-0.04em',
                        color: isActive ? 'var(--accent)' : 'var(--t1)',
                      }}>
                        {crmCounts[status]}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, fontWeight: 500 }}>
                        {CRM_LABELS[status]}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
