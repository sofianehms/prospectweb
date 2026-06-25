'use client'

import AppShell from '../components/AppShell'
import SearchForm from '../components/SearchForm'

export default function SearchPage() {
  return (
    <AppShell>
      <div className="anim-fade-in">
        {/* Header */}
        <div style={{ padding: '28px 36px 20px', borderBottom: '1px solid var(--border)' }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>
            Nouvelle recherche
          </h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>
            Définissez votre zone et vos critères pour détecter des opportunités.
          </p>
        </div>
        <div style={{ padding: '32px 36px', maxWidth: 720 }}>
          <SearchForm />
        </div>
      </div>
    </AppShell>
  )
}
