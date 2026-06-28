'use client'

import AppShell from '../components/AppShell'
import SearchForm from '../components/SearchForm'

export default function SearchPage() {
  return (
    <AppShell>
      <div className="pw-search-page flex-1 flex items-center justify-center anim-fade-in">
        <div className="pw-search-wrap" style={{ width: '100%', maxWidth: 680, padding: '40px 36px' }}>
          {/* Hero */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div
              className="inline-flex items-center justify-center"
              style={{ width: 48, height: 48, background: 'var(--accent-d)', borderRadius: 14, marginBottom: 16, border: '1px solid var(--accent-border)' }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="9" cy="9" r="6.5" stroke="var(--accent)" strokeWidth="1.7" />
                <path d="M19 19l-4-4" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--t1)', marginBottom: 8 }}>
              Où cherchez-vous ?
            </h1>
            <p style={{ fontSize: 15, color: 'var(--t3)' }}>
              Définissez votre zone et l&apos;application analyse les commerces sans site web.
            </p>
          </div>

          <SearchForm />
        </div>
      </div>
    </AppShell>
  )
}
