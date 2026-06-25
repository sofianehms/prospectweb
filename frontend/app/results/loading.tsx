import AppShell from '@/app/components/AppShell'

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded ${className}`} style={{ background: 'var(--surface2)' }} />
}

export default function ResultsLoading() {
  return (
    <AppShell>
      <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1C4.02 1 2 3.02 2 5.5c0 3.5 4.5 6.5 4.5 6.5S11 9 11 5.5C11 3.02 8.98 1 6.5 1z" fill="var(--accent)" opacity="0.85"/><circle cx="6.5" cy="5.5" r="1.8" fill="var(--bg)"/></svg>
            <Pulse className="h-4 w-24" />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Pulse className="h-8 w-24 rounded-lg" />
            <Pulse className="h-8 w-24 rounded-lg" />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
          {/* Progress indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '40px 0' }}>
            <svg className="animate-spin" style={{ color: 'var(--accent)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span style={{ fontSize: 14, color: 'var(--t3)' }}>Recherche en cours, veuillez patienter…</span>
          </div>

          {/* Results list skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 13, display: 'flex', alignItems: 'center', gap: 16 }}>
                <Pulse className="w-11 h-11 rounded-xl shrink-0" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Pulse className="h-4 w-48" />
                  <Pulse className="h-3 w-64" />
                </div>
                <Pulse className="h-6 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
