'use client'

import { useEffect, useState, useCallback, type ReactNode } from 'react'
import ProfileTab from './ProfileTab'
import SecurityTab from './SecurityTab'
import PreferencesTab from './PreferencesTab'
import SubscriptionTab from './SubscriptionTab'
import DangerTab from './DangerTab'

export type TabId = 'profil' | 'securite' | 'preferences' | 'abonnement' | 'danger'

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'profil',      label: 'Profil',      icon: <><circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2 13c0-3.04 2.46-5.5 5.5-5.5S13 9.96 13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></> },
  { id: 'securite',    label: 'Sécurité',    icon: <><rect x="3" y="6.5" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M5 6.5V5a2.5 2.5 0 0 1 5 0v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></> },
  { id: 'preferences', label: 'Préférences', icon: <><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3" /><path d="M7.5 1.5v1.5M7.5 10.5v1.5M1.5 7.5H3M12 7.5h1.5M3.7 3.7l1 1M10.8 10.8l1 1M3.7 11.3l1-1M10.8 4.2l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></> },
  { id: 'abonnement',  label: 'Abonnement',  icon: <><rect x="1.5" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1.5 7h12" stroke="currentColor" strokeWidth="1.3" /><path d="M4 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></> },
  { id: 'danger',      label: 'Danger',      icon: <><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3" /><path d="M7.5 5v3M7.5 10v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></> },
]

const SECTION_META: Record<TabId, { title: string; desc: string }> = {
  profil:      { title: 'Profil',                    desc: 'Gérez vos informations personnelles.' },
  securite:    { title: 'Sécurité',                  desc: 'Mot de passe et appareils connectés.' },
  preferences: { title: 'Préférences',               desc: 'Thème, langue et notifications.' },
  abonnement:  { title: 'Abonnement & Facturation',  desc: 'Votre plan actuel et historique.' },
  danger:      { title: 'Zone dangereuse',           desc: 'Actions irréversibles sur votre compte.' },
}

function isTabId(v: string | null): v is TabId {
  return v === 'profil' || v === 'securite' || v === 'preferences' || v === 'abonnement' || v === 'danger'
}

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState<TabId>('profil')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.setTimeout(() => setToastMsg(null), 2500)
  }, [])

  // Initial tab from URL (?tab=) and checkout return handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (isTabId(tab)) setActiveTab(tab)

    const checkout = params.get('checkout')
    if (checkout === 'success') {
      setActiveTab('abonnement')
      toast('Abonnement actif. Votre plan a été mis à jour.')
      window.history.replaceState({}, '', '/settings?tab=abonnement')
    } else if (checkout === 'cancel') {
      setActiveTab('abonnement')
      toast('Paiement annulé.')
      window.history.replaceState({}, '', '/settings?tab=abonnement')
    }
  }, [toast])

  function selectTab(id: TabId) {
    setActiveTab(id)
    window.history.replaceState({}, '', `/settings?tab=${id}`)
  }

  const meta = SECTION_META[activeTab]

  return (
    <div className="pw-settings" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Settings nav */}
      <div className="pw-settings-nav" style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '24px 10px', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--bg1)', overflowY: 'auto' }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t4)', padding: '0 10px', marginBottom: 8 }}>Paramètres</p>
        {TABS.map(t => (
          <button key={t.id} className={`set-tab${activeTab === t.id ? ' active' : ''}`} onClick={() => selectTab(t.id)} aria-current={activeTab === t.id}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">{t.icon}</svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="pw-settings-main" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
        {toastMsg && <div className="set-toast" role="status">{toastMsg}</div>}

        <div className="pw-page-header" style={{ padding: '28px 36px 20px', borderBottom: '1px solid var(--border)' }}>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--t1)', marginBottom: 3 }}>{meta.title}</h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>{meta.desc}</p>
        </div>

        <div className="pw-settings-content anim-fade-in" style={{ padding: '28px 36px 48px', maxWidth: 680 }} key={activeTab}>
          {activeTab === 'profil' && <ProfileTab toast={toast} />}
          {activeTab === 'securite' && <SecurityTab toast={toast} />}
          {activeTab === 'preferences' && <PreferencesTab toast={toast} />}
          {activeTab === 'abonnement' && <SubscriptionTab toast={toast} />}
          {activeTab === 'danger' && <DangerTab toast={toast} />}
        </div>
      </main>
    </div>
  )
}
