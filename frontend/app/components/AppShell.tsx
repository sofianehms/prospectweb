'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'

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
    icon: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    href: '/search', label: 'Recherche',
    icon: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M14 14l-2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    href: '/results', label: 'Résultats',
    icon: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="12.5" cy="11.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M15 14l-1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    href: '/prospects', label: 'Prospects',
    icon: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 7l1.5 1.5L15 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
]

const NAV_BOTTOM = [
  {
    href: '/prospects', label: 'CRM',
    icon: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="5" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="2" width="3" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    href: '/settings', label: 'Paramètres',
    icon: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M3.1 12.9l1.1-1.1M11.8 4.2l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
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
  const { signOut } = useClerk()
  const [theme, setTheme] = useState<Theme>('dark')
  const [user, setUser] = useState<UserInfo | null>(null)
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = (document.documentElement.getAttribute('data-theme') ?? 'dark') as Theme
    setTheme(t)
    const sb = localStorage.getItem('pw_sidebar')
    if (sb !== null) setSidebarOpen(sb !== 'false')
  }, [])

  function toggleSidebar() {
    setSidebarOpen(prev => {
      const next = !prev
      localStorage.setItem('pw_sidebar', String(next))
      return next
    })
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/plans/me').then(r => r.ok ? r.json() : null),
    ]).then(([u, p]) => {
      setUser(u)
      setPlan(p)
    })
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && menuOpen) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [menuOpen])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  function handleLogout() {
    signOut({ redirectUrl: '/sign-in' })
  }

  function isActive(href: string) {
    if (href === '/results') return pathname.startsWith('/results')
    return pathname === href
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--t1)', fontFamily: "'DM Sans', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--accent)] focus:text-[var(--on-accent)] focus:rounded-lg focus:font-semibold focus:text-sm">
        Aller au contenu principal
      </a>
      {/* SIDEBAR — collapsed rail */}
      {!sidebarOpen && (
        <aside className="flex flex-col items-center" aria-label="Navigation principale" style={{ width: 48, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '12px 0', gap: 2 }}>
          <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 7, marginBottom: 8 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="2.2" fill="var(--on-accent)"/><path d="M6.5 1.5V3M6.5 10V11.5M1.5 6.5H3M10 6.5h1.5" stroke="var(--on-accent)" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <button
            onClick={toggleSidebar}
            title="Développer le menu"
            aria-label="Développer le menu"
            className="flex items-center justify-center transition-all duration-200"
            style={{ width: 34, height: 34, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t4)', borderRadius: 8, marginBottom: 4 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--t2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t4)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className="flex items-center justify-center transition-all duration-200"
                style={{ width: 34, height: 34, borderRadius: 8, background: active ? 'var(--accent-d)' : 'transparent', color: active ? 'var(--accent)' : 'var(--t3)' }}
              >
                {item.icon}
              </Link>
            )
          })}
          <div className="mt-auto">
            <button
              onClick={toggleSidebar}
              title="Développer le menu"
              aria-label="Développer le menu"
              className="flex items-center justify-center"
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-d)', color: 'var(--accent)', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              {extractInitial(user)}
            </button>
          </div>
        </aside>
      )}

      {/* SIDEBAR — full */}
      {sidebarOpen && (
      <aside className="flex flex-col overflow-hidden" aria-label="Navigation principale" style={{ width: 'var(--sidebar)', flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <Link href="/dashboard" className="flex items-center gap-[9px] flex-1 min-w-0">
            <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 7 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="2.2" fill="var(--on-accent)"/><path d="M6.5 1.5V3M6.5 10V11.5M1.5 6.5H3M10 6.5h1.5" stroke="var(--on-accent)" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.03em' }}>nosite</span>
          </Link>
          <button
            onClick={toggleSidebar}
            title="Réduire le menu"
            aria-label="Réduire le menu"
            className="flex items-center justify-center shrink-0 transition-all duration-200"
            style={{ width: 26, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t4)', borderRadius: 6 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--t2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t4)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
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

        {/* User profile button + popover menu */}
        <div ref={menuRef} style={{ padding: '12px 10px', borderTop: '1px solid var(--border)', position: 'relative' }}>
          {/* Popover menu */}
          {menuOpen && (
            <div role="menu" style={{
              position: 'absolute', bottom: '100%', left: 10, right: 10, marginBottom: 8,
              background: 'var(--surface)', border: '1px solid var(--border-b)',
              borderRadius: 12, boxShadow: '0 8px 32px color-mix(in srgb, var(--t1) 18%, transparent)',
              overflow: 'hidden', zIndex: 50,
            }}>
              {/* Email */}
              <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 2 }}>Connecté en tant que</div>
                <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{user?.email ?? '…'}</div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px' }}>
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, border: 'none',
                    background: 'transparent', cursor: 'pointer', color: 'var(--t2)',
                    fontSize: 13, textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {theme === 'dark' ? (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 1.5v1.5M7.5 12v1.5M1.5 7.5H3M12 7.5h1.5M3.4 3.4l1 1M10.6 10.6l1 1M3.4 11.6l1-1M10.6 4.4l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5A5.5 5.5 0 0013.5 7.5 7.5 7.5 0 117.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  )}
                  Passer en mode {theme === 'dark' ? 'clair' : 'sombre'}
                </button>

                {/* Paramètres */}
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8,
                    color: 'var(--t2)', fontSize: 13, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3 3l1 1M11 11l1 1M3 12l1-1M11 4l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  Paramètres
                </Link>
              </div>

              {/* Plan */}
              <div style={{ padding: '6px', borderTop: '1px solid var(--border)' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 10px', borderRadius: 8, background: 'var(--accent-d)',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>Plan {plan?.name ?? '…'}</div>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}
                  >
                    Gérer →
                  </Link>
                </div>
              </div>

              {/* Déconnexion */}
              <div style={{ padding: '6px', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, border: 'none',
                    background: 'transparent', cursor: 'pointer', color: 'var(--t3)',
                    fontSize: 13, textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Se déconnecter
                </button>
              </div>
            </div>
          )}

          {/* Profile trigger button */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Menu utilisateur"
            className="flex items-center gap-[10px] w-full transition-all duration-200"
            style={{
              padding: 10, borderRadius: 9, background: menuOpen ? 'var(--accent-d)' : 'var(--surface2)',
              border: menuOpen ? '1px solid var(--accent-border)' : '1px solid transparent',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div className="flex items-center justify-center shrink-0" style={{ width: 30, height: 30, background: 'var(--accent-d)', borderRadius: '50%', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
              {extractInitial(user)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{extractName(user)}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Plan {plan?.name ?? '…'}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: 'var(--t4)', transform: menuOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
              <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>
      )}

      {/* MAIN CONTENT */}
      <main id="main-content" className="flex-1 overflow-y-auto flex flex-col" style={{ background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
