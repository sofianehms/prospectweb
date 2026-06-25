'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UserInfo { id: string; email: string }
interface PlanInfo { id: string; name: string; dailyLimit: number; monthlyPrice: number; maxProspects: number }
interface Prospect {
  id: string; name: string; address: string; type: string;
  phone: string | null; rating: number | null; ratingCount: number | null;
  websiteStatus: string; crmStatus: string; notes: string; addedAt: string;
}
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

/* ─── Sidebar ─── */
function Sidebar({ user, plan, prospectCount }: { user: UserInfo | null; plan: PlanInfo | null; prospectCount: number }) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { icon: '⊞', label: 'Dashboard', href: '/dashboard' },
    { icon: '🔍', label: 'Recherche', href: '/search' },
    { icon: '☰', label: 'Résultats', href: '/results', badge: null as number | null },
    { icon: '👤', label: 'Prospects', href: '/prospects', badge: prospectCount || null },
  ]

  function handleLogout() {
    document.cookie = 'pw_token=; path=/; max-age=0'
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-5 dark:border-slate-700">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }} aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
        </svg>
        <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-slate-100">Nosite</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-gray-100 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-100'}`}>
              <span className="flex items-center gap-2.5">
                <span className="w-4 text-center">{item.icon}</span>
                {item.label}
              </span>
              {item.badge != null && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: 'var(--accent)' }}>{item.badge}</span>
              )}
            </Link>
          )
        })}
        <div className="my-3 border-t border-gray-100 dark:border-slate-700" />
        <Link href="/prospects" className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-100`}>
          <span className="w-4 text-center">📋</span> CRM
        </Link>
      </nav>
      <div className="border-t border-gray-200 p-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>
            {user ? user.email.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
              {user ? extractFirstName(user.email) : '…'}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              Plan {plan?.name ?? '…'}
            </p>
          </div>
          <button onClick={handleLogout} title="Déconnexion" className="text-gray-400 transition hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─── Stat Card ─── */
function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-slate-100" style={typeof value === 'number' && value > 0 ? { color: 'var(--accent)' } : undefined}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">{sub}</p>}
    </div>
  )
}

/* ─── Pipeline CRM ─── */
const CRM_LABELS: Record<string, string> = {
  to_contact: 'À contacter',
  contacted: 'Contacté',
  discussing: 'En discussion',
  won: 'Signés ✓',
  lost: 'Perdus',
}
const CRM_ORDER = ['to_contact', 'contacted', 'discussing', 'won', 'lost'] as const

function PipelineCrm({ prospects }: { prospects: Prospect[] }) {
  const counts: Record<string, number> = {}
  for (const s of CRM_ORDER) counts[s] = 0
  for (const p of prospects) {
    if (counts[p.crmStatus] !== undefined) counts[p.crmStatus]++
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100">Pipeline CRM</h3>
        <Link href="/prospects" className="text-xs font-medium transition hover:opacity-80" style={{ color: 'var(--accent)' }}>Voir tout &rarr;</Link>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {CRM_ORDER.map((status, i) => (
          <div key={status} className={`rounded-lg p-3 text-center ${i >= 2 && counts[status] > 0 ? '' : 'bg-gray-50 dark:bg-slate-700/50'}`} style={i >= 2 && counts[status] > 0 ? { backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)' } : undefined}>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{counts[status]}</p>
            <p className="mt-1 text-[10px] text-gray-400 dark:text-slate-500">{CRM_LABELS[status]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [history, setHistory] = useState<SearchRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/plans/me').then(r => r.ok ? r.json() : null),
      fetch('/api/prospects').then(r => r.ok ? r.json() : []),
      fetch('/api/history').then(r => r.ok ? r.json() : []),
    ]).then(([u, p, pr, h]) => {
      setUser(u)
      setPlan(p)
      setProspects(Array.isArray(pr) ? pr : [])
      setHistory(Array.isArray(h) ? h : [])
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

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} plan={plan} prospectCount={prospects.length} />

      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Bonjour, {loading ? '…' : firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
              {formatDate(today)}
              {history.length > 0 && ` · ${prospects.length} opportunité${prospects.length !== 1 ? 's' : ''} en base`}
            </p>
          </div>
          <Link href="/search" className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--accent)' }}>
            🔍 Nouvelle recherche
          </Link>
        </header>

        <main className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-400 dark:text-slate-500">Chargement…</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Opportunités" value={toContact.length} sub={prospects.length > 0 ? `sur ${prospects.length} prospects` : undefined} />
                <StatCard label="Prospects actifs" value={prospects.length} />
                <StatCard label="Signés ce mois" value={wonThisMonth.length} sub={won.length > 0 ? `${won.length} au total` : undefined} />
                <StatCard label="Recherches" value={history.length} />
              </div>

              {/* Middle row */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* À contacter */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-slate-100">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                      À contacter
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{toContact.length} sans site</span>
                    </h3>
                  </div>
                  {toContact.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">Aucun prospect à contacter pour le moment.</p>
                  ) : (
                    <div className="space-y-3">
                      {toContact.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-slate-700/50">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900 dark:text-slate-100">{p.name}</p>
                            <p className="truncate text-xs text-gray-400 dark:text-slate-500">
                              {p.ratingCount ? `${p.ratingCount} avis` : p.type}{p.websiteStatus === 'none' ? ', zéro site web' : `, ${p.websiteStatus}`}
                            </p>
                          </div>
                          {p.phone ? (
                            <a href={`tel:${p.phone}`} className="shrink-0 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30">Appeler</a>
                          ) : (
                            <span className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400 dark:border-slate-600 dark:text-slate-500">Pas de tél.</span>
                          )}
                        </div>
                      ))}
                      {toContact.length > 5 && (
                        <Link href="/prospects" className="block text-center text-xs font-medium transition hover:opacity-80" style={{ color: 'var(--accent)' }}>
                          + {toContact.length - 5} autres &rarr;
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Recherches récentes */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Recherches récentes</h3>
                    <Link href="/search" className="text-xs font-medium transition hover:opacity-80" style={{ color: 'var(--accent)' }}>+ Nouvelle</Link>
                  </div>
                  {history.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">Aucune recherche pour le moment.</p>
                  ) : (
                    <div className="space-y-2">
                      {history.slice(0, 5).map(h => (
                        <div key={h.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-slate-700/50">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                              {h.address} &middot; {h.radius / 1000 >= 1 ? `${h.radius / 1000} km` : `${h.radius} m`} &middot; {h.types.split(',').map(t => t.trim()).slice(0, 2).join(', ')}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{timeAgo(h.createdAt)}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {h.resultCount} opp.
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pipeline CRM */}
              <PipelineCrm prospects={prospects} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
