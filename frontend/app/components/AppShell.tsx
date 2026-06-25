'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function applyTheme(t: Theme) {
  const html = document.documentElement
  html.setAttribute('data-theme', t)
  html.classList.toggle('dark', t === 'dark')
  document.cookie = `pw_theme=${t};path=/;max-age=31536000;SameSite=Lax`
}

interface UserInfo { id: string; email: string; firstName?: string; lastName?: string }
interface PlanInfo { id: string; name: string }

const NAV_ITEMS = [
  {
    href: '/dashboard', label: 'Dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    href: '/search', label: 'Recherche',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M14 14l-2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    href: '/results', label: 'Résultats',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="12.5" cy="11.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M15 14l-1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    href: '/prospects', label: 'Prospects',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 7l1.5 1.5L15 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
]

const NAV_BOTTOM = [
  {
    href: '/prospects', label: 'CRM',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="5" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="2" width="3" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    href: '/settings', label: 'Paramètres',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M3.1 12.9l1.1-1.1M11.8 4.2l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
]

function extractName(user: UserInfo | null): string {
  if (!user) return '…'
  if (user.firstName) return user.firstName
  const local = user.email.split('@')[0]
  const name = local.split(/[._-]/)[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function extractInitial(user: UserInfo | null): string {
  if (!user) return '?'
  if (user.firstName) return user.firstName.charAt(0).toUpperCase()
  return user.email.charAt(0).toUpperCase()
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>('dark')
  const [user, setUser] = useState<UserInfo | null>(null)
  const [plan, setPlan] = useState<PlanInfo | null>(null)

  useEffect(() => {
    const t = (document.documentElement.getAttribute('data-theme') ?? 'dark') as Theme
    setTheme(t)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/plans/me').then(r => r.ok ? r.json() : null),
    ]).then(([u, p]) => {
      setUser(u)
      setPlan(p)
    })
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  function handleLogout() {
    document.cookie = 'pw_token=; path=/; max-age=0'
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/results') return pathname.startsWith('/results')
    return pathname === href
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--t1)', fontFamily: "'DM Sans', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* SIDEBAR */}
      <aside className="flex flex-col overflow-hidden" style={{ width: 'var(--sidebar)', flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/dashboard" className="flex items-center gap-[9px]">
            <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 7 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="2.2" fill="#09090B"/><path d="M6.5 1.5V3M6.5 10V11.5M1.5 6.5H3M10 6.5h1.5" stroke="#09090B" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.03em' }}>nosite</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto" style={{ padding: '12px 10px' }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-[10px] transition-all duration-200"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 9,
                  border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  background: active ? 'var(--accent-d)' : 'var(--surface2)',
                  color: active ? 'var(--accent)' : 'var(--t3)',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}

          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

          {NAV_BOTTOM.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="flex items-center gap-[10px] transition-all duration-200"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 9,
                  border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  background: active ? 'var(--accent-d)' : 'var(--surface2)',
                  color: active ? 'var(--accent)' : 'var(--t3)',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + theme */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-[10px]" style={{ padding: 10, borderRadius: 9, background: 'var(--surface2)' }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: 30, height: 30, background: 'var(--accent-d)', borderRadius: '50%', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
              {extractInitial(user)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{extractName(user)}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Plan {plan?.name ?? '…'}</div>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center shrink-0 transition-all duration-200"
              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--t3)' }}
              aria-label="Changer de thème"
            >
              {theme === 'dark' ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 1v1M6.5 11v1M1 6.5h1M11 6.5h1M3 3l.7.7M9.3 9.3l.7.7M3 10l.7-.7M9.3 3.7l.7-.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1A5 5 0 0012 6.5 6.5 6.5 0 116.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              )}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full mt-2 transition-all duration-200"
            style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--t4)', fontSize: 12 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto flex flex-col" style={{ background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
