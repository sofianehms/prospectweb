'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function applyTheme(t: Theme) {
  const html = document.documentElement
  html.setAttribute('data-theme', t)
  html.classList.toggle('dark', t === 'dark')
  document.cookie = `pw_theme=${t};path=/;max-age=31536000;SameSite=Lax`
}

const NOTIF_DEFS = [
  { id: 'quota', label: 'Alerte quota', desc: 'Notification quand vous atteignez 80% de votre quota journalier.' },
  { id: 'newResults', label: 'Nouveaux résultats', desc: 'Email quand de nouvelles opportunités correspondent à vos recherches.' },
  { id: 'weeklyReport', label: 'Rapport hebdomadaire', desc: 'Résumé de votre activité chaque lundi matin.' },
] as const

type NotifId = (typeof NOTIF_DEFS)[number]['id']
const DEFAULT_NOTIFS: Record<NotifId, boolean> = { quota: true, newResults: true, weeklyReport: false }

export default function PreferencesTab({ toast }: { toast: (msg: string) => void }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [lang, setLang] = useState('fr')
  const [notifs, setNotifs] = useState<Record<NotifId, boolean>>(DEFAULT_NOTIFS)

  useEffect(() => {
    setTheme((document.documentElement.getAttribute('data-theme') as Theme) ?? 'dark')
    setLang(localStorage.getItem('pw_lang') ?? 'fr')
    try {
      const raw = localStorage.getItem('pw_notifs')
      if (raw) setNotifs({ ...DEFAULT_NOTIFS, ...JSON.parse(raw) })
    } catch { /* ignore */ }
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  function changeLang(value: string) {
    setLang(value)
    localStorage.setItem('pw_lang', value)
    toast('Langue enregistrée')
  }

  function toggleNotif(id: NotifId) {
    setNotifs(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem('pw_notifs', JSON.stringify(next))
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Appearance */}
      <div className="set-card">
        <div className="set-card-header"><p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Apparence</p></div>
        <div className="set-row">
          <div><p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>Thème</p><p style={{ fontSize: 12, color: 'var(--t4)' }}>Mode clair ou sombre</p></div>
          <button onClick={toggleTheme} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-b)', background: 'var(--surface2)', fontSize: 13, fontWeight: 600, color: 'var(--t1)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          </button>
        </div>
        <div className="set-row">
          <div><p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>Langue</p><p style={{ fontSize: 12, color: 'var(--t4)' }}>Interface et emails</p></div>
          <select value={lang} onChange={e => changeLang(e.target.value)} style={{ height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-b)', background: 'var(--bg1)', color: 'var(--t1)', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>

      {/* Notifications */}
      <div className="set-card">
        <div className="set-card-header"><p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Notifications</p></div>
        {NOTIF_DEFS.map(n => (
          <div key={n.id} className="set-row">
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{n.label}</p>
              <p style={{ fontSize: 12, color: 'var(--t4)' }}>{n.desc}</p>
            </div>
            <button className={`set-toggle${notifs[n.id] ? ' on' : ''}`} onClick={() => toggleNotif(n.id)} role="switch" aria-checked={notifs[n.id]} aria-label={n.label}>
              <span className="set-toggle-thumb" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
