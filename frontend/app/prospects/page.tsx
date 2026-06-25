import AppShell from '@/app/components/AppShell'
import ProspectsClient from './components/ProspectsClient'

export default function ProspectsPage() {
  return (
    <AppShell>
      <div className="anim-fade-in">
        <div style={{ padding: '28px 36px', maxWidth: 900 }}>
          <ProspectsClient />
        </div>
      </div>
    </AppShell>
  )
}
